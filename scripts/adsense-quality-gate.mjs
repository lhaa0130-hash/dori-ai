// 애드센스 재발 방지 품질 게이트 — 배포 전 마지막 관문
//
//   node scripts/adsense-quality-gate.mjs out            검사(배포 훅이 쓰는 형태)
//   node scripts/adsense-quality-gate.mjs out --report   임계값 판단용 현황만 출력(항상 exit 0)
//   node scripts/adsense-quality-gate.mjs out --links    외부 인용 URL 까지 네트워크 전수 검사(느림)
//
// ── 왜 만들었나 ────────────────────────────────────────────────────────────────
// 같은 사고가 세 번 반복됐다. 매번 "대량 자동생성 + 얇은 템플릿"이 사이트 URL의 대부분을
// 차지했고, 매번 직전 정리 작업 중에 다음 대량 페이지가 새로 머지되고 있었다.
//   2026-07-26  트렌드 182 + 큐레이션 110 삭제 (봇 생성 82% · 인용 URL 20% 404)
//   2026-08-04  동물도감 1205편 비공개        (사이트 URL 의 92%)
//   2026-08-10  나라콕 458페이지 비공개        (배포 HTML 의 72%)
// 사람이 눈으로 잡는 방식으로는 네 번째가 또 난다. 여기서 기계가 막는다.
//
// ⚠️ 판정은 사이트맵이 아니라 **out/ 의 실제 .html 수**로 한다.
//    2026-08-10 에 사이트맵은 228개만 신고하는데 실제 공개면은 458개였다(나머지는 noindex).
//    사이트맵만 보면 그 문제를 못 본다.
import fs from "node:fs";
import path from "node:path";

const OUT = process.argv[2] || "out";
const REPORT_ONLY = process.argv.includes("--report");
const CHECK_LINKS = process.argv.includes("--links");
const CONTENT = "content";

// ── 임계값 ────────────────────────────────────────────────────────────────────
// 2026-08-13 현재 사이트 실측으로 보정했다(통과해야 정상). 숫자를 올리기 전에
// "왜 이 섹션이 이만큼 필요한가"를 먼저 답할 것.
const CFG = {
  // 검사1: '대량 + 얇음' 조합만 잡는다. 비중만으로 자르면 양질 섹션이 커질 때 오탐이 난다.
  //   나라콕 72%/중앙값 470자 → 차단, 동물도감 92%/264자 → 차단, 인사이트 37%/4,600자 → 통과
  sectionSharePct: 30,
  sectionThinMedian: 1500,
  // 검사2: 사이트맵에 제출한 URL 은 최소한 이만큼은 읽을 게 있어야 한다.
  sitemapMinKo: 300,
  sitemapMinEnWords: 150,
  sitemapMinFailures: 1,
};

// 검사2에서 제외 — 실제 기능이 본문 글자수로 측정되지 않는 페이지들.
// ⚠️ 여기에 추가하는 것은 "글이 얇아도 된다"는 뜻이 아니라 "글이 아니라 기능"이라는 뜻이다.
const THIN_ALLOWED = new Set([
  "/minigame",       // 게임 17종 목록 — 실제 플레이 페이지가 23개 따로 있다
  "/en/minigame",
  "/legal/contact",  // 연락처는 짧은 게 정상이다(이메일·운영시간). 길이로 재면 안 된다
  "/en/legal/contact",
]);

