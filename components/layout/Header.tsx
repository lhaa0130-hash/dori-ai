"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation"; 
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const pathname = usePathname(); 

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path ? "active" : "";

  return (
    <>
      <header className="header-wrapper">
        <div className="header-inner">
          
          {/* 로고 */}
          <div className="logo-area">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <img src="/logo.png" alt="DORI Logo" className="logo-img" />
            </Link>
          </div>

          {/* PC 네비게이션 */}
          <nav className="nav-area desktop-only">
            <Link href="/studio" className={`nav-link ${isActive('/studio')}`}>AI TOOLS</Link>
            <Link href="/insight" className={`nav-link ${isActive('/insight')}`}>INSIGHT</Link>
            <Link href="/education" className={`nav-link ${isActive('/education')}`}>ACADEMY</Link>
            <Link href="/community" className={`nav-link ${pathname.startsWith('/community') ? 'active' : ''}`}>COMMUNITY</Link>
            <Link href="/shop" className={`nav-link ${isActive('/shop')}`}>MARKET</Link>
          </nav>

          {/* PC 유저 영역 */}
          <div className="user-area desktop-only">
            {!user ? (
              <Link href="/login" className="login-btn">로그인</Link>
            ) : (
              <div className="profile-dropdown-container">
                {/* 프로필 버튼 (알약 형태) */}
                <button className="profile-pill-btn">
                  <div className="avatar-circle">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="user-name-text">{user.name}</span>
                  <span className="dropdown-icon">▼</span>
                </button>
                
                {/* 드롭다운 메뉴 */}
                <div className="dropdown-menu">
                  {/* ID & Role 정보 */}
                  <div className="menu-header-info">
                    <span className="info-label">ID</span>
                    <span className="info-value email">{user.email || "user@dori.ai"}</span>
                    
                    <span className="info-label" style={{marginTop:'8px'}}>Role</span>
                    <span className="info-value role">Creator</span>
                  </div>
                  
                  <div className="menu-divider"></div>

                  {/* 메뉴 링크 (스타일 통일됨) */}
                  <div className="menu-links-wrapper">
                    <Link href="/my" className="menu-item">
                      마이페이지
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="menu-item danger">
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 햄버거 버튼 */}
          <button 
            className="hamburger-btn mobile-only" 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            ☰
          </button>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-header">
            <span className="mobile-title">메뉴</span>
            <button className="close-btn" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
          </div>
          {user ? (
            <div className="mobile-profile">
              <div className="mobile-avatar">{user.name?.[0]?.toUpperCase()}</div>
              <div className="mobile-user-info">
                <span className="name">{user.name}</span>
                <span className="role">Creator</span>
              </div>
            </div>
          ) : (
            <div className="mobile-login">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="mobile-login-btn">로그인 / 회원가입</Link>
            </div>
          )}
          <nav className="mobile-nav">
            <Link href="/studio" onClick={() => setIsMobileMenuOpen(false)} className={`m-link ${isActive('/studio')}`}>🎨 AI TOOLS</Link>
            <Link href="/insight" onClick={() => setIsMobileMenuOpen(false)} className={`m-link ${isActive('/insight')}`}>📰 INSIGHT</Link>
            <Link href="/education" onClick={() => setIsMobileMenuOpen(false)} className={`m-link ${isActive('/education')}`}>🎓 ACADEMY</Link>
            <Link href="/community" onClick={() => setIsMobileMenuOpen(false)} className={`m-link ${pathname.startsWith('/community') ? 'active' : ''}`}>💬 COMMUNITY</Link>
            <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className={`m-link ${isActive('/shop')}`}>🛍️ MARKET</Link>
          </nav>
          {user && (
            <div className="mobile-footer">
              <Link href="/my" onClick={() => setIsMobileMenuOpen(false)} className="m-sub-link">마이페이지</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="m-sub-link danger">로그아웃</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        a { text-decoration: none !important; }
        button { border: none; outline: none; cursor: pointer; background: none; font-family: inherit; }

        .header-wrapper { position: fixed; top: 0; left: 0; width: 100%; height: 130px; z-index: 100; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0, 0, 0, 0.05); transition: all 0.3s ease; }
        .header-inner { max-width: 1280px; margin: 0 auto; height: 100%; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
        
        .logo-area a { display: flex; align-items: center; }
        .logo-img { height: 108px; width: auto; object-fit: contain; }
        
        .nav-area { display: flex; gap: 32px; }
        .nav-link { font-size: 15px; font-weight: 700; color: var(--text-sub); position: relative; padding: 8px 0; transition: 0.2s; }
        .nav-link:hover { color: var(--primary); }
        .nav-link.active { color: var(--text-main); }
        .nav-link.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--text-main); border-radius: 2px; }
        
        .login-btn { padding: 10px 24px; border-radius: 30px; font-size: 15px; font-weight: 600; color: var(--text-main); background: rgba(0,0,0,0.05); transition: 0.2s; }
        .login-btn:hover { background: rgba(0,0,0,0.1); }
        
        .profile-dropdown-container { position: relative; height: 100%; display: flex; align-items: center; }
        
        .profile-pill-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 16px 6px 6px; 
          background: white; border: 1px solid var(--line); border-radius: 30px;
          transition: 0.2s; font-family: inherit;
        }
        .profile-pill-btn:hover { background: #f9fafb; border-color: #ccc; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
        
        .avatar-circle {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #E0E7FF, #F3E8FF);
          color: var(--primary); font-weight: 700; font-size: 13px;
          display: flex; align-items: center; justify-content: center;
        }
        
        .user-name-text { font-size: 14px; font-weight: 600; color: var(--text-main); }
        .dropdown-icon { font-size: 10px; color: #999; }

        .dropdown-menu {
          position: absolute; top: 80px; right: 0; width: 240px;
          background: white; border: 1px solid rgba(0,0,0,0.05); border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1); padding: 16px;
          opacity: 0; visibility: hidden; transform: translateY(10px); transition: 0.2s;
          display: flex; flex-direction: column;
        }
        .profile-dropdown-container:hover .dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
        .dropdown-menu::before { content: ''; position: absolute; top: -20px; left: 0; width: 100%; height: 20px; background: transparent; }
        
        .menu-header-info { display: flex; flex-direction: column; margin-bottom: 12px; }
        .info-label { font-size: 11px; color: #999; font-weight: 600; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 600; color: var(--text-main); }
        .info-value.role { 
          display: inline-block; align-self: flex-start;
          background: #eff6ff; color: var(--primary); 
          padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; 
        }

        .menu-divider { height: 1px; background: #f0f0f0; margin: 0 0 8px 0; width: 100%; }

        .menu-links-wrapper { display: flex; flex-direction: column; gap: 4px; }

        /* ★ 메뉴 아이템 디자인 통일 (핵심) */
        .menu-item { 
          display: flex; align-items: center; /* 수직 중앙 정렬 */
          width: 100%; height: 40px; /* 높이 고정 */
          padding: 0 12px; 
          font-size: 14px; font-weight: 500; color: var(--text-sub);
          border-radius: 8px; background: transparent; border: none; 
          cursor: pointer; transition: 0.1s; text-align: left;
          font-family: inherit; /* 폰트 상속 강제 */
        }
        /* 마이페이지 호버 (일반) */
        .menu-item:hover { background: #F3F4F6; color: var(--text-main); font-weight: 600; }
        /* 로그아웃 호버 (위험) */
        .menu-item.danger:hover { background: #FEF2F2; color: #EF4444; }
        
        /* 모바일 스타일 (기존 유지) */
        .hamburger-btn { display: none; font-size: 28px; background: none; border: none; cursor: pointer; color: #111; padding: 8px; }
        .mobile-menu-overlay { position: fixed; top: 0; right: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.5); z-index: 200; opacity: 0; visibility: hidden; transition: 0.3s; }
        .mobile-menu-overlay.open { opacity: 1; visibility: visible; }
        .mobile-menu-content { position: absolute; top: 0; right: 0; width: 280px; height: 100%; background: white; padding: 24px; box-shadow: -5px 0 20px rgba(0,0,0,0.1); transform: translateX(100%); transition: 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); display: flex; flex-direction: column; }
        .mobile-menu-overlay.open .mobile-menu-content { transform: translateX(0); }
        .mobile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .mobile-title { font-size: 18px; font-weight: 800; }
        .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; }
        .mobile-profile { display: flex; align-items: center; gap: 12px; margin-bottom: 30px; padding: 16px; background: #f9f9f9; border-radius: 12px; }
        .mobile-avatar { width: 40px; height: 40px; background: #eef7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--blue); }
        .mobile-user-info { display: flex; flex-direction: column; }
        .mobile-login-btn { display: block; width: 100%; text-align: center; padding: 12px; background: var(--text-main); color: white; border-radius: 12px; font-weight: bold; text-decoration: none; }
        .mobile-nav { display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .m-link { padding: 12px; border-radius: 8px; font-size: 16px; font-weight: 600; color: var(--text-sub); transition: 0.2s; text-decoration: none !important; }
        .m-link:hover, .m-link.active { background: #f5f5f7; color: var(--blue); }
        .mobile-footer { border-top: 1px solid var(--line); padding-top: 20px; display: flex; flex-direction: column; gap: 10px; }
        .m-sub-link { text-align: left; padding: 10px; background: none; border: none; font-size: 14px; color: #666; cursor: pointer; text-decoration: none; }
        .m-sub-link.danger { color: #ff4d4f; }
        
        @media (max-width: 820px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block !important; }
          .header-wrapper { height: 80px; } 
          .logo-img { height: 48px; }
        }
      `}</style>
    </>
  );
}