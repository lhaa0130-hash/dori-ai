"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import CottonCandy from "@/components/icons/CottonCandy";
import BannerFx from "@/components/cozy/BannerFx";
import MySpaceTabs from "@/components/cozy/MySpaceTabs";
import CozyPreview, { type CozyLook } from "@/components/cozy/CozyPreview";
import {
  getCottonCandyBalance,
  getOwnedShopItems,
  purchaseShopItem,
  isPremiumUser,
} from "@/lib/cottonCandy";
import {
  RARITY_META,
  itemName,
  itemDesc,
  rarityLabel,
  itemText,
  itemKey,
  itemsBySlot,
  type ShopItem,
  type ItemSlot,
} from "@/lib/shopItems";
import { getProfile, saveMyProfile, currentUid, type Profile } from "@/lib/social";

const T = {
  ko: {
    tabLabels: {
      pet: "펫·캐릭터",
      bg: "배경",
      frame: "테두리",
      nameEffect: "이름 효과",
      bannerEffect: "배너 효과",
      title: "칭호",
      sticker: "스티커·소품",
    },
    earnTips: {
      checkin: "매일 출석",
      minigame: "미니게임",
      write: "글쓰기",
      comment: "댓글",
    },
    noEffect: "효과 없음",
    sampleName: "도리",
    loginRequired: "로그인이 필요해요.",
    buyDone: (name: string) => `${name} 구매 완료! 바로 장착할 수 있어요`,
    stickerMax: "스티커는 최대 6개까지 장착할 수 있어요.",
    stickerOff: "스티커를 뗐어요",
    stickerOn: "스티커를 붙였어요",
    titleOff: "칭호를 내렸어요",
    titleOn: "칭호를 장착했어요",
    equipDone: "장착 완료!",
    myName: "나",
    applyPreview: "적용하면 이렇게 보여요",
    premiumFree: "💎 프리미엄 — 무료 획득",
    buyPrice: "구매 금액",
    balanceAfter: "구매 후 잔액",
    cancel: "취소",
    buying: "구매 중...",
    buyNow: "구매하기",
    shopLabel: "상점",
    shopTitle: "솜사탕 상점",
    shopDesc: "모은 솜사탕으로 배경·테두리·이름효과·배너효과·칭호·스티커를 사서 코지홈을 나만의 공간으로 꾸며보세요.",
    myCandy: "내 솜사탕",
    unit: "개",
    goDecorate: "🎨 꾸미러 가기",
    premium: "💎 프리미엄",
    earnMore: "더 모으기",
    loginToBuy: "로그인하면 아이템을 구매하고 꾸밀 수 있어요",
    login: "로그인",
    myCozyHomePreview: "내 코지홈 미리보기",
    previewOf: "미리보기 · ",
    buy: "구매",
    equip: "장착",
    revert: "원래대로",
    tapToTryOn: "아이템을 눌러 입어보세요",
    filterAll: "전체",
    filterFree: "무료",
    filterPaid: "유료",
    itemCount: (n: number) => `${n}개`,
    allPaidInCategory: "이 카테고리는 모두 유료예요",
    noMatchingItems: "해당하는 아이템이 없어요",
    freeStickerHint: "무료 스티커는 코지홈 꾸미기에서 바로 쓸 수 있어요",
    tryOtherCategory: "다른 카테고리를 둘러보세요",
    basic: "기본",
    equippedBadge: "장착중",
    loginToTryOn: "로그인하면 입어볼 수 있어요",
    tryOnTitle: "입어보기",
    tryOnCta: "👁 입어보기",
    notEnough: "부족",
    owned: "보유",
    equippedCheck: "✓ 장착",
    unequip: "떼기",
    earnTitle: "솜사탕은 이렇게 모아요",
    earnGo: "모으러 가기 →",
  },
  en: {
    tabLabels: {
      pet: "Pets & characters",
      bg: "Backgrounds",
      frame: "Frames",
      nameEffect: "Name effects",
      bannerEffect: "Banner effects",
      title: "Titles",
      sticker: "Stickers & props",
    },
    earnTips: {
      checkin: "Daily check-in",
      minigame: "Mini-games",
      write: "Write a post",
      comment: "Comment",
    },
    noEffect: "No effect",
    sampleName: "Dori",
    loginRequired: "Please log in.",
    buyDone: (name: string) => `${name} purchase complete! You can equip it right away`,
    stickerMax: "You can equip up to 6 stickers.",
    stickerOff: "Sticker removed",
    stickerOn: "Sticker added",
    titleOff: "Title removed",
    titleOn: "Title equipped",
    equipDone: "Equipped!",
    myName: "Me",
    applyPreview: "Here's how it'll look",
    premiumFree: "💎 Premium — free for you",
    buyPrice: "Price",
    balanceAfter: "Balance after purchase",
    cancel: "Cancel",
    buying: "Buying...",
    buyNow: "Buy now",
    shopLabel: "Shop",
    shopTitle: "Cotton candy shop",
    shopDesc: "Spend the cotton candy you've earned on backgrounds, frames, name effects, banner effects, titles, and stickers to make your cozy home your own.",
    myCandy: "My cotton candy",
    unit: "",
    goDecorate: "🎨 Go decorate",
    premium: "💎 Premium",
    earnMore: "Earn more",
    loginToBuy: "Log in to buy items and decorate",
    login: "Log in",
    myCozyHomePreview: "My cozy home preview",
    previewOf: "Preview · ",
    buy: "Buy",
    equip: "Equip",
    revert: "Revert",
    tapToTryOn: "Tap an item to try it on",
    filterAll: "All",
    filterFree: "Free",
    filterPaid: "Paid",
    itemCount: (n: number) => `${n} items`,
    allPaidInCategory: "Everything in this category is paid",
    noMatchingItems: "No matching items",
    freeStickerHint: "Free stickers can be used right away in cozy home decorating",
    tryOtherCategory: "Try another category",
    basic: "Basic",
    equippedBadge: "Equipped",
    loginToTryOn: "Log in to try it on",
    tryOnTitle: "Try on",
    tryOnCta: "👁 Try on",
    notEnough: "Not enough",
    owned: "Owned",
    equippedCheck: "✓ Equipped",
    unequip: "Remove",
    earnTitle: "Ways to earn cotton candy",
    earnGo: "Go earn more →",
  },
} as const;