const koLen = (s) => (s.match(/[가-힣]/g) || []).length;
const enWords = (s) => (s.match(/[A-Za-z][A-Za-z'-]+/g) || []).length;

function bodyText(html) {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ");
  const m = h.match(/<main[\s\S]*?<\/main>/i);
  if (m) h = m[0];
  return h.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ").replace(/\s+/g, " ").trim();
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const fail = [];
const warn = [];
const info = [];

// ── 검사 1: 한 섹션이 사이트를 뒤덮는가 (대량 + 얇음) ─────────────────────────
const htmls = walk(OUT);
const bySection = new Map();
for (const f of htmls) {
  const rel = f.slice(OUT.length).replace(/\\/g, "/").replace(/^\//, "").replace(/\.html$/, "");
  const seg = rel.replace(/^en\//, "").split("/")[0];
  const key = seg && seg !== "index" ? "/" + seg : "/(루트)";
  if (!bySection.has(key)) bySection.set(key, []);
  bySection.get(key).push(f);
}
info.push(`배포 HTML ${htmls.length}개 / 섹션 ${bySection.size}개`);
for (const [sec, files] of [...bySection.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const share = (files.length / htmls.length) * 100;
  // 중앙값은 표본으로 충분하다. 섹션이 수백 개여도 빠르게 판단하기 위함.
  const sample = files.length > 40 ? files.filter((_, i) => i % Math.ceil(files.length / 40) === 0) : files;
  const lens = sample.map((f) => koLen(bodyText(fs.readFileSync(f, "utf8")))).sort((a, b) => a - b);
  const med = lens[Math.floor(lens.length / 2)] ?? 0;
  const line = `  ${sec.padEnd(16)} ${String(files.length).padStart(4)}개  ${share.toFixed(1).padStart(5)}%  본문중앙값 ${String(med).padStart(5)}자`;
  info.push(line);
  if (share >= CFG.sectionSharePct && med < CFG.sectionThinMedian) {
    fail.push(
      `[대량 얇은 섹션] ${sec} 가 배포 페이지의 ${share.toFixed(1)}% (${files.length}개)인데 본문 중앙값이 ${med}자다.\n` +
      `    → scaled content abuse 로 판정될 구조다. 페이지당 고유 서술을 늘리거나 공개 범위를 줄여라.`
    );
  }
}

// ── 검사 2: 사이트맵에 제출한 URL 이 읽을 만한가 ──────────────────────────────
const smPath = path.join(OUT, "sitemap.xml");
let sitemapUrls = [];
if (fs.existsSync(smPath)) {
  sitemapUrls = [...fs.readFileSync(smPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  info.push(`사이트맵 URL ${sitemapUrls.length}개`);
  const thin = [];
  for (const url of sitemapUrls) {
    const p = url.replace(/^https?:\/\/[^/]+/, "");
    if (THIN_ALLOWED.has(p)) continue;
    const candidates = [
      path.join(OUT, p === "/" ? "index.html" : p + ".html"),
      path.join(OUT, p, "index.html"),
    ];
    const file = candidates.find((c) => fs.existsSync(c));
    if (!file) { fail.push(`[사이트맵 404] ${url} 이 빌드 결과물에 없다 — 제출된 URL 을 찾을 수 없음 오류가 난다.`); continue; }
    const t = bodyText(fs.readFileSync(file, "utf8"));
    const isEn = p === "/en" || p.startsWith("/en/");
    const ok = isEn ? enWords(t) >= CFG.sitemapMinEnWords : koLen(t) >= CFG.sitemapMinKo;
    if (!ok) thin.push(`${p} (${isEn ? enWords(t) + "단어" : koLen(t) + "자"})`);
  }
  if (thin.length >= CFG.sitemapMinFailures) {
    fail.push(`[얇은 제출 URL] 사이트맵에 올렸는데 본문이 기준 미달인 페이지 ${thin.length}개:\n    ${thin.join("\n    ")}`);
  }
} else {
  warn.push("sitemap.xml 이 없다 — 검사 2 를 건너뛴다.");
}

// ── 검사 3: LLM 이 지어낸 출처의 지문 (네트워크 없이 정적 검출) ───────────────
// 실제로 겪은 두 패턴만 본다. 오탐이 거의 없고 네트워크가 필요 없어 배포를 막지 않는다.
//   ① news.google.com/rss/articles/… : RSS 래퍼 주소. 실제 브라우저에서도 400 이 뜬다.
//   ② ?utm_source=openai            : LLM 이 생성한 URL 에 붙어 오는 꼬리표.
const mdFiles = [];
if (fs.existsSync(CONTENT)) {
  for (const d of fs.readdirSync(CONTENT)) {
    const dp = path.join(CONTENT, d);
    if (!fs.statSync(dp).isDirectory()) continue;
    for (const f of fs.readdirSync(dp)) if (f.endsWith(".md")) mdFiles.push(path.join(dp, f));
  }
}
const badCite = [];
for (const f of mdFiles) {
  const raw = fs.readFileSync(f, "utf8");
  const rss = (raw.match(/news\.google\.com\/rss\/articles/g) || []).length;
  const openai = (raw.match(/utm_source=openai/g) || []).length;
  if (rss || openai) badCite.push(`${path.basename(f)} — 구글뉴스RSS ${rss}건 · utm_source=openai ${openai}건`);
}
if (badCite.length) {
  fail.push(
    `[허구 출처 지문] 지어낸/깨진 인용 URL 패턴이 있다:\n    ${badCite.join("\n    ")}\n` +
    `    → 실제 출처 URL 로 바꾸거나, 못 찾으면 URL 만 빼고 매체·제목·날짜 표기는 남겨라. 주소를 지어내지 말 것.`
  );
}

// ── 검사 4: 콘텐츠 기사를 noindex 로 덮어 감추려는 시도 ──────────────────────
// noindex 는 애드센스 심사에 무효다(심사원은 직접 방문해 읽는다). 저품질은 내려야 한다.
// 회원·관리자·오류 화면의 noindex 는 정당하므로 콘텐츠 기사에 한정해서 본다.
for (const f of mdFiles) {
  const raw = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  const fm = raw.match(/^---\n([\s\S]*?)\n---/); // ⚠️ CRLF 정규화 필수. 안 하면 전부 미검출된다.
  if (fm && /^noindex:\s*true/m.test(fm[1])) {
    fail.push(
      `[noindex 은폐] ${path.basename(f)} 에 noindex: true 가 붙어 있다.\n` +
      `    → noindex 는 심사에 무효다. 품질을 고치거나 글을 내려라(2026-08-13 analysis-01 과 같은 사례).`
    );
  }
}
const articleDir = path.join(OUT, "insight", "article");
if (fs.existsSync(articleDir)) {
  for (const f of fs.readdirSync(articleDir)) {
    if (!f.endsWith(".html")) continue;
    const raw = fs.readFileSync(path.join(articleDir, f), "utf8");
    if (/name="robots"\s+content="noindex/.test(raw)) {
      fail.push(`[noindex 은폐] /insight/article/${f.replace(/\.html$/, "")} 가 200 인데 noindex 다. 링크를 타고 심사원이 도달한다.`);
    }
  }
}

// ── 검사 5: '준비 중 / 0개' 로 보이는 빈 페이지가 사이트맵에 있는가 ──────────
// 빈 카테고리는 2026-07-26 거절 사유로 확인된 항목이다. 본문이 짧을 때만 검사해 오탐을 줄인다.
// ⚠️ 오탐 2건을 실제로 겪고 좁힌 규칙이다. 넓히기 전에 아래를 읽을 것.
//   ① `0\s*개` 는 "340개가 넘는" 의 뒷부분을 잡는다 → 앞자리 숫자를 배제한다.
//   ② "첫 댓글을 남겨보세요" 는 기사 하단 댓글 위젯의 **정상** 빈 상태다.
//      막으려는 건 "첫 글을 남겨주세요" 같은 **콘텐츠가 하나도 없는 목록 페이지**다.
//      ⚠️ 정규식 안의 `(?!댓글)` 로는 못 거른다 — `첫\s*` 의 `\s*` 가 0글자로 백트래킹하면
//         선행탐색이 공백 위치에서 성공해 버린다. 그래서 매치 결과를 후처리로 거른다.
const EMPTY_RE = /((?<![0-9])0\s*개(?!월)|아직\s*[^.]{0,12}없|준비\s*중입니다|첫\s*[^.]{0,12}(남겨|작성))/;
const isRealEmptySignal = (m) => !!m && !m.includes("댓글");
for (const url of sitemapUrls) {
  const p = url.replace(/^https?:\/\/[^/]+/, "");
  const file = [path.join(OUT, p === "/" ? "index.html" : p + ".html"), path.join(OUT, p, "index.html")].find((c) => fs.existsSync(c));
  if (!file) continue;
  const t = bodyText(fs.readFileSync(file, "utf8"));
  const hit = (t.match(EMPTY_RE) || [])[0];
  if (koLen(t) < 1500 && isRealEmptySignal(hit)) {
    fail.push(`[빈 상태 페이지] ${p} 본문에 "${hit}" 가 있고 분량도 ${koLen(t)}자다 — '준비 중' 인상을 준다. 채우거나 사이트맵에서 빼라.`);
  }
}

// ── 검사 3b(선택): 외부 인용 URL 네트워크 전수 검사 ──────────────────────────
if (CHECK_LINKS) {
  const urls = new Map();
  for (const f of mdFiles) {
    for (const raw of fs.readFileSync(f, "utf8").match(/https?:\/\/[^\s)\]"'<>]+/g) || []) {
      const u = raw.replace(/[.,;:]+$/, "");
      if (/illo\.im|localhost/.test(u) || /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(u)) continue;
      if (!urls.has(u)) urls.set(u, new Set());
      urls.get(u).add(path.basename(f));
    }
  }
  const list = [...urls.keys()];
  const dead = [];
  const queue = [...list];
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const u = queue.shift();
      let s;
      try {
        const r = await fetch(u, { method: "HEAD", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(12000) });
        s = r.status;
      } catch { s = "ERR"; }
      // 404/410 만 확정 불량으로 본다. 403/401 은 봇 차단이라 살아있는 경우가 대부분이다.
      if (s === 404 || s === 410) dead.push(`${s} ${u}  ← ${[...urls.get(u)].join(", ")}`);
    }
  }));
  info.push(`외부 인용 URL ${list.length}개 검사 / 확정 불량 ${dead.length}개`);
  if (dead.length) fail.push(`[죽은 인용 URL]\n    ${dead.join("\n    ")}`);
}

// ── 출력 ──────────────────────────────────────────────────────────────────────
console.log("애드센스 품질 게이트");
info.forEach((l) => console.log(l));
warn.forEach((l) => console.log("⚠️  " + l));

if (REPORT_ONLY) {
  console.log(`\n(--report 모드: 위반 ${fail.length}건, 종료코드는 항상 0)`);
  fail.forEach((l) => console.log("✗ " + l));
  process.exit(0);
}
if (fail.length) {
  console.log(`\n❌ 위반 ${fail.length}건 — 배포를 중단한다.`);
  fail.forEach((l) => console.log("✗ " + l));
  process.exit(1);
}
console.log("\n✅ 통과 — 대량 얇은 섹션·얇은 제출 URL·허구 출처·noindex 은폐·빈 페이지 모두 없음.");
process.exit(0);
