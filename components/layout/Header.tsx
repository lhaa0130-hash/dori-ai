"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation"; 
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle"; 
import { TEXTS } from "@/constants/texts"; 

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const pathname = usePathname(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // 🌍 언어 상태 제거, 한국어(.ko) 고정
  const t = TEXTS.nav;

  useEffect(() => setMounted(true), []);
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
            {/* 👇 [lang] 대신 .ko 사용 */}
            <Link href="/ai-tools" className={`nav-link ${isActive('/ai-tools')}`}>{t.aiTools.ko}</Link>
            <Link href="/insight" className={`nav-link ${isActive('/insight')}`}>{t.insight.ko}</Link>
            <Link href="/academy" className={`nav-link ${isActive('/academy')}`}>{t.academy.ko}</Link>
            <Link href="/community" className={`nav-link ${isActive('/community')}`}>{t.community.ko}</Link>
            <Link href="/market" className={`nav-link ${isActive('/market')}`}>{t.market.ko}</Link>
          </nav>

          <div className="user-area desktop-only">
            {/* ❌ 언어 토글 버튼 삭제됨 */}
            
            <ThemeToggle />
            
            {!user ? (
              <Link href="/login" className="login-btn">{t.login.ko}</Link>
            ) : (
              <div className="profile-dropdown-container">
                <button className="profile-pill-btn">
                  <div className="avatar-circle">{user.name?.[0]?.toUpperCase() || "U"}</div>
                  <span className="user-name-text">{user.name}</span>
                  <span className="dropdown-icon">▼</span>
                </button>
                <div className="dropdown-menu">
                  <div className="menu-header-info">
                    <span className="info-label">ID</span>
                    <span className="info-value email">{user.email || "user@dori.ai"}</span>
                    <span className="info-label" style={{marginTop:'8px'}}>Role</span>
                    <span className="info-value role">Creator</span>
                  </div>
                  <div className="menu-divider"></div>
                  <div className="menu-links-wrapper">
                    <Link href="/my" className="menu-item">{t.myPage.ko}</Link>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="menu-item danger">{t.logout.ko}</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="hamburger-btn mobile-only" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-header">
            <span className="mobile-title">{t.menu.ko}</span>
            <div className="mobile-header-actions">
              <ThemeToggle />
              <button className="close-btn" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
            </div>
          </div>
          
          <nav className="mobile-nav flex flex-col gap-2">
             <Link href="/ai-tools" className={`m-link ${isActive('/ai-tools')}`}>{t.aiTools.ko}</Link>
             <Link href="/insight" className={`m-link ${isActive('/insight')}`}>{t.insight.ko}</Link>
             <Link href="/academy" className={`m-link ${isActive('/academy')}`}>{t.academy.ko}</Link>
             <Link href="/community" className={`m-link ${isActive('/community')}`}>{t.community.ko}</Link>
             <Link href="/market" className={`m-link ${isActive('/market')}`}>{t.market.ko}</Link>
          </nav>

          <div className="mt-auto border-t border-dashed pt-4" style={{ borderColor: 'var(--card-border)' }}>
            {!user ? (
              <Link href="/login" className="block w-full text-center py-3 rounded-xl font-bold bg-blue-600 text-white">
                {t.login.ko}
              </Link>
            ) : (
              <>
                <Link href="/my" className="m-link">{t.myPage.ko}</Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="m-link text-red-500 w-full text-left">
                  {t.logout.ko}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* 기존 스타일 유지 (변경 없음) */
        .header-wrapper { position: fixed; top: 0; left: 0; width: 100%; height: 70px; z-index: 100; background: var(--bg-header); color: var(--text-header); backdrop-filter: blur(12px); border-bottom: 1px solid var(--card-border); transition: background 0.3s ease, color 0.3s ease; }
        .header-inner { max-width: 1280px; margin: 0 auto; height: 100%; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
        .logo-text { font-size: 24px; font-weight: 800; color: #2563eb; }
        .nav-area { display: flex; gap: 32px; }
        .nav-link { font-size: 15px; font-weight: 700; color: var(--text-header); opacity: 0.6; position: relative; padding: 8px 0; transition: 0.2s; }
        .nav-link:hover, .nav-link.active { opacity: 1; color: #2563eb; }
        .nav-link.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background-color: #2563eb; border-radius: 2px; }
        .user-area { display: flex; align-items: center; gap: 16px; }
        .login-btn { padding: 8px 20px; border-radius: 30px; font-size: 14px; font-weight: 600; color: var(--text-header); background: var(--card-bg); border: 1px solid var(--card-border); transition: 0.2s; }
        .login-btn:hover { background: var(--card-border); }
        .profile-dropdown-container { position: relative; height: 100%; display: flex; align-items: center; }
        .profile-pill-btn { display: flex; align-items: center; gap: 10px; padding: 4px 12px 4px 4px; background: var(--bg-main); border: 1px solid var(--card-border); border-radius: 30px; transition: 0.2s; font-family: inherit; }
        .profile-pill-btn:hover { background: var(--card-bg); box-shadow: 0 2px 6px var(--card-shadow); }
        .avatar-circle { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #E0E7FF, #F3E8FF); color: #2563eb; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; }
        .user-name-text { font-size: 14px; font-weight: 600; color: var(--text-main); }
        .dropdown-icon { font-size: 10px; color: var(--text-sub); }
        .dropdown-menu { position: absolute; top: 60px; right: 0; width: 240px; background: var(--bg-main); border: 1px solid var(--card-border); border-radius: 16px; box-shadow: 0 10px 40px var(--card-shadow); padding: 16px; opacity: 0; visibility: hidden; transform: translateY(10px); transition: 0.2s; display: flex; flex-direction: column; }
        .profile-dropdown-container:hover .dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
        .menu-header-info { display: flex; flex-direction: column; margin-bottom: 12px; }
        .info-label { font-size: 11px; color: var(--text-sub); font-weight: 600; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 600; color: var(--text-main); }
        .info-value.role { display: inline-block; align-self: flex-start; background: var(--card-bg); color: var(--accent-color); padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
        .menu-divider { height: 1px; background: var(--card-border); margin: 0 0 8px 0; width: 100%; }
        .menu-links-wrapper { display: flex; flex-direction: column; gap: 4px; }
        .menu-item { display: flex; align-items: center; width: 100%; height: 40px; padding: 0 12px; font-size: 14px; font-weight: 500; color: var(--text-sub); border-radius: 8px; background: transparent; border: none; cursor: pointer; transition: 0.1s; text-align: left; }
        .menu-item:hover { background: var(--card-bg); color: var(--text-main); font-weight: 600; }
        .menu-item.danger:hover { background: #FEF2F2; color: #EF4444; }
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
        @media (max-width: 820px) { .desktop-only { display: none !important; } .mobile-only { display: block !important; } }
      `}</style>
    </>
  );
}