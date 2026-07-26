"use client";

// My World — 성장 기록.
//
// 이전 "업적" 카드는 6칸 모두 자물쇠로 고정돼 정보량이 0 이었다(해금 조건도, 데이터 소스도 없음).
// 여기서는 이미 존재하는 값만 모아 실제 성장을 보여준다 — 관계 단계, 친밀도, 레벨,
// 최근 활동 수, 가구 수, 일기 수. 새 지표를 발명하지 않는다.
import { useDiary } from "@/contexts/DiaryContext";
import { useInteraction } from "@/contexts/InteractionContext";
import { useRoom } from "@/contexts/RoomContext";
import WorldPanel, { PanelRow } from "@/components/my-world/WorldPanel";
import { relationshipFor } from "@/lib/myWorld/interaction/catalog";
import type { GameProfileView } from "@/hooks/my-world/useGameProfile";

const RELATIONSHIP = {
  new: { label: "새 친구", next: "익숙한 사이", at: 25 },
  familiar: { label: "익숙한 사이", next: "가까운 사이", at: 50 },
  close: { label: "가까운 사이", next: "단짝 친구", at: 75 },
  best_friend: { label: "단짝 친구", next: null, at: 100 },
} as const;

export default function GrowthCard({ profile }: { profile: GameProfileView }) {
  const { state } = useInteraction();
  const { savedRoom } = useRoom();
  const { entries } = useDiary();

  const stage = RELATIONSHIP[relationshipFor(state.affinity)];
  const remaining = stage.next ? Math.max(0, stage.at - state.affinity) : 0;

  return (
    <WorldPanel title="성장 기록" subtitle="지금까지 쌓인 것" labelledById="growth-heading">
      {/* 관계 단계 — 다음 단계까지 얼마나 남았는지 문장으로 알린다(색 단독 전달 금지) */}
      <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-[#FFF3EA] px-3.5 py-3 dark:from-pink-950/30 dark:to-zinc-900">
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

      {/* 친밀도 수치는 위 "지금 관계" 블록과 무대의 "지금 상태" 에서 이미 보여준다 —
          같은 숫자를 세 번 반복하지 않는다. */}
      <div className="mt-3">
        <PanelRow label="레벨" icon="✨" first>
          <span className="tabular-nums">Lv.{profile.level}</span>
        </PanelRow>
        <PanelRow label="최근 활동" icon="🕘">
          <span className="tabular-nums">{state.recent.length}건</span>
        </PanelRow>
        <PanelRow label="배치한 가구" icon="🛋️">
          <span className="tabular-nums">{savedRoom.placedItems.length}개</span>
        </PanelRow>
        <PanelRow label="일기" icon="📖">
          <span className="tabular-nums">{entries.length}건</span>
        </PanelRow>
      </div>
    </WorldPanel>
  );
}
