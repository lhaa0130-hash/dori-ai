"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation"; // 📌 usePathname 훅 사용
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle"; 

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const pathname = usePathname(); // 📌 현재 경로 가져오기
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  
  // 📌 활성화 상태 체크 함수 (현재 경로와 일치하면 active 클래스 반환)
  const isActive = (path: string) => pathname.startsWith(path) ? "active" : "";

  if (!mounted) return <header className="header-wrapper" />; 

  return (
    <>
      <header className="header-wrapper">
        <div className="header-inner">
          <div className="logo-area">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="logo-text">DORI-AI</span>
            </Link>
          </div>

          <nav className="nav-area desktop-only">
            {['/ai-tools', '/insight', '/academy', '/community', '/market'].map((path) => (
              <Link key={path} href={path} className={`nav-link ${isActive(path)}`}>
                {path.substring(1).toUpperCase().replace('-', ' ')}
              </Link>
            ))}
          </nav>

          <div className="user-area desktop-only">
            <ThemeToggle />
            {!user ? (
              <Link href="/login" className="login-btn">로그인</Link>
            ) : (
              <div className="text-sm font-bold">{user.name}님</div>
            )}
          </div>

          <button className="hamburger-btn mobile-only" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-header">
            <span className="mobile-title">메뉴</span>
            <div className="mobile-header-actions">
              <ThemeToggle />
              <button className="close-btn" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
            </div>
          </div>
          
          <nav className="mobile-nav flex flex-col gap-2">
             <Link href="/ai-tools" className={`m-link ${isActive('/ai-tools')}`}>AI TOOLS</Link>
             <Link href="/insight" className={`m-link ${isActive('/insight')}`}>INSIGHT</Link>
             <Link href="/academy" className={`m-link ${isActive('/academy')}`}>ACADEMY</Link>
             <Link href="/community" className={`m-link ${isActive('/community')}`}>COMMUNITY</Link>
             <Link href="/market" className={`m-link ${isActive('/market')}`}>MARKET</Link>
          </nav>
        </div>
      </div>

      <style jsx>{`
        .header-wrapper { 
          position: fixed; top: 0; left: 0; width: 100%; height: 70px; z-index: 100; 
          background: var(--bg-header); 
          color: var(--text-header);
          backdrop-filter: blur(12px); 
          border-bottom: 1px solid var(--card-border); 
          transition: background 0.3s ease, color 0.3s ease;
        }

        .header-inner { max-width: 1280px; margin: 0 auto; height: 100%; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
        .logo-text { font-size: 24px; font-weight: 800; color: #2563eb; }
        .nav-area { display: flex; gap: 32px; }
        
        /* 📌 네비게이션 링크 스타일 수정 */
        .nav-link { 
          font-size: 15px; font-weight: 700; 
          color: var(--text-header); 
          opacity: 0.6; /* 기본은 흐리게 */
          position: relative; padding: 8px 0; transition: 0.2s; 
        }
        
        /* 📌 활성화(Active) 상태 스타일 */
        .nav-link:hover, .nav-link.active { 
          opacity: 1; 
          color: #2563eb; /* 포인트 컬러 */
        }
        
        /* 활성화 시 하단 밑줄 */
        .nav-link.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: #2563eb;
            border-radius: 2px;
        }

        .user-area { display: flex; align-items: center; gap: 16px; }
        .login-btn { padding: 8px 20px; border-radius: 30px; font-size: 14px; font-weight: 600; color: var(--text-header); background: var(--card-bg); border: 1px solid var(--card-border); transition: 0.2s; }
        .login-btn:hover { background: var(--card-border); }
        .hamburger-btn { font-size: 24px; color: var(--text-header); background: none; border: none; cursor: pointer; }
        
        .mobile-menu-overlay { position: fixed; top: 0; right: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.5); z-index: 200; opacity: 0; visibility: hidden; transition: 0.3s; }
        .mobile-menu-overlay.open { opacity: 1; visibility: visible; }
        .mobile-menu-content { position: absolute; top: 0; right: 0; width: 280px; height: 100%; background: var(--bg-main); padding: 24px; box-shadow: -5px 0 20px rgba(0,0,0,0.1); transform: translateX(100%); transition: 0.3s; color: var(--text-main); display: flex; flex-direction: column; }
        .mobile-menu-overlay.open .mobile-menu-content { transform: translateX(0); }
        .mobile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .close-btn { font-size: 20px; background: none; border: none; cursor: pointer; color: var(--text-main); }
        .mobile-header-actions { display: flex; align-items: center; gap: 10px; }
        .m-link { display: block; padding: 12px 0; font-size: 16px; font-weight: 600; color: var(--text-main); text-decoration: none; border-bottom: 1px solid var(--card-border); }
        .m-link.active { color: #2563eb; }

        @media (max-width: 820px) { .desktop-only { display: none; } .mobile-only { display: block; } }
      `}</style>
    </>
  );
}