// ─── 카테고리(슬롯) ─────────────────────────────────────────────────
const TABS: { id: ItemSlot; emoji: string }[] = [
  { id: "pet", emoji: "🐾" },
  { id: "bg", emoji: "🎨" },
  { id: "frame", emoji: "⭕" },
  { id: "nameEffect", emoji: "✏️" },
  { id: "bannerEffect", emoji: "🌸" },
  { id: "title", emoji: "🏷️" },
  { id: "sticker", emoji: "⭐" },
];

const EARN_TIPS: { id: "checkin" | "minigame" | "write" | "comment"; emoji: string; reward: string }[] = [
  { id: "checkin", emoji: "📅", reward: "+50" },
  { id: "minigame", emoji: "🎮", reward: "+50" },
  { id: "write", emoji: "📝", reward: "+15" },
  { id: "comment", emoji: "💬", reward: "+5" },
];

// 슬롯별 미리보기
function ItemPreview({ item }: { item: ShopItem }) {
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const t = T[isEn ? "en" : "ko"];
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
          <div className={`w-10 h-10 rounded-full bg-stone-200 dark:bg-zinc-700 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ${item.ring || ""}`} />
        </div>
      );
    case "nameEffect":
      return (
        <div className="w-full h-14 flex items-center justify-center">
          <span className={`text-[20px] font-extrabold ${item.nameClass || "text-stone-800 dark:text-white"}`}>{t.sampleName}</span>
        </div>
      );
    case "bannerEffect":
      return (
        <div className="relative w-full h-14 rounded-xl overflow-hidden bg-gradient-to-br from-[#F9954E]/15 to-sky-400/10 ring-1 ring-black/5 dark:ring-white/10">
          {item.fx && item.fx !== "none" ? (
            <BannerFx fx={item.fx} count={6} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-stone-400">{t.noEffect}</div>
          )}
        </div>
      );
    case "title":
      return (
        <div className="w-full h-14 flex items-center justify-center">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold text-white bg-[#F9954E]">{itemText(item, isEn)}</span>
        </div>
      );
    case "sticker":
      return (
        <div className="w-full h-14 flex items-center justify-center text-[34px] leading-none">{item.emoji}</div>
      );
    case "pet":
      return (
        <div className="w-full h-14 flex items-center justify-center text-[36px] leading-none arcade-float">{item.emoji}</div>
      );
    default:
      return null;
  }
}

