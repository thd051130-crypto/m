import Link from "next/link";
import { loadTarget, requireAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/format";
import { handleAlert } from "../actions";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const { admin } = await requireAdmin();
  const { data: alerts } = await admin
    .from("safety_alerts")
    .select("id, user_id, target_type, target_id, level, handled_at, created_at")
    .order("handled_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (alerts ?? []).sort((a, b) =>
    (a.handled_at ? 1 : 0) - (b.handled_at ? 1 : 0) || (a.level === "urgent" ? -1 : 1) - (b.level === "urgent" ? -1 : 1),
  );
  const targets = await Promise.all(rows.map((r) => loadTarget(admin, r.target_type, r.target_id)));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">위기 표현이 감지된 글이에요. 작성자에게는 109 안내가 이미 표시됐어요.</p>
      {rows.length === 0 && <p className="card text-sm">위기 알림이 없어요.</p>}
      {rows.map((a, i) => (
        <div key={a.id} className={`card ${a.handled_at ? "opacity-60" : ""}`}>
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${a.level === "urgent" ? "bg-danger text-white" : "bg-beige"}`}>
              {a.level === "urgent" ? "긴급" : "주의"}
            </span>
            <span className="text-ink-soft">{a.target_type} · {timeAgo(a.created_at)} · {targets[i]?.nickname ?? "탈퇴한 사용자"}</span>
          </div>
          <p className="mb-3 whitespace-pre-wrap text-sm">{targets[i]?.body ?? "(삭제된 내용)"}</p>
          <div className="flex items-center gap-2">
            {targets[i]?.link && <Link href={targets[i]!.link!} className="btn-soft h-9 px-3 text-sm">원문 보기</Link>}
            {a.handled_at ? (
              <span className="text-xs text-ink-soft">확인 완료 · {timeAgo(a.handled_at)}</span>
            ) : (
              <form action={handleAlert.bind(null, a.id)}>
                <button className="btn-primary h-9 px-3 text-sm">확인 처리</button>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
