"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { getAnalyticsSummary, getDailyAnalytics, getTodayStr, type DailyAnalytics } from "@/lib/analytics";

// ─── 관리자 이메일 (단 1명만) ─────────────────────────────────────
const ADMIN_EMAIL = "lhaa0130@gmail.com";

// ─── 타입 정의 ────────────────────────────────────────────────────
interface VisitorInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  timestamp: string;
}

interface UserData {
  email: string;
  name: string;
  cottonCandy?: number;
  tier?: number;
  level?: number;
  doriExp?: number;
  createdAt?: string;
  isPremium?: boolean;
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorEmail: string;
  createdAt: string;
  likes: number;
  category: string;
}

// ─── 탭 타입 ─────────────────────────────────────────────────────
type AdminTab = "dashboard" | "visitors" | "users" | "community" | "content" | "premium";

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
export default function AdminPage() {
  const { session, status } = useAuth();
  const user = session?.user || null;
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // 방문자 데이터 (Firestore 전역 집계)
  const [todayUV, setTodayUV] = useState(0);
  const [todayPV, setTodayPV] = useState(0);
  const [totalUV, setTotalUV] = useState(0);
  const [totalPV, setTotalPV] = useState(0);
  const [daily, setDaily] = useState<DailyAnalytics[]>([]);
  const [analyticsReady, setAnalyticsReady] = useState(false);

  // 사용자 데이터
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // 커뮤니티 포스트
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  // 알림
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // 프리미엄 설정
  const [premiumUsers, setPremiumUsers] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  // ── 관리자 체크 ──
  useEffect(() => {
    if (!mounted) return;
    if (status === "loading") return;
    if (status === "unauthenticated" || !user) {
      router.push("/login");
      return;
    }
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      router.push("/");
      return;
    }
  }, [mounted, status, user, router]);

  // ── 데이터 로드 (회원=Firestore, 방문자/커뮤니티=localStorage) ──
  const loadData = useCallback(async () => {
    if (typeof window === "undefined") return;

    // 방문자 통계 (Firestore 전역 집계)
    try {
      const [summary, dailyArr] = await Promise.all([
        getAnalyticsSummary(),
        getDailyAnalytics(30),
      ]);
      const today = getTodayStr();
      const todayRow = dailyArr.find((d) => d.date === today);
      setTotalUV(summary.totalUV);
      setTotalPV(summary.totalPV);
      setTodayUV(todayRow?.uv || 0);
      setTodayPV(todayRow?.pv || 0);
      setDaily(dailyArr);
      setAnalyticsReady(true);
    } catch (e) {
      console.warn("[admin] 방문자 통계 로드 실패:", e);
    }

    // 사용자 목록: Firestore users 컬렉션
    try {
      const db = getFirebaseFirestore();
      const snap = await getDocs(collection(db, "users"));
      const userList: UserData[] = [];
      const premiumList: string[] = [];
      snap.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        const email = (data.email as string) || d.id;
        userList.push({ email, ...data } as UserData);
        if (data.isPremium) premiumList.push(email);
      });
      userList.sort((a: any, b: any) => {
        const ta = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
        const tb = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
        return tb - ta;
      });
      setUsers(userList);
      setPremiumUsers(premiumList);
    } catch (e) {
      console.warn("[admin] Firestore 회원 로드 실패:", e);
    }

    // 커뮤니티 포스트 스캔
    const posts: CommunityPost[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("dori_community_post_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          posts.push(data);
        } catch {}
      }
    }
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCommunityPosts(posts);
  }, []);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  // ── 알림 표시 ──
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ── 프리미엄 토글 ──
  const togglePremium = (email: string) => {
    const key = `dori_profile_${email}`;
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      data.isPremium = !data.isPremium;
      localStorage.setItem(key, JSON.stringify(data));
      loadData();
      showToast("success", `${email} 프리미엄 상태가 변경되었습니다.`);
    } catch {
      showToast("error", "변경 실패");
    }
  };

  // ── 솜사탕 지급 ──
  const giveCandy = (email: string, amount: number) => {
    const key = `dori_profile_${email}`;
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      data.cottonCandy = (data.cottonCandy || 0) + amount;
      localStorage.setItem(key, JSON.stringify(data));
      loadData();
      showToast("success", `${email}에게 솜사탕 ${amount}개 지급 완료`);
    } catch {
      showToast("error", "지급 실패");
    }
  };

  // ── 사용자 삭제 ──
  const deleteUser = (email: string) => {
    if (!confirm(`${email} 사용자의 모든 데이터를 삭제하시겠습니까?`)) return;
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(email)) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => localStorage.removeItem(k));
    loadData();
    setSelectedUser(null);
    showToast("success", `${email} 삭제 완료`);
  };

  // ── 커뮤니티 포스트 삭제 ──
  const deletePost = (postId: string) => {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;
    localStorage.removeItem(`dori_community_post_${postId}`);
    loadData();
    showToast("success", "게시글 삭제 완료");
  };


  // ── 로딩 / 권한 없음 ──
  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-xl animate-pulse">로딩 중...</div>
      </div>
    );
  }

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-foreground text-2xl font-bold mb-2">접근 권한 없음</h1>
          <p className="text-neutral-500 dark:text-neutral-400">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  // ── 최근 14일 방문자 차트 데이터 (Firestore daily 기반) ──
  const dailyMap: Record<string, DailyAnalytics> = {};
  daily.forEach((d) => { dailyMap[d.date] = d; });
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const chartMax = Math.max(...last14Days.map((d) => dailyMap[d]?.uv || 0), 1);

  // ── 탭 메뉴 ──
  const tabs: { id: AdminTab; label: string; emoji: string }[] = [
    { id: "dashboard", label: "대시보드", emoji: "📊" },
    { id: "visitors",  label: "방문자",   emoji: "👥" },
    { id: "users",     label: "회원관리", emoji: "👤" },
    { id: "community", label: "게시판",   emoji: "💬" },
    { id: "premium",   label: "프리미엄", emoji: "💎" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* 토스트 알림 */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-xl shadow-lg font-medium text-white transition-all ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            🛡️
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              관리자 패널
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">DORI-AI Admin · {user.email}</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground rounded-lg text-sm font-medium transition"
            >
              🔄 새로고침
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-medium transition text-sm ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* ── 대시보드 탭 ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "오늘 방문자", value: todayUV, emoji: "📅", color: "from-blue-500 to-cyan-500" },
                { label: "총 방문자", value: totalUV, emoji: "🌍", color: "from-purple-500 to-pink-500" },
                { label: "총 회원수", value: users.length, emoji: "👤", color: "from-green-500 to-emerald-500" },
                { label: "게시글 수", value: communityPosts.length, emoji: "📝", color: "from-orange-500 to-red-500" },
              ].map((card) => (
                <div key={card.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`} />
                  <div className="text-3xl mb-2">{card.emoji}</div>
                  <div className={`text-3xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                    {card.value.toLocaleString()}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* 최근 14일 방문자(UV) 추이 */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-foreground">
                📈 최근 14일 방문자(순방문) 추이
              </h2>
              <div className="flex items-end gap-1.5 h-40">
                {last14Days.map((date) => {
                  const count = dailyMap[date]?.uv || 0;
                  const heightPct = Math.max((count / chartMax) * 100, 2);
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">{count || ""}</div>
                      <div
                        className="w-full bg-gradient-to-t from-[#F9954E] to-[#FBAA60] rounded-t-md transition-all group-hover:opacity-80"
                        style={{ height: `${heightPct}%` }}
                        title={`${date} · ${count}명`}
                      />
                      <div className="text-[9px] text-neutral-400 dark:text-neutral-500">{date.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
              {!analyticsReady && (
                <p className="text-xs text-neutral-400 mt-3">불러오는 중…</p>
              )}
              {analyticsReady && totalUV === 0 && (
                <p className="text-xs text-amber-500 mt-3 leading-relaxed">
                  ⚠️ 집계가 0이면 Firestore 보안 규칙에 analytics 쓰기 허용이 필요해요. (firestore.analytics.rules.txt 참고)
                </p>
              )}
            </div>

            {/* 최근 가입 회원 */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 text-foreground">🆕 최근 회원</h2>
              {users.length === 0 ? (
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">회원 데이터 없음</p>
              ) : (
                <div className="space-y-2">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.email} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div>
                        <span className="font-medium text-foreground">{u.name || "이름 없음"}</span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-sm ml-2">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.isPremium && <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">💎 프리미엄</span>}
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">🍭 {u.cottonCandy || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 방문자 탭 ── */}
        {activeTab === "visitors" && (
          <div className="space-y-6">
            {/* 핵심 지표 4개 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "오늘 순방문(UV)", value: todayUV, sub: "오늘 다녀간 사람", color: "text-blue-500 dark:text-blue-400" },
                { label: "오늘 조회(PV)", value: todayPV, sub: "오늘 페이지 열람", color: "text-cyan-500 dark:text-cyan-400" },
                { label: "총 순방문(UV)", value: totalUV, sub: "전체 누적 방문자", color: "text-[#F9954E]" },
                { label: "총 조회(PV)", value: totalPV, sub: "전체 누적 조회수", color: "text-purple-500 dark:text-purple-400" },
              ].map((c) => (
                <div key={c.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
                  <div className="text-neutral-500 dark:text-neutral-400 text-[13px] mb-1">{c.label}</div>
                  <div className={`text-3xl font-black ${c.color}`}>{c.value.toLocaleString()}</div>
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">{c.sub}</div>
                </div>
              ))}
            </div>

            {/* 안내 */}
            <div className="bg-orange-50 dark:bg-[#F9954E]/5 border border-orange-100 dark:border-[#F9954E]/20 rounded-2xl p-5 text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <p className="font-bold text-neutral-900 dark:text-white mb-1">📊 전역 집계로 업그레이드됨</p>
              <p>이제 <b>모든 방문자</b>가 Firestore에 누적됩니다. (UV=브라우저당 하루 1회, PV=세션당 1회)</p>
              {analyticsReady && totalUV === 0 && (
                <p className="text-amber-600 dark:text-amber-400 mt-2">⚠️ 0으로만 보이면 Firestore 보안 규칙에 <code>analytics</code> 쓰기 허용이 필요합니다. 저장소의 <code>firestore.analytics.rules.txt</code>를 콘솔에 추가·게시하세요.</p>
              )}
            </div>

            {/* 외부 분석(정확한 실측) 바로가기 */}
            <div className="grid grid-cols-2 gap-4">
              <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer"
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:border-[#F9954E]/40 transition-colors">
                <div className="text-2xl mb-2">📈</div>
                <div className="font-bold text-foreground text-sm">Google Analytics</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">실시간·기기·유입 등 정밀 지표 →</div>
              </a>
              <a href="https://clarity.microsoft.com/projects/view/va2qmv3mwz/dashboard" target="_blank" rel="noopener noreferrer"
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:border-[#F9954E]/40 transition-colors">
                <div className="text-2xl mb-2">🔥</div>
                <div className="font-bold text-foreground text-sm">Microsoft Clarity</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">히트맵·세션 녹화 →</div>
              </a>
            </div>

            {/* 일별 기록 (UV/PV) */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 text-foreground">📅 일별 방문 기록 (최근 30일)</h2>
              {daily.length === 0 ? (
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">{analyticsReady ? "아직 기록이 없어요." : "불러오는 중…"}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                        <th className="text-left pb-3 font-semibold">날짜</th>
                        <th className="text-right pb-3 font-semibold">순방문(UV)</th>
                        <th className="text-right pb-3 font-semibold">조회(PV)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...daily].reverse().map((d) => (
                        <tr key={d.date} className="border-b border-neutral-100/80 dark:border-neutral-800/50">
                          <td className="py-2 text-neutral-700 dark:text-neutral-300">{d.date}</td>
                          <td className="py-2 text-right font-bold text-[#F9954E]">{d.uv.toLocaleString()}</td>
                          <td className="py-2 text-right text-neutral-500 dark:text-neutral-400">{d.pv.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 회원관리 탭 ── */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 회원 목록 */}
            <div className="md:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
              <h2 className="font-bold mb-4 text-foreground">👤 회원 목록 ({users.length}명)</h2>
              {users.length === 0 ? (
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">회원 없음</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => setSelectedUser(u)}
                      className={`w-full text-left p-3 rounded-xl transition ${
                        selectedUser?.email === u.email
                          ? "bg-orange-500/20 border border-orange-500/50"
                          : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <div className="font-medium text-sm truncate text-foreground">{u.name || "이름 없음"}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{u.email}</div>
                      <div className="flex gap-1 mt-1">
                        {u.isPremium && <span className="text-xs text-yellow-600 dark:text-yellow-400">💎</span>}
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">Lv.{u.level || 1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 회원 상세 */}
            <div className="md:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
              {!selectedUser ? (
                <div className="h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                  <div className="text-center">
                    <div className="text-5xl mb-3">👆</div>
                    <p>왼쪽에서 회원을 선택하세요</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedUser.name || "이름 없음"}</h2>
                      <p className="text-neutral-500 dark:text-neutral-400 text-sm">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => deleteUser(selectedUser.email)}
                      className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg transition"
                    >
                      🗑️ 삭제
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "솜사탕", value: `🍭 ${selectedUser.cottonCandy || 0}` },
                      { label: "레벨", value: `⭐ Lv.${selectedUser.level || 1}` },
                      { label: "경험치", value: `✨ ${selectedUser.doriExp || 0}` },
                    ].map((item) => (
                      <div key={item.label} className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 text-center">
                        <div className="font-bold text-foreground">{item.value}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 프리미엄 토글 */}
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-foreground">💎 프리미엄 (유료 → 무료 전환)</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {selectedUser.isPremium ? "현재 프리미엄 적용 중" : "현재 일반 회원"}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        togglePremium(selectedUser.email);
                        setSelectedUser({ ...selectedUser, isPremium: !selectedUser.isPremium });
                      }}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        selectedUser.isPremium
                          ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/50 hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 hover:border-red-500/50"
                          : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-yellow-500/20 hover:text-yellow-600 dark:hover:text-yellow-400"
                      }`}
                    >
                      {selectedUser.isPremium ? "해제" : "활성화"}
                    </button>
                  </div>

                  {/* 솜사탕 지급 */}
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4">
                    <div className="font-medium mb-3 text-foreground">🍭 솜사탕 지급</div>
                    <div className="flex gap-2 flex-wrap">
                      {[10, 50, 100, 500, 1000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            giveCandy(selectedUser.email, amount);
                            setSelectedUser({ ...selectedUser, cottonCandy: (selectedUser.cottonCandy || 0) + amount });
                          }}
                          className="px-3 py-1.5 bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-lg text-sm hover:bg-pink-500/30 transition font-medium"
                        >
                          +{amount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 게시판 탭 ── */}
        {activeTab === "community" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-foreground">💬 커뮤니티 게시글 ({communityPosts.length}개)</h2>
            {communityPosts.length === 0 ? (
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">게시글 없음</p>
            ) : (
              <div className="space-y-3">
                {communityPosts.map((post) => (
                  <div key={post.id} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-foreground">{post.title}</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 truncate">{post.content}</div>
                      <div className="flex gap-3 mt-2 text-xs text-neutral-400 dark:text-neutral-500">
                        <span>✍️ {post.author || post.authorEmail}</span>
                        <span>❤️ {post.likes || 0}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm flex-shrink-0 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600 px-3 py-1.5 rounded-lg transition"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 프리미엄 관리 탭 ── */}
        {activeTab === "premium" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-2 text-foreground">💎 프리미엄 관리</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
                프리미엄으로 설정된 회원은 모든 유료 기능을 무료로 이용할 수 있습니다.
              </p>

              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="font-medium text-green-600 dark:text-green-400">✅ 현재 무료 이용 회원</div>
                {premiumUsers.length === 0 ? (
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">없음</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {premiumUsers.map((email) => (
                      <li key={email} className="flex justify-between items-center">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{email}</span>
                        <button
                          onClick={() => togglePremium(email)}
                          className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                        >
                          해제
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="font-medium mb-3 text-foreground">일반 회원에게 프리미엄 부여</div>
                <div className="space-y-2">
                  {users.filter((u) => !u.isPremium).map((u) => (
                    <div key={u.email} className="flex justify-between items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3">
                      <div>
                        <span className="font-medium text-sm text-foreground">{u.name || "이름 없음"}</span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-xs ml-2">{u.email}</span>
                      </div>
                      <button
                        onClick={() => togglePremium(u.email)}
                        className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30 px-3 py-1.5 rounded-lg transition font-medium"
                      >
                        💎 부여
                      </button>
                    </div>
                  ))}
                  {users.filter((u) => !u.isPremium).length === 0 && (
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm">모든 회원이 프리미엄입니다</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
