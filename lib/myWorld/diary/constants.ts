// My World — Diary 상수/문장 빌더 (05-04).
// ⚠️ AI 생성 아님 — 정해진 자동 문장(placeholder)만. 향후 이 빌더의 content 를 AI 결과로 교체 가능.
import type { Character } from "@/lib/myWorld/character/types";
import type { DiaryEntryInput, DiaryEntryType } from "@/lib/myWorld/diary/types";
import { josaEulReul, josaWaGwa } from "@/lib/myWorld/diary/utils";

// 타입별 기본 아이콘/색/라벨(캐릭터가 있으면 캐릭터 이모지/테마색 우선).
export const DIARY_TYPE_META: Record<DiaryEntryType, { icon: string; color: string; label: string }> = {
  attendance:         { icon: "🎁", color: "#F9954E", label: "출석" },
  character_selected: { icon: "🎭", color: "#8B7BE8", label: "대표 캐릭터" },
  character_growth:   { icon: "🌱", color: "#3FAF9E", label: "성장" },
  interaction:        { icon: "💬", color: "#4FA3E3", label: "상호작용" },
  mission:            { icon: "🎯", color: "#F368A0", label: "미션" },
  game:               { icon: "🎮", color: "#7E88A8", label: "게임" },
  reward:             { icon: "🪙", color: "#EDA92E", label: "보상" },
  manual:             { icon: "✍️", color: "#94a3b8", label: "일기" },
  system:             { icon: "✨", color: "#a78bfa", label: "시스템" },
  visit:              { icon: "🌤️", color: "#F9954E", label: "방문" },
  room_updated:       { icon: "🏠", color: "#E5A663", label: "내 방" },
};

export const DIARY_UI_LIMIT = 10;      // 타임라인 표시 개수
export const DIARY_STORE_LIMIT = 100;  // Firestore 유지 개수

// ── 자동 기록 문장 빌더(placeholder). 모두 DiaryEntryInput 반환. ──

/** 대표 캐릭터 변경 — 이번 단계 자동 기록. */
export function buildCharacterSelectedEntry(character: Character): DiaryEntryInput {
  return {
    type: "character_selected",
    characterId: character.id,
    icon: character.emoji,
    color: character.themeColor,
    title: "새로운 친구",
    content: `${character.name}${josaWaGwa(character.name)} 함께하기 시작했어요.`,
    metadata: { characterName: character.name },
  };
}

/** 내 방 저장 — 자동(방 저장 성공 후 1건, 05-05). */
export function buildRoomUpdatedEntry(character: Character): DiaryEntryInput {
  return {
    type: "room_updated",
    characterId: character.id,
    icon: DIARY_TYPE_META.room_updated.icon,
    color: DIARY_TYPE_META.room_updated.color,
    title: "내 방 꾸미기",
    content: `${character.name}${josaWaGwa(character.name)} 함께 지낼 방을 새롭게 꾸몄어요.`,
    metadata: {},
  };
}

/** My World 방문 — 자동(하루 1회 훅). */
export function buildVisitEntry(character: Character): DiaryEntryInput {
  return {
    type: "visit",
    characterId: character.id,
    icon: DIARY_TYPE_META.visit.icon,
    color: character.themeColor,
    title: "오늘의 방문",
    content: `${character.name}${josaWaGwa(character.name)} 새로운 하루를 시작했어요.`,
    metadata: {},
  };
}

// ── 향후 훅(현재 미배선). 성장/출석/보상 기능이 붙을 때 호출만 하면 기록됨. ──
/** 캐릭터 성장(Growth 미구현 → Hook만). */
export function buildCharacterGrowthEntry(character: Character): DiaryEntryInput {
  return {
    type: "character_growth",
    characterId: character.id,
    icon: DIARY_TYPE_META.character_growth.icon,
    color: character.themeColor,
    title: "성장",
    content: `${character.name}${josaEulReul(character.name)} 조금 더 자랐어요.`,
    metadata: {},
  };
}
/** 출석(출석 시스템 미수정 → Hook만). */
export function buildAttendanceEntry(character: Character): DiaryEntryInput {
  return {
    type: "attendance",
    characterId: character.id,
    icon: DIARY_TYPE_META.attendance.icon,
    color: DIARY_TYPE_META.attendance.color,
    title: "출석",
    content: `오늘도 ${character.name}${josaWaGwa(character.name)} 함께 출석했어요.`,
    metadata: {},
  };
}
