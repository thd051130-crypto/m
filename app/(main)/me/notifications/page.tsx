import { getUser } from "@/lib/supabase/server";
import { saveNotificationSettings } from "@/app/(main)/notifications/actions";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/SubmitButton";

const TYPES = [
  { key: "comment", label: "내 글에 댓글" },
  { key: "reaction", label: "내 글에 공감" },
  { key: "group_message", label: "그룹 새 메시지" },
  { key: "group_notice", label: "그룹 공지" },
] as const;

export default async function NotificationSettingsPage() {
  const { supabase, user } = await getUser();
  const { data } = await supabase.from("notification_settings").select("*").eq("user_id", user!.id).maybeSingle();
  const s = data ?? { comment: true, reaction: true, group_message: true, group_notice: true, dnd_start: 23, dnd_end: 8 };
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return (
    <main>
      <PageHeader title="알림 설정" back="/me" />
      <form action={saveNotificationSettings} className="flex flex-col gap-4 px-4">
        <ul className="card p-0">
          {TYPES.map((t) => (
            <li key={t.key} className="border-b border-beige last:border-0">
              <label className="flex items-center justify-between px-5 py-4">
                <span>{t.label}</span>
                <input type="checkbox" name={t.key} defaultChecked={!!s[t.key]} className="h-5 w-5 accent-[#7FA37A]" />
              </label>
            </li>
          ))}
        </ul>
        <div className="card">
          <p className="mb-1 font-semibold">방해 금지 시간</p>
          <p className="mb-3 text-sm text-ink-soft">이 시간에는 푸시 알림을 보내지 않아요 (알림 탭에는 쌓여요).</p>
          <div className="flex items-center gap-2">
            <select name="dnd_start" defaultValue={s.dnd_start} className="input">
              {hours.map((h) => <option key={h} value={h}>{h}시</option>)}
            </select>
            <span>~</span>
            <select name="dnd_end" defaultValue={s.dnd_end} className="input">
              {hours.map((h) => <option key={h} value={h}>{h}시</option>)}
            </select>
          </div>
        </div>
        <SubmitButton>저장하기</SubmitButton>
      </form>
    </main>
  );
}
