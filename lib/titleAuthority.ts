// 칭호 권위 resolver — **client/server 공통 순수 함수** (05-09).
//
// ⚠️ 왜 있는가 — 유료 칭호(39종, 30~800 솜사탕)는 효과가 `text` 문자열 하나뿐이었다.
//   자유 입력창에 같은 글자를 치면 구매 결과와 **바이트 단위로 동일**한 화면이 나왔다.
//   → 카탈로그 칭호와 커스텀 칭호를 데이터로 분리하고, **rarity 효과는 소유가 확인된
//     카탈로그 칭호에만** 부여한다. 그 판정을 여기 한 곳에 모은다.
//
// ⚠️ 설계 규칙
//   · Firestore 를 추가로 읽지 않는다(N+1 금지). 카탈로그는 정적 레지스트리에서 해결한다.
//   · rarity·style 을 **문서에 저장하지 않는다** — 저장하면 그 자체가 위조 대상이 된다.
//   · 사용자 문자열로 CSS class·HTML·style URL 을 조합하지 않는다. 반환하는 토큰은 **고정 상수**다.
//   · 렌더러는 권한을 재검증하지 않고 이 결과만 소비한다.
//   · 이 파일은 서버 전용 모듈을 import 하지 않는다(클라 번들 안전).
import { SHOP_ITEMS, itemKey, type Rarity } from "./shopItems.ts";

export type TitleMode = "catalog" | "custom" | "none";

/** 렌더러가 소비하는 view-model. 이 밖의 값으로 스타일을 만들지 않는다. */
export interface ResolvedTitle {
  /** 표시 문자열(정규화·절단 완료). 빈 문자열이면 표시하지 않는다. */
  text: string;
  mode: TitleMode;
  /** 소유가 확인된 카탈로그 칭호일 때만 채워진다. 그 외에는 null. */
  rarity: Rarity | null;
  /** itemKey("title::id") — 카탈로그로 확인됐을 때만. */
  itemId: string | null;
  /** 유료 효과(배지·테두리)를 받을 자격이 있는가. */
  isVerifiedCatalog: boolean;
  /** 고정 토큰. 사용자 입력이 섞이지 않는다. */
  tone: TitleTone;
}

export type TitleTone = "neutral" | "rare" | "epic" | "legend";

/** 자유 입력 상한 — **코드포인트 기준**(바이트 아님). Rules 로는 표현할 수 없어 서버가 판정한다. */
export const CUSTOM_TITLE_MAX = 24;

// ── 카탈로그 인덱스 (모듈 로드 시 1회) ────────────────────────────────
const TITLE_ITEMS = SHOP_ITEMS.filter((i) => i.slot === "title");
/** itemKey → 아이템 */
const BY_KEY = new Map(TITLE_ITEMS.map((i) => [itemKey(i.slot, i.id), i]));
/** 표시 문자열(ko/en) → itemKey. legacy 문서를 해석할 때만 쓴다. */
const TEXT_TO_KEY = new Map<string, string>();
for (const i of TITLE_ITEMS) {
  const k = itemKey(i.slot, i.id);
  if (i.text) TEXT_TO_KEY.set(i.text, k);
  if (i.textEn) TEXT_TO_KEY.set(i.textEn, k);
}

export function isTitleItemKey(v: unknown): v is string {
  return typeof v === "string" && BY_KEY.has(v);
}
export function titleCatalogText(key: string, isEn = false): string {
  const it = BY_KEY.get(key);
  if (!it) return "";
  return (isEn && it.textEn) || it.text || "";
}
export function titleCatalogRarity(key: string): Rarity | null {
  return BY_KEY.get(key)?.rarity ?? null;
}
export function titleCatalogSize(): number { return BY_KEY.size; }

// ── 문자열 위생 ──────────────────────────────────────────────────────
/**
 * 표시용 문자열에서 제거할 문자 — **원시 문자를 소스에 두지 않고 전부 이스케이프로 쓴다**
 *   (원시 바이트가 섞이면 git 이 binary 로 취급하고, 문자 클래스 안에서 의도치 않은 범위가 생긴다).
 *   C0 제어 0000–001F · DEL 007F · C1 0080–009F
 *   zero-width/서식 200B–200F · bidi override 202A–202E · 방향 격리 2066–2069 · BOM FEFF
 */
const UNSAFE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/**
 * 커스텀 칭호 정규화 — NFC · 위험문자 제거 · 공백 축약 · trim · 코드포인트 절단.
 * ⚠️ 서버와 클라이언트가 **같은 함수**를 쓴다. 서버 결과가 최종이며 클라는 미리보기용이다.
 */
