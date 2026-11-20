"use client";
import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { blockUser, deleteComment, deletePost } from "@/app/(main)/stories/actions";
import { ReportSheet } from "./ReportSheet";
import { ConfirmSheet } from "./ConfirmSheet";

/** 글·댓글의 ⋯ 메뉴: 신고 / 작성자 차단 / (내 것이면) 삭제 */
export function ItemMenu({
  kind,
  id,
  postId,
  authorId,
  isMine,
}: {
  kind: "post" | "comment";
  id: string;
  postId: string;
  authorId: string | null;
  isMine: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<null | "report" | "block" | "delete">(null);
  const [pending, start] = useTransition();
  const close = () => setSheet(null);

  return (
    <div className="relative">
      <button type="button" aria-label="더보기" onClick={() => setOpen((o) => !o)} className="rounded-full p-1.5 text-ink-soft hover:bg-beige">
        <MoreHorizontal size={18} strokeWidth={1.75} />
      </button>
      {open && (
        <ul className="fade-in absolute right-0 top-9 z-30 w-36 overflow-hidden rounded-[14px] bg-card text-sm shadow-lg" onMouseLeave={() => setOpen(false)}>
          {isMine ? (
            <li>
              <button className="w-full px-4 py-3 text-left text-danger hover:bg-ivory" onClick={() => { setOpen(false); setSheet("delete"); }}>
                삭제하기
              </button>
            </li>
          ) : (
            <>
              <li>
                <button className="w-full px-4 py-3 text-left hover:bg-ivory" onClick={() => { setOpen(false); setSheet("report"); }}>
                  신고하기
                </button>
              </li>
              {authorId && (
                <li>
                  <button className="w-full px-4 py-3 text-left hover:bg-ivory" onClick={() => { setOpen(false); setSheet("block"); }}>
                    작성자 차단
                  </button>
                </li>
              )}
            </>
          )}
        </ul>
      )}
      {sheet === "report" && <ReportSheet targetType={kind} targetId={id} onClose={close} />}
      {sheet === "block" && authorId && (
        <ConfirmSheet
          title="이 사용자를 차단할까요?"
          body="차단하면 이 사람의 글과 댓글이 보이지 않아요. 마이 > 차단 목록에서 언제든 해제할 수 있어요."
          confirmLabel="차단"
          pending={pending}
          onClose={close}
          onConfirm={() => start(() => blockUser(authorId, kind === "post" ? "/stories" : undefined).then(close))}
        />
      )}
      {sheet === "delete" && (
        <ConfirmSheet
          title={kind === "post" ? "이 이야기를 삭제할까요?" : "이 댓글을 삭제할까요?"}
          confirmLabel="삭제"
          danger
          pending={pending}
          onClose={close}
          onConfirm={() => start(() => (kind === "post" ? deletePost(id) : deleteComment(id, postId).then(close)))}
        />
      )}
    </div>
  );
}
