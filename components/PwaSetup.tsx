"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "mi-install-banner-dismissed";

/** 서비스워커 등록 + "홈 화면에 추가" 안내 (닫으면 다시 안 보임) */
export function PwaSetup() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {}
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (dismissed || standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setIos(true);
      setShow(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  if (!show) return null;
  return (
    <div className="fade-in fixed inset-x-0 top-2 z-50 mx-auto w-[calc(100%-32px)] max-w-[448px] rounded-[16px] bg-card p-4 shadow-lg">
      <button aria-label="닫기" onClick={dismiss} className="absolute right-2 top-2 rounded-full p-1 text-ink-soft">
        <X size={16} strokeWidth={1.75} />
      </button>
      <p className="mb-1 flex items-center gap-1.5 pr-6 text-sm font-semibold">
        <Download size={16} strokeWidth={1.75} className="text-point-strong" /> 홈 화면에 마음이음 추가하기
      </p>
      {ios ? (
        <p className="text-xs text-ink-soft">Safari 하단의 공유 버튼 → &quot;홈 화면에 추가&quot;를 눌러 주세요.</p>
      ) : (
        <button
          className="btn-primary mt-2 h-9 w-full text-sm"
          onClick={async () => {
            await deferred?.prompt();
            dismiss();
          }}
        >
          추가하기
        </button>
      )}
    </div>
  );
}
