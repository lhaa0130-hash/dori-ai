"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation"; 
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { TEXTS } from "@/constants/texts";
import AccountMenu from "./AccountMenu"; 

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const pathname = usePathname(); 
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  
  // 🌍 언어 상태 제거, 한국어(.ko) 고정
  const t = TEXTS.nav;

  useEffect(() => setMounted(true), []);

  // localStorage에서 설정된 닉네임 가져오기
  useEffect(() => {
    if (user?.email) {
      const savedName = localStorage.getItem(`dori_user_name_${user.email}`);
      if (savedName) {
        setDisplayName(savedName);
      } else {
        setDisplayName(user.name || "사용자");
      }

      // 포인트와 레벨 정보 가져오기
      try {
        const profileKey = `dori_profile_${user.email}`;
        const savedProfile = localStorage.getItem(profileKey);
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setUserPoints(profile.point || 0);
          setUserLevel(profile.level || 1);
        }
      } catch (e) {
        console.error('프로필 로드 오류:', e);
      }
    } else {
      setDisplayName("");
    }
  }, [user?.email, user?.name]);

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

          <nav className="nav-area">
            <div className="nav-scroll-container">
              <Link href="/ai-tools" className={`nav-link ${isActive('/ai-tools')}`}>AI TOOLS</Link>
              <Link href="/insight" className={`nav-link ${isActive('/insight')}`}>INSIGHT</Link>
              <Link href="/project" className={`nav-link ${isActive('/project')}`}>PROJECT</Link>
              <Link href="/community" className={`nav-link ${isActive('/community')}`}>COMMUNITY</Link>
              <Link href="/market" className={`nav-link ${isActive('/market')}`}>MARKET</Link>
            </div>
          </nav>

          <div className="right-area">
            {!user ? (
              <Link href="/login" className="login-btn">{t.login.ko}</Link>
            ) : (
              <AccountMenu
                user={user}
                displayName={displayName}
                points={userPoints}
                level={userLevel}
              />
            )}
          </div>
        </div>
      </header>

      <style jsx>{`
        .header-wrapper { 
          position: fixed; 
          top: 0; 
          left: 0; 
          width: 100%; 
          height: 64px; 
          z-index: 100; 
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          transition: all 0.2s ease;
          font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif;
        }
        :global(.dark) .header-wrapper {
          background: rgba(0, 0, 0, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }
        :global(.light) .header-wrapper, :global([data-theme="light"]) .header-wrapper {
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          color: #1d1d1f;
        }
        .header-inner { 
          max-width: 1280px; 
          margin: 0 auto; 
          height: 100%; 
          padding: 0 20px; 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          position: relative;
        }
        @media (min-width: 768px) {
          .header-inner {
            padding: 0 32px;
          }
        }
        .logo-area {
          flex: 0 0 auto;
        }
        .logo-text { 
          font-size: 20px; 
          font-weight: 700; 
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }
        .logo-text:hover {
          opacity: 0.8;
        }
        .nav-area { 
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: calc(100% - 200px);
          display: flex;
          justify-content: center;
        }
        .nav-scroll-container {
          display: flex; 
          gap: 4px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 0 8px;
        }
        .nav-scroll-container::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 768px) {
          .nav-scroll-container {
            gap: 8px;
          }
        }
        @media (min-width: 1024px) {
          .nav-scroll-container {
            gap: 12px;
          }
        }
        .nav-link { 
          font-size: 13px;
          font-weight: 500; 
          letter-spacing: -0.01em;
          position: relative; 
          padding: 8px 12px; 
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          min-width: fit-content;
          border-radius: 8px;
        }
        @media (min-width: 768px) {
          .nav-link {
            font-size: 14px;
            padding: 8px 16px;
          }
        }
        @media (min-width: 1024px) {
          .nav-link {
            font-size: 14px;
            padding: 8px 20px;
          }
        }
        :global(.dark) .nav-link {
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.light) .nav-link, :global([data-theme="light"]) .nav-link {
          color: rgba(0, 0, 0, 0.6);
        }
        .nav-link:hover { 
          opacity: 1;
        }
        :global(.dark) .nav-link:hover {
          color: #ffffff;
        }
        :global(.light) .nav-link:hover, :global([data-theme="light"]) .nav-link:hover {
          color: #1d1d1f;
        }
        :global(.dark) .nav-link.active {
          color: #ffffff;
        }
        :global(.light) .nav-link.active, :global([data-theme="light"]) .nav-link.active {
          color: #1d1d1f;
        }
        .nav-link.active::after { 
          content: ''; 
          position: absolute; 
          bottom: 0; 
          left: 0; 
          width: 100%; 
          height: 2px; 
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          border-radius: 2px 2px 0 0; 
        }
        .right-area {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }
        .menu-search-section {
          margin: 4px 0;
        }
        .menu-search-section .search-container {
          position: relative;
        }
        .menu-search-section .search-form {
          display: flex;
          align-items: center;
          position: relative;
        }
        .menu-search-input {
          width: 100%;
          padding: 10px 36px 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: -0.01em;
          transition: all 0.2s ease;
          border: none;
          outline: none;
          font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif;
        }
        :global(.dark) .menu-search-input {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        :global(.light) .menu-search-input, :global([data-theme="light"]) .menu-search-input {
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .menu-search-input:focus {
          border-color: rgba(37, 99, 235, 0.3);
        }
        :global(.dark) .menu-search-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }
        :global(.light) .menu-search-input:focus, :global([data-theme="light"]) .menu-search-input:focus {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(37, 99, 235, 0.3);
        }
        .menu-search-button {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          opacity: 0.6;
          transition: opacity 0.2s ease;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .menu-search-button:hover {
          opacity: 1;
        }
        .menu-search-results {
          margin-top: 8px;
          max-height: 300px;
          overflow-y: auto;
          border-radius: 8px;
          padding: 4px;
        }
        :global(.dark) .menu-search-results {
          background: rgba(255, 255, 255, 0.03);
        }
        :global(.light) .menu-search-results, :global([data-theme="light"]) .menu-search-results {
          background: rgba(0, 0, 0, 0.02);
        }
        .menu-search-result-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
          cursor: pointer;
        }
        :global(.dark) .menu-search-result-item {
          color: rgba(255, 255, 255, 0.9);
        }
        :global(.light) .menu-search-result-item, :global([data-theme="light"]) .menu-search-result-item {
          color: rgba(0, 0, 0, 0.8);
        }
        .menu-search-result-item:hover {
          background: rgba(59, 130, 246, 0.1);
        }
        .menu-theme-section {
          margin: 4px 0;
        }
        .search-result-type {
          font-size: 18px;
          flex-shrink: 0;
        }
        .search-result-content {
          flex: 1;
          min-width: 0;
        }
        .search-result-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .search-result-desc {
          font-size: 11px;
          opacity: 0.7;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .login-btn { 
          padding: 8px 16px; 
          border-radius: 10px; 
          font-size: 14px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .login-btn {
            padding: 8px 12px;
            font-size: 13px;
          }
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
          width: 280px; 
          border-radius: 12px; 
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          padding: 12px; 
          opacity: 0; 
          visibility: hidden; 
          transform: translateY(-4px) scale(0.98); 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          display: flex; 
          flex-direction: column;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif;
          max-height: calc(100vh - 80px);
          overflow-y: auto;
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
          margin-bottom: 12px; 
          padding: 0 4px;
        }
        .user-info-group { 
          display: flex; 
          flex-direction: column; 
          gap: 8px;
        }
        .user-email { 
          font-size: 14px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
          word-break: break-all;
          line-height: 1.4;
        }
        :global(.dark) .user-email {
          color: rgba(255, 255, 255, 0.9);
        }
        :global(.light) .user-email, :global([data-theme="light"]) .user-email {
          color: rgba(0, 0, 0, 0.85);
        }
        .user-role-badge { 
          display: inline-flex; 
          align-items: center;
          align-self: flex-start; 
          padding: 4px 12px; 
          border-radius: 6px; 
          font-size: 11px; 
          font-weight: 600; 
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        :global(.dark) .user-role-badge {
          background: rgba(59, 130, 246, 0.15);
          color: rgba(147, 197, 253, 1);
          border: 1px solid rgba(59, 130, 246, 0.25);
        }
        :global(.light) .user-role-badge, :global([data-theme="light"]) .user-role-badge {
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          border: 1px solid rgba(37, 99, 235, 0.15);
        }
        .menu-divider-line { 
          height: 1px; 
          margin: 8px 0; 
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
          gap: 2px; 
        }
        .menu-action-item { 
          display: flex; 
          align-items: center; 
          gap: 12px;
          width: 100%; 
          height: 40px; 
          padding: 0 12px; 
          font-size: 14px; 
          font-weight: 500; 
          letter-spacing: -0.01em;
          border-radius: 8px; 
          background: transparent; 
          border: none; 
          cursor: pointer; 
          transition: all 0.2s ease; 
          text-align: left;
          text-decoration: none;
        }
        .menu-icon {
          font-size: 16px;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        :global(.dark) .menu-action-item {
          color: rgba(255, 255, 255, 0.85);
        }
        :global(.light) .menu-action-item, :global([data-theme="light"]) .menu-action-item {
          color: rgba(0, 0, 0, 0.75);
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