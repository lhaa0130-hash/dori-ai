"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; 
import { useRouter } from "next/navigation";  
import { TEXTS } from "@/constants/texts";
import AdminStats from "@/components/admin/AdminStats";
import AdminRecentCommunity, { CommunityPost } from "@/components/admin/AdminRecentCommunity";
import AdminRecentSuggestions, { SuggestionItem } from "@/components/admin/AdminRecentSuggestions";
import AdminSystemNotes from "@/components/admin/AdminSystemNotes";

// 🔐 [관리자 목록] 여기에 등록된 이메일만 접속 가능합니다.
const ADMIN_EMAILS = [
  "admin@dori.ai", 
  "lhaa0130@gmail.com", // 👈 요청하신 이메일 추가 완료!
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = TEXTS.admin;

  // 상태 관리
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false); // 권한 여부 체크

  const MARKET_ITEMS_COUNT = 9;
  const ACADEMY_ITEMS_COUNT = 9;

  // 1️⃣ 권한 체크 로직 (문지기)
  useEffect(() => {
    if (status === "loading") return; // 로딩 중이면 대기

    // 로그인을 안 했거나, 허용된 이메일이 아니면?
    if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [session, status]);

  // 2️⃣ 데이터 로드 (권한 있는 사람만)
  useEffect(() => {
    if (!isAuthorized) return; // 권한 없으면 데이터도 안 불러옴

    const savedPosts = localStorage.getItem("dori_community_posts");
    if (savedPosts) {
      const parsed = JSON.parse(savedPosts);
      // 최신순 정렬
      parsed.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCommunityPosts(parsed);
    }

    const savedSuggestions = localStorage.getItem("dori_suggestions");
    if (savedSuggestions) {
      const parsed = JSON.parse(savedSuggestions);
      // 최신순 정렬
      parsed.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSuggestions(parsed);
    }
  }, [isAuthorized]);

  // ⏳ 로딩 중일 때 화면
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  // 🚫 권한 없을 때 화면 (접근 차단)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-red-500">접근 권한이 없습니다.</h2>
        <p className="text-gray-500">관리자 계정으로 로그인해주세요.</p>
        <button 
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full font-bold hover:opacity-80"
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  // ✅ 권한 있을 때만 보여주는 실제 대시보드
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

      {/* 2. 대시보드 컨텐츠 */}
      <section className="container max-w-6xl mx-auto px-4 pb-24">
        
        {/* 통계 카드 */}
        <AdminStats 
          stats={{
            community: communityPosts.length,
            suggestions: suggestions.length,
            academy: ACADEMY_ITEMS_COUNT,
            market: MARKET_ITEMS_COUNT
          }} 
        />

        {/* 메인 그리드 레이아웃 (2열) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 왼쪽 컬럼: 최근 커뮤니티 글 */}
          <div className="flex flex-col gap-6">
            <AdminRecentCommunity posts={communityPosts.slice(0, 5)} />
          </div>

          {/* 오른쪽 컬럼: 최근 건의사항 + 시스템 노트 */}
          <div className="flex flex-col gap-6">
            <AdminRecentSuggestions suggestions={suggestions.slice(0, 5)} />
            <AdminSystemNotes />
          </div>

        </div>
        
      </section>

    </main>
  );
}