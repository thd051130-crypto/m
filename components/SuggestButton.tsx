"use client";
import { useState } from "react";
import { Wand2 } from "lucide-react";

/** [문구 추천]: 3개를 보여주고, 고르면 입력창에 채운다 (자동 전송 없음) */
export function SuggestButton({ context, onPick }: { context: string; onPick: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    setOpen(true);
    setLoading(true);
    setNote(null);
    setItems([]);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      const json = await res.json();
      if (json.error) setNote(json.error);
      else if (json.note) setNote(json.note);
      setItems(json.suggestions ?? []);
    } catch {
      setNote("추천을 불러오지 못했어요.");
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button type="button" onClick={load} className="inline-flex items-center gap-1 rounded-full bg-beige px-3 py-1.5 text-xs font-semibold text-ink-soft">
        <Wand2 size={14} strokeWidth={1.75} /> 문구 추천
      </button>
      {open && (
        <div className="fade-in absolute bottom-10 left-0 z-30 w-72 rounded-[14px] bg-card p-2 shadow-lg">
          {loading && <p className="p-3 text-sm text-ink-soft">생각하는 중…</p>}
          {note && <p className="p-3 text-sm text-ink-soft">{note}</p>}
          {items.map((t) => (
            <button
              key={t}
              type="button"
              className="block w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-ivory"
              onClick={() => {
                onPick(t);
                setOpen(false);
              }}
            >
              {t}
            </button>
          ))}
          <p className="px-3 pt-1 text-[11px] text-ink-soft">마음이음 도우미 제안 · 고쳐서 직접 보내 주세요</p>
          <button type="button" onClick={() => setOpen(false)} className="w-full py-1 text-xs text-ink-soft">닫기</button>
        </div>
      )}
    </div>
  );
}
