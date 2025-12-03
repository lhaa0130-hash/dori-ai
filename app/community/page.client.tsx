"use client";
import { useState, useEffect } from "react";
import { TEXTS } from "@/constants/texts";
import CommunityForm from "@/components/community/CommunityForm";
import CommunityFilters from "@/components/community/CommunityFilters";
import CommunityList from "@/components/community/CommunityList";
import { CommunityPost, CommunityTag } from "@/components/community/CommunityCard";

export default function CommunityClient() {
  const t = TEXTS.communityPage;
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filterTag, setFilterTag] = useState<CommunityTag | "All">("All");
  const [sort, setSort] = useState<"newest" | "likes">("newest");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dori_community_posts");
    if (saved) setPosts(JSON.parse(saved));
    else {
      const dummy: CommunityPost[] = [
        { id: 1, nickname: "DORI", title: "커뮤니티 오픈!", content: "자유롭게 글을 남겨주세요.", tag: "정보", likes: 10, createdAt: new Date().toISOString() },
        { id: 2, nickname: "유저1", title: "ChatGPT 질문있어요", content: "프롬프트 어떻게 짜나요?", tag: "질문", likes: 2, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];
      setPosts(dummy);
      localStorage.setItem("dori_community_posts", JSON.stringify(dummy));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => { if (isLoaded) localStorage.setItem("dori_community_posts", JSON.stringify(posts)); }, [posts, isLoaded]);

  const handleAddPost = (newPost: CommunityPost) => setPosts([newPost, ...posts]);
  const handleLike = (id: number) => setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  const filteredPosts = posts.filter(p => filterTag === "All" || p.tag === filterTag).sort((a, b) => sort === "likes" ? b.likes - a.likes : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="w-full min-h-screen">
      <section className="pt-32 pb-10 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>{t.heroTitle.ko}</h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto break-keep" style={{ color: 'var(--text-main)' }}>{t.heroSubtitle.ko}</p>
      </section>
      <section className="container max-w-4xl mx-auto px-4 pb-24">
        <CommunityForm onAddPost={handleAddPost} />
        <CommunityFilters filterTag={filterTag} setFilterTag={setFilterTag} sort={sort} setSort={setSort} />
        <CommunityList posts={filteredPosts} onLike={handleLike} />
      </section>
    </main>
  );
}