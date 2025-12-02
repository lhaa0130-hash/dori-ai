"use client";

import { useState, useEffect } from "react";
import { TEXTS } from "@/constants/texts";
import CommunityForm from "@/components/community/CommunityForm";
import CommunityFilters from "@/components/community/CommunityFilters";
import CommunityList from "@/components/community/CommunityList";
import { CommunityPost, CommunityTag } from "@/components/community/CommunityCard";

export default function CommunityPage() {
  const t = TEXTS.communityPage;

  // 📌 상태 관리
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filterTag, setFilterTag] = useState<CommunityTag | "All">("All");
  const [sort, setSort] = useState<"newest" | "likes">("newest");
  const [isLoaded, setIsLoaded] = useState(false);

  // 📌 로컬 스토리지 초기화 (Mount 시)
  useEffect(() => {
    const saved = localStorage.getItem("dori_community_posts");
    if (saved) {
      setPosts(JSON.parse(saved));
    } else {
      // 초기 더미 데이터 (데이터 없을 때 심심하지 않게)
      const dummy: CommunityPost[] = [
        { id: 1, nickname: "DORI", title: "커뮤니티 오픈!", content: "자유롭게 글을 남겨주세요.", tag: "정보", likes: 10, createdAt: new Date().toISOString() },
        { id: 2, nickname: "유저1", title: "ChatGPT 질문있어요", content: "프롬프트 어떻게 짜나요?", tag: "질문", likes: 2, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];
      setPosts(dummy);
      localStorage.setItem("dori_community_posts", JSON.stringify(dummy));
    }
    setIsLoaded(true);
  }, []);

  // 📌 데이터 변경 시 저장
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("dori_community_posts", JSON.stringify(posts));
    }
  }, [posts, isLoaded]);

  // 📌 글 작성 핸들러
  const handleAddPost = (newPost: CommunityPost) => {
    setPosts([newPost, ...posts]);
  };

  // 📌 좋아요 핸들러
  const handleLike = (id: number) => {
    const updated = posts.map(p => 
      p.id === id ? { ...p, likes: p.likes + 1 } : p
    );
    setPosts(updated);
  };

  // 🔍 필터링 및 정렬
  const filteredPosts = posts
    .filter(p => filterTag === "All" || p.tag === filterTag)
    .sort((a, b) => {
      if (sort === "likes") return b.likes - a.likes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <main className="w-full min-h-screen">
      
      {/* 1. Hero 섹션 */}
      <section className="pt-32 pb-10 px-6 text-center">
        <h1 
          className="text-3xl md:text-5xl font-extrabold mb-4" 
          style={{ color: 'var(--text-main)' }}
        >
          {t.heroTitle.ko}
        </h1>
        <p 
          className="text-lg opacity-70 max-w-2xl mx-auto break-keep" 
          style={{ color: 'var(--text-main)' }}
        >
          {t.heroSubtitle.ko}
        </p>
      </section>

      {/* 2. 메인 컨텐츠 */}
      <section className="container max-w-4xl mx-auto px-4 pb-24">
        
        {/* 글쓰기 폼 */}
        <CommunityForm onAddPost={handleAddPost} />

        {/* 필터 */}
        <CommunityFilters 
          filterTag={filterTag} 
          setFilterTag={setFilterTag} 
          sort={sort} 
          setSort={setSort} 
        />

        {/* 리스트 */}
        <CommunityList posts={filteredPosts} onLike={handleLike} />
        
      </section>

    </main>
  );
}