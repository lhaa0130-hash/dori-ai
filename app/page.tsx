"use client";

import { useState } from "react";

type User = { name?: string; email: string } | null;

export default function Home() {
  // 임시 카운트 변수 (나중에 서버에서 받아오는 상태로 변경 예정)
  const todayCount = 125;
  const totalCount = 4500;
  
  // --- subscribe state (SIGNUP 섹션 삭제로 사용되지 않으나, 로직은 유지) ---
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  // --- auth state (UI only) ---
  const [user, setUser] = useState<User>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authErr, setAuthErr] = useState<string | null>(null);

  async function onSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      agree: fd.get("agree") === "on",
    };
    if (!body.email || !body.agree) {
      alert("이메일을 입력하고, 개인정보 수신 동의에 체크해주세요.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setOk(res.ok);
      (e.target as HTMLFormElement).reset();
    } catch {
      setOk(false);
    } finally {
      setLoading(false);
    }
  }

  function onOpenLogin() {
    setAuthErr(null);
    setLoginOpen(true);
  }

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthErr(null);
    setAuthLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const name = String(fd.get("name") || "");
    try {
      await new Promise((r) => setTimeout(r, 650));
      if (!email.includes("@")) throw new Error("invalid");
      setUser({ email, name });
      setLoginOpen(false);
    } catch {
      setAuthErr("로그인에 실패했습니다. 이메일을 확인해 주세요.");
    } finally {
      setAuthLoading(false);
    }
  }

  function onLogout() {
    setUser(null);
  }

  // ---------- 샘플 데이터 ----------
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
    { href: "https://link-to-coupang-1", title: "카메라/마이크 세팅", desc: "초보도 바로 가능한 셋업" },
    { href: "https://link-to-coupang-2", title: "라이트·소프트박스", desc: "가격대비 최고의 조합" },
    { href: "https://link-to-coupang-3", title: "암스탠드", desc: "공간 절약형 세팅" },
    { href: "https://link-to-coupang-4", title: "오디오 인터페이스", desc: "노이즈 최소화 팁" },
    { href: "https://link-to-coupang-5", title: "헤드폰/모니터", desc: "믹싱에 적합한 모델" },
  ];

  const insightList = [
    { href: "/guide/leonardo-basics", title: "Leonardo 기본기 10분", desc: "스타일·시드·업스케일 핵심" },
    { href: "/guide/agent-automation", title: "에이전트 자동화", desc: "콘텐츠 파이프라인 만들기" },
    { href: "/guide/runway-to-sora", title: "Runway → Sora 전환", desc: "장면 구문·모션 프롬프트" },
    { href: "/guide/gpt-workflow", title: "GPT 워크플로우", desc: "아이디어→스크립트 자동화" },
    { href: "/guide/sora-cinematic", title: "Sora 시네마틱 팁", desc: "카메라/렌즈/라이팅 프롬프트" },
  ];
  // ---------------------------------

  return (
    <main className="page">
      
      {/* ⭐️ 고정될 상단 콘텐츠 컨테이너 */}
      <div className="fixed-top-content">
        
        {/* HEADER */}
        <header className="header">
          <img src="/logo.png" alt="DORI Logo" className="logo" />
          <nav className="nav">
            <div className="nav-item-wrap">
              <a href="#studio">STUDIO</a>
              <div className="dropdown">
                <a href="#studio">AI SHORTS</a>
                <a href="#studio">BRANDED CONTENT</a>
                <a href="#studio">WORKFLOW</a>
                <a href="#studio">BEHIND THE SCENE</a>
                <a href="#studio">Q&A</a>
              </div>
            </div>
            <div className="nav-item-wrap">
              <a href="#imagine">IMAGINE</a>
              <div className="dropdown">
                <a href="#imagine">CONCEPT ART</a>
                <a href="#imagine">CHARACTER DESIGN</a>
                <a href="#imagine">LANDSCAPE</a>
                <a href="#imagine">TYPOGRAPHY</a>
                <a href="#imagine">ADVANCED PROMPT</a>
              </div>
            </div>
            <div className="nav-item-wrap">
              <a href="#review">REVIEW</a>
              <div className="dropdown">
                <a href="#review">CAMERA/MIC</a>
                <a href="#review">LIGHTING</a>
                <a href="#review">SOFTWARE</a>
                <a href="#review">ACCESSORIES</a>
                <a href="#review">TIPS</a>
              </div>
            </div>
            <div className="nav-item-wrap">
              <a href="#insight">INSIGHT</a>
              <div className="dropdown">
                <a href="#insight">BASIC GUIDE</a>
                <a href="#insight">AUTOMATION</a>
                <a href="#insight">SORA GUIDE</a>
                <a href="#insight">GPT WORKFLOW</a>
                <a href="#insight">CINEMATIC TIPS</a>
              </div>
            </div>
            <a href="#contact">CONTACT</a>
          </nav>

          {/* RIGHT: auth area */}
          <div className="auth-wrap">
            <span className="user-count">{`(Today : ${todayCount} / Total : ${totalCount})`}</span>
            <div className="auth">
              {!user ? (
                <button className="btn small ghost" onClick={onOpenLogin}>로그인</button>
              ) : (
                <div className="avatar-wrap">
                  <button className="avatar" aria-label="User menu">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </button>
                  <div className="menu">
                    <div className="menu-name">{user.name || user.email}</div>
                    <a className="menu-item" href="#dashboard">대시보드 (준비중)</a>
                    <button className="menu-item danger" onClick={onLogout}>로그아웃</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="hero">
          <img src="/hero-logo.png" alt="DORI Logo Large" className="hero-logo" />
          <h1 className="headline mod">Beyond Human Limits.</h1>
          <p className="sub">Design Of Real Intelligence — DORI-AI</p>
        </section>
      </div>

      {/* ⭐️ 스크롤 영역 시작점 (고정된 콘텐츠 높이만큼 여백 확보) */}
      <div className="scroll-spacer" />
      
      {/* STUDIO — 3개로 변경 (스크롤되는 콘텐츠 시작) */}
      <section id="studio" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">STUDIO</span>
          <p className="kicker-desc">AI로 만든 시네마틱 쇼츠 & 브랜디드 애니메이션. 유튜브와 연동됩니다.</p>
        </div>

        <div className="video-grid three">
          {studioList.slice(0, 3).map((v) => (
            <div className="video-wrap" key={v.id}>
              <iframe
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.title}
                loading="lazy"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="video-title">{v.title}</div>
            </div>
          ))}
        </div>

        <div className="row-cta">
          <a className="btn link" href="https://youtube.com" target="_blank" rel="noreferrer">유튜브 채널 보기</a>
        </div>

        <div className="divider" />
      </section>

      {/* IMAGINE — 3개로 변경 */}
      <section id="imagine" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">IMAGINE</span>
          <p className="kicker-desc">새로운 시각의 아이디어. 프롬프트와 함께 공개합니다.</p>
        </div>

        <div className="gallery three">
          {imagineList.slice(0, 3).map((it, i) => (
            <figure className="thumb" key={i}>
              <img src={it.src} alt={it.title} />
              <figcaption className="cap">{it.title}</figcaption>
            </figure>
          ))}
        </div>

        <div className="row-cta">
          <a className="btn link" href="/imagine">갤러리 전체보기</a>
        </div>

        <div className="divider" />
      </section>

      {/* REVIEW — 3개로 변경 */}
      <section id="review" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">REVIEW</span>
          <p className="kicker-desc">AI 크리에이터에게 도움이 되는 장비·툴을 실제 사용 후 리뷰합니다.</p>
        </div>

        <div className="cards three">
          {reviewList.slice(0, 3).map((it, i) => (
            <a className="card" href={it.href} target="_blank" rel="noreferrer" key={i}>
              <div className="card-title">{it.title}</div>
              <p>{it.desc}</p>
            </a>
          ))}
        </div>

        <div className="row-cta">
          <a className="btn link" href="/review">리뷰 더보기</a>
        </div>

        <div className="divider" />
      </section>

      {/* INSIGHT — 3개로 변경 */}
      <section id="insight" className="container section">
        <div className="section-head mod">
          <span className="kicker mod">INSIGHT</span>
          <p className="kicker-desc">Leonardo, Runway, GPT, Sora 등 실전 워크플로우를 짧고 명확하게.</p>
        </div>

        <div className="chips">
          <span className="chip">Leonardo</span>
          <span className="chip">Runway</span>
          <span className="chip">Sora</span>
          <span className="chip">Agent</span>
        </div>

        <div className="cards three">
          {insightList.slice(0, 3).map((it, i) => (
            <a className="card" href={it.href} key={i}>
              <div className="card-title">{it.title}</div>
              <p>{it.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* SIGNUP 섹션 (id="signup") 및 CONTACT 섹션 (id="contact") 삭제됨 */}
      
      {/* FOOTER */}
      <footer className="footer">
        <span>DORI — DESIGN OF REAL INTELLIGENCE</span>
        <span>© {new Date().getFullYear()} DORI</span>
      </footer>

      {/* Styles */}
      <style jsx global>{`
        :root{ --bg:#fff; --text:#222; --muted:#555; --line:#ececec; --blue:#00baff; }
        *{box-sizing:border-box}
        html,body{ margin:0; padding:0; background:var(--bg); color:var(--text); height: 100%;}
        .page{display:flex;flex-direction:column;gap:84px; min-height: 100vh;}

        /* ⭐️ 상단 고정 컨테이너 */
        .fixed-top-content {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 20; /* Hero 이미지 위에 오도록 설정 */
            background: var(--bg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        /* ⭐️ Hero 섹션의 높이만큼 공간을 띄워 스크롤 콘텐츠를 시작시키는 Spacer */
        /* 이 값은 .fixed-top-content의 실제 높이와 일치해야 합니다. */
        .scroll-spacer {
            height: 500px; /* Header(약 50px) + Hero(약 450px) = 500px (대략적인 값, 반응형 디자인에 따라 조정 필요) */
            background: transparent;
            width: 100%;
        }

        /* 1. 헤더 폭 축소 */
        .header{
          position: relative; /* fixed-top-content 내부에서 relative 유지 */
          z-index: 10;
          display:flex;align-items:center;justify-content:space-between;
          padding: 4px 28px; /* 상하 폭을 크게 줄임 */
          background:rgba(255,255,255,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);
        }
        .logo{height:32px; width: auto;} /* 로고 높이 조정 */
        
        /* 2. 내비게이션 스타일 수정 및 드롭다운 구조 추가 (INSIGHT-CONTACT 간격 수정 포함) */
        .nav{display:flex;align-items:center;}
        .nav a{margin-left:0;font-weight:normal} 
        .nav-item-wrap,
        .nav > a { 
          position: relative;
          margin-left: 30px; 
        }
        .nav-item-wrap:first-child{margin-left: 0;} 

        .nav-item-wrap > a, .nav > a{
          text-decoration:none;
          color:var(--text);
          font-weight:bold; 
          letter-spacing: 0.1em; 
          font-size: 15px;
          display: block;
          padding: 10px 0;
        }
        .nav-item-wrap > a:hover, .nav > a:hover{color:var(--blue)}

        .dropdown{
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          width: max-content;
          background: #fff;
          border: 1px solid #e8eef7;
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(0,0,0,.08);
          padding: 8px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          margin-top: 5px; /* 헤더가 얇아진 만큼 조정 */
        }
        .nav-item-wrap:hover .dropdown{
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }
        .dropdown a{
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
        .dropdown a:hover{
          background: #f6faff;
          color: var(--blue);
        }

        /* 1. 로그인 좌측에 카운트 표시 추가 */
        .auth-wrap{
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .user-count{
          font-size: 13px;
          color: var(--muted);
          white-space: nowrap;
        }

        .auth{display:flex;align-items:center;gap:10px}
        .btn.small{padding:8px 14px;font-size:13px}
        .btn.ghost{background:transparent}.btn.ghost:hover{border-color:var(--blue);color:var(--blue)}
        .avatar-wrap{position:relative}
        .avatar{
          width:34px;height:34px;border-radius:50%;border:1px solid #dfe8ff;background:linear-gradient(180deg,#f9fbff,#eef6ff);
          color:#0a6fb0;font-weight:700;display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 10px rgba(0,153,255,.08), inset 0 0 0 1px rgba(255,255,255,.7);
        }
        .avatar-wrap:hover .menu{opacity:1;pointer-events:auto;transform:translateY(0)}
        .menu{
          position:absolute;right:0;top:42px;width:220px;background:#fff;border:1px solid #e8eef7;border-radius:12px;
          box-shadow:0 12px 28px rgba(0,0,0,.08);padding:8px;opacity:0;pointer-events:none;transform:translateY(6px);
          transition:.2s;
        }
        .menu-name{font-size:13px;color:#666;padding:8px 10px;border-bottom:1px solid #f0f3f8;margin-bottom:4px}
        .menu-item{display:block;width:100%;text-align:left;padding:10px;border-radius:8px;border:none;background:transparent;color:#222;text-decoration:none}
        .menu-item:hover{background:#f6faff}
        .menu-item.danger{color:#b00020}

        /* Hero 섹션 수정 */
        .hero{
            text-align:center;
            padding: 24px 24px 24px; /* 상단 고정으로 인해 상단 패딩 축소 */
            border-bottom:1px solid var(--line);
        }
        /* 이미지 태그를 hero-logo.png 대신 적절한 이미지로 가정하고 높이 축소 */
        .hero-logo{height:300px; width: auto; margin:0 auto 18px;} 
        
        /* 3. 글씨 크기 많이 줄여줘 */
        .headline.mod{font-size:clamp(32px,5vw,48px);margin:0 0 10px}
        
        .sub{max-width:720px;margin:0 auto;color:var(--muted);font-size:18px}

        .btn{padding:12px 20px;border-radius:999px;border:1px solid var(--line);text-decoration:none;transition:.25s;will-change:transform,box-shadow}
        .btn.primary{background:var(--blue);color:#fff;border-color:var(--blue)}
        .btn.primary:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(0,186,255,.25)}
        .btn.link{border-color:transparent;color:var(--blue)}

        .container{max-width:1120px;margin:0 auto;padding:0 24px}
        .section{padding-top:26px}
        
        /* 섹션 헤더 및 Kicker/설명 스타일 수정 */
        .section-head.mod{
          display: flex;
          flex-direction: column;
          align-items: flex-start; 
          margin-bottom: 20px;
        }
        .kicker{
          display:flex; 
          align-items:center;
          gap:8px;
          padding:6px 12px;
          border-radius:999px;
          background:linear-gradient(180deg,#f8fdff,#eef7ff);border:1px solid #d7ecff;color:#0a84bd;
          font-weight:600;font-size:12px;letter-spacing:.08em;
          box-shadow:0 2px 10px rgba(0,153,255,.08),inset 0 0 0 1px rgba(255,255,255,.6);
          width: 100%; 
          box-sizing: border-box; 
        }
        .kicker.mod{
          padding: 8px 24px; 
          font-size: 15px; 
        }
        
        .kicker::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--blue);box-shadow:0 0 8px rgba(0,186,255,.6)}
        
        .kicker-desc{
          font-size: 14px;
          color: var(--muted);
          margin: 8px 0 0;
          padding-left: 5px;
        }

        /* 사용되지 않는 기존 스타일 삭제 */
        .section-title{position:relative;margin:0;font-size:24px;align-self:end}
        .section-title::after{content:"";display:block;height:2px;margin-top:8px;border-radius:2px;background:linear-gradient(90deg,rgba(0,186,255,.8),rgba(0,186,255,0))}
        .section-title.center::after{margin-left:auto;margin-right:auto;width:120px}
        
        .divider{height:1px;margin:22px 0 0;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.06),rgba(0,0,0,0))}

        /* 7/8. 3개 목록을 위한 그리드 클래스 */
        .video-grid{display:grid;gap:14px}
        .video-grid.three{grid-template-columns:repeat(3,1fr)}
        .video-wrap{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fafafa;transition:transform .25s,box-shadow .25s,border-color .25s}
        .video-wrap:hover{transform:translateY(-2px);border-color:#dbefff;box-shadow:0 16px 32px rgba(0,0,0,.06),0 6px 18px rgba(0,186,255,.08)}
        .video-wrap iframe{width:100%;aspect-ratio:16/9;display:block}
        .video-title{padding:10px 12px;font-size:14px;color:#333;border-top:1px solid var(--line)}

        .gallery.three{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .gallery .thumb{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fafafa;transition:transform .25s,border-color .25s,box-shadow .25s}
        .gallery .thumb:hover{transform:translateY(-2px);border-color:#e2f3ff;box-shadow:0 14px 28px rgba(0,0,0,.06),0 4px 12px rgba(0,186,255,.06)}
        .gallery img{width:100%;height:auto;display:block}
        .gallery .cap{padding:8px 10px;font-size:12px;color:#555}

        .cards.three{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .card{border:1px solid var(--line);background:#fafafa;border-radius:12px;padding:18px;text-decoration:none;color:inherit;transition:transform .25s,border-color .25s,box-shadow .25s}
        .card:hover{transform:translateY(-2px);border-color:#e2f3ff;box-shadow:0 14px 28px rgba(0,0,0,.06),0 4px 12px rgba(0,186,255,.06)}
        .card-title{font-weight:600;margin-bottom:6px}

        .chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
        .chip{padding:8px 12px;border-radius:999px;font-size:12px;font-weight:600;background:linear-gradient(180deg,#f9fbff,#eef6ff);border:1px solid #d8eaff;color:#106ea0;box-shadow:0 4px 12px rgba(0,153,255,.08),inset 0 0 0 1px rgba(255,255,255,.6)}

        .footer{display:flex;justify-content:space-between;max-width:1120px;margin:0 auto;padding:24px;color:#777;font-size:13px}

        @media (max-width:1200px){
          .cards.three{grid-template-columns:repeat(2,1fr)}
          .gallery.three{grid-template-columns:repeat(2,1fr)}
          .video-grid.three{grid-template-columns:repeat(2,1fr)}
        }
        @media (max-width:640px){
          .cards.three{grid-template-columns:1fr}
          .gallery.three{grid-template-columns:1fr}
          .video-grid.three{grid-template-columns:1fr}
          /* 좁은 화면에서 Hero 높이 조정 */
          .hero-logo{height:200px}
          .scroll-spacer{height:400px} /* Header(약 50px) + Hero(약 350px) = 400px */
        }

        /* --- Login Modal --- */
        .modal-backdrop{position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:50;}
        .modal{width:min(420px,92vw); background:#fff; border-radius:16px; border:1px solid #e8eef7; box-shadow:0 20px 56px rgba(0,0,0,.18); padding:18px;}
        .modal h3{margin:0 0 8px; font-size:18px}
        .modal p{margin:0 0 14px; color:#666}
        .modal form{display:grid; gap:10px}
        .modal input{height:42px; border:1px solid #e5e5e5; border-radius:12px; padding:0 12px; background:#fff}
        .modal .row{display:flex; gap:8px}
        .modal .actions{display:flex; gap:8px; justify-content:flex-end; margin-top:6px}
        .btn.secondary{background:#f7f9fc; border-color:#e8eef7}
      `}</style>

      {/* Login Modal */}
      {loginOpen && (
        <div className="modal-backdrop" onClick={() => setLoginOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>로그인</h3>
            <p>이메일로 로그인하세요. (임시 UI — 나중에 인증 연동)</p>
            <form onSubmit={onLogin}>
              <div className="row">
                <input name="name" placeholder="이름 (선택)" />
                <input name="email" type="email" placeholder="이메일 (필수)" required />
              </div>
              {authErr && <div className="note err">{authErr}</div>}
              <div className="actions">
                <button type="button" className="btn secondary" onClick={() => setLoginOpen(false)}>취소</button>
                <button type="submit" className="btn primary" disabled={authLoading}>
                  {authLoading ? "확인 중..." : "로그인"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}