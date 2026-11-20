/**
 * 위기(자해·자살) 표현 키워드. 공백을 지운 문장에서 부분 일치로 찾는다.
 * 운영하면서 계속 보강할 것. 놓치는 것보다 한 번 더 안내하는 쪽이 낫다.
 */
export const CRISIS_KEYWORDS = [
  "죽고싶", "죽고 싶", "죽을래", "죽어버리", "죽어야겠", "자살", "자해", "사라지고싶", "사라지고 싶",
  "없어지고싶", "없어지고 싶", "살기싫", "살기 싫", "살고싶지않", "그만살", "끝내고싶", "끝내고 싶",
  "목매", "투신", "뛰어내리", "손목긋", "손목을긋", "유서", "극단적선택", "극단적 선택", "세상을떠나고",
  "더는못버티", "더이상못버티", "다끝내", "수면제모아", "번개탄",
];

/** 명백한 욕설·비하 (저장 차단). 변형이 많으므로 대표형 위주. */
export const ABUSE_KEYWORDS = [
  "씨발", "시발", "ㅅㅂ", "ㅆㅂ", "씨바", "개새끼", "개새기", "개색기", "ㄱㅅㄲ", "병신", "ㅂㅅ", "븅신",
  "좆", "존나", "ㅈㄴ", "미친놈", "미친년", "닥쳐", "꺼져", "지랄", "ㅈㄹ", "애미", "느금마", "니애미",
  "한남충", "김치녀", "틀딱", "급식충", "장애인새끼", "죽어라", "뒤져라", "뒤지셈",
];

const normalize = (s: string) => s.replace(/[\s.·,_\-~!?]+/g, "").toLowerCase();

export function hasCrisisKeyword(text: string) {
  const n = normalize(text);
  return CRISIS_KEYWORDS.some((k) => n.includes(normalize(k)));
}

export function hasAbuseKeyword(text: string) {
  const n = normalize(text);
  return ABUSE_KEYWORDS.some((k) => n.includes(normalize(k)));
}

/** 전화번호·이메일·오픈채팅/메신저 링크 */
export function hasContactInfo(text: string) {
  const compact = text.replace(/[\s-]/g, "");
  if (/01[016789]\d{7,8}/.test(compact)) return true;
  if (/0\d{1,2}\d{7,8}/.test(compact) && /\d{3,4}[\s-]\d{4}/.test(text)) return true;
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text)) return true;
  if (/open\.kakao\.com|kakaotalk|t\.me\/|telegram|discord\.gg|line\.me|instagram\.com/i.test(text)) return true;
  if (/(카톡|카카오톡|텔레|텔레그램|인스타|디코|라인)\s*(아이디|id|ID|:)/.test(text)) return true;
  return false;
}
