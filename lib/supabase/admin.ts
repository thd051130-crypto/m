import "server-only";
import { createClient } from "@supabase/supabase-js";

/** service role 클라이언트. 서버 액션에서만, 꼭 필요한 곳(회원 탈퇴 등)에만 쓴다. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았어요.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
