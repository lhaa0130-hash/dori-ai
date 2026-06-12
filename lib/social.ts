// 소셜/나만의 공간 데이터 계층 — Firestore 클라이언트 (정적 export 호환)
// ─────────────────────────────────────────────────────────────
// 미니홈피(프로필 꾸미기)·방명록·1:1 DM·피드·전적을 한곳에서 다룬다.
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
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";

function db() { return getFirebaseFirestore(); }
export function currentUid(): string | null {
  try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
}
function tsToMillis(v: unknown): number {
  if (v && typeof v === "object" && "toMillis" in (v as any)) { try { return (v as any).toMillis(); } catch { return 0; } }
  return 0;
}

// ─── 프로필(미니홈피) ───────────────────────────────────────────
export type BgStyle = "aurora" | "sunset" | "mono" | "mint" | "berry" | "night";

export interface Profile {
  uid: string;
  name: string;
  photoURL?: string;
  bio: string;        // 자기소개
  statusMsg: string;  // 상태메시지(한 줄)
  themeColor: string; // 대표색 hex
  bg: BgStyle;        // 배경 프리셋
}

const DEFAULT_PROFILE = (uid: string, name = "사용자"): Profile => ({
  uid, name, bio: "", statusMsg: "", themeColor: "#F9954E", bg: "aurora",
});

export async function getProfile(uid: string): Promise<Profile> {
  try {
    const s = await getDoc(doc(db(), "users", uid));
    const d = (s.data() as Record<string, unknown>) || {};
    return {
      uid,
      name: String(d.name || d.displayName || "사용자"),
      photoURL: d.photoURL ? String(d.photoURL) : undefined,
      bio: String(d.bio || ""),
      statusMsg: String(d.statusMsg || ""),
      themeColor: String(d.themeColor || "#F9954E"),
      bg: (String(d.bg || "aurora") as BgStyle),
    };
  } catch {
    return DEFAULT_PROFILE(uid);
  }
}

/** 내 프로필 일부 갱신(로그인 필요, users/{uid} merge) */
export async function saveMyProfile(patch: Partial<Pick<Profile, "bio" | "statusMsg" | "themeColor" | "bg" | "name">>): Promise<boolean> {
  const uid = currentUid();
  if (!uid) return false;
  try {
    await setDoc(doc(db(), "users", uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch { return false; }
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

// ─── 피드(텍스트 글) ────────────────────────────────────────────
export interface FeedPost { id: string; uid: string; name: string; text: string; at: number; likeCount: number; likedByMe: boolean; }

export async function listFeed(n = 50): Promise<FeedPost[]> {
  const me = currentUid();
  try {
    const q = query(collection(db(), "feed"), orderBy("createdAt", "desc"), limit(n));
    const snap = await getDocs(q);
    const arr: FeedPost[] = [];
    snap.forEach((d) => {
      const x = d.data() as Record<string, unknown>;
      const likedBy = (x.likedBy as string[]) || [];
      arr.push({ id: d.id, uid: String(x.uid || ""), name: String(x.name || "익명"), text: String(x.text || ""), at: tsToMillis(x.createdAt), likeCount: Number(x.likeCount || 0), likedByMe: !!me && likedBy.includes(me) });
    });
    return arr;
  } catch { return []; }
}

/** 특정 유저의 피드만 (미니홈피용) */
export async function listUserFeed(uid: string, n = 50): Promise<FeedPost[]> {
  const all = await listFeed(120);
  return all.filter((p) => p.uid === uid).slice(0, n);
}

export async function addPost(name: string, text: string): Promise<boolean> {
  const uid = currentUid();
  if (!uid || !text.trim()) return false;
  try {
    await addDoc(collection(db(), "feed"), { uid, name: (name || "익명").slice(0, 20), text: text.trim().slice(0, 1000), createdAt: serverTimestamp(), likeCount: 0, likedBy: [] });
    return true;
  } catch { return false; }
}

export async function deletePost(postId: string): Promise<boolean> {
  try { await deleteDoc(doc(db(), "feed", postId)); return true; } catch { return false; }
}

export async function toggleLike(postId: string, liked: boolean): Promise<boolean> {
  const uid = currentUid();
  if (!uid) return false;
  try {
    await updateDoc(doc(db(), "feed", postId), {
      likeCount: increment(liked ? -1 : 1),
      likedBy: liked ? arrayRemove(uid) : arrayUnion(uid),
    });
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
  { game: "typingspeed", label: "타이핑 속도", unit: "WPM", order: "desc" },
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
