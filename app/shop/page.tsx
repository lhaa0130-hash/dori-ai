"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import CottonCandy from "@/components/icons/CottonCandy";
import BannerFx from "@/components/cozy/BannerFx";
import {
  getCottonCandyBalance,
  getOwnedShopItems,
  purchaseShopItem,
  isPremiumUser,
} from "@/lib/cottonCandy";
import {
  RARITY_META,
  itemKey,
  itemsBySlot,
  type ShopItem,
  type ItemSlot,
} from "@/lib/shopItems";
import { getProfile, saveMyProfile, currentUid, type Profile } from "@/lib/social";

// ─── 카테고리(슬롯) ─────────────────────────────────────────────────
const TABS: { id: ItemSlot; label: string; emoji: string }[] = [
  { id: "bg", label: "배경", emoji: "🎨" },
  { id: "frame", label: "테두리", emoji: "⭕" },
  { id: "nameEffect", label: "이름 효과", emoji: "✏️" },
  { id: "bannerEffect", label: "배너 효과", emoji: "🌸" },
  { id: "title", label: "칭호", emoji: "🏷️" },
  { id: "sticker", label: "스티커", emoji: "⭐" },
];

const EARN_TIPS = [
  { emoji: "📅", text: "매일 출석", reward: "+50" },
  { emoji: "🎮", text: "미니게임", reward: "+50" },
  { emoji: "📝", text: "글쓰기", reward: "+15" },
  { emoji: "💬", text: "댓글", reward: "+5" },
];

