"use client";
import { MessageCircleHeart, Phone, X } from "lucide-react";
import { HELPLINES } from "@/lib/constants";

/** 위기 표현이 감지되면 작성자 본인에게만 보여주는 도움 카드 */
export function CrisisCard({ onClose }: { onClose?: () => void }) {
  return (
    <div role="alertdialog" aria-label="도움 안내" className="card fade-in relative border-2 border-point-strong bg-[#f3f8f1]">
      {onClose && (
        <button aria-label="닫기" onClick={onClose} className="absolute right-3 top-3 rounded-full p-1 text-ink-soft hover:bg-beige">
          <X size={18} strokeWidth={1.75} />
        </button>
      )}
      <p className="mb-1 pr-6 font-bold">힘든 마음을 이야기해 줘서 고마워요.</p>
      <p className="mb-4 text-sm text-ink-soft">지금 전문 상담사와 이야기해 볼 수 있어요.</p>
      <div className="flex flex-col gap-2">
        <a href={`tel:${HELPLINES.suicide.number}`} className="btn-primary">
          <Phone size={18} strokeWidth={1.75} /> {HELPLINES.suicide.number} 전화하기
          <span className="text-xs font-normal opacity-90">({HELPLINES.suicide.label}, {HELPLINES.suicide.note})</span>
        </a>
        {HELPLINES.madlenUrl ? (
          <a href={HELPLINES.madlenUrl} target="_blank" rel="noreferrer" className="btn-soft">
            <MessageCircleHeart size={18} strokeWidth={1.75} /> 문자·메신저 상담 마들랜
          </a>
        ) : (
          <p className="rounded-[14px] bg-beige px-4 py-3 text-center text-sm">문자·메신저 상담: SNS 상담 &apos;마들랜&apos;</p>
        )}
      </div>
      <p className="mt-3 text-center text-sm font-semibold">지금 당장 위험하다면 112 또는 119</p>
    </div>
  );
}
