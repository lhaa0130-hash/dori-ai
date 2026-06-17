// 소셜/나만의 공간 데이터 계층 — Firestore 클라이언트 (정적 export 호환)
// ─────────────────────────────────────────────────────────────
// 코지홈(프로필 꾸미기)·방명록·1:1 DM·피드·전적을 한곳에서 다룬다.
//
//   users/{uid}                         프로필 확장 필드(bio/status/themeColor/bg)
//   guestbook/{ownerUid}/entries/{id}   방명록
//   dm_threads/{threadId}               1:1 대화방 (threadId = 두 uid 정렬 후 "__" 결합)
//   dm_threads/{threadId}/messages/{id} 메시지
//   feed/{postId}                       피드 글(텍스트). 이미지는 추후 Storage 연동
//
// ⚠️ Firestore 보안 규칙 필요(firestore.analytics.rules.txt 참고):
//   match /users/{uid}                         { read: if true; write: if owner }   (기존)
//   match /guestbook/{owner}/entries/{id}      { read: if true; write: if request.auth != null }
//   match /dm_threads/{tid}                     { read,write: if request.auth!=null && request.auth.uid in tid.split('__') }
//   match /dm_threads/{tid}/messages/{id}      { read,write: if request.auth!=null && request.auth.uid in tid.split('__') }
//   match /feed/{id}                           { read: if true; create: if request.auth!=null; update,delete: if owner }

import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, query, where,
  orderBy, limit, getDocs, onSnapshot, serverTimestamp, increment, arrayUnion, arrayRemove,
  getCountFromServer,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";

function db() { return getFirebaseFirestore(); }
export function currentUid(): string | null {
  try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
}

// ─── 읽기 캐시(짧은 TTL) — 같은 화면/네비게이션 내 중복 Firestore 읽기 방지 ──
// 성공한 결과만 캐시(실패는 fn이 throw → 미캐시). 쓰기 후 bustCache 로 무효화.
type _CacheEntry = { at: number; val: unknown };
const _rcache = new Map<string, _CacheEntry>();
function _now(): number { try { return Date.now(); } catch { return 0; } }
async function cachedRead<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = _rcache.get(key);
  if (hit && _now() - hit.at < ttlMs) return hit.val as T;
  const val = await fn();
  _rcache.set(key, { at: _now(), val });
  return val;
}
function bustCache(prefix: string): void {
  for (const k of Array.from(_rcache.keys())) if (k.startsWith(prefix)) _rcache.delete(k);
}
function tsToMillis(v: unknown): number {
  if (v && typeof v === "object" && "toMillis" in (v as any)) { try { return (v as any).toMillis(); } catch { return 0; } }
  return 0;
}
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── 프로필(코지홈) ───────────────────────────────────────────
export type BgStyle = string; // 배경 프리셋 id (프로필 페이지 BG_PRESETS 참조)

export interface Profile {
  uid: string;
  name: string;
  handle: string;       // 공유 URL용 영문 핸들 (dori-ai.com/u/<handle>) — 미설정 시 ""
  photoURL?: string;
  bio: string;          // 자기소개
  statusMsg: string;    // 상태메시지(한 줄)
  themeColor: string;   // 대표색 hex
  bg: BgStyle;          // 배경 프리셋
  tier: number;         // 등급(1~) — users/{uid}.tier
  level: number;        // 레벨 — users/{uid}.level
  exp: number;          // 경험치(doriExp)
  // ── 코지홈 꾸미기 ──
  mood: string;         // 무드 이모지 (이름 옆)
  title: string;        // 칭호/한 줄 명함
  frame: string;        // 아바타 테두리 스타일 id
  interests: string[];  // 관심사 태그
  stickers: string[];   // 배너 장식 스티커(이모지)
  nameEffect: string;   // 이름 효과 id (상점 구매) — shopItems nameEffect
  bannerEffect: string; // 배너 효과 id (상점 구매) — shopItems bannerEffect
  pet: string;          // 펫/캐릭터 id (상점 구매) — shopItems pet
  ownedItems: string[]; // 보유한 코지홈 아이템(slot::id) — 상점에서 구매, 구매 함수가 기록
  greeting: string;     // 대문 인사말 (코지홈 상단)
  diary: DiaryEntry[];  // 다이어리(일기장) — 주인 본인이 남기는 기록, users/{uid}.diary 배열
  myAIs: AIShowcase[];  // 내가 만든 AI 자랑 — users/{uid}.myAIs 배열
}

// 다이어리 한 칸
export interface DiaryEntry { at: number; text: string; mood: string; }
// 내가 만든 AI 한 칸 — dori-ai.com/u/<handle>/<slug> 에 자동 호스팅되는 미니 소개페이지
export interface AIShowcase {
  at: number;
  id: string;          // 안정 식별자(생성 시각 base36) — 공유 링크/수정/삭제 매칭용
  slug: string;        // URL 슬러그(회원 내 유니크) — 공유 주소의 마지막 칸
  name: string;
  desc: string;        // 한 줄 소개(카드용)
  body?: string;       // 긴 소개(호스팅 페이지 본문)
  howto?: string;      // 사용법/사용 팁
  tool?: string;       // 만든 도구/플랫폼
  category?: string;   // 분류(챗봇/그림/글쓰기/게임/교육/음악/기타)
  tags?: string[];     // 태그
  url: string;         // 외부 체험 링크(있으면 '체험하러 가기' 버튼)
  images?: string[];   // 스크린샷 URL들
  emoji: string;
}

// 문자열 → URL 슬러그(영문/숫자/한글/하이픈 유지)
export function slugify(s: string): string {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "ai";
}

const DEFAULT_PROFILE = (uid: string, name = "사용자"): Profile => ({
  uid, name, handle: "", bio: "", statusMsg: "", themeColor: "#F9954E", bg: "aurora", tier: 1, level: 1, exp: 0,
  mood: "", title: "", frame: "none", interests: [], stickers: [],
  nameEffect: "", bannerEffect: "", pet: "", ownedItems: [], greeting: "", diary: [], myAIs: [],
});

