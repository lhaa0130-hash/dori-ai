"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import "./community.css";

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await fetch("/api/community");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!session) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          author: session.user?.name || "익명",
        }),
      });

      if (res.ok) {
        setTitle("");
        setContent("");
        setIsWriting(false);
        loadPosts();
      } else {
        alert("글 작성에 실패했습니다.");
      }
    } catch (err) {
      console.error("Failed to submit:", err);
      alert("글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="community-page">
      <header className="community-header">
        <div className="community-container">
          <a href="/" className="back-link">← 홈으로</a>
          <h1 className="community-title">COMMUNITY</h1>
          <p className="community-desc">자유롭게 소통하는 공간입니다</p>
        </div>
      </header>

      <div className="community-container">
        <section className="posts-section">
          <div className="posts-header">
            <h2>전체 글 ({posts.length})</h2>
          </div>

          {posts.length === 0 ? (
            <div className="empty-state">
              <p>아직 작성된 글이 없습니다.</p>
              <p>첫 번째 글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <a key={post.id} href={`/community/${post.id}`} className="post-item">
                  <div className="post-item-header">
                    <h3 className="post-item-title">{post.title}</h3>
                    <span className="post-item-author">{post.author}</span>
                  </div>
                  <p className="post-item-preview">{post.content.substring(0, 100)}...</p>
                  <span className="post-item-date">
                    {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="write-section">
          {!isWriting ? (
            <button
              className="write-toggle-btn"
              onClick={() => {
                if (!session) {
                  alert("로그인이 필요합니다.");
                  return;
                }
                setIsWriting(true);
              }}
            >
              ✏️ 글쓰기
            </button>
          ) : (
            <form className="write-form" onSubmit={handleSubmit}>
              <h3>새 글 작성</h3>
              
              <input
                type="text"
                className="write-input"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />

              <textarea
                className="write-textarea"
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
              />

              <div className="write-actions">
                <button
                  type="button"
                  className="write-btn cancel"
                  onClick={() => {
                    setIsWriting(false);
                    setTitle("");
                    setContent("");
                  }}
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="write-btn submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "작성 중..." : "작성하기"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}