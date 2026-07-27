"use client";
// 칭호 변경 클라이언트 (05-09) — POST /api/profile/title 만 호출한다.
//
// ⚠️ 칭호는 Firestore 직접 쓰기가 Rules 로 막혀 있다. 이 파일이 유일한 경로다.
//   서버가 소유·정규화·길이·멱등을 전부 판정하고, 클라이언트는 결과만 반영한다.
//   (설계: docs/title-authority-decision.md · 계약: docs/title-authority-contract.md)
import { getFirebaseAuth } from "./firebase";
import { normalizeCustomTitle, type TitleMode } from "./titleAuthority.ts";

export interface TitleSaveResult {
  ok: boolean;
  /** 실패 사유 코드(사용자 문구는 호출부가 정한다). */
  error?: string;
  mode?: TitleMode;
  titleId?: string;
  customTitle?: string;
  /** 서버가 확정한 표시 문자열 */
  title?: string;
  duplicate?: boolean;
}

/** operationId — 같은 의도를 재전송해도 중복 저장되지 않도록 요청 내용에서 파생한다. */
function operationIdFor(intent: { mode: TitleMode; titleId?: string; customTitle?: string }): string {
  const seed = intent.mode === "catalog" ? `c_${intent.titleId || ""}`
    : intent.mode === "custom" ? `u_${intent.customTitle || ""}`
    : "n";
  // 안전 문자만 남기고, 길이를 맞춘다(서버 정규식 ^title_[A-Za-z0-9_-]{6,80}$).
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const safe = seed.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 48);
  return `title_${safe}${safe.length < 6 ? "000000" : ""}_${h.toString(36)}`;
}

async function post(body: Record<string, unknown>): Promise<TitleSaveResult> {
  let idToken = "";
  try {
    const u = getFirebaseAuth().currentUser;
    if (!u) return { ok: false, error: "unauthenticated" };
    idToken = await u.getIdToken();
  } catch { return { ok: false, error: "unauthenticated" }; }

  try {
    const res = await fetch("/api/profile/title", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      return { ok: false, error: String(json?.error || `http_${res.status}`) };
    }
    return { ok: true, mode: json.mode, titleId: json.titleId, customTitle: json.customTitle, title: json.title, duplicate: json.duplicate };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** 보유한 카탈로그 칭호를 장착한다. 미소유면 서버가 403 title_not_owned 로 거부한다. */
export function setCatalogTitle(titleId: string): Promise<TitleSaveResult> {
  return post({ mode: "catalog", titleId, operationId: operationIdFor({ mode: "catalog", titleId }) });
}

/** 직접 입력한 칭호를 저장한다. 서버가 NFC 정규화·trim·24자 절단을 최종 확정한다. */
export function setCustomTitle(raw: string): Promise<TitleSaveResult> {
  const customTitle = normalizeCustomTitle(raw);   // 미리보기와 동일한 결과를 보내기 위한 사전 정규화
  if (!customTitle) return Promise.resolve({ ok: false, error: "empty_custom_title" });
  return post({ mode: "custom", customTitle, operationId: operationIdFor({ mode: "custom", customTitle }) });
}

/** 칭호를 사용하지 않는다. */
export function clearTitle(): Promise<TitleSaveResult> {
  return post({ mode: "none", operationId: operationIdFor({ mode: "none" }) });
}

/** 사용자에게 보여줄 안내 문구(코드 → 한국어/영어). */
export function titleErrorMessage(code: string | undefined, isEn = false): string {
  switch (code) {
    case "title_not_owned":
      return isEn ? "You don't own this title yet." : "아직 보유하지 않은 칭호예요.";
    case "empty_custom_title":
      return isEn ? "Enter a title first." : "칭호를 입력해 주세요.";
    case "unauthenticated":
      return isEn ? "Please sign in again." : "다시 로그인해 주세요.";
    case "user_not_found":
      return isEn ? "Profile not found." : "프로필을 찾을 수 없어요.";
    case "network":
      return isEn ? "Network error. Please try again." : "네트워크 오류예요. 다시 시도해 주세요.";
    default:
      return isEn ? "Couldn't save the title." : "칭호를 저장하지 못했어요.";
  }
}
