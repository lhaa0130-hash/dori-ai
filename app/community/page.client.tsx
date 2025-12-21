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
    // 더미 데이터 강제 삭제
    localStorage.setItem("dori_community_posts", JSON.stringify([]));
    setPosts([]);
    setIsLoaded(true);
  }, []);

  useEffect(() => { if (isLoaded) localStorage.setItem("dori_community_posts", JSON.stringify(posts)); }, [posts, isLoaded]);

  const handleAddPost = (newPost: CommunityPost) => setPosts([newPost, ...posts]);
  const handleLike = (id: number) => setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  const filteredPosts = posts.filter(p => filterTag === "All" || p.tag === filterTag).sort((a, b) => sort === "likes" ? b.likes - a.likes : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isDark = mounted && theme === 'dark';

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 배경 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {mounted && theme === "dark" && (
          <>
            <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
            <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}
        {mounted && theme === "light" && (
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), #ffffff',
            }}
          />
        )}
      </div>

      {/* 히어로 섹션 */}
      <section className="relative pt-20 pb-12 px-6 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
            style={{ 
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            {t.heroTitle.ko}
          </h1>
          
          {/* 그라데이션 바 */}
          <div 
            className="w-full max-w-2xl mx-auto h-1 md:h-1.5 mb-6 rounded-full overflow-hidden"
            style={{
              boxShadow: isDark 
                ? '0 0 30px rgba(96, 165, 250, 0.4), 0 4px 20px rgba(96, 165, 250, 0.2)'
                : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 15px rgba(37, 99, 235, 0.2)',
            }}
          >
            <div 
              className="h-full rounded-full"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%, #60a5fa 100%)'
                  : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%, #2563eb 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradientFlow 4s linear infinite',
              }}
            />
          </div>

          <p 
            className="text-lg md:text-xl font-medium opacity-70 break-keep leading-relaxed"
            style={{ 
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>
      {/* 좌측 사이드바 네비게이션 */}
      <aside 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
      >
        <nav className="ml-6">
          <div 
            className="flex flex-col gap-3 p-4 rounded-2xl backdrop-blur-xl transition-all duration-500"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            }}
          >
            {(["All", "질문", "정보", "자랑", "잡담"] as (CommunityTag | "All")[]).map((tag) => (
              <a
                key={tag}
                href="#"
                className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: filterTag === tag 
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setFilterTag(tag);
                }}
              >
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    filterTag === tag ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: filterTag === tag 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                  }}
                />
                <span 
                  className="text-xs font-medium transition-all duration-300"
                  style={{
                    color: filterTag === tag 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    transform: filterTag === tag ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  {tag === "All" ? "전체" : tag}
                </span>
              </a>
            ))}
          </div>
        </nav>
      </aside>

      {/* 우측 빈 사이드바 */}
      <aside 
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
        style={{
          width: '140px',
        }}
      />

      {/* 메인 콘텐츠 */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-24 relative lg:pl-32">
        <CommunityForm onAddPost={handleAddPost} />
        <CommunityFilters sort={sort} setSort={setSort} />
        <CommunityList posts={filteredPosts} onLike={handleLike} />
      </section>

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </main>
  );
}