"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import InsightList from "@/components/insight/InsightList";
import { TEXTS } from "@/constants/texts";
import { InsightItem } from "@/types/content";

// 📌 [비상용] 파일이 없을 때 보여줄 임시 데이터
const FALLBACK_POSTS: InsightItem[] = [
  {
    id: 999,
    title: "📢 게시글을 불러오지 못했습니다.",
    summary: "posts 폴더에 .md 파일이 없거나, 서버가 파일을 찾지 못했습니다. 터미널을 껐다가 다시 켜보세요!",
    category: "기타", // 있는 카테고리 중 하나여야 함
    tags: ["System", "Check"],
    likes: 0,
    date: new Date().toISOString(),
    content: "<p>폴더 위치를 다시 확인해주세요: 프로젝트최상위/posts/insight/...</p>",
    aiMeta: { creationType: "human_only" }
  }
];

export default function InsightClient({ initialPosts }: { initialPosts: InsightItem[] }) {
  const t = TEXTS.insight;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [filters, setFilters] = useState<{ category: string; tag: string | null; sort: string }>({
    category: "All",
    tag: null,
    sort: "newest",
  });

  useEffect(() => setMounted(true), []);

  // 작성자 ID 생성 및 관리 유틸리티
  const getAuthorId = (): string => {
    if (typeof window === 'undefined') return '';
    
    let authorId = sessionStorage.getItem('dori_insight_author_id');
    if (!authorId) {
      authorId = crypto.randomUUID();
      sessionStorage.setItem('dori_insight_author_id', authorId);
    }
    return authorId;
  };

  // 본인이 작성한 인사이트 글 ID 목록 가져오기
  const getMyInsightIds = (): Set<number> => {
    if (typeof window === 'undefined') return new Set();
    
    const saved = localStorage.getItem('dori_my_insights');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  };

  // 본인이 작성한 인사이트 글 ID 목록에 추가
  const addMyInsightId = (id: number) => {
    if (typeof window === 'undefined') return;
    
    const myIds = getMyInsightIds();
    myIds.add(id);
    localStorage.setItem('dori_my_insights', JSON.stringify(Array.from(myIds)));
  };

  // 본인이 작성한 인사이트 글 ID 목록에서 제거
  const removeMyInsightId = (id: number) => {
    if (typeof window === 'undefined') return;
    
    const myIds = getMyInsightIds();
    myIds.delete(id);
    localStorage.setItem('dori_my_insights', JSON.stringify(Array.from(myIds)));
  };

  // 로컬스토리지에서 사용자가 작성한 인사이트 글 가져오기
  const [userPosts, setUserPosts] = useState<InsightItem[]>([]);
  const [editingPost, setEditingPost] = useState<InsightItem | null>(null);

  useEffect(() => {
    if (!mounted) return;
    
    // 로컬스토리지에서 사용자가 작성한 글 불러오기
    const savedUserPosts = localStorage.getItem("dori_user_insights");
    if (savedUserPosts) {
      try {
        const parsed: InsightItem[] = JSON.parse(savedUserPosts);
        setUserPosts(parsed);
      } catch (e) {
        console.error('Failed to parse user insights:', e);
      }
    }
  }, [mounted]);

  // 작성자 ID 가져오기
  const authorId = mounted ? getAuthorId() : '';
  const myInsightIds = mounted ? getMyInsightIds() : new Set<number>();

  // 본인 글인지 확인
  const isOwner = (item: InsightItem): boolean => {
    if (!mounted) return false;
    // authorId가 있으면 authorId로 확인, 없으면 myInsightIds로 확인 (기존 데이터 호환성)
    if (item.authorId) {
      return item.authorId === authorId;
    }
    return myInsightIds.has(item.id);
  };

  // 1. 받아온 데이터와 사용자가 작성한 글 합치기
  const basePosts = (initialPosts && Array.isArray(initialPosts) && initialPosts.length > 0) 
    ? initialPosts 
    : FALLBACK_POSTS;
  
  const postsToDisplay = [...userPosts, ...basePosts];

  const isDark = mounted && theme === 'dark';

  // 카테고리 목록
  const categories = [
    { id: "All", label: "전체" },
    { id: "트렌드", label: "트렌드" },
    { id: "큐레이션", label: "큐레이션" },
    { id: "가이드", label: "가이드" },
    { id: "리포트", label: "리포트" },
    { id: "분석", label: "분석" },
  ];

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setFilters({ ...filters, category });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 좌측 사이드바 네비게이션 */}
      <aside 
        className="fixed left-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <nav className="ml-8">
          <div 
            className="flex flex-col gap-3 p-4 rounded-2xl backdrop-blur-xl transition-all duration-500"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            }}
          >
            {categories.map((item) => (
              <a
                key={item.id}
                href="#"
                className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: activeCategory === item.id 
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick(item.id);
                }}
              >
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    activeCategory === item.id ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: activeCategory === item.id 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                  }}
                />
                <span 
                  className="text-xs font-medium transition-all duration-300"
                  style={{
                    color: activeCategory === item.id 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    transform: activeCategory === item.id ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </nav>
      </aside>

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
      <section className="relative pt-20 pb-12 px-6 lg:pl-12 text-center overflow-hidden">
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
              className="gradient-flow h-full rounded-full"
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
      
      {/* 메인 콘텐츠 */}
      <section 
        id="list"
        className="container max-w-7xl mx-auto px-4 md:px-6 lg:pl-12 pb-24 border-b border-dashed relative" 
        style={{ 
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <h2 
          className="text-2xl font-bold mb-8 flex items-center gap-2" 
          style={{ 
            color: isDark ? '#ffffff' : '#1d1d1f',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          🧠 인사이트 목록
        </h2>
        
        {/* 👇 리스트에 데이터 전달 */}
        <InsightList 
          filters={filters} 
          setFilters={setFilters} 
          posts={postsToDisplay}
          isOwner={isOwner}
          onEdit={(item) => {
            setEditingPost(item);
            // 폼으로 스크롤 (나중에 폼 추가 시)
            setTimeout(() => {
              const formElement = document.querySelector('[data-insight-form]');
              if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }}
          onDelete={(id) => {
            const updated = userPosts.filter(post => post.id !== id);
            setUserPosts(updated);
            localStorage.setItem("dori_user_insights", JSON.stringify(updated));
            removeMyInsightId(id);
          }}
        />
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