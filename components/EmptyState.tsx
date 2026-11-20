import type { LucideIcon } from "lucide-react";

export function EmptyState({ Icon, title, body }: { Icon: LucideIcon; title: string; body?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <Icon size={32} strokeWidth={1.75} className="text-point-strong" />
      <p className="font-semibold">{title}</p>
      {body && <p className="text-sm text-ink-soft">{body}</p>}
    </div>
  );
}
