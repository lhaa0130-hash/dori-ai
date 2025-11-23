"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* 상단: 4단 그리드 */}
        <div className="footer-top">
          {/* 1. 브랜드 정보 */}
          <div className="footer-col brand-col">
            <h3 className="footer-logo">DORI-AI</h3>
            <p className="footer-desc">
              상상을 현실로 만드는 AI 크리에이티브 스튜디오.<br/>
              전 세계 10,000+ 크리에이터와 함께하세요.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon">🐦</a>
              <a href="#" className="social-icon">📘</a>
              <a href="#" className="social-icon">📸</a>
              <a href="#" className="social-icon">🐱</a>
            </div>
          </div>

          {/* 2. 서비스 메뉴 */}
          <div className="footer-col">
            <h4>Service</h4>
            <ul>
              <li><Link href="/studio">AI Tools Ranking</Link></li>
              <li><Link href="/insight">Insight News</Link></li>
              <li><Link href="/education">Academy</Link></li>
              <li><Link href="/community">Community</Link></li>
              <li><Link href="/shop">Asset Market</Link></li>
            </ul>
          </div>

          {/* 3. 고객지원 & 법적고지 */}
          <div className="footer-col">
            <h4>Support & Legal</h4>
            <ul>
              <li><Link href="/help">고객센터 / 문의하기</Link></li>
              <li><Link href="/legal/terms">이용약관</Link></li>
              <li><Link href="/legal/privacy">개인정보처리방침</Link></li>
              <li><Link href="/pricing">요금제 안내</Link></li>
            </ul>
          </div>

          {/* 4. 뉴스레터 */}
          <div className="footer-col newsletter-col">
            <h4>Stay Updated</h4>
            <p>최신 AI 트렌드와 업데이트 소식을 받아보세요.</p>
            <div className="input-group">
              <input type="email" placeholder="Email address" />
              <button>→</button>
            </div>
          </div>
        </div>

        {/* 하단: 카피라이트 */}
        <div className="footer-bottom">
          <span>© 2025 Design of Real Intelligence. All rights reserved.</span>
          <div className="bottom-links">
            <Link href="/legal/terms">Terms</Link>
            <span className="sep">·</span>
            <Link href="/legal/privacy">Privacy</Link>
          </div>
        </div>

      </div>

      <style jsx>{`
        .footer {
          background-color: #f9fafb; /* 아주 연한 회색 배경 */
          border-top: 1px solid #e5e7eb;
          padding: 80px 0 30px;
          width: 100%;
          font-size: 14px;
          color: #666;
        }
        
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 40px;
          margin-bottom: 60px;
        }

        .footer-col h4 {
          font-size: 14px;
          font-weight: 700;
          color: #111;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-col ul li a {
          color: #666;
          transition: 0.2s;
          text-decoration: none;
        }
        .footer-col ul li a:hover {
          color: #007AFF;
        }

        /* Brand Column */
        .footer-logo {
          font-size: 24px;
          font-weight: 800;
          color: #111;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }
        .footer-desc {
          line-height: 1.6;
          margin-bottom: 24px;
          color: #666;
        }
        .social-links {
          display: flex;
          gap: 12px;
        }
        .social-icon {
          width: 36px;
          height: 36px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: 0.2s;
          text-decoration: none;
        }
        .social-icon:hover {
          border-color: #007AFF;
          background: #007AFF;
          color: white;
          transform: translateY(-2px);
        }

        /* Newsletter Column */
        .newsletter-col p {
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .input-group {
          display: flex;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 4px;
        }
        .input-group input {
          flex: 1;
          border: none;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
          background: transparent;
        }
        .input-group button {
          background: #111;
          color: white;
          border: none;
          border-radius: 6px;
          width: 36px;
          height: 36px;
          cursor: pointer;
          transition: 0.2s;
        }
        .input-group button:hover {
          background: #007AFF;
        }

        /* Bottom */
        .footer-bottom {
          border-top: 1px solid #e5e7eb;
          padding-top: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #888;
        }
        .bottom-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bottom-links a {
          color: #666;
          text-decoration: none;
        }
        .bottom-links a:hover {
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .footer-top {
            grid-template-columns: 1fr 1fr;
          }
          .brand-col { grid-column: span 2; }
        }
        @media (max-width: 640px) {
          .footer-top {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .brand-col { grid-column: span 1; }
          .footer-bottom {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}