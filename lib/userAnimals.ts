// 나만의 동물 — 생성(CF함수)·이미지 영구저장·프로필 등록·피드 자랑·공개 갤러리.
// 공식 도감(animal-cards.json)과 분리된 Firestore 컬렉션 animalCreations 사용.
import {
  collection, addDoc, getDocs, getDoc, doc, query, where, orderBy, limit as fbLimit,
  serverTimestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";
import { uploadFeedMedia } from "@/lib/storage";
import { addPost } from "@/lib/social";

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

const db = () => getFirebaseFirestore();
const uid = () => { try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; } };
const tsToMs = (t: any) => (t && typeof t.toMillis === "function" ? t.toMillis() : Number(t) || 0);

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

/** fal 임시 이미지를 Firebase Storage로 재업로드해 영구 URL 확보.
 *  ⚠️타임아웃 필수: Storage SDK는 실패 시 기본 최대 10분까지 조용히 재시도해 UI가 멈춘 것처럼 보임.
 *  실패 사유(error)를 함께 돌려줘야 사용자가 원인을 볼 수 있음. */
export async function persistImage(falUrl: string): Promise<{ url: string | null; error?: string }> {
  const withTimeout = <T,>(p: Promise<T>, ms: number, msg: string) =>
    Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let res: Response;
    try { res = await fetch(falUrl, { signal: ctrl.signal }); } finally { clearTimeout(timer); }
    if (!res.ok) return { url: null, error: `이미지를 가져오지 못했어요. (${res.status})` };
    const blob = await res.blob();
    const file = new File([blob], `myanimal_${Date.now()}.jpg`, { type: "image/jpeg" });
    const up = await withTimeout(uploadFeedMedia(file), 45000, "업로드가 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.");
    return up.ok ? { url: up.result.url } : { url: null, error: up.error };
  } catch (e: any) {
    if (e?.name === "AbortError") return { url: null, error: "이미지를 가져오는 데 시간이 너무 걸렸어요. 다시 시도해 주세요." };
    return { url: null, error: e?.message || "이미지 저장에 실패했어요." };
  }
}

/** 프로필/갤러리에 등록 → animalCreations 문서 생성. imageUrl은 영구(Storage) URL 권장 */
export async function registerCreation(a: GenAnimal, imageUrl: string, prompt: string, authorName: string): Promise<string | null> {
  const u = uid();
  if (!u) return null;
  try {
    const ref = await addDoc(collection(db(), "animalCreations"), {
      uid: u, authorName: (authorName || "익명").slice(0, 20), imageUrl, prompt: prompt.slice(0, 400),
      animal_name: a.animal_name, en: a.en, search_nickname: a.search_nickname, kid_friendly_desc: a.kid_friendly_desc,
      status: a.status, rarity: a.rarity, taxonomy_group: a.taxonomy_group,
      info: a.info, facts: a.facts, filters: a.filters,
      createdAt: serverTimestamp(), likeCount: 0, likedBy: [],
    });
    return ref.id;
  } catch (e) {
    console.warn("[userAnimals] 프로필 등록 실패:", e);
    return null;
  }
}

/** 피드에 자랑 → 이미지+캡션 글 작성 */
export async function shareCreationToFeed(a: GenAnimal, imageUrl: string, authorName: string): Promise<boolean> {
  try {
    const caption = `🐣 내가 만든 동물 "${a.animal_name}"\n${a.search_nickname ? `— ${a.search_nickname}\n` : ""}${a.kid_friendly_desc}`.slice(0, 1000);
    return await addPost(authorName, caption, { mediaUrl: imageUrl, mediaType: "image", visibility: "public" });
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
    info: (x.info as [string, string, string][]) || [], facts: (x.facts as string[]) || [], filters: x.filters || {},
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

export async function deleteCreation(id: string): Promise<boolean> {
  try { await deleteDoc(doc(db(), "animalCreations", id)); return true; } catch { return false; }
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
