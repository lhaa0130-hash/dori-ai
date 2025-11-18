"use client";

import { useRef, useState, MouseEvent, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const user = session?.user || null;

  const todayCount = 125;
  const totalCount = 4500;

  const [loginOpen, setLoginOpen] = useState(false);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // ✅ 상단 카테고리 active 상태 (dujon 느낌)
  const [activeNav, setActiveNav] = useState<string | null>(null);

  // 블로그 글 가져오기
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => setBlogPosts(data.slice(0, 6)))
      .catch(err => console.error('Failed to load posts:', err));
  }, []);

  // ----------------------------- 샘플 데이터 -----------------------------
  const studioList = [
    { id: "VIDEO_ID_1", title: "도리도리 몽 — EP01" },
    { id: "VIDEO_ID_2", title: "도리도리 몽 — EP02" },
    { id: "VIDEO_ID_3", title: "도리도리 몽 — EP03" },
  ];

  const imagineList = [
    { src: "/gallery/01.jpg", title: "Core Concept 01" },
    { src: "/gallery/02.jpg", title: "Core Concept 02" },
    { src: "/gallery/03.jpg", title: "Core Concept 03" },
  ];

  const insightList = [
    { href: "/guide/leonardo-basics", title: "Leonardo 기본기", desc: "스타일/시드 핵심" },
    { href: "/guide/agent-automation", title: "에이전트 자동화", desc: "파이프라인 만들기" },
    { href: "/guide/runway-to-sora", title: "Runway→Sora", desc: "장면·모션 프롬프트" },
  ];

  const reviewList = [
    { href: "https://a", title: "카메라 세팅", desc: "초보도 가능" },
    { href: "https://b", title: "라이트/소프트박스", desc: "가성비 최고" },
    { href: "https://c", title: "암스탠드", desc: "공간 절약형" },
  ];

  // ----------------------------- LATEST 드래그 -----------------------------
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

  // ----------------------------- Auth -----------------------------
  function onOpenLogin() {
    setLoginOpen(true);
  }
  function onGoogleAuth() {
    signIn("google", { callbackUrl: "/" });
  }
  function onLogout() {
    signOut({ callbackUrl: "/" });
  }

  // ----------------------------- NAV 핸들러 (dujon 스타일) -----------------------------
  function handleNavClick(id: string) {
    setActiveNav(id);
  }

  function handleNavKeyDown(id: string, e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveNav(id);
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  // ----------------------------- VIEW -----------------------------
  return (
    <main className="page">
      {/* -------------------- HEADER -------------------- */}
      <div className="fixed-top-content">
        <header className="header">
          <div className="header-side header-left">
            <div className="logo-wrap">
              {/* ✅ 로고 클릭 시 메인으로 이동 */}
              <a href="/" className="logo-link" aria-label="DORI-AI Home">
                <img src="/logo.png" className="logo" alt="DORI Logo" />
              </a>
            </div>
          </div>

          {/* 정중앙 NAV */}
          <div className="nav-container">
            <nav className="nav">
              {/* STUDIO */}
              <div
                className={`nav-item-wrap ${activeNav === "studio" ? "active" : ""}`}
                onClick={() => handleNavClick("studio")}
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

              {/* INSIGHT */}
              <div
                className={`nav-item-wrap ${activeNav === "insight" ? "active" : ""}`}
                onClick={() => handleNavClick("insight")}
                onKeyDown={(e) => handleNavKeyDown("insight", e)}
                tabIndex={0}
              >
                <a href="#insight">INSIGHT</a>
                <div className="dropdown">
                  <a href="#insight">AI 툴 심화 분석</a>
                  <a href="#insight">프롬프트/시네마틱</a>
                  <a href="#insight">AI 자동화/비즈니스</a>
                  <a href="#insight">AI 최신뉴스</a>
                  <a href="#insight">파트너십</a>
                </div>
              </div>

              {/* EDUCATION */}
              <div
                className={`nav-item-wrap ${activeNav === "education" ? "active" : ""}`}
                onClick={() => handleNavClick("education")}
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

              {/* COMMUNITY */}
              <div
                className={`nav-item-wrap ${activeNav === "community" ? "active" : ""}`}
                onClick={() => handleNavClick("community")}
                onKeyDown={(e) => handleNavKeyDown("community", e)}
                tabIndex={0}
              >
                <a href="#community">COMMUNITY</a>
                <div className="dropdown">
                  <a href="#community">유저 갤러리</a>
                  <a href="#community">유저 영상</a>
                  <a href="#community">유저 음악</a>
                  <a href="#community">유저 웹툰</a>
                  <a href="#community">Q&A</a>
                </div>
              </div>
            </nav>
          </div>

          {/* 우측 로그인 */}
          <div className="header-side header-right">
            <div className="auth-wrap">
              <span className="user-count">
                (Today : {todayCount} / Total : {totalCount})
              </span>

              {!user ? (
                <button className="btn small ghost" onClick={onOpenLogin}>
                  로그인
                </button>
              ) : (
                <div className="avatar-wrap">
                  <button className="avatar">
                    {user.name?.[0]?.toUpperCase()}
                  </button>
                  <div className="menu">
                    <div className="menu-name">{user.name}</div>
                    <button className="menu-item danger" onClick={onLogout}>
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

      {/* -------------------- HERO -------------------- */}
      <section className="hero">
        <img src="/hero-logo.png" className="hero-logo" alt="DORI Hero Logo" />
      </section>

      {/* -------------------- LATEST -------------------- */}
      <section className="container section">
        <div className="section-head mod">
          <span className="kicker mod">LATEST</span>
          <p className="kicker-desc">최근 업로드된 글</p>
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

      {/* -------------------- STUDIO -------------------- */}
      <section id="studio" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">STUDIO</span>
          <p className="kicker-desc">제작 이미지/컨셉아트</p>
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

      {/* -------------------- INSIGHT -------------------- */}
      <section id="insight" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">INSIGHT</span>
        </div>

        <div className="cards three">
          {blogPosts.length > 0 ? (
            blogPosts.slice(0, 3).map((post) => (
              <a className="card" href={`/posts/${post.slug}`} key={post.slug}>
                <div className="card-title">{post.title}</div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                  {post.date}
                </p>
              </a>
            ))
          ) : (
            insightList.map((it) => (
              <a className="card" href={it.href} key={it.href}>
                <div className="card-title">{it.title}</div>
                <p>{it.desc}</p>
              </a>
            ))
          )}
        </div>

        <div className="divider" />
      </section>

      {/* -------------------- EDUCATION -------------------- */}
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

      {/* -------------------- COMMUNITY -------------------- */}
      <section id="community" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">COMMUNITY</span>
        </div>

        <div className="chips">
          <span className="chip">유저 갤러리</span>
          <span className="chip">유저 영상</span>
          <span className="chip">유저 음악</span>
          <span className="chip">웹툰</span>
          <span className="chip">Q&A</span>
        </div>

        <div className="cards three">
          {reviewList.map((it) => (
            <a className="card" href={it.href} key={it.href}>
              <div className="card-title">{it.title}</div>
              <p>{it.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="footer">
        <span>DORI — DESIGN OF REAL INTELLIGENCE</span>
        <span>© {new Date().getFullYear()} DORI</span>
      </footer>

      {/* -------------------- CSS 전체 -------------------- */}
      <style jsx global>{`
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

        /* HEADER */
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

        /* ✅ dujon 느낌: nav-item-wrap 전체가 hover 영역 */
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

        /* hover / focus / active 시 배경 + 텍스트 색상 변화 */
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
          top: calc(100% - 6px); /* 패딩으로 이어지는 느낌 */
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

        /* ✅ hover + focus-within + active 모두 드롭다운 열기 */
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

        /* AUTH */
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
          color: #666;
          padding: 8px 10px;
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

        /* HERO */
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

        /* SECTION */
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
        .kicker-desc {
          font-size: 14px;
          color: var(--muted);
          margin-top: 8px;
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

        /* LATEST */
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

        /* STUDIO / INSIGHT / EDUCATION / COMMUNITY 공통 */
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

        .cards.three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .card {
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fafafa;
          padding: 18px;
          text-decoration: none;
          color: inherit;
        }
        .card-title {
          font-weight: 600;
          margin-bottom: 6px;
        }

        .chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chip {
          padding: 8px 12px;
          background: #eef7ff;
          border: 1px solid #d8eaff;
          color: #106ea0;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
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

        /* FOOTER */
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
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #e8eef7;
        }
        .google-btn {
          width: 100%;
          height: 42px;
          border-radius: 999px;
          border: 1px solid #dde2f0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fff;
          margin-top: 10px;
          cursor: pointer;
        }
        .google-btn:hover {
          background: #f7f8fd;
        }
        .google-icon-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: conic-gradient(
            #4285f4 0 90deg,
            #34a853 90 180deg,
            #fbbc05 180 270deg,
            #ea4335 270 360deg
          );
        }

        @media (max-width: 640px) {
          .gallery.three,
          .cards.three,
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
        }
      `}</style>

      {/* -------------------- LOGIN MODAL -------------------- */}
      {loginOpen && (
        <div className="modal-backdrop" onClick={() => setLoginOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>로그인</h3>
            <p>Google 계정으로 로그인합니다.</p>
            <button className="google-btn" onClick={onGoogleAuth}>
              <span className="google-icon-circle"></span>
              Google 계정으로 계속하기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}