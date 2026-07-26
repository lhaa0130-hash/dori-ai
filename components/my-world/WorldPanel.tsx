"use client";

// My World — 공용 패널(디자인 시스템 단위).
//
// 왜 필요한가: 이전 화면은 흰 카드가 얇게 여러 장 반복돼 서로 단절돼 보였고, 카드마다
// radius·padding·제목 크기가 조금씩 달랐다. 표면 종류를 셋으로 못 박고 한 곳에서만 정의한다.
//   · plain  — 기본 흰 표면(주요 기능)
//   · tinted — 따뜻한 크림 틴트(묶음·보조 정보). illo.im 오렌지 계열 유지
//   · quiet  — 테두리만 있는 조용한 표면(빈 상태·안내)
//
// 사이드 열처럼 여러 정보를 이어 보여줄 때는 패널 하나에 PanelRow 를 겹쳐 쓴다
// (카드를 여러 장 쌓지 않는다).
import type { ReactNode } from "react";

export type PanelTone = "plain" | "tinted" | "quiet";

const TONE: Record<PanelTone, string> = {
  plain: "border-stone-100 bg-white dark:border-zinc-800 dark:bg-zinc-950",
  tinted: "border-[#F9954E]/15 bg-[#FFF8F2] dark:border-zinc-800 dark:bg-zinc-900/50",
  quiet: "border-stone-100 bg-stone-50/60 dark:border-zinc-800 dark:bg-zinc-900/30",
};

export default function WorldPanel({
  title,
  subtitle,
  action,
  tone = "plain",
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
    <div className={first ? "" : "mt-3 border-t border-stone-100 pt-3 dark:border-zinc-800"}>
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
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-stone-50 px-4 py-6 text-center dark:bg-zinc-900/50">
      <span className="text-2xl" aria-hidden>{emoji}</span>
      <p className="break-keep text-[13px] font-bold text-stone-600 dark:text-stone-300">{message}</p>
      {hint && <p className="break-keep text-[11px] font-medium text-stone-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
