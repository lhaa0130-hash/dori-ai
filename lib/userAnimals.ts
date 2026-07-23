// 나만의 동물 — 생성(CF함수)·이미지 영구저장·프로필 등록·피드 자랑·공개 갤러리.
// 공식 도감(animal-cards.json)과 분리된 Firestore 컬렉션 animalCreations 사용.
import {
  collection, addDoc, getDocs, getDoc, doc, query, where, orderBy, limit as fbLimit,
  serverTimestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase";
import { uploadFeedMedia } from "@/lib/storage";
import { addPost } from "@/lib/social";
import { ref as storageRef, deleteObject } from "firebase/storage";

// ⚠️ info 는 [icon, key, value] 3요소 튜플의 배열 — 동물 시스템 전체(공식 도감+창작물)가 쓰는 UI 표준.
//    그런데 Firestore 는 '배열 안의 배열'을 저장할 수 없어(INVALID_ARGUMENT) animalCreations 등록이
//    항상 실패했다(04-12). 저장할 때만 {icon,key,value} 객체 배열로 바꾸고, 읽을 때 다시 튜플로 되돌려
//    UI 렌더러(4곳)는 그대로 튜플을 받게 한다. => GenAnimal/Creation.info 의 튜플 타입은 유지.
export interface GenAnimal {
  animal_name: string; en: string; search_nickname: string; kid_friendly_desc: string;
  status: { label: string; code: string; color: string };
  rarity: number; taxonomy_group: string;
  info: [string, string, string][]; facts: string[];
  filters: Record<string, string[]>;
}
export interface Creation extends GenAnimal {
  id: string; uid: string; authorName: string; imageUrl: string; prompt: string;
  at: number; likeCount: number; likedByMe: boolean;
}

/** Firestore 에 실제로 저장되는 info 항목 형태(중첩 배열 회피). */
export interface StoredInfoItem { icon: string; key: string; value: string; }

export const CREATION_INFO_MAX = 12;   // info 항목 최대 개수
export const CREATION_FACTS_MAX = 6;   // facts 최대 개수
export const CREATION_FILTER_VALUES_MAX = 12;
const INFO_STR_MAX = 80;
const FACT_STR_MAX = 200;

const db = () => getFirebaseFirestore();
const uid = () => { try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; } };
const tsToMs = (t: any) => (t && typeof t.toMillis === "function" ? t.toMillis() : Number(t) || 0);

const cleanStr = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/**
 * 04-12: info 를 Firestore 저장 가능한 {icon,key,value}[] 로 정규화.
 *  - 원본을 mutate 하지 않는다.
 *  - 현재/과거 튜플 [icon,key,value] 와 이미 객체인 형태를 모두 받는다.
 *  - 문자열이 아니거나 key·value 가 모두 비면 그 항목만 제외(전체 실패 아님).
 *  - 문자열 길이·항목 개수 상한 적용.
 */
export function normalizeCreationInfo(input: unknown): StoredInfoItem[] {
  if (!Array.isArray(input)) return [];
  const out: StoredInfoItem[] = [];
  for (const item of input) {
    let icon: unknown, key: unknown, value: unknown;
    if (Array.isArray(item)) { [icon, key, value] = item; }          // 튜플
    else if (item && typeof item === "object") {                     // 객체
      const o = item as Record<string, unknown>;
      icon = o.icon; key = o.key; value = o.value;
    } else { continue; }
    const norm: StoredInfoItem = { icon: cleanStr(icon, INFO_STR_MAX), key: cleanStr(key, INFO_STR_MAX), value: cleanStr(value, INFO_STR_MAX) };
    if (!norm.key && !norm.value) continue;                          // 의미 없는 항목 제외
    out.push(norm);
    if (out.length >= CREATION_INFO_MAX) break;
  }
  return out;
}

/** 저장된 info(객체 배열, 혹은 과거 튜플)를 UI 가 기대하는 [icon,key,value][] 튜플로 되돌린다. */
function infoToTuples(raw: unknown): [string, string, string][] {
  if (!Array.isArray(raw)) return [];
  const out: [string, string, string][] = [];
  for (const item of raw) {
    if (Array.isArray(item)) {                                       // 과거 튜플(방어적)
      out.push([String(item[0] ?? ""), String(item[1] ?? ""), String(item[2] ?? "")]);
    } else if (item && typeof item === "object") {                  // 신규 객체
      const o = item as Record<string, unknown>;
      out.push([String(o.icon ?? ""), String(o.key ?? ""), String(o.value ?? "")]);
    }
  }
  return out;
}

