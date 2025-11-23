"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function EducationPage() {
  const { data: session } = useSession();
  const user = session?.user || null;

  function onLogout() { signOut({ callbackUrl: "/" }); }

  return (
    <main className="page">
      <div className="fixed-top-content">
        <header className="header">
          <div className="header-side header-left">
            <div className="logo-wrap"><Link href="/"><img src="/logo.png" className="logo" alt="DORI Logo" /></Link></div>
          </div>
          <div className="nav-container">
            <nav className="nav">
              <div className="nav-item-wrap"><Link href="/studio">STUDIO</Link></div>
              <div className="nav-item-wrap"><Link href="/insight">INSIGHT</Link></div>
              <div className="nav-item-wrap active"><Link href="/education">EDUCATION</Link></div>
              <div className="nav-item-wrap"><Link href="/community">COMMUNITY</Link></div>
            </nav>
          </div>
          <div className="header-side header-right">
            <div className="auth-wrap">
              {!user ? <Link href="/" className="btn small ghost">로그인</Link> : (
                <div className="avatar-wrap">
                  <button className="avatar">{user.name?.[0]}</button>
                  <div className="menu">
                    <div className="menu-name">{user.name}</div>
                    <Link href="/my" style={{textDecoration:'none'}}><button className="menu-item">마이페이지</button></Link>
                    <button className="menu-item danger" onClick={onLogout}>로그아웃</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "80vh", paddingTop: "60px" }}>
        <div className="page-header">
          <h1 className="page-title">Education</h1>
          <p className="page-desc">DORI-AI 마스터가 되기 위한 단계별 가이드.</p>
        </div>

        <div className="edu-grid">
          {/* 카드 1 */}
          <div className="edu-card">
            <div className="thumb-area">
              <div className="play-icon">▶</div>
            </div>
            <div className="edu-content">
              <div className="tag">초급</div>
              <h3>시작하기 가이드</h3>
              <p>5분 만에 배우는 기본 기능 완전 정복</p>
            </div>
          </div>
          
          {/* 카드 2 */}
          <div className="edu-card">
            <div className="thumb-area" style={{background:'#333'}}>
              <div className="play-icon">▶</div>
            </div>
            <div className="edu-content">
              <div className="tag">중급</div>
              <h3>프롬프트 마스터 클래스</h3>
              <p>원하는 스타일을 정확히 뽑아내는 비결</p>
            </div>
          </div>

          {/* 카드 3 */}
          <div className="edu-card">
            <div className="thumb-area" style={{background:'#555'}}>
              <div className="play-icon">▶</div>
            </div>
            <div className="edu-content">
              <div className="tag">고급</div>
              <h3>커뮤니티 활용법</h3>
              <p>전 세계 크리에이터와 소통하는 방법</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer"><span>© DORI — DESIGN OF REAL INTELLIGENCE</span></footer>

      {/* ★ 스타일 복사 (레이아웃 통일) */}
      <style jsx global>{`
        /* 공통 스타일 (반복) */
        :root { --bg: #ffffff; --text: #111; --gray: #666; --light-gray: #f5f5f7; --blue: #0071e3; --line: #e5e5e5; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .page { display: flex; flex-direction: column; min-height: 100vh; }
        .fixed-top-content { position: fixed; top: 0; left: 0; width: 100%; z-index: 50; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.05); }
        .scroll-spacer { height: 70px; }
        .header { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 70px; padding: 0 24px; }
        .logo-wrap img { height: 24px; object-fit: contain; }
        .nav { display: flex; gap: 32px; }
        .nav-item-wrap a { text-decoration: none; color: var(--gray); font-weight: 500; font-size: 14px; transition: 0.2s; }
        .nav-item-wrap:hover a, .nav-item-wrap.active a { color: var(--blue); }
        .auth-wrap { display: flex; justify-content: flex-end; }
        .avatar-wrap { position: relative; height: 70px; display: flex; align-items: center; }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: #f0f0f0; border: 1px solid #ddd; cursor: pointer; color: #333; font-weight: bold; display: flex; align-items: center; justify-content: center; }
        .menu { position: absolute; right: 0; top: 60px; width: 160px; background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 8px; opacity: 0; pointer-events: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: 0.2s; z-index: 100; }
        .avatar-wrap:hover .menu, .menu:hover { opacity: 1; pointer-events: auto; top: 55px; }
        .menu::before { content: ""; position: absolute; top: -20px; left: 0; width: 100%; height: 20px; background: transparent; }
        .menu-name { padding: 8px 12px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f5f5f5; color: #333; }
        .menu-item { width: 100%; padding: 10px 12px; background: transparent; border: none; text-align: left; cursor: pointer; font-size: 14px; color: #555; border-radius: 6px; transition: 0.1s; }
        .menu-item:hover { background: #f5f5f7; color: #000; }
        .menu-item.danger { color: #ff3b30; }
        .menu-item.danger:hover { background: #fff0f0; }
        .container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
        .page-header { text-align: center; margin-bottom: 60px; }
        .page-title { font-size: 48px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.5px; }
        .page-desc { font-size: 18px; color: var(--gray); }
        .footer { padding: 60px 0; text-align: center; font-size: 13px; color: #888; border-top: 1px solid var(--line); margin-top: 80px; }

        /* Education Unique */
        .edu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }
        .edu-card { border-radius: 16px; overflow: hidden; cursor: pointer; transition: 0.3s; background: #fff; border: 1px solid var(--line); }
        .edu-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .thumb-area { height: 180px; background: #222; display: flex; align-items: center; justify-content: center; color: #fff; }
        .play-icon { width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); font-size: 20px; padding-left: 4px; }
        .edu-content { padding: 24px; }
        .tag { display: inline-block; font-size: 12px; font-weight: 600; color: var(--blue); background: #eef7ff; padding: 4px 10px; border-radius: 20px; margin-bottom: 10px; }
        .edu-content h3 { margin: 0 0 8px 0; font-size: 18px; font-weight: 700; }
        .edu-content p { margin: 0; font-size: 14px; color: #666; }

        @media (max-width: 768px) { .nav { display: none; } }
      `}</style>
    </main>
  );
}