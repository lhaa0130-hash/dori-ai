"use client";

// 미니게임 공용 명예의 전당 패널 (TOP 5)
// 사용법:
//   <GameLeaderboard game="2048" title="명예의 전당" unit="점" order="desc" tone="dark" />
// 점수 등록 후 새로고침: window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "2048" }))

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { getTopScores, type ScoreEntry, type RankOrder } from "@/lib/leaderboard";

interface Props {
  game: string;
  title?: string;
  unit?: string;                 // 점수 단위 (점, 무브, 초, WPM …)
  order?: RankOrder;             // desc=높을수록 좋음(기본), asc=낮을수록 좋음
  tone?: "auto" | "dark" | "light"; // 게임 배경에 맞춰 (기본 auto: 사이트 테마)
  className?: string;
}

export default function GameLeaderboard({
  game, title = "명예의 전당 TOP 5", unit = "점", order = "desc", tone = "auto", className = "",
}: Props) {
  const { session } = useAuth();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<ScoreEntry[]>([]);

  const load = useCallback(() => { getTopScores(game, 5, order).then(setRows); }, [game, order]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    load();
    const onRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail === game) load();
    };
    window.addEventListener("dori-lb-refresh", onRefresh);
    return () => window.removeEventListener("dori-lb-refresh", onRefresh);
  }, [load, game]);

  const dark = tone === "dark" || (tone === "auto" && (!mounted || theme !== "light"));
  const myName = session?.user?.name || null;

  // 톤별 색
  const c = dark
    ? { card: "bg-white/[0.04] border-white/10", head: "text-yellow-300", sub: "text-neutral-400",
        rowTop: "bg-white/[0.06]", rowDim: "bg-white/[0.02]", name: "text-neutral-100",
        rank: "text-neutral-500", score: "text-yellow-400", empty: "text-neutral-500" }
    : { card: "bg-black/[0.02] border-black/10", head: "text-[#C77C2E]", sub: "text-neutral-400",
        rowTop: "bg-black/[0.04]", rowDim: "bg-black/[0.015]", name: "text-neutral-800",
        rank: "text-neutral-400", score: "text-[#E8832E]", empty: "text-neutral-400" };

  return (
    <div className={`rounded-2xl border p-3 ${c.card} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold ${c.head}`}>🏆 {title}</span>
        <span className={`text-[10px] ${c.sub}`}>회원 기록</span>
      </div>

      {rows.length === 0 ? (
        <div className={`py-3 text-center text-[11px] ${c.empty}`}>
          아직 기록이 없어요. 첫 주인공이 되어보세요!
        </div>
      ) : (
        <div className="space-y-1">
          {rows.map((e, i) => {
            const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}`;
            const isMe = !!myName && e.name === myName;
            return (
              <div
                key={e.uid}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                  isMe ? "bg-[#F9954E]/20 ring-1 ring-[#F9954E]/40" : i < 3 ? c.rowTop : c.rowDim
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-6 text-center text-sm ${i < 3 ? "" : `${c.rank} font-bold`}`}>{medal}</span>
                  <span className={`text-xs truncate ${c.name}`}>{e.name}</span>
                  {isMe && <span className="text-[9px] text-[#F9954E] font-bold shrink-0">나</span>}
                </div>
                <span className={`text-xs font-bold tabular-nums shrink-0 ${c.score}`}>
                  {e.score.toLocaleString()}{unit}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
