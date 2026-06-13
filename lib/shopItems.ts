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

export type ItemSlot = "bg" | "frame" | "nameEffect" | "bannerEffect" | "title" | "sticker";
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
  normal: { label: "노멀", color: "#9ca3af", badge: "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400" },
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
  { id: "mono", slot: "bg", name: "모노", desc: "기본 배경", price: 0, rarity: "normal", grad: "bg-gradient-to-br from-neutral-400/15 to-neutral-600/10" },
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
];

// ─── 무료 배너 스티커(이모지) — 코지홈 기본 제공(보유 불필요) ──────────
export const FREE_STICKERS = ["⭐", "🍊", "🐾", "🌸", "🎀", "🔥", "💎", "🍭", "🦊", "🌟", "👑", "🍀", "🤖", "💛", "🌈", "🎮"];

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

/** 무료(기본) 아이템 + 보유한 프리미엄 아이템만 반환 (장착 가능 목록) */
export function ownableForSlot(slot: ItemSlot, owned: string[]): ShopItem[] {
  const ownedSet = new Set(owned);
  return itemsBySlot(slot).filter((i) => i.price === 0 || ownedSet.has(itemKey(i.slot, i.id)));
}
