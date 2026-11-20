const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(01[016789]|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}|\d{9,}/;

export function validateNickname(raw: string): string | null {
  const nickname = raw.trim();
  if (nickname.length < 2 || nickname.length > 12) return "닉네임은 2~12자로 정해 주세요.";
  if (EMAIL_RE.test(nickname) || nickname.includes("@")) return "닉네임에 이메일을 넣을 수 없어요.";
  if (PHONE_RE.test(nickname.replace(/\s/g, ""))) return "닉네임에 전화번호를 넣을 수 없어요.";
  if (/^\d+$/.test(nickname)) return "숫자로만 된 닉네임은 쓸 수 없어요.";
  if (nickname === "탈퇴한 사용자" || nickname.includes("관리자") || nickname.includes("마음이음"))
    return "사용할 수 없는 닉네임이에요.";
  return null;
}

/** 허용 목록에 있는 값만 남긴다 (폼 조작 방지) */
export function pick(values: FormDataEntryValue[], allowed: Set<string>) {
  return Array.from(new Set(values.map(String).filter((v) => allowed.has(v))));
}
