import { AVATARS } from "@/lib/constants";

export function Avatar({ avatarKey, size = 40 }: { avatarKey: string | null | undefined; size?: number }) {
  const a = AVATARS.find((x) => x.key === avatarKey);
  return (
    <span
      aria-label={a?.label ?? "탈퇴한 사용자"}
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: a?.bg ?? "#E5DED3", fontSize: size * 0.55 }}
    >
      {a?.emoji ?? "·"}
    </span>
  );
}
