"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const router = useRouter();

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [sparkedPosts, setSparkedPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' or 'sparks'

  useEffect(() => {
    // 데이터 불러오기
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const mySparksIds = JSON.parse(localStorage.getItem("dori_my_sparks") || "[]");

    // 1. 내가 쓴 글 필터링
    const mine = savedPosts.filter((p: any) => p.author === user?.name);
    
    // 2. 내가 유레카(좋아요)한 글 필터링
    const sparked = savedPosts.filter((p: any) => mySparksIds.includes(String(p.id)));

    setMyPosts(mine);
    setSparkedPosts(sparked);
  }, [session, user]);

  function onLogout() { signOut({ callbackUrl: "/" }); }

  // 현재 탭에 따라 보여줄 리스트 결정
  const displayList = activeTab === "posts" ? myPosts : sparkedPosts;

  return (
    <main className="page">
      {/* HEADER */}
      <div className="fixed-top-content">
        <header className="header">
          <div className="header-side header-left">
            <div className="logo-wrap">
              <Link href="/" className="logo-link"><img src="/logo.png" className="logo" alt="DORI Logo" /></Link>
            </div>
          </div>
          <div className="nav-container">
            <nav className="nav">
              <div className="nav-item-wrap"><Link href="/#studio">STUDIO</Link></div>
              <div className="nav-item-wrap"><Link href="/#insight">INSIGHT</Link></div>
              <div className="nav-item-wrap"><Link href="/#education">EDUCATION</Link></div>
              <div className="nav-item-wrap active"><Link href="/community">COMMUNITY</Link></div>
            </nav>
          </div>
          <div className="header-side header-right">
            <div className="auth-wrap">
              {!user ? (
                <Link href="/" className="btn small ghost">로그인</Link>
              ) : (
                <div className="avatar-wrap">
                  <button className="avatar">{user.name?.[0]?.toUpperCase()}</button>
                  <div className="menu">
                    <div className="menu-name">{user.name}</div>
                    {/* 마이페이지 버튼 */}
                    <Link href="/my" style={{textDecoration:'none'}}>
                       <button className="menu-item">마이페이지</button>
                    </Link>
                    <button className="menu-item danger" onClick={onLogout}>로그아웃</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>
      <div className="scroll-spacer" />

      {/* MY PAGE CONTENT */}
      <section className="container section" style={{ minHeight: "60vh", paddingTop: "40px" }}>
        
        {/* 프로필 카드 */}
        <div className="profile-card">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || "G"}</div>
          <div className="profile-info">
            <h1 className="username">{user?.name || "게스트"}</h1>
            <p className="user-desc">DORI AI 크리에이터</p>
            <div className="user-stats">
              <span>작성글 <strong>{myPosts.length}</strong></span>
              <span className="divider">·</span>
              <span>받은 유레카 <strong>{myPosts.reduce((acc, p) => acc + (p.sparks || 0), 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === "posts" ? "active" : ""}`} 
            onClick={() => setActiveTab("posts")}
          >
            내가 쓴 글 ({myPosts.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "sparks" ? "active" : ""}`} 
            onClick={() => setActiveTab("sparks")}
          >
            ⚡️ 유레카한 글 ({sparkedPosts.length})
          </button>
        </div>

        {/* 리스트 영역 */}
        <div className="post-list">
          {displayList.length === 0 ? (
            <div className="empty-state">
              {activeTab === "posts" ? "작성한 글이 없습니다." : "아직 유레카를 누른 글이 없습니다."}
              <br />
              <Link href="/community" style={{ color: '#00baff', marginTop: '10px', display: 'inline-block' }}>
                커뮤니티 둘러보기 →
              </Link>
            </div>
          ) : (
            displayList.slice(0).reverse().map((post) => (
              <Link href={`/community/${post.id}`} key={post.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="post-item">
                  <div className="post-info">
                    <span className="post-tag">{post.tag || "자유"}</span>
                    <h3 className="post-title">
                      {post.title}
                      {post.image && <span style={{marginLeft:'8px', fontSize:'14px'}}>📷</span>}
                    </h3>
                    <p className="post-meta">작성자: {post.author} | {post.date} | 👁️ {post.views || 0}</p>
                  </div>
                  <div className="post-stats">
                    <span>💬 {post.comments || 0}</span>
                    <span style={{color: post.sparks > 0 ? '#d4b106' : '#888'}}>
                      ⚡️ {post.sparks || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span>DORI — DESIGN OF REAL INTELLIGENCE</span>
        <span>© {new Date().getFullYear()} DORI</span>
      </footer>

      <style jsx global>{`
        :root { --bg: #fff; --text: #222; --muted: #555; --line: #ececec; --blue: #00baff; --yellow: #FFD700; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: sans-serif; }
        .page { display: flex; flex-direction: column; gap: 48px; }
        .fixed-top-content { position: fixed; top: 0; left: 0; width: 100%; z-index: 20; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .scroll-spacer { height: 64px; }
        .header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 4px 28px; border-bottom: 1px solid var(--line); }
        .logo-wrap { width: 128px; height: 48px; position: relative; }
        .logo { height: 32px; position: absolute; top: 50%; transform: translateY(-50%) scale(3.5); transform-origin: left; }
        .nav { display: flex; gap: 18px; }
        .nav-item-wrap { padding: 6px 16px 22px; cursor: pointer; border-radius: 999px; position: relative; }
        .nav-item-wrap > a { text-decoration: none; color: var(--text); font-weight: bold; font-size: 15px; display: block; }
        .nav-item-wrap:hover, .nav-item-wrap.active { background: #eef7ff; }
        .nav-item-wrap:hover > a, .nav-item-wrap.active > a { color: var(--blue); }
        .auth-wrap { display: flex; align-items: center; gap: 20px; }
        .btn { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line); cursor: pointer; background: transparent; font-size: 13px; text-decoration: none; color: var(--text); }
        
        /* ★ 아바타 래퍼 */
        .avatar-wrap { 
          position: relative; 
          height: 48px; /* 헤더 높이에 맞춰 고정 */
          display: flex; 
          align-items: center; 
        }
        
        .avatar { width: 34px; height: 34px; border-radius: 50%; background: #eef6ff; border: 1px solid #dfe8ff; display: flex; align-items: center; justify-content: center; color: #0a6fb0; font-weight: bold; cursor: pointer; }
        
        /* ★ 메뉴 스타일 개선 (끊김 방지 핵심 수정) */
        .menu { 
          position: absolute; 
          right: 0; 
          top: 40px; /* 아바타 바로 밑으로 위치 고정 */
          width: 180px; 
          background: #fff; 
          border: 1px solid #e8eef7; 
          border-radius: 8px; 
          padding: 8px; 
          opacity: 0; 
          pointer-events: none; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          transition: 0.2s;
          z-index: 100; /* 다른 요소 위에 뜨도록 */
        }
        
        /* 마우스가 아바타나 메뉴 위에 있을 때 보임 */
        .avatar-wrap:hover .menu, .menu:hover { 
          opacity: 1; 
          pointer-events: auto; 
        }

        /* ★ 투명 다리 (Bridge): 틈새를 메워주는 보이지 않는 영역 */
        .menu::before {
          content: "";
          position: absolute;
          top: -20px; /* 메뉴 위쪽으로 20px 확장 */
          left: 0;
          width: 100%;
          height: 20px;
          background: transparent;
        }

        .menu-name { padding: 8px; border-bottom: 1px solid #f0f3f8; font-size: 13px; color: #666; }
        .menu-item { width: 100%; padding: 10px; border: none; background: transparent; text-align: left; cursor: pointer; border-radius: 4px; }
        .menu-item:hover { background: #f6faff; }
        .menu-item.danger { color: #b00020; }
        .container { max-width: 800px; margin: 0 auto; padding: 0 24px; }
        .footer { padding: 40px 24px; text-align: center; color: #999; font-size: 13px; display: flex; justify-content: space-between; max-width: 1120px; margin: 0 auto; }
        
        /* 마이페이지 스타일 */
        .profile-card { display: flex; align-items: center; gap: 24px; padding: 32px; background: #f9fbfd; border-radius: 16px; margin-bottom: 40px; }
        .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: #eef6ff; color: #00baff; font-size: 32px; font-weight: bold; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,186,255, 0.2); }
        .profile-info h1 { margin: 0 0 4px 0; font-size: 24px; }
        .user-desc { color: #666; margin: 0 0 12px 0; font-size: 14px; }
        .user-stats { display: flex; gap: 8px; color: #555; font-size: 14px; }
        .divider { color: #ddd; }

        .tabs { display: flex; gap: 20px; border-bottom: 1px solid #ececec; margin-bottom: 20px; }
        .tab-btn { background: none; border: none; padding: 12px 4px; cursor: pointer; font-size: 16px; color: #888; border-bottom: 2px solid transparent; font-weight: 500; }
        .tab-btn:hover { color: #333; }
        .tab-btn.active { color: #333; border-bottom-color: #333; }

        .post-list { border-top: 1px solid transparent; }
        .post-item { padding: 20px 0; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; }
        .post-item:hover { background: #f9fcfd; padding-left: 10px; padding-right: 10px; }
        .post-tag { font-size: 12px; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; color: #666; margin-bottom: 6px; display: inline-block; }
        .post-title { margin: 0 0 6px 0; font-size: 16px; color: var(--text); }
        .post-meta { font-size: 12px; color: #999; }
        .post-stats { font-size: 13px; color: #888; display: flex; gap: 10px; }
        .empty-state { text-align: center; padding: 60px 0; color: #999; }

        @media (max-width: 640px) { .nav { overflow-x: auto; padding-bottom: 4px; } .profile-card { flex-direction: column; text-align: center; } }
      `}</style>
    </main>
  );
}