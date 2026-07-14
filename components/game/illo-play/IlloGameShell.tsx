"use client";

import Link from "next/link";
import { ArrowLeft, Pause, Settings } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  gameName: string;
  eyebrow?: string;
  levelLabel: string;
  movesLabel: string;
  onPause: () => void;
  onSettings: () => void;
  children: ReactNode;
  controls: ReactNode;
  announcement?: string;
  reducedMotion?: boolean;
}

export default function IlloGameShell({
  gameName,
  eyebrow = "illo : play",
  levelLabel,
  movesLabel,
  onPause,
  onSettings,
  children,
  controls,
  announcement,
  reducedMotion = false,
}: Props) {
  return (
    <main className={`illo-game-shell ${reducedMotion ? "illo-reduced-motion" : ""}`}>
      <header className="illo-game-header">
        <Link href="/minigame" className="illo-icon-button" aria-label="미니게임 목록으로 돌아가기">
          <ArrowLeft aria-hidden="true" size={21} />
        </Link>
        <div className="illo-game-title">
          <span>{eyebrow}</span>
          <strong>{gameName}</strong>
        </div>
        <div className="illo-game-header-actions">
          <button type="button" className="illo-icon-button" onClick={onSettings} aria-label="설정 열기">
            <Settings aria-hidden="true" size={19} />
          </button>
          <button type="button" className="illo-icon-button" onClick={onPause} aria-label="게임 일시정지">
            <Pause aria-hidden="true" size={19} />
          </button>
        </div>
      </header>

      <div className="illo-game-status" aria-label="게임 상태">
        <span>{levelLabel}</span>
        <span>{movesLabel}</span>
      </div>

      <section className="illo-game-stage">{children}</section>
      <footer className="illo-game-controls">{controls}</footer>
      <div className="illo-sr-only" role="status" aria-live="polite">{announcement}</div>
    </main>
  );
}

