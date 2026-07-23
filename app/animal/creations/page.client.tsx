"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listPublicCreations, likeCreation, deleteCreation, type Creation } from "@/lib/userAnimals";
import { getFirebaseAuth } from "@/lib/firebase";

const ADMIN_EMAIL = "lhaa0130@gmail.com";

export default function CreationsClient() {
  const { session, status } = useAuth();
  const [items, setItems] = useState<Creation[] | null>(null);
  const [detail, setDetail] = useState<Creation | null>(null);
  // 04-11: 요청 중인 창작물 id — 응답 전 재클릭을 막는다.
  //  arrayUnion 은 uid 중복을 막아주지만 increment 는 누를 때마다 더해져 count 가 어긋난다.
  //  ⚠️ 가드를 state 로만 두면 같은 렌더 사이클의 연속 클릭을 못 막는다(setState 가 비동기라
  //     두 번째 클릭 핸들러가 아직 비어 있는 이전 state 를 본다 — 실측으로 4회 클릭이 전부 통과했다).
  //     그래서 판정은 ref 로 즉시 하고, state 는 버튼 disabled 표시용으로만 함께 갱신한다.
  const likeBusyRef = useRef<Set<string>>(new Set());
  const [likeBusy, setLikeBusy] = useState<Set<string>>(new Set());
  const [likeError, setLikeError] = useState("");
  // 04-14 삭제 상태 — ref 로 동기 중복삭제 차단, state 로 진행/오류 안내
  const deletingRef = useRef<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState("");
  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL;
  const myUid = (() => { try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; } })();

  const load = useCallback(async () => { setItems(await listPublicCreations(80)); }, []);
  // ⚠️ Firebase 세션 복원은 비동기라 마운트 직후에는 currentUser 가 null 이다.
  //    그 시점에 계산한 likedByMe 는 전부 false 가 되어 '내가 누른 좋아요'가 안 보인다.
  //    session 이 확정될 때마다 다시 불러 상태를 맞춘다(04-8B 상세 페이지와 같은 부류의 문제).
  useEffect(() => { load(); }, [load, session]);

  async function toggleLike(c: Creation) {
    if (status !== "authenticated") { window.location.href = "/login?next=/animal/creations"; return; }
    if (likeBusyRef.current.has(c.id)) return; // 응답 전 재클릭 차단(동기 판정)
    const like = !c.likedByMe;
    const delta = like ? 1 : -1;
    likeBusyRef.current.add(c.id);
    setLikeBusy(new Set(likeBusyRef.current));
    setLikeError("");
    // 낙관적 반영 — 실패하면 아래에서 정확히 되돌린다
    const apply = (d: number, liked: boolean) => {
      setItems((arr) => arr?.map((x) => x.id === c.id ? { ...x, likedByMe: liked, likeCount: Math.max(0, x.likeCount + d) } : x) || arr);
      setDetail((dd) => dd && dd.id === c.id ? { ...dd, likedByMe: liked, likeCount: Math.max(0, dd.likeCount + d) } : dd);
    };
    apply(delta, like);
    const ok = await likeCreation(c.id, like);
    if (!ok) {
      apply(-delta, !like); // rollback — 카운트·상태 원복
      setLikeError("좋아요 처리에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
    likeBusyRef.current.delete(c.id);
    setLikeBusy(new Set(likeBusyRef.current));
  }
  async function remove(c: Creation) {
    if (deletingRef.current.has(c.id)) return; // 동기 중복삭제 차단
    if (!confirm(`"${c.animal_name}"을(를) 삭제할까요?`)) return;
    deletingRef.current.add(c.id);
    setDeleting(new Set(deletingRef.current));
    setDeleteError("");
    const ok = await deleteCreation(c.id); // 04-14: Storage 이미지까지 안전 삭제(공유 파일은 유지)
    if (ok) {
      setItems((arr) => arr?.filter((x) => x.id !== c.id) || arr);
      setDetail(null);
    } else {
      setDeleteError("삭제하지 못했어요. 잠시 후 다시 시도해 주세요."); // 목록·모달 유지 → 재시도 가능
    }
    deletingRef.current.delete(c.id);
    setDeleting(new Set(deletingRef.current));
  }

  return (
    <main className="w-full min-h-screen max-w-5xl mx-auto px-4 pt-8 pb-20">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <a href="/animal" className="text-[13px] font-bold text-stone-400 hover:text-[#F9954E]">← 동물도감</a>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold text-stone-950 dark:text-white mt-2 break-keep">🖼️ 친구들이 만든 동물</h1>
          <p className="text-[14px] text-stone-400 dark:text-stone-500 break-keep">회원들이 상상해서 만든 나만의 동물들이에요.</p>
        </div>
        <a href="/animal/create" className="rounded-full bg-gradient-to-r from-[#F9954E] to-[#f97e6d] px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:brightness-105 transition">🐣 나도 만들기</a>
      </div>

      {items === null ? (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded-2xl aspect-[4/5] bg-stone-100 dark:bg-zinc-900 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[15px] font-bold text-stone-500">아직 만들어진 동물이 없어요.</p>
          <a href="/animal/create" className="inline-block mt-3 rounded-full bg-[#F9954E] px-5 py-2.5 text-[14px] font-bold text-white">첫 번째 동물 만들기 →</a>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((c) => (
            <div key={c.id} className="group text-left bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <button onClick={() => setDetail(c)} className="block w-full">
                <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 dark:bg-zinc-900">
                  <img src={c.imageUrl} alt={c.animal_name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 rounded-full bg-black/45 text-white text-[10px] font-bold px-2 py-0.5 backdrop-blur">{c.taxonomy_group}</span>
                </div>
                <div className="p-2.5">
                  <div className="font-bold text-[13px] text-stone-900 dark:text-white truncate">{c.animal_name}</div>
                  <div className="text-[11px] text-stone-400 truncate">by {c.authorName}</div>
                </div>
              </button>
              <button
                onClick={() => toggleLike(c)}
                disabled={likeBusy.has(c.id)}
                aria-pressed={c.likedByMe}
                aria-label={`${c.animal_name} ${c.likedByMe ? "좋아요 취소" : "좋아요"} (현재 ${c.likeCount}개)`}
                className="w-full min-h-11 flex items-center justify-center gap-1 py-2.5 text-[12px] font-bold transition disabled:opacity-50"
                style={{ color: c.likedByMe ? "#F9954E" : undefined }}
              >
                <span className={c.likedByMe ? "" : "text-stone-400"}>{c.likedByMe ? "❤️" : "🤍"}</span>
                <span className={c.likedByMe ? "text-[#F9954E]" : "text-stone-400"}>{c.likeCount}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="relative w-full max-w-sm max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 text-white text-lg leading-none backdrop-blur">×</button>
            <div className="relative aspect-[4/5] bg-stone-100 dark:bg-zinc-900">
              <img src={detail.imageUrl} alt={detail.animal_name} className="w-full h-full object-cover" />
              {detail.status?.label && <span className="absolute top-3 left-3 rounded-full text-white text-[11px] font-bold px-2.5 py-1" style={{ background: detail.status.color }}>{detail.status.label}</span>}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-white break-keep">{detail.animal_name}</h3>
                <span className="text-[11px] font-bold text-amber-500">{"★".repeat(Math.max(0, Math.min(5, detail.rarity)))}{"☆".repeat(5 - Math.max(0, Math.min(5, detail.rarity)))}</span>
              </div>
              <p className="text-[12px] text-stone-400">by {detail.authorName}</p>
              {detail.search_nickname && <p className="text-[13px] text-[#E8832E] dark:text-[#FBAA60] font-bold mt-1">&ldquo;{detail.search_nickname}&rdquo;</p>}
              {detail.kid_friendly_desc && <p className="text-[13px] text-stone-600 dark:text-stone-300 mt-2 leading-relaxed break-keep">{detail.kid_friendly_desc}</p>}
              <div className="mt-3 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 p-3 space-y-1.5">
                {detail.info?.map(([ic, k, v], i) => (
                  <div key={i} className="flex items-start gap-2 text-[12.5px]">
                    <span className="w-5 text-center flex-shrink-0">{ic}</span>
                    <span className="font-bold text-stone-500 dark:text-stone-400 w-12 flex-shrink-0">{k}</span>
                    <span className="text-stone-700 dark:text-stone-300 break-keep">{v}</span>
                  </div>
                ))}
              </div>
              {detail.facts?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {detail.facts.map((f, i) => <li key={i} className="text-[12px] text-stone-500 dark:text-stone-400 pl-3 relative break-keep before:content-['•'] before:absolute before:left-0 before:text-[#F9954E]">{f}</li>)}
                </ul>
              )}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => toggleLike(detail)}
                  disabled={likeBusy.has(detail.id)}
                  aria-pressed={detail.likedByMe}
                  aria-label={detail.likedByMe ? `좋아요 취소 (현재 ${detail.likeCount}개)` : `좋아요 (현재 ${detail.likeCount}개)`}
                  className="flex-1 min-h-11 rounded-2xl border border-stone-200 dark:border-zinc-800 py-2.5 text-[13px] font-bold transition disabled:opacity-50"
                  style={{ color: detail.likedByMe ? "#F9954E" : undefined, borderColor: detail.likedByMe ? "#F9954E" : undefined }}
                >
                  {detail.likedByMe ? "❤️" : "🤍"} 좋아요 {detail.likeCount}
                </button>
                {(isAdmin || (myUid && myUid === detail.uid)) && (
                  <button
                    onClick={() => remove(detail)}
                    disabled={deleting.has(detail.id)}
                    aria-label={`${detail.animal_name} 삭제`}
                    className="rounded-2xl border border-red-200 dark:border-red-900/50 text-red-500 px-4 py-2.5 text-[13px] font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
                  >
                    {deleting.has(detail.id) ? "삭제 중…" : "삭제"}
                  </button>
                )}
              </div>
              {deleting.has(detail.id) && <p role="status" className="mt-2 text-[12px] text-stone-400">삭제하는 중이에요…</p>}
              {/* 04-11: 좋아요 실패를 조용히 넘기지 않는다(가짜 성공 금지) */}
              {likeError && <p role="alert" className="mt-2 text-[12px] text-red-500 break-words">{likeError}</p>}
              {deleteError && <p role="alert" className="mt-2 text-[12px] text-red-500 break-words">{deleteError}</p>}
            </div>
          </div>
        </div>
      )}
      {/* 목록에서 좋아요가 실패한 경우의 안내(모달이 닫혀 있을 때) */}
      {likeError && !detail && (
        <p role="alert" className="mt-6 text-center text-[13px] text-red-500 break-words">{likeError}</p>
      )}
    </main>
  );
}
