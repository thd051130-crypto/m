import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { MoodForm } from "@/components/MoodForm";

export default async function OnboardingMood() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("mood_preferences")
    .select("moods, chat_styles, interests, active_times")
    .eq("user_id", user.id)
    .maybeSingle();
  return (
    <main className="pt-10">
      <div className="mb-6 px-4">
        <p className="text-sm text-ink-soft">2 / 2</p>
        <h1 className="text-2xl font-bold">요즘 마음을 알려주세요</h1>
      </div>
      <MoodForm next="/home" initial={data} />
    </main>
  );
}
