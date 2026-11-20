import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GOOD_MATCH_SCORE, recommendGroups, type GroupCandidate, type MoodPrefs } from "./matching";

export async function loadGroupsOverview(supabase: SupabaseClient, userId: string) {
  const [{ data: candidates }, { data: prefs }, { data: queue }] = await Promise.all([
    supabase.rpc("group_candidates"),
    supabase.from("mood_preferences").select("moods, chat_styles, interests, active_times").eq("user_id", userId).maybeSingle(),
    supabase.from("match_queue").select("match_key, created_at").eq("user_id", userId).maybeSingle(),
  ]);
  const groups = (candidates ?? []) as GroupCandidate[];
  const myGroups = groups.filter((g) => g.is_member);
  const recommendations = prefs ? recommendGroups(prefs as MoodPrefs, groups) : [];
  const goodMatches = recommendations.filter((r) => r.score >= GOOD_MATCH_SCORE).length;
  return { myGroups, recommendations, showQueue: goodMatches < 3, queued: !!queue };
}
