import { PageHeader } from "@/components/PageHeader";
import { CrisisCard } from "@/components/CrisisCard";

export default function HelpPage() {
  return (
    <main>
      <PageHeader title="도움이 필요할 때" back="/me" />
      <div className="flex flex-col gap-4 px-4">
        <CrisisCard />
        <div className="card text-sm leading-7 text-ink-soft">
          <p>마음이음은 상담·의료 서비스가 아니에요. 혼자 감당하기 어려운 순간에는 전문 상담사와 꼭 이야기해 주세요.</p>
          <p className="mt-2">주변 사람이 걱정된다면, 그 사람의 글을 신고하기 &gt; &quot;걱정되는 내용&quot;으로 알려 주세요. 운영자가 확인해요.</p>
        </div>
      </div>
    </main>
  );
}
