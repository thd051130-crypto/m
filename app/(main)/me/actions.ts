"use server";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type WithdrawState = { error?: string };

/**
 * 회원 탈퇴: auth 사용자 삭제 → profiles cascade 삭제 →
 * posts/comments.author_id는 on delete set null 로 "탈퇴한 사용자"가 된다.
 */
export async function withdraw(_: WithdrawState, form: FormData): Promise<WithdrawState> {
  if (form.get("confirm") !== "탈퇴") return { error: "확인 문구로 '탈퇴'를 입력해 주세요." };
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "지금은 탈퇴를 처리할 수 없어요. 잠시 후 다시 시도해 주세요." };
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해 주세요." };

  await supabase.auth.signOut();
  redirect("/?bye=1");
}
