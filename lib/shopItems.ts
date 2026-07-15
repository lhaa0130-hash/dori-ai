// 코지홈 꾸미기 아이템 카탈로그 (상점 ↔ 코지홈 공용 단일 출처)
// ─────────────────────────────────────────────────────────────
// 상점(/shop)에서 솜사탕으로 구매 → users/{uid}.ownedItems 에 저장 →
// 코지홈(/profile) 꾸미기 패널에서 장착. 무료 아이템은 price 0 (항상 보유).
//
// ⚠️ Tailwind JIT 주의: grad/ring/nameClass 의 클래스 문자열은 반드시 "리터럴"로
//    이 파일에 박혀 있어야 빌드에 포함됩니다. 런타임 문자열 조합 금지.
//    (lib 폴더는 tailwind content 스캔 대상)
//    - bg.grad 는 배경 오버레이에 단독 적용되는 "전체 배경 클래스"입니다.
//      (선형: "bg-gradient-to-br from-... to-..." / 메시: "cozy-bg-mesh-...")
//    - frame.ring 은 아바타에 적용되는 ring 또는 box-shadow(.cozy-frame-*) 클래스.
//    - 브라켓 안 콤마(shadow-[...rgba(,)...])는 JIT 미방출 → globals.css 클래스 사용.

export type ItemSlot = "bg" | "frame" | "nameEffect" | "bannerEffect" | "title" | "sticker" | "pet";
export type Rarity = "normal" | "rare" | "epic" | "legend";

export interface ShopItem {
  id: string;
  slot: ItemSlot;
  name: string;
  desc: string;
  price: number; // 0 = 기본 제공(무료)
  rarity: Rarity;
  grad?: string; // bg: 전체 배경 클래스
  ring?: string; // frame: ring/box-shadow 클래스
  nameClass?: string; // nameEffect: 이름 span 클래스
  fx?: string; // bannerEffect: 효과 키 (BannerFx 가 해석)
  emoji?: string; // sticker 이모지 / 미리보기 글리프
  text?: string; // title: 칭호 텍스트
}

// ─── 희귀도 메타 ───────────────────────────────────────────────
export const RARITY_META: Record<Rarity, { label: string; color: string; badge: string }> = {
  normal: { label: "노멀", color: "#9ca3af", badge: "bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-400" },
  rare: { label: "레어", color: "#3b82f6", badge: "bg-blue-500/10 text-blue-500" },
  epic: { label: "에픽", color: "#a855f7", badge: "bg-purple-500/10 text-purple-500" },
  legend: { label: "레전드", color: "#f59e0b", badge: "bg-amber-500/10 text-amber-500" },
};

