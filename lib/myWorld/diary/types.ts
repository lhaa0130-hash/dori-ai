// My World — AI Diary 타입 (05-04 MVP).
// ⚠️ AI 생성 없음 — 자동 생성 문장만. 향후 GPT/Gemini 연결 시 content 를 AI 결과로 대체할 수 있게
//    구조를 분리해 둔다(metadata·type 확장). Growth/Emotion/Reward 훅은 '자리'만.

export type DiaryEntryType =
  | "attendance"          // 출석(향후 훅)
  | "character_selected"  // 대표 캐릭터 변경(이번 단계 자동기록)
  | "character_growth"    // 캐릭터 성장(향후 훅)
  | "interaction"         // 상호작용(향후)
  | "mission"             // 미션(향후 훅)
  | "game"                // 게임(향후 훅)
  | "reward"              // 보상(향후 훅)
  | "manual"              // 사용자 직접 작성(향후)
  | "system"             // 시스템(방문 등)
  | "visit"               // My World 방문(자동)
  | "room_updated";       // 내 방 저장(자동, 05-05)

export interface DiaryEntry {
  id: string;
  userId: string;
  characterId: string;      // 기록 당시 대표 캐릭터
  type: DiaryEntryType;
  title: string;
  content: string;
  createdAt: number;        // ms epoch (배열 원소라 serverTimestamp 불가 → 클라이언트 시각)
  icon: string;             // 이모지
  color: string;            // HEX
  metadata?: Record<string, unknown>; // 향후 AI/성장/보상 부가정보(자유 확장)
}

// addEntry 입력(서버가 id/userId/createdAt 채움).
export type DiaryEntryInput = Omit<DiaryEntry, "id" | "userId" | "createdAt">;

export interface DiaryState {
  entries: DiaryEntry[];    // 최신순(desc)
}
