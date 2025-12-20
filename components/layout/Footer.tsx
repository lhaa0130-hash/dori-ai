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
          {/* 👇 [추가] AI 투명성 문구 */}
          <p className="text-xs opacity-40 mt-2 max-w-md leading-relaxed">
            DORI-AI는 AI로 제작된 사이트 입니다.<br/>
            DORI-AI는 AI 사용 사실을 명시하는 것을 원칙으로 합니다.<br/>
            숨기는 것이 가짜입니다. 우리는 AI 사용을 숨기지 않습니다.<br/>
            문의사항 : lhaa0130@gmail.com
          </p>
        </div>

        <div className="right-area">
          <Link href="/suggestions" className="footer-link font-bold text-blue-600 dark:text-blue-400">{t.suggestion.ko}</Link>
          <Link href="/legal/privacy" className="footer-link">{t.privacy.ko}</Link>
          <Link href="/legal/terms" className="footer-link">{t.terms.ko}</Link>
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
        .left-area p {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: -0.01em;
          line-height: 1.6;
        }
        :global(.dark) .left-area p {
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.light) .left-area p, :global([data-theme="light"]) .left-area p {
          color: rgba(0, 0, 0, 0.4);
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