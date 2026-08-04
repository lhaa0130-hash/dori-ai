// 195개국이 아닌 육지를 배경 도형으로 만든다.
//
//   npm run build:worldmap:otherland
//
// 나라콕은 유엔 회원국 193 + 옵서버 2 = 195개국만 '나라' 로 다룬다. 인구·GDP 를
// World Bank 에서, 수도·시간대를 Wikidata 에서 받는데 그 기준이 유엔 회원국이라서다.
//
// ⚠️ 그런데 그러면 그린란드·서사하라·대만처럼 195에 없는 땅이 폴리곤 자체가 없어서
//    바다와 구분이 안 됐다. 실제로 그린란드가 통째로 비어 북대서양이 바다처럼 보였다.
//    세계지도인데 육지가 빠지면 지도가 틀린 것이다.
//
// 여기서 만드는 도형은 '배경' 이다. 이름도 클릭도 없고 랭킹·비교·검색에도 안 들어간다.
// 어느 나라 땅인지 주장하지 않는다 — 그냥 여기 육지가 있다는 사실만 그린다.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "public", "worldmap", "other-land.geojson");

// 국경선까지 정확할 필요가 없는 배경이므로 50m 으로 충분하다.
const NE_50M =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson";

const ours = JSON.parse(readFileSync(join(ROOT, "public/worldmap/countries.geojson"), "utf8"));
const oursIso = new Set(ours.features.map((f) => f.properties.iso3));
console.log(`나라콕 195개국 폴리곤: ${oursIso.size}`);

console.log("Natural Earth 50m 내려받는 중...");
const res = await fetch(NE_50M);
if (!res.ok) throw new Error(`Natural Earth 응답 ${res.status} — 실패하면 기존 파일을 덮어쓰지 않는다.`);
const ne = await res.json();

/** 좌표를 소수점 3자리(약 100m)로 줄인다. 배경 도형이라 이 정도면 충분하고 용량이 크게 준다. */
function round(coords) {
  if (typeof coords[0] === "number") return [Math.round(coords[0] * 1000) / 1000, Math.round(coords[1] * 1000) / 1000];
  return coords.map(round);
}

const features = [];
for (const f of ne.features) {
  const p = f.properties;
  // NE 는 나라마다 코드를 여러 칸에 나눠 담는다. 하나라도 우리 195개국이면 이미 칠해진다.
  const codes = [p.ADM0_A3, p.ISO_A3, p.SOV_A3, p.GU_A3, p.ADM0_A3_US].filter((x) => x && x !== "-99");
  if (codes.some((c) => oursIso.has(c))) continue;

  features.push({
    type: "Feature",
    // 어느 나라 땅인지 쓰지 않는다. 배경 도형에 정치적 주장을 담지 않는다.
    properties: { kind: "other-land" },
    geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) },
  });
}

const out = { type: "FeatureCollection", features };
writeFileSync(OUT, JSON.stringify(out), "utf8");

const kb = Math.round(Buffer.byteLength(JSON.stringify(out)) / 1024);
console.log(`195개국 밖 육지: ${features.length}개 도형 · ${kb}KB`);
console.log(`→ public/worldmap/other-land.geojson`);
