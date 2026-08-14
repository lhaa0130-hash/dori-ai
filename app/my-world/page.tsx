"use client";

// ─────────────────────────────────────────────────────────────────────────────
// My World — "AI와 함께 살아가는 나만의 세계" 홈.
//  · 대표 캐릭터는 CharacterProvider/useCharacter(공용)로 관리 → Profile·Diary·Room 재사용.
//  · 레벨/EXP/Candy 는 기존 게임 프로필 '읽기 전용'. 방·일기·업적·작품은 placeholder.
//  · Firestore/API/출석/레벨 변경 없음.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCottonCandyBalance,
  getCachedGameProfile,
  hydrateGameData,
} from "@/lib/cottonCandy";
import {
  TIER_INFO,
  calculateLevelProgress,
  getNextLevelExp,
  getCurrentLevelStartExp,
  type UserTier,
} from "@/lib/userProfile";
import { RARITY_STYLE } from "@/lib/myWorld/character/utils";
import { getCharacter } from "@/lib/myWorld/character/registry";
import { CharacterProvider, useCharacter } from "@/contexts/CharacterContext";
import { DiaryProvider, useDiary } from "@/contexts/DiaryContext";
import { RoomProvider } from "@/contexts/RoomContext";
import { InteractionProvider } from "@/contexts/InteractionContext";
import { InteractionAudioProvider } from "@/contexts/InteractionAudioContext";
import { buildCharacterSelectedEntry } from "@/lib/myWorld/diary/constants";
import CottonCandy from "@/components/icons/CottonCandy";
import BackgroundHero from "@/components/my-world/BackgroundHero";
import CharacterCard from "@/components/my-world/CharacterCard";
import CharacterSelectModal from "@/components/my-world/CharacterSelectModal";
import DiaryCard from "@/components/my-world/DiaryCard";
import CharacterInteractionStage from "@/components/my-world/interaction/CharacterInteractionStage";
import WorldAddressStrip from "@/components/my-world/WorldAddressStrip";
// 2026-08-14 코지홈(/profile) 폐지 — 아래 넷이 옛 마이페이지가 하던 일을 이어받는다.
import ProfileEditCard from "@/components/my-world/ProfileEditCard";
import GuestbookCard from "@/components/my-world/GuestbookCard";
import GameRecordsCard from "@/components/my-world/GameRecordsCard";
import MyDashboard from "@/components/my/MyDashboard";
import { currentUid } from "@/lib/social";

type WorldTab = "world" | "guestbook" | "records" | "profile" | "account";
const TABS: { id: WorldTab; label: string }[] = [
  { id: "world", label: "세계" },
  { id: "guestbook", label: "방명록" },
  { id: "records", label: "기록" },
  { id: "profile", label: "프로필" },
  { id: "account", label: "계정" },
];

// 오늘의 한마디 — 저장 없이 날짜 기반 결정적 선택.
const HELLOS = [
  "오늘도 하나 만들어보자.",
  "작은 세계가 조금씩 자라고 있어요.",
  "오늘의 나를 기록해볼까요?",
  "새로운 친구를 만들어봐요.",
  "천천히, 나만의 속도로.",
];
function todaysHello(): string {
  const d = new Date();
  const idx = (d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()) % HELLOS.length;
  return HELLOS[idx];
}

// Provider 로 감싸 useCharacter/useDiary/useRoom 사용. Room 은 Character·Diary 에 의존(캐릭터 레이어·저장 시 일기).
export default function MyWorldPage() {
  return (
    <CharacterProvider>
      <DiaryProvider>
        <RoomProvider>
          <InteractionAudioProvider>
            <InteractionProvider>
              <MyWorldContent />
            </InteractionProvider>
          </InteractionAudioProvider>
        </RoomProvider>
      </DiaryProvider>
    </CharacterProvider>
  );
}

