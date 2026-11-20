import { getUser } from "@/lib/supabase/server";
import { CATEGORIES, keysOf } from "@/lib/constants";
import { PageHeader } from "@/components/PageHeader";
import { NewPostForm } from "./NewPostForm";

export default async function NewStoryPage({ searchParams }: { searchParams: Promise<{ c?: string; q?: string }> }) {
  const { c, q } = await searchParams;
  let prompt: string | null = null;
  if (q) {
    // 오늘의 질문에서 넘어온 경우 질문 문구를 채워준다
    const { supabase } = await getUser();
    const { data } = await supabase.from("daily_questions").select("text").eq("id", Number(q)).maybeSingle();
    prompt = data?.text ?? null;
  }
  const category = c && keysOf(CATEGORIES).has(c) ? c : prompt ? "daily" : "";
  return (
    <main>
      <PageHeader title="이야기 쓰기" back="/stories" />
      <NewPostForm defaultCategory={category} prompt={prompt} />
    </main>
  );
}
