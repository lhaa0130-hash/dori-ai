"use client";
// 칭호 배지 — **모든 표시 위치가 이 컴포넌트만 쓴다** (05-09).
//
// ⚠️ 렌더러는 권한을 재검증하지 않는다. resolveProfileTitle() 결과만 소비한다.
//   유료(카탈로그·소유 확인) 칭호에만 rarity 배지가 붙고, 커스텀·legacy 는 중립 스타일이다.
//   → 유료 문구를 그대로 타이핑해도 배지·테두리·아이콘을 얻지 못한다.
//
// ⚠️ 클래스는 **고정 상수 표**에서만 고른다. 사용자 문자열로 Tailwind class·HTML·style 을
//   조합하지 않는다. 텍스트는 React 텍스트 노드로만 출력한다(dangerouslySetInnerHTML 금지).
import { resolveProfileTitle, TITLE_TONE_ICON, type TitleSource, type TitleTone } from "@/lib/titleAuthority";

/**
 * 톤별 고정 스타일.
 * ⚠️ **색만으로 등급을 구분하지 않는다** — 아이콘(◆/✦/★)과 테두리 두께가 함께 달라진다.
 *    대비는 밝은/어두운 테마 모두 WCAG AA 를 목표로 진한 텍스트색을 쓴다.
 *    애니메이션은 넣지 않는다(넣게 되면 prefers-reduced-motion 대응 필수).
 */
const TONE_CLASS: Record<TitleTone, string> = {
  neutral: "bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-200",
  rare: "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 ring-1 ring-blue-400/70",
  epic: "bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 ring-1 ring-purple-400/70 shadow-[0_0_0_1px_rgba(168,85,247,0.18)]",
  legend: "bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 ring-[1.5px] ring-amber-500/80 shadow-[0_0_0_1px_rgba(245,158,11,0.22)]",
};

/** 스크린리더용 등급 안내(아이콘만으로는 의미가 전달되지 않으므로). */
const TONE_LABEL: Record<TitleTone, string> = {
  neutral: "",
  rare: "레어 칭호",
  epic: "에픽 칭호",
  legend: "레전드 칭호",
};

export default function TitleBadge({
  source,
  isEn = false,
  size = "sm",
  className = "",
}: {
  /** users 문서에서 온 원본 필드(추가 조회 없음) */
  source: TitleSource | null | undefined;
  isEn?: boolean;
  size?: "xs" | "sm";
  className?: string;
}) {
  const r = resolveProfileTitle(source, isEn);
  if (!r.text) return null;

  const icon = TITLE_TONE_ICON[r.tone];
  const pad = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold max-w-[180px] ${pad} ${TONE_CLASS[r.tone]} ${className}`}
      title={TONE_LABEL[r.tone] || undefined}
    >
      {icon && (
        <span aria-hidden="true" className="leading-none">{icon}</span>
      )}
      <span className="truncate">{r.text}</span>
      {TONE_LABEL[r.tone] && <span className="sr-only">{TONE_LABEL[r.tone]}</span>}
    </span>
  );
}
