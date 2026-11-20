import { PageHeader } from "@/components/PageHeader";

export default function TermsPage() {
  return (
    <main className="pb-10">
      <PageHeader title="이용약관" back="/" />
      <article className="card mx-4 space-y-4 text-sm leading-7">
        <p className="rounded-[14px] bg-beige px-3 py-2 text-xs font-semibold">샘플 문서 · 출시 전 정식 문서로 교체 필요</p>
        <p>마음이음은 만 19세 이상 성인을 위한 익명 소셜 커뮤니티입니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>서로를 존중해 주세요. 욕설·괴롭힘·혐오 표현은 제한될 수 있어요.</li>
          <li>전화번호·이메일·외부 메신저 아이디 등 개인 연락처를 공유하지 마세요.</li>
          <li>마음이음은 의료·상담 서비스가 아니며, 진단이나 치료를 제공하지 않아요.</li>
        </ul>
      </article>
    </main>
  );
}
