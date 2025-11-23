"use client";

import { useRef, useState, MouseEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const user = session?.user || null;

  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    if (savedPosts.length > 0) {
      setBlogPosts(savedPosts.slice(0, 8)); 
    }
  }, []);

  // 드래그 핸들러
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
  function endLatestDrag() { isDraggingRef.current = false; }
  function scrollLatestBy(dir: 1 | -1) {
    const box = latestRef.current;
    if (!box) return;
    box.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <main className="page">
      <div className="scroll-spacer" />

      {/* Top Section */}
      <section className="top-section">
        <div className="aurora-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>

        <div className="top-header fade-in-up">
          <h1>Creative Studio <span className="text-gradient">DORI-AI</span></h1>
          <p>당신이 상상하는 모든 것을, AI가 함께 만들어갑니다.</p>
        </div>
        
        <div className="bento-grid fade-in-up delay-1">
          <Link href="/studio" className="bento-card studio">
            <div className="card-bg-glow"></div>
            <div className="card-content">
              <div className="icon-box dark">🏆</div>
              <h3>AI 툴 랭킹</h3>
              <p>분야별 1위 AI 도구와<br/>솔직한 리뷰를 확인하세요.</p>
            </div>
            <div className="card-arrow">Explore →</div>
          </Link>

          <Link href="/insight" className="bento-card insight">
            <div className="card-content">
              <div className="icon-box glass">📰</div>
              <h3>인사이트</h3>
              <p>최신 AI 트렌드 뉴스.</p>
            </div>
          </Link>

          <Link href="/education" className="bento-card education">
            <div className="card-content">
              <div className="icon-box glass">🎓</div>
              <h3>강의</h3>
              <p>실전 AI 활용법 마스터.</p>
            </div>
          </Link>

          <Link href="/community" className="bento-card community">
            <div className="card-content">
              <div className="icon-box glass">💬</div>
              <h3>커뮤니티</h3>
              <p>작품 공유 및 소통.</p>
            </div>
          </Link>

          <Link href="/shop" className="bento-card shop">
            <div className="card-content">
              <div className="icon-box glass">🛍️</div>
              <h3>에셋 스토어</h3>
              <p>고퀄리티 프롬프트 거래.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="container section fade-in-up delay-2">
        <div className="section-header left-align">
          <div>
            <h2>Trending Now</h2>
            <p>커뮤니티에서 주목받는 최신 작품들</p>
          </div>
          <Link href="/community" className="view-all">전체보기 →</Link>
        </div>

        {blogPosts.length === 0 ? (
          <div className="latest-empty">
            <p>아직 등록된 글이 없습니다.</p>
            <Link href="/community/write" className="link-text">첫 번째 글을 작성해보세요!</Link>
          </div>
        ) : (
          <div className="latest-wrapper">
            <button className="latest-arrow left" onClick={() => scrollLatestBy(-1)}>←</button>
            <div className="latest-scroller" ref={latestRef} onMouseDown={onLatestMouseDown} onMouseMove={onLatestMouseMove} onMouseUp={endLatestDrag} onMouseLeave={endLatestDrag}>
              {blogPosts.map((post) => (
                <Link className="latest-card" href={`/community/${post.id}`} key={post.id}>
                  <div className="latest-thumb-wrap">
                    {post.image ? <img src={post.image} alt={post.title} /> : <div className="placeholder-thumb">🎨</div>}
                    <div className="card-gradient-overlay"></div>
                  </div>
                  <div className="latest-meta">
                    <div className="latest-title">{post.title}</div>
                    <div className="latest-info">
                      <span className="author">{post.author}</span>
                      <span className="likes">❤️ {post.likes || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <button className="latest-arrow right" onClick={() => scrollLatestBy(1)}>→</button>
          </div>
        )}
      </section>

      <style jsx global>{`
        :root { --bg: #ffffff; --text: #111; --gray: #666; --line: #e5e5e5; --blue: #007AFF; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .page { display: flex; flex-direction: column; min-height: 100vh; width: 100%; overflow-x: hidden; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }

        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section { margin-bottom: 100px; }

        .top-section {
          position: relative;
          padding: 60px 24px 80px; 
          max-width: 1200px; margin: 0 auto;
        }
        .top-header { text-align: center; margin-bottom: 80px; }
        .top-header h1 { font-size: 42px; font-weight: 800; margin-bottom: 12px; color: #111; letter-spacing: -1px; }
        .top-header p { font-size: 18px; color: #666; }
        .text-gradient { background: linear-gradient(135deg, #007AFF 0%, #8B5CF6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .aurora-bg { position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 100vw; height: 800px; overflow: hidden; z-index: -1; pointer-events: none; opacity: 0.6; }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; }
        .blob-1 { top: 0; left: 20%; width: 600px; height: 600px; background: #e0e7ff; }
        .blob-2 { top: 100px; right: 20%; width: 500px; height: 500px; background: #f3e8ff; }

        .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 240px); gap: 24px; }
        .bento-card.studio { grid-column: span 2; grid-row: span 2; background: #111; color: white; border: none; position: relative; overflow: hidden; }
        .bento-card.studio .card-content p { color: rgba(255,255,255,0.7); }
        .bento-card.studio .icon-box { background: rgba(255,255,255,0.15); color: white; }
        .bento-card.studio .card-arrow { color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 20px; border-radius: 30px; font-size: 13px; font-weight: 600; }
        
        .card-bg-glow { position: absolute; top: -50%; right: -20%; width: 100%; height: 100%; background: radial-gradient(circle, rgba(0,122,255,0.4) 0%, transparent 70%); filter: blur(60px); z-index: 0; pointer-events: none; }
        
        .bento-card { background: white; border: 1px solid #eee; border-radius: 24px; padding: 32px; display: flex; flex-direction: column; justify-content: space-between; position: relative; text-decoration: none; color: inherit; z-index: 1; transition: 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .bento-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: transparent; }
        .icon-box { width: 48px; height: 48px; background: #f7f9fc; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px; transition: 0.3s; }
        .icon-box.glass { background: rgba(0,122,255,0.05); color: var(--blue); }
        .icon-box.dark { background: rgba(255,255,255,0.2); color: #fff; }
        .bento-card:hover .icon-box { transform: scale(1.1); }
        .bento-card h3 { font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
        .bento-card p { font-size: 15px; color: #666; line-height: 1.5; }
        
        .section-header { text-align: center; margin-bottom: 40px; }
        .section-header.left-align { text-align: left; display: flex; justify-content: space-between; align-items: flex-end; }
        .section-header h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
        .section-header p { color: #666; font-size: 16px; }
        .view-all { font-size: 14px; color: var(--blue); font-weight: 600; cursor: pointer; transition: 0.2s; }
        .view-all:hover { text-decoration: underline; }

        .latest-wrapper { position: relative; }
        .latest-scroller { display: flex; gap: 24px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 30px; }
        .latest-scroller::-webkit-scrollbar { display: none; }
        .latest-card { flex: 0 0 300px; background: white; border-radius: 20px; overflow: hidden; scroll-snap-align: start; text-decoration: none; color: inherit; transition: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #f0f0f0; }
        .latest-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.08); }
        .latest-thumb-wrap { width: 100%; aspect-ratio: 16/10; background: #f0f0f0; position: relative; overflow: hidden; }
        .latest-thumb-wrap img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .latest-card:hover .latest-thumb-wrap img { transform: scale(1.05); }
        .card-gradient-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.1), transparent); opacity: 0; transition: 0.3s; }
        .latest-card:hover .card-gradient-overlay { opacity: 1; }
        .placeholder-thumb { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 40px; color: #ccc; }
        
        .latest-meta { padding: 20px; }
        .latest-title { font-weight: 700; font-size: 17px; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #111; }
        .latest-info { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #888; }
        
        .latest-arrow { position: absolute; top: 40%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: white; border: 1px solid #eee; box-shadow: 0 4px 20px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; transition: 0.2s; font-size: 20px; color: #333; }
        .latest-arrow:hover { background: #111; color: white; border-color: #111; }
        .latest-arrow.left { left: -24px; }
        .latest-arrow.right { right: -24px; }
        
        .latest-empty { text-align: center; padding: 60px; background: #f9fafb; border-radius: 20px; color: #666; border: 1px dashed #ddd; }
        .link-text { color: var(--blue); text-decoration: underline; font-weight: 600; cursor: pointer; }

        @media (max-width: 768px) {
          .top-header h1 { font-size: 32px; }
          .bento-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
          .bento-card.studio { grid-column: span 1; grid-row: span 1; height: 280px; }
          .latest-arrow { display: none; }
        }
      `}</style>
    </main>
  );
}