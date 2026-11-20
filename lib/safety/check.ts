import "server-only";
import { moderate } from "@/lib/ai/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAbuseKeyword, hasContactInfo, hasCrisisKeyword } from "./keywords";

export type SafetyVerdict =
  | { action: "block"; reason: "abuse" | "contact"; message: string }
  | { action: "allow"; crisis: boolean; flag: { categories: Record<string, unknown>; score: number } | null };

const BLOCK_SCORE = 0.85;
const FLAG_SCORE = 0.4;
const ABUSE_CATS = ["harassment", "harassment/threatening", "hate", "hate/threatening", "sexual/minors"];
const SELF_HARM_CATS = ["self-harm", "self-harm/intent", "self-harm/instructions"];

/** 저장 전에 서버에서 검사한다. 위기 표현은 막지 않는다 (말할 곳을 빼앗지 않기). */
export async function checkText(text: string): Promise<SafetyVerdict> {
  if (hasContactInfo(text))
    return { action: "block", reason: "contact", message: "개인 연락처는 공유할 수 없어요." };

  const crisisByKeyword = hasCrisisKeyword(text);
  if (!crisisByKeyword && hasAbuseKeyword(text))
    return { action: "block", reason: "abuse", message: "표현을 조금 바꿔볼까요? 서로 편하게 이야기할 수 있게요." };

  const m = await moderate(text);
  let crisis = crisisByKeyword;
  let flag: { categories: Record<string, unknown>; score: number } | null = null;
  if (m) {
    const selfHarm = Math.max(...SELF_HARM_CATS.map((c) => m.scores[c] ?? 0));
    if (selfHarm >= 0.5 || SELF_HARM_CATS.some((c) => m.categories[c])) crisis = true;
    const abuse = Math.max(...ABUSE_CATS.map((c) => m.scores[c] ?? 0));
    if (!crisis && abuse >= BLOCK_SCORE)
      return { action: "block", reason: "abuse", message: "표현을 조금 바꿔볼까요? 서로 편하게 이야기할 수 있게요." };
    const top = Math.max(...Object.values(m.scores));
    if (m.flagged || top >= FLAG_SCORE) flag = { categories: m.categories, score: top };
  }
  return { action: "allow", crisis, flag };
}

type Target = { type: "post" | "comment" | "message"; id: string; userId: string };

/** 저장 후 기록: 애매한 글은 moderation_flags, 위기 표현은 safety_alerts + 관리자 알림 */
export async function recordSafety(verdict: SafetyVerdict, target: Target) {
  if (verdict.action !== "allow" || (!verdict.crisis && !verdict.flag)) return;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    console.warn("[safety] SUPABASE_SERVICE_ROLE_KEY가 없어 안전 기록을 남기지 못했어요.");
    return;
  }
  if (verdict.flag) {
    await admin.from("moderation_flags").insert({
      target_type: target.type,
      target_id: target.id,
      categories: verdict.flag.categories,
      score: verdict.flag.score,
    });
  }
  if (verdict.crisis) {
    await admin.from("safety_alerts").insert({
      user_id: target.userId,
      target_type: target.type,
      target_id: target.id,
      level: "urgent",
    });
    if (target.type === "post") await admin.from("posts").update({ safety_flag: true }).eq("id", target.id);
    await notifyAdmins(target);
  }
}

async function notifyAdmins(target: Target) {
  const url = process.env.SAFETY_ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 본문은 보내지 않는다. 관리자 페이지에서 확인.
      body: JSON.stringify({
        text: `[마음이음] 위기 표현 감지 (${target.type}). 관리자 페이지 > 위기 알림에서 확인해 주세요.`,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    console.warn("[safety] 관리자 알림 웹훅 전송 실패");
  }
}
