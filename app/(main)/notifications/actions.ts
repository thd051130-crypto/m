"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";

export async function markAllRead() {
  const { supabase, user } = await getUser();
  if (!user) return;
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/", "layout");
}

export async function saveNotificationSettings(form: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const hour = (v: FormDataEntryValue | null, d: number) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 && n <= 23 ? n : d;
  };
  await supabase.from("notification_settings").upsert({
    user_id: user.id,
    comment: form.get("comment") === "on",
    reaction: form.get("reaction") === "on",
    group_message: form.get("group_message") === "on",
    group_notice: form.get("group_notice") === "on",
    dnd_start: hour(form.get("dnd_start"), 23),
    dnd_end: hour(form.get("dnd_end"), 8),
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/me/notifications");
  redirect("/me");
}
