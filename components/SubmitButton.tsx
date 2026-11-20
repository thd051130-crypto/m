"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn-primary w-full",
  pendingText = "잠시만요…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
