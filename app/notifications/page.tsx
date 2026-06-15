"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { currentUid, watchNotifications, markAllNotiRead, type Noti, type NotiType } from "@/lib/social";

const CARD =
  "rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950";

const TYPE_EMOJI: Record<NotiType, string> = {
  friend_request: "👋",
  friend_accept: "🤝",
  like: "❤️",
  comment: "💬",
  guestbook: "📖",
  dm: "✉️",
  follow: "➕",
  mention: "@",
  repost: "🔁",
  candy_grant: "🍭",
  premium_grant: "💎",
};

function emojiFor(type: NotiType): string {
  return TYPE_EMOJI[type] || "🔔";
}

/** 상대시간(방금/분/시간/일) 또는 날짜 */
function formatTime(ms: number): string {
  if (!ms) return "";
  try {
    const diff = Date.now() - ms;
    if (diff < 0) return "방금 전";
    const min = Math.floor(diff / 60000);
    if (min < 1) return "방금 전";
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}일 전`;
    return new Date(ms).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function NotificationsPage() {
  const { session, status } = useAuth();
  const [myUid, setMyUid] = useState<string | null>(null);
  const [items, setItems] = useState<Noti[]>([]);

  // 현재 uid 확보 (firebase auth 기반). 세션 변화에 맞춰 재확인.
  useEffect(() => {
    setMyUid(currentUid());
  }, [status, session?.user?.email]);

  // 알림 실시간 구독
  useEffect(() => {
    if (!myUid) {
      setItems([]);
      return;
    }
    const unsub = watchNotifications(setItems);
    return () => unsub();
  }, [myUid]);

  // 진입 후 안 읽은 알림 일괄 읽음 처리(한 번)
  const [marked, setMarked] = useState(false);
  useEffect(() => {
    if (!myUid || marked) return;
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    markAllNotiRead(unreadIds);
    setMarked(true);
  }, [myUid, items, marked]);

  // ── 비로그인: 로그인 유도 ──
  if (status === "unauthenticated" || (status !== "loading" && !myUid)) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className={`p-10 ${CARD} flex flex-col items-center text-center max-w-sm w-full`}>
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-2xl mb-5">
            🔔
          </div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
            로그인이 필요해요
          </h2>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-7 leading-relaxed">
            알림은 로그인 후<br />확인하실 수 있습니다.
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
        <p className="text-[14px] text-neutral-400 font-semibold">불러오는 중입니다</p>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen">
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        <p className="text-[11px] font-semibold text-[#F9954E] mb-1">NOTIFICATIONS</p>
        <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-neutral-950 dark:text-white mb-6">
          알림
        </h1>

        {items.length === 0 ? (
          <div className={`${CARD} px-4 py-16 text-center`}>
            <div className="text-3xl mb-3 opacity-30">🔔</div>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">새 알림이 없어요</p>
          </div>
        ) : (
          <div className={`${CARD} overflow-hidden divide-y divide-neutral-50 dark:divide-zinc-900/60`}>
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.link || "#"}
                className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-zinc-900/50 ${
                  item.read ? "" : "bg-[#F9954E]/5"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center text-[18px] shrink-0">
                  {emojiFor(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-neutral-900 dark:text-white truncate">
                      {item.fromName}
                    </span>
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F9954E] shrink-0" />
                    )}
                  </div>
                  <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed break-words">
                    {item.text}
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {formatTime(item.at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