// 슬롯별 미리보기
function ItemPreview({ item }: { item: ShopItem }) {
  switch (item.slot) {
    case "bg":
      return (
        <div className="relative w-full h-14 rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
          <div className={`absolute inset-0 ${item.grad || ""}`} />
        </div>
      );
    case "frame":
      return (
        <div className="w-full h-14 flex items-center justify-center">
          <div className={`w-10 h-10 rounded-full bg-neutral-200 dark:bg-zinc-700 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ${item.ring || ""}`} />
        </div>
      );
    case "nameEffect":
      return (
        <div className="w-full h-14 flex items-center justify-center">
          <span className={`text-[20px] font-extrabold ${item.nameClass || "text-neutral-800 dark:text-white"}`}>도리</span>
        </div>
      );
    case "bannerEffect":
      return (
        <div className="relative w-full h-14 rounded-xl overflow-hidden bg-gradient-to-br from-[#F9954E]/15 to-sky-400/10 ring-1 ring-black/5 dark:ring-white/10">
          {item.fx && item.fx !== "none" ? (
            <BannerFx fx={item.fx} count={6} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-neutral-400">효과 없음</div>
          )}
        </div>
      );
    case "title":
      return (
        <div className="w-full h-14 flex items-center justify-center">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold text-white bg-[#F9954E]">{item.text}</span>
        </div>
      );
    case "sticker":
      return (
        <div className="w-full h-14 flex items-center justify-center text-[34px] leading-none">{item.emoji}</div>
      );
    default:
      return null;
  }
}

export default function ShopPage() {
  const { session } = useAuth();
  const user = session?.user || null;
  const [mounted, setMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<ItemSlot>("bg");
  const [balance, setBalance] = useState(0);
  const [owned, setOwned] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");

  useEffect(() => setMounted(true), []);

  const loadData = useCallback(() => {
    if (!user?.email) return;
    setBalance(getCottonCandyBalance(user.email));
    setOwned(getOwnedShopItems(user.email));
    setIsPremium(isPremiumUser(user.email));
  }, [user?.email]);

  // 장착 상태/스티커 파악을 위해 프로필(보유목록 포함) 로드
  const loadProfile = useCallback(async () => {
    const uid = currentUid();
    if (!uid) return;
    const p = await getProfile(uid);
    setProfile(p);
    // Firestore 보유목록과 로컬 캐시 병합
    setOwned((prev) => Array.from(new Set([...(p.ownedItems || []), ...prev])));
  }, []);

  useEffect(() => {
    if (mounted) {
      loadData();
      loadProfile();
    }
  }, [mounted, loadData, loadProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("dori-gamedata-synced", loadData);
    return () => window.removeEventListener("dori-gamedata-synced", loadData);
  }, [loadData]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2600);
  };

  const ownedSet = new Set(owned);
  const isOwned = (it: ShopItem) => it.price === 0 || ownedSet.has(itemKey(it.slot, it.id));

  // 현재 장착값(none 정규화)
  const slotValue = (slot: ItemSlot): string => {
    if (!profile) return "";
    if (slot === "bg") return profile.bg || "aurora";
    if (slot === "frame") return profile.frame || "none";
    if (slot === "nameEffect") return profile.nameEffect || "none";
    if (slot === "bannerEffect") return profile.bannerEffect || "none";
    return "";
  };
  const isEquipped = (it: ShopItem): boolean => {
    if (!profile) return false;
    if (it.slot === "title") return !!it.text && profile.title === it.text;
    if (it.slot === "sticker") return !!it.emoji && profile.stickers.includes(it.emoji);
    return slotValue(it.slot) === it.id;
  };

  const handleBuy = (item: ShopItem) => {
    if (!user?.email) { showToast("error", "로그인이 필요해요."); return; }
    setConfirmItem(item);
  };

  const confirmBuy = async () => {
    if (!confirmItem || !user?.email || busy) return;
    setBusy(true);
    const res = await purchaseShopItem(user.email, itemKey(confirmItem.slot, confirmItem.id), confirmItem.price);
    setBusy(false);
    if (res.success) {
      showToast("success", `${confirmItem.name} 구매 완료! 바로 장착할 수 있어요`);
      setBalance(res.balance);
      setOwned((prev) => Array.from(new Set([...prev, itemKey(confirmItem.slot, confirmItem.id)])));
    } else {
      showToast("error", res.message);
    }
    setConfirmItem(null);
  };

  // 보유 아이템 장착/해제
  const handleEquip = async (item: ShopItem) => {
    if (busy) return;
    setBusy(true);
    try {
      if (item.slot === "sticker") {
        const cur = profile?.stickers || [];
        const has = !!item.emoji && cur.includes(item.emoji);
        let next: string[];
        if (has) next = cur.filter((s) => s !== item.emoji);
        else {
          if (cur.length >= 6) { showToast("error", "스티커는 최대 6개까지 장착할 수 있어요."); setBusy(false); return; }
          next = [...cur, item.emoji!];
        }
        const ok = await saveMyProfile({ stickers: next });
        if (ok) { setProfile((p) => (p ? { ...p, stickers: next } : p)); showToast("success", has ? "스티커를 뗐어요" : "스티커를 붙였어요"); }
      } else if (item.slot === "title") {
        const equipped = isEquipped(item);
        const nextTitle = equipped ? "" : item.text || "";
        const ok = await saveMyProfile({ title: nextTitle });
        if (ok) { setProfile((p) => (p ? { ...p, title: nextTitle } : p)); showToast("success", equipped ? "칭호를 내렸어요" : "칭호를 장착했어요"); }
      } else {
        const patch: Record<string, string> = {};
        patch[item.slot] = item.id;
        const ok = await saveMyProfile(patch as Parameters<typeof saveMyProfile>[0]);
        if (ok) { setProfile((p) => (p ? { ...p, [item.slot]: item.id } as Profile : p)); showToast("success", "장착 완료!"); }
      }
    } finally {
      setBusy(false);
    }
  };

  // 각 슬롯의 전체 목록(무료 기본/none 포함 → 장착·효과끄기 가능, 유료는 구매 후 장착)
  const visibleItems = itemsBySlot(activeTab).filter((i) =>
    priceFilter === "all" ? true : priceFilter === "free" ? i.price === 0 : i.price > 0
  );

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => !busy && setConfirmItem(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-[1.75rem] p-7 max-w-xs w-full shadow-2xl border border-neutral-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4"><ItemPreview item={confirmItem} /></div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="text-[17px] font-extrabold text-center text-neutral-900 dark:text-white">{confirmItem.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RARITY_META[confirmItem.rarity].badge}`}>{RARITY_META[confirmItem.rarity].label}</span>
            </div>
            <p className="text-[13px] text-neutral-500 dark:text-zinc-400 text-center mb-5 break-keep">{confirmItem.desc}</p>

            {isPremium ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2.5 mb-5 text-center text-[13px] font-bold text-yellow-500">💎 프리미엄 — 무료 획득</div>
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
              <button onClick={() => setConfirmItem(null)} disabled={busy} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-zinc-300 font-bold text-[13px] active:opacity-70 disabled:opacity-50">취소</button>
              <button onClick={confirmBuy} disabled={busy || (!isPremium && balance < confirmItem.price)} className="flex-1 py-3 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[13px] transition-colors active:scale-95">
                {busy ? "구매 중..." : "구매하기"}
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
          모은 솜사탕으로 배경·테두리·이름효과·배너효과·칭호·스티커를 사서 코지홈을 나만의 공간으로 꾸며보세요.
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
            <div className="flex items-center gap-2">
              <Link href="/profile" className="px-3.5 py-2.5 rounded-xl border border-[#F9954E]/40 text-[#F9954E] text-[12px] font-bold active:opacity-85">코지홈 →</Link>
              {isPremium ? (
                <span className="text-[11px] font-bold px-3 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">💎 프리미엄</span>
              ) : (
                <Link href="/my" className="px-3.5 py-2.5 rounded-xl bg-[#F9954E] text-white text-[12px] font-bold active:opacity-85">더 모으기</Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/60 dark:bg-zinc-950">
            <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 break-keep">로그인하면 아이템을 구매하고 꾸밀 수 있어요</span>
            <Link href="/login" className="px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[12px] font-bold flex-shrink-0">로그인</Link>
          </div>
        )}
      </section>

      {/* 카테고리 탭 */}
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide border-b border-neutral-100 dark:border-zinc-900 sticky top-14 bg-white/90 dark:bg-black/90 backdrop-blur z-30">
        <div className="flex gap-2 w-max pb-4 pt-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                  active ? "bg-[#F9954E] border-[#F9954E] text-white" : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 무료/유료 필터 */}
      <div className="flex items-center gap-2 pt-4">
        {([
          { id: "all", label: "전체" },
          { id: "free", label: "무료" },
          { id: "paid", label: "유료" },
        ] as const).map((f) => {
          const active = priceFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setPriceFilter(f.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                active
                  ? "bg-neutral-950 dark:bg-white border-neutral-950 dark:border-white text-white dark:text-neutral-950"
                  : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        <span className="ml-auto text-[11px] text-neutral-400 font-medium">{visibleItems.length}개</span>
      </div>

      {/* 상품 그리드 */}
      <section className="py-5 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {visibleItems.map((item) => {
            const ownedIt = isOwned(item);
            const equipped = isEquipped(item);
            const affordable = isPremium || balance >= item.price;
            const rm = RARITY_META[item.rarity];
            return (
              <div
                key={`${item.slot}:${item.id}`}
                className={`flex flex-col p-3.5 rounded-2xl border bg-white dark:bg-zinc-950 transition-all ${
                  equipped ? "border-[#F9954E] ring-1 ring-[#F9954E]/40" : ownedIt ? "border-[#F9954E]/30" : "border-neutral-100 dark:border-zinc-900 hover:border-[#F9954E]/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {item.rarity === "normal" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-400">기본</span>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rm.badge}`}>{rm.label}</span>
                  )}
                  {equipped && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 text-[#F9954E]">장착중</span>}
                </div>

                <ItemPreview item={item} />

                <h3 className="text-[13px] font-extrabold text-neutral-900 dark:text-white leading-tight mt-2.5 truncate">{item.name}</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug line-clamp-2 break-keep min-h-[28px]">{item.desc}</p>

                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-zinc-900">
                  {item.price > 0 ? (
                    <span className="flex items-center gap-1 text-[12px] font-black text-[#F9954E]"><CottonCandy className="w-3.5 h-3.5" />{item.price.toLocaleString()}</span>
                  ) : (
                    <span className="text-[11px] font-bold text-neutral-400">무료</span>
                  )}

                  {!ownedIt ? (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!affordable}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${affordable ? "bg-[#F9954E] text-white hover:bg-[#E8832E]" : "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-500 cursor-not-allowed"}`}
                    >
                      {affordable ? "구매" : "부족"}
                    </button>
                  ) : !user ? (
                    <span className="text-[#F9954E] text-[11px] font-bold">보유</span>
                  ) : equipped && item.slot !== "sticker" ? (
                    <span className="text-[11px] font-bold text-[#F9954E] px-2">✓ 장착</span>
                  ) : (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={busy}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50 ${
                        item.slot === "sticker" && equipped
                          ? "bg-neutral-100 dark:bg-zinc-800 text-neutral-500"
                          : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      }`}
                    >
                      {item.slot === "sticker" && equipped ? "떼기" : "장착"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 솜사탕 획득 방법 */}
        <div className="mt-8 p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/50 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5"><CottonCandy className="w-4 h-4" /> 솜사탕은 이렇게 모아요</p>
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
