// data/animal-cards.en.json 생성기 — /en/animal 영어판용 번역 오버레이.
//
// 원칙: 창작(허위 정보) 금지. 기계적으로 안전하게 영어화할 수 있는 값만 생성한다.
//   · name       = 카드의 en(영문 일반명) 타이틀케이스
//   · statusLabel= IUCN 코드 → 공식 영문 명칭(LC→Least Concern …)
//   · info.서식지 = filters.habitat + filters.region 태그(닫힌 어휘)를 영어로
//   · info.먹이   = filters.diet 태그(닫힌 어휘)를 영어로
//   · info.몸길이/몸무게/수명 = 한글 문장에서 숫자+단위만 추출("36~43cm" → "36–43 cm")
//   · nickname/desc = scripts/animal-en-overrides.json 의 손번역만(없으면 생략 → 페이지에서 우아하게 degrade)
// 대상: Firestore animalReview/status 의 approved + 최근 100종.
//
// 실행: node scripts/build-animal-en.mjs
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "animal-cards.json"), "utf8"));
const overrides = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "animal-en-overrides.json"), "utf8"));

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dori-ai-0130";

function fetchApproved() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/animalReview/status`;
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            const j = JSON.parse(body);
            resolve((j.fields?.approved?.arrayValue?.values || []).map((v) => v.stringValue));
          } catch {
            resolve([]);
          }
        });
      })
      .on("error", () => resolve([]));
  });
}

// ── 닫힌 어휘 사전 ────────────────────────────────────────────────
const STATUS_EN = {
  LC: "Least Concern",
  NT: "Near Threatened",
  VU: "Vulnerable",
  EN: "Endangered",
  CR: "Critically Endangered",
  EW: "Extinct in the Wild",
  EX: "Extinct",
  DD: "Data Deficient",
  NE: "Not Evaluated",
};
const HABITAT_EN = {
  "초원": "Grassland",
  "강·호수": "Rivers & lakes",
  "극지방": "Polar regions",
  "사막": "Desert",
  "도시 근처": "Near cities",
  "열대우림": "Rainforest",
  "바다": "Ocean",
  "동굴": "Caves",
};
const REGION_EN = {
  "아시아": "Asia",
  "아프리카": "Africa",
  "유럽": "Europe",
  "북아메리카": "North America",
  "남아메리카": "South America",
  "오세아니아": "Oceania",
  "태평양": "Pacific Ocean",
  "대서양": "Atlantic Ocean",
  "인도양": "Indian Ocean",
  "북극해": "Arctic Ocean",
  "남극해": "Southern Ocean",
};
const DIET_EN = {
  "초식": "Herbivore",
  "육식": "Carnivore",
  "잡식": "Omnivore",
  "곤충을 먹는": "Insectivore",
  "물고기를 먹는": "Fish eater",
  "플랑크톤을 먹는": "Plankton feeder",
  "꿀을 먹는": "Nectar feeder",
  "씨앗을 먹는": "Seed eater",
  "썩은 것 먹는": "Scavenger",
};

// ── 숫자+단위 추출 ────────────────────────────────────────────────
const UNIT_EN = { cm: "cm", mm: "mm", m: "m", km: "km", kg: "kg", g: "g", mg: "mg", t: "t", "톤": "t" };
const NUM = "\\d+(?:[.,]\\d+)?";

function sizeValue(text, units) {
  if (!text) return "";
  const alt = units.join("|");
  const re = new RegExp(`(${NUM})\\s*(?:[~\\-–∼]\\s*(${NUM}))?\\s*(${alt})(?![a-zA-Z])`, "u");
  const m = text.match(re);
  if (!m) return "";
  const unit = UNIT_EN[m[3]] || m[3];
  return m[2] ? `${m[1]}–${m[2]} ${unit}` : `${m[1]} ${unit}`;
}

function lifespanValue(text) {
  if (!text) return "";
  const m = text.match(new RegExp(`(${NUM})\\s*(?:[~\\-–∼]\\s*(${NUM}))?\\s*(년|개월|주|일)`, "u"));
  if (!m) return "";
  const unitMap = { "년": "year", "개월": "month", "주": "week", "일": "day" };
  const base = unitMap[m[3]];
  const plural = m[2] || Number(m[1].replace(",", "")) !== 1 ? `${base}s` : base;
  const range = m[2] ? `${m[1]}–${m[2]}` : m[1];
  const prefix = /평균/.test(text) ? "Avg. " : /약|정도/.test(text) ? "About " : "";
  return `${prefix}${range} ${plural}`;
}

function titleCase(s) {
  if (!s) return "";
  const small = new Set(["of", "the", "and", "in", "on", "a", "an"]);
  return s
    .split(/\s+/)
    .map((w, i) => (i > 0 && small.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function buildEntry(card) {
  const info = {};
  for (const [, k, v] of card.info || []) info[k] = v;

  const habitat = [
    ...(card.filters?.habitat || []).map((t) => HABITAT_EN[t]).filter(Boolean),
    ...(card.filters?.region || []).map((t) => REGION_EN[t]).filter(Boolean),
  ];
  const diet = (card.filters?.diet || []).map((t) => DIET_EN[t]).filter(Boolean);

  const enInfo = {};
  if (habitat.length) enInfo["서식지"] = habitat.join(" · ");
  if (diet.length) enInfo["먹이"] = diet.join(" · ");
  const len = sizeValue(info["몸길이"] || info["크기"], ["cm", "mm", "m", "km"]);
  if (len) enInfo["몸길이"] = len;
  const wt = sizeValue(info["몸무게"] || info["크기"], ["kg", "g", "mg", "t", "톤"]);
  if (wt) enInfo["몸무게"] = wt;
  const life = lifespanValue(info["수명"]);
  if (life) enInfo["수명"] = life;

  const entry = { name: titleCase(card.en || "") || card.animal_name };
  const code = card.status?.code;
  if (code && STATUS_EN[code]) entry.statusLabel = STATUS_EN[code];
  if (Object.keys(enInfo).length) entry.info = enInfo;

  const ov = overrides[card.no];
  if (ov) {
    if (ov.nickname) entry.nickname = ov.nickname;
    if (ov.desc) entry.desc = ov.desc;
    if (Array.isArray(ov.facts) && ov.facts.length) entry.facts = ov.facts;
  }
  return entry;
}

const approved = await fetchApproved();
const approvedSet = new Set(approved);
const recent = [...cards]
  .sort((a, b) => String(b.no || "").localeCompare(String(a.no || "")))
  .slice(0, 100)
  .map((c) => c.no);
const targets = new Set([...approvedSet, ...recent, ...Object.keys(overrides)]);

const out = {};
for (const card of cards) {
  if (!card.no || !targets.has(card.no)) continue;
  out[card.no] = buildEntry(card);
}

fs.writeFileSync(path.join(ROOT, "data", "animal-cards.en.json"), JSON.stringify(out, null, 1) + "\n", "utf8");
console.log(
  `animal-cards.en.json: ${Object.keys(out).length} entries (approved ${approvedSet.size}, recent ${recent.length}, hand-translated prose ${Object.keys(overrides).filter((k) => k !== "_comment").length})`
);
