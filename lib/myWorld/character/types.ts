// My World — 캐릭터 타입 (05-03 Foundation).
// ⚠️ 성장/감정/의상/포즈/애니메이션/AI는 이번 단계에서 '자리'만 만든다(값은 기본값·미구현).
//    잠금 정책 없음 — 12종 모두 처음부터 사용 가능.

export type CharacterRarity = "common" | "rare" | "epic" | "legendary";

// 감정/포즈/스킨/코스튬 — 기본값만 저장. 실제 기능은 후속 단계.
export type CharacterExpression = "default" | "happy" | "sad" | "surprised" | "sleepy" | "wink";
export type CharacterPose = "idle" | "wave" | "sit" | "jump" | "cheer";

export interface Character {
  id: string;
  name: string;              // 한글 이름
  englishName: string;
  species: string;
  description: string;
  themeColor: string;        // 대표 테마 컬러(HEX)
  rarity: CharacterRarity;
  image: string;             // 대표 이미지(portrait) 경로 — 향후 /characters/{id}/portrait.webp
  thumbnail: string;         // 목록 썸네일 경로 — 향후 /characters/{id}/thumbnail.webp
  defaultBackground: string; // 대표 배경 그라데이션(데이터, AI 아님)
  defaultExpression: CharacterExpression;
  defaultPose: CharacterPose;
  isDefault?: boolean;
  emoji: string;             // 이미지 준비 전 placeholder(이모지)
}

// Firestore 저장 상태 — myWorld.character 아래. 확장 필드는 기본값만.
export interface MyCharacterState {
  selectedId: string;
  owned: string[];           // 잠금 없음 → 전체 보유(마이그레이션으로 12종)
  expression: CharacterExpression; // 기본값 저장(기능 미구현)
  pose: CharacterPose;             // 기본값 저장(기능 미구현)
  skin: string;                    // "default"
  costume: string;                 // "default"
  background: string;              // "default"(선택 캐릭터 defaultBackground 사용)
  // updatedAt 은 저장 시 serverTimestamp — 상태 타입엔 포함하지 않음.
}
