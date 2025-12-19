"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { TEXTS } from "@/constants/texts";
import CommunityForm from "@/components/community/CommunityForm";
import CommunityFilters from "@/components/community/CommunityFilters";
import CommunityList from "@/components/community/CommunityList";
import { CommunityPost, CommunityTag } from "@/components/community/CommunityCard";

export default function CommunityClient() {
  const t = TEXTS.communityPage;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filterTag, setFilterTag] = useState<CommunityTag | "All">("All");
  const [sort, setSort] = useState<"newest" | "likes">("newest");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const isDark = mounted && theme === 'dark';

  return (
    <main className="w-full min-h-screen relative" style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
    }}>
      {/* 다크모드 배경 효과 */}
      {mounted && theme === "dark" && (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <section className="relative pt-4 pb-2 px-6 text-center overflow-hidden" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-2 tracking-tight leading-tight"
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            {t.heroTitle.ko}
          </h1>
          <p 
            className="text-lg md:text-xl font-medium opacity-70 break-keep"
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>
      <section className="container max-w-4xl mx-auto px-4 pb-24 relative" style={{ zIndex: 1 }}>
        <CommunityForm onAddPost={handleAddPost} />
        <CommunityFilters filterTag={filterTag} setFilterTag={setFilterTag} sort={sort} setSort={setSort} />
        <CommunityList posts={filteredPosts} onLike={handleLike} />
      </section>
    </main>
  );
}