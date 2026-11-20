"use client";
import { useActionState, useEffect } from "react";
import { submitReport, type ActionState } from "@/app/(main)/stories/actions";
import { REPORT_REASONS } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

export function ReportSheet({
  targetType,
  targetId,
  onClose,
}: {
  targetType: "post" | "comment" | "user";
  targetId: string;
  onClose: () => void;
}) {
  const [state, action] = useActionState<ActionState, FormData>(submitReport, {});
  useEffect(() => {
    if (!state.ok) return;
    const t = setTimeout(onClose, 1200);
    return () => clearTimeout(t);
  }, [state.ok, onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30" onClick={onClose}>
      <div
        className="fade-in w-full max-w-[480px] rounded-t-[20px] bg-ivory p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {state.ok ? (
          <p className="py-6 text-center font-semibold">신고가 접수됐어요. 확인 후 조치할게요.</p>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">신고하기</h2>
            <input type="hidden" name="target_type" value={targetType} />
            <input type="hidden" name="target_id" value={targetId} />
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((r) => (
                <label key={r.key} className="flex items-center gap-3 rounded-[14px] bg-card px-4 py-3 text-sm">
                  <input type="radio" name="reason" value={r.key} required className="accent-[#7FA37A]" />
                  {r.label}
                </label>
              ))}
            </div>
            <textarea name="detail" maxLength={500} rows={2} placeholder="자세한 내용 (선택)" className="input resize-none" />
            {state.error && <p className="error">{state.error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-soft" onClick={onClose}>취소</button>
              <SubmitButton className="btn-primary">신고</SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
