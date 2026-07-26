"use client";

// My World — 공용 패널(디자인 시스템 단위).
//
// 왜 필요한가: 이전 화면은 **순백 카드**가 얇게 여러 장 반복돼 서로 단절돼 보였고,
// 사이트 본문이 이미 쓰는 따뜻한 표면(#FBEEE7 77회·#FFF1E3)과 톤이 겉돌았다.
// 표면을 4단으로 못 박고 한 곳에서만 정의한다 — 흰색은 "떠 있어야 하는 것" 에만 쓴다.
//   · paper  — 살짝 따뜻한 종이(주요 기능 패널). 순백이 아니다
//   · blush  — 따뜻한 블러시(오늘·강조 묶음). 사이트 공용 #FBEEE7 계열
//   · quiet  — 테두리만 있는 조용한 표면(안내·빈 상태)
//   · wood   — 방/무대용 우드 톤 프레임
//
// 사이드 열처럼 여러 정보를 이어 보여줄 때는 패널 하나에 PanelRow·PanelSection 을 겹쳐 쓴다
// (카드를 여러 장 쌓지 않는다).
import type { ReactNode } from "react";

export type PanelTone = "bare" | "glass" | "paper" | "blush" | "quiet" | "wood";

const TONE: Record<PanelTone, string> = {
  // bare — 테두리·배경 없음. 월드 표면 위에 바로 놓이는 주역(무대)에 쓴다.
  //  세계를 감싸는 프레임은 WorldSurface 하나뿐이어야 한다(박스 안 박스 금지).
  bare: "border-transparent bg-transparent",
  // glass — 월드 표면 위에 얇게 뜬 유리. 사이드 정보에 쓴다(순백 카드가 아니다).
  glass: "border-white/70 bg-white/55 backdrop-blur-[2px] dark:border-zinc-800 dark:bg-zinc-900/50",
  paper: "border-[#EEDFD3] bg-[#FFFDFA] dark:border-zinc-800 dark:bg-zinc-950",
  blush: "border-[#F2D9C6] bg-[#FBEEE7] dark:border-zinc-800 dark:bg-zinc-900/60",
  quiet: "border-[#EEDFD3]/80 bg-[#FFF8F1]/70 dark:border-zinc-800 dark:bg-zinc-900/30",
  wood: "border-[#E3C9AE] bg-gradient-to-b from-[#FFF6EC] to-[#F8E8D6] dark:border-zinc-800 dark:bg-zinc-950",
};

export default function WorldPanel({
  title,
  subtitle,
  action,
  tone = "paper",
  as = "section",
  bleed = false,
  children,
  labelledById,
}: {
  title?: string;
  subtitle?: string;
  /** 제목 오른쪽 컨트롤(버튼·배지). */
  action?: ReactNode;
  tone?: PanelTone;
  as?: "section" | "div";
  /** 본문이 패널 가장자리까지 닿아야 할 때(무대 등) 좌우 padding 을 없앤다. */
  bleed?: boolean;
  children: ReactNode;
  labelledById?: string;
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-3xl border ${TONE[tone]} ${bleed ? "p-3 sm:p-4" : "p-4 sm:p-5"}`}
      aria-labelledby={labelledById}
    >
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 id={labelledById} className="break-keep text-[15px] font-extrabold text-stone-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 break-keep text-[11px] font-medium text-stone-500 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex flex-none items-center gap-1.5">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}

/**
 * 하나의 패널 안에서 성격이 다른 묶음을 나누는 구획.
 * 일기·성장 처럼 별개 카드로 흩어져 보였던 것을 한 기록 영역으로 잇기 위해 쓴다.
 */
export function PanelSection({
  title,
  action,
  first = false,
  children,
}: {
  title: string;
  action?: ReactNode;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={first ? "" : "mt-4 border-t border-[#EEDFD3] pt-4 dark:border-zinc-800"}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[13px] font-extrabold text-stone-800 dark:text-zinc-100">
          {/* 제목 앞 짧은 액센트 — 카드를 나누지 않고도 구획이 읽힌다 */}
          <span aria-hidden className="h-3.5 w-[3px] rounded-full bg-[#F9954E]" />
          {title}
        </h3>
        {action && <div className="flex flex-none items-center gap-1.5">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** 패널 안에서 정보를 이어 보여주는 행. 카드를 새로 쌓지 않고 구분선으로 잇는다. */
export function PanelRow({
  label,
  icon,
  children,
  first = false,
}: {
  label: string;
  icon?: string;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <div className={first ? "" : "mt-3 border-t border-[#EEDFD3] pt-3 dark:border-zinc-800"}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-baseline gap-1.5 text-[12px] font-bold text-stone-500 dark:text-zinc-400">
          {icon && <span aria-hidden>{icon}</span>}
          <span className="truncate">{label}</span>
        </span>
        <span className="flex-none text-right text-[13px] font-black text-stone-800 dark:text-zinc-100">{children}</span>
      </div>
    </div>
  );
}

/** 의미 있는 빈 상태 — "없음"만 말하지 않고 다음 행동을 알려준다. */
export function PanelEmpty({ emoji, message, hint }: { emoji: string; message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#FFF6EC] px-4 py-6 text-center dark:bg-zinc-900/50">
      <span className="text-2xl" aria-hidden>{emoji}</span>
      <p className="break-keep text-[13px] font-bold text-stone-600 dark:text-stone-300">{message}</p>
      {hint && <p className="break-keep text-[11px] font-medium text-stone-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
