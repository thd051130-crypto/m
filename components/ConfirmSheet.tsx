"use client";

export function ConfirmSheet({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
  pending,
}: {
  title: string;
  body?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  pending?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30" onClick={onClose}>
      <div
        className="fade-in w-full max-w-[480px] rounded-t-[20px] bg-ivory p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{title}</h2>
        {body && <p className="mt-2 text-sm text-ink-soft">{body}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" className="btn-soft" onClick={onClose}>취소</button>
          <button
            type="button"
            disabled={pending}
            className={danger ? "btn bg-danger text-white" : "btn-primary"}
            onClick={onConfirm}
          >
            {pending ? "잠시만요…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
