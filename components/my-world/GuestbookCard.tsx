"use client";

// 마이월드 / 공개 홈 공용 방명록.
//
// 2026-08-14: 코지홈에 있던 방명록을 마이월드로 옮기면서 **주인용·손님용을 한 컴포넌트로** 합쳤다.
//   ownerUid 가 내 uid  → 내 방명록(받은 글 읽기 + 내 글 삭제)
//   ownerUid 가 남의 uid → 남의 방명록(글 남기기 + 내가 쓴 글만 삭제)
// /@핸들 공개 홈에서도 그대로 쓸 수 있게 설계했다 — 방명록은 남이 찾아와 남기는 게 본체라
// 내 페이지에만 두면 절반은 죽은 기능이 된다.
//
// 데이터: guestbook/{ownerUid}/entries/{id}  (lib/social.ts 의 규칙 주석 참고)
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  currentUid, getProfile, listGuestbook, addGuestbookEntry, deleteGuestbookEntry,
  type GuestEntry,
} from "@/lib/social";

const MSG_MAX = 200;

function fmt(at: number): string {
  if (!at) return "";
  const d = new Date(at);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function GuestbookCard({ ownerUid, ownerName }: { ownerUid: string; ownerName?: string }) {
  const { status } = useAuth();
  const loggedIn = status === "authenticated";
  const me = currentUid();
  const isOwner = !!me && me === ownerUid;

  const [entries, setEntries] = useState<GuestEntry[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await listGuestbook(ownerUid).catch(() => []);
    setEntries(list);
  }, [ownerUid]);

  useEffect(() => { load(); }, [load]);

  const send = useCallback(async () => {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setErr(null);
    try {
      const uid = currentUid();
      // 작성자 이름은 서버가 모르므로 내 프로필에서 읽어 함께 넘긴다(lib 계약).
      const myName = uid ? (await getProfile(uid)).name : "익명";
      const ok = await addGuestbookEntry(ownerUid, myName || "익명", message.slice(0, MSG_MAX));
      if (!ok) { setErr("남기지 못했어요. 잠시 후 다시 시도해 주세요."); return; }
      setText("");
      await load();
    } finally { setSending(false); }
  }, [text, sending, ownerUid, load]);

  const remove = useCallback(async (id: string) => {
    const ok = await deleteGuestbookEntry(ownerUid, id);
    if (ok) await load();
  }, [ownerUid, load]);

  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-[15px] font-extrabold text-stone-900 dark:text-white">방명록</h2>

      {/* 쓰기 — 비로그인은 안내만. 본인 방명록에도 쓸 수 있게 둔다(스스로 메모하는 용도). */}
      {loggedIn ? (
        <div className="mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MSG_MAX))}
            rows={2}
            placeholder={isOwner ? "내 세계에 메모를 남겨보세요." : `${ownerName || "이 사람"}에게 인사를 남겨보세요.`}
            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-[13.5px] text-stone-900 outline-none focus:border-[#F9954E] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11.5px] text-stone-400">{text.length} / {MSG_MAX}</span>
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() || sending}
              className="rounded-xl bg-[#F9954E] px-3.5 py-1.5 text-[12px] font-black text-white transition active:scale-95 disabled:opacity-40"
            >
              {sending ? "남기는 중…" : "남기기"}
            </button>
          </div>
          {err && <p className="mt-1 text-[12px] font-bold text-rose-500">{err}</p>}
        </div>
      ) : (
        <p className="mb-4 text-[13px] text-stone-400">로그인하면 글을 남길 수 있어요.</p>
      )}

      {/* 목록 */}
      {entries === null ? (
        <p className="text-[13px] text-stone-400">불러오는 중…</p>
      ) : entries.length === 0 ? (
        <p className="text-[13px] text-stone-400">
          {isOwner ? "아직 받은 글이 없어요." : "아직 남겨진 글이 없어요. 첫 인사를 남겨보세요."}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-stone-100 p-3.5 dark:border-zinc-800">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-stone-700 dark:text-stone-200">{e.fromName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-400">{fmt(e.at)}</span>
                  {/* 내 방명록의 글이거나 내가 쓴 글이면 지울 수 있다 */}
                  {(isOwner || e.fromUid === me) && (
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      aria-label="이 글 삭제"
                      className="text-[11px] font-bold text-stone-400 hover:text-rose-500"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-stone-700 dark:text-stone-300">{e.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
