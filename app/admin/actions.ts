"use server";
import { revalidatePath } from "next/cache";
import { logAction, requireAdmin, TARGET_TABLE } from "@/lib/admin";

export async function handleAlert(alertId: string) {
  const { admin, adminId } = await requireAdmin();
  await admin.from("safety_alerts").update({ handled_by: adminId, handled_at: new Date().toISOString() }).eq("id", alertId);
  await logAction(admin, adminId, "alert_handled", "safety_alert", alertId);
  revalidatePath("/admin/alerts");
  revalidatePath("/admin");
}

export async function setHidden(type: string, id: string, hidden: boolean) {
  const { admin, adminId } = await requireAdmin();
  const table = TARGET_TABLE[type];
  if (!table) return;
  await admin.from(table).update({ is_hidden: hidden }).eq("id", id);
  await logAction(admin, adminId, hidden ? "hide" : "restore", type, id);
  revalidatePath("/admin", "layout");
  revalidatePath("/stories");
}

export async function resolveReport(reportId: string, action: "hide" | "dismiss" | "suspend_1d" | "suspend_7d" | "suspend_forever") {
  const { admin, adminId } = await requireAdmin();
  const { data: report } = await admin.from("reports").select("id, target_type, target_id").eq("id", reportId).maybeSingle();
  if (!report) return;

  if (action === "dismiss") {
    await admin.from("reports").update({ status: "reviewed" }).eq("id", reportId);
  } else if (action === "hide") {
    const table = TARGET_TABLE[report.target_type];
    if (table) await admin.from(table).update({ is_hidden: true }).eq("id", report.target_id);
    await admin.from("reports").update({ status: "actioned" }).eq("id", reportId);
  } else {
    // 이용 제한: 신고 대상의 작성자
    let userId: string | null = report.target_type === "user" ? report.target_id : null;
    if (!userId) {
      const table = TARGET_TABLE[report.target_type];
      const col = report.target_type === "message" ? "sender_id" : "author_id";
      const { data } = table ? await admin.from(table).select(col).eq("id", report.target_id).maybeSingle() : { data: null };
      userId = (data as Record<string, string | null> | null)?.[col] ?? null;
    }
    if (userId) {
      const days = action === "suspend_1d" ? 1 : action === "suspend_7d" ? 7 : null;
      await admin
        .from("profiles")
        .update({ status: "suspended", suspended_until: days ? new Date(Date.now() + days * 86400_000).toISOString() : null })
        .eq("id", userId);
    }
    await admin.from("reports").update({ status: "actioned" }).eq("id", reportId);
  }
  await logAction(admin, adminId, `report_${action}`, "report", reportId, { target_type: report.target_type, target_id: report.target_id });
  revalidatePath("/admin", "layout");
}

export async function liftSuspension(userId: string) {
  const { admin, adminId } = await requireAdmin();
  await admin.from("profiles").update({ status: "active", suspended_until: null }).eq("id", userId);
  await logAction(admin, adminId, "unsuspend", "user", userId);
  revalidatePath("/admin", "layout");
}

export async function saveGroup(form: FormData) {
  const { admin, adminId } = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim().slice(0, 30);
  const description = String(form.get("description") ?? "").trim().slice(0, 200);
  const notice = String(form.get("notice") ?? "").trim().slice(0, 300) || null;
  const interests = String(form.get("interests") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5);
  const chat_style = String(form.get("chat_style") ?? "light");
  const active_times = form.getAll("active_times").map(String);
  const max_members = Math.min(8, Math.max(2, Number(form.get("max_members") ?? 8)));
  if (name.length < 2) return;
  const row = { name, description, notice, interests, chat_style, active_times, max_members };
  if (id) {
    await admin.from("groups").update(row).eq("id", id);
    await logAction(admin, adminId, "group_update", "group", id, row);
  } else {
    const { data } = await admin.from("groups").insert({ ...row, created_by: adminId }).select("id").single();
    await logAction(admin, adminId, "group_create", "group", data?.id ?? null, row);
  }
  revalidatePath("/admin/groups");
  revalidatePath("/groups");
}

export async function setGroupActive(id: string, active: boolean) {
  const { admin, adminId } = await requireAdmin();
  await admin.from("groups").update({ is_active: active }).eq("id", id);
  await logAction(admin, adminId, active ? "group_activate" : "group_deactivate", "group", id);
  revalidatePath("/admin/groups");
  revalidatePath("/groups");
}
