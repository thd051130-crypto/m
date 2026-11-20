"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { checkText, recordSafety } from "@/lib/safety/check";
import { CATEGORIES, COMMENT_MAX, POST_MAX, POST_MIN, REACTIONS, REPORT_REASONS, keysOf } from "@/lib/constants";

export type ActionState = { error?: string; ok?: boolean; crisis?: boolean };

async function requireUser() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function writeError(code?: string) {
  // RLS 위반(42501) = 이용 제한 등으로 쓰기 불가
  if (code === "42501") return "지금은 글을 쓸 수 없는 상태예요.";
  return "저장하지 못했어요. 다시 시도해 주세요.";
}

export async function createPost(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const category = String(form.get("category") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!keysOf(CATEGORIES).has(category)) return { error: "카테고리를 골라 주세요." };
  if (body.length < POST_MIN) return { error: `${POST_MIN}자 이상 적어 주세요.` };
  if (body.length > POST_MAX) return { error: `${POST_MAX}자까지 쓸 수 있어요.` };

  const verdict = await checkText(body);
  if (verdict.action === "block") return { error: verdict.message };

  // author_id는 보내지 않는다. DB 트리거가 auth.uid()로 채운다.
  const { data, error } = await supabase.from("posts").insert({ category, body }).select("id").single();
  if (error) return { error: writeError(error.code) };
  await recordSafety(verdict, { type: "post", id: data.id, userId: user.id });
  revalidatePath("/stories");
  revalidatePath("/home");
  redirect(`/stories/${data.id}${verdict.crisis ? "?help=1" : ""}`);
}

export async function addComment(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const postId = String(form.get("post_id") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { error: "내용을 적어 주세요." };
  if (body.length > COMMENT_MAX) return { error: `${COMMENT_MAX}자까지 쓸 수 있어요.` };
  const verdict = await checkText(body);
  if (verdict.action === "block") return { error: verdict.message };
  const { data, error } = await supabase.from("comments").insert({ post_id: postId, body }).select("id").single();
  if (error) return { error: writeError(error.code) };
  await recordSafety(verdict, { type: "comment", id: data.id, userId: user.id });
  revalidatePath(`/stories/${postId}`);
  return { ok: true, crisis: verdict.action === "allow" && verdict.crisis };
}

export async function toggleReaction(targetType: "post" | "comment", targetId: string, kind: string, path: string) {
  const { supabase, user } = await requireUser();
  if (!keysOf(REACTIONS).has(kind) || !["post", "comment"].includes(targetType)) return;
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("user_id", user.id)
    .eq("kind", kind)
    .maybeSingle();
  if (existing) await supabase.from("reactions").delete().eq("id", existing.id);
  else await supabase.from("reactions").insert({ target_type: targetType, target_id: targetId, kind, user_id: user.id });
  revalidatePath(path);
}

export async function toggleSave(postId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("saved_posts").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
  if (data) await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", user.id);
  else await supabase.from("saved_posts").insert({ post_id: postId, user_id: user.id });
  revalidatePath(`/stories/${postId}`);
  revalidatePath("/me/saved");
}

export async function submitReport(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const target_type = String(form.get("target_type") ?? "");
  const target_id = String(form.get("target_id") ?? "");
  const reason = String(form.get("reason") ?? "");
  const detail = String(form.get("detail") ?? "").trim().slice(0, 500) || null;
  if (!["post", "comment", "user", "message"].includes(target_type)) return { error: "잘못된 요청이에요." };
  if (!keysOf(REPORT_REASONS).has(reason)) return { error: "신고 이유를 골라 주세요." };
  const { error } = await supabase.from("reports").insert({ target_type, target_id, reason, detail });
  if (error) return { error: "신고를 접수하지 못했어요." };
  return { ok: true };
}

export async function blockUser(userId: string, redirectTo?: string) {
  const { supabase, user } = await requireUser();
  if (userId === user.id) return;
  await supabase.from("blocks").upsert({ blocker_id: user.id, blocked_id: userId }, { ignoreDuplicates: true });
  revalidatePath("/", "layout");
  if (redirectTo) redirect(redirectTo);
}

export async function unblockUser(userId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", userId);
  revalidatePath("/", "layout");
}

export async function deletePost(postId: string) {
  const { supabase } = await requireUser();
  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath("/stories");
  redirect("/stories");
}

export async function deleteComment(commentId: string, postId: string) {
  const { supabase } = await requireUser();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath(`/stories/${postId}`);
}