/** facts(문자열 배열) 정규화 — 문자열만, trim, 빈 항목 제거, 개수·길이 상한. */
function normalizeFacts(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((f) => cleanStr(f, FACT_STR_MAX)).filter(Boolean).slice(0, CREATION_FACTS_MAX);
}

/** filters(Record<string,string[]>) 정규화 — 값 배열은 문자열만·개수 상한, Firestore 미지원 값 제거. */
function normalizeFilters(input: unknown): Record<string, string[]> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    const vals = v.map((x) => cleanStr(x, INFO_STR_MAX)).filter(Boolean).slice(0, CREATION_FILTER_VALUES_MAX);
    out[cleanStr(k, INFO_STR_MAX)] = vals;
  }
  return out;
}

/** CF 엣지 함수로 AI 생성. 성공 시 { animal, imageUrl(fal 임시URL), remaining } */
export async function generateAnimal(prompt: string): Promise<{ ok: true; animal: GenAnimal; imageUrl: string; remaining: number; limit: number } | { ok: false; error: string; remaining?: number }> {
  const u = getFirebaseAuth().currentUser;
  if (!u) return { ok: false, error: "로그인이 필요해요." };
  let idToken = "";
  try { idToken = await u.getIdToken(); } catch { return { ok: false, error: "로그인 정보를 불러오지 못했어요." }; }
  try {
    const r = await fetch("/api/create-animal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, idToken }) });
    const j = await r.json();
    if (!r.ok || !j.ok) return { ok: false, error: j.message || "생성에 실패했어요.", remaining: j.remaining };
    return { ok: true, animal: j.animal, imageUrl: j.imageUrl, remaining: j.remaining, limit: j.limit };
  } catch { return { ok: false, error: "네트워크 오류예요. 잠시 후 다시 시도해 주세요." }; }
}

/**
 * 04-13: persist 결과 계약.
 *  - url: 저장된 이미지 다운로드 URL
 *  - storagePath: 이번 요청이 새로 업로드한 Storage fullPath(보상 삭제용). 신규 업로드가 아니면 null.
 *  - createdByThisRequest: 이번 요청에서 새로 업로드했는가(=삭제해도 되는가).
 *  ⚠️ StorageReference 같은 SDK 객체를 밖으로 내보내지 않는다(직렬화 가능한 값만).
 */
export interface PersistedImage { url: string; storagePath: string | null; createdByThisRequest: boolean; }

/** fal 임시 이미지를 Firebase Storage로 재업로드해 영구 URL 확보.
 *  ⚠️타임아웃 필수: Storage SDK는 실패 시 기본 최대 10분까지 조용히 재시도해 UI가 멈춘 것처럼 보임.
 *  실패 사유(error)를 함께 돌려줘야 사용자가 원인을 볼 수 있음.
 *  04-13: 성공 시 storagePath 를 함께 돌려줘 등록 실패 시 이 파일만 삭제할 수 있게 한다.
 *   이 함수는 항상 '새 업로드'라 createdByThisRequest=true(fal 외부 URL 을 받아 새 파일로 올림).
 *   getDownloadURL 은 uploadFeedMedia 내부에서 이뤄지고 실패 시 파일이 안 남으므로 여기서 별도 정리 불필요. */
export async function persistImage(falUrl: string): Promise<{ image: PersistedImage | null; error?: string }> {
  const withTimeout = <T,>(p: Promise<T>, ms: number, msg: string) =>
    Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let res: Response;
    try { res = await fetch(falUrl, { signal: ctrl.signal }); } finally { clearTimeout(timer); }
    if (!res.ok) return { image: null, error: `이미지를 가져오지 못했어요. (${res.status})` };
    const blob = await res.blob();
    const file = new File([blob], `myanimal_${Date.now()}.jpg`, { type: "image/jpeg" });
    const up = await withTimeout(uploadFeedMedia(file), 45000, "업로드가 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.");
    if (!up.ok) return { image: null, error: up.error };
    return { image: { url: up.result.url, storagePath: up.result.storagePath, createdByThisRequest: true } };
  } catch (e: any) {
    if (e?.name === "AbortError") return { image: null, error: "이미지를 가져오는 데 시간이 너무 걸렸어요. 다시 시도해 주세요." };
    return { image: null, error: e?.message || "이미지 저장에 실패했어요." };
  }
}

