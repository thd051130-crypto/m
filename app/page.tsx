import Link from "next/link";
import { HeartHandshake } from "lucide-react";

export default function StartPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 pb-10 pt-24">
      <div className="fade-in flex flex-1 flex-col items-center text-center">
        <span className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-point/40">
          <HeartHandshake size={40} strokeWidth={1.75} className="text-point-strong" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">마음이음</h1>
        <p className="mt-8 text-xl font-semibold">오늘도 혼자라고 느꼈나요?</p>
        <p className="mt-2 text-ink-soft">당신과 비슷한 마음을 가진 사람들을 만나보세요.</p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/signup" className="btn-primary">
          시작하기
        </Link>
        <Link href="/login" className="btn-soft">
          로그인
        </Link>
        <Link href="/privacy" className="mt-4 text-center text-sm text-ink-soft underline underline-offset-4">
          마음이음은 이메일·실명을 다른 사람에게 보여주지 않아요
        </Link>
      </div>
    </main>
  );
}