export function normalizeCustomTitle(raw: unknown): string {
  if (typeof raw !== "string") return "";
  // ⚠️ 탭·줄바꿈·CR 은 **공백으로 바꾼 뒤** 축약한다(그냥 지우면 단어가 붙어버린다).
  //    나머지 제어문자·zero-width·bidi·BOM 은 제거한다.
  //    ⚠️ ZWJ(U+200D)도 제거 대상이다 — 이모지 시퀀스(👨‍👩‍👧‍👦)는 개별 이모지로 분해되지만,
  //       보이지 않는 문자로 길이·표시를 조작하는 경로를 남기지 않는 쪽을 택했다.
  let s = raw.normalize("NFC").replace(/[\t\n\r]/g, " ").replace(UNSAFE_CHARS, "");
  s = s.replace(/\s+/g, " ").trim();
  const cps = [...s];
  return cps.length > CUSTOM_TITLE_MAX ? cps.slice(0, CUSTOM_TITLE_MAX).join("") : s;
}

/** 정규화 후에도 저장 가능한 값인가(빈 문자열은 '해제'로 처리하므로 여기서는 false). */
export function isValidCustomTitle(raw: unknown): boolean {
  return normalizeCustomTitle(raw).length > 0;
}

// ── resolver ─────────────────────────────────────────────────────────
const NONE: ResolvedTitle = { text: "", mode: "none", rarity: null, itemId: null, isVerifiedCatalog: false, tone: "neutral" };
const toneOf = (r: Rarity | null): TitleTone =>
  r === "legend" ? "legend" : r === "epic" ? "epic" : r === "rare" ? "rare" : "neutral";

/** resolver 입력 — users 문서에서 필요한 필드만. 추가 조회를 유발하지 않는다. */
export interface TitleSource {
  titleMode?: unknown;
  titleId?: unknown;
  customTitle?: unknown;
  /** legacy 표시 문자열 */
  title?: unknown;
  ownedItems?: unknown;
}

function ownedSetOf(ownedItems: unknown): Set<string> {
  if (!Array.isArray(ownedItems)) return new Set();
  return new Set(ownedItems.filter((x): x is string => typeof x === "string"));
}

function catalogResult(key: string, isEn: boolean): ResolvedTitle {
  const rarity = titleCatalogRarity(key);
  return {
    text: titleCatalogText(key, isEn),
    mode: "catalog",
    rarity,
    itemId: key,
    isVerifiedCatalog: true,
    tone: toneOf(rarity),
  };
}
function neutralResult(text: string, mode: TitleMode = "custom"): ResolvedTitle {
  const t = normalizeCustomTitle(text);
  if (!t) return NONE;
  return { text: t, mode, rarity: null, itemId: null, isVerifiedCatalog: false, tone: "neutral" };
}

/**
 * 표시할 칭호를 결정한다. **이 함수 밖에서 rarity 를 판단하지 말 것.**
 *
 * 규칙(문서 docs/title-authority-contract.md §3 과 1:1):
 *   ①  catalog + titleId 유효 + 소유        → 카탈로그 text + rarity
 *   ①' catalog 인데 미소유·불명 id          → 중립(fail-safe)
 *   ②  custom                               → customTitle + 중립
 *   ③  신규필드 없음 + legacy 가 카탈로그 문자열 + **해당 id 보유** → catalog + rarity
 *   ④  신규필드 없음 + 카탈로그 문자열이지만 미보유 → **중립만**(유료 효과 금지)
 *   ⑤  신규필드 없음 + 일반 커스텀           → 중립
 *   ⑥  none / 값 없음                        → 표시 없음
 *   ⑦  타입 손상·길이 초과·제어문자          → 안전한 기본값
 */
export function resolveProfileTitle(src: TitleSource | null | undefined, isEn = false): ResolvedTitle {
  if (!src || typeof src !== "object") return NONE;
  const owned = ownedSetOf(src.ownedItems);
  const mode = src.titleMode;

  if (mode === "none") return NONE;                                       // ⑥

  if (mode === "catalog") {
    const key = src.titleId;
    if (isTitleItemKey(key) && owned.has(key)) return catalogResult(key, isEn);  // ①
    // ①' 소유하지 않았거나 카탈로그에 없는 id → 유료 효과 없이 중립 처리.
    //    표시 문자열은 legacy 값이 있으면 그것을, 없으면 아무것도 보여주지 않는다.
    return neutralResult(typeof src.title === "string" ? src.title : "");
  }

  if (mode === "custom") return neutralResult(typeof src.customTitle === "string" ? src.customTitle : "");            // ②

  // ── 신규 필드가 없는 legacy 문서 ──
  const legacy = src.title;
  if (typeof legacy !== "string") return NONE;                            // ⑦ 타입 손상
  const trimmed = legacy.trim();
  if (!trimmed) return NONE;

  const key = TEXT_TO_KEY.get(trimmed);
  if (key) {
    if (owned.has(key)) return catalogResult(key, isEn);                   // ③
    return neutralResult(trimmed);                                        // ④ 미보유 → 유료 효과 금지
  }
  return neutralResult(trimmed);                                          // ⑤
}

/** 표시용 배지 토큰 — 렌더러가 이 표를 참조한다(사용자 문자열 조합 금지). */
export const TITLE_TONE_ICON: Record<TitleTone, string> = {
  neutral: "",
  rare: "◆",
  epic: "✦",
  legend: "★",
};
