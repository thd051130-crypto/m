"use client";
import { useActionState, useState } from "react";
import { saveProfile, type FormState } from "@/app/onboarding/actions";
import { AVATARS } from "@/lib/constants";
import { Avatar } from "./Avatar";
import { SubmitButton } from "./SubmitButton";

export function ProfileForm({
  next,
  initial,
}: {
  next: string;
  initial?: { nickname: string | null; avatar_key: string | null };
}) {
  const [state, action] = useActionState<FormState, FormData>(saveProfile, {});
  const [avatar, setAvatar] = useState(initial?.avatar_key ?? "");
  return (
    <form action={action} className="flex flex-col gap-6 px-4 pb-10">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="avatar" value={avatar} />
      <div>
        <label className="label" htmlFor="nickname">닉네임</label>
        <input
          id="nickname"
          name="nickname"
          className="input"
          minLength={2}
          maxLength={12}
          required
          defaultValue={initial?.nickname ?? ""}
          placeholder="2~12자"
        />
        <p className="mt-1 text-xs text-ink-soft">실명·이메일·전화번호는 넣지 말아 주세요.</p>
      </div>
      <div>
        <p className="label">아바타</p>
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a.key}
              onClick={() => setAvatar(a.key)}
              aria-pressed={avatar === a.key}
              aria-label={a.label}
              className={`flex items-center justify-center rounded-[20px] border-2 p-2 transition-colors duration-150 ${
                avatar === a.key ? "border-point-strong bg-point/20" : "border-transparent bg-card"
              }`}
            >
              <Avatar avatarKey={a.key} size={56} />
            </button>
          ))}
        </div>
      </div>
      {state.error && <p className="error">{state.error}</p>}
      <SubmitButton>{next === "/me" ? "저장하기" : "다음"}</SubmitButton>
    </form>
  );
}
