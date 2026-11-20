import Link from "next/link";
import { Sparkles, Users } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { getMyProfile, withAuthors } from "@/lib/data";
import { todayKST } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";

export default async function HomePage() {
  const { supabase, user } = await getUser();
  const profile = await getMyProfile(supabase, user!.id);

  // 오늘의 질문: 오늘 날짜 질문, 없으면 전체 목록에서 날짜 기준 순환
  let { data: question } = await supabase.from("daily_questions").select("id, text").eq("date", todayKST()).maybeSingle();
  if (!question) {
    const { data: all } = await supabase.from("daily_questions").select("id, text").order("date");
    if (all?.length) question = all[Math.floor(Date.now() / 86_400_000) % all.length];
  }

  // 최근 공감받은 이야기 3개: 최근 반응이 달린 글 순
  const { data: recent } = await supabase
    .from("reactions")
    .select("target_id")
    .eq("target_type", "post")
    .order("created_at", { ascending: false })
    .limit(30);
  const ids = Array.from(new Set((recent ?? []).map((r) => r.target_id)));
  const { data: postRows } = ids.length
    ? await supabase.from("posts").select("id, author_id, category, body, created_at").in("id", ids)
    : { data: [] };
  const ordered = ids.map((id) => postRows?.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p).slice(0, 3);
  const posts = await withAuthors(supabase, ordered);

  return (
    <main className="px-4">
      <header className="flex h-14 items-center justify-between">
        <span className="text-lg font-bold">마음이음</span>
        <Link href="/me" aria-label="마이">
          <Avatar avatarKey={profile?.avatar_key} size={34} />
        </Link>
      </header>

      <h1 className="mb-4 mt-2 text-xl font-bold">
        {profile?.nickname}님, <br />오늘은 어떤 하루였나요?
      </h1>

      {question && (
        <section className="card fade-in mb-6 bg-point/25">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-point-strong">
            <Sparkles size={16} strokeWidth={1.75} /> 오늘의 질문
          </p>
          <p className="mb-4 text-lg font-semibold">{question.text}</p>
          <Link href={`/stories/new?q=${question.id}`} className="btn-primary h-10 px-4 text-sm">
            답하기
          </Link>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-3 font-bold">최근 공감받은 이야기</h2>
        {posts.length ? (
          <div className="flex flex-col gap-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <p className="card text-sm text-ink-soft">아직 공감받은 이야기가 없어요. 이야기 탭에서 먼저 마음을 나눠 보세요.</p>
        )}
      </section>

      <section className="mb-6 grid gap-3">
        <SoonCard title="참여 중인 그룹" />
        <SoonCard title="새로운 그룹 추천" />
      </section>
    </main>
  );
}

function SoonCard({ title }: { title: string }) {
  return (
    <div className="card flex items-center gap-3">
      <Users size={22} strokeWidth={1.75} className="text-point-strong" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-ink-soft">곧 만나요. 비슷한 마음의 소그룹을 준비하고 있어요.</p>
      </div>
    </div>
  );
}
