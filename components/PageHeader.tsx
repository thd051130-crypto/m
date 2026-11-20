import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, back, right }: { title: string; back?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 bg-ivory/95 px-4 backdrop-blur">
      {back && (
        <Link href={back} aria-label="뒤로" className="-ml-2 rounded-full p-2 text-ink-soft hover:bg-beige">
          <ChevronLeft size={22} strokeWidth={1.75} />
        </Link>
      )}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </header>
  );
}
