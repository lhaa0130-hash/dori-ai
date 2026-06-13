"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { subscribeBotMessages, markBotMessageRead, BotMessage, KIND_LABEL, ILLO_BOT } from "@/lib/illo/bot";

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default function InboxClient() {
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) { setMessages([]); return; }
    const unsub = subscribeBotMessages(uid, setMessages);
    return () => unsub();
  }, [uid]);

  const unread = messages.filter((m) => !m.read).length;

  const open = (m: BotMessage) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.read) markBotMessageRead(m.id);
  };

  if (authReady && !uid) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🤖</div>
        <h1 className="text-xl font-bold mb-2">illo 봇 알림함</h1>
        <p className="text-gray-500 dark:text-gray-400">로그인하면 illo 봇이 보낸 알림과 메시지를 볼 수 있어요.</p>
        <a href="/login" className="inline-block mt-5 px-5 py-2.5 rounded-full bg-[#F5821F] text-white font-semibold">로그인하기</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full bg-[#F5821F]/15 flex items-center justify-center text-2xl">🤖</div>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            {ILLO_BOT.name}
            {unread > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5821F] text-white">{unread}</span>}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">알림 · 메시지 · 사이트 소식</p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>아직 받은 메시지가 없어요.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => {
            const k = KIND_LABEL[m.kind] || KIND_LABEL.notice;
            const isOpen = openId === m.id;
            return (
              <li
                key={m.id}
                onClick={() => open(m)}
                className={`rounded-2xl border p-4 cursor-pointer transition ${m.read ? "border-gray-200 dark:border-gray-800" : "border-[#F5821F]/40 bg-[#F5821F]/5"}`}
              >
                <div className="flex items-start gap-3">
                  {!m.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#F5821F] shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{k.emoji} {k.label}</span>
                      <span className="text-xs text-gray-400 ml-auto">{timeAgo(m.createdAt)}</span>
                    </div>
                    <p className={`text-sm truncate ${m.read ? "font-medium" : "font-bold"}`}>{m.title || m.body.slice(0, 40)}</p>
                    {isOpen ? (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{m.body}</p>
                        {m.link && (
                          <a href={m.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-block mt-3 text-sm text-[#F5821F] font-semibold underline">
                            열어보기 →
                          </a>
                        )}
                      </div>
                    ) : (
                      m.body && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{m.body}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-center text-[11px] text-gray-400 mt-8">illo 봇이 새 글·소식을 여기로 보냅니다. 곧 답장·푸시 알림도 추가됩니다.</p>
    </div>
  );
}
