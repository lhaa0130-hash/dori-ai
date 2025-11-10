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

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error(err));
  }, []);

  const filteredPosts =
    filter === "all"
      ? posts
      : posts.filter((p) => p.category === filter);

  const categories = ["all", ...new Set(posts.map((p) => p.category))];

  return (
    <div className="blog-page">
      <header className="blog-header">
        <Link href="/" className="back-link">
          ← 홈으로
        </Link>
        <h1>전체 글</h1>
        <p>AI와 기술에 대한 모든 이야기</p>
      </header>

      <div className="filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? "active" : ""}`}
            onClick={() => setFilter(cat)}
          >
            {cat === "all" ? "전체" : cat}
          </button>
        ))}
      </div>

      <div className="posts-grid">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="post-card"
            >
              <div className="post-category">{post.category}</div>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
              <div className="post-date">{post.date}</div>
            </Link>
          ))
        ) : (
          <div className="empty">
            <p>아직 글이 없습니다</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .blog-page {
          min-height: 100vh;
          background: #fff;
          padding: 40px 24px;
        }
        .blog-header {
          max-width: 1120px;
          margin: 0 auto 40px;
          text-align: center;
        }
        .back-link {
          display: inline-block;
          color: #00baff;
          text-decoration: none;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        .blog-header h1 {
          font-size: 48px;
          margin: 0 0 12px;
          color: #171a20;
        }
        .blog-header p {
          color: #5c5e62;
          font-size: 18px;
        }
        .filter-bar {
          max-width: 1120px;
          margin: 0 auto 32px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .filter-btn {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid #e5e5e5;
          background: #fff;
          color: #555;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn:hover {
          border-color: #00baff;
          color: #00baff;
        }
        .filter-btn.active {
          background: #00baff;
          color: #fff;
          border-color: #00baff;
        }
        .posts-grid {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .post-card {
          border: 1px solid #ececec;
          border-radius: 12px;
          padding: 24px;
          background: #fafafa;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s;
        }
        .post-card:hover {
          transform: translateY(-2px);
          border-color: #e2f3ff;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.06),
            0 4px 12px rgba(0, 186, 255, 0.08);
        }
        .post-category {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f9fbff, #eef6ff);
          border: 1px solid #d8eaff;
          color: #106ea0;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .post-card h2 {
          font-size: 20px;
          margin: 0 0 10px;
          color: #171a20;
        }
        .post-card p {
          color: #5c5e62;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 12px;
        }
        .post-date {
          font-size: 12px;
          color: #999;
        }
        .empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
      `}</style>
    </div>
  );
}