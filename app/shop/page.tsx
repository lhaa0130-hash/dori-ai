"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Link from "next/link";
import {
  getCottonCandyBalance,
  getPurchasedItems,
  purchaseItem,
} from "@/lib/cottonCandy";

// ─── 상품 데이터 ────────────────────────────────────────────────────

type ShopCategory = "all" | "profile" | "title" | "emoji" | "feature";

interface ShopItem {
  id: string;
  category: ShopCategory;
  emoji: string;
  name: string;
  description: string;
  price: number;
  color?: string; // 칭호/테두리 색상 미리보기
}

const SHOP_ITEMS: ShopItem[] = [
  // 🎨 프로필 꾸미기
  { id: "border_gold",     category: "profile", emoji: "✨", name: "골드 테두리",    description: "프로필에 황금빛 테두리를 달아드립니다", price: 30,  color: "#FFD700" },
  { id: "border_rainbow",  category: "profile", emoji: "🌈", name: "무지개 테두리",  description: "화려한 무지개 그라디언트 테두리",         price: 80,  color: "#FF6B6B" },
  { id: "border_neon",     category: "profile", emoji: "💡", name: "네온 테두리",    description: "눈부신 네온 컬러 테두리",                 price: 60,  color: "#39FF14" },
  { id: "border_star",     category: "profile", emoji: "⭐", name: "별빛 테두리",    description: "은은하게 빛나는 별빛 테두리",             price: 100, color: "#C0C0C0" },
  { id: "bg_star",         category: "profile", emoji: "🌟", name: "별 배경 패턴",  description: "프로필 배경에 별 패턴 추가",              price: 50  },
  { id: "bg_circuit",      category: "profile", emoji: "⚡", name: "회로 배경",     description: "하이테크 회로 패턴 배경",                 price: 120 },
  { id: "bg_wave",         category: "profile", emoji: "🌊", name: "파도 배경",     description: "잔잔한 파도 패턴 배경",                   price: 80  },
  // 🏷️ 특별 칭호
  { id: "title_explorer",  category: "title",   emoji: "🚀", name: "AI 탐험가",     description: "닉네임 옆에 표시되는 특별 칭호",          price: 100, color: "#60A5FA" },
  { id: "title_master",    category: "title",   emoji: "👑", name: "DORI 마스터",   description: "DORI-AI를 정복한 마스터의 칭호",          price: 300, color: "#F59E0B" },
  { id: "title_hunter",    category: "title",   emoji: "🎯", name: "트렌드 헌터",   description: "최신 AI 트렌드를 꿰뚫는 헌터",            price: 200, color: "#34D399" },
  { id: "title_rich",      category: "title",   emoji: "🍭", name: "솜사탕 부자",   description: "솜사탕을 넘치도록 모은 자의 칭호",        price: 500, color: "#EC4899" },
  { id: "title_vip",       category: "title",   emoji: "💎", name: "VIP",           description: "최고의 영예를 지닌 VIP 칭호",             price: 1000, color: "#8B5CF6" },
  // 🎭 이모지 패키지
  { id: "emoji_pack_mini", category: "emoji",   emoji: "🎁", name: "미니 이모지 세트", description: "프로필에 뱃지처럼 표시되는 이모지 6종",  price: 80  },
  // 💌 특별 기능
  { id: "feature_pin",     category: "feature", emoji: "📌", name: "게시글 고정 1회권", description: "내 게시글을 상단에 1회 고정",           price: 200 },
  { id: "feature_visitor", category: "feature", emoji: "👥", name: "방문자 확인 기능", description: "내 프로필 방문자를 확인하는 기능",        price: 300 },
];

const CATEGORIES: { id: ShopCategory; label: string; emoji: string }[] = [
  { id: "all",     label: "전체",         emoji: "🛍️" },
  { id: "profile", label: "프로필 꾸미기", emoji: "🎨" },
  { id: "title",   label: "특별 칭호",    emoji: "🏷️" },
  { id: "emoji",   label: "이모지",       emoji: "🎭" },
  { id: "feature", label: "특별 기능",    emoji: "💌" },
];

// ─── 컴포넌트 ───────────────────────────────────────────────────────

