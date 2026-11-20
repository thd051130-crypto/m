"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { addComment, type ActionState } from "@/app/(main)/stories/actions";
import { COMMENT_MAX } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";
import { CrisisCard } from "./CrisisCard";

export function CommentForm({ postId }: { postId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addComment, {});
  const ref = useRef<HTMLFormElement>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
    if (state.crisis) setShowCrisis(true);
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="post_id" value={postId} />
      {showCrisis && <CrisisCard onClose={() => setShowCrisis(false)} />}
      <textarea name="body" required maxLength={COMMENT_MAX} rows={2} placeholder="따뜻한 한마디를 남겨 주세요" className="input resize-none" />
      {state.error && <p className="error">{state.error}</p>}
      <div className="flex justify-end">
        <SubmitButton className="btn-primary h-10 px-4 text-sm">댓글 남기기</SubmitButton>
      </div>
    </form>
  );
}
