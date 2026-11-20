import type { ReactionKind } from "./constants";

export type PublicProfile = { id: string; nickname: string | null; avatar_key: string | null };

export type PostRow = {
  id: string;
  author_id: string | null;
  category: string;
  body: string;
  created_at: string;
};

export type CommentRow = {
  id: string;
  post_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export type ReactionSummary = {
  counts: Record<ReactionKind, number>;
  mine: ReactionKind[];
};

export type PostWithAuthor = PostRow & { author: PublicProfile | null; commentCount?: number };
