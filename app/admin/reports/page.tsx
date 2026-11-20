import { loadTarget, maskEmail, requireAdmin } from "@/lib/admin";
import { REPORT_REASONS, labelOf } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { liftSuspension, resolveReport } from "../actions";

export const dynamic = "force-dynamic";

const ACTIONS = [
  { key: "hide", label: "숨기기" },
  { key: "dismiss", label: "기각" },
  { key: "suspend_1d", label: "제한 1일" },
  { key: "suspend_7d", label: "제한 7일" },
  { key: "suspend_forever", label: "영구 제한" },
] as const;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const { admin } = await requireAdmin();
  let q = admin
    .from("reports")
    .select("id, target_type, target_id, reason, detail, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!all) q = q.eq("status", "open");
  const { data: reports } = await q;
  const rows = reports ?? [];
  const targets = await Promise.all(rows.map((r) => loadTarget(admin, r.target_type, r.target_id)));
  const authorIds = Array.from(new Set(targets.map((t) => t?.authorId).filter((v): v is string => !!v)));
  const [{ data: profiles }, emails] = await Promise.all([
    authorIds.length ? admin.from("profiles").select("id, status, suspended_until").in("id", authorIds) : Promise.resolve({ data: [] }),
    Promise.all(authorIds.map(async (id) => [id, (await admin.auth.admin.getUserById(id)).data.user?.email] as const)),
  ]);
  const statusOf = new Map((profiles ?? []).map((p) => [p.id, p]));
  const emailOf = new Map(emails);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 text-sm">
        <a href="/admin/reports" className={`chip ${!all ? "chip-on" : ""}`}>미처리</a>
        <a href="/admin/reports?all=1" className={`chip ${all ? "chip-on" : ""}`}>전체</a>
      </div>
      {rows.length === 0 && <p className="card text-sm">신고가 없어요.</p>}
      {rows.map((r, i) => {
        const t = targets[i];
        const st = t?.authorId ? statusOf.get(t.authorId) : null;
        return (
          <div key={r.id} className="card">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-beige px-2 py-0.5 font-semibold">{labelOf(REPORT_REASONS, r.reason)}</span>
              <span className="text-ink-soft">{r.target_type} · {timeAgo(r.created_at)} · {r.status}</span>
            </div>
            <p className="mb-1 text-xs text-ink-soft">
              작성자: {t?.nickname ?? "탈퇴한 사용자"} ({maskEmail(t?.authorId ? emailOf.get(t.authorId) : null)})
              {st?.status === "suspended" && (
                <> · <b className="text-danger">제한 중{st.suspended_until ? ` ~${new Date(st.suspended_until).toLocaleDateString("ko-KR")}` : " (영구)"}</b></>
              )}
              {t?.hidden && " · 숨김 처리됨"}
            </p>
            <p className="mb-2 whitespace-pre-wrap rounded-[14px] bg-ivory p-3 text-sm">{t?.body ?? "(삭제된 내용)"}</p>
            {r.detail && <p className="mb-2 text-xs text-ink-soft">신고 내용: {r.detail}</p>}
            {r.status === "open" && (
              <div className="flex flex-wrap gap-2">
                {ACTIONS.filter((a) => !(a.key === "hide" && r.target_type === "user")).map((a) => (
                  <form key={a.key} action={resolveReport.bind(null, r.id, a.key)}>
                    <button className={`h-9 px-3 text-sm ${a.key.startsWith("suspend") ? "btn bg-danger/90 text-white" : "btn-soft"}`}>
                      {a.label}
                    </button>
                  </form>
                ))}
              </div>
            )}
            {st?.status === "suspended" && t?.authorId && (
              <form action={liftSuspension.bind(null, t.authorId)} className="mt-2">
                <button className="btn-ghost h-8 px-2 text-xs">제한 해제</button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
