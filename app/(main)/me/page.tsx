import Link from "next/link";
import { Ban, Bookmark, ChevronRight, FileText, Heart, LogOut, UserPen } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/data";
import { signOut } from "@/app/(auth)/actions";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { WithdrawButton } from "./WithdrawButton";

export default async function MePage() {
  const { supabase, user } = await getUser();
  const profile = await getMyProfile(supabase, user!.id);
  const items = [
    { href: "/me/profile", label: "닉네임·아바타 변경", Icon: UserPen },
    { href: "/me/mood", label: "마음 상태 수정", Icon: Heart },
    { href: "/me/posts", label: "내가 쓴 이야기", Icon: FileText },
    { href: "/me/saved", label: "저장한 글", Icon: Bookmark },
    { href: "/me/blocks", label: "차단 목록", Icon: Ban },
  ];
  return (
    <main>
      <PageHeader title="마이" />
      <section className="card mx-4 mb-4 flex items-center gap-4">
        <Avatar avatarKey={profile?.avatar_key} size={56} />
        <div>
          <p className="text-lg font-bold">{profile?.nickname}</p>
          <p className="text-sm text-ink-soft">다른 사람에게는 닉네임과 아바타만 보여요</p>
        </div>
      </section>
      <ul className="card mx-4 p-0">
        {items.map(({ href, label, Icon }) => (
          <li key={href} className="border-b border-beige last:border-0">
            <Link href={href} className="flex items-center gap-3 px-5 py-4">
              <Icon size={20} strokeWidth={1.75} className="text-ink-soft" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={18} strokeWidth={1.75} className="text-ink-soft" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mx-4 mt-4 flex flex-col gap-2">
        <form action={signOut}>
          <button className="btn-soft w-full">
            <LogOut size={18} strokeWidth={1.75} /> 로그아웃
          </button>
        </form>
        <WithdrawButton />
      </div>
    </main>
  );
}
