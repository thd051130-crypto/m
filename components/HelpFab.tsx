import Link from "next/link";
import { LifeBuoy } from "lucide-react";

/** 앱 하단에 항상 떠 있는 "도움이 필요할 때" */
export function HelpFab() {
  return (
    <Link
      href="/help"
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] z-20 flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-md"
      style={{ right: "max(16px, calc((100vw - 480px) / 2 + 16px))" }}
    >
      <LifeBuoy size={14} strokeWidth={1.75} className="text-point-strong" /> 도움이 필요할 때
    </Link>
  );
}
