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

          <div className="right-area">
            <div className="user-area">
              <ThemeToggle />
              {!user ? (
                <Link href="/login" className="login-btn desktop-only">{t.login.ko}</Link>
              ) : (
                <div className="profile-dropdown-container desktop-only">
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
              <button className="hamburger-btn mobile-only" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
            </div>
          </div>
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
        .header-wrapper { 
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 70px; 
          z-index: 100; 
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          transition: all 0.3s ease;
          font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif;
        }
        :global(.dark) .header-wrapper {
          background: rgba(0, 0, 0, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }
        :global(.light) .header-wrapper, :global([data-theme="light"]) .header-wrapper {
          background: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          color: #1d1d1f;
        }
        .header-inner { 
          max-width: 1280px; 
          margin: 0 auto; 
          height: 100%; 
          padding: 0 24px; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          position: relative;
        }
        .logo-area {
          flex: 0 0 auto;
        }
        .logo-text { 
          font-size: 20px; 
          font-weight: 700; 
          letter-spacing: -0.02em;
          background: linear-gradient(to right, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
        }
        .nav-area { 
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex; 
          gap: 32px; 
        }
        .nav-link { 
          font-size: 14px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
          position: relative; 
          padding: 8px 0; 
          transition: all 0.2s ease;
          text-decoration: none;
        }
        :global(.dark) .nav-link {
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.light) .nav-link, :global([data-theme="light"]) .nav-link {
          color: rgba(0, 0, 0, 0.6);
        }
        .nav-link:hover, .nav-link.active { 
          opacity: 1;
        }
        :global(.dark) .nav-link:hover, :global(.dark) .nav-link.active {
          color: #ffffff;
        }
        :global(.light) .nav-link:hover, :global(.light) .nav-link.active, :global([data-theme="light"]) .nav-link:hover, :global([data-theme="light"]) .nav-link.active {
          color: #1d1d1f;
        }
        .nav-link.active::after { 
          content: ''; 
          position: absolute; 
          bottom: 0; 
          left: 0; 
          width: 100%; 
          height: 2px; 
          background: linear-gradient(to right, #2563eb, #7c3aed);
          border-radius: 2px; 
        }
        .right-area {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }
        .user-area { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
        }
        .user-area :global(button) {
          flex-shrink: 0;
        }
        .login-btn { 
          padding: 8px 20px; 
          border-radius: 20px; 
          font-size: 14px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        :global(.dark) .login-btn {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        :global(.light) .login-btn, :global([data-theme="light"]) .login-btn {
          color: #1d1d1f;
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .login-btn:hover {
          transform: translateY(-1px);
        }
        :global(.dark) .login-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        :global(.light) .login-btn:hover, :global([data-theme="light"]) .login-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .profile-dropdown-container { 
          position: relative; 
          height: 100%; 
          display: flex; 
          align-items: center; 
        }
        .profile-pill-btn { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          padding: 4px 12px 4px 4px; 
          border-radius: 20px; 
          transition: all 0.2s ease; 
          font-family: inherit;
          border: none;
          cursor: pointer;
        }
        :global(.dark) .profile-pill-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        :global(.light) .profile-pill-btn, :global([data-theme="light"]) .profile-pill-btn {
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .profile-pill-btn:hover { 
          transform: translateY(-1px);
        }
        :global(.dark) .profile-pill-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        :global(.light) .profile-pill-btn:hover, :global([data-theme="light"]) .profile-pill-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .avatar-circle { 
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
          color: #ffffff; 
          font-weight: 600; 
          font-size: 13px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
        }
        .user-name-text { 
          font-size: 14px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
        }
        :global(.dark) .user-name-text {
          color: #ffffff;
        }
        :global(.light) .user-name-text, :global([data-theme="light"]) .user-name-text {
          color: #1d1d1f;
        }
        .dropdown-icon { 
          font-size: 10px;
        }
        :global(.dark) .dropdown-icon {
          color: rgba(255, 255, 255, 0.5);
        }
        :global(.light) .dropdown-icon, :global([data-theme="light"]) .dropdown-icon {
          color: rgba(0, 0, 0, 0.5);
        }
        .dropdown-menu { 
          position: absolute; 
          top: 60px; 
          right: 0; 
          width: 240px; 
          border-radius: 16px; 
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 16px; 
          opacity: 0; 
          visibility: hidden; 
          transform: translateY(10px); 
          transition: all 0.2s ease; 
          display: flex; 
          flex-direction: column;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        :global(.dark) .dropdown-menu {
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        :global(.light) .dropdown-menu, :global([data-theme="light"]) .dropdown-menu {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .profile-dropdown-container:hover .dropdown-menu { 
          opacity: 1; 
          visibility: visible; 
          transform: translateY(0); 
        }
        .menu-header-info { 
          display: flex; 
          flex-direction: column; 
          margin-bottom: 12px; 
        }
        .info-label { 
          font-size: 11px; 
          font-weight: 500; 
          letter-spacing: 0;
          margin-bottom: 4px; 
        }
        :global(.dark) .info-label {
          color: rgba(255, 255, 255, 0.5);
        }
        :global(.light) .info-label, :global([data-theme="light"]) .info-label {
          color: rgba(0, 0, 0, 0.5);
        }
        .info-value { 
          font-size: 14px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
        }
        :global(.dark) .info-value {
          color: #ffffff;
        }
        :global(.light) .info-value, :global([data-theme="light"]) .info-value {
          color: #1d1d1f;
        }
        .info-value.role { 
          display: inline-block; 
          align-self: flex-start; 
          padding: 2px 8px; 
          border-radius: 4px; 
          font-size: 12px; 
          font-weight: 600; 
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #ffffff;
        }
        .menu-divider { 
          height: 1px; 
          margin: 0 0 8px 0; 
          width: 100%; 
        }
        :global(.dark) .menu-divider {
          background: rgba(255, 255, 255, 0.1);
        }
        :global(.light) .menu-divider, :global([data-theme="light"]) .menu-divider {
          background: rgba(0, 0, 0, 0.08);
        }
        .menu-links-wrapper { 
          display: flex; 
          flex-direction: column; 
          gap: 4px; 
        }
        .menu-item { 
          display: flex; 
          align-items: center; 
          width: 100%; 
          height: 40px; 
          padding: 0 12px; 
          font-size: 14px; 
          font-weight: 400; 
          letter-spacing: -0.01em;
          border-radius: 8px; 
          background: transparent; 
          border: none; 
          cursor: pointer; 
          transition: all 0.2s ease; 
          text-align: left;
          text-decoration: none;
        }
        :global(.dark) .menu-item {
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.light) .menu-item, :global([data-theme="light"]) .menu-item {
          color: rgba(0, 0, 0, 0.6);
        }
        .menu-item:hover { 
          font-weight: 500;
        }
        :global(.dark) .menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }
        :global(.light) .menu-item:hover, :global([data-theme="light"]) .menu-item:hover {
          background: rgba(0, 0, 0, 0.03);
          color: #1d1d1f;
        }
        .menu-item.danger:hover { 
          background: rgba(239, 68, 68, 0.1); 
          color: #ef4444; 
        }
        .hamburger-btn { 
          font-size: 24px; 
          background: none; 
          border: none; 
          cursor: pointer;
          padding: 8px;
        }
        :global(.dark) .hamburger-btn {
          color: #ffffff;
        }
        :global(.light) .hamburger-btn, :global([data-theme="light"]) .hamburger-btn {
          color: #1d1d1f;
        }
        .mobile-menu-overlay { 
          position: fixed; 
          top: 0; 
          right: 0; 
          width: 100%; 
          height: 100vh; 
          z-index: 200; 
          opacity: 0; 
          visibility: hidden; 
          transition: all 0.3s ease;
        }
        :global(.dark) .mobile-menu-overlay {
          background: rgba(0, 0, 0, 0.7);
        }
        :global(.light) .mobile-menu-overlay, :global([data-theme="light"]) .mobile-menu-overlay {
          background: rgba(0, 0, 0, 0.3);
        }
        .mobile-menu-overlay.open { 
          opacity: 1; 
          visibility: visible; 
        }
        .mobile-menu-content { 
          position: absolute; 
          top: 0; 
          right: 0; 
          width: 280px; 
          height: 100%; 
          padding: 24px; 
          box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1); 
          transform: translateX(100%); 
          transition: all 0.3s ease; 
          display: flex; 
          flex-direction: column;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        :global(.dark) .mobile-menu-content {
          background: rgba(0, 0, 0, 0.9);
          color: #ffffff;
        }
        :global(.light) .mobile-menu-content, :global([data-theme="light"]) .mobile-menu-content {
          background: rgba(255, 255, 255, 0.95);
          color: #1d1d1f;
        }
        .mobile-menu-overlay.open .mobile-menu-content { 
          transform: translateX(0); 
        }
        .mobile-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 20px; 
        }
        .close-btn { 
          font-size: 20px; 
          background: none; 
          border: none; 
          cursor: pointer;
        }
        :global(.dark) .close-btn {
          color: #ffffff;
        }
        :global(.light) .close-btn, :global([data-theme="light"]) .close-btn {
          color: #1d1d1f;
        }
        .mobile-header-actions { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
        }
        .m-link { 
          display: block; 
          padding: 12px 0; 
          font-size: 16px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
          text-decoration: none;
        }
        :global(.dark) .m-link {
          color: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        :global(.light) .m-link, :global([data-theme="light"]) .m-link {
          color: rgba(0, 0, 0, 0.6);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }
        .m-link.active { 
          color: #2563eb; 
        }
        @media (max-width: 820px) { 
          .desktop-only { display: none !important; } 
          .mobile-only { display: block !important; } 
        }
      `}</style>
    </>
  );
}