/**
 * 04-13: 이번 요청에서 새로 업로드한 이미지를 보상 삭제한다(등록 실패 시).
 *  - createdByThisRequest 가 아니거나 storagePath 가 없으면 아무것도 하지 않는다(외부/기존 URL 오삭제 방지).
 *  - 반드시 현재 로그인 사용자의 업로드 prefix(feed/{uid}/) 안의 '파일'만 삭제한다.
 *    루트·상위폴더·경로 traversal·타인 경로는 전부 거부.
 *  - 이미 없는 파일(object-not-found)은 목표 상태가 이미 성립 → idempotent 성공.
 *  - 권한 오류 등은 throw(호출부가 '보상 실패'로 기록하되 원래 등록 오류를 덮지 않는다).
 */
export async function removePersistedImage(image: PersistedImage | null): Promise<void> {
  if (!image || !image.createdByThisRequest || !image.storagePath) return;
  const me = uid();
  if (!me) return; // 로그아웃 상태면 어차피 규칙이 막는다 — 조용히 종료
  const path = image.storagePath;
  const allowedPrefix = `feed/${me}/`;
  // 허용 prefix 안의 단일 파일만: prefix 로 시작 + 파일명에 '/' 없음(하위폴더 방지) + '..' 없음
  const rest = path.slice(allowedPrefix.length);
  if (!path.startsWith(allowedPrefix) || rest.length === 0 || rest.includes("/") || path.includes("..")) {
    throw new Error("cleanup/path-not-allowed");
  }
  try {
    await deleteObject(storageRef(getFirebaseStorage(), path));
  } catch (e: any) {
    if (e?.code === "storage/object-not-found") return; // 이미 없음 → 성공으로 간주
    throw e;
  }
}

/**
 * 프로필/갤러리에 등록 → animalCreations 문서 생성. imageUrl 은 영구(Storage) URL 권장.
 * 04-12: info 를 {icon,key,value}[] 로 정규화(중첩 배열 저장 실패 해결). facts·filters 도 정규화.
 *  집계·작성자·시각은 클라이언트 입력을 신뢰하지 않고 서버/현재 세션 값으로 강제한다.
 * @returns 생성된 문서 ID
 * @throws 로그인 오류·저장 실패(가짜 성공 금지 — 호출부에서 일반화)
 */
export async function registerCreation(a: GenAnimal, imageUrl: string, prompt: string, authorName: string, storagePath?: string | null): Promise<string> {
  const u = uid();
  if (!u) throw new Error("creation/auth-required");
  const img = cleanStr(imageUrl, 2000);
  if (!img) throw new Error("creation/no-image");

  const status = (a.status && typeof a.status === "object")
    ? { label: cleanStr(a.status.label, INFO_STR_MAX), code: cleanStr(a.status.code, 8), color: cleanStr(a.status.color, 16) }
    : { label: "관심대상", code: "LC", color: "#5BA86B" };
  const rarity = Number.isFinite(a.rarity) ? Math.max(0, Math.min(5, Math.round(a.rarity))) : 2; // NaN/Infinity 방어

  // 04-14: 삭제 시 이 창작물이 올린 Storage 파일을 정확히 지우려면 경로가 필요하다.
  //  본인 업로드 경로(feed/{uid}/…)만 저장(외부 URL 이거나 형식이 다르면 저장하지 않음 → 삭제 시 파일 유지).
  const doc: Record<string, unknown> = {
    uid: u,                                            // 작성자는 현재 세션(입력값 무시)
    authorName: cleanStr(authorName, 20) || "익명",
    imageUrl: img,
    prompt: cleanStr(prompt, 400),
    animal_name: cleanStr(a.animal_name, 40),
    en: cleanStr(a.en, 60),
    search_nickname: cleanStr(a.search_nickname, 40),
    kid_friendly_desc: cleanStr(a.kid_friendly_desc, 400),
    status, rarity, taxonomy_group: cleanStr(a.taxonomy_group, 40) || "기타",
    info: normalizeCreationInfo(a.info),               // ← 핵심: 튜플 → 객체 배열
    facts: normalizeFacts(a.facts),
    filters: normalizeFilters(a.filters),
    createdAt: serverTimestamp(),                      // 서버 시각(입력값 무시)
    likeCount: 0, likedBy: [],                         // 집계 초기값 강제
  };
  const sp = cleanStr(storagePath, 2000);
  if (sp && sp.startsWith(`feed/${u}/`) && !sp.slice(`feed/${u}/`.length).includes("/") && !sp.includes("..")) {
    doc.storagePath = sp; // 본인 업로드 단일 파일만
  }
  const ref = await addDoc(collection(db(), "animalCreations"), doc);
  return ref.id;
}

