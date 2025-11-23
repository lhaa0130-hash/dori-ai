"use client";

import { useState } from "react";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  date: string;
  category: string;
  thumbnail?: string; // 썸네일은 있을 수도 없을 수도 있음
};

export default function InsightList({ posts }: { posts: Post[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // 카테고리 목록
  const categories = ["ALL", "AI 정보 공유", "TREND", "TIP", "TECH", "REVIEW", "BIZ", "NEWS"]; 

  const filteredPosts = posts.filter((post) => {
    const matchCat = selectedCategory === "ALL" || post.category === selectedCategory;
    const matchSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="insight-list-wrapper">
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
              
              {/* ★ 썸네일 영역 수정됨 */}
              <div className="card-thumb">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className="thumb-img" />
                ) : (
                  <span className="thumb-icon">📝</span>
                )}
              </div>

              <div className="card-body">
                <div className="card-meta">
                  <span className="cat-badge">{item.category}</span>
                  <span className="date">{item.date}</span>
                </div>
                <h3 className="card-title">{item.title}</h3>
                <p className="card-summary">클릭하여 전체 내용을 확인하세요.</p>
                <div className="card-footer">
                  <span className="author">By DoriMaster</span>
                  <span className="read-more">Read more →</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-state">검색 결과가 없습니다.</div>
        )}
      </div>

      <style jsx>{`
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

        /* ★ 썸네일 스타일 수정됨 */
        .card-thumb { 
          height: 200px; 
          background: #f7f9fc; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border-bottom: 1px solid var(--line);
          overflow: hidden; /* 이미지가 넘치지 않게 */
          position: relative;
        }
        
        /* 실제 이미지 스타일 */
        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* 비율 유지하며 꽉 채우기 */
          transition: transform 0.5s ease;
        }

        /* 카드 호버 시 이미지 확대 효과 */
        .insight-card:hover .thumb-img {
          transform: scale(1.05);
        }

        .thumb-icon { font-size: 48px; } /* 이미지가 없을 때 아이콘 크기 */

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
    </div>
  );
}