"use client";
import { useActionState, useState } from "react";
import { withdraw, type WithdrawState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export function WithdrawButton() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<WithdrawState, FormData>(withdraw, {});
  return (
    <>
      <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(true)}>
        회원 탈퇴
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30" onClick={() => setOpen(false)}>
          <form
            action={action}
            onClick={(e) => e.stopPropagation()}
            className="fade-in flex w-full max-w-[480px] flex-col gap-3 rounded-t-[20px] bg-ivory p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
          >
            <h2 className="text-lg font-bold">정말 떠나시나요?</h2>
            <p className="text-sm text-ink-soft">
              계정과 마음 상태 정보는 바로 삭제되고 되돌릴 수 없어요. 남긴 글·댓글은 &quot;탈퇴한 사용자&quot;로 표시돼요.
            </p>
            <input name="confirm" className="input" placeholder="확인을 위해 '탈퇴'를 입력해 주세요" autoComplete="off" />
            {state.error && <p className="error">{state.error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-soft" onClick={() => setOpen(false)}>취소</button>
              <SubmitButton className="btn bg-danger text-white">탈퇴하기</SubmitButton>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
