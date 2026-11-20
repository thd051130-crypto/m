import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { reactionSummaries, withAuthors } from "@/lib/data";
import { CATEGORIES, DELETED_USER, labelOf } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { ReactionBar } from "@/components/ReactionBar";
import { ItemMenu } from "@/components/ItemMenu";
import { CommentForm } from "@/components/CommentForm";
import { SaveButton } from "@/components/SaveButton";
import { CrisisCard } from "@/components/CrisisCard";
import { aiEnabled } from "@/lib/ai/openai";
import { HelpBanner } from "@/components/HelpBanner";

export default async function StoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ help?: string }>;
}) {
  const { id } = await params;
  const { help } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user } = await getUser();
  if (!user) notFound();

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, category, body, created_at, safety_flag")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound(); // 숨김·차단·삭제된 글은 RLS로 안 보인다

  const { data: commentRows } = await supabase
    .from("comments")
    .select("id, post_id, author_id, body, created_at")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const [[postWithAuthor], comments, { data: saved }] = await Promise.all([
    withAuthors(supabase, [post]),
    withAuthors(supabase, commentRows ?? []),
    supabase.from("saved_posts").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
  ]);
  const [postReactions, commentReactions] = await Promise.all([
    reactionSummaries(supabase, "post", [id], user.id),
    reactionSummaries(supabase, "comment", comments.map((c) => c.id), user.id),
  ]);
  const path = `/stories/${id}`;

  return (
    <main>
      <PageHeader title={labelOf(CATEGORIES, post.category)} back="/stories" />
      {help === "1" && post.author_id === user.id && (
        <div className="mx-4 mb-4">
          <CrisisCard />
        </div>
      )}
      {post.safety_flag && <HelpBanner />}
      <article className="card mx-4">
        <div className="mb-4 flex items-center gap-3">
          <Avatar avatarKey={postWithAuthor.author?.avatar_key} size={40} />
          <div className="flex-1">
            <p className="font-semibold">{postWithAuthor.author?.nickname ?? DELETED_USER}</p>
            <p className="text-xs text-ink-soft">{timeAgo(post.created_at)}</p>
          </div>
          <SaveButton postId={id} saved={!!saved} />
          <ItemMenu kind="post" id={id} postId={id} authorId={post.author_id} isMine={post.author_id === user.id} />
        </div>
        <p className="whitespace-pre-wrap break-words leading-7">{post.body}</p>
        <div className="mt-5">
          <ReactionBar targetType="post" targetId={id} summary={postReactions.get(id)!} path={path} />
        </div>
      </article>

      <section className="mx-4 mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-soft">댓글 {comments.length}</h2>
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <Avatar avatarKey={c.author?.avatar_key} size={26} />
                <span className="font-semibold">{c.author?.nickname ?? DELETED_USER}</span>
                <span className="text-xs text-ink-soft">· {timeAgo(c.created_at)}</span>
                <span className="ml-auto">
                  <ItemMenu kind="comment" id={c.id} postId={id} authorId={c.author_id} isMine={c.author_id === user.id} />
                </span>
              </div>
              <p className="mb-3 whitespace-pre-wrap break-words text-[15px]">{c.body}</p>
              <ReactionBar targetType="comment" targetId={c.id} summary={commentReactions.get(c.id)!} path={path} compact />
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <CommentForm postId={id} aiOn={aiEnabled()} />
        </div>
      </section>
    </main>
  );
}