function MyWorldContent() {
  const { session, status } = useAuth();
  const { character, selectCharacter, saving } = useCharacter();
  const { addEntry } = useDiary();
  const [nickname, setNickname] = useState("나");
  const [level, setLevel] = useState(1);
  const [tier, setTier] = useState(1);
  const [exp, setExp] = useState(0);
  const [candy, setCandy] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<WorldTab>("world");
  const [uid, setUid] = useState<string | null>(null);

  // ?tab=profile 로 바로 들어오는 동선을 지원한다 — /@핸들 의 '프로필 편집' 이 여기로 온다.
  // (정적 export 라 서버에서 쿼리를 못 읽으므로 클라이언트에서 한 번 읽는다)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q && TABS.some((t) => t.id === q)) setTab(q as WorldTab);
  }, []);

  // currentUid() 는 Firebase Auth 를 직접 읽는다 — 세션 복원이 끝난 뒤에 잡아야 null 이 아니다.
  useEffect(() => { setUid(currentUid()); }, [session?.user?.email, status]);

  const refresh = (email: string) => {
    const gp = getCachedGameProfile(email);
    setLevel(gp?.level || 1);
    setTier(gp?.tier || 1);
    setExp(gp?.doriExp || 0);
    setCandy(getCottonCandyBalance(email));
  };

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;
    setNickname(session?.user?.name || "나");
    refresh(email);
    hydrateGameData().then(() => refresh(email)).catch(() => {});
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = () => { if (session?.user?.email) refresh(session.user.email); };
    window.addEventListener("dori-gamedata-synced", onSync);
    return () => window.removeEventListener("dori-gamedata-synced", onSync);
  }, [session?.user?.email]);

  const tierInfo = TIER_INFO[(tier >= 1 && tier <= 10 ? tier : 1) as UserTier];
  const progress = calculateLevelProgress(exp, level);
  const nextTotal = getCurrentLevelStartExp(level) + getNextLevelExp(level);
  const loggedIn = status === "authenticated";
  const rarity = RARITY_STYLE[character.rarity];

  const handleSelect = (id: string) => {
    // 실제 대표 캐릭터가 바뀔 때만 자동 기록(§5). 로그인 아니면 addEntry 내부에서 무시.
    if (id !== character.id) addEntry(buildCharacterSelectedEntry(getCharacter(id)));
    selectCharacter(id);
    setModalOpen(false);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4 sm:pt-6">
      {/* ── Hero ── */}
      <BackgroundHero gradient={character.defaultBackground}>
        <div className="flex flex-col items-center px-5 pb-6 pt-8 text-center">
          <CharacterCard size={104} character={character} onEdit={() => setModalOpen(true)} />

          {/* 캐릭터 이름 · 희귀도 */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1">
            <span className="text-[13px] font-black text-white">{character.name}</span>
            <span className="text-[10px] font-bold" style={{ color: "#fff", opacity: 0.85 }}>· {rarity.label}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-black" style={{ color: "#fff", backgroundColor: "rgba(0,0,0,0.28)" }}>
              {tierInfo.name}
            </span>
            <span className="text-[15px] font-black text-white drop-shadow-sm">Lv.{level}</span>
          </div>
          <h1 className="mt-1.5 text-[20px] font-extrabold text-white drop-shadow-sm">{nickname}</h1>
          <p className="mt-0.5 text-[13px] font-medium text-white/90 drop-shadow-sm">“{todaysHello()}”</p>

          {/* EXP progress */}
          <div className="mt-4 w-full max-w-xs">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-white/90">
              <span>EXP</span>
              <span>{exp.toLocaleString()} / {nextTotal.toLocaleString()}</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/35">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </div>

          {/* Candy */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 shadow-sm">
            <CottonCandy className="h-4 w-4" />
            <span className="text-[13px] font-black text-stone-800">{candy.toLocaleString()}</span>
          </div>
        </div>
      </BackgroundHero>

      {!loggedIn && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-[13px] font-semibold text-stone-500 dark:text-stone-400">
            로그인하면 나만의 My World가 채워져요
          </span>
          <Link href="/login" className="rounded-xl bg-[#F9954E] px-3.5 py-1.5 text-[12px] font-black text-white">로그인</Link>
        </div>
      )}

      {/* 내 세계 주소 — 꾸민 결과를 /@핸들 공개 홈으로 이어 주는 줄(2026-08-13).
          핸들이 없으면 정하러 가는 길을 보여준다. 비로그인이면 아무것도 그리지 않는다. */}
      <WorldAddressStrip />

      {/* ── 탭 ──
          2026-08-14: 코지홈(/profile)을 폐지하고 마이월드가 유일한 개인 페이지가 되면서,
          한 화면에 다 넣으면 너무 길어져 탭으로 나눴다. 기본은 '세계'(꾸미기가 주인공). */}
      <nav className="mt-5 border-b border-stone-100 dark:border-zinc-900" aria-label="마이월드 탭">
        <div className="scrollbar-hide flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 border-b-2 px-3.5 py-2.5 text-[13px] font-bold transition-colors ${
                  active
                    ? "border-[#F9954E] text-[#E8832E] dark:text-[#FBAA60]"
                    : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── 탭 내용 ── */}
      {/* 세계 탭 — 2026-08-14 정리. 예전엔 카드 6개가 세로로 쌓였는데 실제로 동작하는 건 둘뿐이었다.
          걷어낸 것과 이유:
            RoomPreviewCard   같은 방을 두 번 그렸다(위 CharacterInteractionStage 도 RoomCanvas 를 쓴다).
                              '방 꾸미기' 버튼만 그 카드로 옮겨 하나로 합쳤다.
            AchievementsCard  PLACEHOLDER 6개가 전부 잠긴 **가짜 UI** 였다(실제 업적 데이터 미연결,
                              컴포넌트 주석에도 "향후 연결"이라고 적혀 있다). 채울 게 생기면 그때 붙인다.
            CreationsCard     '오늘 만든 작품' — 만들 경로(동물 생성)가 비공개라 항상 비어 있었다.
            RecentActivityCard 항상 "아직 활동이 없습니다". 쌓일 게 생기면 되살린다.
          ⛔ 빈 카드를 쌓지 않는다 — 비어 있는 칸이 늘수록 페이지는 '지저분한데 아무것도 없는' 상태가 된다. */}
      {tab === "world" && (
        <div className="mt-4 space-y-4">
          <CharacterInteractionStage />
          <DiaryCard />
        </div>
      )}

      {tab === "guestbook" && (
        <div className="mt-4">
          {uid
            ? <GuestbookCard ownerUid={uid} ownerName={nickname} />
            : <p className="rounded-3xl border border-stone-100 bg-white p-5 text-[13px] text-stone-400 dark:border-zinc-800 dark:bg-zinc-950">로그인하면 방명록을 쓸 수 있어요.</p>}
        </div>
      )}

      {tab === "records" && (
        <div className="mt-4">
          {uid
            ? <GameRecordsCard uid={uid} isOwner />
            : <p className="rounded-3xl border border-stone-100 bg-white p-5 text-[13px] text-stone-400 dark:border-zinc-800 dark:bg-zinc-950">로그인하면 게임 기록이 쌓여요.</p>}
        </div>
      )}

      {tab === "profile" && <div className="mt-4"><ProfileEditCard /></div>}

      {/* 계정·활동 — 출석·미션·리워드. 옛 마이페이지 본문이 이 컴포넌트로 이미 분리돼 있었다. */}
      {tab === "account" && <div className="mt-4"><MyDashboard /></div>}

      {/* 대표 캐릭터 선택 모달 */}
      <CharacterSelectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedId={character.id}
        saving={saving}
        onSelect={handleSelect}
      />
    </main>
  );
}
