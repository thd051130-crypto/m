"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PAGE_SIZE } from "@/lib/constants";
import type { PostWithAuthor, PublicProfile } from "@/lib/types";
import { PostCard } from "./PostCard";
import { EmptyState } from "./EmptyState";

/** 최신순, 20개씩 무한 스크롤. 숨김·차단 필터링은 RLS가 한다. */
export function StoryFeed({ category, initial }: { category: string | null; initial: PostWithAuthor[] }) {
  const [posts, setPosts] = useState(initial);
  const [done, setDone] = useState(initial.length < PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosts(initial);
    setDone(initial.length < PAGE_SIZE);
  }, [initial]);

  const loadMore = useCallback(async () => {
    if (loading || done || posts.length === 0) return;
    setLoading(true);
    const supabase = createClient();
    const last = posts[posts.length - 1];
    let q = supabase
      .from("posts")
      .select("id, author_id, category, body, created_at")
      .lt("created_at", last.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (category) q = q.eq("category", category);
    const { data } = await q;
    const rows = data ?? [];
    const ids = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean))) as string[];
    const { data: profiles } = ids.length
      ? await supabase.from("public_profiles").select("id, nickname, avatar_key").in("id", ids)
      : { data: [] as PublicProfile[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    setPosts((prev) => [...prev, ...rows.map((r) => ({ ...r, author: r.author_id ? map.get(r.author_id) ?? null : null }))]);
    if (rows.length < PAGE_SIZE) setDone(true);
    setLoading(false);
  }, [category, done, loading, posts]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  if (posts.length === 0)
    return <EmptyState Icon={BookOpen} title="아직 이야기가 없어요" body="첫 번째 이야기를 남겨 주세요." />;

  return (
    <div className="flex flex-col gap-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      <div ref={sentinel} className="h-8 text-center text-sm text-ink-soft">
        {loading ? "불러오는 중…" : done ? "" : ""}
      </div>
    </div>
  );
}
