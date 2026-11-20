"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, House, User, Users } from "lucide-react";

const TABS = [
  { href: "/home", label: "홈", Icon: House },
  { href: "/stories", label: "이야기", Icon: BookOpen },
  { href: "/groups", label: "그룹", Icon: Users },
  { href: "/notifications", label: "알림", Icon: Bell },
  { href: "/me", label: "마이", Icon: User },
];

export function TabBar({ unread = 0 }: { unread?: number }) {
  const path = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px] border-t border-beige bg-ivory/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid h-16 grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const on = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-150 ${
                  on ? "font-semibold text-point-strong" : "text-ink-soft"
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={1.75} />
                  {href === "/notifications" && unread > 0 && (
                    <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
