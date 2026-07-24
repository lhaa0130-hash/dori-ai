// My World — Diary 유틸(조사·id·시간 그룹화). (05-04)
import type { DiaryEntry } from "@/lib/myWorld/diary/types";

// ── 한글 조사(받침 유무) ──
function hasBatchim(str: string): boolean {
  if (!str) return false;
  const code = str.charCodeAt(str.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절 아님
  return (code - 0xac00) % 28 !== 0;
}
export function josaEulReul(name: string): string { return hasBatchim(name) ? "을" : "를"; }
export function josaWaGwa(name: string): string { return hasBatchim(name) ? "과" : "와"; }
export function josaIGa(name: string): string { return hasBatchim(name) ? "이" : "가"; }

// ── id(엔트리 고유). crypto.randomUUID 우선, 폴백. ──
export function makeEntryId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch { /* noop */ }
  return `e_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// ── 시간 표시 ──
export function formatDiaryTime(createdAt: number): string {
  const d = new Date(createdAt);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function localDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export type DiaryGroupKey = "today" | "yesterday" | "thisWeek" | "older";
export const DIARY_GROUP_LABEL: Record<DiaryGroupKey, string> = {
  today: "오늘",
  yesterday: "어제",
  thisWeek: "이번 주",
  older: "이전",
};

// entries(최신순) → 그룹별 배열(빈 그룹 제외, 순서 today→older).
export function groupEntriesByTime(entries: DiaryEntry[], now = Date.now()): { key: DiaryGroupKey; entries: DiaryEntry[] }[] {
  const todayKey = localDayKey(now);
  const yesterdayKey = localDayKey(now - 86400000);
  const weekAgo = now - 7 * 86400000;

  const buckets: Record<DiaryGroupKey, DiaryEntry[]> = { today: [], yesterday: [], thisWeek: [], older: [] };
  for (const e of entries) {
    const k = localDayKey(e.createdAt);
    if (k === todayKey) buckets.today.push(e);
    else if (k === yesterdayKey) buckets.yesterday.push(e);
    else if (e.createdAt >= weekAgo) buckets.thisWeek.push(e);
    else buckets.older.push(e);
  }
  return (["today", "yesterday", "thisWeek", "older"] as DiaryGroupKey[])
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, entries: buckets[k] }));
}
