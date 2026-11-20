import Link from "next/link";
import { CATEGORIES, DELETED_USER, labelOf } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { PostWithAuthor } from "@/lib/types";
import { Avatar } from "./Avatar";

export function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <Link href={`/stories/${post.id}`} className="card fade-in block transition-colors duration-150 hover:bg-[#fffdf9]">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <Avatar avatarKey={post.author?.avatar_key} size={28} />
        <span className="font-semibold">{post.author?.nickname ?? DELETED_USER}</span>
        <span className="text-ink-soft">· {timeAgo(post.created_at)}</span>
        <span className="ml-auto rounded-full bg-beige px-2.5 py-0.5 text-xs text-ink-soft">
          {labelOf(CATEGORIES, post.category)}
        </span>
      </div>
      <p className="line-clamp-4 whitespace-pre-wrap break-words">{post.body}</p>
    </Link>
  );
}
