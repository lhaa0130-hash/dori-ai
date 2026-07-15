"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  currentUid,
  threadIdFor,
  sendDM,
  watchMyThreads,
  watchMessages,
  watchFriends,
  watchIncomingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  watchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getSuggestedUsers,
  searchUsersByName,
  MAX_GROUPS,
  type DMThread,
  type DMMessage,
  type Friend,
  type FriendRequest,
  type FriendGroup,
  type UserHit,
} from "@/lib/social";
import RangeVenn from "@/components/social/RangeVenn";

// 범위 색상 팔레트(최대 5)
const GROUP_COLORS = ["#F9954E", "#5B8DEF", "#37C2A8", "#C77DFF", "#FF6B9D"];

function formatTime(ms: number): string {
  if (!ms) return "";
  try {
    return new Date(ms).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

interface ActivePeer {
  uid: string;
  name: string;
}

type TabKey = "friends" | "groups" | "chat";

const CARD =
  "rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950";

function MessagesInner() {
  const { session, status } = useAuth();
  const searchParams = useSearchParams();

  const [myUid, setMyUid] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("friends");

  // DM 상태
  const [threads, setThreads] = useState<DMThread[]>([]);
  const [active, setActive] = useState<ActivePeer | null>(null);
  const [msgs, setMsgs] = useState<DMMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // 친구 상태
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  // 범위(그룹) 상태
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [memberEditId, setMemberEditId] = useState<string | null>(null);
  const [groupMsg, setGroupMsg] = useState("");

  // 친구 찾기 상태
  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggested, setSuggested] = useState<UserHit[]>([]);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const myName = session?.user?.name || "나";
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 현재 uid 확보 (firebase auth 기반). 세션 변화에 맞춰 재확인.
  useEffect(() => {
    setMyUid(currentUid());
  }, [status, session?.user?.email]);

  // ?to=uid&name= 으로 들어오면 해당 상대와 대화 자동 오픈
  useEffect(() => {
    const to = searchParams.get("to");
    const name = searchParams.get("name");
    if (to) {
      setActive({ uid: to, name: name || "상대" });
      setTab("chat");
    }
  }, [searchParams]);

  // 내 대화방 목록 실시간 구독
  useEffect(() => {
    if (!myUid) {
      setThreads([]);
      return;
    }
    const unsub = watchMyThreads(setThreads);
    return () => unsub();
  }, [myUid]);

  // 친구 목록 실시간 구독
  useEffect(() => {
    if (!myUid) {
      setFriends([]);
      return;
    }
    const unsub = watchFriends(setFriends);
    return () => unsub();
  }, [myUid]);

  // 받은 친구요청 실시간 구독
  useEffect(() => {
    if (!myUid) {
      setRequests([]);
      return;
    }
    const unsub = watchIncomingRequests(setRequests);
    return () => unsub();
  }, [myUid]);

  // 범위(그룹) 목록 실시간 구독
  useEffect(() => {
    if (!myUid) {
      setGroups([]);
      return;
    }
    const unsub = watchGroups(setGroups);
    return () => unsub();
  }, [myUid]);

  // 추천 친구(피드에서 활동한 사람들) — 로그인 시 1회
  useEffect(() => {
    if (!myUid) { setSuggested([]); return; }
    let alive = true;
    getSuggestedUsers([], 8).then((list) => {
      if (alive) setSuggested(list.map((s) => ({ uid: s.uid, name: s.name, photoURL: s.photoURL, bio: s.bio })));
    });
    return () => { alive = false; };
  }, [myUid]);

  // 친구 찾기(이름 검색) — 디바운스 300ms
  useEffect(() => {
    const term = searchQ.trim();
    if (!term) { setSearchHits([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const hits = await searchUsersByName(term, 12);
      setSearchHits(hits);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  // 선택된 상대의 메시지 실시간 구독
  const threadId = useMemo(() => {
    if (!myUid || !active) return null;
    return threadIdFor(myUid, active.uid);
  }, [myUid, active]);

  useEffect(() => {
    if (!threadId) {
      setMsgs([]);
      return;
    }
    const unsub = watchMessages(threadId, setMsgs);
    return () => unsub();
  }, [threadId]);

  // 메시지 갱신 시 스크롤 하단 자동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, active?.uid]);

  // ── 파생: 친구 uid 집합, 대화상대 중 비친구 ──
  const friendUidSet = useMemo(() => new Set(friends.map((f) => f.uid)), [friends]);

  // 범위에 색 부여(다이어그램·범례·목록 색 일치)
  const groupsColored = useMemo(
    () => groups.slice(0, MAX_GROUPS).map((g, i) => ({ ...g, color: GROUP_COLORS[i % GROUP_COLORS.length] })),
    [groups],
  );

  // 친구 찾기 결과(검색어 있으면 검색결과, 없으면 추천)
  const findResults = searchQ.trim() ? searchHits : suggested;

  const addableFromThreads = useMemo(
    () => threads.filter((t) => t.otherUid && !friendUidSet.has(t.otherUid)),
    [threads, friendUidSet],
  );

  // ── 액션 ──
  const openChat = useCallback((uid: string, name: string) => {
    setActive({ uid, name });
    setTab("chat");
  }, []);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !active || sending) return;
    setSending(true);
    const ok = await sendDM(active.uid, active.name, myName, text);
    if (ok) setDraft("");
    setSending(false);
  }, [draft, active, myName, sending]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleAddFriend = useCallback(
    async (uid: string) => {
      const ok = await sendFriendRequest(uid, myName);
      if (ok) setRequested((prev) => new Set(prev).add(uid));
    },
    [myName],
  );

  const handleAccept = useCallback(
    async (req: FriendRequest) => {
      await acceptFriendRequest(req.fromUid, req.fromName, myName);
    },
    [myName],
  );

  const handleCreateGroup = useCallback(async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setGroupMsg("");
    const res = await createGroup(name);
    if (res === "ok") setNewGroupName("");
    else if (res === "full") setGroupMsg(`범위는 최대 ${MAX_GROUPS}개까지 만들 수 있어요.`);
    else setGroupMsg("범위 생성에 실패했어요.");
  }, [newGroupName]);

  const startEditGroup = useCallback((g: FriendGroup) => {
    setEditingGroupId(g.id);
    setEditingGroupName(g.name);
  }, []);

  const saveEditGroup = useCallback(async () => {
    if (!editingGroupId) return;
    const name = editingGroupName.trim();
    if (name) await updateGroup(editingGroupId, { name });
    setEditingGroupId(null);
    setEditingGroupName("");
  }, [editingGroupId, editingGroupName]);

  const toggleMember = useCallback(
    async (g: FriendGroup, uid: string) => {
      const has = g.memberUids.includes(uid);
      const next = has ? g.memberUids.filter((u) => u !== uid) : [...g.memberUids, uid];
      await updateGroup(g.id, { memberUids: next });
    },
    [],
  );

  // ── 비로그인: 로그인 유도 ──
  if (status === "unauthenticated" || (status !== "loading" && !myUid)) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className={`p-10 ${CARD} flex flex-col items-center text-center max-w-sm w-full`}>
          <div className="w-14 h-14 rounded-2xl bg-[#FBEEE7] dark:bg-[#F9954E]/10 flex items-center justify-center text-2xl mb-5">
            💬
          </div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-stone-900 dark:text-white mb-2">
            로그인이 필요해요
          </h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 mb-7 leading-relaxed">
            친구·범위·메시지는 로그인 후<br />이용하실 수 있습니다.
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 transition-opacity text-center"
          >
            로그인하러 가기
          </Link>
        </div>
      </main>
    );
  }

  // ── 로딩 ──
  if (status === "loading" || !myUid) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-5" />
        <p className="text-[14px] text-stone-400 font-semibold">불러오는 중입니다</p>
      </main>
    );
  }

  // ── 친구 패널 ──
  const friendsPanel = (
    <div className="flex flex-col gap-4">
      {/* 친구 찾기 */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-900">
          <span className="text-[11px] font-semibold text-[#F9954E]">친구 찾기</span>
        </div>
        <div className="px-3 py-3">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="이름으로 친구 찾기"
            maxLength={20}
            className="w-full px-4 py-2.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#F9954E]/40"
          />
          {!searchQ.trim() && (
            <p className="mt-2 px-1 text-[11px] text-stone-400">검색하지 않으면 추천 친구를 보여줘요.</p>
          )}
        </div>
        <div className="divide-y divide-stone-50 dark:divide-zinc-900/60 max-h-72 overflow-y-auto">
          {findResults.length === 0 ? (
            <p className="px-4 py-4 text-[12px] text-stone-500 dark:text-stone-400">
              {searchQ.trim() ? (searching ? "찾는 중…" : "검색 결과가 없어요.") : "추천할 친구가 아직 없어요."}
            </p>
          ) : (
            findResults.map((u) => {
              const already = friendUidSet.has(u.uid);
              const reqd = requested.has(u.uid);
              return (
                <div key={u.uid} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/profile?uid=${u.uid}`}
                      className="text-[14px] font-bold text-stone-900 dark:text-white truncate hover:underline inline-block max-w-[180px] align-bottom"
                    >
                      {u.name}
                    </Link>
                    {u.bio && (
                      <p className="text-[11px] text-stone-400 truncate max-w-[200px]">{u.bio}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddFriend(u.uid)}
                    disabled={already || reqd}
                    className={`px-3 py-1.5 rounded-full font-bold text-[12px] shrink-0 transition-opacity ${
                      already || reqd
                        ? "bg-stone-100 dark:bg-zinc-900 text-stone-400"
                        : "bg-[#F9954E] text-white active:opacity-85"
                    }`}
                  >
                    {already ? "친구" : reqd ? "요청됨" : "친구 요청"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 받은 친구 요청 */}
      {requests.length > 0 && (
        <div className={`${CARD} overflow-hidden`}>
          <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-900">
            <span className="text-[11px] font-semibold text-[#F9954E]">받은 친구 요청</span>
          </div>
          <div className="divide-y divide-stone-50 dark:divide-zinc-900/60">
            {requests.map((r) => (
              <div key={r.fromUid} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-[14px] font-bold text-stone-900 dark:text-white truncate">
                  {r.fromName}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(r)}
                    className="px-3 py-1.5 rounded-full bg-[#F9954E] text-white font-bold text-[12px] active:opacity-85 transition-opacity"
                  >
                    수락
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(r.fromUid)}
                    className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 font-bold text-[12px] active:opacity-85 transition-opacity"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 친구 추가 (대화 상대 중 비친구) */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-900">
          <span className="text-[11px] font-semibold text-[#F9954E]">친구 추가</span>
        </div>
        {addableFromThreads.length > 0 ? (
          <div className="divide-y divide-stone-50 dark:divide-zinc-900/60">
            {addableFromThreads.map((t) => (
              <div key={t.otherUid} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-[14px] font-bold text-stone-900 dark:text-white truncate">
                  {t.otherName}
                </span>
                <button
                  onClick={() => handleAddFriend(t.otherUid)}
                  className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200 font-bold text-[12px] active:opacity-85 transition-opacity shrink-0"
                >
                  친구 추가
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-4">
            <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
              추가할 수 있는 대화 상대가 없어요.
            </p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-stone-100 dark:border-zinc-900">
          <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-relaxed">
            다른 회원의 코지홈(프로필)에서도 친구 추가할 수 있어요.
          </p>
        </div>
      </div>

      {/* 내 친구 목록 */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-900">
          <span className="text-[11px] font-semibold text-[#F9954E]">내 친구</span>
        </div>
        {friends.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="text-3xl mb-3 opacity-30">🧑‍🤝‍🧑</div>
            <p className="text-[13px] text-stone-500 dark:text-stone-400">아직 친구가 없어요.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50 dark:divide-zinc-900/60">
            {friends.map((f) => (
              <div key={f.uid} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-[14px] font-bold text-stone-900 dark:text-white truncate">
                  {f.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openChat(f.uid, f.name)}
                    className="px-3 py-1.5 rounded-full bg-[#F9954E] text-white font-bold text-[12px] active:opacity-85 transition-opacity"
                  >
                    대화
                  </button>
                  <button
                    onClick={() => removeFriend(f.uid)}
                    className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 font-bold text-[12px] active:opacity-85 transition-opacity"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── 범위(그룹) 패널 ──
  const groupsPanel = (
    <div className="flex flex-col gap-4">
      {/* 범위 다이어그램(교집합·합집합 시각화) */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-900 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#F9954E]">범위 다이어그램</span>
          <span className="text-[11px] text-stone-400">{groups.length}/{MAX_GROUPS}</span>
        </div>
        <div className="px-4 py-5">
          <RangeVenn groups={groupsColored} friends={friends} />
          <p className="mt-3 text-center text-[11px] text-stone-400 leading-relaxed">
            한 친구를 여러 범위에 넣으면 겹치는 자리(교집합)에 모여요. 아래 &lsquo;멤버 관리&rsquo;에서 넣고 빼보세요.
          </p>
        </div>
      </div>

      {/* 범위 만들기 */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-900 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#F9954E]">범위 만들기</span>
          <span className="text-[11px] text-stone-400">최대 {MAX_GROUPS}개</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-3">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateGroup();
              }
            }}
            placeholder="범위 이름 (예: 회사동료, 남자, 설계)"
            maxLength={20}
            className="flex-1 px-4 py-2.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#F9954E]/40 disabled:opacity-50"
            disabled={groups.length >= MAX_GROUPS}
          />
          <button
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim() || groups.length >= MAX_GROUPS}
            className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 transition-opacity disabled:opacity-40 shrink-0"
          >
            만들기
          </button>
        </div>
        <div className="px-4 pb-3">
          {groupMsg && <p className="text-[12px] text-red-500 mb-1">{groupMsg}</p>}
          {groups.length >= MAX_GROUPS && !groupMsg && (
            <p className="text-[12px] text-stone-400 mb-1">범위는 최대 {MAX_GROUPS}개까지예요.</p>
          )}
          <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-relaxed">
            범위는 친구를 묶는 그룹이에요. 한 친구를 여러 범위에 넣을 수 있어요. &lsquo;피드 공개&rsquo;를 끄면 이 범위는 내 친구공개 피드를 볼 수 없어요.
          </p>
        </div>
      </div>

      {/* 범위 목록 */}
      {groups.length === 0 ? (
        <div className={`${CARD} px-4 py-12 text-center`}>
          <div className="text-3xl mb-3 opacity-30">🗂️</div>
          <p className="text-[13px] text-stone-500 dark:text-stone-400">아직 만든 범위가 없어요.</p>
        </div>
      ) : (
        groupsColored.map((g) => (
          <div key={g.id} className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-100 dark:border-zinc-900">
              {editingGroupId === g.id ? (
                <input
                  type="text"
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveEditGroup();
                    }
                  }}
                  maxLength={20}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-zinc-900 text-[14px] font-bold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
                />
              ) : (
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                  <span className="text-[14px] font-bold text-stone-900 dark:text-white truncate">{g.name}</span>
                </span>
              )}
              <div className="flex items-center gap-2 shrink-0">
                {editingGroupId === g.id ? (
                  <button
                    onClick={saveEditGroup}
                    className="px-3 py-1.5 rounded-full bg-[#F9954E] text-white font-bold text-[12px] active:opacity-85 transition-opacity"
                  >
                    저장
                  </button>
                ) : (
                  <button
                    onClick={() => startEditGroup(g)}
                    className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 font-bold text-[12px] active:opacity-85 transition-opacity"
                  >
                    이름수정
                  </button>
                )}
                <button
                  onClick={() => deleteGroup(g.id)}
                  className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 font-bold text-[12px] active:opacity-85 transition-opacity"
                >
                  삭제
                </button>
              </div>
            </div>

            {/* 피드 공개 토글 + 멤버 수 */}
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-200">피드 공개</p>
                <p className="text-[12px] text-stone-400 dark:text-stone-500">
                  멤버 {g.memberUids.length}명
                </p>
              </div>
              <button
                onClick={() => updateGroup(g.id, { feedVisible: !g.feedVisible })}
                role="switch"
                aria-checked={g.feedVisible}
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                  g.feedVisible ? "bg-[#F9954E]" : "bg-stone-200 dark:bg-zinc-800"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    g.feedVisible ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 멤버 관리 */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setMemberEditId(memberEditId === g.id ? null : g.id)}
                className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200 font-bold text-[13px] active:opacity-85 transition-opacity"
              >
                {memberEditId === g.id ? "멤버 관리 닫기" : "멤버 관리"}
              </button>
              {memberEditId === g.id && (
                <div className="mt-3">
                  {friends.length === 0 ? (
                    <p className="text-[12px] text-stone-400 dark:text-stone-500 py-2">
                      먼저 친구를 추가해 주세요.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {friends.map((f) => {
                        const checked = g.memberUids.includes(f.uid);
                        return (
                          <label
                            key={f.uid}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-900/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMember(g, f.uid)}
                              className="w-4 h-4 accent-[#F9954E]"
                            />
                            <span className="text-[14px] text-stone-800 dark:text-stone-200 truncate">
                              {f.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ── 대화 목록(좌측 하단/탭) ──
  const threadsList = (
    <div className={`${CARD} overflow-hidden flex flex-col`}>
      <div className="px-4 py-3 border-b border-stone-100 dark:border-zinc-900">
        <span className="text-[11px] font-semibold text-[#F9954E]">대화</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="text-3xl mb-3 opacity-30">📭</div>
            <p className="text-[13px] text-stone-500 dark:text-stone-400">아직 대화가 없어요.</p>
          </div>
        ) : (
          threads.map((t) => {
            const isActive = active?.uid === t.otherUid;
            return (
              <button
                key={t.id}
                onClick={() => openChat(t.otherUid, t.otherName)}
                className={`w-full text-left px-4 py-3 border-b border-stone-50 dark:border-zinc-900/60 transition-colors ${
                  isActive
                    ? "bg-[#FBEEE7] dark:bg-[#F9954E]/10"
                    : "hover:bg-stone-50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[14px] font-bold text-stone-900 dark:text-white truncate">
                    {t.otherName}
                  </span>
                  <span className="text-[10px] text-stone-400 shrink-0">{formatTime(t.lastAt)}</span>
                </div>
                <p className="text-[12px] text-stone-500 dark:text-stone-400 truncate">
                  {t.lastText || "새 대화"}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── 대화창 ──
  const chatPanel = (
    <section className={`${CARD} flex flex-col overflow-hidden min-h-[60vh] sm:min-h-0 sm:h-full`}>
      {!active ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
          <div className="text-4xl mb-3 opacity-30">💬</div>
          <p className="text-[14px] text-stone-500 dark:text-stone-400">
            친구나 대화 목록에서 상대를 선택해 주세요.
          </p>
        </div>
      ) : (
        <>
          {/* 대화창 헤더 */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 dark:border-zinc-900">
            <button
              onClick={() => setActive(null)}
              className="sm:hidden -ml-1 px-2 py-1 rounded-lg text-stone-500 dark:text-stone-400 active:opacity-60"
              aria-label="목록으로"
            >
              ←
            </button>
            <span className="text-[15px] font-bold text-stone-900 dark:text-white truncate">
              {active.name}
            </span>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {msgs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-[13px] text-stone-400 dark:text-stone-500">
                  첫 메시지를 보내 대화를 시작해 보세요.
                </p>
              </div>
            ) : (
              msgs.map((m) => {
                const mine = m.fromUid === myUid;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-[14px] leading-relaxed break-words whitespace-pre-wrap ${
                        mine
                          ? "bg-[#F9954E] text-white rounded-br-md"
                          : "bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-stone-100 rounded-bl-md"
                      }`}
                    >
                      {m.text}
                      <span
                        className={`block text-[10px] mt-1 ${
                          mine ? "text-white/70" : "text-stone-400"
                        }`}
                      >
                        {formatTime(m.at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력 */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-stone-100 dark:border-zinc-900">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="메시지를 입력하세요"
              className="flex-1 px-4 py-2.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#F9954E]/40"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 transition-opacity disabled:opacity-40"
            >
              전송
            </button>
          </div>
        </>
      )}
    </section>
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "friends", label: "친구" },
    { key: "groups", label: "범위" },
    { key: "chat", label: "대화" },
  ];

  return (
    <main className="w-full min-h-screen">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        <p className="text-[11px] font-semibold text-[#F9954E] mb-1">FRIENDS &amp; MESSAGE</p>
        <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-stone-950 dark:text-white mb-1">
          메시지
        </h1>
        <p className="text-[14px] text-stone-500 dark:text-stone-400 mb-6">
          친구를 맺고 범위로 묶어, 1:1로 대화를 나눠보세요.
        </p>

        {/* 모바일 탭 */}
        <div className="sm:hidden flex items-center gap-1 p-1 mb-4 rounded-full bg-stone-100 dark:bg-zinc-900">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-full text-[13px] font-bold transition-colors ${
                tab === t.key
                  ? "bg-[#F9954E] text-white"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 모바일 레이아웃: 탭 전환 */}
        <div className="sm:hidden">
          {tab === "friends" && friendsPanel}
          {tab === "groups" && groupsPanel}
          {tab === "chat" && (
            <div className="flex flex-col gap-4">
              {!active && threadsList}
              {chatPanel}
            </div>
          )}
        </div>

        {/* 데스크톱 레이아웃: 좌측 사이드바 + 우측 대화창 */}
        <div className="hidden sm:grid grid-cols-[320px_1fr] gap-4 sm:h-[70vh]">
          <aside className="flex flex-col gap-4 overflow-y-auto pr-1">
            {friendsPanel}
            {threadsList}
            {groupsPanel}
          </aside>
          {chatPanel}
        </div>
      </section>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="w-full min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin" />
        </main>
      }
    >
      <MessagesInner />
    </Suspense>
  );
}
