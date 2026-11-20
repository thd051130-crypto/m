import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAbuseKeyword, hasContactInfo, hasCrisisKeyword } from "./keywords";

export type SafetyVerdict =
  | { action: "block"; reason: "abuse" | "contact"; message: string }
  | { action: "allow"; crisis: boolean };

/** 저장 전에 서버에서 키워드로 검사한다. 위기 표현은 막지 않는다 (말할 곳을 빼앗지 않기). */
export async function checkText(text: string): Promise<SafetyVerdict> {
  if (hasContactInfo(text))
    return { action: "block", reason: "contact", message: "개인 연락처는 공유할 수 없어요." };
  const crisis = hasCrisisKeyword(text);
  if (!crisis && hasAbuseKeyword(text))
    return { action: "block", reason: "abuse", message: "표현을 조금 바꿔볼까요? 서로 편하게 이야기할 수 있게요." };
  return { action: "allow", crisis };
}

type Target = { type: "post" | "comment" | "message"; id: string; userId: string };

/** 위기 표현이면 safety_alerts 기록 + 글에 109 배너 + 관리자 알림 */
export async function recordSafety(verdict: SafetyVerdict, target: Target) {
  if (verdict.action !== "allow" || !verdict.crisis) return;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    console.warn("[safety] SUPABASE_SERVICE_ROLE_KEY가 없어 안전 기록을 남기지 못했어요.");
    return;
  }
  await admin.from("safety_alerts").insert({
    user_id: target.userId,
    target_type: target.type,
    target_id: target.id,
    level: "urgent",
  });
  if (target.type === "post") await admin.from("posts").update({ safety_flag: true }).eq("id", target.id);
  await notifyAdmins(target);
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
