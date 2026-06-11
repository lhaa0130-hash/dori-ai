"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import CottonCandy from "@/components/icons/CottonCandy";
import {
  getCottonCandyBalance,
  getPurchasedItems,
  purchaseItem,
  isPremiumUser,
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
  { id: "title_rich",      category: "title",   emoji: "🍬", name: "솜사탕 부자",   description: "솜사탕을 넘치도록 모은 자의 칭호",        price: 500, color: "#EC4899" },
  { id: "title_vip",       category: "title",   emoji: "💎", name: "VIP",           description: "최고의 영예를 지닌 VIP 칭호",             price: 1000, color: "#8B5CF6" },
  // 🎭 이모지 패키지
  { id: "emoji_pack_mini", category: "emoji",   emoji: "🎁", name: "미니 이모지 세트", description: "프로필에 뱃지처럼 표시되는 이모지 6종",  price: 80  },
  // 💌 특별 기능
  { id: "feature_pin",     category: "feature", emoji: "📌", name: "게시글 고정 1회권", description: "내 게시글을 상단에 1회 고정",           price: 200 },
  { id: "feature_visitor", category: "feature", emoji: "👥", name: "방문자 확인 기능", description: "내 프로필 방문자를 확인하는 기능",        price: 300 },
];

const CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: "all",     label: "전체" },
  { id: "profile", label: "프로필 꾸미기" },
  { id: "title",   label: "특별 칭호" },
  { id: "emoji",   label: "이모지" },
  { id: "feature", label: "특별 기능" },
];

const EARN_TIPS = [
  { emoji: "📅", text: "매일 출석", reward: "+50" },
  { emoji: "📝", text: "글쓰기", reward: "+15" },
  { emoji: "💬", text: "댓글", reward: "+5" },
  { emoji: "🎮", text: "미니게임", reward: "+50" },
];

// ─── 컴포넌트 ───────────────────────────────────────────────────────