async function fetchProfile(uid: string): Promise<Profile> {
  const s = await getDoc(doc(db(), "users", uid));
  const d = (s.data() as Record<string, unknown>) || {};
  return {
    uid,
    name: String(d.name || d.displayName || "사용자"),
    handle: String(d.handle || ""),
    photoURL: d.photoURL ? String(d.photoURL) : undefined,
    bio: String(d.bio || ""),
    statusMsg: String(d.statusMsg || ""),
    themeColor: String(d.themeColor || "#F9954E"),
    bg: (String(d.bg || "aurora") as BgStyle),
    tier: Number(d.tier || 1),
    level: Number(d.level || 1),
    exp: Number(d.doriExp || 0),
    mood: String(d.mood || ""),
    title: String(d.title || ""),
    frame: String(d.frame || "none"),
    interests: Array.isArray(d.interests) ? (d.interests as string[]).slice(0, 8) : [],
    stickers: Array.isArray(d.stickers) ? (d.stickers as string[]).slice(0, 6) : [],
    nameEffect: String(d.nameEffect || ""),
    bannerEffect: String(d.bannerEffect || ""),
    pet: String(d.pet || ""),
    ownedItems: Array.isArray(d.ownedItems) ? (d.ownedItems as string[]) : [],
    greeting: String(d.greeting || ""),
    diary: Array.isArray(d.diary)
      ? (d.diary as DiaryEntry[])
          .map((e) => ({ at: Number((e as DiaryEntry)?.at) || 0, text: String((e as DiaryEntry)?.text || ""), mood: String((e as DiaryEntry)?.mood || "") }))
          .filter((e) => e.text)
          .sort((a, b) => b.at - a.at)
          .slice(0, 30)
      : [],
    myAIs: Array.isArray(d.myAIs)
      ? (d.myAIs as AIShowcase[])
          .map((a) => {
            const x = (a || {}) as Record<string, unknown>;
            const at = Number(x.at) || 0;
            const name = String(x.name || "");
            const slug = String(x.slug || slugify(name));
            return {
              at,
              id: String(x.id || (at ? at.toString(36) : "") || slug),
              slug,
              name,
              desc: String(x.desc || ""),
              body: x.body ? String(x.body) : "",
              howto: x.howto ? String(x.howto) : "",
              tool: String(x.tool || ""),
              category: String(x.category || ""),
              tags: Array.isArray(x.tags) ? (x.tags as string[]).map(String).slice(0, 8) : [],
              url: String(x.url || ""),
              images: Array.isArray(x.images) ? (x.images as string[]).map(String).slice(0, 8) : [],
              emoji: String(x.emoji || "🤖"),
            } as AIShowcase;
          })
          .filter((a) => a.name)
          .sort((a, b) => b.at - a.at)
          .slice(0, 12)
      : [],
  };
}

/** 프로필 읽기(60초 캐시, 성공 시에만 캐시) */
export async function getProfile(uid: string): Promise<Profile> {
  try { return await cachedRead(`profile:${uid}`, 60000, () => fetchProfile(uid)); }
  catch { return DEFAULT_PROFILE(uid); }
}

