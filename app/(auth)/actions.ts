"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string };

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const adult = form.get("adult") === "on";
  const terms = form.get("terms") === "on";
  const privacy = form.get("privacy") === "on";

  if (!email || !password) return { error: "이메일과 비밀번호를 입력해 주세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상으로 해주세요." };
  if (!adult || !terms || !privacy) return { error: "필수 항목에 모두 동의해 주세요." };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding/profile`,
      data: { agreed_terms_at: new Date().toISOString(), is_adult_confirmed: true },
    },
  });
  if (error) return { error: translate(error.message) };
  return { info: `${email}로 인증 메일을 보냈어요. 메일의 링크를 누르면 다음 단계로 이어져요.` };
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translate(error.message) };
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

function translate(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (/email not confirmed/i.test(msg)) return "메일 인증을 먼저 완료해 주세요.";
  if (/already registered/i.test(msg)) return "이미 가입된 이메일이에요.";
  if (/rate limit/i.test(msg)) return "잠시 후 다시 시도해 주세요.";
  return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}
