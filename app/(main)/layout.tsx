import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/data";
import { TabBar } from "@/components/TabBar";
import { HelpFab } from "@/components/HelpFab";

// 로그인 + 온보딩(닉네임, 마음 상태)을 마친 사용자만 들어온다.
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const profile = await getMyProfile(supabase, user.id);
  if (!profile?.nickname || !profile.avatar_key) redirect("/onboarding/profile");
  const { data: mood } = await supabase.from("mood_preferences").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!mood) redirect("/onboarding/mood");
  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  const { data: limit } = await supabase.from("profiles").select("status, suspended_until").eq("id", user.id).maybeSingle();
  const suspended =
    limit?.status === "suspended" && (!limit.suspended_until || new Date(limit.suspended_until) > new Date());

  return (
    <>
      {suspended && (
        <p className="bg-[#f6e4df] px-4 py-2 text-center text-sm text-danger">
          이용이 제한된 상태예요{limit?.suspended_until ? ` (${new Date(limit.suspended_until).toLocaleDateString("ko-KR")}까지)` : ""}. 읽기만 할 수 있어요.
        </p>
      )}
      <div className="pb-[calc(64px+env(safe-area-inset-bottom)+16px)]">{children}</div>
      <HelpFab />
      <TabBar unread={unread ?? 0} />
    </>
  );
}
