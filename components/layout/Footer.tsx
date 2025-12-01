"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="footer-inner">
        
        {/* 왼쪽: 로고 및 저작권 */}
        <div className="left-area">
          <Link href="/" className="logo-text">
            DORI-AI
          </Link>
          <p className="copyright">
            © {new Date().getFullYear()} DORI-AI. All rights reserved.
          </p>
        </div>

        {/* 오른쪽: 이용약관 등 링크 */}
        <div className="right-area">
          <Link href="#" className="footer-link">Privacy Policy</Link>
          <Link href="#" className="footer-link">Terms of Service</Link>
          <Link href="#" className="footer-link">Contact</Link>
        </div>
      </div>

      <style jsx>{`
        /* ✅ 배경색과 글자색을 테마 변수로 지정 */
        .footer-wrapper {
          width: 100%;
          padding: 60px 24px;
          background-color: var(--bg-main); /* 🌞흰색 / 🌙검정 */
          color: var(--text-main);          /* 🌞검정 / 🌙흰색 */
          border-top: 1px solid var(--card-border); /* 테마에 맞는 테두리 */
          margin-top: auto; /* 콘텐츠가 짧아도 바닥에 붙도록 */
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* 데스크톱 레이아웃 */
        @media (min-width: 768px) {
          .footer-inner {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
          }
        }

        .logo-text {
          font-weight: 800;
          font-size: 1.25rem;
          margin-bottom: 8px;
          display: inline-block;
          color: inherit;
          text-decoration: none;
        }

        .copyright {
          font-size: 0.875rem;
          opacity: 0.5; /* 살짝 흐리게 */
        }

        .right-area {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .footer-link {
          font-size: 0.875rem;
          opacity: 0.6;
          text-decoration: none;
          color: inherit;
          transition: 0.2s;
        }

        .footer-link:hover {
          opacity: 1;
          color: var(--accent-color); /* 호버 시 파란색 */
        }
      `}</style>
    </footer>
  );
}