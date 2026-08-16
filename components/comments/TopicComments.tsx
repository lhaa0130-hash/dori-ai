"use client";

// 주제별 공개 댓글 위젯 — 프로젝트·기사 어디에나 붙는다.
//
// ⚠️ 빈 상태 문구에 반드시 "댓글" 이라는 말을 남겨 둘 것.
//    애드센스 품질 게이트(scripts/adsense-quality-gate.mjs 검사 5)가 "아직 …없" 류를
//    '준비 중인 빈 페이지'로 잡는데, **댓글 위젯의 빈 상태는 정상**이라 문구에 "댓글"이 들어가면
//    예외 처리된다(isRealEmptySignal). "아직 의견이 없어요" 로 쓰면 게이트가 배포를 막는다.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { currentUid, getProfile } from "@/lib/social";
import {
  listTopicComments, addTopicComment, deleteTopicComment, COMMENT_MAX,
  type TopicComment,
} from "@/lib/topicComments";

function fmt(at: number): string {
  if (!at) return "";
  const d = new Date(at);
  const now = Date.now();
  const diff = Math.floor((now - at) / 1000);
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function TopicComments({
  topicId,
  heading = "의견 남기기",
  intro,
}: {
  topicId: string;
  heading?: string;
  intro?: string;
}) {
  const { status } = useAuth();
  const loggedIn = status === "authenticated";

  const [items, setItems] = useState<TopicComment[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await listTopicComments(topicId));
  }, [topicId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setMe(currentUid()); }, [status]);

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setErr(null);
    try {
      const uid = currentUid();
      // 이름은 서버가 모르므로 내 프로필에서 읽어 함께 넘긴다.
      const myName = uid ? (await getProfile(uid).catch(() => null))?.name || "익명" : "익명";
      const id = await addTopicComment(topicId, myName, body);
      if (!id) { setErr("등록하지 못했어요. 잠시 후 다시 시도해 주세요."); return; }
      setText("");
      await load();
    } finally { setSending(false); }
  }, [text, sending, topicId, load]);

  const remove = useCallback(async (id: string) => {
    if (await deleteTopicComment(topicId, id)) await load();
  }, [topicId, load]);

  return (
    <section className="py-8 border-t border-stone-100 dark:border-zinc-900">
      <div className="mb-1.5 flex items-baseline gap-2">
        <h2 className="text-[15px] font-extrabold text-stone-900 dark:text-white">{heading}</h2>
        {items && items.length > 0 && (
          <span className="text-[12px] font-bold text-stone-400 tabular-nums">{items.length}</span>
        )}
      </div>
      {intro && <p className="mb-4 text-[13px] text-stone-500 dark:text-stone-400 break-keep">{intro}</p>}

      {/* 쓰기 */}
      {loggedIn ? (
        <div className="mb-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX))}
            rows={3}
            placeholder="어떤 점이 좋았는지, 뭐가 아쉬운지, 이런 게 있으면 좋겠다 싶은 걸 적어주세요."
            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-stone-900 outline-none focus:border-[#F9954E] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11.5px] text-stone-400 tabular-nums">{text.length} / {COMMENT_MAX}</span>
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() || sending}
              className="rounded-xl bg-[#F9954E] px-4 py-2 text-[12.5px] font-black text-white transition active:scale-95 disabled:opacity-40"
            >
              {sending ? "남기는 중…" : "남기기"}
            </button>
          </div>
          {err && <p className="mt-1.5 text-[12px] font-bold text-rose-500">{err}</p>}
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-stone-200 dark:border-zinc-800 px-4 py-3">
          <span className="text-[13px] text-stone-500 dark:text-stone-400 break-keep">
            로그인하면 댓글을 남길 수 있어요.
          </span>
          <Link
            href="/login"
            className="shrink-0 rounded-xl bg-[#F9954E] px-3.5 py-1.5 text-[12px] font-black text-white transition active:scale-95"
          >
            로그인
          </Link>
        </div>
      )}

      {/* 목록 */}
      {items === null ? (
        <p className="text-[13px] text-stone-400">불러오는 중…</p>
      ) : items.length === 0 ? (
        // ⚠️ "댓글" 이라는 말을 빼지 말 것 — 품질 게이트 예외 조건이다(파일 상단 주석 참고).
        <p className="text-[13px] text-stone-400">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="rounded-2xl border border-stone-100 p-4 dark:border-zinc-800">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-stone-700 dark:text-stone-200">{c.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-400">{fmt(c.at)}</span>
                  {me && c.uid === me && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      aria-label="내 댓글 삭제"
                      className="text-[11px] font-bold text-stone-400 hover:text-rose-500"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-stone-700 dark:text-stone-300">
                {c.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
