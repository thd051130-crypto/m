import { Users } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { loadGroupsOverview } from "@/lib/groups";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { GroupCard } from "@/components/GroupCard";
import { JoinGroupButton } from "@/components/JoinGroupButton";
import { QueueCard } from "@/components/QueueCard";

export default async function GroupsPage() {
  const { supabase, user } = await getUser();
  const { myGroups, recommendations, showQueue, queued } = await loadGroupsOverview(supabase, user!.id);

  return (
    <main>
      <PageHeader title="그룹" />
      <div className="flex flex-col gap-8 px-4">
        <section>
          <h2 className="mb-1 font-bold">나에게 맞는 그룹</h2>
          <p className="mb-3 text-sm text-ink-soft">관심사·대화 스타일·활동 시간을 보고 골랐어요. 참여는 직접 선택해요.</p>
          <div className="flex flex-col gap-3">
            {recommendations.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                reason={g.reason}
                action={<JoinGroupButton groupId={g.id} groupName={g.name} />}
              />
            ))}
            {recommendations.length === 0 && (
              <EmptyState Icon={Users} title="지금 참여할 수 있는 그룹이 없어요" />
            )}
            {(showQueue || queued) && <QueueCard queued={queued} />}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-bold">참여 중인 그룹</h2>
          <div className="flex flex-col gap-3">
            {myGroups.length ? (
              myGroups.map((g) => <GroupCard key={g.id} group={g} href={`/groups/${g.id}`} />)
            ) : (
              <p className="card text-sm text-ink-soft">아직 참여한 그룹이 없어요. 마음에 드는 그룹에 먼저 인사해 보세요.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
