import "server-only";

/** OPENAI_API_KEY가 없으면 AI 기능은 꺼진다 (나머지는 정상 작동). */
export function aiEnabled() {
  return !!process.env.OPENAI_API_KEY;
}

const MODEL = () => process.env.OPENAI_MODEL || "gpt-4o-mini";

export const AI_SYSTEM_PROMPT = `너는 익명 소그룹 커뮤니티 "마음이음"의 진행자 "마음이음 도우미"야.
- 사람을 대신해 대화하지 않는다. 사람끼리 대화를 시작하도록 돕는 가벼운 질문·제안만 한다.
- 진단·치료·의학적 조언을 하지 않는다. 사용자의 감정을 단정하거나 이름 붙이지 않는다.
- 개인정보(실명, 연락처, 사는 곳)를 묻지 않는다.
- 따뜻하고 짧은 한국어 존댓말. 이모지는 최대 1개.`;

export type ModerationResult = {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
};

export async function moderate(text: string): Promise<ModerationResult | null> {
  if (!aiEnabled()) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const r = json.results?.[0];
    if (!r) return null;
    return { flagged: r.flagged, categories: r.categories, scores: r.category_scores };
  } catch {
    return null; // 실패하면 키워드 검사만으로 진행
  }
}

/** 짧은 텍스트 생성. 실패하면 null. */
export async function complete(prompt: string, maxTokens = 300): Promise<string | null> {
  if (!aiEnabled()) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL(),
        max_tokens: maxTokens,
        temperature: 0.8,
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.choices?.[0]?.message?.content as string | undefined)?.trim() ?? null;
  } catch {
    return null;
  }
}
