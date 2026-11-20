"use client";
import { useEffect } from "react";
import { markAllRead } from "@/app/(main)/notifications/actions";

/** 알림 탭을 열면 잠시 뒤 모두 읽음 처리 (처음 보이는 화면에서는 새 알림 강조 유지) */
export function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (!hasUnread) return;
    const t = setTimeout(() => void markAllRead(), 1500);
    return () => clearTimeout(t);
  }, [hasUnread]);
  return null;
}