export default function ShopPage() {
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const t = T[isEn ? "en" : "ko"];
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
  const [tryOn, setTryOn] = useState<ShopItem | null>(null);

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
    if (slot === "pet") return profile.pet || "";
    return "";
  };
  const isEquipped = (it: ShopItem): boolean => {
    if (!profile) return false;
    if (it.slot === "title") return !!it.text && profile.title === it.text;
    if (it.slot === "sticker") return !!it.emoji && profile.stickers.includes(it.emoji);
    return slotValue(it.slot) === it.id;
  };

  // 현재 코지홈 룩(미리보기용). over 가 있으면 해당 아이템을 입혀본 모습으로.
  const buildLook = (over?: ShopItem | null): CozyLook => {
    const base: CozyLook = {
      name: profile?.name || user?.name || t.myName,
      photoURL: profile?.photoURL,
      bg: profile?.bg || "aurora",
      frame: profile?.frame || "none",
      nameEffect: profile?.nameEffect || "none",
      title: profile?.title || "",
      mood: profile?.mood || "",
      stickers: (profile?.stickers || []).slice(0, 6),
      pet: profile?.pet || "",
      bannerEffect: profile?.bannerEffect || "none",
      accent: profile?.themeColor || "#F9954E",
    };
    if (!over) return base;
    if (over.slot === "bg") base.bg = over.id;
    else if (over.slot === "frame") base.frame = over.id;
    else if (over.slot === "nameEffect") base.nameEffect = over.id;
    else if (over.slot === "bannerEffect") base.bannerEffect = over.id;
    else if (over.slot === "pet") base.pet = over.id;
    else if (over.slot === "title") base.title = over.text || "";
    else if (over.slot === "sticker" && over.emoji) base.stickers = Array.from(new Set([...base.stickers, over.emoji])).slice(0, 6);
    return base;
  };

  const startTryOn = (item: ShopItem) => {
    setTryOn(item);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* noop */ }
  };

  const handleBuy = (item: ShopItem) => {
    if (!user?.email) { showToast("error", t.loginRequired); return; }
    setConfirmItem(item);
  };

  const confirmBuy = async () => {
    if (!confirmItem || !user?.email || busy) return;
    setBusy(true);
    const res = await purchaseShopItem(user.email, itemKey(confirmItem.slot, confirmItem.id), confirmItem.price, isEn ? "en" : "ko");
    setBusy(false);
    if (res.success) {
      showToast("success", t.buyDone(itemName(confirmItem, isEn)));
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
          if (cur.length >= 6) { showToast("error", t.stickerMax); setBusy(false); return; }
          next = [...cur, item.emoji!];
        }
        const ok = await saveMyProfile({ stickers: next });
        if (ok) { setProfile((p) => (p ? { ...p, stickers: next } : p)); showToast("success", has ? t.stickerOff : t.stickerOn); }
      } else if (item.slot === "title") {
        const equipped = isEquipped(item);
        const nextTitle = equipped ? "" : item.text || "";
        const ok = await saveMyProfile({ title: nextTitle });
        if (ok) { setProfile((p) => (p ? { ...p, title: nextTitle } : p)); showToast("success", equipped ? t.titleOff : t.titleOn); }
      } else {
        const patch: Record<string, string> = {};
        patch[item.slot] = item.id;
        const ok = await saveMyProfile(patch as Parameters<typeof saveMyProfile>[0]);
        if (ok) { setProfile((p) => (p ? { ...p, [item.slot]: item.id } as Profile : p)); showToast("success", t.equipDone); }
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
      {/* 내 공간 탭(코지홈 ↔ 상점) */}
      <MySpaceTabs active="shop" />

      {/* 토스트 */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl font-bold text-[13px] shadow-xl ${toast.type === "success" ? "bg-[#F9954E] text-white" : "bg-stone-900 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* 구매 확인 모달 */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => !busy && setConfirmItem(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-[1.75rem] p-7 max-w-xs w-full shadow-2xl border border-stone-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              {profile ? (
                <>
                  <p className="text-[11px] font-bold text-stone-400 mb-1.5 text-center">{t.applyPreview}</p>
                  <CozyPreview look={buildLook(confirmItem)} />
                </>
              ) : (
                <ItemPreview item={confirmItem} />
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="text-[17px] font-extrabold text-center text-stone-900 dark:text-white">{itemName(confirmItem, isEn)}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RARITY_META[confirmItem.rarity].badge}`}>{rarityLabel(confirmItem.rarity, isEn)}</span>
            </div>
            <p className="text-[13px] text-stone-500 dark:text-zinc-400 text-center mb-5 break-keep">{itemDesc(confirmItem, isEn)}</p>

            {isPremium ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2.5 mb-5 text-center text-[13px] font-bold text-yellow-500">{t.premiumFree}</div>
            ) : (
              <div className="rounded-xl border border-stone-100 dark:border-zinc-800 divide-y divide-stone-100 dark:divide-zinc-800 mb-5">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-stone-500">{t.buyPrice}</span>
                  <span className="flex items-center gap-1 text-[14px] font-extrabold text-[#F9954E]"><CottonCandy className="w-4 h-4" />{confirmItem.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12px] text-stone-500">{t.balanceAfter}</span>
                  <span className={`flex items-center gap-1 text-[13px] font-bold ${balance < confirmItem.price ? "text-stone-400" : "text-stone-700 dark:text-stone-300"}`}>
                    <CottonCandy className="w-3.5 h-3.5" />{(balance - confirmItem.price).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2.5">
              <button onClick={() => setConfirmItem(null)} disabled={busy} className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 font-bold text-[13px] active:opacity-70 disabled:opacity-50">{t.cancel}</button>
              <button onClick={confirmBuy} disabled={busy || (!isPremium && balance < confirmItem.price)} className="flex-1 py-3 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[13px] transition-colors active:scale-95">
                {busy ? t.buying : t.buyNow}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 히어로 + 잔액 */}
      <section className="pt-8 pb-5">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-2">{t.shopLabel}</p>
        <h1 className="text-[30px] sm:text-[40px] font-extrabold text-stone-950 dark:text-white leading-[1.12] tracking-tight mb-2 flex items-center gap-2">
          <CottonCandy className="w-8 h-8" /> {t.shopTitle}
        </h1>
        <p className="text-[14px] text-stone-500 dark:text-stone-500 leading-relaxed mb-5 break-keep">
          {t.shopDesc}
        </p>

        {user ? (
          <div className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-stone-50/60 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <CottonCandy className="w-9 h-9" />
              <div>
                <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">{t.myCandy}</p>
                <p className="text-[22px] font-black text-[#F9954E] leading-tight">
                  {balance.toLocaleString()}<span className="text-[12px] text-stone-400 ml-0.5 font-bold">{t.unit}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/profile" className="px-3.5 py-2.5 rounded-xl border border-[#F9954E]/40 text-[#F9954E] text-[12px] font-bold active:opacity-85">{t.goDecorate}</Link>
              {isPremium ? (
                <span className="text-[11px] font-bold px-3 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">{t.premium}</span>
              ) : (
                <Link href="/my" className="px-3.5 py-2.5 rounded-xl bg-[#F9954E] text-white text-[12px] font-bold active:opacity-85">{t.earnMore}</Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-stone-50/60 dark:bg-zinc-950">
            <span className="text-[13px] font-medium text-stone-500 dark:text-stone-400 break-keep">{t.loginToBuy}</span>
            <Link href={isEn ? "/en/login" : "/login"} className="px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[12px] font-bold flex-shrink-0">{t.login}</Link>
          </div>
        )}
      </section>

      {/* 입어보기 미리보기 — 내 코지홈에 적용된 모습 */}
      {user && profile && (
        <section className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-extrabold text-stone-900 dark:text-white">
              {tryOn ? <>{t.previewOf}<span className="text-[#F9954E]">{itemName(tryOn, isEn)}</span></> : t.myCozyHomePreview}
            </p>
            {tryOn ? (
              <div className="flex items-center gap-1.5">
                {!isOwned(tryOn) && (
                  <button
                    onClick={() => { handleBuy(tryOn); }}
                    className="px-3 py-1.5 rounded-full bg-[#F9954E] text-white text-[11px] font-bold active:opacity-85"
                  >
                    🛒 {t.buy} {tryOn.price > 0 ? `(${tryOn.price.toLocaleString()})` : ""}
                  </button>
                )}
                {isOwned(tryOn) && !isEquipped(tryOn) && (
                  <button
                    onClick={() => handleEquip(tryOn)}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[11px] font-bold active:opacity-85 disabled:opacity-50"
                  >
                    {t.equip}
                  </button>
                )}
                <button onClick={() => setTryOn(null)} className="px-3 py-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 text-[11px] font-bold active:opacity-85">
                  {t.revert}
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-stone-400">{t.tapToTryOn}</span>
            )}
          </div>
          <CozyPreview look={buildLook(tryOn)} />
        </section>
      )}

      {/* 카테고리 탭 */}
      <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide border-b border-stone-100 dark:border-zinc-900 sticky top-14 bg-white/90 dark:bg-black/90 backdrop-blur z-30">
        <div className="flex gap-2 w-max pb-4 pt-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                  active ? "bg-[#F9954E] border-[#F9954E] text-white" : "bg-white dark:bg-zinc-950 border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-stone-400"
                }`}
              >
                {tab.emoji} {t.tabLabels[tab.id]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 무료/유료 필터 */}
      <div className="flex items-center gap-2 pt-4">
        {([
          { id: "all", label: t.filterAll },
          { id: "free", label: t.filterFree },
          { id: "paid", label: t.filterPaid },
        ] as const).map((f) => {
          const active = priceFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setPriceFilter(f.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                active
                  ? "bg-stone-950 dark:bg-white border-stone-950 dark:border-white text-white dark:text-stone-950"
                  : "bg-white dark:bg-zinc-950 border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-stone-400"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        <span className="ml-auto text-[11px] text-stone-400 font-medium">{t.itemCount(visibleItems.length)}</span>
      </div>

      {/* 상품 그리드 */}
      <section className="py-5 pb-20">
        {visibleItems.length === 0 && (
          <div className="py-14 text-center">
            <p className="text-[28px] mb-2">🍬</p>
            <p className="text-[14px] font-bold text-stone-600 dark:text-stone-300">
              {priceFilter === "free" ? t.allPaidInCategory : t.noMatchingItems}
            </p>
            <p className="text-[12px] text-stone-400 mt-1">
              {activeTab === "sticker" && priceFilter === "free"
                ? t.freeStickerHint
                : t.tryOtherCategory}
            </p>
          </div>
        )}
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
                  equipped ? "border-[#F9954E] ring-1 ring-[#F9954E]/40" : ownedIt ? "border-[#F9954E]/30" : "border-stone-100 dark:border-zinc-900 hover:border-[#F9954E]/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {item.rarity === "normal" ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-400">{t.basic}</span>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rm.badge}`}>{rarityLabel(item.rarity, isEn)}</span>
                  )}
                  {equipped && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FBEEE7] dark:bg-[#F9954E]/10 text-[#F9954E]">{t.equippedBadge}</span>}
                </div>

                <button
                  type="button"
                  onClick={() => (user && profile ? startTryOn(item) : showToast("error", t.loginToTryOn))}
                  className="block w-full text-left active:opacity-80"
                  title={t.tryOnTitle}
                >
                  <ItemPreview item={item} />
                  <h3 className="text-[13px] font-extrabold text-stone-900 dark:text-white leading-tight mt-2.5 truncate">{itemName(item, isEn)}</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug line-clamp-2 break-keep min-h-[28px]">{itemDesc(item, isEn)}</p>
                  <p className="text-[10px] font-bold text-[#F9954E] mt-1">{t.tryOnCta}</p>
                </button>

                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-stone-100 dark:border-zinc-900">
                  {item.price > 0 ? (
                    <span className="flex items-center gap-1 text-[12px] font-black text-[#F9954E]"><CottonCandy className="w-3.5 h-3.5" />{item.price.toLocaleString()}</span>
                  ) : (
                    <span className="text-[11px] font-bold text-stone-400">{t.filterFree}</span>
                  )}

                  {!ownedIt ? (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!affordable}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${affordable ? "bg-[#F9954E] text-white hover:bg-[#E8832E]" : "bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 cursor-not-allowed"}`}
                    >
                      {affordable ? t.buy : t.notEnough}
                    </button>
                  ) : !user ? (
                    <span className="text-[#F9954E] text-[11px] font-bold">{t.owned}</span>
                  ) : equipped && item.slot !== "sticker" ? (
                    <span className="text-[11px] font-bold text-[#F9954E] px-2">{t.equippedCheck}</span>
                  ) : (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={busy}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50 ${
                        item.slot === "sticker" && equipped
                          ? "bg-stone-100 dark:bg-zinc-800 text-stone-500"
                          : "bg-stone-900 dark:bg-white text-white dark:text-stone-900"
                      }`}
                    >
                      {item.slot === "sticker" && equipped ? t.unequip : t.equip}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 솜사탕 획득 방법 */}
        <div className="mt-8 p-5 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-stone-50/50 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5"><CottonCandy className="w-4 h-4" /> {t.earnTitle}</p>
            <Link href="/my" className="text-[12px] font-bold text-[#F9954E]">{t.earnGo}</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EARN_TIPS.map((tip) => (
              <div key={tip.id} className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl p-2.5 border border-stone-100 dark:border-zinc-800">
                <span className="text-base">{tip.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-stone-600 dark:text-zinc-300 truncate">{t.earnTips[tip.id]}</p>
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
