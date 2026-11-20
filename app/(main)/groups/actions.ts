"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { REACTIONS, keysOf } from "@/lib/constants";

async function requireUser() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

const UUID = /^[0-9a-f-]{36}$/i;

export async function joinGroup(groupId: string): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  if (!UUID.test(groupId)) return { error: "잘못된 요청이에요." };
  const { data, error } = await supabase.rpc("join_group", { p_group: groupId });
  if (error) return { error: "참여하지 못했어요. 다시 시도해 주세요." };
  if (data === "full") return { error: "정원이 찼어요. 다른 그룹을 둘러봐 주세요." };
  if (data === "not_allowed") return { error: "지금은 그룹에 참여할 수 없는 상태예요." };
  if (data === "not_found") return { error: "없어진 그룹이에요." };
  revalidatePath("/groups");
  revalidatePath("/home");
  redirect(`/groups/${groupId}`);
}

export async function leaveGroup(groupId: string) {
  const { supabase } = await requireUser();
  await supabase.rpc("leave_group", { p_group: groupId });
  revalidatePath("/groups");
  revalidatePath("/home");
  redirect("/groups");
}

export async function joinQueue(): Promise<{ error?: string; info?: string }> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("join_match_queue");
  if (error) return { error: "대기열에 등록하지 못했어요." };
  const res = data as { status: string; group_id?: string; waiting?: number };
  if (res.status === "grouped" && res.group_id) {
    revalidatePath("/groups");
    redirect(`/groups/${res.group_id}`);
  }
  if (res.status !== "queued") return { error: "지금은 대기열에 등록할 수 없어요." };
  revalidatePath("/groups");
  return { info: `대기열에 등록했어요. 지금 ${res.waiting}명이 기다리고 있어요.` };
}

export async function leaveQueue() {
  const { supabase, user } = await requireUser();
  await supabase.from("match_queue").delete().eq("user_id", user.id);
  revalidatePath("/groups");
}

export async function sendMessage(groupId: string, body: string): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const text = body.trim();
  if (!text) return { error: "내용을 적어 주세요." };
  if (text.length > 1000) return { error: "1000자까지 보낼 수 있어요." };
  const { error } = await supabase.from("messages").insert({ group_id: groupId, body: text });
  if (error) {
    if (error.message.includes("rate_limited")) return { error: "조금 천천히 보내 주세요. 10초에 5개까지 보낼 수 있어요." };
    if (error.code === "42501") return { error: "이 그룹에 메시지를 보낼 수 없어요." };
    return { error: "보내지 못했어요. 다시 시도해 주세요." };
  }
  return {};
}

export async function deleteMessage(messageId: string) {
  const { supabase } = await requireUser();
  await supabase.rpc("delete_message", { p_message: messageId });
}

export async function toggleMessageReaction(messageId: string, kind: string) {
  const { supabase, user } = await requireUser();
  if (!keysOf(REACTIONS).has(kind)) return;
  const { data } = await supabase
    .from("message_reactions")
    .select("kind")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("kind", kind)
    .maybeSingle();
  if (data)
    await supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", user.id).eq("kind", kind);
  else await supabase.from("message_reactions").insert({ message_id: messageId, user_id: user.id, kind });
}
