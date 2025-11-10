"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
};

type User = { name?: string; email: string } | null;

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authErr, setAuthErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error(err));
  }, []);

  const insightPosts = posts.filter(p => p.category === 'insight').slice(0, 2);

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

  return (
    <main className="page">
      {/* HEADER */}
      <header className="header">
        <img src="/logo.png" alt="DORI Logo" className="logo" />
        <nav className="nav">
          <a href="#studio">Studio</a>
          <a href="#imagine">Imagine</a>
          <a href="#review">Review</a>
          <a href="#insight">Insight</a>
          <a href="#contact">Contact</a>
        </nav>

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
      </header>

      {/* HERO */}
      <section className="hero">
        <img src="/logo.png" alt="DORI Logo Large" className="hero-logo" />
        <h1 className="headline">Beyond Human Limits.</h1>
        <p className="sub">Design Of Real Intelligence — 인간의 확장을 디자인하는 AI 스튜디오</p>
        <div className="cta">
          <a className="btn primary" href="#studio">AI STUDIO</a>
          <a className="btn ghost" href="#contact">프로젝트 문의</a>
        </div>
      </section>

      {/* STUDIO */}
      <section id="studio" className="container section">
        <div className="section-head">
          <span className="kicker">STUDIO</span>
          <h2 className="section-title">도리도리 몽</h2>
          <p>AI로 만든 시네마틱 쇼츠 & 브랜디드 애니메이션</p>
        </div>

        <div className="video-grid compact">
          <div className="video-wrap compact">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="DoriDori Mong — EP01"
              loading="lazy"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="video-title">도리도리 몽 — EP01</div>
          </div>
          <div className="video-wrap compact">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="DoriDori Mong — EP02"
              loading="lazy"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="video-title">도리도리 몽 — EP02</div>
          </div>
        </div>

        <div className="row-cta">
          <a className="btn link" href="https://youtube.com" target="_blank" rel="noreferrer">유튜브 채널 보기</a>
        </div>

        <div className="divider" />
      </section>

      {/* IMAGINE */}
      <section id="imagine" className="container section">
        <div className="section-head">
          <span className="kicker">IMAGINE</span>
          <h2 className="section-title">AI 이미지 갤러리</h2>
          <p>새로운 시각의 아이디어</p>
        </div>

        <div className="gallery two">
          <div className="thumb"><div className="placeholder">Image 01</div></div>
          <div className="thumb"><div className="placeholder">Image 02</div></div>
        </div>

        <div className="row-cta">
          <a className="btn link" href="/imagine">갤러리 전체보기</a>
        </div>

        <div className="divider" />
      </section>

      {/* REVIEW */}
      <section id="review" className="container section">
        <div className="section-head">
          <span className="kicker">REVIEW</span>
          <h2 className="section-title">도리가 쓰고 추천하는 것</h2>
          <p>AI 크리에이터에게 도움이 되는 장비·툴 리뷰</p>
        </div>

        <div className="cards two">
          <a className="card" href="#" target="_blank" rel="noreferrer">
            <div className="card-title">카메라/마이크 세팅</div>
            <p>작업 환경 최적화 가이드</p>
          </a>
          <a className="card" href="#" target="_blank" rel="noreferrer">
            <div className="card-title">라이팅/암스탠드</div>
            <p>효율적인 조명 구성법</p>
          </a>
        </div>

        <div className="row-cta">
          <a className="btn link" href="/review">리뷰 더보기</a>
        </div>

        <div className="divider" />
      </section>

      {/* INSIGHT - 실제 블로그 글 연동 */}
      <section id="insight" className="container section">
        <div className="section-head">
          <span className="kicker">INSIGHT</span>
          <h2 className="section-title">AI 활용법</h2>
          <p>Leonardo, Runway, GPT, Sora 등 실전 워크플로우</p>
        </div>

        <div className="chips">
          <span className="chip">Leonardo</span>
          <span className="chip">Runway</span>
          <span className="chip">Sora</span>
          <span className="chip">Agent</span>
        </div>

        <div className="cards two">
          {insightPosts.length > 0 ? (
            insightPosts.map((post) => (
              <Link key={post.slug} href={`/posts/${post.slug}`} className="card">
                <div className="card-title">{post.title}</div>
                <p>{post.description}</p>
                <div className="card-date">{post.date}</div>
              </Link>
            ))
          ) : (
            <>
              <div className="card placeholder-card">
                <div className="card-title">글을 작성해주세요</div>
                <p>posts 폴더에 .md 파일 추가</p>
              </div>
              <div className="card placeholder-card">
                <div className="card-title">AI가 자동 생성</div>
                <p>곧 Gemini 연동 예정</p>
              </div>
            </>
          )}
        </div>

        <div className="row-cta">
          <Link href="/blog" className="btn link">전체 글 보기</Link>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact">
        <h2 className="section-title center">프로젝트 문의</h2>
        <p>간단히 남겨주세요. 24시간 내 회신드립니다.</p>
        <a className="btn primary" href="mailto:hello@dori-ai.com">hello@dori-ai.com</a>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span>DORI — DESIGN OF REAL INTELLIGENCE</span>
        <span>© {new Date().getFullYear()} DORI</span>
      </footer>

      {/* Styles */}
      <style jsx global>{`
        :root{ --bg:#fff; --text:#222; --muted:#555; --line:#ececec; --blue:#00baff; }
        *{box-sizing:border-box}
        html,body{ margin:0; padding:0; background:var(--bg); color:var(--text);
          font-family:ui-sans-serif,system-ui,Apple SD Gothic Neo,Segoe UI,Roboto,Helvetica,Arial;}
        .page{display:flex;flex-direction:column;gap:84px}

        .header{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;
          padding:14px 28px;background:rgba(255,255,255,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
        .logo{height:32px}
        .nav a{margin-left:20px;text-decoration:none;color:var(--text);font-weight:500}
        .nav a:hover{color:var(--blue)}
        .auth{display:flex;align-items:center;gap:10px}
        .btn.small{padding:8px 14px;font-size:13px}
        .btn.ghost{background:transparent;border:1px solid var(--line)}.btn.ghost:hover{border-color:var(--blue);color:var(--blue)}
        .avatar-wrap{position:relative}
        .avatar{
          width:34px;height:34px;border-radius:50%;border:1px solid #dfe8ff;background:linear-gradient(180deg,#f9fbff,#eef6ff);
          color:#0a6fb0;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;
          box-shadow:0 2px 10px rgba(0,153,255,.08), inset 0 0 0 1px rgba(255,255,255,.7);
        }
        .avatar-wrap:hover .menu{opacity:1;pointer-events:auto;transform:translateY(0)}
        .menu{
          position:absolute;right:0;top:42px;width:220px;background:#fff;border:1px solid #e8eef7;border-radius:12px;
          box-shadow:0 12px 28px rgba(0,0,0,.08);padding:8px;opacity:0;pointer-events:none;transform:translateY(6px);
          transition:.2s;
        }
        .menu-name{font-size:13px;color:#666;padding:8px 10px;border-bottom:1px solid #f0f3f8;margin-bottom:4px}
        .menu-item{display:block;width:100%;text-align:left;padding:10px;border-radius:8px;border:none;background:transparent;color:#222;text-decoration:none;cursor:pointer}
        .menu-item:hover{background:#f6faff}
        .menu-item.danger{color:#b00020}

        .hero{text-align:center;padding:88px 24px 24px;border-bottom:1px solid var(--line)}
        .hero-logo{height:72px;margin-bottom:18px}
        .headline{font-size:clamp(40px,7vw,72px);margin:0 0 10px}
        .sub{max-width:720px;margin:0 auto;color:var(--muted);font-size:18px}
        .cta{display:flex;justify-content:center;gap:14px;margin-top:28px}

        .btn{padding:12px 20px;border-radius:999px;border:1px solid var(--line);text-decoration:none;transition:.25s;will-change:transform,box-shadow;display:inline-block}
        .btn.primary{background:var(--blue);color:#fff;border-color:var(--blue)}
        .btn.primary:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(0,186,255,.25)}
        .btn.link{border-color:transparent;color:var(--blue)}

        .container{max-width:1120px;margin:0 auto;padding:0 24px}
        .section{padding-top:26px}
        .section-head{display:grid;grid-template-columns:auto 1fr;gap:10px 16px;align-items:end;margin-bottom:16px}
        .kicker{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;
          background:linear-gradient(180deg,#f8fdff,#eef7ff);border:1px solid #d7ecff;color:#0a84bd;
          font-weight:600;font-size:12px;letter-spacing:.08em;box-shadow:0 2px 10px rgba(0,153,255,.08),inset 0 0 0 1px rgba(255,255,255,.6)}
        .kicker::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--blue);box-shadow:0 0 8px rgba(0,186,255,.6)}
        .section-title{position:relative;margin:0;font-size:24px;align-self:end}
        .section-title::after{content:"";display:block;height:2px;margin-top:8px;border-radius:2px;background:linear-gradient(90deg,rgba(0,186,255,.8),rgba(0,186,255,0))}
        .section-title.center::after{margin-left:auto;margin-right:auto;width:120px}
        .divider{height:1px;margin:22px 0 0;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.06),rgba(0,0,0,0))}
        .row-cta{text-align:center;margin-top:18px}

        .video-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
        .video-grid.compact{justify-content:center;grid-template-columns:repeat(2,minmax(0,420px))}
        .video-wrap{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fafafa;transition:transform .25s,box-shadow .25s,border-color .25s}
        .video-wrap.compact{max-width:420px}
        .video-wrap:hover{transform:translateY(-2px);border-color:#dbefff;box-shadow:0 16px 32px rgba(0,0,0,.06),0 6px 18px rgba(0,186,255,.08)}
        .video-wrap iframe{width:100%;aspect-ratio:16/9;display:block}
        .video-title{padding:10px 12px;font-size:14px;color:#333;border-top:1px solid var(--line)}

        .gallery.two{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .gallery .thumb{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fafafa;transition:transform .25s,border-color .25s,box-shadow .25s;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center}
        .gallery .thumb:hover{transform:translateY(-2px);border-color:#e2f3ff;box-shadow:0 14px 28px rgba(0,0,0,.06),0 4px 12px rgba(0,186,255,.06)}
        .gallery img{width:100%;height:auto;display:block}
        .placeholder{color:#999;font-size:14px}

        .cards.two{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .card{border:1px solid var(--line);background:#fafafa;border-radius:12px;padding:18px;text-decoration:none;color:inherit;transition:transform .25s,border-color .25s,box-shadow .25s;display:block}
        .card:hover{transform:translateY(-2px);border-color:#e2f3ff;box-shadow:0 14px 28px rgba(0,0,0,.06),0 4px 12px rgba(0,186,255,.06)}
        .card-title{font-weight:600;margin-bottom:6px;font-size:16px}
        .card-date{font-size:12px;color:#999;margin-top:8px}
        .placeholder-card{opacity:0.6;cursor:default}
        .placeholder-card:hover{transform:none;border-color:var(--line);box-shadow:none}

        .chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
        .chip{padding:8px 12px;border-radius:999px;font-size:12px;font-weight:600;background:linear-gradient(180deg,#f9fbff,#eef6ff);border:1px solid #d8eaff;color:#106ea0;box-shadow:0 4px 12px rgba(0,153,255,.08),inset 0 0 0 1px rgba(255,255,255,.6)}

        .contact{text-align:center;padding:56px 24px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
        .footer{display:flex;justify-content:space-between;max-width:1120px;margin:0 auto;padding:24px;color:#777;font-size:13px}

        @media (max-width:1024px){
          .video-grid.compact{grid-template-columns:1fr}
          .gallery.two{grid-template-columns:1fr}
          .cards.two{grid-template-columns:1fr}
        }

        .modal-backdrop{
          position:fixed; inset:0; background:rgba(0,0,0,.35);
          display:flex; align-items:center; justify-content:center; z-index:50;
        }
        .modal{
          width:min(420px,92vw); background:#fff; border-radius:16px; border:1px solid #e8eef7;
          box-shadow:0 20px 56px rgba(0,0,0,.18); padding:18px;
        }
        .modal h3{margin:0 0 8px; font-size:18px}
        .modal p{margin:0 0 14px; color:#666}
        .modal form{display:grid; gap:10px}
        .modal input{
          height:42px; border:1px solid #e5e5e5; border-radius:12px; padding:0 12px; background:#fff
        }
        .modal .row{display:flex; gap:8px}
        .modal .actions{display:flex; gap:8px; justify-content:flex-end; margin-top:6px}
        .btn.secondary{background:#f7f9fc; border-color:#e8eef7}
      `}</style>

      {loginOpen && (
        <div className="modal-backdrop" onClick={() => setLoginOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>로그인</h3>
            <p>이메일로 로그인하세요</p>
            <form onSubmit={onLogin}>
              <div className="row">
                <input name="name" placeholder="이름 (선택)" />
                <input name="email" type="email" placeholder="이메일 (필수)" required />
              </div>
              {authErr && <div style={{color:'#b00020',fontSize:'13px'}}>{authErr}</div>}
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