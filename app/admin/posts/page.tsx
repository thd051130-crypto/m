import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { CATEGORIES, labelOf } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { setHidden } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ q?: string; hidden?: string }> }) {
  const { q, hidden } = await searchParams;
  const { admin } = await requireAdmin();
  let query = admin
    .from("posts")
    .select("id, author_id, category, body, is_hidden, safety_flag, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) query = query.ilike("body", `%${q.replace(/[%_]/g, "")}%`);
  if (hidden) query = query.eq("is_hidden", true);
  const { data: posts } = await query;

  return (
    <div className="flex flex-col gap-3">
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="본문 검색" className="input h-10 py-2" />
        <button className="btn-primary h-10 px-4 text-sm">검색</button>
      </form>
      <div className="flex gap-2 text-sm">
        <Link href="/admin/posts" className={`chip ${!hidden ? "chip-on" : ""}`}>전체</Link>
        <Link href="/admin/posts?hidden=1" className={`chip ${hidden ? "chip-on" : ""}`}>숨김만</Link>
      </div>
      {(posts ?? []).map((p) => (
        <div key={p.id} className={`card ${p.is_hidden ? "opacity-60" : ""}`}>
          <p className="mb-2 text-xs text-ink-soft">
            {labelOf(CATEGORIES, p.category)} · {timeAgo(p.created_at)} {p.safety_flag && "· 🛟 위기 표시"} {p.is_hidden && "· 숨김"}
          </p>
          <p className="mb-3 line-clamp-4 whitespace-pre-wrap text-sm">{p.body}</p>
          <form action={setHidden.bind(null, "post", p.id, !p.is_hidden)}>
            <button className="btn-soft h-9 px-3 text-sm">{p.is_hidden ? "복구" : "숨기기"}</button>
          </form>
        </div>
      ))}
    </div>
  );
}
