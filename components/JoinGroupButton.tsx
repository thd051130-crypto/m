"use client";
import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { joinGroup } from "@/app/(main)/groups/actions";

const RULES = [
  "서로를 존중해요. 판단하거나 가르치려 하지 않아요.",
  "실명·사는 곳·직장 같은 개인정보는 나누지 않아요.",
  "전화번호·메신저 아이디 등 외부 연락처는 교환하지 않아요.",
  "힘든 이야기를 들으면, 조언보다 먼저 들어주세요.",
];

export function JoinGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" className="btn-primary h-10 w-full text-sm" onClick={() => setOpen(true)}>
        참여하기
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30" onClick={() => setOpen(false)}>
          <div
            className="fade-in w-full max-w-[480px] rounded-t-[20px] bg-ivory p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-point-strong">
              <ShieldCheck size={16} strokeWidth={1.75} /> 그룹 규칙
            </p>
            <h2 className="mb-3 text-lg font-bold">{groupName}에 참여할까요?</h2>
            <ul className="mb-4 flex flex-col gap-2 text-sm">
              {RULES.map((r) => (
                <li key={r} className="rounded-[14px] bg-card px-4 py-3">{r}</li>
              ))}
            </ul>
            {error && <p className="error mb-3">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-soft" onClick={() => setOpen(false)}>다음에</button>
              <button
                type="button"
                className="btn-primary"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await joinGroup(groupId);
                    if (res?.error) setError(res.error);
                  })
                }
              >
                {pending ? "잠시만요…" : "규칙을 지킬게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
