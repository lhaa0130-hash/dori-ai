// 예약 핸들(@아이디) — 일반 사용자가 가질 수 없는 이름.
// ⚠️ 컴포넌트에 하드코딩하지 않고 이 유틸에서 단일 관리(서버/클라 검증 공용).
// 구성: ①스펙 지정 예약어 ②실제 루트 경로명(경로 충돌 방지) ③브랜드·시스템어.
// 핸들은 소문자로 정규화되므로 여기 값도 전부 소문자.

// ① 스펙에서 지정한 예약어
const SPEC_RESERVED = [
  "admin", "administrator", "api", "app", "auth", "login", "logout", "signup", "register",
  "settings", "profile", "account", "market", "mission", "animal", "animals", "help", "support",
  "about", "illo", "dori", "system", "official", "root", "www", "mail", "blog", "news", "studio",
  "workflow", "workflows", "my", "home", "search", "messages", "message", "chat", "friends",
  "friend", "users", "user",
];

// ② 실제 앱 최상위 라우트명 — 핸들이 이 이름을 가리면 /@name 이 페이지 경로와 충돌한다.
//    (app/ 최상위 폴더 조사 기준. 새 최상위 라우트 추가 시 여기에도 반영할 것)
const ROUTE_RESERVED = [
  "academy", "ai-assistant", "ai-models", "ai-news", "ai-tools", "community", "en", "explore",
  "family", "faq", "feed", "flat-form", "insight", "legal", "minigame", "notice", "notifications",
  "projects", "psychtest", "shop", "u", "video", "at",
];

// ③ 브랜드·오남용 방지 추가어
const EXTRA_RESERVED = [
  "doriai", "dori-ai", "me", "null", "undefined", "me", "owner", "staff", "team", "contact",
  "privacy", "terms", "policy", "security", "billing", "pay", "payment", "premium",
];

/** 예약 핸들 집합(소문자). 형식 검증을 통과한 값만 여기에 넣어 비교한다. */
export const RESERVED_HANDLES: ReadonlySet<string> = new Set(
  [...SPEC_RESERVED, ...ROUTE_RESERVED, ...EXTRA_RESERVED].map((h) => h.toLowerCase())
);

/** 예약어 여부(소문자 정규화 후 비교). */
export function isReservedHandle(raw: string): boolean {
  return RESERVED_HANDLES.has((raw || "").trim().toLowerCase());
}
