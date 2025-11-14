"use client";

import { useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

type LatestPost = {
  href: string;
  title: string;
  desc: string;
  thumb: string;
};

// 지금은 실제 글이 없으니까 빈 배열
const latestList: LatestPost[] = [];

export default function Home() {
  const { data: session } = useSession();
  const user = session?.user || null;

  const todayCount = 125;
  const totalCount = 4500;

  const [loginOpen, setLoginOpen] = useState(false);

  // ---------- 섹션용 샘플 데이터 ----------
  const studioList = [
    { id: "VIDEO_ID_1", title: "도리도리 몽 — EP01" },
    { id: "VIDEO_ID_2", title: "도리도리 몽 — EP02" },
    { id: "VIDEO_ID_3", title: "도리도리 몽 — EP03" },
    { id: "VIDEO_ID_4", title: "도리도리 몽 — EP04" },
    { id: "VIDEO_ID_5", title: "도리도리 몽 — EP05" },
  ];

  const imagineList = [
    { src: "/gallery/01.jpg", title: "Core Concept 01" },
    { src: "/gallery/02.jpg", title: "Core Concept 02" },
    { src: "/gallery/03.jpg", title: "Core Concept 03" },
    { src: "/gallery/04.jpg", title: "Core Concept 04" },
    { src: "/gallery/05.jpg", title: "Core Concept 05" },
  ];

  const reviewList = [
    {
      href: "https://link-to-coupang-1",
      title: "카메라/마이크 세팅",
      desc: "초보도 바로 가능한 셋업",
    },
    {
      href: "https://link-to-coupang-2",
      title: "라이트·소프트박스",
      desc: "가격대비 최고의 조합",
    },
    {
      href: "https://link-to-coupang-3",
      title: "암스탠드",
      desc: "공간 절약형 세팅",
    },
    {
      href: "https://link-to-coupang-4",
      title: "오디오 인터페이스",
      desc: "노이즈 최소화 팁",
    },
    {
      href: "https://link-to-coupang-5",
      title: "헤드폰/모니터",
      desc: "믹싱에 적합한 모델",
    },
  ];

  const insightList = [
    {
      href: "/guide/leonardo-basics",
      title: "Leonardo 기본기 10분",
      desc: "스타일·시드·업스케일 핵심",
    },
    {
      href: "/guide/agent-automation",
      title: "에이전트 자동화",
      desc: "콘텐츠 파이프라인 만들기",
    },
    {
      href: "/guide/runway-to-sora",
      title: "Runway → Sora 전환",
      desc: "장면 구문·모션 프롬프트",
    },
    {
      href: "/guide/gpt-workflow",
      title: "GPT 워크플로우",
      desc: "아이디어→스크립트 자동화",
    },
    {
      href: "/guide/sora-cinematic",
      title: "Sora 시네마틱 팁",
      desc: "카메라/렌즈/라이팅 프롬프트",
    },
  ];

  // ---------- LATEST 드래그 + 버튼 스크롤 ----------
  const latestRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);

  function onLatestMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!latestRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragScrollLeftRef.current = latestRef.current.scrollLeft;
  }

  function onLatestMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || !latestRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    latestRef.current.scrollLeft = dragScrollLeftRef.current - dx;
  }

  function endLatestDrag() {
    isDraggingRef.current = false;
  }

  function scrollLatestBy(direction: 1 | -1) {
    const container = latestRef.current;
    if (!container) return;
    const card = container.querySelector<HTMLElement>(".latest-card");
    const cardWidth = card?.getBoundingClientRect().width ?? 260;
    const gap = 16;
    container.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: "smooth",
    });
  }

  // ---------- Auth ----------
  function onOpenLogin() {
    setLoginOpen(true);
  }

  function onGoogleAuth() {
    signIn("google", { callbackUrl: "/" });
  }

  function onLogout() {
    signOut({ callbackUrl: "/" });
  }

  return (
    <main className="page">
      {/* 상단 고정: 헤더만 */}
      <div className="fixed-top-content">
        <header className="header">
          {/* 좌측: 로고 */}
          <div className="header-side header-left">
            <div className="logo-wrap">
              <img src="/logo.png" alt="DORI Logo" className="logo" />
            </div>
          </div>

          {/* 중앙: NAV (정중앙) */}
          <div className="nav-container">
            <nav className="nav">
              {/* 1. STUDIO */}
              <div className="nav-item-wrap">
                <a href="#studio">STUDIO</a>
                <div className="dropdown">
                  <a href="#studio">AI 이미지/컨셉아트 갤러리</a>
                  <a href="#studio">AI 애니메이션 (YouTube)</a>
                  <a href="#studio">AI 음악/사운드</a>
                  <a href="#studio">AI 웹툰/스토리보드</a>
                  <a href="#studio">클라이언트 &amp; 기타 작업물</a>
                </div>
              </div>

              {/* 2. INSIGHT */}
              <div className="nav-item-wrap">
                <a href="#insight">INSIGHT</a>
                <div className="dropdown">
                  <a href="#insight">AI 툴 심화 분석 (툴 워크플로우)</a>
                  <a href="#insight">
                    제작 기술 가이드 (프롬프트, 시네마틱 팁)
                  </a>
                  <a href="#insight">
                    AI 자동화 &amp; 비즈니스 (수익화, 법률)
                  </a>
                  <a href="#insight">AI 최신 동향/뉴스</a>
                  <a href="#insight">파트너십 및 문의</a>
                </div>
              </div>

              {/* 3. EDUCATION */}
              <div className="nav-item-wrap">
                <a href="#education">EDUCATION</a>
                <div className="dropdown">
                  <a href="#education">영어 학습 자료</a>
                  <a href="#education">중국어 학습 자료</a>
                  <a href="#education">일본어 학습 자료</a>
                  <a href="#education">무료 프린터블 교재</a>
                  <a href="#education">기타 언어/교육 가이드</a>
                </div>
              </div>

              {/* 4. COMMUNITY */}
              <div className="nav-item-wrap">
                <a href="#community">COMMUNITY</a>
                <div className="dropdown">
                  <a href="#community">유저 갤러리 (이미지/아트)</a>
                  <a href="#community">유저 영상 공유 (YouTube/Shorts)</a>
                  <a href="#community">유저 음악 공유 (Audio)</a>
                  <a href="#community">유저 웹툰/만화 공유</a>
                  <a href="#community">자유 게시판 &amp; Q&amp;A</a>
                </div>
              </div>
            </nav>
          </div>

          {/* 우측: 방문자/로그인 */}
          <div className="header-side header-right">
            <div className="auth-wrap">
              <span className="user-count">{`(Today : ${todayCount} / Total : ${totalCount})`}</span>
              <div className="auth">
                {!user ? (
                  <button className="btn small ghost" onClick={onOpenLogin}>
                    로그인
                  </button>
                ) : (
                  <div className="avatar-wrap">
                    <button className="avatar" aria-label="User menu">
                      {user.name?.[0]?.toUpperCase() ||
                        user.email?.[0]?.toUpperCase()}
                    </button>
                    <div className="menu">
                      <div className="menu-name">
                        {user.name || user.email || ""}
                      </div>
                      <a className="menu-item" href="#dashboard">
                        대시보드 (준비중)
                      </a>
                      <button className="menu-item danger" onClick={onLogout}>
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* 헤더 높이만큼 spacer */}
      <div className="scroll-spacer" />

      {/* HERO (고정 풀림) */}
      <section className="hero">
        <img
          src="/hero-logo.png"
          alt="DORI Logo Large"
          className="hero-logo"
        />
      </section>

      {/* LATEST */}
      <section className="container section">
        <div className="section-head mod">
          <span className="kicker mod">LATEST</span>
          <p className="kicker-desc">
            최근 업로드된 글을 한눈에 확인할 수 있는 영역입니다.
          </p>
        </div>

        {latestList.length === 0 ? (
          <div className="latest-empty">업로드 된 글이 없습니다.</div>
        ) : (
          <div className="latest-wrapper">
            <button
              type="button"
              className="latest-arrow left"
              onClick={() => scrollLatestBy(-1)}
            >
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
              {latestList.map((post) => (
                <a key={post.href} href={post.href} className="latest-card">
                  <div className="latest-thumb-wrap">
                    <img src={post.thumb} alt={post.title} />
                  </div>
                  <div className="latest-meta">
                    <div className="latest-card-title">{post.title}</div>
                    <div className="latest-card-desc">{post.desc}</div>
                  </div>
                </a>
              ))}
            </div>
            <button
              type="button"
              className="latest-arrow right"
              onClick={() => scrollLatestBy(1)}
            >
              ▶
            </button>
          </div>
        )}
      </section>

      {/* STUDIO */}
      <section id="studio" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">STUDIO</span>
          <p className="kicker-desc">
            관리자 전용 (제작 결과물) · AI 이미지/컨셉아트, 애니메이션, 음악,
            웹툰, 클라이언트 작업물을 한곳에 모았습니다.
          </p>
        </div>

        <div className="gallery three">
          {imagineList.map((it, i) => (
            <figure className="thumb" key={i}>
              <img src={it.src} alt={it.title} />
              <figcaption className="cap">
                AI 이미지/컨셉아트: {it.title}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="divider" />
      </section>

      {/* INSIGHT */}
      <section id="insight" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">INSIGHT</span>
          <p className="kicker-desc">
            관리자 전용 (AI 전문 정보) · AI 툴 심화 분석, 제작 기술 가이드,
            자동화 &amp; 비즈니스, 최신 동향을 정리합니다.
          </p>
        </div>

        <div className="cards three">
          {insightList.map((it, i) => (
            <a className="card" href={it.href} key={i}>
              <div className="card-title">{it.title}</div>
              <p>{it.desc}</p>
            </a>
          ))}
        </div>

        <div className="divider" />
      </section>

      {/* EDUCATION */}
      <section id="education" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">EDUCATION</span>
          <p className="kicker-desc">
            관리자 전용 (교육 자료) · 영어·중국어·일본어 학습 자료와 무료
            프린터블 교재, 기타 언어 교육 가이드를 제공합니다.
          </p>
        </div>

        <div className="video-grid three">
          {studioList.map((v) => (
            <div className="video-wrap" key={v.id}>
              <iframe
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.title}
                loading="lazy"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="video-title">교육용 영상: {v.title}</div>
            </div>
          ))}
        </div>

        <div className="divider" />
      </section>

      {/* COMMUNITY */}
      <section id="community" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">COMMUNITY</span>
          <p className="kicker-desc">
            사용자 공유/소통 (자유롭게 업로드) · 유저 갤러리, 영상, 음악, 웹툰,
            자유 게시판 &amp; Q&amp;A를 위한 공간입니다.
          </p>
        </div>

        <div className="chips">
          <span className="chip">유저 갤러리 (이미지/아트)</span>
          <span className="chip">유저 영상 공유 (YouTube/Shorts)</span>
          <span className="chip">유저 음악 공유 (Audio)</span>
          <span className="chip">유저 웹툰/만화 공유</span>
          <span className="chip">자유 게시판 &amp; Q&amp;A</span>
        </div>

        <div className="cards three">
          {reviewList.map((it, i) => (
            <a
              className="card"
              href={it.href}
              target="_blank"
              rel="noreferrer"
              key={i}
            >
              <div className="card-title">{it.title}</div>
              <p>{it.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span>DORI — DESIGN OF REAL INTELLIGENCE</span>
        <span>© {new Date().getFullYear()} DORI</span>
      </footer>

      {/* 전역 스타일 + 모달 스타일 포함 */}
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
          height: 100%;
        }
        .page {
          display: flex;
          flex-direction: column;
          gap: 48px;
          min-height: 100vh;
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
          width: 100%;
        }

        /* 헤더 중앙정렬: 1fr / auto / 1fr */
        .header {
          position: relative;
          z-index: 30;
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
          flex-shrink: 0;
        }
        .logo {
          height: 32px;
          width: auto;
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%) scale(3.5);
          transform-origin: left center;
          z-index: 1;
        }

        .nav-container {
          justify-self: center;
          display: flex;
          justify-content: center;
        }
        .nav {
          display: flex;
          align-items: center;
          padding: 0;
        }
        .nav-item-wrap,
        .nav > a {
          position: relative;
          margin-left: 30px;
        }
        .nav-item-wrap:first-child {
          margin-left: 0;
        }
        .nav-item-wrap > a,
        .nav > a {
          text-decoration: none;
          color: var(--text);
          font-weight: bold;
          letter-spacing: 0.1em;
          font-size: 15px;
          display: block;
          padding: 10px 0;
        }
        .nav-item-wrap > a:hover,
        .nav > a:hover {
          color: var(--blue);
        }

        .dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          width: max-content;
          background: #fff;
          border: 1px solid #e8eef7;
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          padding: 8px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          margin-top: 5px;
        }
        .nav-item-wrap:hover .dropdown {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }
        .dropdown a {
          display: block;
          padding: 8px 12px;
          color: #555;
          text-decoration: none;
          font-weight: 500;
          font-size: 13px;
          white-space: nowrap;
          border-radius: 6px;
          margin-left: 0;
          letter-spacing: normal;
        }
        .dropdown a:hover {
          background: #f6faff;
          color: var(--blue);
        }

        .auth-wrap {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-shrink: 0;
        }
        .user-count {
          font-size: 13px;
          color: var(--muted);
          white-space: nowrap;
        }
        .auth {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn {
          padding: 12px 20px;
          border-radius: 999px;
          border: 1px solid var(--line);
          text-decoration: none;
          transition: 0.25s;
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
        .btn.secondary {
          background: #f7f9fc;
          border-color: #e8eef7;
        }

        .avatar-wrap {
          position: relative;
        }
        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #dfe8ff;
          background: linear-gradient(180deg, #f9fbff, #eef6ff);
          color: #0a6fb0;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-wrap:hover .menu {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        .menu {
          position: absolute;
          right: 0;
          top: 42px;
          width: 220px;
          background: #fff;
          border: 1px solid #e8eef7;
          border-radius: 12px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          padding: 8px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(6px);
          transition: 0.2s;
        }
        .menu-name {
          font-size: 13px;
          color: #666;
          padding: 8px 10px;
          border-bottom: 1px solid #f0f3f8;
          margin-bottom: 4px;
        }
        .menu-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #222;
          text-decoration: none;
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
          width: auto;
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

        .section-head.mod {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f8fdff, #eef7ff);
          border: 1px solid #d7ecff;
          color: #0a84bd;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.08em;
        }
        .kicker.mod {
          padding: 8px 24px;
          font-size: 15px;
          width: 100%;
          box-sizing: border-box;
        }
        .kicker::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--blue);
        }
        .kicker-desc {
          font-size: 14px;
          color: var(--muted);
          margin: 8px 0 0;
          padding-left: 5px;
        }

        .divider {
          height: 1px;
          margin: 22px 0 0;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0),
            rgba(0, 0, 0, 0.06),
            rgba(0, 0, 0, 0)
          );
        }

        .video-grid {
          display: grid;
          gap: 14px;
        }
        .video-grid.three {
          grid-template-columns: repeat(3, 1fr);
        }
        .video-wrap {
          border: 1px solid var(--line);
          border-radius: 14px;
          overflow: hidden;
          background: #fafafa;
        }
        .video-wrap iframe {
          width: 100%;
          aspect-ratio: 16 / 9;
          display: block;
        }
        .video-title {
          padding: 10px 12px;
          font-size: 14px;
          color: #333;
          border-top: 1px solid var(--line);
        }

        .gallery.three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .gallery .thumb {
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
          background: #fafafa;
        }
        .gallery img {
          width: 100%;
          display: block;
        }
        .gallery .cap {
          padding: 8px 10px;
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
          background: #fafafa;
          border-radius: 12px;
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
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .chip {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          background: linear-gradient(180deg, #f9fbff, #eef6ff);
          border: 1px solid #d8eaff;
          color: #106ea0;
        }

        /* LATEST */
        .latest-empty {
          padding: 24px 16px;
          border-radius: 12px;
          border: 1px dashed var(--line);
          color: var(--muted);
          font-size: 14px;
          text-align: center;
        }
        .latest-wrapper {
          position: relative;
          padding: 0 32px;
        }
        .latest-scroller {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 4px 2px 8px;
          scroll-snap-type: x mandatory;
          cursor: grab;
        }
        .latest-scroller:active {
          cursor: grabbing;
        }
        .latest-card {
          flex: 0 0 calc(25% - 12px);
          min-width: 210px;
          max-width: 260px;
          background: #fafafa;
          border-radius: 14px;
          border: 1px solid var(--line);
          text-decoration: none;
          color: inherit;
          overflow: hidden;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
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
          padding: 10px 12px 12px;
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
          border: 1px solid #dde5f2;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
        }
        .latest-arrow.left {
          left: 0;
        }
        .latest-arrow.right {
          right: 0;
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

        /* 모달 스타일 (여기로 이동) */
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
          width: min(420px, 92vw);
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e8eef7;
          box-shadow: 0 20px 56px rgba(0, 0, 0, 0.18);
          padding: 18px;
        }
        .modal h3 {
          margin: 0 0 8px;
          font-size: 18px;
        }
        .modal p {
          margin: 0 0 14px;
          color: #666;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
          gap: 8px;
        }
        .google-btn {
          width: 100%;
          height: 42px;
          border-radius: 999px;
          border: 1px solid #dde2f0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          cursor: pointer;
          margin-top: 4px;
        }
        .google-btn:hover {
          background: #f7f8fd;
        }
        .google-icon-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #4285f4 0deg 90deg,
            #34a853 90deg 180deg,
            #fbbc05 180deg 270deg,
            #ea4335 270deg 360deg
          );
        }

        @media (max-width: 1200px) {
          .cards.three,
          .gallery.three,
          .video-grid.three {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .cards.three,
          .gallery.three,
          .video-grid.three {
            grid-template-columns: 1fr;
          }
          .hero-logo {
            height: 200px;
          }
        }
      `}</style>

      {/* 로그인 모달 (Google 전용) */}
      {loginOpen && (
        <div className="modal-backdrop" onClick={() => setLoginOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>로그인</h3>
            <p>Google 계정으로 DORI-AI에 로그인합니다.</p>
            <button
              type="button"
              className="google-btn"
              onClick={onGoogleAuth}
            >
              <span className="google-icon-circle" />
              <span>Google 계정으로 계속하기</span>
            </button>
            <div className="actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setLoginOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
