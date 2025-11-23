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
          padding: 80px 20px;
        }
        .legal-container {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          padding: 50px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .legal-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #0066cc;
          margin-bottom: 30px;
          border-bottom: 2px solid #eeeeee;
          padding-bottom: 10px;
        }
        .legal-content {
          font-size: 1rem;
          line-height: 1.8;
          color: #555;
        }
        .legal-content :global(h2) {
          font-size: 1.4rem;
          color: #333;
          margin: 30px 0 15px;
          border-left: 4px solid #0066cc;
          padding-left: 12px;
        }
        .legal-content :global(ul) {
          padding-left: 24px;
          margin-bottom: 20px;
        }
        .legal-content :global(li) {
          margin-bottom: 8px;
        }
        .last-updated {
            font-size: 0.9rem;
            color: #999;
            margin-bottom: 30px;
            text-align: right;
        }
        .legal-footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #eeeeee;
          text-align: center;
        }
        .legal-footer a {
          color: #0066cc;
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}