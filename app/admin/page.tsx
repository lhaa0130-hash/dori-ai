"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";

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

  // 방문자 데이터
  const [dailyVisitors, setDailyVisitors] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [visitorHistory, setVisitorHistory] = useState<Record<string, number>>({});
  const [visitorsList, setVisitorsList] = useState<VisitorInfo[]>([]);

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

  // ── localStorage에서 데이터 로드 ──
  const loadData = useCallback(() => {
    if (typeof window === "undefined") return;

    // 방문자 통계
    setDailyVisitors(parseInt(localStorage.getItem("dori_daily_visitors") || "0", 10));
    setTotalVisitors(parseInt(localStorage.getItem("dori_total_visitors") || "0", 10));
    try {
      const hist = JSON.parse(localStorage.getItem("dori_visitor_history") || "{}");
      setVisitorHistory(hist);
    } catch {}
    try {
      const vList = JSON.parse(localStorage.getItem("dori_visitors_list") || "[]");
      setVisitorsList(vList);
    } catch {}

    // 사용자 목록: 모든 dori_profile_ 키 스캔
    const userList: UserData[] = [];
    const premiumList: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("dori_profile_")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          const email = key.replace("dori_profile_", "");
          userList.push({ email, ...data });
          if (data.isPremium) premiumList.push(email);
        } catch {}
      }
    }
    setUsers(userList);
    setPremiumUsers(premiumList);

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
    // 날짜 최신순 정렬
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
      if (key && key.includes(email)) {
        keysToDelete.push(key);
      }
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

  // ── 방문자 통계 초기화 ──
  const resetVisitors = () => {
    if (!confirm("방문자 통계를 초기화하시겠습니까?")) return;
    localStorage.removeItem("dori_daily_visitors");
    localStorage.removeItem("dori_total_visitors");
    localStorage.removeItem("dori_visitor_history");
    localStorage.removeItem("dori_visitors_list");
    localStorage.removeItem("dori_visitor_date");
    loadData();
    showToast("success", "방문자 통계 초기화 완료");
  };

  // ── 로딩 / 권한 없음 ──
  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl animate-pulse">로딩 중...</div>
      </div>
    );
  }

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-white text-2xl font-bold mb-2">접근 권한 없음</h1>
          <p className="text-gray-400">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  // ── 최근 7일 방문자 차트 데이터 ──
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const chartMax = Math.max(...last7Days.map((d) => visitorHistory[d] || 0), 1);

  // ── 탭 메뉴 ──
  const tabs: { id: AdminTab; label: string; emoji: string }[] = [
    { id: "dashboard", label: "대시보드", emoji: "📊" },
    { id: "visitors",  label: "방문자",   emoji: "👥" },
    { id: "users",     label: "회원관리", emoji: "👤" },
    { id: "community", label: "게시판",   emoji: "💬" },
    { id: "premium",   label: "프리미엄", emoji: "💎" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />

      {/* 토스트 알림 */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-xl shadow-lg font-medium transition-all ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            🛡️
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              관리자 패널
            </h1>
            <p className="text-gray-400 text-sm">DORI-AI Admin · {user.email}</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition"
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
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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
                { label: "오늘 방문자", value: dailyVisitors, emoji: "📅", color: "from-blue-500 to-cyan-500" },
                { label: "총 방문자", value: totalVisitors, emoji: "🌍", color: "from-purple-500 to-pink-500" },
                { label: "총 회원수", value: users.length, emoji: "👤", color: "from-green-500 to-emerald-500" },
                { label: "게시글 수", value: communityPosts.length, emoji: "📝", color: "from-orange-500 to-red-500" },
              ].map((card) => (
                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`} />
                  <div className="text-3xl mb-2">{card.emoji}</div>
                  <div className={`text-3xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                    {card.value.toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* 최근 7일 방문자 차트 */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                📈 최근 7일 방문자 추이
              </h2>
              <div className="flex items-end gap-3 h-40">
                {last7Days.map((date) => {
                  const count = visitorHistory[date] || 0;
                  const heightPct = Math.max((count / chartMax) * 100, 2);
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs text-gray-400 font-medium">{count}</div>
                      <div
                        className="w-full bg-gradient-to-t from-orange-500 to-red-400 rounded-t-md transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                      <div className="text-xs text-gray-500">{date.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 최근 가입 회원 */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">🆕 최근 회원</h2>
              {users.length === 0 ? (
                <p className="text-gray-500 text-sm">회원 데이터 없음</p>
              ) : (
                <div className="space-y-2">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.email} className="flex items-center justify-between py-2 border-b border-gray-800">
                      <div>
                        <span className="font-medium">{u.name || "이름 없음"}</span>
                        <span className="text-gray-400 text-sm ml-2">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.isPremium && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">💎 프리미엄</span>}
                        <span className="text-xs text-gray-500">🍭 {u.cottonCandy || 0}</span>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="text-gray-400 text-sm mb-1">오늘 방문자</div>
                <div className="text-4xl font-black text-blue-400">{dailyVisitors.toLocaleString()}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="text-gray-400 text-sm mb-1">전체 방문자</div>
                <div className="text-4xl font-black text-purple-400">{totalVisitors.toLocaleString()}</div>
              </div>
            </div>

            {/* 일별 기록 */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">📅 일별 방문 기록</h2>
                <button
                  onClick={resetVisitors}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-3 py-1.5 rounded-lg transition"
                >
                  🗑️ 초기화
                </button>
              </div>
              {Object.keys(visitorHistory).length === 0 ? (
                <p className="text-gray-500 text-sm">기록 없음</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {Object.entries(visitorHistory)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([date, count]) => (
                      <div key={date} className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-300">{date}</span>
                        <span className="font-bold text-blue-400">{count}명</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* 방문자 목록 */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">🌐 방문자 상세 (최근 {visitorsList.length}명)</h2>
              {visitorsList.length === 0 ? (
                <p className="text-gray-500 text-sm">방문자 기록 없음</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-800">
                        <th className="text-left pb-3">IP</th>
                        <th className="text-left pb-3">국가</th>
                        <th className="text-left pb-3">도시</th>
                        <th className="text-left pb-3">시간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...visitorsList].reverse().slice(0, 50).map((v, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-2 font-mono text-xs">{v.ip}</td>
                          <td className="py-2">{v.country}</td>
                          <td className="py-2">{v.city}</td>
                          <td className="py-2 text-gray-500 text-xs">
                            {new Date(v.timestamp).toLocaleString("ko-KR")}
                          </td>
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
            <div className="md:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="font-bold mb-4">👤 회원 목록 ({users.length}명)</h2>
              {users.length === 0 ? (
                <p className="text-gray-500 text-sm">회원 없음</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => setSelectedUser(u)}
                      className={`w-full text-left p-3 rounded-xl transition ${
                        selectedUser?.email === u.email
                          ? "bg-orange-500/20 border border-orange-500/50"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{u.name || "이름 없음"}</div>
                      <div className="text-xs text-gray-400 truncate">{u.email}</div>
                      <div className="flex gap-1 mt-1">
                        {u.isPremium && <span className="text-xs text-yellow-400">💎</span>}
                        <span className="text-xs text-gray-500">Lv.{u.level || 1}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 회원 상세 */}
            <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              {!selectedUser ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-5xl mb-3">👆</div>
                    <p>왼쪽에서 회원을 선택하세요</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{selectedUser.name || "이름 없음"}</h2>
                      <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => deleteUser(selectedUser.email)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-3 py-1.5 rounded-lg transition"
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
                      <div key={item.label} className="bg-gray-800 rounded-xl p-3 text-center">
                        <div className="font-bold">{item.value}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 프리미엄 토글 */}
                  <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">💎 프리미엄 (유료 → 무료 전환)</div>
                      <div className="text-xs text-gray-400 mt-0.5">
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
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                          : "bg-gray-700 text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-400"
                      }`}
                    >
                      {selectedUser.isPremium ? "해제" : "활성화"}
                    </button>
                  </div>

                  {/* 솜사탕 지급 */}
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="font-medium mb-3">🍭 솜사탕 지급</div>
                    <div className="flex gap-2 flex-wrap">
                      {[10, 50, 100, 500, 1000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            giveCandy(selectedUser.email, amount);
                            setSelectedUser({ ...selectedUser, cottonCandy: (selectedUser.cottonCandy || 0) + amount });
                          }}
                          className="px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30 transition font-medium"
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">💬 커뮤니티 게시글 ({communityPosts.length}개)</h2>
            {communityPosts.length === 0 ? (
              <p className="text-gray-500 text-sm">게시글 없음</p>
            ) : (
              <div className="space-y-3">
                {communityPosts.map((post) => (
                  <div key={post.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{post.title}</div>
                      <div className="text-sm text-gray-400 mt-1 truncate">{post.content}</div>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span>✍️ {post.author || post.authorEmail}</span>
                        <span>❤️ {post.likes || 0}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-400 hover:text-red-300 text-sm flex-shrink-0 border border-red-800 hover:border-red-600 px-3 py-1.5 rounded-lg transition"
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
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-2">💎 프리미엄 관리</h2>
              <p className="text-gray-400 text-sm mb-6">
                프리미엄으로 설정된 회원은 모든 유료 기능을 무료로 이용할 수 있습니다.
              </p>

              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="font-medium text-green-400">✅ 현재 무료 이용 회원</div>
                {premiumUsers.length === 0 ? (
                  <p className="text-gray-500 text-sm mt-2">없음</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {premiumUsers.map((email) => (
                      <li key={email} className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">{email}</span>
                        <button
                          onClick={() => {
                            togglePremium(email);
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          해제
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="font-medium mb-3">일반 회원에게 프리미엄 부여</div>
                <div className="space-y-2">
                  {users.filter((u) => !u.isPremium).map((u) => (
                    <div key={u.email} className="flex justify-between items-center bg-gray-800 rounded-xl px-4 py-3">
                      <div>
                        <span className="font-medium text-sm">{u.name || "이름 없음"}</span>
                        <span className="text-gray-400 text-xs ml-2">{u.email}</span>
                      </div>
                      <button
                        onClick={() => togglePremium(u.email)}
                        className="text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-3 py-1.5 rounded-lg transition font-medium"
                      >
                        💎 부여
                      </button>
                    </div>
                  ))}
                  {users.filter((u) => !u.isPremium).length === 0 && (
                    <p className="text-gray-500 text-sm">모든 회원이 프리미엄입니다</p>
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
