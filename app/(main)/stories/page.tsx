import Link from "next/link";
import { PenLine } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { withAuthors } from "@/lib/data";
import { CATEGORIES, PAGE_SIZE, keysOf } from "@/lib/constants";
import { PageHeader } from "@/components/PageHeader";
import { StoryFeed } from "@/components/StoryFeed";

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const category = c && keysOf(CATEGORIES).has(c) ? c : null;
  const { supabase } = await getUser();
  let q = supabase
    .from("posts")
    .select("id, author_id, category, body, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (category) q = q.eq("category", category);
  const { data } = await q;
  const posts = await withAuthors(supabase, data ?? []);

  const tabs = [{ key: null as string | null, label: "전체" }, ...CATEGORIES];
  return (
    <main>
      <PageHeader
        title="이야기"
        right={
          <Link href={`/stories/new${category ? `?c=${category}` : ""}`} className="btn-primary h-9 px-3 text-sm">
            <PenLine size={16} strokeWidth={1.75} /> 글쓰기
          </Link>
        }
      />
      <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {tabs.map((t) => (
          <Link
            key={t.key ?? "all"}
            href={t.key ? `/stories?c=${t.key}` : "/stories"}
            className={`chip shrink-0 ${category === t.key ? "chip-on" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="px-4">
        <StoryFeed key={category ?? "all"} category={category} initial={posts} />
      </div>
    </main>
  );
}
