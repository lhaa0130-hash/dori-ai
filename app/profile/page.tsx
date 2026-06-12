"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  currentUid,
  sendFriendRequest,
  isFriend,
  getProfile,
  saveMyProfile,
  listGuestbook,
  addGuestbookEntry,
  deleteGuestbookEntry,
  listUserFeed,
  getUserRecords,
  bumpVisit,
  getVisitStats,
  type Profile,
  type BgStyle,
  type GuestEntry,
  type FeedPost,
  type GameRecord,
} from "@/lib/social";
import { uploadAvatar } from "@/lib/storage";
import { TIER_INFO, type UserTier } from "@/lib/userProfile";

// ── 배경 프리셋 → 그라데이션 클래스(직접 정의) ───────────────────
const BG_PRESETS: { id: BgStyle; label: string; grad: string }[] = [
  { id: "aurora", label: "오로라", grad: "from-[#F9954E]/20 via-fuchsia-500/10 to-sky-500/20" },
  { id: "sunset", label: "선셋", grad: "from-orange-500/20 to-rose-500/20" },
  { id: "mono", label: "모노", grad: "from-white/10 to-white/5" },
  { id: "mint", label: "민트", grad: "from-emerald-400/20 to-teal-500/10" },
  { id: "berry", label: "베리", grad: "from-fuchsia-500/20 to-purple-600/15" },
  { id: "night", label: "나이트", grad: "from-indigo-600/20 to-slate-800/30" },
];

function bgGrad(bg: BgStyle): string {
  return (BG_PRESETS.find((p) => p.id === bg) || BG_PRESETS[0]).grad;
}

