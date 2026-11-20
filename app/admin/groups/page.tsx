import { requireAdmin } from "@/lib/admin";
import { ACTIVE_TIMES, CHAT_STYLES } from "@/lib/constants";
import { saveGroup, setGroupActive } from "../actions";

export const dynamic = "force-dynamic";

type G = {
  id: string; name: string; description: string; notice: string | null; interests: string[];
  chat_style: string; active_times: string[]; max_members: number; is_active: boolean;
};

export default async function AdminGroupsPage() {
  const { admin } = await requireAdmin();
  const [{ data: groups }, { data: members }] = await Promise.all([
    admin.from("groups").select("id, name, description, notice, interests, chat_style, active_times, max_members, is_active").order("created_at"),
    admin.from("group_members").select("group_id").is("left_at", null),
  ]);
  const counts = new Map<string, number>();
  for (const m of members ?? []) counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-4">
      <details className="card">
        <summary className="cursor-pointer font-semibold">+ 새 그룹 만들기</summary>
        <GroupForm />
      </details>
      {((groups ?? []) as G[]).map((g) => (
        <details key={g.id} className={`card ${g.is_active ? "" : "opacity-60"}`}>
          <summary className="cursor-pointer">
            <span className="font-semibold">{g.name}</span>
            <span className="ml-2 text-xs text-ink-soft">
              {counts.get(g.id) ?? 0}/{g.max_members} {g.is_active ? "" : "· 비활성"}
            </span>
          </summary>
          <GroupForm g={g} />
          <form action={setGroupActive.bind(null, g.id, !g.is_active)} className="mt-2">
            <button className="btn-ghost h-9 px-3 text-sm">{g.is_active ? "비활성화" : "다시 활성화"}</button>
          </form>
        </details>
      ))}
    </div>
  );
}

function GroupForm({ g }: { g?: G }) {
  return (
    <form action={saveGroup} className="mt-3 flex flex-col gap-3 text-sm">
      {g && <input type="hidden" name="id" value={g.id} />}
      <input name="name" defaultValue={g?.name} placeholder="그룹 이름" required minLength={2} maxLength={30} className="input" />
      <textarea name="description" defaultValue={g?.description} placeholder="소개" rows={2} className="input resize-none" />
      <textarea name="notice" defaultValue={g?.notice ?? ""} placeholder="공지 (바꾸면 멤버에게 알림)" rows={2} className="input resize-none" />
      <input name="interests" defaultValue={g?.interests.join(",")} placeholder="관심사 키 (쉼표): reading,walk" className="input" />
      <div className="flex gap-2">
        <select name="chat_style" defaultValue={g?.chat_style ?? "light"} className="input">
          {CHAT_STYLES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <input name="max_members" type="number" min={2} max={8} defaultValue={g?.max_members ?? 8} className="input w-24" />
      </div>
      <div className="flex flex-wrap gap-3">
        {ACTIVE_TIMES.map((t) => (
          <label key={t.key} className="flex items-center gap-1">
            <input type="checkbox" name="active_times" value={t.key} defaultChecked={g?.active_times.includes(t.key)} /> {t.label}
          </label>
        ))}
      </div>
      <button className="btn-primary h-10 text-sm">{g ? "저장" : "만들기"}</button>
    </form>
  );
}
