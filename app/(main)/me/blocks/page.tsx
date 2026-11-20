import { Ban } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { fetchProfiles } from "@/lib/data";
import { unblockUser } from "@/app/(main)/stories/actions";
import { DELETED_USER } from "@/lib/constants";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default async function BlocksPage() {
  const { supabase, user } = await getUser();
  const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user!.id);
  const ids = (data ?? []).map((b) => b.blocked_id);
  const profiles = await fetchProfiles(supabase, ids);
  return (
    <main>
      <PageHeader title="차단 목록" back="/me" />
      <div className="px-4">
        {ids.length === 0 ? (
          <EmptyState Icon={Ban} title="차단한 사용자가 없어요" />
        ) : (
          <ul className="card p-0">
            {ids.map((id) => {
              const p = profiles.get(id);
              return (
                <li key={id} className="flex items-center gap-3 border-b border-beige px-5 py-3 last:border-0">
                  <Avatar avatarKey={p?.avatar_key} size={32} />
                  <span className="flex-1">{p?.nickname ?? DELETED_USER}</span>
                  <form action={unblockUser.bind(null, id)}>
                    <button className="btn-soft h-9 px-3 text-sm">해제</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