// 대표색 팔레트
const COLOR_PRESETS = ["#F9954E", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#14b8a6"];

function fmtDate(at: number): string {
  if (!at) return "";
  try {
    return new Date(at).toLocaleDateString("ko-KR");
  } catch {
    return "";
  }
}

export default function ProfilePage() {
  const { session, status } = useAuth();
  const myName = session?.user?.name || "사용자";

  const [mounted, setMounted] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [targetUid, setTargetUid] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [guestbook, setGuestbook] = useState<GuestEntry[]>([]);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 꾸미기(편집) 상태
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editColor, setEditColor] = useState("#F9954E");
  const [editBg, setEditBg] = useState<BgStyle>("aurora");
  const [saving, setSaving] = useState(false);

  // 방명록 입력
  const [gbMsg, setGbMsg] = useState("");
  const [gbSending, setGbSending] = useState(false);

  // 친구 상태: "loading" | "none" | "friend" | "requested"
  const [friendState, setFriendState] = useState<"loading" | "none" | "friend" | "requested">("none");

  // 방문자 카운터(투데이/투탈)
  const [visit, setVisit] = useState<{ total: number; today: number } | null>(null);

  // 프로필 사진 업로드
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // URL ?uid= 로 대상 결정(없으면 내 uid) — 정적 export 안전하게 window에서 직접 읽음
  useEffect(() => {
    setMounted(true);
    const mine = currentUid();
    setMyUid(mine);
    let fromUrl: string | null = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get("uid");
    } catch {
      fromUrl = null;
    }
    setTargetUid(fromUrl && fromUrl.trim() ? fromUrl.trim() : mine);
  }, [status]);

  const isOwner = !!myUid && !!targetUid && myUid === targetUid;

  const loadAll = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [p, recs, gb, uf] = await Promise.all([
        getProfile(uid),
        getUserRecords(uid),
        listGuestbook(uid, 50),
        listUserFeed(uid, 10),
      ]);
      setProfile(p);
      setRecords(recs);
      setGuestbook(gb);
      setFeed(uf);
      setEditBio(p.bio);
      setEditStatus(p.statusMsg);
      setEditColor(p.themeColor || "#F9954E");
      setEditBg(p.bg || "aurora");
    } catch {
      // getProfile 등은 내부에서 안전 처리됨
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!targetUid) {
      setLoading(false);
      return;
    }
    void loadAll(targetUid);
  }, [mounted, targetUid, loadAll]);

  // 다른 사람 프로필이면 친구 여부 확인
  useEffect(() => {
    if (!mounted) return;
    if (!targetUid || !myUid || isOwner) {
      setFriendState("none");
      return;
    }
    let active = true;
    setFriendState("loading");
    isFriend(targetUid)
      .then((yes) => {
        if (active) setFriendState(yes ? "friend" : "none");
      })
      .catch(() => {
        if (active) setFriendState("none");
      });
    return () => {
      active = false;
    };
  }, [mounted, targetUid, myUid, isOwner]);

  // 방문자 카운터: 대상 결정 후 1회 집계 + 통계 조회
  useEffect(() => {
    if (!mounted || !targetUid) return;
    let active = true;
    (async () => {
      try {
        await bumpVisit(targetUid); // 본인/세션중복은 내부에서 무시
      } catch {
        // 무시
      }
      try {
        const stats = await getVisitStats(targetUid);
        if (active) setVisit(stats);
      } catch {
        // 무시
      }
    })();
    return () => {
      active = false;
    };
  }, [mounted, targetUid]);

  const handleChangePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file || !isOwner || !targetUid) return;
    setPhotoError("");
    setPhotoUploading(true);
    const res = await uploadAvatar(file);
    if (res.ok) {
      // photoURL은 Profile에 존재하지만 saveMyProfile의 patch 타입엔 빠져있어 타입 안전하게 전달
      await saveMyProfile({ photoURL: res.url } as Parameters<typeof saveMyProfile>[0]);
      await loadAll(targetUid);
    } else {
      setPhotoError(res.error || "사진 업로드에 실패했습니다.");
    }
    setPhotoUploading(false);
  };

  const handleAddFriend = async () => {
    if (!targetUid || isOwner) return;
    setFriendState("requested");
    const ok = await sendFriendRequest(targetUid, myName);
    if (!ok) {
      setFriendState("none");
      alert("친구 요청에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleSave = async () => {
    if (!isOwner || !targetUid) return;
    setSaving(true);
    const ok = await saveMyProfile({
      bio: editBio.slice(0, 300),
      statusMsg: editStatus.slice(0, 80),
      themeColor: editColor,
      bg: editBg,
    });
    setSaving(false);
    if (ok) {
      setEditing(false);
      await loadAll(targetUid);
    } else {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleAddGuestbook = async () => {
    if (!targetUid || !gbMsg.trim()) return;
    setGbSending(true);
    const ok = await addGuestbookEntry(targetUid, myName, gbMsg.trim());
    setGbSending(false);
    if (ok) {
      setGbMsg("");
      const gb = await listGuestbook(targetUid, 50);
      setGuestbook(gb);
    } else {
      alert("방명록 작성에 실패했습니다.");
    }
  };

  const handleDeleteGuestbook = async (entryId: string) => {
    if (!isOwner || !targetUid) return;
    const ok = await deleteGuestbookEntry(targetUid, entryId);
    if (ok) {
      setGuestbook((prev) => prev.filter((g) => g.id !== entryId));
    }
  };

  // 뱃지(전적 기반 단순 산출)
  const gamerLevel = records.length;
  const accent = profile?.themeColor || "#F9954E";

  const messageHref = useMemo(() => {
    if (!targetUid || !profile) return "/login";
    return `/messages?to=${encodeURIComponent(targetUid)}&name=${encodeURIComponent(profile.name)}`;
  }, [targetUid, profile]);

  // ── 비로그인 + 대상 미지정 → 로그인 유도 ───────────────────────
  if (mounted && !targetUid) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className="rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-2xl mb-5">
            🏠
          </div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
            코지홈을 보려면 로그인하세요
          </h2>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-7 leading-relaxed">
            로그인하면 나만의 코지홈을
            <br />
            꾸미고 방명록을 받을 수 있어요.
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 text-center"
          >
            로그인하러 가기
          </Link>
        </div>
      </main>
    );
  }

  // ── 로딩 ───────────────────────────────────────────────────────
  if (!mounted || loading || !profile) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-neutral-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-5" />
        <p className="text-[14px] text-neutral-400 font-semibold">코지홈을 불러오는 중입니다</p>
      </main>
    );
  }

  const avatarLetter = (profile.name || "?").trim().charAt(0) || "?";
  const canMessage = !!myUid && !isOwner;

  return (
    <main className="w-full min-h-screen pb-24">
      <section className="max-w-2xl mx-auto px-5 pt-6">
        {/* 1) 코지홈 배너 */}
        <div className="relative rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${bgGrad(profile.bg)}`} aria-hidden />
          <div className="relative p-6">
            <div className="flex items-start gap-4">
              {/* 아바타 */}
              <div className="relative w-16 h-16 shrink-0">
                {profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900 shadow"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-extrabold shadow ring-2 ring-white dark:ring-zinc-900"
                    style={{ backgroundColor: accent }}
                  >
                    {avatarLetter}
                  </div>
                )}

                {isOwner && (
                  <label
                    className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer bg-black/0 hover:bg-black/40 active:bg-black/40 transition-colors group"
                    aria-label="프로필 사진 변경"
                  >
                    {photoUploading ? (
                      <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/45">
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight px-1">
                        사진<br />변경
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChangePhoto}
                      disabled={photoUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-[22px] font-extrabold tracking-tight text-neutral-900 dark:text-white truncate">
                  {profile.name}
                </h1>
                {/* 등급(티어) + 레벨 */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ color: accent, backgroundColor: `${accent}1A` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                    {TIER_INFO[profile.tier as UserTier]?.name || `등급 ${profile.tier}`}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 tabular-nums">
                    Lv.{profile.level}
                  </span>
                </div>
                {profile.statusMsg ? (
                  <p className="text-[13px] mt-0.5 font-semibold" style={{ color: accent }}>
                    {profile.statusMsg}
                  </p>
                ) : (
                  <p className="text-[13px] mt-0.5 text-neutral-400 dark:text-neutral-500">상태메시지가 없어요</p>
                )}
              </div>

              {/* 방문자 카운터(투데이/투탈) — 싸이월드 감성 */}
              {visit && (
                <div className="shrink-0 self-start text-right">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-2.5 py-1 text-[10px] font-bold tracking-tight ring-1 ring-black/5 dark:ring-white/10">
                    <span className="text-[#F9954E]">TODAY</span>
                    <span className="text-neutral-800 dark:text-neutral-100 tabular-nums">
                      {visit.today.toLocaleString()}
                    </span>
                    <span className="text-neutral-300 dark:text-zinc-700">·</span>
                    <span className="text-neutral-400 dark:text-neutral-500">TOTAL</span>
                    <span className="text-neutral-600 dark:text-neutral-300 tabular-nums">
                      {visit.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isOwner && photoError && (
              <p className="mt-3 text-[12px] font-semibold text-red-500">{photoError}</p>
            )}

            {profile.bio && (
              <p className="mt-4 text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* 액션 버튼 */}
            <div className="mt-5 flex flex-wrap gap-2">
              {isOwner && (
                <button
                  onClick={() => setEditing((v) => !v)}
                  className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85"
                >
                  {editing ? "꾸미기 닫기" : "✏️ 꾸미기"}
                </button>
              )}
              {canMessage && (
                <Link
                  href={messageHref}
                  className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85"
                >
                  💬 메시지 보내기
                </Link>
              )}
              {canMessage && (
                friendState === "friend" ? (
                  <span className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 text-[13px] font-bold">
                    ✓ 친구
                  </span>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={friendState === "requested" || friendState === "loading"}
                    className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 text-[13px] font-bold active:opacity-85 disabled:opacity-50"
                  >
                    {friendState === "requested" ? "요청됨" : "친구 추가"}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* 2) 꾸미기 패널 */}
        {isOwner && editing && (
          <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
            <p className="text-[11px] text-[#F9954E] font-bold mb-3">코지홈 꾸미기</p>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              상태메시지
            </label>
            <input
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              maxLength={80}
              placeholder="한 줄 상태메시지"
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
            />

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              소개
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="자기소개를 적어보세요"
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40"
            />

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              대표색
            </label>
            <div className="flex gap-2 mb-4">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  aria-label={`색상 ${c}`}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    editColor === c ? "ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-zinc-950 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              배경
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {BG_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setEditBg(p.id)}
                  className={`relative h-14 rounded-xl border overflow-hidden text-[11px] font-bold ${
                    editBg === p.id
                      ? "border-[#F9954E]"
                      : "border-neutral-100 dark:border-zinc-900"
                  }`}
                >
                  <span className={`absolute inset-0 bg-gradient-to-br ${p.grad}`} aria-hidden />
                  <span className="relative text-neutral-700 dark:text-neutral-200">{p.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        )}

        {/* 4) 뱃지 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">뱃지</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              🎮 게이머 Lv.{gamerLevel}
            </span>
            {records.length === 0 ? (
              <span className="text-[13px] text-neutral-400 dark:text-neutral-500">
                기록을 쌓으면 뱃지가 생겨요
              </span>
            ) : (
              records.map((r) => (
                <span
                  key={r.game}
                  className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200"
                >
                  🏅 {r.label}
                </span>
              ))
            )}
          </div>
        </div>

        {/* 3) 전적 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">전적</p>
          {records.length === 0 ? (
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">아직 기록 없음</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {records.map((r) => (
                <div
                  key={r.game}
                  className="rounded-xl bg-neutral-100 dark:bg-zinc-900 p-3.5"
                >
                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-1 truncate">{r.label}</p>
                  <p className="text-[18px] font-extrabold text-neutral-900 dark:text-white">
                    {r.score.toLocaleString()}
                    <span className="text-[12px] font-bold text-neutral-400 ml-1">{r.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6) 본인 피드 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">최근 글</p>
          {feed.length === 0 ? (
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">아직 작성한 글이 없어요</p>
          ) : (
            <ul className="space-y-3">
              {feed.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl bg-neutral-100 dark:bg-zinc-900 p-3.5"
                >
                  <p className="text-[14px] text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed">
                    {p.text}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-neutral-400">
                    {fmtDate(p.at) && <span>{fmtDate(p.at)}</span>}
                    <span>❤️ {p.likeCount.toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 5) 방명록 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">방명록</p>

          {myUid ? (
            <div className="mb-4">
              <textarea
                value={gbMsg}
                onChange={(e) => setGbMsg(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder={isOwner ? "내 코지홈에 한마디" : "방명록을 남겨보세요"}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddGuestbook}
                  disabled={gbSending || !gbMsg.trim()}
                  className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85 disabled:opacity-50"
                >
                  {gbSending ? "남기는 중..." : "남기기"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-xl bg-neutral-100 dark:bg-zinc-900 p-3.5 text-[13px] text-neutral-500 dark:text-neutral-400">
              방명록을 남기려면{" "}
              <Link href="/login" className="font-bold text-[#F9954E]">
                로그인
              </Link>
              하세요.
            </div>
          )}

          {guestbook.length === 0 ? (
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">아직 방명록이 없어요</p>
          ) : (
            <ul className="space-y-3">
              {guestbook.map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl bg-neutral-100 dark:bg-zinc-900 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-neutral-800 dark:text-neutral-100 truncate">
                      {g.fromName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {fmtDate(g.at) && (
                        <span className="text-[11px] text-neutral-400">{fmtDate(g.at)}</span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteGuestbook(g.id)}
                          className="text-[11px] text-neutral-400 hover:text-red-500 font-bold"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[14px] text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {g.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
