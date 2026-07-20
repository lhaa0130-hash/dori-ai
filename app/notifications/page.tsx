"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { currentUid, watchNotifications, markAllNotiRead, type Noti, type NotiType } from "@/lib/social";

const CARD =
  "rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950";

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

const T = {
  ko: {
    loginRequiredTitle: "로그인이 필요해요",
    loginRequiredL1: "알림은 로그인 후",
    loginRequiredL2: "확인하실 수 있습니다.",
    goLogin: "로그인하러 가기",
    loading: "불러오는 중입니다",
    title: "알림",
    empty: "새 알림이 없어요",
    justNow: "방금 전",
    minutesAgo: (n: number) => `${n}분 전`,
    hoursAgo: (n: number) => `${n}시간 전`,
    daysAgo: (n: number) => `${n}일 전`,
    dateLocale: "ko-KR",
  },
  en: {
    loginRequiredTitle: "Log in required",
    loginRequiredL1: "Log in to view",
    loginRequiredL2: "your notifications.",
    goLogin: "Go to log in",
    loading: "Loading",
    title: "Notifications",
    empty: "No notifications yet",
    justNow: "Just now",
    minutesAgo: (n: number) => `${n} minute${n === 1 ? "" : "s"} ago`,
    hoursAgo: (n: number) => `${n} hour${n === 1 ? "" : "s"} ago`,
    daysAgo: (n: number) => `${n} day${n === 1 ? "" : "s"} ago`,
    dateLocale: "en-US",
  },
} as const;

/** 상대시간(방금/분/시간/일) 또는 날짜 */
function formatTime(ms: number, t: (typeof T)["ko"] | (typeof T)["en"]): string {
  if (!ms) return "";
  try {
    const diff = Date.now() - ms;
    if (diff < 0) return t.justNow;
    const min = Math.floor(diff / 60000);
    if (min < 1) return t.justNow;
    if (min < 60) return t.minutesAgo(min);
    const hr = Math.floor(min / 60);
    if (hr < 24) return t.hoursAgo(hr);
    const day = Math.floor(hr / 24);
    if (day < 7) return t.daysAgo(day);
    return new Date(ms).toLocaleString(t.dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function NotificationsPage() {
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const t = T[isEn ? "en" : "ko"];
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
          <div className="w-14 h-14 rounded-2xl bg-[#FBEEE7] dark:bg-[#F9954E]/10 flex items-center justify-center text-2xl mb-5">
            🔔
          </div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-stone-900 dark:text-white mb-2">
            {t.loginRequiredTitle}
          </h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 mb-7 leading-relaxed">
            {t.loginRequiredL1}<br />{t.loginRequiredL2}
          </p>
          <Link
            href={isEn ? "/en/login" : "/login"}
            className="w-full py-3.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 transition-opacity text-center"
          >
            {t.goLogin}
          </Link>
        </div>
      </main>
    );
  }

  // ── 로딩 ──
  if (status === "loading" || !myUid) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-5" />
        <p className="text-[14px] text-stone-400 font-semibold">{t.loading}</p>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen">
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        <p className="text-[11px] font-semibold text-[#F9954E] mb-1">NOTIFICATIONS</p>
        <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-stone-950 dark:text-white mb-6">
          {t.title}
        </h1>

        {items.length === 0 ? (
          <div className={`${CARD} px-4 py-16 text-center`}>
            <div className="text-3xl mb-3 opacity-30">🔔</div>
            <p className="text-[13px] text-stone-500 dark:text-stone-400">{t.empty}</p>
          </div>
        ) : (
          <div className={`${CARD} overflow-hidden divide-y divide-stone-50 dark:divide-zinc-900/60`}>
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.link || "#"}
                className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-stone-50 dark:hover:bg-zinc-900/50 ${
                  item.read ? "" : "bg-[#F9954E]/5"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-[18px] shrink-0">
                  {emojiFor(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-stone-900 dark:text-white truncate">
                      {item.fromName}
                    </span>
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F9954E] shrink-0" />
                    )}
                  </div>
                  <p className="text-[13px] text-stone-600 dark:text-stone-300 leading-relaxed break-words">
                    {item.text}
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    {formatTime(item.at, t)}
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