/** 내 프로필 일부 갱신(로그인 필요, users/{uid} merge) */
export async function saveMyProfile(patch: Partial<Pick<Profile, "bio" | "statusMsg" | "themeColor" | "bg" | "name" | "photoURL" | "mood" | "title" | "frame" | "interests" | "stickers" | "nameEffect" | "bannerEffect" | "pet" | "greeting">>): Promise<boolean> {
  const uid = currentUid();
  if (!uid) return false;
  try {
    await setDoc(doc(db(), "users", uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
    bustCache(`profile:${uid}`);
    return true;
  } catch { return false; }
}

// ─── 다이어리(일기장) — 본인 users/{uid}.diary 배열(규칙 변경 불필요, 소유자 쓰기) ───
/** 다이어리 한 줄 추가(최신 30개 유지) */
export async function addDiaryEntry(text: string, mood = ""): Promise<DiaryEntry[] | null> {
  const uid = currentUid();
  const t = text.trim();
  if (!uid || !t) return null;
  try {
    const s = await getDoc(doc(db(), "users", uid));
    const cur = Array.isArray(s.data()?.diary) ? (s.data()!.diary as DiaryEntry[]) : [];
    const entry: DiaryEntry = { at: Date.now(), text: t.slice(0, 500), mood: mood.slice(0, 4) };
    const next = [entry, ...cur].slice(0, 30);
    await setDoc(doc(db(), "users", uid), { diary: next, updatedAt: serverTimestamp() }, { merge: true });
    bustCache(`profile:${uid}`);
    return next;
  } catch { return null; }
}

/** 다이어리 항목 삭제(at 기준) */
export async function deleteDiaryEntry(at: number): Promise<boolean> {
  const uid = currentUid();
  if (!uid) return false;
  try {
    const s = await getDoc(doc(db(), "users", uid));
    const cur = Array.isArray(s.data()?.diary) ? (s.data()!.diary as DiaryEntry[]) : [];
    const next = cur.filter((e) => Number(e?.at) !== at);
    await setDoc(doc(db(), "users", uid), { diary: next, updatedAt: serverTimestamp() }, { merge: true });
    bustCache(`profile:${uid}`);
    return true;
  } catch { return false; }
}

// ─── 내가 만든 AI 자랑 — 본인 users/{uid}.myAIs 배열(규칙 변경 불필요) ───
//   각 항목은 dori-ai.com/u/<handle>/<slug> 에 자동 호스팅되는 소개 페이지를 가진다.
function normUrl(u: string): string {
  let v = (u || "").trim();
  if (v && !/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v.slice(0, 500);
}
function normList(raw: string[] | string | undefined, n: number, perLen: number): string[] {
  const arr = Array.isArray(raw) ? raw : String(raw || "").split(/[\n,]/);
  return arr.map((x) => String(x).trim()).filter(Boolean).slice(0, n).map((x) => x.slice(0, perLen));
}

export type AIInput = {
  name: string; desc?: string; body?: string; howto?: string;
  tool?: string; category?: string; tags?: string[] | string;
  url?: string; images?: string[] | string; emoji?: string;
};

export async function addMyAI(item: AIInput): Promise<AIShowcase[] | null> {
  const uid = currentUid();
  const name = (item.name || "").trim();
  if (!uid || !name) return null;
  try {
    const s = await getDoc(doc(db(), "users", uid));
    const cur = Array.isArray(s.data()?.myAIs) ? (s.data()!.myAIs as AIShowcase[]) : [];
    // 회원 내 유니크 슬러그
    const taken = new Set(cur.map((a) => String((a as AIShowcase)?.slug || "")).filter(Boolean));
    const base = slugify(name);
    let slug = base, n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;
    const at = Date.now();
    const entry: AIShowcase = {
      at,
      id: at.toString(36),
      slug,
      name: name.slice(0, 40),
      desc: (item.desc || "").slice(0, 300),
      body: (item.body || "").slice(0, 4000),
      howto: (item.howto || "").slice(0, 1500),
      tool: (item.tool || "").slice(0, 30),
      category: (item.category || "").slice(0, 20),
      tags: normList(item.tags, 8, 20),
      url: normUrl(item.url || ""),
      images: normList(item.images, 8, 500).map(normUrl),
      emoji: (item.emoji || "🤖").slice(0, 4),
    };
    const next = [entry, ...cur].slice(0, 12);
    await setDoc(doc(db(), "users", uid), { myAIs: next, updatedAt: serverTimestamp() }, { merge: true });
    bustCache(`profile:${uid}`);
    return next;
  } catch { return null; }
}

/** 기존 AI 항목 수정(id 기준) — slug/id/at 은 유지(공유 링크 안정) */
export async function updateMyAI(id: string, patch: Partial<AIInput>): Promise<AIShowcase[] | null> {
  const uid = currentUid();
  if (!uid || !id) return null;
  try {
    const s = await getDoc(doc(db(), "users", uid));
    const cur = Array.isArray(s.data()?.myAIs) ? (s.data()!.myAIs as AIShowcase[]) : [];
    let found = false;
    const next = cur.map((a) => {
      if (String((a as AIShowcase)?.id || (a as AIShowcase)?.at) !== String(id)) return a;
      found = true;
      const m = patch;
      // 구버전(slug/id 없는) 항목도 안전하게 보강 — 공유 링크가 깨지지 않도록.
      const at0 = Number((a as AIShowcase)?.at) || 0;
      const id0 = String((a as AIShowcase)?.id || (at0 ? at0.toString(36) : "") || id);
      const slug0 = String((a as AIShowcase)?.slug || slugify(String((a as AIShowcase)?.name || "")));
      return {
        ...a,
        at: at0,
        id: id0,
        slug: slug0,
        name: m.name != null ? String(m.name).slice(0, 40) : a.name,
        desc: m.desc != null ? String(m.desc).slice(0, 300) : a.desc,
        body: m.body != null ? String(m.body).slice(0, 4000) : (a.body || ""),
        howto: m.howto != null ? String(m.howto).slice(0, 1500) : (a.howto || ""),
        tool: m.tool != null ? String(m.tool).slice(0, 30) : (a.tool || ""),
        category: m.category != null ? String(m.category).slice(0, 20) : (a.category || ""),
        tags: m.tags != null ? normList(m.tags, 8, 20) : (a.tags || []),
        url: m.url != null ? normUrl(m.url) : a.url,
        images: m.images != null ? normList(m.images, 8, 500).map(normUrl) : (a.images || []),
        emoji: m.emoji != null ? String(m.emoji).slice(0, 4) : a.emoji,
      } as AIShowcase;
    });
    if (!found) return null;
    await setDoc(doc(db(), "users", uid), { myAIs: next, updatedAt: serverTimestamp() }, { merge: true });
    bustCache(`profile:${uid}`);
    return next;
  } catch { return null; }
}

/** AI 항목 삭제(id 또는 at 기준 — 구버전 호환) */
export async function deleteMyAI(idOrAt: string | number): Promise<boolean> {
  const uid = currentUid();
  if (!uid) return false;
  const key = String(idOrAt);
  try {
    const s = await getDoc(doc(db(), "users", uid));
    const cur = Array.isArray(s.data()?.myAIs) ? (s.data()!.myAIs as AIShowcase[]) : [];
    const next = cur.filter((a) => String((a as AIShowcase)?.id) !== key && String((a as AIShowcase)?.at) !== key);
    await setDoc(doc(db(), "users", uid), { myAIs: next, updatedAt: serverTimestamp() }, { merge: true });
    bustCache(`profile:${uid}`);
    return true;
  } catch { return false; }
}

// ─── 핸들(공유 URL용 영문 주소) — users/{uid}.handle (규칙 변경 불필요) ───
const RESERVED_HANDLES = new Set([
  "admin", "api", "u", "www", "root", "null", "undefined", "dori", "doriai", "dori-ai",
  "me", "my", "profile", "shop", "feed", "explore", "login", "signup", "notice", "minigame",
]);

/** 핸들 형식·중복 확인 (true=사용 가능) */
export async function checkHandle(raw: string): Promise<{ ok: boolean; reason?: string }> {
  const handle = (raw || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) return { ok: false, reason: "영문 소문자·숫자·밑줄(_) 3~20자" };
  if (RESERVED_HANDLES.has(handle)) return { ok: false, reason: "사용할 수 없는 이름이에요" };
  try {
    const me = currentUid();
    const qs = await getDocs(query(collection(db(), "users"), where("handle", "==", handle), limit(1)));
    if (!qs.empty && qs.docs[0].id !== me) return { ok: false, reason: "이미 사용 중인 이름이에요" };
    return { ok: true };
  } catch { return { ok: false, reason: "확인 중 오류" }; }
}

/** 내 핸들 설정 */
export async function setMyHandle(raw: string): Promise<{ ok: boolean; error?: string; handle?: string; warn?: string }> {
  const uid = currentUid();
  if (!uid) return { ok: false, error: "로그인이 필요해요" };
  const handle = (raw || "").trim().toLowerCase();
  const chk = await checkHandle(handle);
  if (!chk.ok) return { ok: false, error: chk.reason };
  try {
    await setDoc(doc(db(), "users", uid), { handle, updatedAt: serverTimestamp() }, { merge: true });
    bustCache(`profile:${uid}`);
    // 저장 직후 경쟁조건(동시에 같은 핸들 선점) 재검증 — 정적 사이트라 원자적 보장 불가, 충돌 시 안내.
    let warn: string | undefined;
    try {
      const qs = await getDocs(query(collection(db(), "users"), where("handle", "==", handle), limit(2)));
      if (qs.size > 1) warn = "방금 다른 회원도 같은 이름을 써서 겹쳤어요. 다른 이름으로 바꾸는 걸 추천해요.";
    } catch { /* 재검증 실패는 무시 */ }
    return { ok: true, handle, warn };
  } catch (e) { return { ok: false, error: (e as { code?: string })?.code || "저장 실패" }; }
}

/** handle 또는 uid → 프로필 (handle 우선, 없으면 uid 폴백) */
export async function getProfileByHandle(handleOrUid: string): Promise<Profile | null> {
  const key = (handleOrUid || "").trim();
  if (!key) return null;
  try {
    const qs = await getDocs(query(collection(db(), "users"), where("handle", "==", key.toLowerCase()), limit(1)));
    if (!qs.empty) return await getProfile(qs.docs[0].id);
  } catch { /* handle 인덱스/권한 문제 시 uid 폴백 */ }
  try {
    const s = await getDoc(doc(db(), "users", key));
    if (s.exists()) return await getProfile(key);
  } catch { /* ignore */ }
  return null;
}

/** 공유 페이지용 — handle/uid + slug → {프로필, AI} */
export async function getAIPage(handleOrUid: string, slug: string): Promise<{ profile: Profile; ai: AIShowcase } | null> {
  const profile = await getProfileByHandle(handleOrUid);
  if (!profile) return null;
  let target = slug || "";
  try { target = decodeURIComponent(target); } catch { /* keep raw */ }
  const ai = profile.myAIs.find((a) => a.slug === target || a.id === target || slugify(a.name) === target);
  if (!ai) return null;
  return { profile, ai };
}

// ─── AI 페이지 조회수·좋아요 — 공개 visits 컬렉션(write:if true, 규칙 변경 불필요) ───
function aiStatKey(uid: string, id: string): string { return `aip_${uid}_${id}`; }

export async function bumpAIView(uid: string, id: string): Promise<void> {
  if (!uid || !id) return;
  const key = aiStatKey(uid, id);
  try {
    const sk = `aiv_${key}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(sk)) return;
    await setDoc(doc(db(), "visits", key), { views: increment(1) }, { merge: true });
    // 쓰기 확정 후에 세션 플래그 기록(실패 시 다음 시도에서 재집계)
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(sk, "1");
  } catch { /* ignore */ }
}

export async function getAIStats(uid: string, id: string): Promise<{ views: number; likes: number }> {
  if (!uid || !id) return { views: 0, likes: 0 };
  try {
    const s = await getDoc(doc(db(), "visits", aiStatKey(uid, id)));
    const d = (s.data() as Record<string, unknown>) || {};
    return { views: Number(d.views || 0), likes: Number(d.likes || 0) };
  } catch { return { views: 0, likes: 0 }; }
}

/** 좋아요(브라우저당 1회, localStorage 중복방지) → 새 좋아요 수 또는 null(이미함/오류) */
export async function likeAI(uid: string, id: string): Promise<number | null> {
  if (!uid || !id) return null;
  const lk = `ail_${uid}_${id}`;
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(lk)) return null;
    await setDoc(doc(db(), "visits", aiStatKey(uid, id)), { likes: increment(1) }, { merge: true });
    if (typeof localStorage !== "undefined") localStorage.setItem(lk, "1");
    const s = await getDoc(doc(db(), "visits", aiStatKey(uid, id)));
    return Number((s.data() as Record<string, unknown>)?.likes || 0);
  } catch { return null; }
}

export function hasLikedAI(uid: string, id: string): boolean {
  try { return typeof localStorage !== "undefined" && !!localStorage.getItem(`ail_${uid}_${id}`); }
  catch { return false; }
}

// ─── 방명록 ─────────────────────────────────────────────────────
export interface GuestEntry { id: string; fromUid: string; fromName: string; message: string; at: number; }

export async function listGuestbook(ownerUid: string, n = 50): Promise<GuestEntry[]> {
  try {
    const q = query(collection(db(), "guestbook", ownerUid, "entries"), orderBy("createdAt", "desc"), limit(n));
    const snap = await getDocs(q);
    const arr: GuestEntry[] = [];
    snap.forEach((d) => {
      const x = d.data() as Record<string, unknown>;
      arr.push({ id: d.id, fromUid: String(x.fromUid || ""), fromName: String(x.fromName || "익명"), message: String(x.message || ""), at: tsToMillis(x.createdAt) });
    });
    return arr;
  } catch { return []; }
}

export async function addGuestbookEntry(ownerUid: string, fromName: string, message: string): Promise<boolean> {
  const uid = currentUid();
  if (!uid || !message.trim()) return false;
  try {
    await addDoc(collection(db(), "guestbook", ownerUid, "entries"), {
      fromUid: uid, fromName: (fromName || "익명").slice(0, 20), message: message.trim().slice(0, 500), createdAt: serverTimestamp(),
    });
    notify(ownerUid, { type: "guestbook", fromName, text: "방명록을 남겼어요.", link: "/profile?uid=" + ownerUid });
    return true;
  } catch { return false; }
}

export async function deleteGuestbookEntry(ownerUid: string, entryId: string): Promise<boolean> {
  try { await deleteDoc(doc(db(), "guestbook", ownerUid, "entries", entryId)); return true; } catch { return false; }
}

// ─── 1:1 DM ─────────────────────────────────────────────────────
export interface DMThread { id: string; otherUid: string; otherName: string; lastText: string; lastAt: number; }
export interface DMMessage { id: string; fromUid: string; text: string; at: number; }

export function threadIdFor(a: string, b: string): string {
  return [a, b].sort().join("__");
}

export async function sendDM(toUid: string, toName: string, fromName: string, text: string): Promise<boolean> {
  const uid = currentUid();
  if (!uid || !text.trim() || toUid === uid) return false;
  try {
    const tid = threadIdFor(uid, toUid);
    const tref = doc(db(), "dm_threads", tid);
    await setDoc(tref, {
      participants: [uid, toUid],
      names: { [uid]: fromName || "나", [toUid]: toName || "상대" },
      lastText: text.trim().slice(0, 200),
      lastFrom: uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await addDoc(collection(tref, "messages"), { fromUid: uid, text: text.trim().slice(0, 1000), createdAt: serverTimestamp() });
    notify(toUid, { type: "dm", fromName, text: "메시지를 보냈어요.", link: "/messages" });
    return true;
  } catch { return false; }
}

/** 내 대화방 목록(실시간). 반환: 구독 해제 함수 */
export function watchMyThreads(cb: (threads: DMThread[]) => void): () => void {
  const uid = currentUid();
  if (!uid) { cb([]); return () => {}; }
  try {
    const q = query(collection(db(), "dm_threads"), where("participants", "array-contains", uid));
    return onSnapshot(q, (snap) => {
      const arr: DMThread[] = [];
      snap.forEach((d) => {
        const x = d.data() as Record<string, unknown>;
        const parts = (x.participants as string[]) || [];
        const other = parts.find((p) => p !== uid) || "";
        const names = (x.names as Record<string, string>) || {};
        arr.push({ id: d.id, otherUid: other, otherName: names[other] || "상대", lastText: String(x.lastText || ""), lastAt: tsToMillis(x.updatedAt) });
      });
      arr.sort((a, b) => b.lastAt - a.lastAt);
      cb(arr);
    }, () => cb([]));
  } catch { cb([]); return () => {}; }
}

/** 특정 대화 메시지(실시간). 반환: 구독 해제 함수 */
export function watchMessages(threadId: string, cb: (msgs: DMMessage[]) => void): () => void {
  try {
    const q = query(collection(db(), "dm_threads", threadId, "messages"), orderBy("createdAt", "asc"), limit(200));
    return onSnapshot(q, (snap) => {
      const arr: DMMessage[] = [];
      snap.forEach((d) => {
        const x = d.data() as Record<string, unknown>;
        arr.push({ id: d.id, fromUid: String(x.fromUid || ""), text: String(x.text || ""), at: tsToMillis(x.createdAt) });
      });
      cb(arr);
    }, () => cb([]));
  } catch { cb([]); return () => {}; }
}

// ─── 피드(글 + 이미지/영상 + 공개범위) ──────────────────────────
export type FeedVisibility = "public" | "friends" | "groups";
export type MediaType = "image" | "video";
export interface FeedPost {
  id: string; uid: string; name: string; text: string; at: number;
  likeCount: number; likedByMe: boolean; commentCount: number;
  mediaUrl?: string; mediaType?: MediaType;
  visibility: FeedVisibility;
}
export interface NewPostOpts {
  mediaUrl?: string; mediaType?: MediaType;
  visibility?: FeedVisibility;   // 기본 public
  allowedUids?: string[];        // friends/groups 공개 시 볼 수 있는 uid (자신 자동 포함)
}

function mapPost(id: string, x: Record<string, unknown>): FeedPost {
  const me = currentUid();
  const likedBy = (x.likedBy as string[]) || [];
  return {
    id, uid: String(x.uid || ""), name: String(x.name || "익명"), text: String(x.text || ""),
    at: tsToMillis(x.createdAt), likeCount: Number(x.likeCount || 0), likedByMe: !!me && likedBy.includes(me),
    commentCount: Number(x.commentCount || 0),
    mediaUrl: x.mediaUrl ? String(x.mediaUrl) : undefined,
    mediaType: (x.mediaType as MediaType) || undefined,
    visibility: (x.visibility as FeedVisibility) || "public",
  };
}

/** 보안규칙 안전 쿼리: 공개글 + (로그인 시) 내가 볼 수 있는 글(allowedUids 포함)을 합쳐서 최신순. */
async function fetchFeed(n: number, me: string | null): Promise<FeedPost[]> {
  const tasks = [getDocs(query(collection(db(), "feed"), where("visibility", "==", "public"), limit(n)))];
  if (me) tasks.push(getDocs(query(collection(db(), "feed"), where("allowedUids", "array-contains", me), limit(n))));
  const snaps = await Promise.all(tasks);
  const map = new Map<string, FeedPost>();
  snaps.forEach((s) => s.forEach((d) => { if (!map.has(d.id)) map.set(d.id, mapPost(d.id, d.data() as Record<string, unknown>)); }));
  return Array.from(map.values()).sort((a, b) => b.at - a.at).slice(0, n);
}

/** 보안규칙 안전 쿼리: 공개글 + 내가 볼 수 있는 글, 최신순. 20초 캐시(네비게이션 중복 읽기 방지). */
export async function listFeed(n = 50): Promise<FeedPost[]> {
  const me = currentUid();
  try { return await cachedRead(`feed:${n}:${me || "anon"}`, 20000, () => fetchFeed(n, me)); }
  catch { return []; }
}

/** 특정 유저의 피드(내가 볼 수 있는 것만) — 코지홈용. 캐시된 피드 재사용으로 과다읽기 방지 */
export async function listUserFeed(uid: string, n = 50): Promise<FeedPost[]> {
  const all = await listFeed(80);
  return all.filter((p) => p.uid === uid).slice(0, n);
}

export async function addPost(name: string, text: string, opts: NewPostOpts = {}): Promise<boolean> {
  const uid = currentUid();
  if (!uid || (!text.trim() && !opts.mediaUrl)) return false;
  try {
    const visibility: FeedVisibility = opts.visibility || "public";
    const allowedUids = visibility === "public" ? [] : Array.from(new Set([uid, ...(opts.allowedUids || [])]));
    const data: Record<string, unknown> = {
      uid, name: (name || "익명").slice(0, 20), text: text.trim().slice(0, 1000),
      visibility, allowedUids, createdAt: serverTimestamp(), likeCount: 0, likedBy: [],
    };
    if (opts.mediaUrl) { data.mediaUrl = opts.mediaUrl; data.mediaType = opts.mediaType || "image"; }
    await addDoc(collection(db(), "feed"), data);
    bustCache("feed:");
    if (uid) bustCache(`counts:${uid}`);
    return true;
  } catch { return false; }
}

export async function deletePost(postId: string): Promise<boolean> {
  try { await deleteDoc(doc(db(), "feed", postId)); bustCache("feed:"); return true; } catch { return false; }
}

export async function toggleLike(postId: string, liked: boolean, myName = "회원"): Promise<boolean> {
  const uid = currentUid();
  if (!uid) return false;
  try {
    await updateDoc(doc(db(), "feed", postId), {
      likeCount: increment(liked ? -1 : 1),
      likedBy: liked ? arrayRemove(uid) : arrayUnion(uid),
    });
    if (!liked) {
      try {
        const s = await getDoc(doc(db(), "feed", postId));
        const owner = String((s.data() as Record<string, unknown>)?.uid || "");
        notify(owner, { type: "like", fromName: myName, text: "회원님 글을 좋아합니다.", link: "/feed" });
      } catch {}
    }
    return true;
  } catch { return false; }
}

// ─── 전적(게임 기록) ────────────────────────────────────────────
// 랭킹 게임들의 leaderboards/{game}/scores/{uid} 를 읽어 개인 기록을 모은다.
export interface GameRecord { game: string; label: string; score: number; unit: string; order: "desc" | "asc"; }

const RANKED_GAMES: { game: string; label: string; unit: string; order: "desc" | "asc" }[] = [
  { game: "animalmerge", label: "동물 합치기", unit: "점", order: "desc" },
  { game: "clicker", label: "보스 클리커", unit: "킬", order: "desc" },
  { game: "2048", label: "2048", unit: "점", order: "desc" },
  { game: "snake", label: "스네이크", unit: "점", order: "desc" },
  { game: "match3", label: "매치3", unit: "점", order: "desc" },
  { game: "colormatch", label: "색깔 맞추기", unit: "점", order: "desc" },
  { game: "quiz", label: "AI 퀴즈", unit: "점", order: "desc" },
  { game: "puzzle", label: "슬라이드 퍼즐", unit: "무브", order: "asc" },
  { game: "guess", label: "숫자 맞추기", unit: "번", order: "asc" },
];

export async function getUserRecords(uid: string): Promise<GameRecord[]> {
  try {
    const results = await Promise.all(RANKED_GAMES.map(async (g) => {
      try {
        const s = await getDoc(doc(db(), "leaderboards", g.game, "scores", uid));
        if (!s.exists()) return null;
        const score = Number((s.data() as Record<string, unknown>).score || 0);
        if (!score) return null;
        return { game: g.game, label: g.label, score, unit: g.unit, order: g.order } as GameRecord;
      } catch { return null; }
    }));
    return results.filter((r): r is GameRecord => r !== null);
  } catch { return []; }
}

// ─── 친구 ───────────────────────────────────────────────────────
//   friend_requests/{toUid}/incoming/{fromUid}   친구 요청
//   users/{uid}/friends/{friendUid}              수락된 친구(양쪽에 기록)
export interface Friend { uid: string; name: string; }
export interface FriendRequest { fromUid: string; fromName: string; at: number; }

export async function sendFriendRequest(toUid: string, fromName: string): Promise<boolean> {
  const me = currentUid();
  if (!me || !toUid || toUid === me) return false;
  try {
    await setDoc(doc(db(), "friend_requests", toUid, "incoming", me), {
      fromName: (fromName || "익명").slice(0, 20), createdAt: serverTimestamp(),
    });
    notify(toUid, { type: "friend_request", fromName, text: "친구 요청을 보냈어요.", link: "/messages" });
    return true;
  } catch { return false; }
}

export function watchIncomingRequests(cb: (r: FriendRequest[]) => void): () => void {
  const me = currentUid();
  if (!me) { cb([]); return () => {}; }
  try {
    return onSnapshot(collection(db(), "friend_requests", me, "incoming"), (s) => {
      const a: FriendRequest[] = [];
      s.forEach((d) => { const x = d.data(); a.push({ fromUid: d.id, fromName: String(x.fromName || "익명"), at: tsToMillis(x.createdAt) }); });
      a.sort((p, q) => q.at - p.at);
      cb(a);
    }, () => cb([]));
  } catch { cb([]); return () => {}; }
}

export async function acceptFriendRequest(fromUid: string, fromName: string, myName: string): Promise<boolean> {
  const me = currentUid();
  if (!me) return false;
  try {
    await Promise.all([
      setDoc(doc(db(), "users", me, "friends", fromUid), { name: (fromName || "친구").slice(0, 20), createdAt: serverTimestamp() }, { merge: true }),
      setDoc(doc(db(), "users", fromUid, "friends", me), { name: (myName || "친구").slice(0, 20), createdAt: serverTimestamp() }, { merge: true }),
      deleteDoc(doc(db(), "friend_requests", me, "incoming", fromUid)),
    ]);
    notify(fromUid, { type: "friend_accept", fromName: myName, text: "친구 요청을 수락했어요.", link: "/profile?uid=" + me });
    return true;
  } catch { return false; }
}

export async function rejectFriendRequest(fromUid: string): Promise<boolean> {
  const me = currentUid();
  if (!me) return false;
  try { await deleteDoc(doc(db(), "friend_requests", me, "incoming", fromUid)); return true; } catch { return false; }
}

export function watchFriends(cb: (f: Friend[]) => void): () => void {
  const me = currentUid();
  if (!me) { cb([]); return () => {}; }
  try {
    return onSnapshot(collection(db(), "users", me, "friends"), (s) => {
      const a: Friend[] = [];
      s.forEach((d) => a.push({ uid: d.id, name: String((d.data() as Record<string, unknown>).name || "친구") }));
      a.sort((p, q) => p.name.localeCompare(q.name));
      cb(a);
    }, () => cb([]));
  } catch { cb([]); return () => {}; }
}

export async function listFriends(uid?: string): Promise<Friend[]> {
  const target = uid || currentUid();
  if (!target) return [];
  try {
    const s = await getDocs(collection(db(), "users", target, "friends"));
    const a: Friend[] = [];
    s.forEach((d) => a.push({ uid: d.id, name: String((d.data() as Record<string, unknown>).name || "친구") }));
    return a;
  } catch { return []; }
}

export async function isFriend(uid: string): Promise<boolean> {
  const me = currentUid();
  if (!me) return false;
  try { return (await getDoc(doc(db(), "users", me, "friends", uid))).exists(); } catch { return false; }
}

export async function removeFriend(friendUid: string): Promise<boolean> {
  const me = currentUid();
  if (!me) return false;
  try {
    await deleteDoc(doc(db(), "users", me, "friends", friendUid));
    await deleteDoc(doc(db(), "users", friendUid, "friends", me)).catch(() => {});
    return true;
  } catch { return false; }
}

// ─── 친구 범위(그룹) ─────────────────────────────────────────────
//   users/{uid}/groups/{groupId}  { name, memberUids[], feedVisible }
//   feedVisible: '친구공개' 글을 이 범위가 볼 수 있는지
export interface FriendGroup { id: string; name: string; memberUids: string[]; feedVisible: boolean; }

export function watchGroups(cb: (g: FriendGroup[]) => void): () => void {
  const me = currentUid();
  if (!me) { cb([]); return () => {}; }
  try {
    return onSnapshot(collection(db(), "users", me, "groups"), (s) => {
      const a: FriendGroup[] = [];
      s.forEach((d) => { const x = d.data() as Record<string, unknown>; a.push({ id: d.id, name: String(x.name || "범위"), memberUids: (x.memberUids as string[]) || [], feedVisible: x.feedVisible !== false }); });
      a.sort((p, q) => p.name.localeCompare(q.name));
      cb(a);
    }, () => cb([]));
  } catch { cb([]); return () => {}; }
}

export async function listGroups(uid?: string): Promise<FriendGroup[]> {
  const target = uid || currentUid();
  if (!target) return [];
  try {
    const s = await getDocs(collection(db(), "users", target, "groups"));
    const a: FriendGroup[] = [];
    s.forEach((d) => { const x = d.data() as Record<string, unknown>; a.push({ id: d.id, name: String(x.name || "범위"), memberUids: (x.memberUids as string[]) || [], feedVisible: x.feedVisible !== false }); });
    return a;
  } catch { return []; }
}

export const MAX_GROUPS = 5; // 범위는 최대 5개

/** 범위 생성 — 최대 5개. result: ok | full | fail */
export async function createGroup(name: string): Promise<"ok" | "full" | "fail"> {
  const me = currentUid();
  if (!me || !name.trim()) return "fail";
  try {
    const existing = await getDocs(collection(db(), "users", me, "groups"));
    if (existing.size >= MAX_GROUPS) return "full";
    await addDoc(collection(db(), "users", me, "groups"), { name: name.trim().slice(0, 20), memberUids: [], feedVisible: true, createdAt: serverTimestamp() });
    return "ok";
  } catch { return "fail"; }
}

export async function updateGroup(groupId: string, patch: Partial<Pick<FriendGroup, "name" | "memberUids" | "feedVisible">>): Promise<boolean> {
  const me = currentUid();
  if (!me) return false;
  try { await updateDoc(doc(db(), "users", me, "groups", groupId), { ...patch }); return true; } catch { return false; }
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  const me = currentUid();
  if (!me) return false;
  try { await deleteDoc(doc(db(), "users", me, "groups", groupId)); return true; } catch { return false; }
}

// ─── 피드 공개범위(audience) 계산 ───────────────────────────────
/** '친구공개' 대상 = feedVisible=true 범위의 멤버 합집합 */
export async function feedVisibleAudience(): Promise<string[]> {
  const groups = await listGroups();
  const set = new Set<string>();
  groups.filter((g) => g.feedVisible).forEach((g) => g.memberUids.forEach((u) => set.add(u)));
  return Array.from(set);
}

/** 선택한 범위들의 멤버 합집합 */
export async function audienceForGroups(groupIds: string[]): Promise<string[]> {
  const groups = await listGroups();
  const set = new Set<string>();
  groups.filter((g) => groupIds.includes(g.id)).forEach((g) => g.memberUids.forEach((u) => set.add(u)));
  return Array.from(set);
}

// ─── 알림(notifications) ─────────────────────────────────────────
//   notifications/{uid}/items/{id}  { type, fromUid, fromName, text, link, read, createdAt }
export type NotiType = "friend_request" | "friend_accept" | "like" | "comment" | "guestbook" | "dm" | "follow" | "mention" | "repost" | "candy_grant" | "premium_grant";
export interface Noti { id: string; type: NotiType; fromUid: string; fromName: string; text: string; link: string; read: boolean; at: number; }

/** 알림 생성(자기 자신에겐 보내지 않음, 실패해도 무시) */
export async function notify(toUid: string, n: { type: NotiType; fromName: string; text: string; link: string }): Promise<void> {
  const me = currentUid();
  if (!toUid || !me || toUid === me) return;
  try {
    await addDoc(collection(db(), "notifications", toUid, "items"), {
      type: n.type, fromUid: me, fromName: (n.fromName || "누군가").slice(0, 20),
      text: n.text.slice(0, 100), link: n.link, read: false, createdAt: serverTimestamp(),
    });
  } catch { /* 알림 실패는 무시 */ }
}

export function watchNotifications(cb: (items: Noti[]) => void): () => void {
  const me = currentUid();
  if (!me) { cb([]); return () => {}; }
  try {
    const q = query(collection(db(), "notifications", me, "items"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (s) => {
      const a: Noti[] = [];
      s.forEach((d) => { const x = d.data() as Record<string, unknown>; a.push({ id: d.id, type: x.type as NotiType, fromUid: String(x.fromUid || ""), fromName: String(x.fromName || "누군가"), text: String(x.text || ""), link: String(x.link || "#"), read: !!x.read, at: tsToMillis(x.createdAt) }); });
      cb(a);
    }, () => cb([]));
  } catch { cb([]); return () => {}; }
}

export async function markNotiRead(id: string): Promise<void> {
  const me = currentUid(); if (!me) return;
  try { await updateDoc(doc(db(), "notifications", me, "items", id), { read: true }); } catch {}
}
export async function markAllNotiRead(ids: string[]): Promise<void> {
  const me = currentUid(); if (!me) return;
  try { await Promise.all(ids.map((id) => updateDoc(doc(db(), "notifications", me, "items", id), { read: true }).catch(() => {}))); } catch {}
}

// ─── 피드 댓글 ───────────────────────────────────────────────────
//   feed/{postId}/comments/{id}  { uid, name, text, createdAt }
export interface Comment { id: string; uid: string; name: string; text: string; at: number; }

export async function listComments(postId: string, n = 100): Promise<Comment[]> {
  try {
    const q = query(collection(db(), "feed", postId, "comments"), orderBy("createdAt", "asc"), limit(n));
    const s = await getDocs(q);
    const a: Comment[] = [];
    s.forEach((d) => { const x = d.data() as Record<string, unknown>; a.push({ id: d.id, uid: String(x.uid || ""), name: String(x.name || "익명"), text: String(x.text || ""), at: tsToMillis(x.createdAt) }); });
    return a;
  } catch { return []; }
}

/** 댓글 작성 + 글 주인에게 알림 + commentCount 증가 */
export async function addComment(postId: string, postOwnerUid: string, name: string, text: string): Promise<boolean> {
  const me = currentUid();
  if (!me || !text.trim()) return false;
  try {
    await addDoc(collection(db(), "feed", postId, "comments"), { uid: me, name: (name || "익명").slice(0, 20), text: text.trim().slice(0, 500), createdAt: serverTimestamp() });
    updateDoc(doc(db(), "feed", postId), { commentCount: increment(1) }).catch(() => {});
    notify(postOwnerUid, { type: "comment", fromName: name, text: "회원님 글에 댓글을 남겼어요.", link: "/feed" });
    return true;
  } catch { return false; }
}

export async function deleteComment(postId: string, commentId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db(), "feed", postId, "comments", commentId));
    updateDoc(doc(db(), "feed", postId), { commentCount: increment(-1) }).catch(() => {});
    return true;
  } catch { return false; }
}

// ─── 코지홈 방문자 카운터(투데이/투탈) ───────────────────────────
//   visits/{uid} { total }  ·  visits/{uid}/days/{YYYY-MM-DD} { count }
export interface VisitStats { total: number; today: number; }

export async function bumpVisit(ownerUid: string): Promise<void> {
  const me = currentUid();
  if (!ownerUid || me === ownerUid) return; // 본인 방문은 미집계
  try {
    const key = `cozy_visit_${ownerUid}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return; // 세션당 1회
    const today = todayStr();
    await Promise.all([
      setDoc(doc(db(), "visits", ownerUid), { total: increment(1) }, { merge: true }),
      setDoc(doc(db(), "visits", ownerUid, "days", today), { count: increment(1) }, { merge: true }),
    ]);
    try { sessionStorage.setItem(key, "1"); } catch {}
  } catch {}
}

export async function getVisitStats(ownerUid: string): Promise<VisitStats> {
  try {
    const today = todayStr();
    const [t, d] = await Promise.all([
      getDoc(doc(db(), "visits", ownerUid)),
      getDoc(doc(db(), "visits", ownerUid, "days", today)),
    ]);
    return { total: Number((t.data() as Record<string, number>)?.total || 0), today: Number((d.data() as Record<string, number>)?.count || 0) };
  } catch { return { total: 0, today: 0 }; }
}

// ─── 팔로우(비대칭 그래프) ───────────────────────────────────────
//   users/{uid}/followers/{followerUid}  { uid, name, at }   (대상의 팔로워 목록)
//   users/{me}/following/{followeeUid}   { uid, name, at }   (내 팔로잉 목록)
//   양쪽 모두 작성: 내가 T를 팔로우하면 users/T/followers/me + users/me/following/T
//   카운트는 getCountFromServer 로 집계(역정규화 불필요).
export interface FollowUser { uid: string; name: string; at: number; }

export async function isFollowing(uid: string): Promise<boolean> {
  const me = currentUid();
  if (!me || !uid || me === uid) return false;
  try { return (await getDoc(doc(db(), "users", me, "following", uid))).exists(); } catch { return false; }
}

/** 팔로우. 대상에게 'follow' 알림. */
export async function followUser(uid: string, targetName: string, myName: string): Promise<boolean> {
  const me = currentUid();
  if (!me || !uid || me === uid) return false;
  try {
    await Promise.all([
      setDoc(doc(db(), "users", me, "following", uid), { uid, name: (targetName || "").slice(0, 40), at: serverTimestamp() }),
      setDoc(doc(db(), "users", uid, "followers", me), { uid: me, name: (myName || "").slice(0, 40), at: serverTimestamp() }),
    ]);
    void notify(uid, { type: "follow", fromName: myName, text: "님이 회원님을 팔로우합니다", link: `/profile?uid=${me}` });
    bustCache(`following:${me}`); bustCache(`counts:${me}`); bustCache(`counts:${uid}`);
    return true;
  } catch { return false; }
}

export async function unfollowUser(uid: string): Promise<boolean> {
  const me = currentUid();
  if (!me || !uid) return false;
  try {
    await Promise.all([
      deleteDoc(doc(db(), "users", me, "following", uid)),
      deleteDoc(doc(db(), "users", uid, "followers", me)),
    ]);
    bustCache(`following:${me}`); bustCache(`counts:${me}`); bustCache(`counts:${uid}`);
    return true;
  } catch { return false; }
}

async function countOf(c: ReturnType<typeof query> | ReturnType<typeof collection>): Promise<number> {
  try { return (await getCountFromServer(c)).data().count; } catch { return 0; }
}

/** 팔로워/팔로잉/게시물 수 (서버 집계). 60초 캐시로 프로필 재방문 시 집계쿼리 절감. */
export async function getSocialCounts(uid: string): Promise<{ followers: number; following: number; posts: number }> {
  try {
    return await cachedRead(`counts:${uid}`, 60000, async () => {
      const [followers, following, posts] = await Promise.all([
        countOf(collection(db(), "users", uid, "followers")),
        countOf(collection(db(), "users", uid, "following")),
        // 공개 글만 집계(피드 read 규칙이 visibility 기반이라 uid 단독 카운트는 거부됨)
        countOf(query(collection(db(), "feed"), where("uid", "==", uid), where("visibility", "==", "public"))),
      ]);
      return { followers, following, posts };
    });
  } catch { return { followers: 0, following: 0, posts: 0 }; }
}

export async function listFollowers(uid: string, n = 100): Promise<FollowUser[]> {
  try {
    const s = await getDocs(query(collection(db(), "users", uid, "followers"), orderBy("at", "desc"), limit(n)));
    const a: FollowUser[] = [];
    s.forEach((d) => { const x = d.data() as Record<string, unknown>; a.push({ uid: String(x.uid || d.id), name: String(x.name || "사용자"), at: tsToMillis(x.at) }); });
    return a;
  } catch { return []; }
}

export async function listFollowing(uid: string, n = 200): Promise<FollowUser[]> {
  try {
    const s = await getDocs(query(collection(db(), "users", uid, "following"), orderBy("at", "desc"), limit(n)));
    const a: FollowUser[] = [];
    s.forEach((d) => { const x = d.data() as Record<string, unknown>; a.push({ uid: String(x.uid || d.id), name: String(x.name || "사용자"), at: tsToMillis(x.at) }); });
    return a;
  } catch { return []; }
}

async function fetchFollowingSet(me: string): Promise<Set<string>> {
  const s = await getDocs(collection(db(), "users", me, "following"));
  const set = new Set<string>();
  s.forEach((d) => set.add(d.id));
  return set;
}

/** 내가 팔로우하는 uid 집합 (팔로잉 피드 필터용). 30초 캐시. */
export async function myFollowingSet(): Promise<Set<string>> {
  const me = currentUid();
  if (!me) return new Set();
  try { return await cachedRead(`following:${me}`, 30000, () => fetchFollowingSet(me)); }
  catch { return new Set(); }
}

// ─── 추천 팔로우 + 인기 유저 (탐색) ──────────────────────────────
// 정적 export + 클라 Firestore 제약상 서버 랭킹이 없어, 최근 활동/관심사로 클라에서 추천.
export interface SuggestedUser { uid: string; name: string; photoURL?: string; bio: string; interests: string[]; tier: number; }

/**
 * 추천 유저: 최근 글쓴 사람들 중 (1) 내 관심사와 겹치는 사람 우선, (2) 본인·이미 팔로우 제외.
 * 피드 최근글에서 작성자를 수집(서버 인덱스 불필요)한 뒤 프로필을 읽어 정렬.
 */
export async function getSuggestedUsers(
  myInterests: string[] = [],
  n = 12,
  opts: { feed?: FeedPost[]; following?: Set<string> } = {}
): Promise<SuggestedUser[]> {
  const me = currentUid();
  try {
    // 호출측이 이미 가져온 피드/팔로잉을 재사용(중복 Firestore 읽기 방지)
    const following = opts.following ?? (await myFollowingSet());
    const recent = opts.feed ?? (await listFeed(60));
    const seen = new Set<string>();
    const uids: string[] = [];
    for (const p of recent) {
      if (p.uid && p.uid !== me && !following.has(p.uid) && !seen.has(p.uid)) { seen.add(p.uid); uids.push(p.uid); }
    }
    // 후보 풀을 표시 개수 + 여유로 제한해 N+1 프로필 읽기 최소화 (캐시로 재방문 0)
    const profiles = await Promise.all(uids.slice(0, Math.max(n + 6, 18)).map((u) => getProfile(u)));
    const mine = new Set(myInterests);
    const scored = profiles.map((p) => {
      const overlap = (p.interests || []).filter((t) => mine.has(t)).length;
      return { p, score: overlap * 10 + (p.level || 0) + (p.bio ? 1 : 0) };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, n).map(({ p }) => ({ uid: p.uid, name: p.name, photoURL: p.photoURL, bio: p.bio, interests: p.interests || [], tier: p.tier }));
  } catch { return []; }
}

// ─── 친구 찾기: 이름 접두어 검색(users read:if true → 쿼리 허용, 단일필드 인덱스) ───
export interface UserHit { uid: string; name: string; photoURL?: string; bio?: string; handle?: string }
export async function searchUsersByName(qText: string, n = 12): Promise<UserHit[]> {
  const term = (qText || "").trim();
  if (term.length < 1) return [];
  const me = currentUid();
  try {
    const qs = await getDocs(query(
      collection(db(), "users"),
      orderBy("name"),
      where("name", ">=", term),
      where("name", "<=", term + ""),
      limit(n + 1),
    ));
    const a: UserHit[] = [];
    qs.forEach((d) => {
      if (d.id === me) return;
      const x = d.data() as Record<string, unknown>;
      a.push({
        uid: d.id,
        name: String(x.name || x.displayName || "사용자"),
        photoURL: x.photoURL ? String(x.photoURL) : undefined,
        bio: String(x.bio || ""),
        handle: x.handle ? String(x.handle) : undefined,
      });
    });
    return a.slice(0, n);
  } catch { return []; }
}
