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

  return (
    <>
      <div className="pb-[calc(64px+env(safe-area-inset-bottom)+16px)]">{children}</div>
      <HelpFab />
      <TabBar />
    </>
  );
}
