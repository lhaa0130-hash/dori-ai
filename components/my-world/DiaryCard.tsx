"use client";

// My World — AI 일기 타임라인(05-04 MVP).
//  자동 기록(대표 캐릭터 변경 등)을 최신 10개, 오늘/어제/이번 주로 묶어 보여준다.
//  ⚠️ AI 생성 없음 — 저장된 자동 문장만 표시. 향후 서버 생성 요약으로 content 교체 가능.
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useDiary } from "@/contexts/DiaryContext";
import { getCharacter } from "@/lib/myWorld/character/registry";
import type { DiaryEntry } from "@/lib/myWorld/diary/types";
import { DIARY_UI_LIMIT } from "@/lib/myWorld/diary/constants";
import { DIARY_GROUP_LABEL, formatDiaryTime, groupEntriesByTime } from "@/lib/myWorld/diary/utils";

function DiaryRow({ entry }: { entry: DiaryEntry }) {
  const ch = getCharacter(entry.characterId);
  return (
    <li className="flex items-start gap-3">
      {/* 아이콘 · 색 점 */}
      <span
        className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full text-[17px]"
        style={{ backgroundColor: `${entry.color}1f` }}
        aria-hidden
      >
        {entry.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[13px] font-extrabold text-stone-900 dark:text-white">{entry.title}</p>
          <time className="flex-none text-[11px] font-semibold text-stone-400">{formatDiaryTime(entry.createdAt)}</time>
        </div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-stone-600 dark:text-stone-300">{entry.content}</p>
        <p className="mt-0.5 text-[11px] font-semibold" style={{ color: entry.color }}>
          {ch.emoji} {ch.name}
        </p>
      </div>
    </li>
  );
}

export default function DiaryCard() {
  const { status } = useAuth();
  const { entries, loading } = useDiary();
  const loggedIn = status === "authenticated";
  const groups = groupEntriesByTime(entries.slice(0, DIARY_UI_LIMIT));

  return (
    <section className="relative rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-stone-900 dark:text-white">AI 일기</h2>
        <span className="rounded-full bg-[#F9954E]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#F9954E]">타임라인</span>
      </div>

      {/* 비로그인 — 읽기는 되지만 기록이 없음, 로그인 유도(§13) */}
      {!loggedIn ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <p className="text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
              로그인하면 오늘의 추억이 기록돼요.
            </p>
          </div>
          <Link href="/login" className="flex-none rounded-xl bg-[#F9954E] px-3 py-1.5 text-[12px] font-black text-white">로그인</Link>
        </div>
      ) : loading && entries.length === 0 ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 flex-none animate-pulse rounded-full bg-stone-100 dark:bg-zinc-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 animate-pulse rounded bg-stone-100 dark:bg-zinc-800" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-stone-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        // 빈 상태(§8)
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-stone-50 px-4 py-8 text-center dark:bg-zinc-900/60">
          <span className="text-3xl">🌱</span>
          <p className="text-[13px] font-semibold text-stone-500 dark:text-stone-400">오늘의 첫 추억을 만들어보세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-stone-400">{DIARY_GROUP_LABEL[g.key]}</p>
              <ul className="space-y-3">
                {g.entries.map((e) => <DiaryRow key={e.id} entry={e} />)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
