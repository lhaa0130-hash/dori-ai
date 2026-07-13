"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { adminGrantCandy, adminSetPremium } from "@/lib/cottonCandy";
import { getAnalyticsSummary, getDailyAnalytics, getTodayStr, getAdsense, saveAdsense, type DailyAnalytics, type AdsenseData } from "@/lib/analytics";
import { getAnimalReviewStatus, approveAnimal, rejectAnimal, resetAnimal, setRejectReason } from "@/lib/animalReview";
import animalCardsData from "@/data/animal-cards.json";
import type { AnimalCard } from "@/app/animal/page.client";

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
  uid?: string;
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

// GA4 실시간·집계 (dashboardStats/live 문서) — n8n 수집 스크립트가 채움
interface Ga4Stats {
  realtimeUsers: number;
  active?: { dau: number; wau: number; mau: number };
  today: { users: number; pageViews: number };
  last7: { users: number; pageViews: number; sessions: number };
  daily14: { date: string; users: number }[];
  devices: { mobile: number; desktop: number; tablet: number };
  topPages: { title: string; views: number }[];
  topCountries: { country: string; users: number }[];
  channels: { name: string; sessions: number }[];
}
interface AdsenseLive {
  currency: string;
  today: { earnings: number; pageViews: number; clicks: number; impressions: number } | null;
  month: { earnings: number; pageViews: number; clicks: number; impressions: number } | null;
  last7: { earnings: number; pageViews: number; clicks: number; impressions: number } | null;
}