/** 피드에 자랑 → 이미지+캡션 글 작성 */
export async function shareCreationToFeed(a: GenAnimal, imageUrl: string, authorName: string, storagePath?: string | null): Promise<boolean> {
  try {
    const caption = `🐣 내가 만든 동물 "${a.animal_name}"\n${a.search_nickname ? `— ${a.search_nickname}\n` : ""}${a.kid_friendly_desc}`.slice(0, 1000);
    // 04-15: 창작물 공유 글도 storagePath 를 남겨 글 삭제 시 미디어 정리가 정확하게 동작하도록.
    return await addPost(authorName, caption, { mediaUrl: imageUrl, mediaType: "image", visibility: "public", storagePath: storagePath || undefined });
  } catch (e) {
    console.warn("[userAnimals] 피드 공유 실패:", e);
    return false;
  }
}

function mapCreation(id: string, x: any): Creation {
  const me = uid();
  const likedBy = (x.likedBy as string[]) || [];
  return {
    id, uid: String(x.uid || ""), authorName: String(x.authorName || "익명"), imageUrl: String(x.imageUrl || ""),
    prompt: String(x.prompt || ""), at: tsToMs(x.createdAt),
    likeCount: Number(x.likeCount || 0), likedByMe: !!me && likedBy.includes(me),
    animal_name: String(x.animal_name || ""), en: String(x.en || ""), search_nickname: String(x.search_nickname || ""),
    kid_friendly_desc: String(x.kid_friendly_desc || ""), status: x.status || { label: "관심대상", code: "LC", color: "#5BA86B" },
    rarity: Number(x.rarity || 2), taxonomy_group: String(x.taxonomy_group || "기타"),
    info: infoToTuples(x.info), facts: Array.isArray(x.facts) ? (x.facts as string[]) : [], filters: (x.filters && typeof x.filters === "object" && !Array.isArray(x.filters)) ? x.filters : {},
  };
}

/** 공개 갤러리 — 최신순 */
export async function listPublicCreations(n = 60): Promise<Creation[]> {
  try {
    const snap = await getDocs(query(collection(db(), "animalCreations"), orderBy("createdAt", "desc"), fbLimit(n)));
    return snap.docs.map((d) => mapCreation(d.id, d.data()));
  } catch { return []; }
}

/** 내가 만든 동물 — 프로필용(uid 필터 후 클라 정렬, 복합인덱스 불필요) */
export async function listMyCreations(ownerUid: string, n = 60): Promise<Creation[]> {
  try {
    const snap = await getDocs(query(collection(db(), "animalCreations"), where("uid", "==", ownerUid), fbLimit(n)));
    return snap.docs.map((d) => mapCreation(d.id, d.data())).sort((a, b) => b.at - a.at);
  } catch { return []; }
}

export async function likeCreation(id: string, like: boolean): Promise<boolean> {
  const u = uid(); if (!u) return false;
  try {
    await updateDoc(doc(db(), "animalCreations", id), { likeCount: increment(like ? 1 : -1), likedBy: like ? arrayUnion(u) : arrayRemove(u) });
    return true;
  } catch { return false; }
}