export default function ShopPage() {
  const { session, status } = useAuth();
  const user = session?.user || null;
  const [mounted, setMounted] = useState(false);

  const [activeCategory, setActiveCategory] = useState<ShopCategory>("all");
  const [balance, setBalance] = useState(0);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  useEffect(() => setMounted(true), []);

  const loadData = useCallback(() => {
    if (!user?.email) return;
    setBalance(getCottonCandyBalance(user.email));
    setPurchased(getPurchasedItems(user.email));
  }, [user?.email]);

  useEffect(() => {
    if (mounted) loadData();
  }, [mounted, loadData]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = (item: ShopItem) => {
    if (!user?.email) {
      showToast("error", "로그인이 필요합니다.");
      return;
    }
    setConfirmItem(item);
  };

  const confirmBuy = () => {
    if (!confirmItem || !user?.email) return;
    const result = purchaseItem(user.email, confirmItem.id, confirmItem.price);
    if (result.success) {
      showToast("success", `🎉 ${confirmItem.name} 구매 완료!`);
      // 칭호/테두리 구매 시 프로필에 즉시 반영
      applyItemToProfile(user.email, confirmItem);
      loadData();
    } else {
      showToast("error", result.message);
    }
    setConfirmItem(null);
  };

  // 구매한 아이템을 프로필에 즉시 반영
  const applyItemToProfile = (email: string, item: ShopItem) => {
    try {
      const profileKey = `dori_profile_${email}`;
      const raw = localStorage.getItem(profileKey);
      if (!raw) return;
      const profile = JSON.parse(raw);

      // 칭호 아이템 처리
      const titleMap: Record<string, string> = {
        "title_explorer": "AI 탐험가",
        "title_master":   "DORI 마스터",
        "title_hunter":   "트렌드 헌터",
        "title_rich":     "솜사탕 부자",
        "title_vip":      "⭐ VIP",
      };
      // 테두리 아이템 처리
      const borderMap: Record<string, string> = {
        "border_gold":    "gold",
        "border_rainbow": "rainbow",
        "border_neon":    "neon",
        "border_star":    "starlight",
      };

      if (titleMap[item.id]) {
        profile.title = titleMap[item.id];
      }
      if (borderMap[item.id]) {
        profile.profileBorderColor = borderMap[item.id];
      }
      if (item.id === "feature_visitor") {
        profile.visitorFeature = true;
      }
      if (item.id === "feature_pin") {
        profile.pinFeature = (profile.pinFeature || 0) + 1;
      }

      localStorage.setItem(profileKey, JSON.stringify(profile));
      // 프로필 업데이트 이벤트 발송
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (e) {
      console.error("프로필 반영 오류", e);
    }
  };

  const filteredItems =
    activeCategory === "all"
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((i) => i.category === activeCategory);

  if (!mounted) return null;

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative">
      <Header />

      {/* 배경 그라디언트 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-pink-50/60 via-orange-50/20 to-transparent dark:from-pink-950/10 dark:via-black/0 pointer-events-none z-0" />

      {/* 토스트 알림 */}
      {toast && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl transition-all
            ${toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
            }`}
        >
          {toast.msg}
        </div>
      )}

      {/* 구매 확인 모달 */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-neutral-200 dark:border-zinc-700">
            <div className="text-4xl text-center mb-4">{confirmItem.emoji}</div>
            <h3 className="text-xl font-black text-center text-neutral-900 dark:text-white mb-2">
              {confirmItem.name}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-zinc-400 text-center mb-6">
              {confirmItem.description}
            </p>
            <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/30 rounded-2xl p-4 mb-6 border border-orange-100 dark:border-orange-900/30">
              <span className="text-sm font-bold text-neutral-600 dark:text-zinc-300">구매 금액</span>
              <span className="font-black text-[#F9954E] text-lg">🍭 {confirmItem.price.toLocaleString()}개</span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-zinc-500 mb-6">
              <span>현재 잔액</span>
              <span>🍭 {balance.toLocaleString()}개 → <span className={balance < confirmItem.price ? "text-red-500" : "text-green-500"}>🍭 {(balance - confirmItem.price).toLocaleString()}개</span></span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-3 rounded-2xl border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-zinc-300 font-bold text-sm hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={confirmBuy}
                disabled={balance < confirmItem.price}
                className="flex-1 py-3 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
              >
                구매하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 섹션 */}
      <section className="relative pt-32 pb-8 px-6 text-center z-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-black mb-4 tracking-tighter text-neutral-900 dark:text-white">
            🍭 솜사탕 상점
          </h1>
          <div className="w-8 h-1 bg-[#F9954E] rounded-full mx-auto mb-4" />
          <p className="text-sm font-medium text-neutral-500 dark:text-zinc-400 mb-6">
            모은 솜사탕으로 프로필을 꾸미고 특별한 아이템을 획득하세요.
          </p>

          {/* 잔액 표시 */}
          {user ? (
            <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-orange-100 dark:border-orange-900/30 rounded-2xl px-6 py-3 shadow-sm">
              <span className="text-2xl">🍭</span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest">내 솜사탕</p>
                <p className="text-xl font-black text-[#F9954E]">{balance.toLocaleString()}개</p>
              </div>
              <Link
                href="/my"
                className="ml-4 px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-[#F9954E] text-xs font-black hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all"
              >
                더 모으기 →
              </Link>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-neutral-200 dark:border-zinc-800 rounded-2xl px-6 py-3">
              <span className="text-sm font-medium text-neutral-500 dark:text-zinc-400">
                로그인하면 솜사탕으로 아이템을 구매할 수 있어요
              </span>
              <Link href="/login" className="px-4 py-2 rounded-xl bg-[#F9954E] text-white text-xs font-black">
                로그인
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 카테고리 탭 */}
      <section className="relative z-10 px-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all
                  ${activeCategory === cat.id
                    ? "bg-[#F9954E] text-white shadow-lg shadow-orange-500/20"
                    : "bg-white dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 hover:border-orange-200 dark:hover:border-orange-900"
                  }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 상품 그리드 */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const isBought = purchased.includes(item.id);
              const canAfford = balance >= item.price;

              return (
                <div
                  key={item.id}
                  className={`relative bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[1.5rem] border transition-all duration-300 overflow-hidden group
                    ${isBought
                      ? "border-green-300 dark:border-green-800/50"
                      : "border-neutral-200 dark:border-zinc-800/50 hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-orange-500/10"
                    }`}
                >
                  {/* 구매 완료 배지 */}
                  {isBought && (
                    <div className="absolute top-3 right-3 z-10 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      보유중
                    </div>
                  )}

                  {/* 아이템 이미지/이모지 영역 */}
                  <div
                    className="h-28 flex items-center justify-center text-5xl relative overflow-hidden"
                    style={{
                      background: item.color
                        ? `linear-gradient(135deg, ${item.color}22, ${item.color}44)`
                        : "linear-gradient(135deg, #F9954E11, #F9954E22)",
                    }}
                  >
                    <span className="drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {item.emoji}
                    </span>
                    {item.color && (
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                  </div>

                  {/* 아이템 정보 */}
                  <div className="p-4">
                    <div className="mb-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest
                        ${item.category === "profile" ? "text-pink-500" :
                          item.category === "title" ? "text-amber-500" :
                          item.category === "emoji" ? "text-purple-500" :
                          "text-blue-500"}`}
                      >
                        {CATEGORIES.find((c) => c.id === item.category)?.label}
                      </span>
                    </div>
                    <h3 className="font-black text-neutral-900 dark:text-white text-sm mb-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-500 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* 가격 & 구매 버튼 */}
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#F9954E] text-sm flex items-center gap-1">
                        🍭 {item.price.toLocaleString()}
                      </span>
                      {isBought ? (
                        <span className="text-green-500 text-xs font-black flex items-center gap-1">
                          ✓ 구매완료
                        </span>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95
                            ${canAfford
                              ? "bg-[#F9954E] text-white hover:bg-[#E8832E] shadow-sm shadow-orange-500/20"
                              : "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500 cursor-not-allowed"
                            }`}
                        >
                          {canAfford ? "구매하기" : "부족"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 솜사탕 획득 안내 */}
          <div className="mt-12 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 rounded-[2rem] border border-orange-100 dark:border-orange-900/30 p-8">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              🍭 솜사탕 획득 방법
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { emoji: "📅", text: "매일 출석", reward: "+50개" },
                { emoji: "📝", text: "커뮤니티 글쓰기", reward: "+80개" },
                { emoji: "💬", text: "댓글 달기", reward: "+30개" },
                { emoji: "🤓", text: "AI 퀴즈 풀기", reward: "+50개" },
                { emoji: "🎮", text: "미니게임 플레이", reward: "+40개" },
                { emoji: "🏆", text: "업적 달성", reward: "최대 +1000개" },
              ].map((tip) => (
                <div key={tip.text} className="flex items-center gap-3 bg-white/50 dark:bg-white/5 rounded-2xl p-3 border border-orange-100/50 dark:border-white/5">
                  <span className="text-xl">{tip.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-neutral-700 dark:text-zinc-300">{tip.text}</p>
                    <p className="text-[11px] font-black text-[#F9954E]">{tip.reward}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/my"
                className="inline-block px-8 py-3 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-black text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
              >
                마이페이지에서 솜사탕 모으기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
