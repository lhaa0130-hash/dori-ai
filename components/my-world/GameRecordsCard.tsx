"use client";

// 마이월드 / 공개 홈 공용 게임 기록.
//
// 2026-08-14: 코지홈에 있던 전적 표시를 마이월드로 옮겼다. lib/social.getUserRecords(uid) 는
// RANKED_GAMES 목록을 돌며 leaderboards 에서 그 사람의 최고 기록만 뽑아 준다.
//
// ⚠️ order 가 "asc" 인 종목이 있다(슬라이드 퍼즐=무브 수, 숫자 맞추기=시도 횟수, 반응속도=ms).
//    이런 건 **낮을수록 잘한 것**이라 "최고 기록"이라는 말이 뒤집힌다. 단위를 그대로 보여주고
//    낮을수록 좋은 종목은 표시로 구분한다 — 안 그러면 잘한 사람이 못한 것처럼 보인다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserRecords, type GameRecord } from "@/lib/social";

export default function GameRecordsCard({ uid, isOwner }: { uid: string; isOwner: boolean }) {
  const [records, setRecords] = useState<GameRecord[] | null>(null);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    getUserRecords(uid)
      .then((r) => { if (alive) setRecords(r); })
      .catch(() => { if (alive) setRecords([]); });
    return () => { alive = false; };
  }, [uid]);

  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-stone-900 dark:text-white">게임 기록</h2>
        <Link href="/minigame" className="text-[12px] font-bold text-[#F9954E] hover:underline">미니게임 →</Link>
      </div>

      {records === null ? (
        <p className="text-[13px] text-stone-400">불러오는 중…</p>
      ) : records.length === 0 ? (
        <p className="text-[13px] text-stone-400">
          {isOwner ? "아직 기록이 없어요. 미니게임을 하면 여기에 쌓입니다." : "아직 기록이 없어요."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {records.map((r) => (
            <li key={r.game} className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2.5 dark:bg-zinc-900">
              <span className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">
                {r.label}
                {r.order === "asc" && <span className="ml-1.5 text-[11px] font-normal text-stone-400">낮을수록 좋음</span>}
              </span>
              <span className="text-[13.5px] font-extrabold tabular-nums text-stone-900 dark:text-white">
                {r.score.toLocaleString()}<span className="ml-0.5 text-[11.5px] font-bold text-stone-400">{r.unit}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
