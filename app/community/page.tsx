"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function CommunityPage() {
  const { data: session } = useSession();
  const user = session?.user || null;

  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    loadPosts();
  }, []);

  function loadPosts() {
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    
    if (savedPosts.length === 0) {
      const dummy = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        title: `Midjourney V6 프롬프트 공유 #${i + 1}`,
        author: `Creator_${i}`,
        image: `https://picsum.photos/seed/${i + 55}/600/${600 + Math.floor(Math.random() * 400)}`,
        date: "2025.11.23",
        tag: i % 3 === 0 ? "Tip" : (i % 3 === 1 ? "Review" : "Prompt"),
        likes: Math.floor(Math.random() * 200),
        comments: Math.floor(Math.random() * 20),
        sparks: Math.floor(Math.random() * 50),
      }));
      setPosts(dummy);
      localStorage.setItem("dori_posts", JSON.stringify(dummy));
    } else {
      setPosts(savedPosts);
    }
  }

  function onLogout() { signOut({ callbackUrl: "/" }); }

  const filteredPosts = posts.filter((post) => {
    const categoryMatch = selectedCategory === "ALL" || post.tag === selectedCategory;
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = post.title?.toLowerCase().includes(searchLower);
    return categoryMatch && searchMatch;
  });

  const categories = ["ALL", "Tip", "Review", "Prompt", "Question"];

  return (
    <main className="page">
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "100vh", paddingTop: "40px" }}>
        
        {/* 상단 필터바 + 글쓰기 버튼 */}
        <div className="filter-header">
          <div className="left-controls">
            <div className="category-pills">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="right-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="정보 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* 글쓰기 버튼 */}
            <Link href="/community/write">
              <button className="write-btn-primary">
                🖊️ 글쓰기
              </button>
            </Link>
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="masonry-grid">
          {filteredPosts.slice(0).reverse().map((post) => (
            <div key={post.id} className="pin-card-wrapper">
              <Link href={`/community/${post.id}`}>
                <div className="pin-card">
                  {post.image ? (
                    <img src={post.image} alt={post.title} />
                  ) : (
                    <div className="text-placeholder">
                      <span className="text-icon">📝</span>
                      <h3>{post.title}</h3>
                      <p>{post.content?.substring(0, 60)}...</p>
                    </div>
                  )}
                  
                  <div className="pin-overlay">
                    <div className="overlay-top">
                      <span className={`tag-badge ${post.tag}`}>{post.tag || "General"}</span>
                    </div>
                    <div className="overlay-bottom">
                      <h4 className="pin-title">{post.title}</h4>
                      <div className="pin-meta">
                        <span className="author">by {post.author}</span>
                        <div className="stats">
                          <span>❤️ {post.likes || 0}</span>
                          <span>⚡ {post.sparks || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="empty-state">
            <p>검색 결과가 없습니다.</p>
          </div>
        )}

      </section>

      <style jsx global>{`
        /* 기본 설정 */
        .container { max-width: 1600px; margin: 0 auto; padding: 0 24px; } 

        /* Filter Header Style */
        .filter-header { 
          display: flex; justify-content: space-between; align-items: center; 
          margin-bottom: 32px; gap: 20px; flex-wrap: wrap; 
          position: sticky; top: 70px; z-index: 40; 
          background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); 
          padding: 16px 0; border-bottom: 1px solid transparent; 
        }
        
        .left-controls { flex: 1; overflow-x: auto; }
        .right-controls { display: flex; gap: 12px; align-items: center; }

        .category-pills { display: flex; gap: 8px; padding-bottom: 4px; }
        .pill-btn { padding: 8px 20px; border-radius: 30px; border: 1px solid var(--line); background: white; font-size: 14px; font-weight: 600; color: var(--text-sub); cursor: pointer; transition: 0.2s; white-space: nowrap; }
        .pill-btn:hover { background: #f9f9f9; color: var(--text-main); }
        .pill-btn.active { background: var(--text-main); color: white; border-color: var(--text-main); }

        .search-box { position: relative; width: 240px; }
        .search-box input { width: 100%; padding: 10px 16px; padding-left: 36px; border-radius: 30px; border: 1px solid var(--line); font-size: 14px; outline: none; transition: 0.2s; background: #f9f9f9; }
        .search-box input:focus { border-color: var(--blue); background: #fff; box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: 0.5; font-size: 14px; }

        /* 글쓰기 버튼 스타일 */
        .write-btn-primary {
          padding: 10px 24px;
          background-color: #007AFF !important;
          color: #ffffff !important;
          border: none;
          border-radius: 30px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: 0.2s;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,122,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .write-btn-primary:hover {
          background-color: #005bb5 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,122,255,0.3);
        }

        /* Masonry Grid */
        .masonry-grid { column-count: 5; column-gap: 20px; }
        .pin-card-wrapper { break-inside: avoid; margin-bottom: 20px; }

        .pin-card { position: relative; border-radius: 16px; overflow: hidden; cursor: pointer; background: #f0f0f0; transform: translateZ(0); }
        .pin-card img { width: 100%; height: auto; display: block; transition: 0.3s; }
        
        .text-placeholder { padding: 30px; background: white; border: 1px solid var(--line); min-height: 200px; display: flex; flex-direction: column; justify-content: center; text-align: center; }
        .text-icon { font-size: 32px; margin-bottom: 12px; display: block; }
        .text-placeholder h3 { font-size: 18px; margin-bottom: 8px; line-height: 1.4; }
        .text-placeholder p { font-size: 13px; color: #666; line-height: 1.5; }

        .pin-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6)); opacity: 0; transition: 0.2s; display: flex; flex-direction: column; justify-content: space-between; padding: 16px; }
        .pin-card:hover .pin-overlay { opacity: 1; }
        
        .overlay-top { display: flex; justify-content: flex-end; }
        .tag-badge { background: rgba(255,255,255,0.95); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .tag-badge.Tip { color: #007AFF; }
        .tag-badge.Prompt { color: #8B5CF6; }
        
        .overlay-bottom { color: white; transform: translateY(10px); transition: 0.2s; }
        .pin-card:hover .overlay-bottom { transform: translateY(0); }
        
        .pin-title { font-size: 16px; font-weight: 700; margin: 0 0 6px 0; text-shadow: 0 1px 3px rgba(0,0,0,0.5); line-height: 1.3; }
        .pin-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 500; opacity: 0.95; }
        .stats { display: flex; gap: 8px; }

        .empty-state { text-align: center; padding: 60px 0; color: #999; width: 100%; }

        /* 반응형 */
        @media (max-width: 1400px) { .masonry-grid { column-count: 4; } }
        @media (max-width: 1100px) { .masonry-grid { column-count: 3; } }
        @media (max-width: 900px) { 
          .masonry-grid { column-count: 2; column-gap: 12px; } 
          .pin-card-wrapper { margin-bottom: 12px; }
          .filter-header { flex-direction: column; align-items: stretch; gap: 16px; }
          .right-controls { justify-content: space-between; }
          .search-box { flex: 1; width: auto; }
        }
      `}</style>
    </main>
  );
}