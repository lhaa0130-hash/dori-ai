"use client";

// My World — 기록 영역(일기 + 성장을 하나로).
//
// 지적: "프로필·오늘 상태·교감·방·일기·성장이 각각 별도 카드로 끊긴다."
// 일기와 성장은 성격이 같은 "지난 시간" 이므로 카드 두 장으로 나누지 않고
// 한 패널 안의 두 구획(PanelSection)으로 잇는다.
import { useDiary } from "@/contexts/DiaryContext";
import { useInteraction } from "@/contexts/InteractionContext";
import { useRoom } from "@/contexts/RoomContext";
import WorldPanel, { PanelEmpty, PanelRow, PanelSection } from "@/components/my-world/WorldPanel";
import DiaryTimeline from "@/components/my-world/DiaryTimeline";
import { relationshipFor } from "@/lib/myWorld/interaction/catalog";
import { DIARY_UI_LIMIT } from "@/lib/myWorld/diary/constants";
import type { GameProfileView } from "@/hooks/my-world/useGameProfile";

const RELATIONSHIP = {
  new: { label: "새 친구", next: "익숙한 사이", at: 25 },
  familiar: { label: "익숙한 사이", next: "가까운 사이", at: 50 },
  close: { label: "가까운 사이", next: "단짝 친구", at: 75 },
  best_friend: { label: "단짝 친구", next: null, at: 100 },
} as const;

export default function RecordsPanel({ profile }: { profile: GameProfileView | null }) {
  const { state } = useInteraction();
  const { savedRoom } = useRoom();
  const { entries } = useDiary();

  const stage = RELATIONSHIP[relationshipFor(state.affinity)];
  const remaining = stage.next ? Math.max(0, stage.at - state.affinity) : 0;

  return (
    <WorldPanel title="기록" subtitle="함께 지낸 시간" labelledById="records-heading"
      tone="glass">
      <PanelSection
        title="AI 일기"
        first
        action={
          entries.length > 0 ? (
            <span className="text-[11px] font-bold text-stone-400">최근 {Math.min(entries.length, DIARY_UI_LIMIT)}건</span>
          ) : undefined
        }
      >
        {profile ? (
          <DiaryTimeline />
        ) : (
          <PanelEmpty emoji="📖" message="일기는 로그인한 뒤부터 기록돼요." hint="함께한 순간이 자동으로 쌓입니다." />
        )}
      </PanelSection>

      <PanelSection title="성장">
        {/* 관계 단계 — 다음 단계까지 얼마나 남았는지 문장으로 알린다(색 단독 전달 금지) */}
        <div className="rounded-2xl bg-gradient-to-br from-[#FDE7EF] to-[#FFF3EA] px-3.5 py-3 dark:from-pink-950/30 dark:to-zinc-900">
          <p className="text-[11px] font-bold text-stone-500 dark:text-zinc-400">지금 관계</p>
          <p className="mt-0.5 text-[16px] font-extrabold text-stone-900 dark:text-white">
            <span aria-hidden>💗</span> {stage.label}
          </p>
          <p className="mt-1 break-keep text-[11px] font-semibold text-stone-500 dark:text-zinc-400">
            {stage.next
              ? `친밀도 ${remaining} 더 쌓으면 ‘${stage.next}’ 가 돼요.`
              : "가장 가까운 사이예요. 계속 함께 지내요."}
          </p>
        </div>

        {/* 친밀도 수치는 위 관계 블록과 무대의 상태 영역에 이미 있어 반복하지 않는다. */}
        <div className="mt-3">
          {profile && (
            <PanelRow label="레벨" icon="✨" first>
              <span className="tabular-nums">Lv.{profile.level}</span>
            </PanelRow>
          )}
          <PanelRow label="최근 활동" icon="🕘" first={!profile}>
            <span className="tabular-nums">{state.recent.length}건</span>
          </PanelRow>
          <PanelRow label="배치한 가구" icon="🛋️">
            <span className="tabular-nums">{savedRoom.placedItems.length}개</span>
          </PanelRow>
          {profile && (
            <PanelRow label="일기" icon="📖">
              <span className="tabular-nums">{entries.length}건</span>
            </PanelRow>
          )}
        </div>
      </PanelSection>
    </WorldPanel>
  );
}
