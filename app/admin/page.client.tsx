"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; 
import { useRouter } from "next/navigation";  
import { TEXTS } from "@/constants/texts";
import AdminStats from "@/components/admin/AdminStats";
import AdminRecentCommunity, { CommunityPost } from "@/components/admin/AdminRecentCommunity";
import AdminRecentSuggestions, { SuggestionItem } from "@/components/admin/AdminRecentSuggestions";
import AdminSystemNotes from "@/components/admin/AdminSystemNotes";
import AdminVisitorChart from "@/components/admin/AdminVisitorChart";

const ADMIN_EMAILS = [
  "admin@dori.ai", 
  "lhaa0130@gmail.com",
];

export default function AdminClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = TEXTS.admin;
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [visitorStats, setVisitorStats] = useState({ today: 0, total: 0 });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const MARKET_ITEMS_COUNT = 9;
  const ACADEMY_ITEMS_COUNT = 9;

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) setIsAuthorized(false);
    else setIsAuthorized(true);
  }, [session, status]);

  useEffect(() => {
    if (!isAuthorized) return;
    const savedPosts = localStorage.getItem("dori_community_posts");
    if (savedPosts) setCommunityPosts(JSON.parse(savedPosts).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    
    const savedSuggestions = localStorage.getItem("dori_suggestions");
    if (savedSuggestions) setSuggestions(JSON.parse(savedSuggestions).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const today = parseInt(localStorage.getItem("dori_daily_visitors") || "0", 10);
    const total = parseInt(localStorage.getItem("dori_total_visitors") || "0", 10);
    setVisitorStats({ today, total });
  }, [isAuthorized]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  if (!isAuthorized) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4"><div className="text-6xl">🔒</div><h2 className="text-2xl font-bold text-red-500">접근 권한이 없습니다.</h2><button onClick={() => router.push("/")} className="px-6 py-2 bg-black text-white rounded-full font-bold">메인으로 돌아가기</button></div>;

  return (
    <main className="w-full min-h-screen">
      <section className="pt-32 pb-10 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>{t.heroTitle.ko}</h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto break-keep" style={{ color: 'var(--text-main)' }}>{t.heroSubtitle.ko}</p>
      </section>
      <section className="container max-w-6xl mx-auto px-4 pb-24">
        <AdminStats stats={{ todayVisitors: visitorStats.today, totalVisitors: visitorStats.total, community: communityPosts.length, suggestions: suggestions.length, academy: ACADEMY_ITEMS_COUNT, market: MARKET_ITEMS_COUNT }} />
        <div className="mb-6"><AdminVisitorChart /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6"><AdminRecentCommunity posts={communityPosts.slice(0, 5)} /></div>
          <div className="flex flex-col gap-6"><AdminRecentSuggestions suggestions={suggestions.slice(0, 5)} /><AdminSystemNotes /></div>
        </div>
      </section>
    </main>
  );
}