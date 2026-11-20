import { getUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/components/ProfileForm";

export default async function MeProfilePage() {
  const { supabase, user } = await getUser();
  const profile = await getMyProfile(supabase, user!.id);
  return (
    <main>
      <PageHeader title="닉네임·아바타 변경" back="/me" />
      <ProfileForm next="/me" initial={profile ?? undefined} />
    </main>
  );
}
