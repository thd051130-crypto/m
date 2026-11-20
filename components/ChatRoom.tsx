"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Info, LogOut, Megaphone, MoreVertical, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteMessage, leaveGroup, sendMessage, toggleMessageReaction } from "@/app/(main)/groups/actions";
import { blockUser } from "@/app/(main)/stories/actions";
import { DELETED_USER, REACTIONS, type ReactionKind } from "@/lib/constants";
import { clockTime } from "@/lib/format";
import type { PublicProfile } from "@/lib/types";
import { Avatar } from "./Avatar";
import { ReportSheet } from "./ReportSheet";
import { ConfirmSheet } from "./ConfirmSheet";
import { CrisisCard } from "./CrisisCard";

export type ChatMessage = {
  id: string;
  group_id: string;
  sender_id: string | null;
  body: string;
  deleted_at: string | null;
  created_at: string;
};
type Reaction = { message_id: string; user_id: string; kind: string };
type Member = { user_id: string; role: string; joined_at: string; profile: PublicProfile | null };

const REACTION_EMOJI: Record<ReactionKind, string> = { empathy: "💚", cheer: "👏", strength: "💪" };

export function ChatRoom({
  group,
  me,
  members,
  initialMessages,
  initialProfiles,
  initialReactions,
  pageSize,
}: {
  group: { id: string; name: string; description: string; notice: string | null; max_members: number };
  me: string;
  members: Member[];
  initialMessages: ChatMessage[];
  initialProfiles: Record<string, PublicProfile>;
  initialReactions: Reaction[];
  pageSize: number;
}) {
  const supabase = useRef(createClient()).current;
  const [messages, setMessages] = useState(initialMessages);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [reactions, setReactions] = useState(initialReactions);
  const [showCrisis, setShowCrisis] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length >= pageSize);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState<null | { type: "actions" | "report" | "block"; msg: ChatMessage } | { type: "info" | "leave" }>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSend] = useTransition();
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevHeight = useRef<number | null>(null);

  const ensureProfile = useCallback(
    async (id: string | null) => {
      if (!id || profiles[id]) return;
      const { data } = await supabase.from("public_profiles").select("id, nickname, avatar_key").eq("id", id).maybeSingle();
      if (data) setProfiles((p) => ({ ...p, [id]: data }));
    },
    [profiles, supabase],
  );

  // 실시간 수신 (RLS 적용: 현재 멤버만 받는다)
  useEffect(() => {
    const channel = supabase
      .channel(`group:${group.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${group.id}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          void ensureProfile(m.sender_id);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `group_id=eq.${group.id}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [group.id, supabase, ensureProfile]);

  // 스크롤 위치 유지: 새 메시지는 아래로, 이전 메시지 로드 시 위치 고정
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (prevHeight.current !== null) {
      el.scrollTop = el.scrollHeight - prevHeight.current;
      prevHeight.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const loadOlder = async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);
    const { data } = await supabase
      .from("messages")
      .select("id, group_id, sender_id, body, deleted_at, created_at")
      .eq("group_id", group.id)
      .lt("created_at", messages[0].created_at)
      .order("created_at", { ascending: false })
      .limit(pageSize);
    const older = ((data ?? []) as ChatMessage[]).reverse();
    const ids = Array.from(new Set(older.map((m) => m.sender_id).filter((v): v is string => !!v && !profiles[v])));
    if (ids.length) {
      const { data: ps } = await supabase.from("public_profiles").select("id, nickname, avatar_key").in("id", ids);
      setProfiles((p) => ({ ...p, ...Object.fromEntries((ps ?? []).map((x) => [x.id, x])) }));
    }
    if (older.length) {
      const { data: rs } = await supabase
        .from("message_reactions")
        .select("message_id, user_id, kind")
        .in("message_id", older.map((m) => m.id));
      setReactions((r) => [...r, ...(rs ?? [])]);
    }
    prevHeight.current = listRef.current?.scrollHeight ?? null;
    setMessages((prev) => [...older, ...prev]);
    setHasMore(older.length >= pageSize);
    setLoadingOlder(false);
  };

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 40) void loadOlder();
  };

  const send = () => {
    const body = text.trim();
    if (!body || sending) return;
    setError(null);
    startSend(async () => {
      const res = await sendMessage(group.id, body);
      if (res.error) setError(res.error);
      else {
        if (res.crisis) setShowCrisis(true);
        setText("");
        stickToBottom.current = true;
      }
    });
  };

  const react = (msg: ChatMessage, kind: ReactionKind) => {
    const mine = reactions.some((r) => r.message_id === msg.id && r.user_id === me && r.kind === kind);
    setReactions((rs) =>
      mine
        ? rs.filter((r) => !(r.message_id === msg.id && r.user_id === me && r.kind === kind))
        : [...rs, { message_id: msg.id, user_id: me, kind }],
    );
    setSheet(null);
    void toggleMessageReaction(msg.id, kind);
  };

  return (
    <div className="fixed inset-0 z-30 mx-auto flex w-full max-w-[480px] flex-col bg-ivory">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-beige px-3">
        <Link href="/groups" aria-label="뒤로" className="rounded-full p-2 text-ink-soft hover:bg-beige">
          <ChevronLeft size={22} strokeWidth={1.75} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold">{group.name}</h1>
          <p className="text-xs text-ink-soft">
            {members.length}/{group.max_members}명
          </p>
        </div>
        <div className="relative">
          <button aria-label="메뉴" className="rounded-full p-2 text-ink-soft hover:bg-beige" onClick={() => setMenuOpen((o) => !o)}>
            <MoreVertical size={20} strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <ul className="fade-in absolute right-0 top-11 z-40 w-40 overflow-hidden rounded-[14px] bg-card text-sm shadow-lg">
              <li>
                <button className="flex w-full items-center gap-2 px-4 py-3 hover:bg-ivory" onClick={() => { setMenuOpen(false); setSheet({ type: "info" }); }}>
                  <Info size={16} strokeWidth={1.75} /> 그룹 정보
                </button>
              </li>
              <li>
                <button className="flex w-full items-center gap-2 px-4 py-3 text-danger hover:bg-ivory" onClick={() => { setMenuOpen(false); setSheet({ type: "leave" }); }}>
                  <LogOut size={16} strokeWidth={1.75} /> 그룹 나가기
                </button>
              </li>
            </ul>
          )}
        </div>
      </header>

      {group.notice && (
        <button
          className="flex shrink-0 items-start gap-2 bg-beige/70 px-4 py-2 text-left text-sm"
          onClick={() => setNoticeOpen((o) => !o)}
          aria-expanded={noticeOpen}
        >
          <Megaphone size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-point-strong" />
          <span className={`flex-1 ${noticeOpen ? "" : "truncate"}`}>{group.notice}</span>
          {noticeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}

      <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3">
        {loadingOlder && <p className="py-2 text-center text-xs text-ink-soft">이전 메시지를 불러오는 중…</p>}
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-ink-soft">첫 인사를 건네 보세요. 가벼운 “안녕하세요”도 좋아요.</p>
        )}
        <ul className="flex flex-col gap-3">
          {messages.map((m, i) => {
            const mine = m.sender_id === me;
            const p = m.sender_id ? profiles[m.sender_id] : null;
            const showHead = !mine && (i === 0 || messages[i - 1].sender_id !== m.sender_id);
            const rs = reactions.filter((r) => r.message_id === m.id);
            return (
              <li key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                {!mine && <div className="w-8 shrink-0">{showHead && <Avatar avatarKey={p?.avatar_key} size={32} />}</div>}
                <div className={`flex max-w-[75%] flex-col ${mine ? "items-end" : "items-start"}`}>
                  {showHead && <span className="mb-1 text-xs font-semibold">{p?.nickname ?? DELETED_USER}</span>}
                  <div className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                    <LongPress onLongPress={() => !m.deleted_at && setSheet({ type: "actions", msg: m })}>
                      <p
                        className={`whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2 text-[15px] ${
                          m.deleted_at ? "italic text-ink-soft bg-beige/50" : mine ? "bg-point/60" : "bg-card shadow-[var(--shadow-soft)]"
                        }`}
                      >
                        {m.body}
                      </p>
                    </LongPress>
                    <span className="shrink-0 text-[11px] text-ink-soft">{clockTime(m.created_at)}</span>
                  </div>
                  {rs.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {REACTIONS.filter((k) => rs.some((r) => r.kind === k.key)).map((k) => {
                        const on = rs.some((r) => r.kind === k.key && r.user_id === me);
                        return (
                          <button
                            key={k.key}
                            onClick={() => react(m, k.key)}
                            className={`rounded-full border px-2 py-0.5 text-[11px] ${on ? "border-point-strong bg-point/30" : "border-beige bg-card"}`}
                          >
                            {REACTION_EMOJI[k.key]} {rs.filter((r) => r.kind === k.key).length}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 border-t border-beige bg-ivory px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
        {showCrisis && (
          <div className="mb-2 max-h-[50dvh] overflow-y-auto">
            <CrisisCard onClose={() => setShowCrisis(false)} />
          </div>
        )}
        {error && <p className="error mb-2">{error}</p>}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="메시지 보내기"
            className="input max-h-32 min-h-11 flex-1 resize-none py-2.5"
          />
          <button type="submit" aria-label="보내기" disabled={sending || !text.trim()} className="btn-primary h-11 w-11 shrink-0 px-0">
            <Send size={18} strokeWidth={1.75} />
          </button>
        </form>
      </div>

      {sheet?.type === "actions" && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30" onClick={() => setSheet(null)}>
          <div
            className="fade-in w-full max-w-[480px] rounded-t-[20px] bg-ivory p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 grid grid-cols-3 gap-2">
              {REACTIONS.map((k) => (
                <button key={k.key} className="btn-soft h-14 flex-col gap-0 text-xs" onClick={() => react(sheet.msg, k.key)}>
                  <span className="text-lg">{REACTION_EMOJI[k.key]}</span>
                  {k.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {sheet.msg.sender_id === me ? (
                <button
                  className="btn-soft text-danger"
                  onClick={() => {
                    const id = sheet.msg.id;
                    setSheet(null);
                    setMessages((prev) => prev.map((x) => (x.id === id ? { ...x, deleted_at: new Date().toISOString(), body: "삭제된 메시지예요" } : x)));
                    void deleteMessage(id);
                  }}
                >
                  메시지 삭제
                </button>
              ) : (
                <>
                  <button className="btn-soft" onClick={() => setSheet({ type: "report", msg: sheet.msg })}>신고하기</button>
                  {sheet.msg.sender_id && (
                    <button className="btn-soft" onClick={() => setSheet({ type: "block", msg: sheet.msg })}>이 사용자 차단</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {sheet?.type === "report" && <ReportSheet targetType="message" targetId={sheet.msg.id} onClose={() => setSheet(null)} />}
      {sheet?.type === "block" && sheet.msg.sender_id && (
        <ConfirmSheet
          title="이 사용자를 차단할까요?"
          body="차단하면 이 사람의 메시지·글·댓글이 보이지 않아요. 마이 > 차단 목록에서 해제할 수 있어요."
          confirmLabel="차단"
          pending={pending}
          onClose={() => setSheet(null)}
          onConfirm={() => {
            const blocked = sheet.msg.sender_id!;
            start(async () => {
              await blockUser(blocked);
              setMessages((prev) => prev.filter((x) => x.sender_id !== blocked));
              setSheet(null);
            });
          }}
        />
      )}
      {sheet?.type === "leave" && (
        <ConfirmSheet
          title="그룹에서 나갈까요?"
          body="나가면 이 그룹의 새 메시지를 볼 수 없어요. 자리가 있으면 다시 참여할 수 있어요."
          confirmLabel="나가기"
          danger
          pending={pending}
          onClose={() => setSheet(null)}
          onConfirm={() => start(() => leaveGroup(group.id))}
        />
      )}
      {sheet?.type === "info" && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30" onClick={() => setSheet(null)}>
          <div
            className="fade-in max-h-[70dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[20px] bg-ivory p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">{group.name}</h2>
            <p className="mt-1 mb-4 text-sm text-ink-soft">{group.description}</p>
            <p className="mb-2 text-sm font-semibold">멤버 {members.length}명</p>
            <ul className="card flex flex-col gap-3 p-4">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3">
                  <Avatar avatarKey={m.profile?.avatar_key} size={30} />
                  <span className="flex-1 text-sm">{m.profile?.nickname ?? DELETED_USER}</span>
                  {m.user_id === me && <span className="text-xs text-ink-soft">나</span>}
                  {m.role === "host" && <span className="text-xs text-point-strong">방장</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/** 길게 누르기(모바일) + 우클릭(데스크톱) */
function LongPress({ onLongPress, children }: { onLongPress: () => void; children: React.ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <div
      className="select-none [-webkit-touch-callout:none]"
      onPointerDown={() => {
        clear();
        timer.current = setTimeout(onLongPress, 450);
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress();
      }}
    >
      {children}
    </div>
  );
}

