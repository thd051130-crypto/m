import { Bell } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function NotificationsPage() {
  return (
    <main>
      <PageHeader title="알림" />
      <div className="px-4">
        <EmptyState Icon={Bell} title="아직 알림이 없어요" body="댓글·공감 알림은 곧 준비돼요." />
      </div>
    </main>
  );
}