export default function ShopPage() {
  const { session } = useAuth();
  const user = session?.user || null;
  const [mounted, setMounted] = useState(false);

  const [activeCategory, setActiveCategory] = useState<ShopCategory>("all");
  const [balance, setBalance] = useState(0);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => setMounted(true), []);

  const loadData = useCallback(() => {
    if (!user?.email) return;
    setBalance(getCottonCandyBalance(user.email));
    setPurchased(getPurchasedItems(user.email));
    setIsPremium(isPremiumUser(user.email));
  }, [user?.email]);

  useEffect(() => { if (mounted) loadData(); }, [mounted, loadData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("dori-gamedata-synced", loadData);
    return () => window.removeEventListener("dori-gamedata-synced", loadData);
  }, [loadData]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = (item: ShopItem) => {
    if (!user?.email) { showToast("error", "로그인이 필요합니다."); return; }
    setConfirmItem(item);
  };

  const confirmBuy = () => {
    if (!confirmItem || !user?.email) return;
    const result = purchaseItem(user.email, confirmItem.id, confirmItem.price);
    if (result.success) {
      showToast("success", `${confirmItem.name} 구매 완료!`);
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
      const titleMap: Record<string, string> = {
        "title_explorer": "AI 탐험가",
        "title_master":   "DORI 마스터",
        "title_hunter":   "트렌드 헌터",
        "title_rich":     "솜사탕 부자",
        "title_vip":      "⭐ VIP",
      };
      const borderMap: Record<string, string> = {
        "border_gold":    "gold",
        "border_rainbow": "rainbow",
        "border_neon":    "neon",
        "border_star":    "starlight",
      };
      if (titleMap[item.id]) profile.title = titleMap[item.id];
      if (borderMap[item.id]) profile.profileBorderColor = borderMap[item.id];
      if (item.id === "feature_visitor") profile.visitorFeature = true;
      if (item.id === "feature_pin") profile.pinFeature = (profile.pinFeature || 0) + 1;
      localStorage.setItem(profileKey, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (e) {
      console.error("프로필 반영 오류", e);
    }
  };

  const filteredItems =
    activeCategory === "all" ? SHOP_ITEMS : SHOP_ITEMS.filter((i) => i.category === activeCategory);

  if (!mounted) return null;

  return (
    <main className="w-full min-h-screen">

      {/* 토스트 */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl font-bold text-[13px] shadow-xl ${toast.type === "success" ? "bg-[#F9954E] text-white" : "bg-neutral-900 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* 구매 확인 모달 */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setConfirmItem(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-[1.75rem] p-7 max-w-xs w-full shadow-2xl border border-neutral-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[34px]"
              style={{ backgroundColor: (confirmItem.color || "#F9954E") + "1a" }}
            >
              {confirmItem.emoji}
            </div>
            <h3 className="text-[17px] font-extrabold text-center text-neutral-900 dark:text-white mb-1">{confirmItem.name}</h3>
            <p className="text-[13px] text-neutral-500 dark:text-zinc-400 text-center mb-5 break-keep">{confirmItem.description}</p>

            {isPremium ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2.5 mb-5 text-center text-[13px] font-bold text-yellow-500">
                💎 프리미엄 — 무료 구매
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-100 dark:border-zinc-800 divide-y divide-neutral-100 dark:divide-zinc-800 mb-5">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-neutral-500">구매 금액</span>
                  <span className="flex items-center gap-1 text-[14px] font-extrabold text-[#F9954E]"><CottonCandy className="w-4 h-4" />{confirmItem.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-neutral-500">구매 후 잔액</span>
                  <span className={`flex items-center gap-1 text-[13px] font-bold ${balance < confirmItem.price ? "text-neutral-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                    <CottonCandy className="w-3.5 h-3.5" />{(balance - confirmItem.price).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2.5">
              <button onClick={() => setConfirmItem(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-zinc-300 font-bold text-[13px] active:opacity-70 transition-opacity">
                취소
              </button>
              <button
                onClick={confirmBuy}
                disabled={!isPremium && balance < confirmItem.price}
                className="flex-1 py-3 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[13px] transition-colors active:scale-95"
              >
                구매하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 히어로 + 잔액 */}
      <section className="pt-8 pb-5">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-2">상점</p>
        <h1 className="text-[30px] sm:text-[40px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 flex items-center gap-2">
          <CottonCandy className="w-8 h-8" /> 솜사탕 상점
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-500 leading-relaxed mb-5 break-keep">
          모은 솜사탕으로 프로필을 꾸미고 특별한 아이템을 받아보세요.
        </p>

        {user ? (
          <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/60 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <CottonCandy className="w-9 h-9" />
              <div>
                <p className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest">내 솜사탕</p>
                <p className="text-[22px] font-black text-[#F9954E] leading-tight">
                  {balance.toLocaleString()}<span className="text-[12px] text-neutral-400 ml-0.5 font-bold">개</span>
                </p>
              </div>
            </div>
            {isPremium ? (
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">💎 프리미엄</span>
            ) : (
              <Link href="/my" className="px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[12px] font-bold active:opacity-85 transition-opacity">
                더 모으기 →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/60 dark:bg-zinc-950">
            <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 break-keep">로그인하면 아이템을 구매할 수 있어요</span>
            <Link href="/login" className="px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[12px] font-bold flex-shrink-0">로그인</Link>
          </div>
        )}
      </section>

      {/* 카테고리 필터 */}
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide border-b border-neutral-100 dark:border-zinc-900">
        <div className="flex gap-2 w-max pb-4">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            const isAll = cat.id === "all";
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                  active
                    ? isAll
                      ? "bg-neutral-950 dark:bg-white border-neutral-950 dark:border-white text-white dark:text-neutral-950"
                      : "bg-[#F9954E] border-[#F9954E] text-white"
                    : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 상품 그리드 */}
      <section className="py-6 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredItems.map((item) => {
            const isBought = purchased.includes(item.id);
            const affordable = isPremium || balance >= item.price;
            const tint = item.color || "#F9954E";
            return (
              <div
                key={item.id}
                className={`flex flex-col p-4 rounded-2xl border bg-white dark:bg-zinc-950 transition-all ${
                  isBought
                    ? "border-[#F9954E]/40"
                    : "border-neutral-100 dark:border-zinc-900 hover:border-[#F9954E]/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] leading-none flex-shrink-0"
                    style={{ backgroundColor: tint + "1f" }}
                  >
                    {item.emoji}
                  </div>
                  {isBought && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 text-[#F9954E]">
                      보유중
                    </span>
                  )}
                </div>

                <h3 className="text-[14px] font-extrabold text-neutral-900 dark:text-white leading-tight">{item.name}</h3>
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2 break-keep">{item.description}</p>

                <div className="flex items-center justify-between mt-auto pt-3.5">
                  <span className="flex items-center gap-1 text-[13px] font-black text-[#F9954E]">
                    <CottonCandy className="w-4 h-4" />{item.price.toLocaleString()}
                  </span>
                  {isBought ? (
                    <span className="text-[#F9954E] text-[11px] font-bold">✓ 보유</span>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!affordable}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
                        affordable
                          ? "bg-[#F9954E] text-white hover:bg-[#E8832E]"
                          : "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {affordable ? "구매" : "부족"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 솜사탕 획득 방법 (compact) */}
        <div className="mt-8 p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/50 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <CottonCandy className="w-4 h-4" /> 솜사탕은 이렇게 모아요
            </p>
            <Link href="/my" className="text-[12px] font-bold text-[#F9954E]">모으러 가기 →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EARN_TIPS.map((tip) => (
              <div key={tip.text} className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl p-2.5 border border-neutral-100 dark:border-zinc-800">
                <span className="text-base">{tip.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-neutral-600 dark:text-zinc-300 truncate">{tip.text}</p>
                  <p className="text-[11px] font-black text-[#F9954E] flex items-center gap-0.5"><CottonCandy className="w-3 h-3" />{tip.reward}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
