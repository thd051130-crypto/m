import { Bookmark } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { withAuthors } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

export default async function SavedPage() {
  const { supabase, user } = await getUser();
  const { data: saved } = await supabase
    .from("saved_posts")
    .select("post_id, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const ids = (saved ?? []).map((s) => s.post_id);
  const { data: rows } = ids.length
    ? await supabase.from("posts").select("id, author_id, category, body, created_at").in("id", ids)
    : { data: [] };
  const ordered = ids.map((id) => rows?.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => !!r);
  const posts = await withAuthors(supabase, ordered);
  return (
    <main>
      <PageHeader title="저장한 글" back="/me" />
      <div className="flex flex-col gap-3 px-4">
        {posts.length ? posts.map((p) => <PostCard key={p.id} post={p} />) : <EmptyState Icon={Bookmark} title="저장한 글이 없어요" />}
      </div>
    </main>
  );
}
