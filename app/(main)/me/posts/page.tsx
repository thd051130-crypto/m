import { FileText } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { withAuthors } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

export default async function MyPostsPage() {
  const { supabase, user } = await getUser();
  const { data } = await supabase
    .from("posts")
    .select("id, author_id, category, body, created_at")
    .eq("author_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const posts = await withAuthors(supabase, data ?? []);
  return (
    <main>
      <PageHeader title="내가 쓴 이야기" back="/me" />
      <div className="flex flex-col gap-3 px-4">
        {posts.length ? posts.map((p) => <PostCard key={p.id} post={p} />) : <EmptyState Icon={FileText} title="아직 쓴 이야기가 없어요" />}
      </div>
    </main>
  );
}
