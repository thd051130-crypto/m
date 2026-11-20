import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata = { robots: { index: false } };

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/alerts", label: "위기 알림" },
  { href: "/admin/reports", label: "신고" },
  { href: "/admin/posts", label: "게시글" },
  { href: "/admin/groups", label: "그룹" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="pb-10">
      <header className="sticky top-0 z-10 bg-ivory/95 px-4 pt-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold">마음이음 관리자</h1>
          <Link href="/home" className="text-sm text-ink-soft">앱으로</Link>
        </div>
        <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="chip shrink-0">{n.label}</Link>
          ))}
        </nav>
      </header>
      <div className="px-4">{children}</div>
    </div>
  );
}
