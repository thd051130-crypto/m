import { getUser } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { MoodForm } from "@/components/MoodForm";

export default async function MeMoodPage() {
  const { supabase, user } = await getUser();
  const { data } = await supabase
    .from("mood_preferences")
    .select("moods, chat_styles, interests, active_times")
    .eq("user_id", user!.id)
    .maybeSingle();
  return (
    <main>
      <PageHeader title="마음 상태 수정" back="/me" />
      <MoodForm next="/me" initial={data} />
    </main>
  );
}
