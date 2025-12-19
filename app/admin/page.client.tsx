"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; 
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { TEXTS } from "@/constants/texts";
import AdminStats from "@/components/admin/AdminStats";
import AdminRecentCommunity, { CommunityPost } from "@/components/admin/AdminRecentCommunity";
import AdminRecentSuggestions, { SuggestionItem } from "@/components/admin/AdminRecentSuggestions";
import AdminSystemNotes from "@/components/admin/AdminSystemNotes";
import AdminVisitorChart from "@/components/admin/AdminVisitorChart";

const ADMIN_EMAILS = [
  "admin@dori.ai", 
  "lhaa0130@gmail.com",
  // 구글 로그인으로 추가된 관리자 이메일을 여기에 추가하세요
];

export default function AdminClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const t = TEXTS.admin;
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [visitorStats, setVisitorStats] = useState({ today: 0, total: 0 });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const MARKET_ITEMS_COUNT = 9;
  const ACADEMY_ITEMS_COUNT = 9;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !session.user?.email) {
      setIsAuthorized(false);
      return;
    }
    
    const userEmail = session.user.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail) || 
                    (session.user as any)?.isAdmin === true;
    
    setIsAuthorized(isAdmin);
    
    // 디버깅: 콘솔에 이메일 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('Admin check:', { userEmail, isAdmin, ADMIN_EMAILS });
    }
  }, [session, status]);

  useEffect(() => {
    if (!isAuthorized) return;
    
    // 커뮤니티 게시글: 두 키 모두 확인 (dori_community_posts와 dori_posts)
    const communityPostsData = localStorage.getItem("dori_community_posts");
    const postsData = localStorage.getItem("dori_posts");
    
    let allPosts: any[] = [];
    
    // dori_community_posts 데이터 처리
    if (communityPostsData) {
      try {
        const parsed = JSON.parse(communityPostsData);
        const converted = parsed.map((p: any) => ({
          id: p.id,
          nickname: p.nickname || p.author || "익명",
          title: p.title,
          content: p.content || "",
          tag: p.tag || "잡담",
          likes: p.likes || 0,
          createdAt: p.createdAt || p.date || new Date().toISOString(),
        }));
        allPosts = [...allPosts, ...converted];
      } catch (e) {
        console.error("Error parsing dori_community_posts:", e);
      }
    }
    
    // dori_posts 데이터 처리 (더 일반적으로 사용되는 키)
    if (postsData) {
      try {
        const parsed = JSON.parse(postsData);
        const converted = parsed.map((p: any) => ({
          id: p.id,
          nickname: p.author || p.nickname || "익명",
          title: p.title,
          content: p.content || "",
          tag: p.tag || "잡담",
          likes: p.likes || p.sparks || 0,
          createdAt: p.createdAt || (p.date ? new Date(p.date).toISOString() : new Date().toISOString()),
        }));
        allPosts = [...allPosts, ...converted];
      } catch (e) {
        console.error("Error parsing dori_posts:", e);
      }
    }
    
    // 중복 제거 (id 기준) 및 정렬
    const uniquePosts = Array.from(
      new Map(allPosts.map(p => [p.id, p])).values()
    ).sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    setCommunityPosts(uniquePosts);
    
    // 제안 데이터
    const savedSuggestions = localStorage.getItem("dori_suggestions");
    if (savedSuggestions) {
      try {
        const parsed = JSON.parse(savedSuggestions);
        setSuggestions(parsed.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.date || 0).getTime();
          const dateB = new Date(b.createdAt || b.date || 0).getTime();
          return dateB - dateA;
        }));
      } catch (e) {
        console.error("Error parsing dori_suggestions:", e);
        setSuggestions([]);
      }
    }

    // 방문자 통계
    const today = parseInt(localStorage.getItem("dori_daily_visitors") || "0", 10);
    const total = parseInt(localStorage.getItem("dori_total_visitors") || "0", 10);
    setVisitorStats({ today, total });
  }, [isAuthorized]);

  const isDark = mounted && theme === 'dark';

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}>
        <div style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}>로딩 중...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
        }}
      >
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold" style={{ color: '#ef4444' }}>접근 권한이 없습니다.</h2>
        <button 
          onClick={() => router.push("/")} 
          className="px-6 py-2 rounded-full font-bold transition-all hover:scale-105"
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#000000',
            color: isDark ? '#ffffff' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
          }}
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
    }}>
      {/* 배경 효과 */}
      {mounted && isDark && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at top, rgba(30, 58, 138, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(88, 28, 135, 0.1) 0%, transparent 50%), #000000'
                : 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), #ffffff',
            }}
          />
        </div>
      )}

      <main className="w-full min-h-screen relative">
        {/* 히어로 섹션 */}
        <section className="relative pt-20 pb-8 px-6 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight leading-tight transition-all duration-1000"
              style={{ 
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              {t.heroTitle.ko}
            </h1>
            <p 
              className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto break-keep transition-all duration-1000"
              style={{ 
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              {t.heroSubtitle.ko}
            </p>
          </div>
        </section>

        {/* 컨텐츠 섹션 */}
        <section className="container max-w-6xl mx-auto px-4 pb-24 relative z-10">
          <AdminStats stats={{ todayVisitors: visitorStats.today, totalVisitors: visitorStats.total, community: communityPosts.length, suggestions: suggestions.length, academy: ACADEMY_ITEMS_COUNT, market: MARKET_ITEMS_COUNT }} />
          <div className="mb-8"><AdminVisitorChart /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6"><AdminRecentCommunity posts={communityPosts.slice(0, 5)} /></div>
            <div className="flex flex-col gap-6"><AdminRecentSuggestions suggestions={suggestions.slice(0, 5)} /><AdminSystemNotes /></div>
          </div>
        </section>
      </main>
    </div>
  );
}