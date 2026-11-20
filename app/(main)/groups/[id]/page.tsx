import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { fetchProfiles } from "@/lib/data";
import { ChatRoom, type AiMessage, type ChatMessage } from "@/components/ChatRoom";
import { aiEnabled } from "@/lib/ai/openai";
import { CHAT_PAGE } from "@/lib/constants";



export default async function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user } = await getUser();

  const { data: isMember } = await supabase.rpc("is_group_member", { p_group: id });
  if (!isMember) redirect("/groups");

  const [{ data: group }, { data: members }, { data: rows }] = await Promise.all([
    supabase.from("groups").select("id, name, description, notice, max_members").eq("id", id).maybeSingle(),
    supabase.from("group_members").select("user_id, role, joined_at").eq("group_id", id).is("left_at", null),
    supabase
      .from("messages")
      .select("id, group_id, sender_id, body, deleted_at, created_at")
      .eq("group_id", id)
      .order("created_at", { ascending: false })
      .limit(CHAT_PAGE),
  ]);
  if (!group) notFound();

  const messages = ((rows ?? []) as ChatMessage[]).reverse();
  const profileMap = await fetchProfiles(supabase, [
    ...(members ?? []).map((m) => m.user_id),
    ...messages.map((m) => m.sender_id),
  ]);
  const { data: ai } = await supabase
    .from("ai_messages")
    .select("id, group_id, kind, body, created_at")
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  const { data: reactions } = messages.length
    ? await supabase.from("message_reactions").select("message_id, user_id, kind").in("message_id", messages.map((m) => m.id))
    : { data: [] };

  return (
    <ChatRoom
      group={group}
      me={user!.id}
      members={(members ?? []).map((m) => ({ ...m, profile: profileMap.get(m.user_id) ?? null }))}
      initialMessages={messages}
      initialProfiles={Object.fromEntries(profileMap)}
      initialReactions={reactions ?? []}
      initialAi={((ai ?? []) as AiMessage[]).reverse()}
      aiOn={aiEnabled()}
      pageSize={CHAT_PAGE}
    />
  );
}
