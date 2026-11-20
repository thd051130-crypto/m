"use client";
import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleSave } from "@/app/(main)/stories/actions";

export function SaveButton({ postId, saved }: { postId: string; saved: boolean }) {
  const [, start] = useTransition();
  const [on, set] = useOptimistic(saved, (_: boolean, v: boolean) => v);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "저장 취소" : "저장"}
      onClick={() => start(async () => { set(!on); await toggleSave(postId); })}
      className="rounded-full p-1.5 text-ink-soft hover:bg-beige"
    >
      <Bookmark size={18} strokeWidth={1.75} className={on ? "fill-point-strong text-point-strong" : ""} />
    </button>
  );
}
