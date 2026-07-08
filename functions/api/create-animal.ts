// Cloudflare Pages Function — POST /api/create-animal
// 회원이 프롬프트로 "나만의 동물"을 AI 생성. 키는 CF 대시보드 환경변수(OPENAI_KEY, FAL_KEY).
//   흐름: Firebase ID토큰 검증(=Firestore로 쿼터 읽기) → 일일 3회 제한 → GPT-4o-mini 특성 생성(+검열)
//        → fal 이미지 생성 → 쿼터 +1 → { animal, imageUrl } 반환. 클라가 이미지를 Storage로 재업로드·저장.
// ⚠️ 정적 export와 무관하게 functions/ 는 CF Pages가 엣지 함수로 배포함(openrouter.ts와 동일).

const PROJECT = "dori-ai-0130";
const LIMIT = 3;
// keys: Cloudflare Pages env(OPENAI_KEY, FAL_KEY) — 2026-07-08 연결
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const VOCAB: Record<string, string[]> = {
  diet: ["곤충을 먹는", "물고기를 먹는", "플랑크톤을 먹는", "초식", "육식", "잡식", "썩은 것 먹는", "꿀을 먹는", "씨앗을 먹는"],
  habitat: ["바다", "강·호수", "사막", "열대우림", "극지방", "초원", "동굴", "도시 근처"],
  feature: ["날 수 있는", "독이 있는", "야행성", "보호색", "변장하는", "엄청 빠른", "엄청 느린", "빛을 내는"],
  body: ["다리가 없는", "다리가 4개인", "다리가 6개+", "날개 있는", "딱딱한 껍질", "뿔이 있는", "긴 꼬리", "긴 목"],
  behavior: ["혼자 사는", "무리지어 사는", "겨울잠 자는", "철새처럼 이동", "알을 낳는", "새끼를 낳는", "동굴에 사는", "나무 위에 사는"],
  region: ["아시아", "아프리카", "유럽", "북아메리카", "남아메리카", "오세아니아", "태평양", "대서양", "인도양", "북극해", "남극해"],
};
const GROUPS = ["포유류", "조류", "파충류", "어류", "양서류", "곤충", "갑각류", "연체동물", "기타"];
const STATUS_COLOR: Record<string, string> = { LC: "#5BA86B", NT: "#9CCC65", VU: "#F4C430", EN: "#E8743B", CR: "#E53935" };
const CODE_KO: Record<string, string> = { LC: "관심대상", NT: "준위협", VU: "취약", EN: "위기", CR: "위급" };
const filt = (arr: any, k: string) => (Array.isArray(arr) ? arr : []).filter((t: string) => VOCAB[k].includes(t));
const wbucket = (kg: number) => { kg = Number(kg) || 0; if (kg <= 0.1) return "100g 이하"; if (kg <= 1) return "100g~1kg"; if (kg <= 10) return "1~10kg"; if (kg <= 50) return "10~50kg"; if (kg <= 200) return "50~200kg"; if (kg <= 1000) return "200kg~1톤"; return "1톤 이상"; };
const lbucket = (cm: number) => { cm = Number(cm) || 0; if (cm <= 10) return "10cm 이하"; if (cm <= 30) return "10~30cm"; if (cm <= 100) return "30~100cm"; if (cm <= 200) return "100~200cm"; if (cm <= 500) return "2~5m"; if (cm <= 1000) return "5~10m"; return "10m 이상"; };

const J = (obj: any, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

function uidFromToken(idToken: string): string | null {
  try {
    const payload = idToken.split(".")[1];
    const json = JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))));
    return json.user_id || json.sub || null;
  } catch { return null; }
}

function todayKST(): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// Firestore REST: 토큰으로 쿼터 문서 읽기(=토큰 실검증). 200=존재, 404=유효·문서없음, 그외=인증실패
async function readQuota(uid: string, token: string): Promise<{ ok: boolean; count: number; date: string } | null> {
  const r = await fetch(`${FS}/userAnimalQuota/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) return { ok: true, count: 0, date: "" };
  if (!r.ok) return null; // 401/403 → 토큰 무효
  const j: any = await r.json();
  const f = (j && j.fields) || {};
  return { ok: true, count: Number((f.count && f.count.integerValue) || 0), date: (f.date && f.date.stringValue) || "" };
}
async function writeQuota(uid: string, token: string, date: string, count: number) {
  await fetch(`${FS}/userAnimalQuota/${uid}?updateMask.fieldPaths=date&updateMask.fieldPaths=count`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { date: { stringValue: date }, count: { integerValue: String(count) } } }),
  });
}

async function gptTraits(prompt: string, key: string): Promise<any | null> {
  const sys = `너는 아동용 동물도감 '몽글로'의 창작 도우미다. 사용자가 상상한 동물 아이디어를 받아 어울리는 특성을 지어낸다.
- 아동 사이트다. 프롬프트가 부적절하면(선정적/폭력·유혈/혐오/실존인물/욕설/정치) safe=false 로만 응답한다.
- 안전하면 상상력 있지만 도감처럼 그럴듯한 동물을 만든다. 한국어로.
- 태그는 반드시 아래 어휘에서만 고른다.
diet: ${VOCAB.diet.join("/")}
habitat: ${VOCAB.habitat.join("/")}
feature: ${VOCAB.feature.join("/")}
body: ${VOCAB.body.join("/")}
behavior: ${VOCAB.behavior.join("/")}
region: ${VOCAB.region.join("/")}
taxonomy_group: ${GROUPS.join("/")} 중 하나
JSON만 출력. 스키마:
{"safe":true,"animal_name":"한글이름","en":"English name","search_nickname":"짧은 별명","kid_friendly_desc":"2~3문장 쉬운 설명","habitat":"서식지","diet":"먹이","length":"몸길이(예: 약 40cm)","weight":"몸무게(예: 약 2kg)","lifespan":"수명(예: 약 10년)","length_cm":40,"weight_kg":2,"facts":["재미난 사실1","2","3"],"taxonomy_group":"포유류","rarity":3,"status_code":"LC","diet_tag":"초식","habitat_tags":["초원"],"feature_tags":["야행성"],"body_tags":["다리가 4개인"],"behavior_tags":["무리지어 사는"],"region_tags":["아시아"],"image_subject":"a concise English visual description of this cute creature for image generation"}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.9, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: String(prompt).slice(0, 400) }] }),
  });
  if (!r.ok) return null;
  const j: any = await r.json();
  try { return JSON.parse(j.choices[0].message.content); } catch { return null; }
}

