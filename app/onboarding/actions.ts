"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { ACTIVE_TIMES, AVATARS, CHAT_STYLES, INTERESTS, MAX_INTERESTS, MOODS, keysOf } from "@/lib/constants";
import { pick, validateNickname } from "@/lib/validation";

export type FormState = { error?: string };

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const nickname = String(form.get("nickname") ?? "").trim();
  const avatar = String(form.get("avatar") ?? "");
  const next = String(form.get("next") ?? "/onboarding/mood");

  const invalid = validateNickname(nickname);
  if (invalid) return { error: invalid };
  if (!keysOf(AVATARS).has(avatar)) return { error: "아바타를 하나 골라 주세요." };

  const { data: taken } = await supabase.rpc("is_nickname_taken", { p_nickname: nickname });
  if (taken) return { error: "이미 누군가 쓰고 있는 닉네임이에요." };

  const { error } = await supabase.from("profiles").update({ nickname, avatar_key: avatar }).eq("id", user.id);
  if (error) {
    if (error.code === "23505") return { error: "이미 누군가 쓰고 있는 닉네임이에요." };
    return { error: "저장하지 못했어요. 다시 시도해 주세요." };
  }
  revalidatePath("/", "layout");
  redirect(next === "/me" ? "/me" : "/onboarding/mood");
}

export async function saveMood(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  const moods = pick(form.getAll("moods"), keysOf(MOODS));
  const chat_styles = pick(form.getAll("chat_styles"), keysOf(CHAT_STYLES));
  const interests = pick(form.getAll("interests"), keysOf(INTERESTS));
  const active_times = pick(form.getAll("active_times"), keysOf(ACTIVE_TIMES));
  const next = String(form.get("next") ?? "/home");

  if (moods.length === 0) return { error: "지금 마음을 하나 이상 골라 주세요." };
  if (interests.length > MAX_INTERESTS) return { error: `관심사는 최대 ${MAX_INTERESTS}개까지 고를 수 있어요.` };

  const { error } = await supabase.from("mood_preferences").upsert({
    user_id: user.id,
    moods,
    chat_styles,
    interests,
    active_times,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "저장하지 못했어요. 다시 시도해 주세요." };
  revalidatePath("/", "layout");
  redirect(next === "/me" ? "/me" : "/home");
}
