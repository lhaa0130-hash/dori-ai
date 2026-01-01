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
            <Link href="/">
              <span className="logo-text">DORI-AI</span>
            </Link>
          </div>

          <nav className="nav-area desktop-only">
            <Link href="/ai-tools" className={`nav-link ${isActive('/ai-tools')}`}>AI TOOLS</Link>
            <Link href="/insight" className={`nav-link ${isActive('/insight')}`}>INSIGHT</Link>
            <Link href="/project" className={`nav-link ${isActive('/project')}`}>PROJECT</Link>
            <Link href="/community" className={`nav-link ${isActive('/community')}`}>COMMUNITY</Link>
            <Link href="/market" className={`nav-link ${isActive('/market')}`}>MARKET</Link>
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
                    <div className="menu-header-section">
                      <div className="user-info-group">
                        <div className="user-email">{user.email || "user@dori.ai"}</div>
                        <div className="user-role-badge">Creator</div>
                      </div>
                    </div>
                    <div className="menu-divider-line"></div>
                    <div className="menu-actions">
                      <Link href="/my" className="menu-action-item">
                        <span className="menu-icon">👤</span>
                        <span>{t.myPage.ko}</span>
                      </Link>
                      <button onClick={() => signOut({ callbackUrl: "/" })} className="menu-action-item danger">
                        <span className="menu-icon">🚪</span>
                        <span>{t.logout.ko}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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
          background: #ffffff;
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
          top: 64px; 
          right: 0; 
          width: 240px; 
          border-radius: 16px; 
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          padding: 16px; 
          opacity: 0; 
          visibility: hidden; 
          transform: translateY(-4px) scale(0.98); 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          display: flex; 
          flex-direction: column;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif;
        }
        :global(.dark) .dropdown-menu {
          background: rgba(20, 20, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        :global(.light) .dropdown-menu, :global([data-theme="light"]) .dropdown-menu {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .profile-dropdown-container:hover .dropdown-menu { 
          opacity: 1; 
          visibility: visible; 
          transform: translateY(0) scale(1); 
        }
        .menu-header-section { 
          margin-bottom: 14px; 
        }
        .user-info-group { 
          display: flex; 
          flex-direction: column; 
          gap: 10px;
        }
        .user-email { 
          font-size: 13px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
          word-break: break-all;
          line-height: 1.4;
        }
        :global(.dark) .user-email {
          color: rgba(255, 255, 255, 0.9);
        }
        :global(.light) .user-email, :global([data-theme="light"]) .user-email {
          color: rgba(0, 0, 0, 0.8);
        }
        .user-role-badge { 
          display: inline-flex; 
          align-items: center;
          align-self: flex-start; 
          padding: 4px 10px; 
          border-radius: 8px; 
          font-size: 11px; 
          font-weight: 600; 
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        :global(.dark) .user-role-badge {
          background: rgba(59, 130, 246, 0.2);
          color: rgba(147, 197, 253, 0.95);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        :global(.light) .user-role-badge, :global([data-theme="light"]) .user-role-badge {
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.2);
        }
        .menu-divider-line { 
          height: 1px; 
          margin: 0 0 10px 0; 
          width: 100%; 
        }
        :global(.dark) .menu-divider-line {
          background: rgba(255, 255, 255, 0.08);
        }
        :global(.light) .menu-divider-line, :global([data-theme="light"]) .menu-divider-line {
          background: rgba(0, 0, 0, 0.08);
        }
        .menu-actions { 
          display: flex; 
          flex-direction: column; 
          gap: 4px; 
        }
        .menu-action-item { 
          display: flex; 
          align-items: center; 
          gap: 10px;
          width: 100%; 
          height: 38px; 
          padding: 0 12px; 
          font-size: 13px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
          border-radius: 8px; 
          background: transparent; 
          border: none; 
          cursor: pointer; 
          transition: all 0.15s ease; 
          text-align: left;
          text-decoration: none;
        }
        .menu-icon {
          font-size: 13px;
          opacity: 0.6;
          transition: opacity 0.15s ease;
        }
        :global(.dark) .menu-action-item {
          color: rgba(255, 255, 255, 0.8);
        }
        :global(.light) .menu-action-item, :global([data-theme="light"]) .menu-action-item {
          color: rgba(0, 0, 0, 0.7);
        }
        .menu-action-item:hover { 
          font-weight: 500;
        }
        .menu-action-item:hover .menu-icon {
          opacity: 1;
        }
        :global(.dark) .menu-action-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }
        :global(.light) .menu-action-item:hover, :global([data-theme="light"]) .menu-action-item:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #1d1d1f;
        }
        .menu-action-item.danger:hover { 
          background: rgba(239, 68, 68, 0.1); 
          color: #ef4444; 
        }
        .menu-action-item.danger:hover .menu-icon {
          opacity: 1;
        }
      `}</style>
    </>
  );
}