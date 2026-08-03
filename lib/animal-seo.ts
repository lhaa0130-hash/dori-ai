// 동물 상세 페이지의 '찍어낸 티' 제거 전용 헬퍼.
//
// 배경: 1,205개 카드가 본문 205~281자, 사실 정확히 3개, 정보표 5칸(서식지·먹이·몸길이·몸무게·수명)으로
// 완전히 동일한 틀이었다. 제목도 전부 `{이름} — 특징·서식지·먹이·수명`이라 뒷부분이 1,205개 똑같았다.
// 구글이 대량 생성 페이지로 읽기 딱 좋은 모양이고, 실제로 1,001개가 '발견됨 – 색인 생성되지 않음'이다.
//
// 방침: 없는 사실을 지어내 다양성을 만들지 않는다. 카드가 이미 가진 데이터만 쓴다.
//  - search_nickname: 1,205개 전부 존재, 1,182개 고유. 지금까지 화면에 한 번도 안 쓰였다.
//  - filters: 먹이·색·크기·서식지·행동·몸·지역 등 11종. 목록 필터 UI에만 쓰고 상세엔 없었다.
// 이 둘을 끌어올리면 표현이 아니라 내용 자체가 동물마다 달라진다.

import type { AnimalCard } from "@/app/animal/page.client";

// 보전상태가 이 등급이면 제목에 함께 드러낸다(실제로 검색되는 정보이자 카드마다 다른 값).
const THREATENED = new Set(["CR", "EN", "VU"]);

function first(card: AnimalCard, key: string): string | undefined {
  const v = card.filters?.[key];
  return Array.isArray(v) && v.length ? v[0] : undefined;
}

/** info 표에서 라벨로 값 찾기 (예: "수명" → "평균 5~7년") */
function infoValue(card: AnimalCard, label: string): string | undefined {
  const row = (card.info || []).find((r) => r[1] === label);
  return row?.[2];
}

/**
 * 제목 — 카드마다 다른 별명을 앞세운다.
 * 예) 안데스콘도르 — 안데스 하늘의 왕
 *     매너티 — 바다의 느긋한 초식 포유류   (별명이 없을 때의 대체 경로)
 * 멸종위기 등급이면 뒤에 붙여 같은 별명끼리도 갈라준다.
 */
export function buildAnimalTitle(card: AnimalCard): string {
  const name = card.animal_name;
  const nick = card.search_nickname?.trim();
  const status = card.status?.code;

  // 별명이 없는 예외 카드용 — filters 조합으로 사실만 써서 만든다.
  const habitat = first(card, "habitat");
  const diet = first(card, "diet");
  const taxo = first(card, "taxonomy");
  const fallback = [habitat && `${habitat}에 사는`, diet, taxo].filter(Boolean).join(" ");

  const head = nick || fallback;
  const base = head ? `${name} — ${head}` : name;

  if (status && THREATENED.has(status) && card.status?.label) {
    return `${base} · ${card.status.label}`;
  }
  return base;
}

/**
 * 설명 — 붙박이 문구를 쓰지 않는다.
 * 별명 + 그 동물만의 소개글 + 실제 수치로 채워 카드마다 완전히 다른 문장이 나오게 한다.
 */
export function buildAnimalDescription(card: AnimalCard): string {
  const nick = card.search_nickname?.trim();
  const desc = (card.kid_friendly_desc || "").replace(/\s+/g, " ").trim();

  // 뒤에 붙일 수치 — 카드마다 값이 다르므로 보일러플레이트가 되지 않는다.
  const nums = [
    infoValue(card, "몸길이") && `몸길이 ${infoValue(card, "몸길이")!.replace(/^몸길이\s*/, "")}`,
    infoValue(card, "수명") && `수명 ${infoValue(card, "수명")}`,
  ].filter(Boolean) as string[];

  const parts = [nick, desc, nums.length ? nums.join(", ") + "." : ""].filter(Boolean);
  const out = parts.join(" · ").replace(/\s+/g, " ").trim();
  return out.length > 158 ? out.slice(0, 157).trimEnd() + "…" : out;
}

/** 키워드 — 카드 자신의 속성에서 뽑아 동물마다 다르게 만든다. */
export function buildAnimalKeywords(card: AnimalCard): string[] {
  const name = card.animal_name;
  return [
    name,
    card.search_nickname,
    `${name} 특징`,
    `${name} 수명`,
    `${name} 서식지`,
    `${name} 먹이`,
    `${name} 크기`,
    card.en,
    card.sci,
    first(card, "taxonomy"),
    first(card, "habitat"),
    "몽글로 : 동물도감",
  ].filter(Boolean) as string[];
}

// ── 분류군별 화면 구성 ────────────────────────────────────────────────
// 8개 분류군(포유류·조류·파충류·어류·양서류·곤충·갑각류·연체동물)이 각 150종씩 고르게 있다.
// 소제목 문구와 아이콘을 분류군에 맞춰 갈라, 8종류의 서로 다른 지면이 되게 한다.
type TaxonProfile = {
  glance: string;
  feature: string;
  facts: string;
  related: string;
  habitatPeers: string;
};

