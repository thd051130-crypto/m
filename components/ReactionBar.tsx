"use client";
import { useOptimistic, useTransition } from "react";
import { HandHeart, Heart, Sparkles } from "lucide-react";
import { toggleReaction } from "@/app/(main)/stories/actions";
import { REACTIONS, type ReactionKind } from "@/lib/constants";
import type { ReactionSummary } from "@/lib/types";

const ICONS = { empathy: Heart, cheer: HandHeart, strength: Sparkles } as const;

export function ReactionBar({
  targetType,
  targetId,
  summary,
  path,
  compact = false,
}: {
  targetType: "post" | "comment";
  targetId: string;
  summary: ReactionSummary;
  path: string;
  compact?: boolean;
}) {
  const [, start] = useTransition();
  const [state, toggle] = useOptimistic(summary, (s, kind: ReactionKind) => {
    const on = s.mine.includes(kind);
    return {
      counts: { ...s.counts, [kind]: s.counts[kind] + (on ? -1 : 1) },
      mine: on ? s.mine.filter((k) => k !== kind) : [...s.mine, kind],
    };
  });
  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map(({ key, label }) => {
        const Icon = ICONS[key];
        const on = state.mine.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() =>
              start(async () => {
                toggle(key);
                await toggleReaction(targetType, targetId, key, path);
              })
            }
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 ${compact ? "py-1 text-xs" : "py-1.5 text-sm"} transition-colors duration-150 ${
              on ? "border-point-strong bg-point/30 font-semibold text-ink" : "border-beige bg-card text-ink-soft"
            }`}
          >
            <Icon size={compact ? 14 : 16} strokeWidth={1.75} className={on ? "text-point-strong" : ""} />
            {label}
            {state.counts[key] > 0 && <span className="text-[11px] text-ink-soft">{state.counts[key]}</span>}
          </button>
        );
      })}
    </div>
  );
}
