"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/SubmitButton";

export default function SignupPage() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {});
  if (state.info)
    return (
      <main>
        <PageHeader title="메일을 확인해 주세요" back="/" />
        <div className="card mx-4 fade-in">
          <p>{state.info}</p>
          <p className="mt-3 text-sm text-ink-soft">메일이 안 보이면 스팸함도 확인해 주세요.</p>
        </div>
      </main>
    );
  return (
    <main className="pb-10">
      <PageHeader title="시작하기" back="/" />
      <form action={action} className="flex flex-col gap-5 px-4">
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          <p className="mt-1 text-xs text-ink-soft">로그인에만 쓰고, 다른 사람에게는 보이지 않아요.</p>
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="input" />
        </div>
        <fieldset className="card flex flex-col gap-3 text-sm">
          <Check name="adult">만 19세 이상이에요 (필수)</Check>
          <Check name="terms">
            <Link href="/terms" className="underline underline-offset-4">이용약관</Link>에 동의해요 (필수)
          </Check>
          <Check name="privacy">
            <Link href="/privacy" className="underline underline-offset-4">개인정보 처리방침</Link>에 동의해요 (필수)
          </Check>
        </fieldset>
        {state.error && <p className="error">{state.error}</p>}
        <SubmitButton>가입하기</SubmitButton>
        <p className="text-center text-sm text-ink-soft">
          이미 계정이 있나요? <Link href="/login" className="font-semibold text-point-strong">로그인</Link>
        </p>
      </form>
    </main>
  );
}

function Check({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3">
      <input type="checkbox" name={name} required className="h-5 w-5 accent-[#7FA37A]" />
      <span>{children}</span>
    </label>
  );
}
