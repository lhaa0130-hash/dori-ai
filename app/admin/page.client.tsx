"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; 
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { TEXTS } from "@/constants/texts";
import AdminStats from "@/components/admin/AdminStats";
import AdminRecentSuggestions, { SuggestionItem } from "@/components/admin/AdminRecentSuggestions";
import AdminSystemNotes from "@/components/admin/AdminSystemNotes";
import AdminVisitorChart from "@/components/admin/AdminVisitorChart";
import AdminVisitorsList from "@/components/admin/AdminVisitorsList";

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
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [visitorStats, setVisitorStats] = useState({ today: 0, weekly: 0, monthly: 0, total: 0 });
  const [communityCount, setCommunityCount] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const MARKET_ITEMS_COUNT = 9;
  const ACADEMY_ITEMS_COUNT = 9;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !session.user?.email) {
      setIsAuthorized(false);
      if (status === "unauthenticated") {
        // 로그인하지 않은 경우 메인으로 리디렉션
        router.push("/");
      }
      return;
    }
    
    const userEmail = session.user.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail) || 
                    (session.user as any)?.isAdmin === true;
    
    setIsAuthorized(isAdmin);
    
    // 디버깅: 콘솔에 이메일 출력
    console.log('Admin check:', { 
      userEmail, 
      isAdmin, 
      ADMIN_EMAILS,
      sessionUser: session.user,
      isAdminFromSession: (session.user as any)?.isAdmin
    });
    
    // 관리자가 아닌 경우 메인으로 리디렉션
    if (!isAdmin) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!mounted) return;
    
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
    } else {
      setSuggestions([]);
    }

    // 커뮤니티 글 카운트
    try {
      const savedPosts = localStorage.getItem("dori_community_posts");
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        const count = Array.isArray(parsed) ? parsed.length : 0;
        setCommunityCount(count);
      } else {
        setCommunityCount(0);
      }
    } catch (e) {
      console.error("Error parsing community posts:", e);
      setCommunityCount(0);
    }
  }, [mounted]);

  useEffect(() => {
    if (!isAuthorized || !mounted) return;

    // 방문자 통계 계산 - 즉시 실행
    const updateVisitorStats = () => {
      try {
        const now = new Date();
        const todayKey = now.toISOString().split("T")[0]; // YYYY-MM-DD
        
        // localStorage에서 데이터 가져오기
        const history = JSON.parse(localStorage.getItem("dori_visitor_history") || "{}");
        const storedTotal = parseInt(localStorage.getItem("dori_total_visitors") || "0", 10);
        const storedDaily = parseInt(localStorage.getItem("dori_daily_visitors") || "0", 10);
        
        // 오늘 방문자 수
        const todayFromHistory = history[todayKey] || 0;
        const today = Math.max(todayFromHistory, storedDaily, 0);
        
        // 주간 방문자 수 (최근 7일)
        let weekly = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = d.toISOString().split("T")[0];
          weekly += history[key] || 0;
        }
        weekly = Math.max(weekly, today, 0);
        
        // 월간 방문자 수 (이번 달)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let monthly = 0;
        for (const [dateStr, count] of Object.entries(history)) {
          if (dateStr && typeof count === 'number') {
            try {
              const [year, month] = dateStr.split('-').map(Number);
              if (year === now.getFullYear() && month === now.getMonth() + 1) {
                monthly += count;
              }
            } catch (e) {
              // 무시
            }
          }
        }
        monthly = Math.max(monthly, weekly, 0);
        
        // 전체 방문자 수
        let total = 0;
        for (const count of Object.values(history)) {
          if (typeof count === 'number') {
            total += count;
          }
        }
        total = Math.max(total, storedTotal, monthly, 0);
        
        console.log('방문자 통계:', { today, weekly, monthly, total, history, storedDaily, storedTotal });
        
        setVisitorStats({ 
          today, 
          weekly, 
          monthly, 
          total 
        });
      } catch (error) {
        console.error('방문자 통계 계산 오류:', error);
        setVisitorStats({ today: 0, weekly: 0, monthly: 0, total: 0 });
      }
    };
    
    // 즉시 실행
    updateVisitorStats();
    
    // 주기적으로 업데이트 (3초마다)
    const intervalId = setInterval(updateVisitorStats, 3000);
    
    return () => clearInterval(intervalId);
  }, [isAuthorized, mounted]);

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
        <section className="relative pt-20 pb-8 sm:pb-12 px-4 sm:px-6 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight leading-tight transition-all duration-1000 px-2"
              style={{ 
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              {t.heroTitle.ko}
            </h1>
            
            {/* 그라데이션 바 */}
            <div 
              className="w-full max-w-2xl mx-auto h-1 sm:h-1.5 mb-4 sm:mb-6 rounded-full overflow-hidden"
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
              className="text-base sm:text-lg md:text-xl opacity-70 max-w-2xl mx-auto break-keep transition-all duration-1000 px-4"
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
        <section className="container max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 relative z-10">
          <AdminStats stats={{ todayVisitors: visitorStats.today, weeklyVisitors: visitorStats.weekly, monthlyVisitors: visitorStats.monthly, totalVisitors: visitorStats.total, community: communityCount, suggestions: suggestions.length, academy: ACADEMY_ITEMS_COUNT, market: MARKET_ITEMS_COUNT }} />
          <div className="mb-6 sm:mb-8"><AdminVisitorChart /></div>
          <div className="mb-6 sm:mb-8"><AdminVisitorsList /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col gap-6">
              <AdminRecentSuggestions suggestions={suggestions.slice(0, 5)} />
            </div>
            <div className="flex flex-col gap-6">
              <AdminSystemNotes />
            </div>
          </div>
        </section>
      </main>

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
    </div>
  );
}