async function falImage(subject: string, key: string): Promise<string | null> {
  const prompt = `Adorable 3D rendered ${subject}, Pixar Disney style, cute chibi proportions, big sparkly round eyes, soft glossy clay-like texture with subsurface scattering, gentle soft studio lighting, shallow depth of field, dreamy pastel natural habitat background with warm bokeh, highly dimensional and volumetric, octane render, charming and lovable, vertical composition, no text no words no letters`;
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch("https://fal.run/fal-ai/flux/schnell", { method: "POST", headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ prompt, image_size: "portrait_4_3", num_images: 1, output_format: "jpeg", enable_safety_checker: true }) });
      if (!r.ok) continue;
      const j: any = await r.json();
      const url = j && j.images && j.images[0] && j.images[0].url;
      if (url) return url;
    } catch {}
  }
  return null;
}

function assemble(g: any) {
  const code = String(g.status_code || "LC").toUpperCase();
  const group = GROUPS.includes(g.taxonomy_group) ? g.taxonomy_group : "기타";
  return {
    animal_name: String(g.animal_name || "이름없는 동물").slice(0, 24),
    en: String(g.en || "").slice(0, 60),
    search_nickname: String(g.search_nickname || "").slice(0, 40),
    kid_friendly_desc: String(g.kid_friendly_desc || "").slice(0, 400),
    status: { label: CODE_KO[code] || "관심대상", code: CODE_KO[code] ? code : "LC", color: STATUS_COLOR[code] || "#5BA86B" },
    rarity: Math.max(0, Math.min(5, parseInt(g.rarity, 10) || 2)),
    taxonomy_group: group,
    info: [
      ["🌍", "서식지", String(g.habitat || "-").slice(0, 60)],
      ["🍽️", "먹이", String(g.diet || "-").slice(0, 60)],
      ["📐", "몸길이", String(g.length || "-").slice(0, 40)],
      ["⚖️", "몸무게", String(g.weight || "-").slice(0, 40)],
      ["⏳", "수명", String(g.lifespan || "-").slice(0, 40)],
    ],
    facts: (Array.isArray(g.facts) ? g.facts : []).slice(0, 3).map((f: any) => String(f).slice(0, 120)),
    filters: {
      diet: VOCAB.diet.includes(g.diet_tag) ? [g.diet_tag] : [],
      habitat: filt(g.habitat_tags, "habitat"), feature: filt(g.feature_tags, "feature"),
      body: filt(g.body_tags, "body"), behavior: filt(g.behavior_tags, "behavior"),
      taxonomy: [group], weight: [wbucket(g.weight_kg)], length: [lbucket(g.length_cm)],
      region: filt(g.region_tags, "region"),
    },
  };
}

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;
  const OPENAI = env.OPENAI_KEY, FAL = env.FAL_KEY;
  if (!OPENAI || !FAL) return J({ error: "server_not_configured", message: "서버에 API 키가 설정되지 않았어요(관리자: Cloudflare 환경변수 OPENAI_KEY, FAL_KEY 등록 필요)." }, 503);

  let body: any;
  try { body = await request.json(); } catch { return J({ error: "bad_request" }, 400); }
  const prompt = String(body.prompt || "").trim();
  const idToken = String(body.idToken || "");
  if (!prompt) return J({ error: "empty_prompt", message: "동물 아이디어를 적어주세요." }, 400);
  if (prompt.length > 400) return J({ error: "too_long", message: "설명이 너무 길어요(400자 이내)." }, 400);

  const uid = uidFromToken(idToken);
  if (!uid) return J({ error: "unauthorized", message: "로그인이 필요해요." }, 401);

  const q = await readQuota(uid, idToken);
  if (!q) return J({ error: "unauthorized", message: "로그인이 만료됐어요. 새로고침 후 다시 시도해 주세요." }, 401);
  const today = todayKST();
  const usedToday = q.date === today ? q.count : 0;
  if (usedToday >= LIMIT) return J({ error: "quota", message: `오늘은 ${LIMIT}마리를 다 만들었어요. 내일 또 만들 수 있어요!`, remaining: 0 }, 429);

  const g = await gptTraits(prompt, OPENAI);
  if (!g) return J({ error: "gen_failed", message: "생성에 실패했어요. 잠시 후 다시 시도해 주세요." }, 502);
  if (g.safe === false) return J({ error: "unsafe", message: "그 아이디어로는 만들 수 없어요. 다른 동물을 상상해볼까요?" }, 400);

  const imageUrl = await falImage(String(g.image_subject || g.en || g.animal_name || "cute imaginary animal"), FAL);
  if (!imageUrl) return J({ error: "image_failed", message: "그림 생성에 실패했어요. 다시 시도해 주세요." }, 502);

  const newCount = usedToday + 1;
  try { await writeQuota(uid, idToken, today, newCount); } catch {}

  return J({ ok: true, animal: assemble(g), imageUrl, remaining: LIMIT - newCount, limit: LIMIT });
};

export const onRequestOptions: any = () => new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
