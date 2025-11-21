"use client";

import { useRef, useState, MouseEvent, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  // 로그인
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // 회원가입
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupName, setSignupName] = useState("");
  
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);

  const todayCount = 125;
  const totalCount = 4500;

  // 사용자 정보 불러오기
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error('Auth check failed:', err);
    }
  }

  // 블로그 글 가져오기
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => setBlogPosts(data.slice(0, 20)))
      .catch(err => console.error('Failed to load posts:', err));
  }, []);

  // 로그인
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!loginUsername.trim() || !loginPassword.trim()) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('로그인 성공!');
        setUser(data.user);
        setLoginOpen(false);
        setLoginUsername("");
        setLoginPassword("");
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('로그인 중 오류가 발생했습니다.');
    }
  }

  // 회원가입
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!signupUsername.trim() || !signupPassword.trim() || !signupName.trim()) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (signupPassword !== signupPasswordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (signupPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupUsername,
          password: signupPassword,
          name: signupName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('회원가입이 완료되었습니다!');
        setIsLogin(true);
        setSignupUsername("");
        setSignupPassword("");
        setSignupPasswordConfirm("");
        setSignupName("");
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('회원가입 중 오류가 발생했습니다.');
    }
  }

  // 로그아웃
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      alert('로그아웃 되었습니다.');
    } catch (err) {
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  }

  // ... (나머지 드래그, 네비게이션 함수들은 동일)

  const latestRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);

  function onLatestMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (!latestRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragScrollLeftRef.current = latestRef.current.scrollLeft;
  }
  function onLatestMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || !latestRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    latestRef.current.scrollLeft = dragScrollLeftRef.current - dx;
  }
  function endLatestDrag() {
    isDraggingRef.current = false;
  }
  function scrollLatestBy(dir: 1 | -1) {
    const box = latestRef.current;
    if (!box) return;
    const card = box.querySelector<HTMLElement>(".latest-card");
    const w = card?.getBoundingClientRect().width ?? 260;
    box.scrollBy({ left: dir * (w + 16), behavior: "smooth" });
  }

  function handleNavClick(id: string, e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.closest('.dropdown')) {
      return;
    }

    if (id === "community") {
      e.preventDefault();
      setActiveNav(activeNav === id ? null : id);
      return;
    }
    
    e.preventDefault();
    setActiveNav(id);
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleNavKeyDown(id: string, e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      
      if (id === "community") {
        setActiveNav(activeNav === id ? null : id);
        return;
      }
      
      setActiveNav(id);
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  const studioList: any[] = [];
  const imagineList: any[] = [];
  const displayedInsights = showAllInsights ? blogPosts : blogPosts.slice(0, 5);

  return (
    <main className="page">
      {/* 헤더 - 기존과 동일 */}
      <div className="fixed-top-content">
        <header className="header">
          <div className="header-side header-left">
            <div className="logo-wrap">
              <a href="/" className="logo-link" aria-label="DORI-AI Home">
                <img src="/logo.png" className="logo" alt="DORI Logo" />
              </a>
            </div>
          </div>

          <div className="nav-container">
            <nav className="nav">
              <div
                className={`nav-item-wrap ${activeNav === "studio" ? "active" : ""}`}
                onClick={(e) => handleNavClick("studio", e)}
                onKeyDown={(e) => handleNavKeyDown("studio", e)}
                tabIndex={0}
              >
                <a href="#studio">STUDIO</a>
                <div className="dropdown">
                  <a href="#studio">AI 이미지/컨셉아트</a>
                  <a href="#studio">AI 애니메이션</a>
                  <a href="#studio">AI 음악/사운드</a>
                  <a href="#studio">AI 웹툰/스토리보드</a>
                  <a href="#studio">클라이언트 작업</a>
                </div>
              </div>

              <div
                className={`nav-item-wrap ${activeNav === "insight" ? "active" : ""}`}
                onClick={(e) => handleNavClick("insight", e)}
                onKeyDown={(e) => handleNavKeyDown("insight", e)}
                tabIndex={0}
              >
                <a href="#insight">INSIGHT</a>
                <div className="dropdown">
                  <a href="#insight">AI 정보 공유</a>
                  <a href="#insight">AI 최신뉴스</a>
                  <a href="#insight">AI 자동화/비즈니스</a>
                  <a href="#insight">AI 프롬프트/시네마틱</a>
                  <a href="#insight">AI 파트너십</a>
                </div>
              </div>

              <div
                className={`nav-item-wrap ${activeNav === "education" ? "active" : ""}`}
                onClick={(e) => handleNavClick("education", e)}
                onKeyDown={(e) => handleNavKeyDown("education", e)}
                tabIndex={0}
              >
                <a href="#education">EDUCATION</a>
                <div className="dropdown">
                  <a href="#education">영어</a>
                  <a href="#education">중국어</a>
                  <a href="#education">일본어</a>
                  <a href="#education">프린터블 교재</a>
                </div>
              </div>

              <div
                className={`nav-item-wrap ${activeNav === "community" ? "active" : ""}`}
                onClick={(e) => handleNavClick("community", e)}
                onKeyDown={(e) => handleNavKeyDown("community", e)}
                tabIndex={0}
              >
                <a href="#community">COMMUNITY</a>
                <div className="dropdown">
                  <a href="/community">자유게시판</a>
                  <a href="/community">질문·답변</a>
                  <a href="/community">팁·노하우</a>
                  <a href="/community">공지사항</a>
                </div>
              </div>
            </nav>
          </div>

          <div className="header-side header-right">
            <div className="auth-wrap">
              <span className="user-count">
                (Today : {todayCount} / Total : {totalCount})
              </span>

              {!user ? (
                <button className="btn small ghost" onClick={() => setLoginOpen(true)}>
                  로그인
                </button>
              ) : (
                <div className="avatar-wrap">
                  <button className="avatar">
                    {user.name?.[0]?.toUpperCase()}
                  </button>
                  <div className="menu">
                    <div className="menu-name">{user.name}</div>
                    <div className="menu-username">@{user.username}</div>
                    <button className="menu-item danger" onClick={handleLogout}>
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      <div className="scroll-spacer" />

      {/* 나머지 섹션들은 기존과 동일... */}
      <section className="hero">
        <img src="/hero-logo.png" className="hero-logo" alt="DORI Hero Logo" />
      </section>

      <section className="container section">
        <div className="section-head mod">
          <span className="kicker mod">LATEST</span>
        </div>

        {blogPosts.length === 0 ? (
          <div className="latest-empty">업로드 된 글이 없습니다.</div>
        ) : (
          <div className="latest-wrapper">
            <button className="latest-arrow left" onClick={() => scrollLatestBy(-1)}>
              ◀
            </button>
            <div
              className="latest-scroller"
              ref={latestRef}
              onMouseDown={onLatestMouseDown}
              onMouseMove={onLatestMouseMove}
              onMouseLeave={endLatestDrag}
              onMouseUp={endLatestDrag}
            >
              {blogPosts.map((post) => (
                <a className="latest-card" href={`/posts/${post.slug}`} key={post.slug}>
                  <div className="latest-thumb-wrap">
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt={post.title} />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '3rem',
                        fontWeight: 'bold'
                      }}>
                        📝
                      </div>
                    )}
                  </div>
                  <div className="latest-meta">
                    <div className="latest-card-title">{post.title}</div>
                    <div className="latest-card-desc">{post.date}</div>
                  </div>
                </a>
              ))}
            </div>
            <button className="latest-arrow right" onClick={() => scrollLatestBy(1)}>
              ▶
            </button>
          </div>
        )}
      </section>

      <section id="studio" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">STUDIO</span>
        </div>
        <div className="gallery three">
          {imagineList.map((it) => (
            <figure className="thumb" key={it.title}>
              <img src={it.src} alt={it.title} />
              <figcaption className="cap">{it.title}</figcaption>
            </figure>
          ))}
        </div>
        <div className="divider" />
      </section>

      <section id="insight" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">INSIGHT</span>
        </div>

        {blogPosts.length > 0 ? (
          <>
            <div className="insight-list">
              {displayedInsights.map((post, index) => (
                <a className="insight-item" href={`/posts/${post.slug}`} key={post.slug}>
                  <span className="insight-number">{String(index + 1).padStart(2, '0')}.</span>
                  <span className="insight-title">{post.title}</span>
                  <span className="insight-date">{post.date}</span>
                </a>
              ))}
            </div>
            
            {!showAllInsights && blogPosts.length > 5 && (
              <div className="insight-more-wrap">
                <button 
                  className="insight-more-btn"
                  onClick={() => setShowAllInsights(true)}
                >
                  + 더보기
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="latest-empty">글이 없습니다.</div>
        )}

        <div className="divider" />
      </section>

      <section id="education" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">EDUCATION</span>
        </div>

        <div className="video-grid three">
          {studioList.map((v) => (
            <div className="video-wrap" key={v.id}>
              <iframe
                src={`https://www.youtube.com/embed/${v.id}`}
                loading="lazy"
                title={v.title}
              />
              <div className="video-title">{v.title}</div>
            </div>
          ))}
        </div>

        <div className="divider" />
      </section>

      <footer className="footer">
        <span>DORI — DESIGN OF REAL INTELLIGENCE</span>
        <span>© {new Date().getFullYear()} DORI</span>
      </footer>

      {/* CSS - 기존과 동일하되 menu-username 추가 */}
      <style jsx global>{`
        /* 기존 CSS 전체 유지하고 아래만 추가 */
        :root {
          --bg: #fff;
          --text: #222;
          --muted: #555;
          --line: #ececec;
          --blue: #00baff;
        }
        * {
          box-sizing: border-box;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--bg);
          color: var(--text);
        }
        .page {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        .fixed-top-content {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 20;
          background: var(--bg);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .scroll-spacer {
          height: 64px;
        }
        .header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 4px 28px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .header-side {
          display: flex;
          align-items: center;
        }
        .header-left {
          justify-content: flex-start;
        }
        .header-right {
          justify-content: flex-end;
        }

        .logo-wrap {
          position: relative;
          width: 128px;
          height: 48px;
        }
        .logo-link {
          display: inline-block;
          width: 100%;
          height: 100%;
        }
        .logo {
          height: 32px;
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%) scale(3.5);
          transform-origin: left center;
        }

        .nav-container {
          justify-self: center;
          display: flex;
          justify-content: center;
        }
        .nav {
          display: flex;
          gap: 18px;
        }

        .nav-item-wrap {
          position: relative;
          padding: 6px 16px 22px;
          cursor: pointer;
          border-radius: 999px;
          transition: background 0.2s, box-shadow 0.2s;
        }

        .nav-item-wrap > a {
          text-decoration: none;
          color: var(--text);
          font-weight: bold;
          letter-spacing: 0.1em;
          font-size: 15px;
          padding: 4px 0;
          display: block;
        }

        .nav-item-wrap:hover,
        .nav-item-wrap:focus-within,
        .nav-item-wrap.active {
          background: #eef7ff;
          box-shadow: 0 6px 16px rgba(0, 153, 255, 0.12);
        }

        .nav-item-wrap:hover > a,
        .nav-item-wrap:focus-within > a,
        .nav-item-wrap.active > a {
          color: var(--blue);
        }

        .dropdown {
          position: absolute;
          top: calc(100% - 6px);
          left: 50%;
          transform: translateX(-50%) translateY(6px);
          background: #fff;
          border: 1px solid #e8eef7;
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          padding: 8px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          min-width: 200px;
          z-index: 30;
        }

        .nav-item-wrap:hover .dropdown,
        .nav-item-wrap:focus-within .dropdown,
        .nav-item-wrap.active .dropdown {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }

        .dropdown a {
          display: block;
          padding: 8px 12px;
          font-size: 13px;
          color: #555;
          white-space: nowrap;
          text-decoration: none;
          border-radius: 6px;
        }
        .dropdown a:hover {
          background: #f6faff;
          color: var(--blue);
        }

        .auth-wrap {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .user-count {
          font-size: 13px;
          color: var(--muted);
        }
        .btn {
          padding: 12px 20px;
          border-radius: 999px;
          border: 1px solid var(--line);
          cursor: pointer;
          background: transparent;
        }
        .btn.small {
          padding: 8px 14px;
          font-size: 13px;
        }
        .btn.ghost {
          background: transparent;
        }
        .btn.ghost:hover {
          border-color: var(--blue);
          color: var(--blue);
        }

        .avatar-wrap {
          position: relative;
        }
        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #dfe8ff;
          background: #eef6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #0a6fb0;
          cursor: pointer;
        }
        .menu {
          position: absolute;
          right: 0;
          top: 42px;
          width: 220px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e8eef7;
          padding: 8px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(6px);
          transition: 0.2s;
        }
        .avatar-wrap:hover .menu {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        .menu-name {
          font-size: 13px;
          font-weight: 600;
          color: #222;
          padding: 8px 10px 4px;
        }
        .menu-username {
          font-size: 12px;
          color: #999;
          padding: 0 10px 8px;
          border-bottom: 1px solid #f0f3f8;
          margin-bottom: 4px;
        }
        .menu-item {
          padding: 10px;
          border-radius: 8px;
          background: transparent;
          text-align: left;
          width: 100%;
          border: none;
          cursor: pointer;
        }
        .menu-item:hover {
          background: #f6faff;
        }
        .menu-item.danger {
          color: #b00020;
        }

        .hero {
          text-align: center;
          padding: 0 24px 24px;
          border-bottom: 1px solid var(--line);
        }
        .hero-logo {
          height: 260px;
          margin: 0 auto;
          display: block;
        }

        .container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .section {
          padding-top: 26px;
        }
        .section-head {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .kicker {
          padding: 6px 12px;
          border-radius: 999px;
          background: #eef7ff;
          border: 1px solid #d7ecff;
          font-size: 12px;
          color: #0a84bd;
          font-weight: 600;
        }
        .kicker.mod {
          padding: 8px 24px;
          font-size: 15px;
          width: 100%;
        }

        .divider {
          height: 1px;
          margin: 22px 0;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0),
            rgba(0, 0, 0, 0.06),
            rgba(0, 0, 0, 0)
          );
        }

        .latest-empty {
          padding: 24px;
          border: 1px dashed var(--line);
          border-radius: 12px;
          text-align: center;
          color: var(--muted);
        }
        .latest-wrapper {
          position: relative;
          padding: 0 32px;
        }
        .latest-scroller {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          cursor: grab;
          padding-bottom: 6px;
        }
        .latest-scroller:active {
          cursor: grabbing;
        }
        .latest-card {
          flex: 0 0 calc(25% - 12px);
          min-width: 210px;
          background: #fafafa;
          border-radius: 14px;
          border: 1px solid var(--line);
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          scroll-snap-align: start;
        }
        .latest-thumb-wrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
        }
        .latest-thumb-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .latest-meta {
          padding: 10px;
        }
        .latest-card-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .latest-card-desc {
          font-size: 12px;
          color: var(--muted);
        }
        .latest-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 50px;
          border-radius: 24px;
          background: #fff;
          border: 1px solid #dde5f2;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .latest-arrow.left {
          left: 0;
        }
        .latest-arrow.right {
          right: 0;
        }

        .insight-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: #fafafa;
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
        }

        .insight-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          text-decoration: none;
          color: inherit;
          border-bottom: 1px solid var(--line);
          transition: background 0.2s;
        }

        .insight-item:last-child {
          border-bottom: none;
        }

        .insight-item:hover {
          background: #f0f7ff;
        }

        .insight-number {
          font-size: 16px;
          font-weight: 700;
          color: var(--blue);
          min-width: 40px;
        }

        .insight-title {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .insight-date {
          font-size: 13px;
          color: var(--muted);
        }

        .insight-more-wrap {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .insight-more-btn {
          padding: 10px 24px;
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 999px;
          font-size: 14px;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }

        .insight-more-btn:hover {
          background: #eef7ff;
          border-color: var(--blue);
          color: var(--blue);
        }

        .gallery.three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .thumb {
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fafafa;
          overflow: hidden;
        }
        .thumb img {
          width: 100%;
        }
        .cap {
          padding: 8px;
          font-size: 12px;
          color: #555;
        }

        .video-grid.three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .video-wrap {
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fafafa;
          overflow: hidden;
        }
        iframe {
          width: 100%;
          aspect-ratio: 16 / 9;
        }
        .video-title {
          padding: 10px;
          border-top: 1px solid var(--line);
        }

        .footer {
          display: flex;
          justify-content: space-between;
          max-width: 1120px;
          margin: 0 auto;
          padding: 24px;
          color: #777;
          font-size: 13px;
        }

        /* LOGIN MODAL */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .modal {
          background: #fff;
          width: min(420px, 92vw);
          padding: 30px;
          border-radius: 16px;
          border: 1px solid #e8eef7;
        }
        .modal-title {
          font-size: 1.5rem;
          margin: 0 0 20px 0;
          text-align: center;
        }
        .auth-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .auth-tab {
          flex: 1;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }
        .auth-tab.active {
          background: #eef7ff;
          border-color: var(--blue);
          color: var(--blue);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .form-input {
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 8px;
          font-size: 1rem;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--blue);
        }
        .form-helper {
          font-size: 0.85rem;
          color: #999;
          margin-top: -10px;
        }
        .submit-btn {
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 640px) {
          .gallery.three,
          .video-grid.three {
            grid-template-columns: 1fr;
          }
          .hero-logo {
            height: 200px;
          }
          .nav {
            gap: 8px;
          }
          .nav-item-wrap {
            padding: 4px 10px 18px;
          }
          .insight-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>

      {/* 로그인/회원가입 모달 */}
      {loginOpen && (
        <div className="modal-backdrop" onClick={() => setLoginOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{isLogin ? '로그인' : '회원가입'}</h2>
            
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                로그인
              </button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                회원가입
              </button>
            </div>

            {isLogin ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="아이디"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="비밀번호"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button type="submit" className="submit-btn">
                  로그인
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignup}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="아이디 (영문, 숫자 4-20자)"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="이름"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="비밀번호 (최소 6자)"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="비밀번호 확인"
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  required
                />
                <button type="submit" className="submit-btn">
                  회원가입
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}