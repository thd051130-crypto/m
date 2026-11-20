import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/data";
import { ProfileForm } from "@/components/ProfileForm";

export default async function OnboardingProfile() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const profile = await getMyProfile(supabase, user.id);
  return (
    <main className="pt-10">
      <div className="mb-6 px-4">
        <p className="text-sm text-ink-soft">1 / 2</p>
        <h1 className="text-2xl font-bold">어떻게 불러드릴까요?</h1>
      </div>
      <ProfileForm next="/onboarding/mood" initial={profile ?? undefined} />
    </main>
  );
}
