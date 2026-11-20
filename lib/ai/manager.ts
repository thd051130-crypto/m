import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHAT_STYLES, INTERESTS, labelOf } from "@/lib/constants";
import { aiEnabled, complete } from "./openai";

const DAILY_AI_LIMIT = 4; // 그룹당 AI 메시지 하루 4개
const DAILY_NUDGE_LIMIT = 2; // 대화 이어주기 하루 2회
const QUIET_HOURS = 6;

type Group = { id: string; name: string; interests: string[]; chat_style: string };
type Kind = "topic" | "nudge" | "activity";

function kstDayStartISO() {
  const kst = new Date(Date.now() + 9 * 3600_000);
  kst.setUTCHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 3600_000).toISOString();
}

async function context() {
  const admin = createAdminClient();
  const since = kstDayStartISO();
  const [{ data: groups }, { data: todays }, { data: alerts }] = await Promise.all([
    admin.from("groups").select("id, name, interests, chat_style").eq("is_active", true),
    admin.from("ai_messages").select("group_id, kind").gte("created_at", since),
    admin
      .from("safety_alerts")
      .select("target_id")
      .eq("target_type", "message")
      .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString()),
  ]);
  // 최근 24시간 위기 알림이 있었던 그룹에는 일반 대화 주제를 보내지 않는다
  const alertIds = (alerts ?? []).map((a) => a.target_id);
  const { data: alertMsgs } = alertIds.length
    ? await admin.from("messages").select("group_id").in("id", alertIds)
    : { data: [] as { group_id: string }[] };
  const paused = new Set((alertMsgs ?? []).map((m) => m.group_id));
  const counts = new Map<string, { total: number; nudge: number }>();
  for (const m of todays ?? []) {
    const c = counts.get(m.group_id) ?? { total: 0, nudge: 0 };
    c.total++;
    if (m.kind === "nudge") c.nudge++;
    counts.set(m.group_id, c);
  }
  return { admin, groups: (groups ?? []) as Group[], paused, counts };
}

function describe(g: Group) {
  const interests = g.interests.map((i) => labelOf(INTERESTS, i)).join(", ") || "자유 주제";
  return `그룹 이름: ${g.name}\n관심사: ${interests}\n대화 스타일: ${labelOf(CHAT_STYLES, g.chat_style)}`;
}

async function post(admin: ReturnType<typeof createAdminClient>, groupId: string, kind: Kind, body: string) {
  await admin.from("ai_messages").insert({ group_id: groupId, kind, body: body.slice(0, 300) });
}

export async function runDailyTopics() {
  if (!aiEnabled()) return { skipped: "ai_disabled" };
  const { admin, groups, paused, counts } = await context();
  let sent = 0;
  for (const g of groups) {
    if (paused.has(g.id) || (counts.get(g.id)?.total ?? 0) >= DAILY_AI_LIMIT) continue;
    const text = await complete(
      `${describe(g)}\n\n이 그룹에 오늘 아침 던질 가벼운 대화 주제 질문 1개를 한 문장으로 써 줘. 누구나 쉽게 답할 수 있게. 따옴표 없이.`,
      120,
    );
    if (text) {
      await post(admin, g.id, "topic", text);
      sent++;
    }
  }
  return { sent };
}

export async function runNudges() {
  if (!aiEnabled()) return { skipped: "ai_disabled" };
  const { admin, groups, paused, counts } = await context();
  const quietSince = new Date(Date.now() - QUIET_HOURS * 3600_000).toISOString();
  let sent = 0;
  for (const g of groups) {
    const c = counts.get(g.id) ?? { total: 0, nudge: 0 };
    if (paused.has(g.id) || c.total >= DAILY_AI_LIMIT || c.nudge >= DAILY_NUDGE_LIMIT) continue;
    const [{ data: lastMsg }, { data: lastAi }] = await Promise.all([
      admin.from("messages").select("created_at").eq("group_id", g.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("ai_messages").select("created_at").eq("group_id", g.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const last = [lastMsg?.created_at, lastAi?.created_at].filter(Boolean).sort().pop();
    if (!lastMsg || (last && last > quietSince)) continue; // 대화가 한 번도 없던 그룹은 아침 주제로 시작
    const text = await complete(
      `${describe(g)}\n\n이 그룹이 ${QUIET_HOURS}시간 넘게 조용해. 부담 없이 대화를 다시 열 가벼운 질문 1개를 한 문장으로. 따옴표 없이.`,
      120,
    );
    if (text) {
      await post(admin, g.id, "nudge", text);
      sent++;
    }
  }
  return { sent };
}

export async function runWeeklyActivities() {
  if (!aiEnabled()) return { skipped: "ai_disabled" };
  const { admin, groups, paused, counts } = await context();
  let sent = 0;
  for (const g of groups) {
    if (paused.has(g.id) || (counts.get(g.id)?.total ?? 0) >= DAILY_AI_LIMIT) continue;
    const text = await complete(
      `${describe(g)}\n\n이번 주 멤버들이 각자 해보고 채팅방에 공유할 수 있는 작은 공동 활동 1개를 제안해 줘. 예: "이번 주 각자 찍은 하늘 사진 공유하기". 두 문장 이내.`,
      150,
    );
    if (text) {
      await post(admin, g.id, "activity", text);
      sent++;
    }
  }
  return { sent };
}
