import { PageHeader } from "@/components/PageHeader";

export default function PrivacyPage() {
  return (
    <main className="pb-10">
      <PageHeader title="개인정보 처리방침" back="/" />
      <article className="card mx-4 space-y-4 text-sm leading-7">
        <p className="rounded-[14px] bg-beige px-3 py-2 text-xs font-semibold">샘플 문서 · 출시 전 정식 문서로 교체 필요</p>
        <section>
          <h2 className="font-bold">수집하는 정보</h2>
          <p>이메일(로그인용), 닉네임, 아바타, 마음 상태·대화 스타일·관심사·활동 시간, 작성한 글·댓글, 동의 시각.</p>
        </section>
        <section>
          <h2 className="font-bold">다른 사용자에게 보이는 정보</h2>
          <p>닉네임과 아바타만 보여요. 이메일·마음 상태 원문은 다른 사용자에게 절대 공개되지 않아요.</p>
        </section>
        <section>
          <h2 className="font-bold">마음 상태 정보의 쓰임</h2>
          <p>진단이 아니라, 비슷한 사람과 그룹을 찾는 데만 써요.</p>
        </section>
        <section>
          <h2 className="font-bold">탈퇴 시</h2>
          <p>계정과 마음 상태 정보는 즉시 삭제되고, 남아 있는 글·댓글은 작성자가 &quot;탈퇴한 사용자&quot;로 바뀌어요.</p>
        </section>
      </article>
    </main>
  );
}
