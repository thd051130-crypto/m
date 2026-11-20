import "server-only";
import { ACTIVE_TIMES, CHAT_STYLES, INTERESTS, labelOf } from "./constants";
import { eulReul } from "./format";

export type MoodPrefs = { moods: string[]; chat_styles: string[]; interests: string[]; active_times: string[] };

export type GroupCandidate = {
  id: string;
  name: string;
  description: string;
  topics: string[];
  interests: string[];
  chat_style: string;
  active_times: string[];
  max_members: number;
  notice: string | null;
  member_count: number;
  is_member: boolean;
  has_block_conflict: boolean;
};

export type Recommendation = GroupCandidate & { score: number; reason: string; commonInterests: string[] };

const W = { interest: 3, style: 2, time: 2, topic: 1 } as const;

/**
 * 규칙 기반 그룹 추천. 추천 방식을 바꿀 때는 이 함수만 교체하면 된다.
 * 마음 상태 원문(moods)은 점수에만 쓰고 추천 이유 문구에는 절대 넣지 않는다.
 */
export function recommendGroups(prefs: MoodPrefs, groups: GroupCandidate[], limit = 5): Recommendation[] {
  return groups
    .filter((g) => !g.is_member && g.member_count < g.max_members && !g.has_block_conflict)
    .map((g) => {
      const commonInterests = g.interests.filter((i) => prefs.interests.includes(i));
      const styleMatch = prefs.chat_styles.includes(g.chat_style) ? 1 : 0;
      const commonTimes = g.active_times.filter((t) => prefs.active_times.includes(t));
      const topicMatch = g.topics.filter((t) => prefs.moods.includes(t)).length;
      const score =
        commonInterests.length * W.interest + styleMatch * W.style + commonTimes.length * W.time + topicMatch * W.topic;
      return { ...g, score, commonInterests, reason: buildReason(commonInterests, styleMatch ? g.chat_style : null, commonTimes) };
    })
    .sort((a, b) => b.score - a.score || a.member_count - b.member_count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** 점수가 이 값 이상이어야 "잘 맞는 그룹"으로 본다 */
export const GOOD_MATCH_SCORE = 4;

function buildReason(interests: string[], style: string | null, times: string[]) {
  const parts: string[] = [];
  if (interests.length) parts.push(`${eulReul(interests.slice(0, 2).map((i) => labelOf(INTERESTS, i)).join("·"))} 좋아하는`);
  if (times.length) parts.push(`${labelOf(ACTIVE_TIMES, times[0])}형`);
  const subject = parts.length ? `${parts.join(" ")} 그룹이에요` : "새로운 사람들과 가볍게 시작하기 좋은 그룹이에요";
  return style ? `${subject}. ${eulReul(labelOf(CHAT_STYLES, style))} 좋아해요.` : `${subject}.`;
}
