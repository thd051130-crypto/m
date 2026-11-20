import { Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function GroupsPage() {
  return (
    <main>
      <PageHeader title="그룹" />
      <div className="px-4">
        <EmptyState Icon={Users} title="곧 만나요" body="비슷한 마음의 5~8명 소그룹을 준비하고 있어요." />
      </div>
    </main>
  );
}
