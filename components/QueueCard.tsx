"use client";
import { useState, useTransition } from "react";
import { Hourglass } from "lucide-react";
import { joinQueue, leaveQueue } from "@/app/(main)/groups/actions";

export function QueueCard({ queued }: { queued: boolean }) {
  const [msg, setMsg] = useState<{ error?: string; info?: string }>({});
  const [pending, start] = useTransition();
  return (
    <div className="card bg-beige/60">
      <p className="mb-1 flex items-center gap-1.5 font-semibold">
        <Hourglass size={18} strokeWidth={1.75} className="text-point-strong" />
        {queued ? "새 그룹을 기다리는 중이에요" : "딱 맞는 그룹이 아직 적어요"}
      </p>
      <p className="mb-3 text-sm text-ink-soft">
        {queued
          ? "비슷한 대화 스타일·활동 시간인 분이 5명 모이면 새 그룹이 열리고 함께 참여돼요."
          : "대기열에 등록하면, 비슷한 분 5명이 모였을 때 새 그룹이 열리고 자동으로 참여돼요."}
      </p>
      {msg.info && <p className="mb-3 text-sm text-point-strong">{msg.info}</p>}
      {msg.error && <p className="error mb-3">{msg.error}</p>}
      <button
        type="button"
        disabled={pending}
        className={queued ? "btn-soft h-10 w-full text-sm" : "btn-primary h-10 w-full text-sm"}
        onClick={() =>
          start(async () => {
            if (queued) {
              await leaveQueue();
              setMsg({});
            } else setMsg((await joinQueue()) ?? {});
          })
        }
      >
        {pending ? "잠시만요…" : queued ? "대기 취소" : "대기열에 등록하기"}
      </button>
    </div>
  );
}
