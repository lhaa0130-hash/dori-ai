"use client";

// My World — 캐릭터 주변 표현(감정 후광 · 친밀도 링 · 상승 피드백).
//
// 지적: "캐릭터의 감정·친밀도·반응이 시각적으로 충분히 전달되지 않는다."
// 수치를 표로 읽게 하지 않고 캐릭터 자체에서 읽히게 한다.
//
//  · 감정 후광 — EMOTION_META 의 색으로 캐릭터 뒤를 물들인다(감정이 바뀌면 색이 바뀐다).
//  · 친밀도 링 — 캐릭터 발밑 호(arc)의 채움 정도로 관계를 보여준다.
//  · 상승 피드백 — 보상이 들어오면 캐릭터 **머리 위**에서 짧게 떠오른다.
//    ⚠️ 캐릭터를 가리면 Phase 1 에서 고친 문제가 되돌아온다. 그래서 캐릭터 상단 바깥
//       (머리 위 여백)에만 배치하고, 실측으로 겹침 0 을 확인한다.
import { useEffect, useRef, useState } from "react";
import { EMOTION_META } from "@/lib/myWorld/interaction/catalog";
import type { Emotion, InteractionNotice } from "@/lib/myWorld/interaction/types";

/** 캐릭터 뒤 감정 후광. 캐릭터 박스보다 조금 크게, 아주 옅게. */
export function EmotionAura({ emotion, top, size }: { emotion: Emotion; top: string; size: string }) {
  const meta = EMOTION_META[emotion];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-20 rounded-full transition-[background] duration-700"
      style={{
        left: "50%",
        top,
        width: size,
        aspectRatio: "1 / 1",
        transform: "translate(-50%, -50%)",
        background: `radial-gradient(circle at 50% 50%, ${meta.color}33 0%, ${meta.color}14 46%, rgba(255,255,255,0) 70%)`,
      }}
    />
  );
}

/**
 * 친밀도 링 — 캐릭터 발밑에 놓이는 얇은 호.
 * conic-gradient 로 채움 비율을 그리고 중앙을 마스크해 링만 남긴다.
 */
export function AffinityRing({ affinity, top, size }: { affinity: number; top: string; size: string }) {
  const percent = Math.min(100, Math.max(0, affinity));
  // 아직 쌓인 게 없으면 그리지 않는다 — 빈 링은 정보가 아니라 잡음이다.
  if (percent <= 0) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-20"
      style={{
        left: "50%",
        top,
        width: size,
        aspectRatio: "1 / 1",
        transform: "translate(-50%, -50%) rotateX(68deg)",
        borderRadius: "9999px",
        background: `conic-gradient(from 180deg, #F368A0 0turn, #F4A98C ${percent / 100}turn, rgba(0,0,0,0.06) ${percent / 100}turn 1turn)`,
        WebkitMaskImage: "radial-gradient(circle, transparent 62%, #000 64%, #000 78%, transparent 80%)",
        maskImage: "radial-gradient(circle, transparent 62%, #000 64%, #000 78%, transparent 80%)",
        opacity: 0.85,
      }}
    />
  );
}

interface FloatItem {
  key: string;
  emoji: string;
  label: string;
  className: string;
  /** 여러 개가 동시에 뜰 때 좌우로 살짝 흩어 놓는다. */
  offset: number;
}

const METRIC_STYLE = {
  affinity: { emoji: "💗", className: "text-pink-600" },
  exp: { emoji: "✨", className: "text-amber-600" },
} as const;

/**
 * 캐릭터 머리 위 상승 피드백.
 * notices 중 보상(metric)만 골라 짧게 떠오르게 한다. 안내·제한 문구는 무대 밖 WorldFeedback 이 맡는다.
 */
export function RisingRewards({ notices, top }: { notices: InteractionNotice[]; top: string }) {
  const [items, setItems] = useState<FloatItem[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const fresh = notices.filter((n) => (n.metric === "affinity" || n.metric === "exp") && !seen.current.has(n.id));
    if (fresh.length === 0) return;
    for (const n of fresh) seen.current.add(n.id);
    setItems((prev) => {
      const next = [...prev];
      fresh.forEach((n, i) => {
        const style = METRIC_STYLE[n.metric as "affinity" | "exp"];
        next.push({
          key: n.id,
          emoji: style.emoji,
          className: style.className,
          label: `+${n.value ?? 0}`,
          offset: (next.length + i) % 2 === 0 ? -14 : 14,
        });
      });
      return next.slice(-4);
    });
    // 애니메이션이 끝나면 목록에서 제거(타이머는 unmount 시 정리).
    const t = setTimeout(() => {
      setItems((prev) => prev.filter((item) => !fresh.some((n) => n.id === item.key)));
    }, 1_500);
    timers.current.push(t);
  }, [notices]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = []; }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-[45] flex justify-center"
      style={{ left: "50%", top, transform: "translate(-50%, -100%)" }}
    >
      {items.map((item) => (
        <span
          key={item.key}
          // bottom:0 — 앵커선에서 위로 자라게 한다. (top 기준이면 0 높이 컨테이너 아래로 흘러
          // 캐릭터 머리를 덮는다: 실측에서 19% 가림이 나왔던 원인)
          className={`mw-rise absolute bottom-0 whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[12px] font-black shadow-sm ${item.className}`}
          style={{ left: `${item.offset}px` }}
        >
          <span aria-hidden>{item.emoji}</span> {item.label}
        </span>
      ))}
    </div>
  );
}
