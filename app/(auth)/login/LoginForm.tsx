"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <main className="pb-10">
      <PageHeader title="로그인" back="/" />
      <form action={action} className="flex flex-col gap-5 px-4">
        <input type="hidden" name="next" value={next} />
        {linkError && <p className="error">인증 링크가 만료됐어요. 다시 로그인해 주세요.</p>}
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        {state.error && <p className="error">{state.error}</p>}
        <SubmitButton>로그인</SubmitButton>
        <p className="text-center text-sm text-ink-soft">
          처음이신가요? <Link href="/signup" className="font-semibold text-point-strong">시작하기</Link>
        </p>
      </form>
    </main>
  );
}
