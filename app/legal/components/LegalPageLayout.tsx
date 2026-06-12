// app/legal/components/LegalPageLayout.tsx

"use client";

import React from 'react';
import Link from 'next/link';

interface LegalPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <h1>{title}</h1>
        </header>

        <article className="legal-content">
          <p className="last-updated">최종 개정일: {new Date().toLocaleDateString()}</p>
          {children}
        </article>

        <footer className="legal-footer">
          <Link href="/">← 홈으로 돌아가기</Link>
        </footer>
      </div>

      <style jsx>{`
        .legal-page {
          min-height: 100vh;
          background: #f9f9f9;
          padding: 64px 20px;
        }
        .legal-container {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          padding: 40px;
          border-radius: 16px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .legal-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #F9954E;
          margin-bottom: 24px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 12px;
        }
        .legal-content {
          font-size: 0.95rem;
          line-height: 1.85;
          color: #555;
        }
        .legal-content :global(h2) {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 28px 0 14px;
          border-left: 4px solid #F9954E;
          padding-left: 12px;
        }
        .legal-content :global(ul) {
          padding-left: 22px;
          margin-bottom: 18px;
        }
        .legal-content :global(li) {
          margin-bottom: 8px;
        }
        .last-updated {
          font-size: 0.85rem;
          color: #999;
          margin-bottom: 28px;
          text-align: right;
        }
        .legal-footer {
          margin-top: 44px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
          text-align: center;
        }
        .legal-footer a {
          color: #F9954E;
          text-decoration: none;
          font-weight: 700;
        }

        /* 다크 모드 (next-themes가 html.dark 토글) */
        :global(.dark) .legal-page {
          background: #09090b;
        }
        :global(.dark) .legal-container {
          background: #18181b;
          border-color: #27272a;
          box-shadow: none;
        }
        :global(.dark) .legal-header h1 {
          border-bottom-color: #27272a;
        }
        :global(.dark) .legal-content {
          color: #d4d4d8;
        }
        :global(.dark) .legal-content :global(h2) {
          color: #f4f4f5;
        }
        :global(.dark) .last-updated {
          color: #71717a;
        }
        :global(.dark) .legal-footer {
          border-top-color: #27272a;
        }
      `}</style>
    </div>
  );
}
