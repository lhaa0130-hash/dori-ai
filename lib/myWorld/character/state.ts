// My World — 대표 캐릭터 상태 저장/조회 + Migration (05-03).
// ⚠️ 기존 users 문서는 건드리지 않고 users/{uid}.myWorld.character 아래에만 merge 저장.
//    myWorld 는 비-PII 라 기존 users write 규칙 그대로 통과(규칙 변경 없음).
//    성장/감정/의상/포즈 기능은 미구현 — 기본값만 저장한다.
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import type { MyCharacterState, CharacterExpression, CharacterPose } from "@/lib/myWorld/character/types";
import { DEFAULT_CHARACTER_ID, getCharacter, getAllCharacterIds } from "@/lib/myWorld/character/registry";

const VALID_EXPR: CharacterExpression[] = ["default", "happy", "sad", "surprised", "sleepy", "wink"];
const VALID_POSE: CharacterPose[] = ["idle", "wave", "sit", "jump", "cheer"];

/** 원시 저장값을 정규화 + 마이그레이션(잠금 없음 → 12종 owned, 기본값 채움). 순수. */
export function normalizeCharacterState(raw: unknown): MyCharacterState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const selectedId = typeof r.selectedId === "string" && getCharacter(r.selectedId).id === r.selectedId
    ? (r.selectedId as string)
    : DEFAULT_CHARACTER_ID;
  const ch = getCharacter(selectedId);
  const expression = VALID_EXPR.includes(r.expression as CharacterExpression) ? (r.expression as CharacterExpression) : ch.defaultExpression;
  const pose = VALID_POSE.includes(r.pose as CharacterPose) ? (r.pose as CharacterPose) : ch.defaultPose;
  return {
    selectedId,
    owned: getAllCharacterIds(),                 // 잠금 없음 → 항상 전체 보유(마이그레이션)
    expression,
    pose,
    skin: typeof r.skin === "string" ? (r.skin as string) : "default",
    costume: typeof r.costume === "string" ? (r.costume as string) : "default",
    background: typeof r.background === "string" ? (r.background as string) : "default",
  };
}

export function defaultCharacterState(): MyCharacterState {
  return normalizeCharacterState(null);
}

// ── localStorage 표시 캐시(즉시 로드). Firestore 가 원본. ──
const CACHE_KEY = (uid: string) => `myworld_char_${uid}`;
export function getCachedCharacterState(uid: string | null | undefined): MyCharacterState | null {
  if (!uid || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY(uid));
    return raw ? normalizeCharacterState(JSON.parse(raw)) : null;
  } catch { return null; }
}
export function setCachedCharacterState(uid: string, state: MyCharacterState): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CACHE_KEY(uid), JSON.stringify(state)); } catch { /* noop */ }
}

// ── Firestore ──
/** users/{uid}.myWorld.character 읽기 + 정규화/마이그레이션. */
export async function getCharacterState(uid: string): Promise<MyCharacterState> {
  if (!uid) return defaultCharacterState();
  try {
    const snap = await getDoc(doc(getFirebaseFirestore(), "users", uid));
    const ch = snap.exists() ? (snap.data() as any)?.myWorld?.character : null;
    return normalizeCharacterState(ch || null);
  } catch { return defaultCharacterState(); }
}

/**
 * 대표 캐릭터 선택 저장 — users/{uid} merge, myWorld.character 만 갱신.
 *  잠금 없음: owned 는 항상 12종. 확장 필드는 선택 캐릭터 기본값으로.
 */
export async function saveSelectedCharacter(uid: string, characterId: string): Promise<void> {
  if (!uid || !characterId) return;
  const ch = getCharacter(characterId);
  await setDoc(
    doc(getFirebaseFirestore(), "users", uid),
    {
      myWorld: {
        character: {
          selectedId: ch.id,
          owned: getAllCharacterIds(),
          expression: ch.defaultExpression,
          pose: ch.defaultPose,
          skin: "default",
          costume: "default",
          background: "default",
          updatedAt: serverTimestamp(),
        },
      },
    },
    { merge: true }
  );
}
