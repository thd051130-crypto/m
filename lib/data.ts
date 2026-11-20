import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactionKind } from "./constants";
import type { PublicProfile, ReactionSummary } from "./types";

/** author_id 목록으로 닉네임·아바타만 가져온다 (public_profiles 뷰) */
export async function fetchProfiles(supabase: SupabaseClient, ids: (string | null)[]) {
  const unique = Array.from(new Set(ids.filter((v): v is string => !!v)));
  const map = new Map<string, PublicProfile>();
  if (unique.length === 0) return map;
  const { data } = await supabase.from("public_profiles").select("id, nickname, avatar_key").in("id", unique);
  for (const p of data ?? []) map.set(p.id, p);
  return map;
}

export async function withAuthors<T extends { author_id: string | null }>(supabase: SupabaseClient, rows: T[]) {
  const map = await fetchProfiles(supabase, rows.map((r) => r.author_id));
  return rows.map((r) => ({ ...r, author: r.author_id ? map.get(r.author_id) ?? null : null }));
}

export async function reactionSummaries(
  supabase: SupabaseClient,
  targetType: "post" | "comment",
  ids: string[],
  userId: string,
) {
  const result = new Map<string, ReactionSummary>();
  for (const id of ids) result.set(id, { counts: { empathy: 0, cheer: 0, strength: 0 }, mine: [] });
  if (ids.length === 0) return result;
  const { data } = await supabase
    .from("reactions")
    .select("target_id, user_id, kind")
    .eq("target_type", targetType)
    .in("target_id", ids);
  for (const r of data ?? []) {
    const s = result.get(r.target_id);
    if (!s) continue;
    const kind = r.kind as ReactionKind;
    s.counts[kind] = (s.counts[kind] ?? 0) + 1;
    if (r.user_id === userId) s.mine.push(kind);
  }
  return result;
}

export async function getMyProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_key, role, status")
    .eq("id", userId)
    .maybeSingle();
  return data as { id: string; nickname: string | null; avatar_key: string | null; role: string; status: string } | null;
}
