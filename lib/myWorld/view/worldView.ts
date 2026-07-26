// My World — 표시 결정을 담당하는 순수 함수(view model).
//
// 왜 이렇게 하는가: 상태별 화면을 재현하려고 production 코드에 테스트 seam
// (URL 파라미터·전역 테스트 훅·에뮬레이터 연결)을 넣으면 그 seam 이 그대로 배포된다.
// 그래서 **표시 결정만 순수 함수로 빼내고**, 테스트는 이 함수에 fixture 를 넣어 검증한다.
// 컴포넌트는 이 함수의 결과를 그대로 렌더하므로, 테스트가 실제 화면 계약을 덮는다.
//
// ⚠️ 이 파일은 보상·cooldown·금액을 계산하지 않는다. 오직 "무엇을 보여줄지" 만 정한다.

/** 인증 화면 분기의 단일 기준(useGameProfile 과 동일한 값). */
export type WorldAuthState = "checking" | "guest" | "signed";

/** 한 구획(일기·방 등)이 가질 수 있는 표시 단계. */
export type SectionPhase = "checking" | "guest" | "loading" | "error" | "empty" | "ready";

export interface SectionInput {
  authState: WorldAuthState;
  /** 원격 조회 중 */
  loading: boolean;
  /** 조회 실패 메시지(사용자 문구). 없으면 null */
  error: string | null;
  /** 이미 표시할 수 있는 항목 수 */
  count: number;
}

export interface SectionView {
  phase: SectionPhase;
  /**
   * 목록은 있는데 최신 조회가 실패한 경우 true.
   * 화면을 비우지 않고 경고만 덧붙여야 한다("없다"와 "못 불러왔다"는 다른 상태).
   */
  staleWarning: boolean;
  /** 재시도 버튼을 보여줄지 */
  canRetry: boolean;
}

/**
 * 구획의 표시 단계를 정한다.
 * 순서가 계약이다 — checking 은 guest 보다 앞이고, error 는 empty 로 위장되지 않는다.
 */
export function resolveSectionPhase(input: SectionInput): SectionView {
  const { authState, loading, error, count } = input;

  if (authState === "checking") {
    return { phase: "checking", staleWarning: false, canRetry: false };
  }
  if (authState === "guest") {
    return { phase: "guest", staleWarning: false, canRetry: false };
  }
  if (count > 0) {
    // 볼 것이 있으면 절대 비우지 않는다. 실패는 경고로만 덧붙인다.
    return { phase: "ready", staleWarning: !!error, canRetry: !!error };
  }
  if (loading) {
    return { phase: "loading", staleWarning: false, canRetry: false };
  }
  if (error) {
    // 실패 후 무한 spinner 금지 — 오류 단계로 확정하고 재시도를 제공한다.
    return { phase: "error", staleWarning: false, canRetry: true };
  }
  return { phase: "empty", staleWarning: false, canRetry: false };
}

export interface WorldViewInput {
  authState: WorldAuthState;
}

export interface WorldView {
  /** 게스트 안내 문구("저장은 안 돼요")를 보여줄지 — 확인 중에는 절대 false */
  showGuestCopy: boolean;
  /** 로그인 초대(CTA)를 보여줄지 */
  showInvite: boolean;
  /** 조작 안내(게스트 전용) */
  showGuide: boolean;
  /** 성장 수치(EXP·레벨·솜사탕)를 보여줄지 — 게스트/확인중에는 false */
  showGrowthNumbers: boolean;
  /** 기록 영역(일기+성장) */
  showRecords: boolean;
  /** 화면에 존재해야 하는 로그인 CTA 개수(중복 금지: 0 또는 1) */
  loginCtaCount: 0 | 1;
}

/**
 * 인증 상태 → 화면 구성. 거짓 표현을 구조적으로 막는다.
 *  · 확인 중에 게스트 문구·초대를 렌더하면 로그인 사용자에게 거짓이 된다.
 *  · 게스트에게 성장 수치를 보여주면 저장되지 않는 값이 "내 상태" 로 읽힌다.
 *  · 로그인 CTA 는 화면에 한 곳만 둔다(이전에는 상단·일기 등 여러 곳에 반복).
 */
export function resolveWorldView({ authState }: WorldViewInput): WorldView {
  if (authState === "checking") {
    return {
      showGuestCopy: false,
      showInvite: false,
      showGuide: false,
      showGrowthNumbers: false,
      showRecords: false,
      loginCtaCount: 0,
    };
  }
  if (authState === "guest") {
    return {
      showGuestCopy: true,
      showInvite: true,
      showGuide: true,
      showGrowthNumbers: false,
      showRecords: false,
      loginCtaCount: 1,
    };
  }
  return {
    showGuestCopy: false,
    showInvite: false,
    showGuide: false,
    showGrowthNumbers: true,
    showRecords: true,
    loginCtaCount: 0,
  };
}

/** 저장 상태 표시 — 색만으로 전달하지 않기 위해 아이콘·문구를 함께 정한다. */
export type SaveTone = "saving" | "dirty" | "saved" | "guest" | "failed";

export interface SaveView {
  tone: SaveTone;
  icon: string;
  text: string;
}

export function resolveSaveView(input: {
  authState: WorldAuthState;
  saving: boolean;
  dirty: boolean;
  saveError: string | null;
}): SaveView {
  if (input.saveError) return { tone: "failed", icon: "⚠️", text: "저장 실패" };
  if (input.saving) return { tone: "saving", icon: "⏳", text: "저장 중" };
  if (input.dirty) return { tone: "dirty", icon: "✏️", text: "저장 안 된 변경 있음" };
  if (input.authState !== "signed") return { tone: "guest", icon: "🔓", text: "체험 모드 · 로그인하면 저장돼요" };
  return { tone: "saved", icon: "✅", text: "저장됨" };
}

/** 동기화 배지 — 오프라인과 저장 지연을 구분한다(둘 다 아니면 배지를 만들지 않는다). */
export function resolveSyncBadge(input: { offline: boolean; syncing: boolean }): string | null {
  if (input.offline) return "오프라인 · 기기에 저장 중";
  if (input.syncing) return "저장 중";
  return null;
}
