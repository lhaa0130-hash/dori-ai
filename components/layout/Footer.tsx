"use client";

import Link from "next/link";
import { TEXTS } from "@/constants/texts";

export default function Footer() {
  const t = TEXTS.footer;

  return (
    <footer className="footer-wrapper">
      <div className="footer-inner">
        <div className="left-area">
          <Link href="/" className="logo-text">DORI-AI</Link>
          <p className="copyright">{t.copyright.ko}</p>
        </div>

        <div className="right-area">
          <Link 
            href="/suggestions" 
            className="footer-link font-bold text-blue-600 dark:text-blue-400"
          >
            {t.suggestion.ko}
          </Link>
          <Link 
            href="/legal/privacy" 
            className="footer-link"
          >
            {t.privacy.ko}
          </Link>
          <Link 
            href="/legal/terms" 
            className="footer-link"
          >
            {t.terms.ko}
          </Link>
        </div>
      </div>

      {/* AI Manifesto 섹션 */}
      <div className="manifesto-section">
        <div className="manifesto-box">
          <div className="manifesto-icon">🤖</div>
          <div className="manifesto-content">
            <h3 className="manifesto-title">AI Manifesto</h3>
            <p className="manifesto-text">
              DORI-AI는 AI로 제작된 사이트입니다.<br/>
              DORI-AI는 AI 사용 사실을 명시하는 것을 원칙으로 합니다.<br/>
              <strong>숨기는 것이 가짜입니다. 우리는 AI 사용을 숨기지 않습니다.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 문의처 및 링크 그리드 */}
      <div className="footer-grid">
        <div className="footer-grid-item">
          <div className="footer-grid-label">문의</div>
          <a 
            href="mailto:lhaa0130@gmail.com" 
            className="footer-grid-link"
          >
            lhaa0130@gmail.com
          </a>
        </div>
        <div className="footer-grid-item">
          <div className="footer-grid-label">법적 정보</div>
          <div className="footer-grid-links">
            <Link href="/legal/privacy" className="footer-grid-link">
              개인정보처리방침
            </Link>
            <span className="footer-grid-separator">·</span>
            <Link href="/legal/terms" className="footer-grid-link">
              이용약관
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-wrapper { 
          width: 100%; 
          padding: 40px 24px 20px 24px; 
          margin-top: 0; 
          margin-bottom: 0;
          transition: all 0.3s ease;
          font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif;
          position: relative;
          z-index: 10;
        }
        :global(.dark) .footer-wrapper {
          background-color: #000000;
          color: #ffffff;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        :global(.light) .footer-wrapper, :global([data-theme="light"]) .footer-wrapper {
          background-color: #ffffff;
          color: #1d1d1f;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
        .footer-inner { 
          max-width: 1200px; 
          margin: 0 auto; 
          display: flex; 
          flex-direction: column; 
          gap: 32px; 
        }
        @media (min-width: 768px) { 
          .footer-inner { 
            flex-direction: row; 
            justify-content: space-between; 
            align-items: flex-end; 
          } 
        }
        .logo-text { 
          font-weight: 700; 
          font-size: 20px; 
          letter-spacing: -0.02em;
          margin-bottom: 12px; 
          display: inline-block; 
          text-decoration: none;
          background: linear-gradient(to right, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .copyright { 
          font-size: 14px; 
          font-weight: 400;
          letter-spacing: -0.01em;
          margin-bottom: 12px;
        }
        :global(.dark) .copyright {
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.light) .copyright, :global([data-theme="light"]) .copyright {
          color: rgba(0, 0, 0, 0.5);
        }
        .manifesto-section {
          max-width: 1200px;
          margin: 32px auto 0;
          padding-top: 32px;
          border-top: 1px solid;
        }
        :global(.dark) .manifesto-section {
          border-color: rgba(255, 255, 255, 0.08);
        }
        :global(.light) .manifesto-section, :global([data-theme="light"]) .manifesto-section {
          border-color: rgba(0, 0, 0, 0.08);
        }
        .manifesto-box {
          display: flex;
          gap: 16px;
          padding: 24px;
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        :global(.dark) .manifesto-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        :global(.light) .manifesto-box, :global([data-theme="light"]) .manifesto-box {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .manifesto-icon {
          font-size: 32px;
          flex-shrink: 0;
        }
        .manifesto-content {
          flex: 1;
        }
        .manifesto-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        :global(.dark) .manifesto-title {
          color: #ffffff;
        }
        :global(.light) .manifesto-title, :global([data-theme="light"]) .manifesto-title {
          color: #1d1d1f;
        }
        .manifesto-text {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1.7;
        }
        :global(.dark) .manifesto-text {
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.light) .manifesto-text, :global([data-theme="light"]) .manifesto-text {
          color: rgba(0, 0, 0, 0.6);
        }
        .manifesto-text strong {
          font-weight: 600;
          color: inherit;
        }
        .footer-grid {
          max-width: 1200px;
          margin: 24px auto 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .footer-grid-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-grid-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        :global(.dark) .footer-grid-label {
          color: rgba(255, 255, 255, 0.5);
        }
        :global(.light) .footer-grid-label, :global([data-theme="light"]) .footer-grid-label {
          color: rgba(0, 0, 0, 0.4);
        }
        .footer-grid-link {
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
          letter-spacing: -0.01em;
        }
        :global(.dark) .footer-grid-link {
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.light) .footer-grid-link, :global([data-theme="light"]) .footer-grid-link {
          color: rgba(0, 0, 0, 0.6);
        }
        .footer-grid-link:hover {
          transform: translateY(-1px);
        }
        :global(.dark) .footer-grid-link:hover {
          color: #ffffff;
        }
        :global(.light) .footer-grid-link:hover, :global([data-theme="light"]) .footer-grid-link:hover {
          color: #1d1d1f;
        }
        .footer-grid-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-grid-separator {
          font-size: 14px;
          opacity: 0.3;
        }
        .right-area { 
          display: flex; 
          gap: 24px; 
          flex-wrap: wrap; 
        }
        .footer-link { 
          font-size: 14px; 
          font-weight: 500;
          letter-spacing: -0.01em;
          text-decoration: none; 
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          z-index: 10;
          pointer-events: auto;
          display: inline-block;
        }
        :global(.dark) .footer-link {
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.light) .footer-link, :global([data-theme="light"]) .footer-link {
          color: rgba(0, 0, 0, 0.6);
        }
        .footer-link:hover { 
          transform: translateY(-1px);
        }
        :global(.dark) .footer-link:hover {
          color: #ffffff;
        }
        :global(.light) .footer-link:hover, :global([data-theme="light"]) .footer-link:hover {
          color: #1d1d1f;
        }
        .footer-link.font-bold {
          font-weight: 600;
        }
        :global(.dark) .footer-link.font-bold {
          color: #60a5fa;
        }
        :global(.light) .footer-link.font-bold, :global([data-theme="light"]) .footer-link.font-bold {
          color: #2563eb;
        }
      `}</style>
    </footer>
  );
}