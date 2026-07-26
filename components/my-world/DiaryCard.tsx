"use client";

// My World — AI 일기 타임라인.
//  자동 기록(대표 캐릭터 변경 등)을 최신 10개, 오늘/어제/이번 주로 묶어 보여준다.
//  ⚠️ AI 생성 없음 — 저장된 자동 문장만 표시. 향후 서버 생성 요약으로 content 교체 가능.
//
//  상태를 5가지로 명시한다: 비로그인 · 로딩 · 오류 · 빈 상태 · 목록.
//  이전에는 조회 실패가 빈 상태로 위장돼 "기록이 없다"와 "불러오지 못했다"를 구별할 수 없었다.
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useDiary } from "@/contexts/DiaryContext";
import { getCharacter } from "@/lib/myWorld/character/registry";
import type { DiaryEntry } from "@/lib/myWorld/diary/types";
import { DIARY_UI_LIMIT } from "@/lib/myWorld/diary/constants";
import {
  DIARY_GROUP_LABEL,
  diaryTimeAttr,
  formatDiaryStamp,
  groupEntriesByTime,
  type DiaryGroupKey,
} from "@/lib/myWorld/diary/utils";

function DiaryRow({ entry, group }: { entry: DiaryEntry; group: DiaryGroupKey }) {
  const ch = getCharacter(entry.characterId);
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full text-[17px]"
        style={{ backgroundColor: `${entry.color}1f` }}
        aria-hidden
      >
        {entry.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          {/* 제목은 잘리지 않게 줄바꿈을 허용하고, 단어 중간에서 끊기지 않도록 break-keep */}
          <p className="min-w-0 break-keep text-[13px] font-extrabold text-stone-900 dark:text-white">{entry.title}</p>
          <time
            dateTime={diaryTimeAttr(entry.createdAt)}
            className="flex-none whitespace-nowrap text-[11px] font-semibold tabular-nums text-stone-400"
          >
            {formatDiaryStamp(entry.createdAt, group)}
          </time>
        </div>
        <p className="mt-0.5 break-keep text-[13px] leading-relaxed text-stone-600 dark:text-stone-300">{entry.content}</p>
        <p className="mt-0.5 text-[11px] font-semibold" style={{ color: entry.color }}>
          {ch.emoji} {ch.name}
        </p>
      </div>
    </li>
  );
}

function LoginPrompt({ message }: { message: string }) {
  // 좁은 화면에서 문구가 버튼에 밀려 "기 / 록돼요" 처럼 글자 단위로 쪼개지던 문제 →
  // break-keep(word-break: keep-all)으로 어절 안에서 끊기지 않게 하고, 버튼은 flex-none 으로 지킨다.
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900/60">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex-none text-2xl" aria-hidden>📖</span>
        <p className="break-keep text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">{message}</p>
      </div>
      <Link
        href="/login?next=/my-world"
        className="flex min-h-[44px] flex-none items-center justify-center whitespace-nowrap rounded-xl bg-[#F9954E] px-4 text-[13px] font-black text-white transition hover:bg-[#f0862f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E]"
      >
        로그인
      </Link>
    </div>
  );
}

export default function DiaryCard() {
  const { status } = useAuth();
  const { entries, loading, error, refresh } = useDiary();
  const loggedIn = status === "authenticated";
  const visible = entries.slice(0, DIARY_UI_LIMIT);
  const groups = groupEntriesByTime(visible);

  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5" aria-labelledby="diary-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="diary-heading" className="text-[15px] font-extrabold text-stone-900 dark:text-white">AI 일기</h2>
        <span className="flex-none rounded-full bg-[#F9954E]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#F9954E]">타임라인</span>
      </div>

      {!loggedIn ? (
        <LoginPrompt message="로그인하면 오늘의 추억이 기록돼요." />
      ) : loading && entries.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label="일기를 불러오는 중">
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
      ) : error && entries.length === 0 ? (
        // 오류 상태 — 빈 상태와 구별한다. Firebase 원문은 노출하지 않는다.
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-center dark:border-amber-900 dark:bg-amber-950/40">
          <span className="text-2xl" aria-hidden>⚠️</span>
          <p className="break-keep text-[13px] font-semibold text-amber-800 dark:text-amber-200">{error}</p>
          <button
            type="button"
            onClick={() => { void refresh(); }}
            className="flex min-h-[44px] items-center rounded-xl bg-white px-4 text-[13px] font-bold text-amber-800 shadow-sm transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] dark:bg-zinc-900 dark:text-amber-200"
          >
            다시 시도
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-stone-50 px-4 py-8 text-center dark:bg-zinc-900/60">
          <span className="text-3xl" aria-hidden>🌱</span>
          <p className="break-keep text-[13px] font-semibold text-stone-500 dark:text-stone-400">오늘의 첫 추억을 만들어보세요.</p>
        </div>
      ) : (
        <>
          {/* 목록이 있는데 조회가 실패한 경우 — 화면을 비우지 않고 경고만 덧붙인다. */}
          {error && (
            <p className="mb-2.5 flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <span aria-hidden>⚠️</span> {error}
            </p>
          )}
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.key}>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-stone-400">{DIARY_GROUP_LABEL[g.key]}</p>
                <ul className="space-y-3">
                  {g.entries.map((e) => <DiaryRow key={e.id} entry={e} group={g.key} />)}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
