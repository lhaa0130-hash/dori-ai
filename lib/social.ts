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
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── 프로필(코지홈) ───────────────────────────────────────────
export type BgStyle = "aurora" | "sunset" | "mono" | "mint" | "berry" | "night";

export interface Profile {
  uid: string;
  name: string;
  photoURL?: string;
  bio: string;        // 자기소개
  statusMsg: string;  // 상태메시지(한 줄)
  themeColor: string; // 대표색 hex
  bg: BgStyle;        // 배경 프리셋
  tier: number;       // 등급(1~) — users/{uid}.tier
  level: number;      // 레벨 — users/{uid}.level
  exp: number;        // 경험치(doriExp)
}

const DEFAULT_PROFILE = (uid: string, name = "사용자"): Profile => ({
  uid, name, bio: "", statusMsg: "", themeColor: "#F9954E", bg: "aurora", tier: 1, level: 1, exp: 0,
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
      tier: Number(d.tier || 1),
      level: Number(d.level || 1),
      exp: Number(d.doriExp || 0),
    };
  } catch {
    return DEFAULT_PROFILE(uid);
  }
}

/** 내 프로필 일부 갱신(로그인 필요, users/{uid} merge) */
export async function saveMyProfile(patch: Partial<Pick<Profile, "bio" | "statusMsg" | "themeColor" | "bg" | "name" | "photoURL">>): Promise<boolean> {
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
export async function listFeed(n = 50): Promise<FeedPost[]> {
  const me = currentUid();
  try {
    const tasks = [getDocs(query(collection(db(), "feed"), where("visibility", "==", "public"), limit(n)))];
    if (me) tasks.push(getDocs(query(collection(db(), "feed"), where("allowedUids", "array-contains", me), limit(n))));
    const snaps = await Promise.all(tasks);
    const map = new Map<string, FeedPost>();
    snaps.forEach((s) => s.forEach((d) => { if (!map.has(d.id)) map.set(d.id, mapPost(d.id, d.data() as Record<string, unknown>)); }));
    return Array.from(map.values()).sort((a, b) => b.at - a.at).slice(0, n);
  } catch { return []; }
}

/** 특정 유저의 피드(내가 볼 수 있는 것만) — 코지홈용 */
export async function listUserFeed(uid: string, n = 50): Promise<FeedPost[]> {
  const all = await listFeed(150);
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
    return true;
  } catch { return false; }
}

export async function deletePost(postId: string): Promise<boolean> {
  try { await deleteDoc(doc(db(), "feed", postId)); return true; } catch { return false; }
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

export async function createGroup(name: string): Promise<boolean> {
  const me = currentUid();
  if (!me || !name.trim()) return false;
  try { await addDoc(collection(db(), "users", me, "groups"), { name: name.trim().slice(0, 20), memberUids: [], feedVisible: true, createdAt: serverTimestamp() }); return true; } catch { return false; }
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
export type NotiType = "friend_request" | "friend_accept" | "like" | "comment" | "guestbook" | "dm";
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
