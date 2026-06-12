"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  currentUid,
  threadIdFor,
  sendDM,
  watchMyThreads,
  watchMessages,
  type DMThread,
  type DMMessage,
} from "@/lib/social";

const POINT = "#F9954E";

function formatTime(ms: number): string {
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

interface ActivePeer {
  uid: string;
  name: string;
}

function MessagesInner() {
  const { session, status } = useAuth();
  const searchParams = useSearchParams();

  const [myUid, setMyUid] = useState<string | null>(null);
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [active, setActive] = useState<ActivePeer | null>(null);
  const [msgs, setMsgs] = useState<DMMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const myName = session?.user?.name || "나";
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 현재 uid 확보 (firebase auth 기반). 세션 변화에 맞춰 재확인.
  useEffect(() => {
    setMyUid(currentUid());
  }, [status, session?.user?.email]);

  // ?to=uid&name= 으로 들어오면 해당 상대와 대화 자동 오픈
  useEffect(() => {
    const to = searchParams.get("to");
    const name = searchParams.get("name");
    if (to) {
      setActive({ uid: to, name: name || "상대" });
    }
  }, [searchParams]);

  // 내 대화방 목록 실시간 구독
  useEffect(() => {
    if (!myUid) {
      setThreads([]);
      return;
    }
    const unsub = watchMyThreads(setThreads);
    return () => unsub();
  }, [myUid]);

  // 선택된 상대의 메시지 실시간 구독
  const threadId = useMemo(() => {
    if (!myUid || !active) return null;
    return threadIdFor(myUid, active.uid);
  }, [myUid, active]);

  useEffect(() => {
    if (!threadId) {
      setMsgs([]);
      return;
    }
    const unsub = watchMessages(threadId, setMsgs);
    return () => unsub();
  }, [threadId]);

  // 메시지 갱신 시 스크롤 하단 자동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, active?.uid]);

  const openThread = useCallback((t: DMThread) => {
    setActive({ uid: t.otherUid, name: t.otherName });
  }, []);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !active || sending) return;
    setSending(true);
    const ok = await sendDM(active.uid, active.name, myName, text);
    if (ok) setDraft("");
    setSending(false);
  }, [draft, active, myName, sending]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ── 비로그인: 로그인 유도 ──
  if (status === "unauthenticated" || (status !== "loading" && !myUid)) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className="p-10 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-2xl mb-5">
            💬
          </div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
            로그인이 필요해요
          </h2>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-7 leading-relaxed">
            1:1 메시지는 로그인 후<br />이용하실 수 있습니다.
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 transition-opacity text-center"
          >
            로그인하러 가기
          </Link>
        </div>
      </main>
    );
  }

  // ── 로딩 ──
  if (status === "loading" || !myUid) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-neutral-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-5" />
        <p className="text-[14px] text-neutral-400 font-semibold">메시지를 불러오는 중입니다</p>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        <p className="text-[11px] font-semibold text-[#F9954E] mb-1">DIRECT MESSAGE</p>
        <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-neutral-950 dark:text-white mb-1">
          메시지
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
          친구와 1:1로 대화를 나눠보세요.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-[300px_1fr] gap-4 sm:h-[68vh]">
          {/* ── 대화 목록 ── (모바일: 대화 선택 시 숨김) */}
          <aside
            className={`${active ? "hidden sm:flex" : "flex"} flex-col rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden`}
          >
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-zinc-900">
              <span className="text-[11px] font-semibold text-[#F9954E]">대화</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="px-4 py-16 text-center">
                  <div className="text-3xl mb-3 opacity-30">📭</div>
                  <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                    아직 대화가 없어요.
                  </p>
                </div>
              ) : (
                threads.map((t) => {
                  const isActive = active?.uid === t.otherUid;
                  return (
                    <button
                      key={t.id}
                      onClick={() => openThread(t)}
                      className={`w-full text-left px-4 py-3 border-b border-neutral-50 dark:border-zinc-900/60 transition-colors ${
                        isActive
                          ? "bg-[#FFF5EB] dark:bg-[#F9954E]/10"
                          : "hover:bg-neutral-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[14px] font-bold text-neutral-900 dark:text-white truncate">
                          {t.otherName}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          {formatTime(t.lastAt)}
                        </span>
                      </div>
                      <p className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate">
                        {t.lastText || "새 대화"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── 대화창 ── (모바일: 미선택 시 숨김) */}
          <section
            className={`${active ? "flex" : "hidden sm:flex"} flex-col rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden min-h-[60vh] sm:min-h-0`}
          >
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="text-4xl mb-3 opacity-30">💬</div>
                <p className="text-[14px] text-neutral-500 dark:text-neutral-400">
                  왼쪽에서 대화를 선택해 주세요.
                </p>
              </div>
            ) : (
              <>
                {/* 대화창 헤더 */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-zinc-900">
                  <button
                    onClick={() => setActive(null)}
                    className="sm:hidden -ml-1 px-2 py-1 rounded-lg text-neutral-500 dark:text-neutral-400 active:opacity-60"
                    aria-label="목록으로"
                  >
                    ←
                  </button>
                  <span className="text-[15px] font-bold text-neutral-900 dark:text-white truncate">
                    {active.name}
                  </span>
                </div>

                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                  {msgs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <p className="text-[13px] text-neutral-400 dark:text-neutral-500">
                        첫 메시지를 보내 대화를 시작해 보세요.
                      </p>
                    </div>
                  ) : (
                    msgs.map((m) => {
                      const mine = m.fromUid === myUid;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-[14px] leading-relaxed break-words whitespace-pre-wrap ${
                              mine
                                ? "bg-[#F9954E] text-white rounded-br-md"
                                : "bg-neutral-100 dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 rounded-bl-md"
                            }`}
                          >
                            {m.text}
                            <span
                              className={`block text-[10px] mt-1 ${
                                mine ? "text-white/70" : "text-neutral-400"
                              }`}
                            >
                              {formatTime(m.at)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* 입력 */}
                <div className="flex items-center gap-2 px-3 py-3 border-t border-neutral-100 dark:border-zinc-900">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="메시지를 입력하세요"
                    className="flex-1 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-[#F9954E]/40"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 transition-opacity disabled:opacity-40"
                  >
                    전송
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="w-full min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-neutral-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin" />
        </main>
      }
    >
      <MessagesInner />
    </Suspense>
  );
}
