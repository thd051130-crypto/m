import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiEnabled, complete } from "@/lib/ai/openai";
import { hasCrisisKeyword } from "@/lib/safety/keywords";

const DAILY_LIMIT = 20;
const UUID = /^[0-9a-f-]{36}$/i;

/** 응원 문구 3개 제안. 자동 전송 없음: 사용자가 고쳐서 직접 보낸다. */
export async function POST(req: NextRequest) {
  if (!aiEnabled()) return NextResponse.json({ error: "지금은 문구 추천을 쓸 수 없어요." }, { status: 503 });
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { context } = (await req.json().catch(() => ({}))) as { context?: string };
  const [kind, id] = String(context ?? "").split(":");
  if (!["post", "group"].includes(kind) || !UUID.test(id ?? ""))
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  // 맥락은 사용자 권한(RLS)으로 읽는다: 볼 수 없는 글·그룹이면 비어 있음
  let source = "";
  let crisis = false;
  if (kind === "post") {
    const { data } = await supabase.from("posts").select("body, safety_flag").eq("id", id).maybeSingle();
    if (!data) return NextResponse.json({ error: "글을 찾을 수 없어요." }, { status: 404 });
    source = data.body;
    crisis = data.safety_flag || hasCrisisKeyword(data.body);
  } else {
    const { data } = await supabase
      .from("messages")
      .select("body")
      .eq("group_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8);
    if (!data) return NextResponse.json({ error: "그룹을 찾을 수 없어요." }, { status: 404 });
    source = data.reverse().map((m) => `- ${m.body}`).join("\n");
    crisis = hasCrisisKeyword(source);
  }
  if (crisis)
    return NextResponse.json({
      crisis: true,
      suggestions: [],
      note: "이 대화에는 문구 추천을 쓰지 않아요. 짧더라도 진심 어린 한마디면 충분해요.",
    });

  try {
    const used = await createAdminClient().rpc("bump_ai_usage", { p_user: user.id, p_kind: "suggest" });
    if ((used.data as number) > DAILY_LIMIT)
      return NextResponse.json({ error: `문구 추천은 하루 ${DAILY_LIMIT}번까지 쓸 수 있어요.` }, { status: 429 });
  } catch {
    return NextResponse.json({ error: "지금은 문구 추천을 쓸 수 없어요." }, { status: 503 });
  }

  const prompt = `${kind === "post" ? "다음 글" : "다음 그룹 대화"}에 남길 따뜻한 한마디를 3개 제안해 줘.
- 각 40자 이내, 존댓말, 조언·진단 없이 공감과 응원 위주
- JSON 배열로만 답해. 예: ["...", "...", "..."]

${source.slice(0, 1500)}`;
  const out = await complete(prompt, 200);
  const suggestions = parseList(out);
  if (!suggestions.length) return NextResponse.json({ error: "추천을 만들지 못했어요. 다시 눌러 주세요." }, { status: 502 });
  return NextResponse.json({ suggestions });
}

function parseList(text: string | null): string[] {
  if (!text) return [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : text);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string").slice(0, 3) : [];
  } catch {
    return text.split("\n").map((l) => l.replace(/^[-\d.\s"]+|"$/g, "").trim()).filter(Boolean).slice(0, 3);
  }
}
