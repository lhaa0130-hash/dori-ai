// components/insight/InsightList.tsx (최종)

"use client";

import { useState } from "react";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  date: string;
  category: string; // 이제 'AI 정보 공유' 또는 'AI 뉴스'로 통일됨
  thumbnail?: string;
  author?: string; 
};

export default function InsightList({ posts }: { posts: Post[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // ★ 탭 목록을 하드코딩된 두 카테고리로 설정
  const categories = ["ALL", "AI 정보 공유", "AI 뉴스"]; 

  const filteredPosts = posts.filter((post) => {
    // 1. 카테고리 매칭
    let matchCat = false;
    if (selectedCategory === "ALL") {
        matchCat = true;
    } else {
        // lib/posts.ts에서 통일된 카테고리 명칭으로 필터링
        matchCat = post.category === selectedCategory; 
    }
    
    // 2. 검색어 필터링
    // 검색은 제목에 대해서만 진행
    const matchSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchCat && matchSearch;
  });

  return (
    <main className="page">
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "80vh", paddingTop: "60px" }}>
        
        <div className="page-header">
          <h1 className="page-title">Daily Insight</h1>
          <p className="page-desc">
            AI 기술의 최신 트렌드와 깊이 있는 분석, 실전 꿀팁.
          </p>
        </div>

        {/* 필터 및 검색 */}
        <div className="filter-bar">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button 
                key={cat} 
                className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="search-wrap">
            <input 
              type="text" 
              placeholder="주제 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="icon">🔍</span>
          </div>
        </div>

        {/* 인사이트 그리드 리스트 */}
        <div className="insight-grid">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((item) => (
              <Link href={`/insight/${item.id}`} key={item.id} className="insight-card">
                <div className="card-thumb">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="thumb-img" />
                  ) : (
                    <span className="thumb-icon">📝</span>
                  )}
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    {/* 통일된 category 명칭 출력 */}
                    <span className="cat-badge">{item.category || "General"}</span>
                    <span className="date">{item.date}</span>
                  </div>
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-summary">클릭하여 전체 내용을 확인하세요.</p>
                  <div className="card-footer">
                    <span className="author">By {item.author || "Unknown"}</span>
                    <span className="read-more">Read more →</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state">검색 결과가 없습니다.</div>
          )}
        </div>
      </section>

      {/* 스타일은 이전과 동일하게 유지됩니다. */}
      <style jsx global>{`
        .page-header { text-align: center; margin-bottom: 60px; }
        .page-title { font-size: 42px; font-weight: 800; margin-bottom: 12px; color: var(--text-main); }
        .page-desc { font-size: 16px; color: var(--text-sub); line-height: 1.6; }

        .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; border-bottom: 1px solid var(--line); padding-bottom: 20px; }
        .category-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .tab-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid var(--line); background: white; cursor: pointer; font-weight: 600; color: var(--text-sub); transition: 0.2s; font-size: 13px; white-space: nowrap; }
        .tab-btn:hover { background: #f9f9f9; color: var(--text-main); }
        .tab-btn.active { background: var(--text-main); color: white; border-color: var(--text-main); }

        .search-wrap { position: relative; width: 260px; }
        .search-wrap input { width: 100%; padding: 10px 16px; padding-right: 40px; border: 1px solid var(--line); border-radius: 12px; font-size: 14px; outline: none; transition: 0.2s; background: #f9f9f9; }
        .search-wrap input:focus { border-color: var(--blue); background: white; box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }
        .search-wrap .icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); opacity: 0.5; font-size: 14px; }

        .insight-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 30px; }
        .insight-card { background: white; border: 1px solid var(--line); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; transition: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); text-decoration: none; color: inherit; height: 100%; }
        .insight-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-color: var(--blue); }

        .card-thumb { height: 200px; background: #f7f9fc; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--line); overflow: hidden; position: relative; }
        .thumb-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        .insight-card:hover .thumb-img { transform: scale(1.05); }
        .thumb-icon { font-size: 48px; }

        .card-body { padding: 24px; flex: 1; display: flex; flex-direction: column; }
        
        .card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .cat-badge { font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 6px; background: #eff6ff; color: var(--blue); }
        .date { font-size: 12px; color: #999; }

        .card-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; line-height: 1.4; color: var(--text-main); }
        .card-summary { font-size: 14px; color: var(--text-sub); line-height: 1.6; margin-bottom: 20px; flex: 1; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f5f5f5; padding-top: 16px; margin-top: auto; }
        .author { font-size: 12px; font-weight: 600; color: #555; }
        .read-more { font-size: 12px; font-weight: 700; color: var(--blue); transition: 0.2s; }
        .insight-card:hover .read-more { transform: translateX(4px); }
        .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px; color: #999; font-size: 16px; }

        @media (max-width: 768px) {
          .filter-bar { flex-direction: column-reverse; align-items: stretch; }
          .search-wrap { width: 100%; }
        }
      `}</style>
    </main>
  );
}