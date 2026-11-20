import Link from "next/link";
import { Bell, Heart, Megaphone, MessageCircle, MessagesSquare, Settings } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkRead } from "@/components/MarkRead";

export const dynamic = "force-dynamic";

type N = { id: string; type: string; ref_id: string | null; count: number; is_read: boolean; updated_at: string };

export default async function NotificationsPage() {
  const { supabase, user } = await getUser();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, ref_id, count, is_read, updated_at")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as N[];
  const groupIds = Array.from(new Set(rows.filter((r) => r.type.startsWith("group_") && r.ref_id).map((r) => r.ref_id!)));
  const { data: groups } = groupIds.length ? await supabase.from("groups").select("id, name").in("id", groupIds) : { data: [] };
  const groupName = new Map((groups ?? []).map((g) => [g.id, g.name]));

  const view = (n: N) => {
    const g = n.ref_id ? groupName.get(n.ref_id) ?? "그룹" : "그룹";
    switch (n.type) {
      case "comment":
        return { Icon: MessageCircle, text: "내 이야기에 새 댓글이 달렸어요", href: `/stories/${n.ref_id}` };
      case "reaction":
        return { Icon: Heart, text: `내 이야기에 마음이 ${n.count}개 도착했어요`, href: `/stories/${n.ref_id}` };
      case "group_message":
        return { Icon: MessagesSquare, text: `${g}에 새 메시지 ${n.count}개`, href: `/groups/${n.ref_id}` };
      case "group_notice":
        return { Icon: Megaphone, text: `${g}에 새 공지가 올라왔어요`, href: `/groups/${n.ref_id}` };
      default:
        return { Icon: Bell, text: "마음이음 알림", href: "/home" };
    }
  };

  return (
    <main>
      <PageHeader
        title="알림"
        right={
          <Link href="/me/notifications" aria-label="알림 설정" className="rounded-full p-2 text-ink-soft hover:bg-beige">
            <Settings size={20} strokeWidth={1.75} />
          </Link>
        }
      />
      <MarkRead hasUnread={rows.some((r) => !r.is_read)} />
      <div className="px-4">
        {rows.length === 0 ? (
          <EmptyState Icon={Bell} title="아직 알림이 없어요" body="내 글에 댓글·공감이 달리거나 그룹에 새 소식이 있으면 알려드릴게요." />
        ) : (
          <ul className="card p-0">
            {rows.map((n) => {
              const { Icon, text, href } = view(n);
              return (
                <li key={n.id} className="border-b border-beige last:border-0">
                  <Link href={href} className={`flex items-center gap-3 px-5 py-4 ${n.is_read ? "" : "bg-point/15"}`}>
                    <Icon size={20} strokeWidth={1.75} className="shrink-0 text-point-strong" />
                    <span className={`flex-1 text-sm ${n.is_read ? "" : "font-semibold"}`}>{text}</span>
                    <span className="shrink-0 text-xs text-ink-soft">{timeAgo(n.updated_at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
