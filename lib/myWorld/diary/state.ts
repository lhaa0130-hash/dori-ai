// My World — Diary 상태 저장/조회 + Lazy Migration (05-04).
// ⚠️ 기존 users 문서 유지, users/{uid}.myWorld.diary 아래에만 merge 저장(비-PII → 규칙 변경 없음).
//    entries 는 배열 → 원소에 serverTimestamp 사용 불가(createdAt=클라 ms). 컨테이너 updatedAt 만 serverTimestamp.
//    최신 100개만 Firestore 유지(읽기-수정-쓰기). arrayUnion 은 trim 불가라 미사용.
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import type { DiaryEntry, DiaryEntryInput, DiaryState } from "@/lib/myWorld/diary/types";
import { DIARY_STORE_LIMIT } from "@/lib/myWorld/diary/constants";
import { makeEntryId } from "@/lib/myWorld/diary/utils";

const VALID_TYPES = new Set([
  "attendance", "character_selected", "character_growth", "interaction",
  "mission", "game", "reward", "manual", "system", "visit", "room_updated",
]);

/** 원소 하나 정규화(깨진 값 방어). 유효하지 않으면 null. */
function normalizeEntry(raw: unknown): DiaryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  const createdAt = typeof r.createdAt === "number" ? r.createdAt : null;
  if (!id || createdAt === null) return null;
  const type = typeof r.type === "string" && VALID_TYPES.has(r.type) ? (r.type as DiaryEntry["type"]) : "system";
  return {
    id,
    userId: typeof r.userId === "string" ? r.userId : "",
    characterId: typeof r.characterId === "string" ? r.characterId : "",
    type,
    title: typeof r.title === "string" ? r.title : "",
    content: typeof r.content === "string" ? r.content : "",
    createdAt,
    icon: typeof r.icon === "string" ? r.icon : "✨",
    color: typeof r.color === "string" ? r.color : "#94a3b8",
    metadata: r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : undefined,
  };
}

/**
 * 원시 저장값 → 정규화된 DiaryState. Lazy Migration:
 *  diary 없음/깨짐 → { entries: [] }. 항상 최신순(desc) 정렬.
 */
export function normalizeDiaryState(raw: unknown): DiaryState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const arr = Array.isArray(r.entries) ? r.entries : [];
  const entries = arr
    .map(normalizeEntry)
    .filter((e): e is DiaryEntry => e !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
  return { entries };
}

export function emptyDiaryState(): DiaryState { return { entries: [] }; }

// ── Firestore ──
/** users/{uid}.myWorld.diary 읽기 + 정규화/마이그레이션. */
export async function getDiaryState(uid: string): Promise<DiaryState> {
  if (!uid) return emptyDiaryState();
  try {
    const snap = await getDoc(doc(getFirebaseFirestore(), "users", uid));
    const d = snap.exists() ? (snap.data() as any)?.myWorld?.diary : null;
    return normalizeDiaryState(d || null);
  } catch { return emptyDiaryState(); }
}

/** 현재 entries 를 최신 100개로 잘라 저장(컨테이너만 merge). 순수 helper. */
async function persistEntries(uid: string, entries: DiaryEntry[]): Promise<void> {
  const trimmed = entries.slice(0, DIARY_STORE_LIMIT);
  await setDoc(
    doc(getFirebaseFirestore(), "users", uid),
    { myWorld: { diary: { entries: trimmed, updatedAt: serverTimestamp() } } },
    { merge: true }
  );
}

/**
 * 기록 추가 — 읽기-수정-쓰기(최신 상태 위에 prepend 후 100개로 trim).
 *  서버가 id/userId/createdAt 채움. 반환: 갱신된 DiaryState(추가된 엔트리 포함, desc).
 */
export async function addDiaryEntry(uid: string, input: DiaryEntryInput): Promise<DiaryState> {
  if (!uid) return emptyDiaryState();
  const current = await getDiaryState(uid);
  const entry: DiaryEntry = {
    ...input,
    id: makeEntryId(),
    userId: uid,
    createdAt: Date.now(),
    metadata: input.metadata ?? {},
  };
  const next = [entry, ...current.entries].sort((a, b) => b.createdAt - a.createdAt).slice(0, DIARY_STORE_LIMIT);
  await persistEntries(uid, next);
  return { entries: next };
}

/** 기록 삭제(하드) — id 로 제거 후 저장. 반환: 갱신된 DiaryState. */
export async function removeDiaryEntry(uid: string, entryId: string): Promise<DiaryState> {
  if (!uid) return emptyDiaryState();
  const current = await getDiaryState(uid);
  const next = current.entries.filter((e) => e.id !== entryId);
  await persistEntries(uid, next);
  return { entries: next };
}
