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
            DORI-AI는 AI로 제작된 콘텐츠에 AI 사용 사실을 명시하는 것을 원칙으로 합니다.<br/>
            숨기는 것이 가짜입니다. 우리는 AI 사용을 숨기지 않습니다.
          </p>
        </div>

        <div className="right-area">
          <Link href="/suggestions" className="footer-link font-bold text-blue-600 dark:text-blue-400">{t.suggestion.ko}</Link>
          <Link href="#" className="footer-link">{t.privacy.ko}</Link>
          <Link href="#" className="footer-link">{t.terms.ko}</Link>
        </div>
      </div>

      <style jsx>{`
        /* 기존 스타일 유지 */
        .footer-wrapper { width: 100%; padding: 60px 24px; background-color: var(--bg-main); color: var(--text-main); border-top: 1px solid var(--card-border); margin-top: auto; transition: background-color 0.3s ease, color 0.3s ease; }
        .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
        @media (min-width: 768px) { .footer-inner { flex-direction: row; justify-content: space-between; align-items: flex-end; } }
        .logo-text { font-weight: 800; font-size: 1.25rem; margin-bottom: 8px; display: inline-block; color: inherit; text-decoration: none; }
        .copyright { font-size: 0.875rem; opacity: 0.5; }
        .right-area { display: flex; gap: 24px; flex-wrap: wrap; }
        .footer-link { font-size: 0.875rem; opacity: 0.6; text-decoration: none; color: inherit; transition: 0.2s; }
        .footer-link:hover { opacity: 1; color: var(--accent-color); }
      `}</style>
    </footer>
  );
}