/** Firebase Storage 다운로드 URL 에서 storagePath(feed/{uid}/{file})를 역산.
 *  프로덕션(firebasestorage.googleapis.com)·에뮬(127.0.0.1:9199) 둘 다 `/o/<encodedPath>?…` 형식.
 *  Firebase Storage URL 이 아니면(외부 URL) null → 삭제하지 않는다. */
function storagePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/firebasestorage\.googleapis\.com$/.test(u.hostname) && !/^(127\.0\.0\.1|localhost)$/.test(u.hostname)) return null;
    const m = u.pathname.match(/\/o\/([^/?]+)/);
    if (!m) return null;
    return decodeURIComponent(m[1]);
  } catch { return null; }
}

/** 이 창작물의 이미지를 내 feed 글이 아직 참조하는지 확인(공유 파일 보호).
 *  ⚠️ 조회 자체가 실패하면 '참조 있을 수 있음'으로 보수적으로 판단(파일 유지)해 오삭제를 막는다. */
async function imageStillReferencedInFeed(me: string, imageUrl: string): Promise<boolean> {
  try {
    const snap = await getDocs(query(collection(db(), "feed"), where("uid", "==", me), fbLimit(100)));
    return snap.docs.some((d) => String((d.data() as Record<string, unknown>).mediaUrl || "") === imageUrl);
  } catch {
    return true; // 확인 불가 → 파일 보존(안전 우선)
  }
}

/**
 * 04-14: 창작물 삭제 시 이 창작물이 올린 Storage 이미지까지 안전하게 함께 삭제(정책 B).
 *  순서: 문서 조회 → 작성자 확인 → Storage 삭제 대상 판단 → (필요 시) Storage 삭제 → Firestore 삭제.
 *  · 본인 소유(feed/{me}/) 파일만 삭제. 외부 URL·경로 불명·타인 경로는 문서만 삭제(파일 유지).
 *  · 내 feed 글이 같은 이미지를 참조하면(등록+공유 공유 파일) 문서만 삭제(파일 유지).
 *  · Storage 삭제가 실패하면(권한 등) 문서를 남긴다 → 재시도 가능(고아·깨진참조 방지).
 *  · object-not-found 는 이미 지워진 것 → 정상으로 보고 문서 삭제 진행.
 * @returns 삭제 성공 여부
 */
export async function deleteCreation(id: string): Promise<boolean> {
  const me = uid();
  if (!me) return false;
  let data: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(doc(db(), "animalCreations", id));
    if (!snap.exists()) return true; // 이미 없음 = 목표 달성
    data = snap.data() as Record<string, unknown>;
  } catch { return false; }

  if (String(data.uid || "") !== me) return false; // 작성자만(규칙도 강제하나 클라에서도 차단)

  // 삭제 대상 경로 판단: 저장된 storagePath 우선, 없으면 imageUrl 역산.
  const imageUrl = String(data.imageUrl || "");
  let path: string | null = typeof data.storagePath === "string" ? data.storagePath : null;
  if (!path) path = storagePathFromUrl(imageUrl);

  const prefix = `feed/${me}/`;
  const isOwnFile = !!path && path.startsWith(prefix) && !path.slice(prefix.length).includes("/") && path.slice(prefix.length).length > 0 && !path.includes("..");

  if (isOwnFile) {
    const shared = await imageStillReferencedInFeed(me, imageUrl); // 공유 파일이면 유지
    if (!shared) {
      try {
        await deleteObject(storageRef(getFirebaseStorage(), path!));
      } catch (e: any) {
        if (e?.code !== "storage/object-not-found") return false; // 실제 실패 → 문서 유지(재시도)
      }
    }
  }

  try { await deleteDoc(doc(db(), "animalCreations", id)); return true; }
  catch { return false; }
}

/** 오늘 남은 생성 횟수 표시용(참고값 — 실제 제한은 서버가 강제) */
export async function getRemainingQuota(limit = 3): Promise<number> {
  const u = uid(); if (!u) return 0;
  try {
    const s = await getDoc(doc(db(), "userAnimalQuota", u));
    if (!s.exists()) return limit;
    const d = s.data() as any;
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const used = d.date === today ? Number(d.count || 0) : 0;
    return Math.max(0, limit - used);
  } catch { return limit; }
}
