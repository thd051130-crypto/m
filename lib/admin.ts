import "server-only";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** profiles.role='admin'만 통과. 아니면 404. 모든 관리자 화면·액션에서 호출한다. */
export async function requireAdmin() {
  const { supabase, user } = await getUser();
  if (!user) notFound();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") notFound();
  return { admin: createAdminClient(), adminId: user.id };
}

export async function logAction(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  detail: Record<string, unknown> = {},
) {
  await admin.from("admin_actions").insert({ admin_id: adminId, action, target_type: targetType, target_id: targetId, detail });
}

/** ab***@gmail.com */
export function maskEmail(email: string | undefined | null) {
  if (!email) return "-";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain ?? ""}`;
}

export type TargetInfo = { body: string; authorId: string | null; nickname: string | null; hidden?: boolean; link?: string };

export async function loadTarget(admin: ReturnType<typeof createAdminClient>, type: string, id: string): Promise<TargetInfo | null> {
  const table = type === "post" ? "posts" : type === "comment" ? "comments" : type === "message" ? "messages" : null;
  if (type === "user") {
    const { data } = await admin.from("profiles").select("id, nickname").eq("id", id).maybeSingle();
    return data ? { body: `사용자: ${data.nickname ?? "-"}`, authorId: data.id, nickname: data.nickname } : null;
  }
  if (!table) return null;
  const authorCol = type === "message" ? "sender_id" : "author_id";
  const extra = type === "comment" ? ", post_id" : type === "message" ? ", group_id" : "";
  const { data } = await admin.from(table).select(`id, body, is_hidden, ${authorCol}${extra}`).eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as unknown as Record<string, string | boolean | null>;
  const authorId = (row[authorCol] as string | null) ?? null;
  const { data: p } = authorId ? await admin.from("profiles").select("nickname").eq("id", authorId).maybeSingle() : { data: null };
  return {
    body: String(row.body),
    authorId,
    nickname: p?.nickname ?? null,
    hidden: !!row.is_hidden,
    link: type === "post" ? `/stories/${id}` : type === "comment" ? `/stories/${row.post_id}` : undefined,
  };
}

export const TARGET_TABLE: Record<string, string> = { post: "posts", comment: "comments", message: "messages" };
