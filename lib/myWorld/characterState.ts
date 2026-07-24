// My World — 대표 캐릭터 상태 저장/조회 (05-02).
// ⚠️ 기존 users 문서는 유지하고, 신규 필드는 users/{uid}.myWorld.character 아래에만 추가한다(merge).
//    myWorld 는 PII 가 아니므로 기존 users write 규칙(PII 키만 차단)으로 그대로 쓰기 가능(규칙 변경 없음).
//    성장/의상/표정/포즈/3D 는 이번 단계에서 쓰지 않는다(타입에 자리만).
import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { DEFAULT_CHARACTER_ID } from "@/lib/myWorld/characters";

// 향후 확장 자리(skins/expression/pose 등)는 optional 로만 둔다 — 이번 단계 미사용.
export interface MyCharacterState {
  selectedId: string;
  owned: string[];
  // skins?: Record<string, string[]>;
  // expression?: string;
  // pose?: string;
}

function defaultState(): MyCharacterState {
  return { selectedId: DEFAULT_CHARACTER_ID, owned: [DEFAULT_CHARACTER_ID] };
}

// ── localStorage 표시 캐시(즉시 로드용). Firestore 가 진짜 원본. ──
const CACHE_KEY = (uid: string) => `myworld_char_${uid}`;

export function getCachedCharacter(uid: string | null | undefined): MyCharacterState | null {
  if (!uid || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY(uid));
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.selectedId !== "string") return null;
    return { selectedId: p.selectedId, owned: Array.isArray(p.owned) ? p.owned : [DEFAULT_CHARACTER_ID] };
  } catch {
    return null;
  }
}

export function setCachedCharacter(uid: string, state: MyCharacterState): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CACHE_KEY(uid), JSON.stringify(state)); } catch { /* noop */ }
}

// ── Firestore 원본 ──
/** users/{uid}.myWorld.character 읽기. 없으면 기본(도리 보유·선택). */
export async function getMyCharacterState(uid: string): Promise<MyCharacterState> {
  if (!uid) return defaultState();
  try {
    const snap = await getDoc(doc(getFirebaseFirestore(), "users", uid));
    const ch = (snap.exists() ? (snap.data() as any)?.myWorld?.character : null) || null;
    const selectedId = typeof ch?.selectedId === "string" ? ch.selectedId : DEFAULT_CHARACTER_ID;
    const owned: string[] = Array.isArray(ch?.owned) ? ch.owned.filter((x: unknown) => typeof x === "string") : [];
    // 기본 지급: 도리는 항상 보유.
    if (!owned.includes(DEFAULT_CHARACTER_ID)) owned.unshift(DEFAULT_CHARACTER_ID);
    return { selectedId, owned };
  } catch {
    return defaultState();
  }
}

/** 대표 캐릭터 선택 저장 — users/{uid} merge, myWorld.character 만 갱신(다른 필드 불변). */
export async function selectMyCharacter(uid: string, characterId: string): Promise<void> {
  if (!uid || !characterId) return;
  await setDoc(
    doc(getFirebaseFirestore(), "users", uid),
    {
      myWorld: {
        character: {
          selectedId: characterId,
          // 도리(기본)와 선택 캐릭터를 보유목록에 합집합으로 추가.
          owned: arrayUnion(DEFAULT_CHARACTER_ID, characterId),
          updatedAt: serverTimestamp(),
        },
      },
    },
    { merge: true }
  );
}
