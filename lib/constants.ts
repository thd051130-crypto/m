export const AVATARS = [
  { key: "cat", emoji: "🐱", bg: "#F3E3D3", label: "고양이" },
  { key: "dog", emoji: "🐶", bg: "#EFE6D8", label: "강아지" },
  { key: "rabbit", emoji: "🐰", bg: "#F6E7EA", label: "토끼" },
  { key: "bear", emoji: "🐻", bg: "#EADBC8", label: "곰" },
  { key: "fox", emoji: "🦊", bg: "#F5DFCB", label: "여우" },
  { key: "panda", emoji: "🐼", bg: "#E9EDE6", label: "판다" },
  { key: "hedgehog", emoji: "🦔", bg: "#EDE3D6", label: "고슴도치" },
  { key: "otter", emoji: "🦦", bg: "#E4E9E1", label: "수달" },
  { key: "sprout", emoji: "🌱", bg: "#DFEADB", label: "새싹" },
  { key: "sunflower", emoji: "🌻", bg: "#F6EDCF", label: "해바라기" },
  { key: "tulip", emoji: "🌷", bg: "#F5E1E4", label: "튤립" },
  { key: "clover", emoji: "🍀", bg: "#DDE8D8", label: "클로버" },
] as const;

export type AvatarKey = (typeof AVATARS)[number]["key"];

export const MOODS = [
  { key: "lonely", label: "조금 외로워요" },
  { key: "want_talk", label: "누군가와 이야기하고 싶어요" },
  { key: "tired", label: "요즘 많이 지쳐 있어요" },
  { key: "relationship", label: "인간관계가 어려워요" },
  { key: "new_friends", label: "새로운 친구를 만나고 싶어요" },
  { key: "energy", label: "일상에 활력을 얻고 싶어요" },
  { key: "just_chat", label: "특별한 고민은 없지만 소통하고 싶어요" },
] as const;

export const CHAT_STYLES = [
  { key: "light", label: "가볍고 편안한 대화" },
  { key: "deep", label: "진지하게 나누기" },
  { key: "cheer", label: "서로 응원하기" },
  { key: "interest", label: "공통 관심사 중심" },
] as const;

export const INTERESTS = [
  { key: "exercise", label: "운동" },
  { key: "reading", label: "독서" },
  { key: "movie", label: "영화·드라마" },
  { key: "music", label: "음악" },
  { key: "game", label: "게임" },
  { key: "cooking", label: "요리" },
  { key: "travel", label: "여행" },
  { key: "pet", label: "반려동물" },
  { key: "growth", label: "자기계발" },
  { key: "career", label: "취업·진로" },
  { key: "walk", label: "산책" },
  { key: "art", label: "그림·창작" },
] as const;

export const MAX_INTERESTS = 5;

export const ACTIVE_TIMES = [
  { key: "morning", label: "아침" },
  { key: "lunch", label: "점심" },
  { key: "evening", label: "저녁" },
  { key: "night", label: "심야" },
] as const;

export const CATEGORIES = [
  { key: "daily", label: "오늘의 일상" },
  { key: "heart", label: "마음 이야기" },
  { key: "relationship", label: "인간관계" },
  { key: "lonely", label: "외로움" },
  { key: "newstart", label: "새로운 시작" },
  { key: "free", label: "자유로운 이야기" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const REACTIONS = [
  { key: "empathy", label: "공감해요" },
  { key: "cheer", label: "응원해요" },
  { key: "strength", label: "힘내요" },
] as const;

export type ReactionKind = (typeof REACTIONS)[number]["key"];

export const REPORT_REASONS = [
  { key: "abuse", label: "욕설·괴롭힘" },
  { key: "hate", label: "혐오·차별 표현" },
  { key: "spam", label: "광고·도배" },
  { key: "contact", label: "개인 연락처 공유" },
  { key: "sexual", label: "성적인 내용" },
  { key: "self_harm", label: "걱정되는 내용 (자해 등)" },
  { key: "other", label: "기타" },
] as const;

export const POST_MIN = 10;
export const POST_MAX = 2000;
export const COMMENT_MAX = 1000;
export const PAGE_SIZE = 20;

export const DELETED_USER = "탈퇴한 사용자";

export function labelOf<T extends { key: string; label: string }>(list: readonly T[], key: string) {
  return list.find((i) => i.key === key)?.label ?? key;
}

export function keysOf<T extends { key: string }>(list: readonly T[]) {
  return new Set(list.map((i) => i.key));
}
export const CHAT_PAGE = 50;
