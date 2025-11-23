// app/components/Header.tsx

"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    // NextAuth 기본 로그인 페이지로 이동하여 ID/PW 또는 Google 로그인을 선택하게 함
    signIn(); 
  };
  
  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ callbackUrl: '/' }); 
    setLoading(false);
  };

  return (
    <header>
      <div className="container">
        {/* 로고 / 메인 홈 링크 */}
        <Link href="/" className="logo">
          AI-Hub
        </Link>
        
        {/* 메인 카테고리 링크 */}
        <nav className="nav-links">
          <Link href="/blog">AI 정보/가이드</Link>
          <Link href="/community">AI 커뮤니티</Link>
        </nav>
        
        {/* 로그인 상태에 따른 버튼 */}
        <div className="auth-area">
          {status === "loading" && (
            <span className="auth-status">로딩 중...</span>
          )}
          
          {status === "authenticated" && session.user && (
            <>
              <span className="user-name">{session.user.name || session.user.email} 님</span>
              <button onClick={handleSignOut} disabled={loading}>
                {loading ? "처리 중..." : "로그아웃"}
              </button>
            </>
          )}
          
          {status === "unauthenticated" && (
            <button onClick={handleSignIn} className="signin-btn">
              로그인 / 가입
            </button>
          )}
        </div>
      </div>

      {/* styled-jsx를 사용하여 스타일 적용 */}
      <style jsx>{`
        header {
          background-color: #ffffff;
          border-bottom: 1px solid #e0e0e0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          padding: 15px 0;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 1.8rem;
          font-weight: 800;
          color: #0066cc;
          text-decoration: none;
        }
        .nav-links {
          display: flex;
          gap: 30px;
        }
        .nav-links a {
          font-size: 1rem;
          color: #333333;
          text-decoration: none;
          padding: 5px 0;
          transition: color 0.2s;
        }
        .nav-links a:hover {
          color: #0066cc;
        }
        .auth-area {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .user-name {
          font-size: 0.95rem;
          color: #555;
          font-weight: 500;
        }
        button {
          background-color: #0066cc;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        button:hover:not(:disabled) {
          background-color: #0052a3;
        }
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
      `}</style>
    </header>
  );
}