const TAXON: Record<string, TaxonProfile> = {
  포유류:   { glance: "🐾 한눈에 보기", feature: "✨ 이 동물의 강점",   facts: "🔎 알고 보면 놀라운 점", related: "🐾 비슷한 포유류",   habitatPeers: "🌍 같은 곳에 사는 동물" },
  조류:     { glance: "🪶 한눈에 보기", feature: "✨ 이 새의 강점",     facts: "🔎 이 새의 놀라운 점",   related: "🪶 비슷한 새",       habitatPeers: "🌍 같은 하늘·같은 땅의 동물" },
  파충류:   { glance: "🦎 한눈에 보기", feature: "✨ 이 파충류의 강점", facts: "🔎 알고 보면 놀라운 점", related: "🦎 비슷한 파충류",   habitatPeers: "🌍 같은 곳에 사는 동물" },
  어류:     { glance: "🐟 한눈에 보기", feature: "✨ 이 물고기의 강점", facts: "🔎 물속에서 벌어지는 일", related: "🐟 비슷한 물고기",  habitatPeers: "🌊 같은 물에 사는 동물" },
  양서류:   { glance: "🐸 한눈에 보기", feature: "✨ 이 양서류의 강점", facts: "🔎 알고 보면 놀라운 점", related: "🐸 비슷한 양서류",   habitatPeers: "🌍 같은 곳에 사는 동물" },
  곤충:     { glance: "🐛 한눈에 보기", feature: "✨ 이 곤충의 강점",   facts: "🔎 작지만 대단한 점",    related: "🐛 비슷한 곤충",     habitatPeers: "🌍 같은 곳에 사는 동물" },
  갑각류:   { glance: "🦀 한눈에 보기", feature: "✨ 이 갑각류의 강점", facts: "🔎 껍데기 속 이야기",    related: "🦀 비슷한 갑각류",   habitatPeers: "🌊 같은 물에 사는 동물" },
  연체동물: { glance: "🐚 한눈에 보기", feature: "✨ 이 동물의 강점",   facts: "🔎 알고 보면 놀라운 점", related: "🐚 비슷한 연체동물", habitatPeers: "🌊 같은 물에 사는 동물" },
};

const TAXON_DEFAULT: TaxonProfile = {
  glance: "🐾 한눈에 보기", feature: "✨ 핵심 특징", facts: "🔎 재미있는 사실",
  related: "🐾 관련 동물", habitatPeers: "🌍 같은 곳에 사는 동물",
};

export function taxonProfile(card: AnimalCard): TaxonProfile {
  const t = first(card, "taxonomy");
  return (t && TAXON[t]) || TAXON_DEFAULT;
}

// ── 한눈에 보기 ──────────────────────────────────────────────────────
// filters에 이미 있는데 상세 페이지엔 한 번도 안 나오던 속성들. 동물마다 조합이 달라
// 표 자체가 서로 다른 내용이 된다. 몸길이·몸무게는 위 정보표와 겹쳐 제외한다.
const GLANCE_FIELDS: { key: string; label: string }[] = [
  { key: "habitat",  label: "사는 곳" },
  { key: "region",   label: "사는 지역" },
  { key: "diet",     label: "먹이 습성" },
  { key: "size",     label: "크기 견주기" },
  { key: "body",     label: "몸 생김새" },
  { key: "behavior", label: "사는 방식" },
  { key: "color",    label: "몸 색" },
  { key: "feature",  label: "두드러진 점" },
];

export function buildGlanceRows(card: AnimalCard): { label: string; values: string[] }[] {
  return GLANCE_FIELDS.map(({ key, label }) => ({
    label,
    values: (card.filters?.[key] || []).filter(Boolean),
  })).filter((r) => r.values.length > 0);
}

// ── 내부 링크 ────────────────────────────────────────────────────────

/** 분류군·먹이가 겹치는 동물 (기존 '관련 동물' 로직) */
export function pickRelated(card: AnimalCard, all: AnimalCard[], limit = 8): AnimalCard[] {
  const myTax = first(card, "taxonomy");
  const myDiet = card.filters?.diet || [];
  return all
    .filter((c) => c.no && c.no !== card.no && c.image_path)
    .map((c) => {
      let score = 0;
      if (myTax && (c.filters?.taxonomy || []).includes(myTax)) score += 2;
      score += (c.filters?.diet || []).filter((d) => myDiet.includes(d)).length;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}

/**
 * 같은 서식지에 사는 '다른 분류군' 동물 — 관련 동물과 일부러 겹치지 않게 고른다.
 * 페이지마다 링크 묶음이 달라지고, 분류군을 가로지르는 연결이 생겨 크롤러 이동 경로가 넓어진다.
 */
export function pickHabitatPeers(
  card: AnimalCard,
  all: AnimalCard[],
  exclude: AnimalCard[],
  limit = 6
): AnimalCard[] {
  const myHabitat = card.filters?.habitat || [];
  if (!myHabitat.length) return [];
  const myTax = first(card, "taxonomy");
  const taken = new Set(exclude.map((c) => c.no));
  return all
    .filter(
      (c) =>
        c.no &&
        c.no !== card.no &&
        c.image_path &&
        !taken.has(c.no) &&
        (c.filters?.taxonomy || [])[0] !== myTax &&
        (c.filters?.habitat || []).some((h) => myHabitat.includes(h))
    )
    .slice(0, limit);
}