// ─── 카탈로그 ─────────────────────────────────────────────────
export const SHOP_ITEMS: ShopItem[] = [
  // ════════ 배경 (bg) ════════
  // ── 무료 15종 (선형 그라데이션) ──
  { id: "aurora", slot: "bg", name: "오로라", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-[#F9954E]/20 via-fuchsia-500/10 to-sky-500/20" },
  { id: "sunset", slot: "bg", name: "선셋", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-orange-500/25 to-rose-500/20" },
  { id: "peach", slot: "bg", name: "피치", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-[#FFD9B0]/50 to-[#F9954E]/25" },
  { id: "candy", slot: "bg", name: "캔디", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-pink-400/25 to-purple-400/20" },
  { id: "mint", slot: "bg", name: "민트", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-emerald-400/25 to-teal-500/15" },
  { id: "ocean", slot: "bg", name: "오션", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-sky-400/25 to-blue-600/20" },
  { id: "forest", slot: "bg", name: "포레스트", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-green-500/25 to-emerald-700/20" },
  { id: "berry", slot: "bg", name: "베리", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-fuchsia-500/25 to-purple-600/20" },
  { id: "galaxy", slot: "bg", name: "갤럭시", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-slate-900/40" },
  { id: "night", slot: "bg", name: "나이트", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-indigo-600/20 to-slate-800/35" },
  { id: "gold", slot: "bg", name: "골드", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-amber-300/35 to-yellow-600/20" },
  { id: "mono", slot: "bg", name: "모노", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-stone-400/15 to-stone-600/10" },
  { id: "coral", slot: "bg", name: "코랄", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-rose-400/25 to-orange-300/20" },
  { id: "lime", slot: "bg", name: "라임", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-lime-300/30 to-green-400/15" },
  { id: "plum", slot: "bg", name: "플럼", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-violet-400/25 to-purple-500/15" },
  // ── 유료 선형 ──
  { id: "bg_sky_cotton", slot: "bg", name: "솜사탕 하늘", desc: "보송보송 파스텔 하늘빛", price: 40, rarity: "rare", grad: "bg-gradient-to-br from-sky-300/30 via-pink-200/25 to-white/10" },
  { id: "bg_lavender", slot: "bg", name: "라벤더", desc: "은은한 보랏빛", price: 40, rarity: "rare", grad: "bg-gradient-to-br from-violet-300/30 to-fuchsia-300/25" },
  { id: "bg_cream", slot: "bg", name: "크림소다", desc: "상큼한 레몬라임", price: 50, rarity: "rare", grad: "bg-gradient-to-br from-yellow-200/35 to-lime-200/25" },
  { id: "bg_rose", slot: "bg", name: "로즈골드", desc: "따뜻한 로즈골드 톤", price: 50, rarity: "rare", grad: "bg-gradient-to-br from-rose-300/30 to-amber-200/25" },
  { id: "bg_aurora_live", slot: "bg", name: "오로라 라이브", desc: "천천히 흐르는 오로라", price: 120, rarity: "epic", grad: "bg-gradient-to-br from-[#F9954E]/25 via-fuchsia-500/20 to-sky-500/25 animate-gradient-x bg-[length:200%_200%]" },
  { id: "bg_neon_city", slot: "bg", name: "네온시티", desc: "흐르는 네온 불빛", price: 150, rarity: "epic", grad: "bg-gradient-to-br from-fuchsia-600/30 via-purple-600/25 to-cyan-500/30 animate-gradient-x bg-[length:200%_200%]" },
  { id: "bg_deep_sea", slot: "bg", name: "심해", desc: "깊고 푸른 바닷속", price: 130, rarity: "epic", grad: "bg-gradient-to-br from-blue-700/35 via-cyan-600/25 to-teal-500/30 animate-gradient-x bg-[length:200%_200%]" },
  { id: "bg_sakura", slot: "bg", name: "벚꽃비", desc: "벚꽃 흩날리는 봄날 (벚꽃 효과와 찰떡)", price: 140, rarity: "epic", grad: "bg-gradient-to-br from-pink-300/30 via-rose-200/25 to-white/10" },
  { id: "bg_galaxy_live", slot: "bg", name: "은하수", desc: "흐르는 별의 강", price: 350, rarity: "legend", grad: "bg-gradient-to-br from-indigo-700/40 via-purple-700/25 to-slate-900/50 animate-gradient-x bg-[length:200%_200%]" },
  { id: "bg_rainbow", slot: "bg", name: "무지개", desc: "일곱 빛깔 무지개 흐름", price: 400, rarity: "legend", grad: "bg-gradient-to-br from-red-400/25 via-yellow-300/25 to-violet-500/30 animate-gradient-x bg-[length:200%_200%]" },
  { id: "bg_gold_lux", slot: "bg", name: "골드 럭셔리", desc: "최고의 황금빛 (레전드)", price: 600, rarity: "legend", grad: "bg-gradient-to-br from-amber-300/40 via-yellow-400/30 to-amber-600/35 animate-gradient-x bg-[length:200%_200%]" },
  // ── 유료 메시 그라데이션 (고급) ──
  { id: "bg_mesh_sunset", slot: "bg", name: "메시 선셋", desc: "부드럽게 번지는 노을 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-sunset" },
  { id: "bg_mesh_ocean", slot: "bg", name: "메시 오션", desc: "번지는 바다빛 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-ocean" },
  { id: "bg_mesh_candy", slot: "bg", name: "메시 캔디", desc: "달콤한 핑크퍼플 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-candy" },
  { id: "bg_mesh_forest", slot: "bg", name: "메시 포레스트", desc: "싱그러운 초록 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-forest" },
  { id: "bg_mesh_rose", slot: "bg", name: "메시 로즈", desc: "은은한 로즈빛 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-rose" },
  { id: "bg_mesh_cotton", slot: "bg", name: "메시 솜사탕", desc: "몽글몽글 파스텔 메시", price: 120, rarity: "epic", grad: "cozy-bg-mesh-cottoncandy" },
  { id: "bg_mesh_aurora_live", slot: "bg", name: "메시 오로라 라이브", desc: "색이 흐르는 오로라 메시", price: 200, rarity: "epic", grad: "cozy-bg-mesh-aurora cozy-bg-animate" },
  { id: "bg_mesh_galaxy_live", slot: "bg", name: "메시 은하수 라이브", desc: "색이 흐르는 은하 메시 (레전드)", price: 380, rarity: "legend", grad: "cozy-bg-mesh-galaxy cozy-bg-animate" },
  { id: "bg_mesh_gold_live", slot: "bg", name: "메시 골드 라이브", desc: "색이 흐르는 황금 메시 (레전드)", price: 500, rarity: "legend", grad: "cozy-bg-mesh-gold cozy-bg-animate" },

  // ════════ 아바타 테두리 (frame) ════════
  // ── 무료 11종 (단색 ring) ──
  { id: "none", slot: "frame", name: "기본", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-2 ring-white dark:ring-zinc-900" },
  { id: "orange", slot: "frame", name: "오렌지", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-[#F9954E]" },
  { id: "gold", slot: "frame", name: "골드", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-amber-400" },
  { id: "neon", slot: "frame", name: "네온", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-fuchsia-400" },
  { id: "mint", slot: "frame", name: "민트", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-emerald-400" },
  { id: "sky", slot: "frame", name: "스카이", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-sky-400" },
  { id: "frame_rose", slot: "frame", name: "로즈", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-rose-400" },
  { id: "frame_violet", slot: "frame", name: "바이올렛", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-violet-400" },
  { id: "frame_cyan", slot: "frame", name: "사이안", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-cyan-400" },
  { id: "frame_lime", slot: "frame", name: "라임", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-lime-400" },
  { id: "frame_red", slot: "frame", name: "레드", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-red-400" },
  // ── 유료 글로우 ring (레어) ──
  { id: "frame_glow", slot: "frame", name: "오렌지 글로우", desc: "은은하게 빛나는 오렌지", price: 60, rarity: "rare", ring: "ring-[3px] ring-[#F9954E] arcade-glow" },
  { id: "frame_neon_pulse", slot: "frame", name: "네온 펄스", desc: "맥동하는 네온 글로우", price: 60, rarity: "rare", ring: "ring-[3px] ring-fuchsia-400 arcade-glow" },
  { id: "frame_emerald_glow", slot: "frame", name: "에메랄드 글로우", desc: "빛나는 에메랄드", price: 60, rarity: "rare", ring: "ring-[3px] ring-emerald-400 arcade-glow" },
  { id: "frame_glow_cyan", slot: "frame", name: "사이안 글로우", desc: "빛나는 청록", price: 60, rarity: "rare", ring: "ring-[3px] ring-cyan-400 arcade-glow" },
  // ── 유료 다중밴드 (에픽) ──
  { id: "frame_aurora", slot: "frame", name: "오로라 밴드", desc: "오렌지·퍼플 2중 밴드 + 글로우", price: 130, rarity: "epic", ring: "cozy-frame-aurora" },
  { id: "frame_flame", slot: "frame", name: "플레임", desc: "타오르는 2중 밴드 + 글로우", price: 130, rarity: "epic", ring: "cozy-frame-flame" },
  { id: "frame_holo", slot: "frame", name: "홀로그램", desc: "하늘·보라 2중 밴드 + 글로우", price: 150, rarity: "epic", ring: "cozy-frame-holo" },
  { id: "frame_mint_band", slot: "frame", name: "민트 밴드", desc: "민트·시안 2중 밴드 + 글로우", price: 120, rarity: "epic", ring: "cozy-frame-mint" },
  // ── 유료 프리미엄 (레전드) ──
  { id: "frame_diamond", slot: "frame", name: "다이아몬드", desc: "영롱하게 빛나는 다이아", price: 320, rarity: "legend", ring: "cozy-frame-diamond" },
  { id: "frame_rainbow", slot: "frame", name: "무지개링", desc: "무지갯빛 2중 밴드 + 글로우", price: 400, rarity: "legend", ring: "cozy-frame-rainbow" },
  { id: "frame_gold_lux", slot: "frame", name: "황금 월계관", desc: "최고의 황금 테두리 (레전드)", price: 520, rarity: "legend", ring: "cozy-frame-goldlux" },

  // ════════ 이름 효과 (nameEffect) ════════
  { id: "none", slot: "nameEffect", name: "기본", desc: "기본 이름 색", price: 0, rarity: "normal", nameClass: "" },
  { id: "name_orange", slot: "nameEffect", name: "오렌지 그라데이션", desc: "브랜드 오렌지 그라데이션", price: 0, rarity: "normal", nameClass: "arcade-grad-text" },
  { id: "name_candy", slot: "nameEffect", name: "솜사탕", desc: "달콤한 핑크 그라데이션", price: 60, rarity: "rare", nameClass: "name-candy" },
  { id: "name_ocean", slot: "nameEffect", name: "오션", desc: "시원한 블루 그라데이션", price: 60, rarity: "rare", nameClass: "name-ocean" },
  { id: "name_forest", slot: "nameEffect", name: "포레스트", desc: "싱그러운 그린 그라데이션", price: 60, rarity: "rare", nameClass: "name-forest" },
  { id: "name_chrome", slot: "nameEffect", name: "크롬", desc: "메탈 실버 광택", price: 140, rarity: "epic", nameClass: "name-chrome" },
  { id: "name_ice", slot: "nameEffect", name: "아이스", desc: "차가운 얼음빛", price: 140, rarity: "epic", nameClass: "name-ice" },
  { id: "name_neon", slot: "nameEffect", name: "네온 글로우", desc: "빛나는 네온", price: 130, rarity: "epic", nameClass: "name-neon" },
  { id: "name_fire", slot: "nameEffect", name: "파이어", desc: "타오르는 불꽃빛", price: 150, rarity: "epic", nameClass: "name-fire" },
  { id: "name_gold", slot: "nameEffect", name: "골드", desc: "고급스러운 황금빛", price: 150, rarity: "epic", nameClass: "name-gold" },
  { id: "name_rainbow", slot: "nameEffect", name: "무지개", desc: "일곱 빛깔 무지개", price: 180, rarity: "epic", nameClass: "name-rainbow" },
  { id: "name_shimmer", slot: "nameEffect", name: "쉬머", desc: "흐르며 반짝이는 광택", price: 320, rarity: "legend", nameClass: "name-shimmer" },
  { id: "name_legend", slot: "nameEffect", name: "레전드", desc: "흐르며 빛나는 전설 (레전드)", price: 350, rarity: "legend", nameClass: "name-legend" },

  // ════════ 배너 효과 (bannerEffect) ════════
  { id: "none", slot: "bannerEffect", name: "없음", desc: "효과 없음", price: 0, rarity: "normal", fx: "none" },
  { id: "fx_sparkle", slot: "bannerEffect", name: "반짝이", desc: "반짝이는 별가루", price: 0, rarity: "normal", fx: "sparkle", emoji: "✨" },
  { id: "fx_confetti", slot: "bannerEffect", name: "꽃가루", desc: "축하 꽃가루가 내려요", price: 80, rarity: "rare", fx: "confetti", emoji: "🎉" },
  { id: "fx_leaves", slot: "bannerEffect", name: "단풍", desc: "단풍잎이 떨어져요", price: 70, rarity: "rare", fx: "leaves", emoji: "🍂" },
  { id: "fx_bubble", slot: "bannerEffect", name: "비눗방울", desc: "둥둥 떠오르는 비눗방울", price: 70, rarity: "rare", fx: "bubble", emoji: "🫧" },
  { id: "fx_music", slot: "bannerEffect", name: "음표", desc: "음표가 흩날려요", price: 80, rarity: "rare", fx: "music", emoji: "🎵" },
  { id: "fx_petals", slot: "bannerEffect", name: "벚꽃잎", desc: "벚꽃이 흩날려요", price: 120, rarity: "epic", fx: "petals", emoji: "🌸" },
  { id: "fx_snow", slot: "bannerEffect", name: "눈", desc: "하얀 눈이 내려요", price: 120, rarity: "epic", fx: "snow", emoji: "❄️" },
  { id: "fx_hearts", slot: "bannerEffect", name: "하트", desc: "하트가 퐁퐁", price: 100, rarity: "epic", fx: "hearts", emoji: "💛" },
  { id: "fx_stars", slot: "bannerEffect", name: "별똥별", desc: "별이 쏟아져요", price: 110, rarity: "epic", fx: "stars", emoji: "⭐" },
  { id: "fx_coins", slot: "bannerEffect", name: "코인비", desc: "솜사탕이 쏟아져요", price: 130, rarity: "epic", fx: "coins", emoji: "🍬" },

  // ════════ 칭호 (title) — 프리미엄 프리셋 ════════
  { id: "title_newbie", slot: "title", name: "새싹", desc: "이름 아래 칭호", price: 30, rarity: "rare", text: "🌱 새싹" },
  { id: "title_star", slot: "title", name: "떠오르는 스타", desc: "이름 아래 칭호", price: 50, rarity: "rare", text: "🌟 떠오르는 스타" },
  { id: "title_animal", slot: "title", name: "동물친구", desc: "이름 아래 칭호", price: 50, rarity: "rare", text: "🐾 동물친구" },
  { id: "title_artist", slot: "title", name: "예술가", desc: "이름 아래 칭호", price: 60, rarity: "rare", text: "🎨 예술가" },
  { id: "title_night", slot: "title", name: "밤샘러", desc: "이름 아래 칭호", price: 60, rarity: "rare", text: "🌙 밤샘러" },
  { id: "title_coder", slot: "title", name: "코더", desc: "이름 아래 칭호", price: 60, rarity: "rare", text: "👨‍💻 코더" },
  { id: "title_hunter", slot: "title", name: "트렌드 헌터", desc: "이름 아래 칭호", price: 80, rarity: "rare", text: "🎯 트렌드 헌터" },
  { id: "title_explorer", slot: "title", name: "AI 탐험가", desc: "이름 아래 칭호", price: 80, rarity: "rare", text: "🚀 AI 탐험가" },
  { id: "title_gamer", slot: "title", name: "게임의 신", desc: "이름 아래 칭호", price: 150, rarity: "epic", text: "🎮 게임의 신" },
  { id: "title_lucky", slot: "title", name: "행운아", desc: "이름 아래 칭호", price: 150, rarity: "epic", text: "🍀 행운아" },
  { id: "title_fairy", slot: "title", name: "무지개 요정", desc: "이름 아래 칭호", price: 180, rarity: "epic", text: "🌈 무지개 요정" },
  { id: "title_rich", slot: "title", name: "솜사탕 부자", desc: "이름 아래 칭호", price: 200, rarity: "epic", text: "🍬 솜사탕 부자" },
  { id: "title_master", slot: "title", name: "코지홈 마스터", desc: "이름 아래 칭호", price: 200, rarity: "epic", text: "👑 코지홈 마스터" },
  { id: "title_vip", slot: "title", name: "VIP", desc: "최고 영예의 칭호", price: 500, rarity: "legend", text: "💎 VIP" },
  { id: "title_legend", slot: "title", name: "레전드", desc: "전설의 칭호 (레전드)", price: 600, rarity: "legend", text: "🏆 레전드" },
  { id: "title_king", slot: "title", name: "솜사탕 킹", desc: "최정상의 칭호 (레전드)", price: 700, rarity: "legend", text: "👑 솜사탕 킹" },

  // ════════ 스티커 (sticker) — 보유 시 배너 스티커로 선택 가능 ════════
  // 동물
  { id: "st_unicorn", slot: "sticker", name: "유니콘", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🦄" },
  { id: "st_rabbit", slot: "sticker", name: "토끼", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🐰" },
  { id: "st_cat", slot: "sticker", name: "고양이", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🐱" },
  { id: "st_dog", slot: "sticker", name: "강아지", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🐶" },
  { id: "st_panda", slot: "sticker", name: "판다", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🐼" },
  { id: "st_turtle", slot: "sticker", name: "거북이", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🐢" },
  { id: "st_penguin", slot: "sticker", name: "펭귄", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🐧" },
  { id: "st_frog", slot: "sticker", name: "개구리", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🐸" },
  { id: "st_owl", slot: "sticker", name: "부엉이", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🦉" },
  { id: "st_whale", slot: "sticker", name: "고래", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🐳" },
  { id: "st_lion", slot: "sticker", name: "사자", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🦁" },
  { id: "st_butterfly", slot: "sticker", name: "나비", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🦋" },
  // 자연/식물
  { id: "st_rose", slot: "sticker", name: "장미", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🌹" },
  { id: "st_sunflower", slot: "sticker", name: "해바라기", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🌻" },
  { id: "st_tulip", slot: "sticker", name: "튤립", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🌷" },
  { id: "st_mushroom", slot: "sticker", name: "버섯", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🍄" },
  { id: "st_moon", slot: "sticker", name: "달", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🌙" },
  { id: "st_snowman", slot: "sticker", name: "눈사람", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "⛄" },
  // 디저트/음식
  { id: "st_strawberry", slot: "sticker", name: "딸기", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍓" },
  { id: "st_cupcake", slot: "sticker", name: "컵케이크", desc: "배너 스티커", price: 30, rarity: "rare", emoji: "🧁" },
  { id: "st_cake", slot: "sticker", name: "케이크", desc: "배너 스티커", price: 30, rarity: "rare", emoji: "🎂" },
  { id: "st_donut", slot: "sticker", name: "도넛", desc: "배너 스티커", price: 30, rarity: "rare", emoji: "🍩" },
  { id: "st_cookie", slot: "sticker", name: "쿠키", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍪" },
  { id: "st_choco", slot: "sticker", name: "초콜릿", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍫" },
  { id: "st_popcorn", slot: "sticker", name: "팝콘", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍿" },
  { id: "st_apple", slot: "sticker", name: "사과", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍎" },
  { id: "st_watermelon", slot: "sticker", name: "수박", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍉" },
  { id: "st_cherry", slot: "sticker", name: "체리", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍒" },
  // 우주/판타지
  { id: "st_comet", slot: "sticker", name: "별똥별", desc: "배너 스티커", price: 40, rarity: "epic", emoji: "💫" },
  { id: "st_planet", slot: "sticker", name: "토성", desc: "배너 스티커", price: 40, rarity: "epic", emoji: "🪐" },
  { id: "st_balloon", slot: "sticker", name: "풍선", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🎈" },
  { id: "st_music", slot: "sticker", name: "음표", desc: "배너 스티커", price: 30, rarity: "rare", emoji: "🎵" },
  { id: "st_wave", slot: "sticker", name: "파도", desc: "배너 스티커", price: 30, rarity: "rare", emoji: "🌊" },

  // ════════════════════════════════════════════════════════════
  // ▼▼▼ 2차 확장 (개수 大확장 · 무료=심플 / 유료=고급) ▼▼▼
  // ════════════════════════════════════════════════════════════

  // ──── 배경 추가 : 무료(심플 2색 선형) ────
  { id: "bg_skyblue", slot: "bg", name: "스카이블루", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-sky-300/25 to-blue-400/20" },
  { id: "bg_bubblegum", slot: "bg", name: "버블검", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-pink-300/25 to-rose-300/20" },
  { id: "bg_grape", slot: "bg", name: "그레이프", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-purple-400/25 to-violet-500/20" },
  { id: "bg_lemon", slot: "bg", name: "레몬", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-yellow-200/30 to-amber-300/20" },
  { id: "bg_olive", slot: "bg", name: "올리브", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-lime-400/20 to-green-600/15" },
  { id: "bg_teal", slot: "bg", name: "틸", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-teal-300/25 to-cyan-500/20" },
  { id: "bg_cherry", slot: "bg", name: "체리", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-red-400/25 to-rose-500/20" },
  { id: "bg_indigo", slot: "bg", name: "인디고", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-indigo-400/25 to-blue-600/20" },
  { id: "bg_sand", slot: "bg", name: "샌드", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-amber-200/30 to-stone-400/15" },
  { id: "bg_pearl", slot: "bg", name: "펄", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-slate-200/20 to-stone-300/15" },
  { id: "bg_sunrise", slot: "bg", name: "선라이즈", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-orange-300/25 to-yellow-300/20" },
  { id: "bg_cloud", slot: "bg", name: "클라우드", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-sky-200/25 to-slate-300/15" },
  // ──── 배경 추가 : 유료(메시 · 고급) ────
  { id: "bg_mesh_lavender", slot: "bg", name: "메시 라벤더", desc: "번지는 라벤더 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-lavender" },
  { id: "bg_mesh_peach", slot: "bg", name: "메시 피치", desc: "번지는 복숭아빛 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-peach" },
  { id: "bg_mesh_sky", slot: "bg", name: "메시 스카이", desc: "번지는 하늘빛 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-sky" },
  { id: "bg_mesh_coral", slot: "bg", name: "메시 코랄", desc: "번지는 산호빛 메시", price: 70, rarity: "rare", grad: "cozy-bg-mesh-coral" },
  { id: "bg_mesh_emerald", slot: "bg", name: "메시 에메랄드", desc: "번지는 에메랄드 메시", price: 80, rarity: "rare", grad: "cozy-bg-mesh-emerald" },
  { id: "bg_mesh_dawn", slot: "bg", name: "메시 새벽", desc: "번지는 새벽빛 메시", price: 80, rarity: "rare", grad: "cozy-bg-mesh-dawn" },
  { id: "bg_mesh_berry", slot: "bg", name: "메시 베리", desc: "번지는 베리빛 메시", price: 80, rarity: "rare", grad: "cozy-bg-mesh-berry" },
  { id: "bg_mesh_grape", slot: "bg", name: "메시 그레이프", desc: "번지는 포도빛 메시", price: 90, rarity: "epic", grad: "cozy-bg-mesh-grape" },
  { id: "bg_mesh_fire", slot: "bg", name: "메시 파이어", desc: "타오르는 메시", price: 120, rarity: "epic", grad: "cozy-bg-mesh-fire" },
  { id: "bg_mesh_ice", slot: "bg", name: "메시 아이스", desc: "차가운 얼음 메시", price: 120, rarity: "epic", grad: "cozy-bg-mesh-ice" },
  { id: "bg_mesh_dusk", slot: "bg", name: "메시 황혼", desc: "황혼빛 메시", price: 120, rarity: "epic", grad: "cozy-bg-mesh-dusk" },
  { id: "bg_mesh_neon", slot: "bg", name: "메시 네온", desc: "쨍한 네온 메시", price: 140, rarity: "epic", grad: "cozy-bg-mesh-neon" },
  // ──── 배경 추가 : 유료(라이브/애니메이션 · 최고급) ────
  { id: "bg_mesh_fire_live", slot: "bg", name: "메시 파이어 라이브", desc: "색이 흐르는 불꽃 메시", price: 200, rarity: "epic", grad: "cozy-bg-mesh-fire cozy-bg-animate" },
  { id: "bg_mesh_berry_live", slot: "bg", name: "메시 베리 라이브", desc: "색이 흐르는 베리 메시", price: 200, rarity: "epic", grad: "cozy-bg-mesh-berry cozy-bg-animate" },
  { id: "bg_neon_flow", slot: "bg", name: "네온 플로우", desc: "흐르는 네온 그라데이션", price: 150, rarity: "epic", grad: "bg-gradient-to-br from-fuchsia-500/30 via-cyan-400/25 to-violet-500/30 animate-gradient-x bg-[length:200%_200%]" },
  { id: "bg_tropic", slot: "bg", name: "트로픽", desc: "열대빛 3색 그라데이션", price: 60, rarity: "rare", grad: "bg-gradient-to-br from-teal-300/30 via-emerald-300/20 to-amber-200/25" },
  { id: "bg_mesh_neon_live", slot: "bg", name: "메시 네온 라이브", desc: "색이 흐르는 네온 메시 (레전드)", price: 360, rarity: "legend", grad: "cozy-bg-mesh-neon cozy-bg-animate" },
  { id: "bg_mesh_dusk_live", slot: "bg", name: "메시 황혼 라이브", desc: "색이 흐르는 황혼 메시 (레전드)", price: 340, rarity: "legend", grad: "cozy-bg-mesh-dusk cozy-bg-animate" },
  { id: "bg_cosmos", slot: "bg", name: "코스모스", desc: "흐르는 우주빛 (레전드)", price: 400, rarity: "legend", grad: "bg-gradient-to-br from-indigo-700/40 via-fuchsia-600/25 to-cyan-500/30 animate-gradient-x bg-[length:200%_200%]" },

  // ──── 테두리 추가 : 무료(심플 단색 ring) ────
  { id: "frame_teal", slot: "frame", name: "틸", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-teal-400" },
  { id: "frame_indigo", slot: "frame", name: "인디고", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-indigo-400" },
  { id: "frame_amber", slot: "frame", name: "앰버", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-amber-300" },
  { id: "frame_pink", slot: "frame", name: "핑크", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-pink-400" },
  { id: "frame_slate", slot: "frame", name: "슬레이트", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-slate-400" },
  { id: "frame_green", slot: "frame", name: "그린", desc: "기본 테두리", price: 0, rarity: "normal", ring: "ring-[3px] ring-green-400" },
  { id: "frame_thin", slot: "frame", name: "심플 화이트", desc: "얇은 기본 테두리", price: 0, rarity: "normal", ring: "ring-1 ring-white dark:ring-zinc-700" },
  // ──── 테두리 추가 : 유료(글로우 ring · 레어) ────
  { id: "frame_glow_gold", slot: "frame", name: "골드 글로우", desc: "빛나는 골드", price: 60, rarity: "rare", ring: "ring-[3px] ring-amber-400 arcade-glow" },
  { id: "frame_glow_violet", slot: "frame", name: "바이올렛 글로우", desc: "빛나는 보라", price: 60, rarity: "rare", ring: "ring-[3px] ring-violet-400 arcade-glow" },
  { id: "frame_glow_rose", slot: "frame", name: "로즈 글로우", desc: "빛나는 로즈", price: 60, rarity: "rare", ring: "ring-[3px] ring-rose-400 arcade-glow" },
  { id: "frame_glow_lime", slot: "frame", name: "라임 글로우", desc: "빛나는 라임", price: 60, rarity: "rare", ring: "ring-[3px] ring-lime-400 arcade-glow" },
  // ──── 테두리 추가 : 유료(다중밴드 · 에픽) ────
  { id: "frame_ocean", slot: "frame", name: "오션 밴드", desc: "하늘·블루 밴드 + 글로우", price: 130, rarity: "epic", ring: "cozy-frame-ocean" },
  { id: "frame_sunset", slot: "frame", name: "선셋 밴드", desc: "오렌지·로즈 밴드 + 글로우", price: 130, rarity: "epic", ring: "cozy-frame-sunset" },
  { id: "frame_emerald", slot: "frame", name: "에메랄드 밴드", desc: "에메랄드·틸 밴드 + 글로우", price: 130, rarity: "epic", ring: "cozy-frame-emerald" },
  { id: "frame_violet_band", slot: "frame", name: "바이올렛 밴드", desc: "보라·자홍 밴드 + 글로우", price: 140, rarity: "epic", ring: "cozy-frame-violet" },
  { id: "frame_rose_band", slot: "frame", name: "로즈 밴드", desc: "로즈·핑크 밴드 + 글로우", price: 130, rarity: "epic", ring: "cozy-frame-rose" },
  { id: "frame_forest", slot: "frame", name: "포레스트 밴드", desc: "초록 2중 밴드 + 글로우", price: 120, rarity: "epic", ring: "cozy-frame-forest" },
  // ──── 테두리 추가 : 유료(프리미엄 · 레전드) ────
  { id: "frame_royal", slot: "frame", name: "로열", desc: "남보라 프리미엄 밴드", price: 320, rarity: "legend", ring: "cozy-frame-royal" },
  { id: "frame_ember", slot: "frame", name: "엠버", desc: "타오르는 프리미엄 밴드", price: 360, rarity: "legend", ring: "cozy-frame-ember" },
  { id: "frame_cyber", slot: "frame", name: "사이버", desc: "사이안·자홍 프리미엄 밴드", price: 380, rarity: "legend", ring: "cozy-frame-cyber" },
  { id: "frame_galaxy", slot: "frame", name: "갤럭시", desc: "은하빛 프리미엄 밴드", price: 420, rarity: "legend", ring: "cozy-frame-galaxy" },

  // ──── 이름 효과 추가 : 무료(단색 · 심플) ────
  { id: "name_red", slot: "nameEffect", name: "레드", desc: "단색 이름", price: 0, rarity: "normal", nameClass: "text-rose-500" },
  { id: "name_blue", slot: "nameEffect", name: "블루", desc: "단색 이름", price: 0, rarity: "normal", nameClass: "text-sky-500" },
  { id: "name_green", slot: "nameEffect", name: "그린", desc: "단색 이름", price: 0, rarity: "normal", nameClass: "text-emerald-500" },
  { id: "name_purple", slot: "nameEffect", name: "퍼플", desc: "단색 이름", price: 0, rarity: "normal", nameClass: "text-violet-500" },
  { id: "name_pink", slot: "nameEffect", name: "핑크", desc: "단색 이름", price: 0, rarity: "normal", nameClass: "text-pink-500" },
  // ──── 이름 효과 추가 : 유료(그라데이션/글로우/애니 · 고급) ────
  { id: "name_sakura", slot: "nameEffect", name: "사쿠라", desc: "벚꽃빛 그라데이션", price: 80, rarity: "rare", nameClass: "name-sakura" },
  { id: "name_frost", slot: "nameEffect", name: "프로스트", desc: "서리빛 그라데이션", price: 90, rarity: "rare", nameClass: "name-frost" },
  { id: "name_bubblegum", slot: "nameEffect", name: "버블검", desc: "달콤한 파스텔 그라데이션", price: 80, rarity: "rare", nameClass: "name-bubblegum" },
  { id: "name_aurora", slot: "nameEffect", name: "오로라", desc: "오로라빛 그라데이션", price: 160, rarity: "epic", nameClass: "name-aurora" },
  { id: "name_galaxy", slot: "nameEffect", name: "갤럭시", desc: "은하빛 그라데이션", price: 160, rarity: "epic", nameClass: "name-galaxy" },
  { id: "name_sunset", slot: "nameEffect", name: "선셋", desc: "노을빛 그라데이션", price: 150, rarity: "epic", nameClass: "name-sunset" },
  { id: "name_toxic", slot: "nameEffect", name: "톡식", desc: "독성 그린 그라데이션", price: 140, rarity: "epic", nameClass: "name-toxic" },
  { id: "name_royal", slot: "nameEffect", name: "로열", desc: "남보라 그라데이션", price: 160, rarity: "epic", nameClass: "name-royal" },
  { id: "name_cyber", slot: "nameEffect", name: "사이버", desc: "사이안·자홍 그라데이션", price: 150, rarity: "epic", nameClass: "name-cyber" },
  { id: "name_ember", slot: "nameEffect", name: "엠버", desc: "흐르며 타오르는 불꽃 (애니)", price: 300, rarity: "legend", nameClass: "name-ember" },
  { id: "name_galaxy_live", slot: "nameEffect", name: "갤럭시 라이브", desc: "흐르는 은하빛 (애니)", price: 340, rarity: "legend", nameClass: "name-galaxy-live" },

  // ──── 배너 효과 추가 : 유료 ────
  { id: "fx_rain", slot: "bannerEffect", name: "빗방울", desc: "비가 내려요", price: 70, rarity: "rare", fx: "rain", emoji: "💧" },
  { id: "fx_clover", slot: "bannerEffect", name: "네잎클로버", desc: "행운의 클로버", price: 70, rarity: "rare", fx: "clover", emoji: "🍀" },
  { id: "fx_autumn", slot: "bannerEffect", name: "낙엽", desc: "가을 낙엽이 져요", price: 70, rarity: "rare", fx: "autumn", emoji: "🍁" },
  { id: "fx_flower", slot: "bannerEffect", name: "꽃비", desc: "꽃이 흩날려요", price: 80, rarity: "rare", fx: "flower", emoji: "🌷" },
  { id: "fx_gift", slot: "bannerEffect", name: "선물", desc: "선물이 쏟아져요", price: 80, rarity: "rare", fx: "gift", emoji: "🎁" },
  { id: "fx_balloon", slot: "bannerEffect", name: "풍선", desc: "풍선이 떠올라요", price: 80, rarity: "rare", fx: "balloon", emoji: "🎈" },
  { id: "fx_candy_rain", slot: "bannerEffect", name: "캔디비", desc: "사탕이 쏟아져요", price: 110, rarity: "epic", fx: "candy", emoji: "🍭" },
  { id: "fx_fire", slot: "bannerEffect", name: "불꽃", desc: "불꽃이 피어올라요", price: 120, rarity: "epic", fx: "fire", emoji: "🔥" },
  { id: "fx_ghost", slot: "bannerEffect", name: "유령", desc: "유령이 둥실둥실", price: 110, rarity: "epic", fx: "ghost", emoji: "👻" },
  { id: "fx_butterfly", slot: "bannerEffect", name: "나비", desc: "나비가 날아올라요", price: 110, rarity: "epic", fx: "butterfly", emoji: "🦋" },
  { id: "fx_lightning", slot: "bannerEffect", name: "번개", desc: "번쩍이는 번개", price: 120, rarity: "epic", fx: "lightning", emoji: "⚡" },
  { id: "fx_diamond", slot: "bannerEffect", name: "다이아", desc: "반짝이는 보석 (레전드)", price: 200, rarity: "legend", fx: "diamond", emoji: "💎" },

  // ──── 칭호 추가 ────
  { id: "title_dreamer", slot: "title", name: "몽상가", desc: "이름 아래 칭호", price: 50, rarity: "rare", text: "💭 몽상가" },
  { id: "title_cat", slot: "title", name: "집사", desc: "이름 아래 칭호", price: 50, rarity: "rare", text: "🐱 집사" },
  { id: "title_dog", slot: "title", name: "댕댕이", desc: "이름 아래 칭호", price: 50, rarity: "rare", text: "🐶 댕댕이" },
  { id: "title_bookworm", slot: "title", name: "책벌레", desc: "이름 아래 칭호", price: 50, rarity: "rare", text: "📚 책벌레" },
  { id: "title_gardener", slot: "title", name: "정원사", desc: "이름 아래 칭호", price: 50, rarity: "rare", text: "🌱 정원사" },
  { id: "title_chef", slot: "title", name: "요리왕", desc: "이름 아래 칭호", price: 60, rarity: "rare", text: "🍳 요리왕" },
  { id: "title_traveler", slot: "title", name: "여행자", desc: "이름 아래 칭호", price: 60, rarity: "rare", text: "✈️ 여행자" },
  { id: "title_photographer", slot: "title", name: "사진가", desc: "이름 아래 칭호", price: 60, rarity: "rare", text: "📷 사진가" },
  { id: "title_musician", slot: "title", name: "음악가", desc: "이름 아래 칭호", price: 60, rarity: "rare", text: "🎼 음악가" },
  { id: "title_athlete", slot: "title", name: "운동인", desc: "이름 아래 칭호", price: 60, rarity: "rare", text: "🏃 운동인" },
  { id: "title_genius", slot: "title", name: "천재", desc: "이름 아래 칭호", price: 150, rarity: "epic", text: "🧠 천재" },
  { id: "title_wizard", slot: "title", name: "마법사", desc: "이름 아래 칭호", price: 150, rarity: "epic", text: "🧙 마법사" },
  { id: "title_captain", slot: "title", name: "캡틴", desc: "이름 아래 칭호", price: 150, rarity: "epic", text: "⚓ 캡틴" },
  { id: "title_pro", slot: "title", name: "프로", desc: "이름 아래 칭호", price: 150, rarity: "epic", text: "🎖️ 프로" },
  { id: "title_ninja", slot: "title", name: "닌자", desc: "이름 아래 칭호", price: 160, rarity: "epic", text: "🥷 닌자" },
  { id: "title_angel", slot: "title", name: "천사", desc: "이름 아래 칭호", price: 170, rarity: "epic", text: "😇 천사" },
  { id: "title_devil", slot: "title", name: "악동", desc: "이름 아래 칭호", price: 170, rarity: "epic", text: "😈 악동" },
  { id: "title_robot", slot: "title", name: "AI 마스터", desc: "이름 아래 칭호", price: 180, rarity: "epic", text: "🤖 AI 마스터" },
  { id: "title_diamond", slot: "title", name: "다이아", desc: "이름 아래 칭호", price: 200, rarity: "epic", text: "💎 다이아" },
  { id: "title_crown", slot: "title", name: "황제", desc: "최정상의 칭호 (레전드)", price: 600, rarity: "legend", text: "👑 황제" },
  { id: "title_phoenix", slot: "title", name: "불사조", desc: "전설의 칭호 (레전드)", price: 650, rarity: "legend", text: "🔥 불사조" },
  { id: "title_dragon", slot: "title", name: "드래곤", desc: "전설의 칭호 (레전드)", price: 700, rarity: "legend", text: "🐉 드래곤" },
  { id: "title_god", slot: "title", name: "갓", desc: "최고의 칭호 (레전드)", price: 800, rarity: "legend", text: "⚡ 갓" },

  // ──── 스티커 추가 : 유료 ────
  { id: "st_hamster", slot: "sticker", name: "햄스터", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🐹" },
  { id: "st_chick", slot: "sticker", name: "병아리", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🐥" },
  { id: "st_bee", slot: "sticker", name: "꿀벌", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🐝" },
  { id: "st_ladybug", slot: "sticker", name: "무당벌레", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🐞" },
  { id: "st_hedgehog", slot: "sticker", name: "고슴도치", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🦔" },
  { id: "st_giraffe", slot: "sticker", name: "기린", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🦒" },
  { id: "st_octopus", slot: "sticker", name: "문어", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🐙" },
  { id: "st_crab", slot: "sticker", name: "게", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🦀" },
  { id: "st_dolphin", slot: "sticker", name: "돌고래", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🐬" },
  { id: "st_fish", slot: "sticker", name: "열대어", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🐠" },
  { id: "st_shark", slot: "sticker", name: "상어", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🦈" },
  { id: "st_lizard", slot: "sticker", name: "도마뱀", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🦎" },
  { id: "st_parrot", slot: "sticker", name: "앵무새", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🦜" },
  { id: "st_swan", slot: "sticker", name: "백조", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🦢" },
  { id: "st_flamingo", slot: "sticker", name: "플라밍고", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🦩" },
  { id: "st_dragon", slot: "sticker", name: "드래곤", desc: "배너 스티커", price: 40, rarity: "epic", emoji: "🐲" },
  { id: "st_cactus", slot: "sticker", name: "선인장", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🌵" },
  { id: "st_palm", slot: "sticker", name: "야자수", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🌴" },
  { id: "st_lotus", slot: "sticker", name: "연꽃", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🪷" },
  { id: "st_maple", slot: "sticker", name: "단풍", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍁" },
  { id: "st_grape2", slot: "sticker", name: "포도", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍇" },
  { id: "st_kiwi", slot: "sticker", name: "키위", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🥝" },
  { id: "st_peach", slot: "sticker", name: "복숭아", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍑" },
  { id: "st_pineapple", slot: "sticker", name: "파인애플", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🍍" },
  { id: "st_coconut", slot: "sticker", name: "코코넛", desc: "배너 스티커", price: 20, rarity: "rare", emoji: "🥥" },
  { id: "st_burger", slot: "sticker", name: "버거", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🍔" },
  { id: "st_pizza", slot: "sticker", name: "피자", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🍕" },
  { id: "st_icecream", slot: "sticker", name: "아이스크림", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🍦" },
  { id: "st_shaved_ice", slot: "sticker", name: "빙수", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🍧" },
  { id: "st_pudding", slot: "sticker", name: "푸딩", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🍮" },
  { id: "st_coffee", slot: "sticker", name: "커피", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "☕" },
  { id: "st_bubbletea", slot: "sticker", name: "버블티", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🧋" },
  { id: "st_xmas", slot: "sticker", name: "크리스마스", desc: "배너 스티커", price: 35, rarity: "epic", emoji: "🎄" },
  { id: "st_pumpkin", slot: "sticker", name: "호박", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🎃" },
  { id: "st_kite", slot: "sticker", name: "연", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🎏" },
  { id: "st_pinata", slot: "sticker", name: "피냐타", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🪅" },
  { id: "st_dice", slot: "sticker", name: "주사위", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🎲" },
  { id: "st_dart", slot: "sticker", name: "다트", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🎯" },
  { id: "st_disco", slot: "sticker", name: "디스코볼", desc: "배너 스티커", price: 35, rarity: "epic", emoji: "🪩" },
  { id: "st_letter", slot: "sticker", name: "러브레터", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "💌" },
  { id: "st_crystal", slot: "sticker", name: "수정구", desc: "배너 스티커", price: 35, rarity: "epic", emoji: "🔮" },
  { id: "st_wand", slot: "sticker", name: "마법봉", desc: "배너 스티커", price: 35, rarity: "epic", emoji: "🪄" },
  { id: "st_hibiscus", slot: "sticker", name: "히비스커스", desc: "배너 스티커", price: 25, rarity: "rare", emoji: "🌺" },
  { id: "st_dove", slot: "sticker", name: "비둘기", desc: "배너 스티커", price: 30, rarity: "epic", emoji: "🕊️" },

  // ──── 미니룸 소품 스티커 (홈 꾸미기 감성) ────
  { id: "st_plant", slot: "sticker", name: "화분", desc: "소품 스티커", price: 20, rarity: "rare", emoji: "🪴" },
  { id: "st_sofa", slot: "sticker", name: "소파", desc: "소품 스티커", price: 30, rarity: "rare", emoji: "🛋️" },
  { id: "st_chair", slot: "sticker", name: "의자", desc: "소품 스티커", price: 25, rarity: "rare", emoji: "🪑" },
  { id: "st_candle", slot: "sticker", name: "양초", desc: "소품 스티커", price: 20, rarity: "rare", emoji: "🕯️" },
  { id: "st_pic", slot: "sticker", name: "액자", desc: "소품 스티커", price: 25, rarity: "rare", emoji: "🖼️" },
  { id: "st_lamp", slot: "sticker", name: "램프", desc: "소품 스티커", price: 20, rarity: "rare", emoji: "💡" },
  { id: "st_window", slot: "sticker", name: "창문", desc: "소품 스티커", price: 25, rarity: "rare", emoji: "🪟" },
  { id: "st_clock", slot: "sticker", name: "시계", desc: "소품 스티커", price: 25, rarity: "rare", emoji: "🕰️" },
  { id: "st_books", slot: "sticker", name: "책더미", desc: "소품 스티커", price: 20, rarity: "rare", emoji: "📚" },
  { id: "st_tv", slot: "sticker", name: "티비", desc: "소품 스티커", price: 30, rarity: "rare", emoji: "📺" },
  { id: "st_bed", slot: "sticker", name: "침대", desc: "소품 스티커", price: 30, rarity: "rare", emoji: "🛏️" },
  { id: "st_mirror", slot: "sticker", name: "거울", desc: "소품 스티커", price: 25, rarity: "rare", emoji: "🪞" },

  // ════════ 펫 / 캐릭터 (pet) — 배너에 머무는 나만의 친구 ════════
  // 무료
  { id: "pet_cat", slot: "pet", name: "고양이", desc: "코지홈 단짝 펫", price: 0, rarity: "normal", emoji: "🐱" },
  { id: "pet_dog", slot: "pet", name: "강아지", desc: "코지홈 단짝 펫", price: 0, rarity: "normal", emoji: "🐶" },
  { id: "pet_chick", slot: "pet", name: "병아리", desc: "코지홈 단짝 펫", price: 0, rarity: "normal", emoji: "🐥" },
  // 레어
  { id: "pet_rabbit", slot: "pet", name: "토끼", desc: "코지홈 단짝 펫", price: 40, rarity: "rare", emoji: "🐰" },
  { id: "pet_fox", slot: "pet", name: "여우", desc: "코지홈 단짝 펫", price: 40, rarity: "rare", emoji: "🦊" },
  { id: "pet_panda", slot: "pet", name: "판다", desc: "코지홈 단짝 펫", price: 45, rarity: "rare", emoji: "🐼" },
  { id: "pet_hamster", slot: "pet", name: "햄스터", desc: "코지홈 단짝 펫", price: 35, rarity: "rare", emoji: "🐹" },
  { id: "pet_penguin", slot: "pet", name: "펭귄", desc: "코지홈 단짝 펫", price: 40, rarity: "rare", emoji: "🐧" },
  { id: "pet_turtle", slot: "pet", name: "거북이", desc: "코지홈 단짝 펫", price: 35, rarity: "rare", emoji: "🐢" },
  { id: "pet_frog", slot: "pet", name: "개구리", desc: "코지홈 단짝 펫", price: 35, rarity: "rare", emoji: "🐸" },
  { id: "pet_hedgehog", slot: "pet", name: "고슴도치", desc: "코지홈 단짝 펫", price: 40, rarity: "rare", emoji: "🦔" },
  { id: "pet_koala", slot: "pet", name: "코알라", desc: "코지홈 단짝 펫", price: 45, rarity: "rare", emoji: "🐨" },
  { id: "pet_raccoon", slot: "pet", name: "너구리", desc: "코지홈 단짝 펫", price: 40, rarity: "rare", emoji: "🦝" },
  { id: "pet_bear", slot: "pet", name: "곰", desc: "코지홈 단짝 펫", price: 40, rarity: "rare", emoji: "🐻" },
  { id: "pet_pig", slot: "pet", name: "돼지", desc: "코지홈 단짝 펫", price: 35, rarity: "rare", emoji: "🐷" },
  { id: "pet_butterfly", slot: "pet", name: "나비요정", desc: "코지홈 단짝 펫", price: 45, rarity: "rare", emoji: "🦋" },
  // 에픽
  { id: "pet_owl", slot: "pet", name: "부엉이", desc: "코지홈 단짝 펫", price: 100, rarity: "epic", emoji: "🦉" },
  { id: "pet_lion", slot: "pet", name: "사자", desc: "코지홈 단짝 펫", price: 120, rarity: "epic", emoji: "🦁" },
  { id: "pet_tiger", slot: "pet", name: "호랑이", desc: "코지홈 단짝 펫", price: 120, rarity: "epic", emoji: "🐯" },
  { id: "pet_octopus", slot: "pet", name: "문어", desc: "코지홈 단짝 펫", price: 90, rarity: "epic", emoji: "🐙" },
  { id: "pet_dolphin", slot: "pet", name: "돌고래", desc: "코지홈 단짝 펫", price: 100, rarity: "epic", emoji: "🐬" },
  { id: "pet_whale", slot: "pet", name: "고래", desc: "코지홈 단짝 펫", price: 110, rarity: "epic", emoji: "🐳" },
  { id: "pet_ghost", slot: "pet", name: "꼬마 유령", desc: "코지홈 단짝 펫", price: 90, rarity: "epic", emoji: "👻" },
  { id: "pet_robot", slot: "pet", name: "로봇", desc: "코지홈 단짝 펫", price: 130, rarity: "epic", emoji: "🤖" },
  { id: "pet_teddy", slot: "pet", name: "곰인형", desc: "코지홈 단짝 펫", price: 90, rarity: "epic", emoji: "🧸" },
  { id: "pet_polar", slot: "pet", name: "북극곰", desc: "코지홈 단짝 펫", price: 100, rarity: "epic", emoji: "🐻‍❄️" },
  // 레전드
  { id: "pet_unicorn", slot: "pet", name: "유니콘", desc: "전설의 펫", price: 300, rarity: "legend", emoji: "🦄" },
  { id: "pet_dragon", slot: "pet", name: "드래곤", desc: "전설의 펫", price: 450, rarity: "legend", emoji: "🐉" },
  { id: "pet_dino", slot: "pet", name: "공룡", desc: "전설의 펫", price: 380, rarity: "legend", emoji: "🦕" },
  { id: "pet_alien", slot: "pet", name: "외계친구", desc: "전설의 펫", price: 320, rarity: "legend", emoji: "👾" },
];

// ─── 무료 배너 스티커(이모지) — 코지홈 기본 제공(보유 불필요) ──────────
export const FREE_STICKERS = ["⭐", "🍊", "🐾", "🌸", "🎀", "🔥", "💎", "🍭", "🦊", "🌟", "👑", "🍀", "🤖", "💛", "🌈", "🎮", "😀", "😍", "🥳", "😎", "🤩", "👍", "✌️", "🎵", "🍰", "🐣", "🌞", "💕"];

// ─── 인덱스 & 헬퍼 ─────────────────────────────────────────────
function key(slot: ItemSlot, id: string): string {
  return `${slot}:${id}`;
}
const BY_KEY: Record<string, ShopItem> = {};
for (const it of SHOP_ITEMS) BY_KEY[key(it.slot, it.id)] = it;

/** 구매/보유 전역 키 (slot::id). ownedItems 에 이 형태로 저장 */
export function itemKey(slot: ItemSlot, id: string): string {
  return `${slot}::${id}`;
}

export function itemsBySlot(slot: ItemSlot): ShopItem[] {
  return SHOP_ITEMS.filter((i) => i.slot === slot);
}

export function getItem(slot: ItemSlot, id: string): ShopItem | undefined {
  return BY_KEY[key(slot, id)];
}

export function isFreeItem(slot: ItemSlot, id: string): boolean {
  const it = getItem(slot, id);
  return !it || it.price === 0;
}

// ── 렌더 리졸버 (없는 id 는 안전하게 기본값) ──
export function bgGradOf(id: string): string {
  return getItem("bg", id)?.grad || itemsBySlot("bg")[0].grad || "";
}
export function frameRingOf(id: string): string {
  return getItem("frame", id)?.ring || "ring-2 ring-white dark:ring-zinc-900";
}
export function nameClassOf(id: string): string {
  return getItem("nameEffect", id)?.nameClass || "";
}
export function bannerFxOf(id: string): string {
  return getItem("bannerEffect", id)?.fx || "none";
}
export function petEmojiOf(id: string): string {
  return getItem("pet", id)?.emoji || "";
}

/** 무료(기본) 아이템 + 보유한 프리미엄 아이템만 반환 (장착 가능 목록) */
export function ownableForSlot(slot: ItemSlot, owned: string[]): ShopItem[] {
  const ownedSet = new Set(owned);
  return itemsBySlot(slot).filter((i) => i.price === 0 || ownedSet.has(itemKey(i.slot, i.id)));
}
