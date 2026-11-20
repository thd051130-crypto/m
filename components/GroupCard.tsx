import Link from "next/link";
import { Users } from "lucide-react";
import { INTERESTS, labelOf } from "@/lib/constants";

export function GroupCard({
  group,
  reason,
  action,
  href,
}: {
  group: { id: string; name: string; description: string; member_count: number; max_members: number; interests: string[]; notice?: string | null };
  reason?: string;
  action?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="mb-1 flex items-center gap-2">
        <h3 className="flex-1 font-bold">{group.name}</h3>
        <span className="flex items-center gap-1 text-xs text-ink-soft">
          <Users size={14} strokeWidth={1.75} /> {group.member_count}/{group.max_members}
        </span>
      </div>
      <p className="text-sm text-ink-soft">{group.description}</p>
      {reason && <p className="mt-2 text-sm font-medium text-point-strong">{reason}</p>}
      {group.interests.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {group.interests.map((i) => (
            <span key={i} className="rounded-full bg-beige px-2.5 py-0.5 text-xs">
              #{labelOf(INTERESTS, i)}
            </span>
          ))}
        </div>
      )}
    </>
  );
  return (
    <div className="card fade-in">
      {href ? <Link href={href} className="block">{body}</Link> : body}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
