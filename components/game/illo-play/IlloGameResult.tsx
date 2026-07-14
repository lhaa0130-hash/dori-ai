"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw, Star } from "lucide-react";

interface Props {
  won: boolean;
  stars: number;
  moves: number;
  bestMoves?: number;
  onRetry: () => void;
  onNext?: () => void;
  nextLabel?: string;
  recommendation?: { name: string; path: string };
}

export default function IlloGameResult({
  won,
  stars,
  moves,
  bestMoves,
  onRetry,
  onNext,
  nextLabel = "다음 레벨",
  recommendation,
}: Props) {
  return (
    <div className="illo-dialog-backdrop">
      <section className="illo-dialog illo-result" role="dialog" aria-modal="true" aria-labelledby="illo-result-title">
        <p className="illo-dialog-eyebrow">{won ? "ORDER COMPLETE" : "잠시 숨 고르기"}</p>
        <h2 id="illo-result-title">{won ? "오늘의 주문 완료!" : "이번 진열은 여기까지"}</h2>
        <div className="illo-result-stars" aria-label={`${stars}개의 별 획득`}>
          {[0, 1, 2].map((index) => (
            <Star key={index} aria-hidden="true" className={index < stars ? "is-earned" : ""} fill="currentColor" />
          ))}
        </div>
        <dl className="illo-result-stats">
          <div><dt>사용 이동</dt><dd>{moves}</dd></div>
          <div><dt>개인 최고</dt><dd>{bestMoves ? `${bestMoves}회` : "첫 기록"}</dd></div>
        </dl>
        <div className="illo-dialog-actions">
          {won && onNext ? (
            <button type="button" className="illo-primary-button" onClick={onNext}>
              {nextLabel}<ArrowRight aria-hidden="true" size={18} />
            </button>
          ) : (
            <button type="button" className="illo-primary-button" onClick={onRetry}>
              다시 도전<RotateCcw aria-hidden="true" size={17} />
            </button>
          )}
          {won && (
            <button type="button" className="illo-secondary-button" onClick={onRetry}>
              다시하기
            </button>
          )}
        </div>
        {recommendation && (
          <Link href={recommendation.path} className="illo-recommendation">
            <span>다른 illo 게임</span><strong>{recommendation.name}</strong><ArrowRight aria-hidden="true" size={17} />
          </Link>
        )}
      </section>
    </div>
  );
}

