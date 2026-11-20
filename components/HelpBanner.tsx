import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export function HelpBanner() {
  return (
    <Link href="/help" className="mx-4 mb-3 flex items-center gap-2 rounded-[14px] bg-[#f3f8f1] px-4 py-2 text-sm">
      <LifeBuoy size={16} strokeWidth={1.75} className="text-point-strong" />
      도움이 필요하면 <b>109</b> (24시간 자살예방상담전화)
    </Link>
  );
}