// ─── 탭 타입 ─────────────────────────────────────────────────────
type AdminTab = "dashboard" | "visitors" | "users" | "community" | "content" | "premium" | "animalReview" | "animalTable";
type ReviewFilter = "pending" | "approved" | "rejected" | "all";

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
  const [device, setDevice] = useState({ mobile: 0, tablet: 0, desktop: 0 });

  // 애드센스 수입
  const [adsense, setAdsense] = useState<AdsenseData | null>(null);
  const [adsenseEdit, setAdsenseEdit] = useState(false);
  const [adsenseForm, setAdsenseForm] = useState<AdsenseData>({ today: 0, yesterday: 0, last7: 0, month: 0, balance: 0, lastPayment: "", currency: "US$" });

  // GA4·애드센스 실시간 통계 (dashboardStats/live)
  const [ga4, setGa4] = useState<Ga4Stats | null>(null);
  const [adsenseLive, setAdsenseLive] = useState<AdsenseLive | null>(null);
  const [statsUpdatedAt, setStatsUpdatedAt] = useState<string>("");

  // 사용자 데이터
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // 커뮤니티 포스트
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  // 알림
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // 프리미엄 설정
  const [premiumUsers, setPremiumUsers] = useState<string[]>([]);

  // 동물도감 검수
  const allAnimals = animalCardsData as unknown as AnimalCard[];
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [reasonDraft, setReasonDraft] = useState("");
  const [reasonSyncKey, setReasonSyncKey] = useState("");
  const [reviewLoaded, setReviewLoaded] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("pending");
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<ReviewFilter>("all");
  const [refImages, setRefImages] = useState<Record<string, string>>({}); // 검수용 실제(영문위키) 참조 이미지 {no: url}
  const [imgVer, setImgVer] = useState(0); // 검수 이미지 캐시버스팅(재생성분이 브라우저 캐시에 안 막히게)

  useEffect(() => setMounted(true), []);
  useEffect(() => setImgVer(Date.now()), []); // 페이지 진입 시마다 최신 이미지 강제 로드

  // 검수 페이지용 실제 참조 이미지 로드(정적 JSON, 관리자만) — 생성이미지 옆에 실제 사진을 나란히 비교
  useEffect(() => {
    fetch("/animal-ref-images.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j) setRefImages(j.images || j); })
      .catch(() => {});
  }, []);

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
      setDevice({ mobile: summary.mobile, tablet: summary.tablet, desktop: summary.desktop });
      setAnalyticsReady(true);
    } catch (e) {
      console.warn("[admin] 방문자 통계 로드 실패:", e);
    }

    // 애드센스 수입 (수동 입력 백업값)
    try {
      const ad = await getAdsense();
      setAdsense(ad);
      setAdsenseForm(ad);
    } catch (e) {
      console.warn("[admin] 애드센스 로드 실패:", e);
    }

    // GA4·애드센스 자동 통계 (dashboardStats/live — n8n이 ~5분마다 채움)
    try {
      const db = getFirebaseFirestore();
      const s = await getDoc(doc(db, "dashboardStats", "live"));
      if (s.exists()) {
        const d = s.data() as { ga4?: Ga4Stats; adsense?: AdsenseLive; updatedAt?: string };
        if (d.ga4) setGa4(d.ga4);
        if (d.adsense) setAdsenseLive(d.adsense);
        if (d.updatedAt) setStatsUpdatedAt(d.updatedAt);
      }
    } catch (e) {
      console.warn("[admin] GA4 통계 로드 실패:", e);
    }

    // 동물도감 검수 상태
    try {
      const r = await getAnimalReviewStatus();
      setApproved(new Set(r.approved));
      setRejected(new Set(r.rejected));
      setRejectReasons(r.rejectReasons || {});
      setReviewLoaded(true);
    } catch (e) {
      console.warn("[admin] 동물검수 상태 로드 실패:", e);
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
        userList.push({ email, ...data, uid: d.id } as UserData);
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

  useEffect(() => { setReviewIdx(0); }, [reviewFilter]);

  // ── 알림 표시 ──
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ── 프리미엄 토글 (대상 회원의 Firestore users/{uid}에 반영) ──
  const togglePremium = async (email: string) => {
    const target = users.find((u) => u.email === email);
    if (!target?.uid) { showToast("error", "대상 회원의 UID를 찾을 수 없어요"); return; }
    const next = !target.isPremium;
    const res = await adminSetPremium(target.uid, next);
    if (res.mode === "instant") {
      showToast("success", `${email} 프리미엄 ${next ? "활성화" : "해제"} 완료`);
      setSelectedUser((p) => (p && p.email === email ? { ...p, isPremium: next } : p));
      await loadData();
    } else if (res.mode === "queued") {
      showToast("success", `${email} 프리미엄 ${next ? "활성화" : "해제"} 예약 — 접속 시 반영돼요`);
    } else {
      showToast("error", `변경 실패: ${res.error || ""}`);
    }
  };

  // ── 솜사탕 지급 (대상 회원에게 반영, 규칙 없으면 '지급 예약'으로 자동 폴백) ──
  const giveCandy = async (email: string, amount: number) => {
    const target = users.find((u) => u.email === email);
    if (!target?.uid) { showToast("error", "대상 회원의 UID를 찾을 수 없어요"); return; }
    const res = await adminGrantCandy(target.uid, amount, user?.name || "관리자");
    if (res.mode === "instant") {
      showToast("success", `${email}에게 솜사탕 ${amount.toLocaleString()}개 지급 완료`);
      setSelectedUser((p) => (p && p.email === email ? { ...p, cottonCandy: (p.cottonCandy || 0) + amount } : p));
      await loadData();
    } else if (res.mode === "queued") {
      showToast("success", `솜사탕 ${amount.toLocaleString()}개 지급 예약 — ${email} 님이 접속하면 자동 반영돼요`);
    } else {
      showToast("error", `지급 실패: ${res.error || ""}`);
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

  // ── 애드센스 수입 저장 ──
  const handleSaveAdsense = async () => {
    const ok = await saveAdsense(adsenseForm);
    if (ok) {
      setAdsense({ ...adsenseForm, updatedAt: new Date().toISOString() });
      setAdsenseEdit(false);
      showToast("success", "애드센스 수입 저장 완료");
    } else {
      showToast("error", "저장 실패 (Firestore 규칙 확인)");
    }
  };

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
    { id: "animalReview", label: "동물검수", emoji: "🐾" },
    { id: "animalTable", label: "동물표", emoji: "📋" },
  ];

  const REGION_ORDER = ["아시아", "아프리카", "유럽", "북아메리카", "남아메리카", "오세아니아", "태평양", "대서양", "인도양", "북극해", "남극해"];

  // 수명 태그 — 공개 필터(page.client.tsx의 lifespanOf)와 동일 로직. info "수명" 텍스트의 최댓값으로 버킷 결정
  const lifespanTag = (c: AnimalCard): string[] => {
    const item = (c.info || []).find((i) => i[1] === "수명");
    const nums = item?.[2].match(/\d+/g)?.map(Number) || [];
    if (!nums.length) return [];
    const max = Math.max(...nums);
    if (max <= 1) return ["1년 이하"];
    if (max <= 5) return ["1~5년"];
    if (max <= 20) return ["5~20년"];
    if (max <= 50) return ["20~50년"];
    return ["50년 이상"];
  };

  // 영문 위키백과 검색 링크 — 정확한 학명/영문명이 있으면 해당 문서로 바로 이동, 없으면 검색결과로
  const wikiSearchUrl = (c: AnimalCard) =>
    `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(c.en || c.sci || c.animal_name)}`;

  // ── 동물도감 검수: 필터별 목록·현재 카드 ──
  const reviewList = allAnimals.filter((c) => {
    const no = c.no || "";
    if (reviewFilter === "approved") return approved.has(no);
    if (reviewFilter === "rejected") return rejected.has(no);
    if (reviewFilter === "pending") return !approved.has(no) && !rejected.has(no);
    return true;
  });
  const reviewSafeIdx = Math.min(reviewIdx, Math.max(0, reviewList.length - 1));
  const currentAnimal = reviewList[reviewSafeIdx] as AnimalCard | undefined;
  const currentStatus = currentAnimal
    ? approved.has(currentAnimal.no || "") ? "approved" : rejected.has(currentAnimal.no || "") ? "rejected" : "pending"
    : null;

  // 카드 이동/사유 로드 시 반려 사유 입력칸을 저장된 값으로 동기화.
  // useEffect가 아닌 "렌더 중 setState" 패턴 — 조기 return 뒤라 훅을 쓰면 Rules of Hooks 위반이라서.
  // syncKey = 현재 no + 저장된 사유. 타이핑은 reasonDraft만 바꾸므로 syncKey 불변 → 타이핑 방해 없음. 사유 로드/저장 시엔 syncKey가 바뀌어 반영됨.
  const currentNo = currentAnimal?.no || "";
  const reasonSrc = currentNo ? (rejectReasons[currentNo] || "") : "";
  const wantSyncKey = currentNo + "|" + reasonSrc;
  if (wantSyncKey !== reasonSyncKey) {
    setReasonSyncKey(wantSyncKey);
    setReasonDraft(reasonSrc);
  }

  const reviewGoto = (dir: number) => {
    setReviewIdx((i) => Math.min(Math.max(0, i + dir), Math.max(0, reviewList.length - 1)));
  };
  const decideAnimal = async (no: string, action: "approve" | "reject" | "reset", reason = "") => {
    // 낙관적 갱신 — 목록이 줄어드는 필터(미검수)에서는 idx 그대로 두면 다음 항목이 자연히 그 자리로 옴
    if (action === "approve") {
      setApproved((s) => new Set(s).add(no));
      setRejected((s) => { const n = new Set(s); n.delete(no); return n; });
      setRejectReasons((m) => { const n = { ...m }; delete n[no]; return n; });
      await approveAnimal(no);
    } else if (action === "reject") {
      setRejected((s) => new Set(s).add(no));
      setApproved((s) => { const n = new Set(s); n.delete(no); return n; });
      setRejectReasons((m) => ({ ...m, [no]: reason }));
      await rejectAnimal(no, reason);
    } else {
      setApproved((s) => { const n = new Set(s); n.delete(no); return n; });
      setRejected((s) => { const n = new Set(s); n.delete(no); return n; });
      setRejectReasons((m) => { const n = { ...m }; delete n[no]; return n; });
      await resetAnimal(no);
    }
  };
  const reviewDecide = async (action: "approve" | "reject" | "reset") => {
    if (!currentAnimal?.no || reviewBusy) return;
    setReviewBusy(true);
    await decideAnimal(currentAnimal.no, action, reasonDraft.trim());
    setReviewBusy(false);
  };
  // 반려 상태 유지한 채 사유만 저장(자동화 처리용 메모 갱신)
  const reviewSaveReason = async () => {
    if (!currentAnimal?.no || reviewBusy) return;
    const no = currentAnimal.no;
    const reason = reasonDraft.trim();
    setReviewBusy(true);
    setRejectReasons((m) => ({ ...m, [no]: reason }));
    await setRejectReason(no, reason);
    setReviewBusy(false);
    setToast({ type: "success", msg: "반려 사유 저장됨" });
  };

  // ── 동물표(엑셀뷰): 검색+필터 목록, 각 행 정보 추출 ──
  const tableQ = tableSearch.trim().toLowerCase();
  const tableRows = allAnimals
    .filter((c) => {
      const no = c.no || "";
      if (tableFilter === "approved" && !approved.has(no)) return false;
      if (tableFilter === "rejected" && !rejected.has(no)) return false;
      if (tableFilter === "pending" && (approved.has(no) || rejected.has(no))) return false;
      if (tableQ && !c.animal_name.toLowerCase().includes(tableQ) && !(c.en || "").toLowerCase().includes(tableQ)) return false;
      return true;
    })
    .map((c) => {
      const info = c.info || [];
      const get = (k: string) => info.find((r) => r[1] === k)?.[2] || "";
      const no = c.no || "";
      return {
        no, name: c.animal_name,
        type: c.filters?.taxonomy?.[0] || "—",
        diet: (c.filters?.diet || []).join(", ") || "—",
        lifespan: get("수명") || "—",
        weight: get("몸무게") || "—",
        length: get("몸길이") || "—",
        region: (c.filters?.region || []) as string[],
        wikiUrl: wikiSearchUrl(c),
        status: approved.has(no) ? "approved" as const : rejected.has(no) ? "rejected" as const : "pending" as const,
      };
    });

  return (
    <div className="min-h-screen bg-white dark:bg-black text-foreground">
      <Header />

      {/* 토스트 알림 */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl shadow-xl font-bold text-[13px] text-white ${
            toast.type === "success" ? "bg-[#F9954E]" : "bg-neutral-900"
          }`}
        >
          {toast.type === "success" ? "✅ " : "⚠️ "}{toast.msg}
        </div>
      )}

      <div className="w-full px-6 xl:px-[260px] pt-24 pb-16">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-xl flex-shrink-0">
            🛡️
          </div>
          <div className="min-w-0">
            <h1 className="text-[24px] font-extrabold text-neutral-950 dark:text-white leading-tight tracking-tight">관리자 패널</h1>
            <p className="text-neutral-400 dark:text-neutral-500 text-[12px] truncate">{user.email}</p>
          </div>
          <button
            onClick={loadData}
            className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-300 text-[13px] font-bold hover:border-[#F9954E]/40 hover:text-[#F9954E] transition-colors flex-shrink-0"
          >
            🔄 새로고침
          </button>
        </div>

        {/* 탭 네비게이션 — 가로 스크롤 pill */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide mb-7">
          <div className="flex gap-2 w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap border transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#F9954E] border-[#F9954E] text-white"
                    : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400 hover:border-[#F9954E]/40"
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 대시보드 탭 ── */}
        {activeTab === "dashboard" && (() => {
          const totalAnimals = allAnimals.length;
          const apprN = approved.size, rejN = rejected.size, pendN = Math.max(0, totalAnimals - apprN - rejN);
          const pctOf = (n: number) => (totalAnimals ? (n / totalAnimals) * 100 : 0);
          const gaOn = !!ga4;
          const todayUsers = ga4 ? ga4.today.users : todayUV;
          const act = ga4?.active || (ga4 ? { dau: ga4.today.users, wau: ga4.last7.users, mau: ga4.last7.users } : null);
          const dev = ga4 ? ga4.devices : device;
          const devTotal = dev.mobile + dev.tablet + dev.desktop;
          const chart: { date: string; users: number }[] = ga4
            ? ga4.daily14
            : last14Days.map((date) => ({ date, users: dailyMap[date]?.uv || 0 }));
          const chartMax = Math.max(1, ...chart.map((c) => c.users));
          const minsAgo = statsUpdatedAt ? Math.max(0, Math.round((Date.now() - new Date(statsUpdatedAt).getTime()) / 60000)) : null;
          const agoLabel = minsAgo == null ? "" : minsAgo < 1 ? "방금" : minsAgo < 60 ? `${minsAgo}분 전` : `${Math.round(minsAgo / 60)}시간 전`;
          const ad = adsense || { today: 0, yesterday: 0, last7: 0, month: 0, balance: 0, lastPayment: "", currency: "US$" };
          const curSym = (c?: string) => (c === "USD" || c === "US$" ? "$" : c === "KRW" ? "₩" : (c || "$") + " ");
          const adCur = curSym(adsenseLive?.currency || ad.currency);
          const money = (n: number) => `${adCur}${(n || 0).toFixed(2)}`;
          const chanKo: Record<string, string> = { "Direct": "직접 방문", "Organic Search": "검색 유입", "Referral": "외부 링크", "Organic Social": "소셜", "Unassigned": "미분류", "Organic Video": "동영상", "Email": "이메일" };
          const flag: Record<string, string> = { "United States": "🇺🇸", "South Korea": "🇰🇷", "Singapore": "🇸🇬", "Nigeria": "🇳🇬", "Poland": "🇵🇱", "Ireland": "🇮🇪", "Japan": "🇯🇵", "China": "🇨🇳", "India": "🇮🇳", "Germany": "🇩🇪", "United Kingdom": "🇬🇧", "Canada": "🇨🇦", "France": "🇫🇷", "Vietnam": "🇻🇳", "Indonesia": "🇮🇩", "Brazil": "🇧🇷" };
          return (
            <div className="space-y-5">

              {/* 1) 동물도감 검수 현황 — 핵심 작업 */}
              <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <h2 className="text-[15px] font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">🐾 동물도감 검수 현황</h2>
                  <button onClick={() => setActiveTab("animalReview")} className="rounded-full bg-[#F9954E] text-white text-[12px] font-bold px-3.5 py-1.5 hover:brightness-105 transition">검수하러 가기 →</button>
                </div>
                <div className="h-3 w-full rounded-full overflow-hidden bg-neutral-100 dark:bg-zinc-800 flex">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pctOf(apprN)}%` }} title={`승인 ${apprN}`} />
                  <div className="bg-[#F9954E] h-full transition-all" style={{ width: `${pctOf(pendN)}%` }} title={`미검수 ${pendN}`} />
                  <div className="bg-red-400 h-full transition-all" style={{ width: `${pctOf(rejN)}%` }} title={`반려 ${rejN}`} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "승인 · 공개중", n: apprN, c: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
                    { label: "미검수", n: pendN, c: "text-[#E8832E]", dot: "bg-[#F9954E]" },
                    { label: "반려", n: rejN, c: "text-red-500", dot: "bg-red-400" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-neutral-50 dark:bg-zinc-900/60 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400"><span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label}</div>
                      <div className={`text-2xl font-black mt-1 leading-none ${s.c}`}>{s.n.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-neutral-400 dark:text-neutral-500 break-keep">
                  전체 {totalAnimals.toLocaleString()}종 중 <b className="text-emerald-600 dark:text-emerald-400">{Math.round(pctOf(apprN))}%</b> 공개 완료 — 승인된 동물만 공개 도감에 노출됩니다.
                </p>
              </div>

              {/* 2) 사용자 현황 — 실시간 + DAU/WAU/MAU */}
              <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                  <h2 className="text-[15px] font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">👥 사용자 현황</h2>
                  {gaOn ? (
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">지금 {ga4!.realtimeUsers.toLocaleString()}명 접속중</span>
                      {agoLabel && <span className="text-neutral-400 dark:text-neutral-600">· {agoLabel} 갱신</span>}
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-400">불러오는 중…</span>
                  )}
                </div>
                {act ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "오늘", sub: "DAU · 일간 활성", n: act.dau, accent: "text-sky-600 dark:text-sky-400", bar: "bg-sky-500", bg: "from-sky-50 dark:from-sky-950/30" },
                        { label: "이번 주", sub: "WAU · 최근 7일", n: act.wau, accent: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500", bg: "from-violet-50 dark:from-violet-950/30" },
                        { label: "이번 달", sub: "MAU · 최근 30일", n: act.mau, accent: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", bg: "from-emerald-50 dark:from-emerald-950/30" },
                      ].map((m) => (
                        <div key={m.label} className={`rounded-xl bg-gradient-to-br ${m.bg} to-white dark:to-zinc-950 border border-neutral-100 dark:border-zinc-900 p-4`}>
                          <div className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${m.bar}`} /><span className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300">{m.label}</span></div>
                          <div className={`text-[30px] font-black mt-1.5 leading-none ${m.accent}`}>{m.n.toLocaleString()}</div>
                          <div className="text-[10.5px] text-neutral-400 dark:text-neutral-500 mt-1.5">{m.sub}</div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11.5px] text-neutral-400 dark:text-neutral-500 break-keep">DAU·WAU·MAU = 중복 제외 <b>순수 방문자 수</b> · Google Analytics 실시간 자동집계</p>
                  </>
                ) : (
                  <p className="text-[13px] text-neutral-400 py-3">활성 사용자 데이터를 불러오는 중이에요.</p>
                )}
              </div>

              {/* 3) 사이트 총계 지표 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { emoji: "👤", label: "총 회원", value: users.length },
                  { emoji: "💎", label: "프리미엄", value: premiumUsers.length },
                  { emoji: "💬", label: "게시글", value: communityPosts.length },
                  { emoji: "🐾", label: "총 동물", value: totalAnimals },
                ].map((c) => (
                  <div key={c.label} className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-4">
                    <div className="text-lg mb-1.5">{c.emoji}</div>
                    <div className="text-[22px] font-black text-neutral-900 dark:text-white leading-none">{c.value.toLocaleString()}</div>
                    <div className="text-neutral-400 dark:text-neutral-500 text-[11.5px] mt-1.5">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* 4) 방문자 추이 */}
              <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-5">
                  <h2 className="text-[15px] font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">📈 최근 14일 방문자 {gaOn && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">GA4</span>}</h2>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="text-neutral-500 dark:text-neutral-400">오늘 <b className="text-[#F9954E]">{todayUsers.toLocaleString()}</b>명</span>
                    <span className="text-neutral-500 dark:text-neutral-400">7일 조회 <b className="text-neutral-700 dark:text-neutral-200">{(ga4 ? ga4.last7.pageViews : totalPV).toLocaleString()}</b></span>
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-40">
                  {chart.map((row) => {
                    const heightPct = Math.max((row.users / chartMax) * 100, 3);
                    return (
                      <div key={row.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 opacity-0 group-hover:opacity-100 transition">{row.users}</div>
                        <div className="w-full bg-gradient-to-t from-[#F9954E] to-[#FBAA60] rounded-t-md group-hover:brightness-110 transition-all" style={{ height: `${heightPct}%` }} title={`${row.date} · ${row.users}명`} />
                        <div className="text-[9px] text-neutral-400 dark:text-neutral-500">{row.date.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
                {!gaOn && !analyticsReady && <p className="text-xs text-neutral-400 mt-3">불러오는 중…</p>}
              </div>

              {/* 5) 인기 페이지 · 유입 경로 · 국가 (GA4) */}
              {gaOn && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
                    <h2 className="text-[14px] font-extrabold text-neutral-900 dark:text-white mb-3">🔥 인기 페이지 <span className="text-[11px] font-normal text-neutral-400">7일</span></h2>
                    <div className="space-y-2">
                      {ga4!.topPages.slice(0, 6).map((p, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-[12.5px]">
                          <span className="truncate text-neutral-600 dark:text-neutral-300"><span className="text-neutral-300 dark:text-neutral-600 mr-1.5">{i + 1}</span>{p.title || "(제목없음)"}</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-100 flex-shrink-0">{p.views.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
                    <h2 className="text-[14px] font-extrabold text-neutral-900 dark:text-white mb-3">🧭 유입 경로 <span className="text-[11px] font-normal text-neutral-400">7일</span></h2>
                    <div className="space-y-2.5">
                      {(() => { const tot = ga4!.channels.reduce((s, c) => s + c.sessions, 0) || 1; return ga4!.channels.slice(0, 6).map((c, i) => { const pct = Math.round((c.sessions / tot) * 100); return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-[12px] mb-1"><span className="font-semibold text-neutral-600 dark:text-neutral-300">{chanKo[c.name] || c.name}</span><span className="text-neutral-400">{c.sessions} · {pct}%</span></div>
                          <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden"><div className="h-full rounded-full bg-sky-400" style={{ width: `${pct}%` }} /></div>
                        </div>
                      ); }); })()}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
                    <h2 className="text-[14px] font-extrabold text-neutral-900 dark:text-white mb-3">🌍 국가 <span className="text-[11px] font-normal text-neutral-400">7일</span></h2>
                    <div className="space-y-2">
                      {ga4!.topCountries.slice(0, 6).map((c, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-[12.5px]">
                          <span className="truncate text-neutral-600 dark:text-neutral-300">{flag[c.country] || "🌐"} {c.country}</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-100 flex-shrink-0">{c.users.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6) 방문 기기 + 애드센스 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
                  <h2 className="text-[15px] font-extrabold text-neutral-900 dark:text-white mb-4">📱 방문 기기 {gaOn && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded align-middle">GA4</span>}</h2>
                  {devTotal === 0 ? (
                    <p className="text-[13px] text-neutral-400 py-3">아직 데이터가 없어요.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {[
                        { label: "모바일", n: dev.mobile, c: "bg-[#F9954E]" },
                        { label: "데스크탑", n: dev.desktop, c: "bg-sky-400" },
                        { label: "태블릿", n: dev.tablet, c: "bg-violet-400" },
                      ].map((d) => {
                        const p = devTotal ? Math.round((d.n / devTotal) * 100) : 0;
                        return (
                          <div key={d.label}>
                            <div className="flex items-center justify-between text-[12.5px] mb-1"><span className="font-bold text-neutral-600 dark:text-neutral-300">{d.label}</span><span className="text-neutral-400">{d.n.toLocaleString()} · {p}%</span></div>
                            <div className="h-2 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden"><div className={`h-full rounded-full ${d.c}`} style={{ width: `${p}%` }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[15px] font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">💰 애드센스 수입 {adsenseLive?.today ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">자동</span> : <span className="text-[10px] font-bold text-neutral-400 bg-neutral-500/10 px-1.5 py-0.5 rounded">수동</span>}</h2>
                    <div className="flex gap-1.5">
                      <a href="https://adsense.google.com/" target="_blank" rel="noopener noreferrer" className="text-[11px] rounded-lg px-2 py-1 font-bold bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] transition">애드센스 →</a>
                      {!adsenseLive?.today && <button onClick={() => setAdsenseEdit((v) => !v)} className="text-[11px] rounded-lg px-2 py-1 font-bold bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] transition">{adsenseEdit ? "닫기" : "수정"}</button>}
                    </div>
                  </div>
                  {adsenseLive?.today ? (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {[{ label: "오늘 예상", v: adsenseLive.today.earnings }, { label: "이번 달", v: adsenseLive.month?.earnings || 0 }, { label: "지난 7일", v: adsenseLive.last7?.earnings || 0 }].map((m) => (
                          <div key={m.label} className="rounded-xl bg-neutral-50 dark:bg-zinc-900/60 p-3">
                            <p className="text-[11px] text-neutral-400 mb-0.5">{m.label}</p>
                            <p className="text-lg font-black text-neutral-900 dark:text-white">{money(m.v)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-[11.5px] text-neutral-400">
                        <span>오늘 클릭 <b className="text-neutral-600 dark:text-neutral-300">{adsenseLive.today.clicks.toLocaleString()}</b></span>
                        <span>노출 <b className="text-neutral-600 dark:text-neutral-300">{adsenseLive.today.impressions.toLocaleString()}</b></span>
                        <span>페이지뷰 <b className="text-neutral-600 dark:text-neutral-300">{adsenseLive.today.pageViews.toLocaleString()}</b></span>
                      </div>
                    </>
                  ) : adsenseEdit ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {([["오늘", "today"], ["어제", "yesterday"], ["지난 7일", "last7"], ["이번 달", "month"], ["잔고", "balance"]] as [string, keyof AdsenseData][]).map(([label, key]) => (
                        <label key={key} className="block">
                          <span className="text-[10.5px] text-neutral-400">{label}</span>
                          <input type="number" step="0.01" value={adsenseForm[key] as number} onChange={(e) => setAdsenseForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))} className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-foreground text-[13px] font-bold outline-none focus:border-[#F9954E]" />
                        </label>
                      ))}
                      <div className="col-span-2 flex justify-end"><button onClick={handleSaveAdsense} className="px-4 py-1.5 rounded-lg bg-[#F9954E] text-white font-bold text-[13px] hover:brightness-105 transition">저장</button></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {[{ label: "오늘", v: ad.today }, { label: "이번 달", v: ad.month }, { label: "지난 7일", v: ad.last7 }, { label: "잔고", v: ad.balance }].map((m) => (
                        <div key={m.label} className="rounded-xl bg-neutral-50 dark:bg-zinc-900/60 p-3">
                          <p className="text-[11px] text-neutral-400 mb-0.5">{m.label}</p>
                          <p className="text-lg font-black text-neutral-900 dark:text-white">{money(m.v)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 7) 최근 회원 */}
              <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-extrabold text-neutral-900 dark:text-white">🆕 최근 회원</h2>
                  <button onClick={() => setActiveTab("users")} className="text-[12px] font-bold text-neutral-400 hover:text-[#F9954E] transition">회원관리 →</button>
                </div>
                {users.length === 0 ? (
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm py-2">회원 데이터 없음</p>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-zinc-900">
                    {users.slice(0, 6).map((u) => (
                      <div key={u.email} className="flex items-center justify-between py-2.5 gap-2">
                        <div className="min-w-0 truncate"><span className="font-bold text-[13.5px] text-foreground">{u.name || "이름 없음"}</span><span className="text-neutral-400 text-[12px] ml-2">{u.email}</span></div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {u.isPremium && <span className="text-[10.5px] bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold">💎</span>}
                          <span className="text-[11.5px] text-neutral-400">🍭 {(u.cottonCandy || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })()}

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
                <div key={c.label} className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
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
                className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5 hover:border-[#F9954E]/40 transition-colors">
                <div className="text-2xl mb-2">📈</div>
                <div className="font-bold text-foreground text-sm">Google Analytics</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">실시간·기기·유입 등 정밀 지표 →</div>
              </a>
              <a href="https://clarity.microsoft.com/projects/view/va2qmv3mwz/dashboard" target="_blank" rel="noopener noreferrer"
                className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5 hover:border-[#F9954E]/40 transition-colors">
                <div className="text-2xl mb-2">🔥</div>
                <div className="font-bold text-foreground text-sm">Microsoft Clarity</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">히트맵·세션 녹화 →</div>
              </a>
            </div>

            {/* 기기별 방문 */}
            <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 text-foreground">📱 기기별 방문 (순방문 기준)</h2>
              {(() => {
                const total = device.mobile + device.tablet + device.desktop;
                if (total === 0) {
                  return <p className="text-neutral-400 dark:text-neutral-500 text-sm">{analyticsReady ? "아직 데이터가 없어요." : "불러오는 중…"}</p>;
                }
                const pct = (n: number) => Math.round((n / total) * 100);
                const items = [
                  { label: "📱 모바일", n: device.mobile, color: "#F9954E" },
                  { label: "💻 PC", n: device.desktop, color: "#60A5FA" },
                  { label: "🖥️ 태블릿", n: device.tablet, color: "#A78BFA" },
                ];
                return (
                  <>
                    <div className="flex h-3 rounded-full overflow-hidden mb-5 bg-neutral-100 dark:bg-zinc-900">
                      {items.map((it) => it.n > 0 ? (
                        <div key={it.label} style={{ width: `${pct(it.n)}%`, backgroundColor: it.color }} title={`${it.label} ${pct(it.n)}%`} />
                      ) : null)}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {items.map((it) => (
                        <div key={it.label} className="text-center">
                          <div className="text-[13px] font-bold text-foreground">{it.label}</div>
                          <div className="text-3xl font-black" style={{ color: it.color }}>{pct(it.n)}%</div>
                          <div className="text-xs text-neutral-400 dark:text-neutral-500">{it.n.toLocaleString()}명</div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 일별 기록 (UV/PV) */}
            <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 text-foreground">📅 일별 방문 기록 (최근 30일)</h2>
              {daily.length === 0 ? (
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">{analyticsReady ? "아직 기록이 없어요." : "불러오는 중…"}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-zinc-900">
                        <th className="text-left pb-3 font-semibold">날짜</th>
                        <th className="text-right pb-3 font-semibold">순방문(UV)</th>
                        <th className="text-right pb-3 font-semibold">조회(PV)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...daily].reverse().map((d) => (
                        <tr key={d.date} className="border-b border-neutral-100/80 dark:border-zinc-900/50">
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
            <div className="md:col-span-1 bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
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
                          : "bg-neutral-100 dark:bg-zinc-900 hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
            <div className="md:col-span-2 bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-5">
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
                      <div key={item.label} className="bg-neutral-100 dark:bg-zinc-900 rounded-xl p-3 text-center">
                        <div className="font-bold text-foreground">{item.value}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 프리미엄 토글 */}
                  <div className="bg-neutral-100 dark:bg-zinc-900 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-foreground">💎 프리미엄 (유료 → 무료 전환)</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {selectedUser.isPremium ? "현재 프리미엄 적용 중" : "현재 일반 회원"}
                      </div>
                    </div>
                    <button
                      onClick={() => togglePremium(selectedUser.email)}
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
                  <div className="bg-neutral-100 dark:bg-zinc-900 rounded-xl p-4">
                    <div className="font-medium mb-3 text-foreground">🍭 솜사탕 지급</div>
                    <div className="flex gap-2 flex-wrap">
                      {[10, 50, 100, 500, 1000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => giveCandy(selectedUser.email, amount)}
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
          <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-foreground">💬 커뮤니티 게시글 ({communityPosts.length}개)</h2>
            {communityPosts.length === 0 ? (
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">게시글 없음</p>
            ) : (
              <div className="space-y-3">
                {communityPosts.map((post) => (
                  <div key={post.id} className="bg-neutral-50 dark:bg-zinc-900 rounded-xl p-4 flex justify-between items-start gap-4">
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
            <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-6">
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
                    <div key={u.email} className="flex justify-between items-center bg-neutral-100 dark:bg-zinc-900 rounded-xl px-4 py-3">
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

        {/* ── 동물검수 탭 ── */}
        {activeTab === "animalReview" && (
          <div className="space-y-5">
            {/* 진행률 요약 */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "전체", n: allAnimals.length, color: "text-neutral-500 dark:text-neutral-400" },
                { label: "미검수", n: allAnimals.length - approved.size - rejected.size, color: "text-neutral-700 dark:text-neutral-200" },
                { label: "승인", n: approved.size, color: "text-green-600 dark:text-green-400" },
                { label: "반려", n: rejected.size, color: "text-red-500 dark:text-red-400" },
              ].map((c) => (
                <div key={c.label} className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl p-4 text-center">
                  <div className={`text-2xl font-black ${c.color}`}>{c.n}</div>
                  <div className="text-[12px] text-neutral-400 dark:text-neutral-500 mt-0.5">{c.label}</div>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-neutral-400 dark:text-neutral-500">
              🐾 승인된 동물만 <a href="/animal" target="_blank" className="underline hover:text-[#F9954E]">공개 동물도감</a>에 노출됩니다.
            </p>

            {/* 필터 탭 */}
            <div className="flex gap-2">
              {([
                { id: "pending", label: "미검수" },
                { id: "approved", label: "승인" },
                { id: "rejected", label: "반려" },
                { id: "all", label: "전체" },
              ] as { id: ReviewFilter; label: string }[]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setReviewFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold border transition-colors ${
                    reviewFilter === f.id
                      ? "bg-[#F9954E] border-[#F9954E] text-white"
                      : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400 hover:border-[#F9954E]/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {!reviewLoaded ? (
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">검수 상태 불러오는 중…</p>
            ) : reviewList.length === 0 ? (
              <div className="text-center py-16 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-700">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                  {reviewFilter === "pending" ? "미검수 항목이 없어요 — 전부 검수 완료!" : "해당 목록이 비어있어요"}
                </p>
              </div>
            ) : currentAnimal ? (
              <div className="bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 rounded-2xl overflow-hidden">
                <div className="grid md:grid-cols-[340px_1fr] xl:grid-cols-[460px_1fr]">
                  {/* 이미지 — 우리 생성 vs 실제(영문 위키) 나란히 비교 */}
                  <div className="bg-neutral-100 dark:bg-zinc-900 p-2 space-y-2">
                    {/* 우리 생성 이미지 */}
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${currentAnimal.image_path}?v=${imgVer}`} alt={currentAnimal.animal_name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.opacity = "0.15"; }} />
                      <span className="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/55 text-[#f0d28a] backdrop-blur-sm">No.{currentAnimal.no}</span>
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white ${
                          currentStatus === "approved" ? "bg-green-500" : currentStatus === "rejected" ? "bg-red-500" : "bg-neutral-500"
                        }`}
                      >
                        {currentStatus === "approved" ? "승인됨" : currentStatus === "rejected" ? "반려됨" : "미검수"}
                      </span>
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F9954E] text-white">🎨 우리 생성</span>
                    </div>
                    {/* 실제 사진(영문 위키) — 종이 다르면 반려 사유에 '이미지' 적기 */}
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white dark:bg-zinc-950 flex items-center justify-center">
                      {refImages[currentAnimal.no || ""] ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={refImages[currentAnimal.no || ""]} alt={`${currentAnimal.animal_name} 실제`} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-800/80 text-white">📷 실제 (위키)</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 px-3 text-center leading-relaxed">실제 참조 사진 없음<br />(영문 위키 대표사진 미확보)</span>
                      )}
                    </div>
                  </div>

                  {/* 정보 + 액션 */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-black text-neutral-900 dark:text-white">{currentAnimal.animal_name}</h3>
                      <a
                        href={wikiSearchUrl(currentAnimal)}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400 hover:border-[#F9954E]/40 hover:text-[#F9954E] transition whitespace-nowrap"
                      >
                        🌐 영문 위키 확인
                      </a>
                    </div>
                    {currentAnimal.sci && (
                      <p className="italic text-sm text-neutral-500 dark:text-neutral-400">{currentAnimal.sci}{currentAnimal.en ? ` · ${currentAnimal.en}` : ""}</p>
                    )}
                    <p className="text-[#E8832E] dark:text-[#FBAA60] text-sm font-bold mt-1 mb-3">&ldquo;{currentAnimal.search_nickname}&rdquo;</p>

                    <div className="bg-neutral-50 dark:bg-zinc-900/50 rounded-xl p-3 mb-4 space-y-1.5">
                      {(currentAnimal.info || []).filter(([, k]) => k !== "크기").map(([ic, k, v], i) => (
                        <div key={i} className="flex items-start gap-2 text-[12.5px]">
                          <span className="w-5 text-center flex-shrink-0">{ic}</span>
                          <span className="font-bold text-neutral-500 dark:text-neutral-400 w-12 flex-shrink-0">{k}</span>
                          <span className="text-neutral-700 dark:text-neutral-300 break-keep">{v}</span>
                        </div>
                      ))}
                    </div>

                    {currentAnimal.taxonomy && (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-2 break-keep">
                        <b className="text-neutral-500 dark:text-neutral-400">분류 </b>{currentAnimal.taxonomy}
                      </p>
                    )}
                    {currentAnimal.subspecies && (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-2 break-keep">
                        <b className="text-neutral-500 dark:text-neutral-400">하위종 </b>{currentAnimal.subspecies}
                      </p>
                    )}

                    {/* 검색 분류 태그 — 관리자 전용(공개 화면엔 안 보임). 이게 검색 필터를 결정하므로 여기서 오류 확인 */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-2.5 mb-4">
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-1.5">🏷️ 검색 분류 태그 (관리자 전용 · 몽글로 검색 필터와 동일)</p>
                      <div className="space-y-1">
                        {[
                          { label: "종류", tags: currentAnimal.filters?.taxonomy || [] },
                          { label: "먹이", tags: currentAnimal.filters?.diet || [] },
                          { label: "수명", tags: lifespanTag(currentAnimal) },
                          { label: "몸무게", tags: currentAnimal.filters?.weight || [] },
                          { label: "몸길이", tags: currentAnimal.filters?.length || [] },
                          { label: "서식지", tags: currentAnimal.filters?.region || [] },
                        ].map(({ label, tags }) => (
                          <div key={label} className="flex items-start gap-1.5 text-[11px]">
                            <span className="font-bold text-neutral-500 dark:text-neutral-400 w-11 flex-shrink-0">{label}</span>
                            <div className="flex flex-wrap gap-1">
                              {tags.length === 0 ? (
                                <span className="text-neutral-300 dark:text-neutral-600">—</span>
                              ) : tags.map((t) => (
                                <span key={t} className="font-bold px-1.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-zinc-700">{t}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 승인/반려 액션 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        disabled={reviewBusy}
                        onClick={() => reviewDecide("approve")}
                        className="flex-1 min-w-[100px] px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition disabled:opacity-50"
                      >
                        ✅ 승인
                      </button>
                      <button
                        disabled={reviewBusy}
                        onClick={() => reviewDecide("reject")}
                        className="flex-1 min-w-[100px] px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition disabled:opacity-50"
                      >
                        ❌ 반려
                      </button>
                      {currentStatus !== "pending" && (
                        <button
                          disabled={reviewBusy}
                          onClick={() => reviewDecide("reset")}
                          className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400 font-bold text-sm hover:border-[#F9954E]/40 transition disabled:opacity-50"
                        >
                          ↩️ 보류로
                        </button>
                      )}
                    </div>

                    {/* 반려 사유 — 여기 적고 ❌반려 누르면 저장. 자동화(n8n)가 이 사유를 읽어 데이터 검토·수정 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                          📝 반려 사유 <span className="font-normal text-neutral-400 dark:text-neutral-500">· 자동화가 읽고 수정 — 어디가 왜 틀렸는지</span>
                        </label>
                        {currentStatus === "rejected" && (
                          <button
                            disabled={reviewBusy}
                            onClick={reviewSaveReason}
                            className="px-2.5 py-1 rounded-lg bg-[#F9954E] hover:bg-[#e8843d] text-white font-bold text-[11px] transition disabled:opacity-50"
                          >
                            💾 사유만 저장
                          </button>
                        )}
                      </div>
                      <textarea
                        value={reasonDraft}
                        onChange={(e) => setReasonDraft(e.target.value)}
                        rows={3}
                        placeholder="예: 몸무게 15kg은 오류(실제 약 3.5kg) · 서식지에 남극해 빠짐 · 먹이 태그가 초식으로 잘못됨"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[12.5px] text-foreground placeholder:text-neutral-400 focus:outline-none focus:border-[#F9954E] resize-y break-keep leading-relaxed"
                      />
                      {currentStatus === "rejected" && (rejectReasons[currentNo] || "").trim() && (
                        <p className="mt-1 text-[10.5px] text-red-500 dark:text-red-400 font-bold">● 반려 사유 저장됨 · 자동화 처리 대기</p>
                      )}
                    </div>

                    {/* 이전/다음 네비게이션 */}
                    <div className="flex items-center justify-between border-t border-neutral-100 dark:border-zinc-900 pt-3">
                      <button onClick={() => reviewGoto(-1)} disabled={reviewSafeIdx === 0} className="px-3 py-1.5 rounded-lg text-[13px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] disabled:opacity-30 transition">
                        ◀ 이전
                      </button>
                      <span className="text-[12px] text-neutral-400 dark:text-neutral-500">{reviewSafeIdx + 1} / {reviewList.length}</span>
                      <button onClick={() => reviewGoto(1)} disabled={reviewSafeIdx >= reviewList.length - 1} className="px-3 py-1.5 rounded-lg text-[13px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] disabled:opacity-30 transition">
                        다음 ▶
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── 동물표(엑셀뷰) 탭 ── */}
        {activeTab === "animalTable" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="이름/영문명 검색"
                className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[13px] text-foreground placeholder:text-neutral-400 focus:outline-none focus:border-[#F9954E] w-56"
              />
              {([
                { id: "all", label: "전체" },
                { id: "pending", label: "미검수" },
                { id: "approved", label: "승인" },
                { id: "rejected", label: "반려" },
              ] as { id: ReviewFilter; label: string }[]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTableFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold border transition-colors ${
                    tableFilter === f.id
                      ? "bg-[#F9954E] border-[#F9954E] text-white"
                      : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400 hover:border-[#F9954E]/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-[12px] text-neutral-400 dark:text-neutral-500 ml-auto">{tableRows.length}행 표시 중 (전체 {allAnimals.length})</span>
            </div>

            <div className="overflow-x-auto border border-neutral-100 dark:border-zinc-900 rounded-2xl">
              <table className="w-full text-[13px] whitespace-nowrap">
                <thead className="sticky top-0 bg-neutral-50 dark:bg-zinc-900 z-10">
                  <tr className="text-left text-neutral-500 dark:text-neutral-400">
                    <th className="px-3 py-2.5 font-bold w-12">승인</th>
                    <th className="px-3 py-2.5 font-bold">No.</th>
                    <th className="px-3 py-2.5 font-bold">동물이름</th>
                    <th className="px-3 py-2.5 font-bold">종류</th>
                    <th className="px-3 py-2.5 font-bold">먹이</th>
                    <th className="px-3 py-2.5 font-bold">수명</th>
                    <th className="px-3 py-2.5 font-bold">몸무게</th>
                    <th className="px-3 py-2.5 font-bold">몸길이</th>
                    <th className="px-3 py-2.5 font-bold">서식지</th>
                    <th className="px-3 py-2.5 font-bold">출처</th>
                    <th className="px-3 py-2.5 font-bold">반려</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr
                      key={r.no}
                      className={`border-t border-neutral-100 dark:border-zinc-900 ${
                        r.status === "approved" ? "bg-green-50/60 dark:bg-green-900/10" : r.status === "rejected" ? "bg-red-50/60 dark:bg-red-900/10 opacity-60" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={r.status === "approved"}
                          onChange={(e) => decideAnimal(r.no, e.target.checked ? "approve" : "reset")}
                          className="w-4 h-4 accent-green-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 text-neutral-400 dark:text-neutral-500">{r.no}</td>
                      <td className="px-3 py-2 font-bold text-neutral-900 dark:text-white">{r.name}</td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{r.type}</td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{r.diet}</td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{r.lifespan}</td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{r.weight}</td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{r.length}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {r.region.length === 0 ? (
                            <span className="text-neutral-300 dark:text-neutral-600">—</span>
                          ) : (
                            [...r.region].sort((a, b) => REGION_ORDER.indexOf(a) - REGION_ORDER.indexOf(b)).map((tag) => (
                              <span key={tag} className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                {tag}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <a href={r.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-sky-500 hover:text-sky-700 transition">🌐 위키</a>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.status === "rejected" ? (
                          <button onClick={() => decideAnimal(r.no, "reset")} className="text-[11px] text-neutral-400 hover:text-[#F9954E] transition">↩️ 되돌리기</button>
                        ) : (
                          <button onClick={() => decideAnimal(r.no, "reject")} className="text-[11px] text-red-400 hover:text-red-600 transition">❌ 반려</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableRows.length === 0 && (
                <p className="text-center py-10 text-neutral-400 dark:text-neutral-500 text-sm">조건에 맞는 동물이 없어요</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
