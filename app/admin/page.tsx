import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { todayKST } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { admin } = await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const todayStart = new Date(`${todayKST()}T00:00:00+09:00`).toISOString();
  const count = { count: "exact" as const, head: true };

  const [users, groups, members, postsToday, msgsToday, openReports, openAlerts, p7, c7, m7] = await Promise.all([
    admin.from("profiles").select("id", count),
    admin.from("groups").select("id", count).eq("is_active", true),
    admin.from("group_members").select("group_id", count).is("left_at", null),
    admin.from("posts").select("id", count).gte("created_at", todayStart),
    admin.from("messages").select("id", count).gte("created_at", todayStart),
    admin.from("reports").select("id", count).eq("status", "open"),
    admin.from("safety_alerts").select("id", count).is("handled_at", null),
    admin.from("posts").select("author_id").gte("created_at", weekAgo).limit(5000),
    admin.from("comments").select("author_id").gte("created_at", weekAgo).limit(5000),
    admin.from("messages").select("sender_id").gte("created_at", weekAgo).limit(5000),
  ]);
  const active7 = new Set([
    ...(p7.data ?? []).map((r) => r.author_id),
    ...(c7.data ?? []).map((r) => r.author_id),
    ...(m7.data ?? []).map((r) => r.sender_id),
  ].filter(Boolean)).size;
  const avg = groups.count ? ((members.count ?? 0) / groups.count).toFixed(1) : "0";

  const tiles = [
    { label: "가입자", value: users.count ?? 0 },
    { label: "7일 활성 사용자", value: active7, hint: "글·댓글·메시지 작성 기준" },
    { label: "활성 그룹 / 평균 인원", value: `${groups.count ?? 0} / ${avg}` },
    { label: "오늘 글 · 메시지", value: `${postsToday.count ?? 0} · ${msgsToday.count ?? 0}` },
    { label: "미처리 신고", value: openReports.count ?? 0, href: "/admin/reports" },
    { label: "미확인 위기 알림", value: openAlerts.count ?? 0, href: "/admin/alerts", urgent: (openAlerts.count ?? 0) > 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((t) => {
        const inner = (
          <>
            <p className="text-xs text-ink-soft">{t.label}</p>
            <p className={`mt-1 text-2xl font-bold ${t.urgent ? "text-danger" : ""}`}>{t.value}</p>
            {t.hint && <p className="mt-1 text-[11px] text-ink-soft">{t.hint}</p>}
          </>
        );
        return t.href ? (
          <Link key={t.label} href={t.href} className="card p-4">{inner}</Link>
        ) : (
          <div key={t.label} className="card p-4">{inner}</div>
        );
      })}
    </div>
  );
}
