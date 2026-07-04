import { ITEMS } from "./psychItems";

// 심리테스트 데이터 — 검증된 임상/연구 척도 기반.
// 점수형(scored): 리커트 합산/평균 → 공인된 컷오프 구간으로 해석.
// 유형형(typed): 가벼운 재미 테스트(승자 유형).
// ⚠️ 모든 점수형 테스트는 "선별(screening)"이며 진단이 아님. 결과·인트로에 고지 포함.
// 문항은 원척도를 교차검증한 자연스러운 한국어 각색이며, 컷오프는 공개 문헌 기준.

export type Tone = "good" | "mild" | "warn" | "high";

export type Choice = { label: string; value: number };

export type ScoredItem = {
  text: string;
  reverse?: boolean; // 역채점 문항
  choices?: Choice[]; // 문항별 보기(없으면 테스트 기본 scale 사용)
};

export type Band = {
  max: number; // 이 점수(또는 평균) 이하면 이 구간 (오름차순)
  label: string;
  emoji: string;
  tone: Tone;
  desc: string;
  advice: string;
};

export type ScoredTest = {
  kind: "scored";
  id: string;
  category: string;
  emoji: string;
  title: string;
  subtitle: string;
  source: string; // 근거 척도
  time: string; // 예상 소요
  intro: string;
  scoreMode?: "sum" | "avg"; // 기본 sum. 평균형(BRS·CBI)은 "avg"
  question?: string; // 모든 문항 공통 안내문(예: "지난 2주 동안…")
  higherWorse?: boolean; // 게이지 라벨 방향(기본 true: 높을수록 나쁨)
  disclaimer?: string;
  crisis?: boolean; // 위기 자원 안내 표시(우울 등)
  scale: Choice[]; // 기본 응답 보기
  items: ScoredItem[];
  bands: Band[]; // 오름차순(max 기준)
  note?: string; // 결과 하단 보충 설명(예: 성별 컷오프)
};

export type TypedTest = {
  kind: "typed";
  id: string;
  category: string;
  emoji: string;
  title: string;
  subtitle: string;
  source: string;
  time: string;
  intro: string;
  questions: { q: string; options: { t: string; type: string }[] }[];
  results: Record<string, { emoji: string; title: string; desc: string; rec?: { label: string; href: string } }>;
};

// 다차원 성격 검사(Big Five 등): 축마다 합산 → 백분위 막대 + 높음/낮음 해석
export type MultiLevel = { text: string; strengths: string; watch: string };
// 하위척도(facet) — 축을 구성하는 세부 특성
export type MultiFacet = {
  name: string;
  desc: string; // 이 하위척도가 무엇을 재는지(한 줄)
  items: { text: string; reverse?: boolean }[];
};
export type MultiDimension = {
  key: string;
  name: string;
  emoji: string;
  desc: string; // 이 축이 무엇을 재는지(한 줄)
  high: MultiLevel; // 높을 때
  low: MultiLevel; // 낮을 때
  mid: string; // 중간(균형) 한 줄
  facets: MultiFacet[]; // 하위척도(각 4문항)
};
// 2축 조합 → 4유형(예: 애착유형). dimensions[0]=x축(anxiety), [1]=y축(avoidance).
export type QuadrantType = { key: string; label: string; emoji: string; desc: string; strengths: string; watch: string; tip: string };
export type MultiTest = {
  kind: "multi";
  id: string;
  category: string;
  emoji: string;
  title: string;
  subtitle: string;
  source: string;
  time: string;
  intro: string;
  question: string;
  disclaimer?: string;
  scale: Choice[];
  dimensions: MultiDimension[];
  quadrant?: QuadrantType[]; // 있으면 2축 조합으로 4유형 결과 표시
  resultTitle?: string; // 결과 헤더(기본 "나의 성격 프로파일")
};

export type PsychTest = ScoredTest | TypedTest | MultiTest;

// 검사 상세 안내(시작 전 브리핑) — "무엇을·어떻게 측정하고 어떻게 해석하는가"
export type TestAbout = {
  what: string; // 이 검사는 무엇인가
  measures: { label: string; desc: string }[]; // 측정 영역(하위 구성)
  how: string; // 측정·채점 방식
  interpret: string; // 결과 해석 관점
  background: string; // 개발 배경/타당성/출처
};

export const CATEGORIES = [
  { id: "mind", name: "마음 건강", emoji: "🧠", desc: "우울·불안·스트레스·번아웃 선별" },
  { id: "social", name: "관계·사회", emoji: "🫂", desc: "사회불안·외로움·애착·연애" },
  { id: "self", name: "자기 이해", emoji: "🪞", desc: "자존감·회복탄력성" },
  { id: "addiction", name: "중독·의존", emoji: "📵", desc: "SNS·스마트폰·게임·음주 습관" },
  { id: "fun", name: "가볍게", emoji: "✨", desc: "재미로 보는 유형 테스트" },
] as const;

/* 도움받을 수 있는 곳(상담 자원) */
export type HelpResource = { name: string; phone: string; hours: string; desc: string };
export const RESOURCES: Record<string, HelpResource> = {
  "suicide": { name: "자살예방상담전화", phone: "109", hours: "24시간 (365일)", desc: "2024년 1월 1일부터 기존 1393 등 8개 기관 상담전화를 109로 통합한 자살예방·위기 상담 전화로, 필요 시 정신건강복지센터 연계 및 112·119 긴급 출동을 지원한다." },
  "mh": { name: "정신건강상담전화", phone: "1577-0199", hours: "24시간 (365일)", desc: "전국 정신건강복지센터가 운영하는 정신건강 전반 상담 전화로, 정신건강 정보 제공·위기 상담과 지역 정신건강복지센터·의료기관 연계를 돕는다." },
  "youth": { name: "청소년전화", phone: "1388", hours: "24시간 (365일)", desc: "만 9~24세 청소년과 보호자를 위한 무료 상담 전화로, 고민·위기 상담과 문자·카카오톡 등 온라인 상담도 24시간 제공한다." },
  "women": { name: "여성긴급전화", phone: "1366", hours: "24시간 (365일)", desc: "가정폭력·성폭력·성매매·데이트폭력·디지털성폭력·스토킹 등 여성폭력 피해자를 위한 긴급 구조·보호·상담 전화다." },
  "smartrest": { name: "스마트쉼센터", phone: "1599-0075", hours: "평일 09:00~22:00 / 토요일 09:00~18:00 (24시간 아님)", desc: "인터넷·스마트폰 과의존 예방·해소 전문 상담기관으로 전화·내방·온라인·가정방문 상담을 제공한다." },
  "welfare": { name: "보건복지상담센터", phone: "129", hours: "일반상담 평일 09:00~18:00 / 긴급복지·학대·정신건강 상담은 24시간", desc: "보건·복지 전반 안내 콜센터로 긴급복지지원·학대·정신건강 상담은 24시간 운영하며 지역 중독관리통합지원센터 안내도 받을 수 있다." },
  "addiction": { name: "중독관리통합지원센터", phone: "129", hours: "센터별 상이 (대부분 평일 주간)", desc: "알코올·도박·마약·인터넷 등 중독 문제의 예방·상담·재활을 돕는 지역 기관으로, 거주지 센터 번호는 보건복지상담센터 129나 정신건강상담전화 1577-0199에서 확인한다." },
  "lifeline": { name: "생명의전화", phone: "1588-9191", hours: "24시간 (365일)", desc: "국내 최초의 민간 전화상담 기관으로 일상 고민부터 자살 위기까지 24시간 무료 전화상담을 제공한다." },
};
export const TEST_RESOURCES: Record<string, string[]> = {
  "perfectionism": ["mh"],
  "procrastination": ["mh"],
  "narcissism": ["mh"],
  "alexithymia": ["mh"],
  "relcontrol": ["women", "mh", "youth"],
  "attachment": ["mh"],
  "lovestyle": ["mh"],

  "phq9": ["suicide", "mh", "lifeline"],
  "gad7": ["mh"],
  "pss10": ["mh"],
  "burnout": ["mh"],
  "adhd": ["mh"],
  "ocd": ["mh"],
  "self-esteem": ["mh"],
  "resilience": ["mh"],
  "sns": ["smartrest", "mh"],
  "smartphone": ["smartrest", "mh"],
  "game": ["smartrest", "mh"],
  "audit": ["addiction", "welfare", "mh"],
  "bigfive": ["mh"],
  "ai-type": ["mh"],
  "trauma": ["mh", "suicide", "lifeline"],
  "insomnia": ["mh"],
  "social_anxiety": ["mh"],
  "anger": ["mh"],
  "loneliness": ["mh", "suicide", "lifeline"],
  "eating": ["mh", "suicide"],
};
export function getResources(id: string): HelpResource[] {
  return (TEST_RESOURCES[id] || []).map((k) => RESOURCES[k]).filter(Boolean);
}


/* ── 공통 응답 보기 ─────────────────────────────── */

// PHQ-9 / GAD-7 : 0~3 (지난 2주 빈도)
const FREQ_2W: Choice[] = [
  { label: "전혀 없었다", value: 0 },
  { label: "며칠 동안", value: 1 },
  { label: "절반 이상의 날", value: 2 },
  { label: "거의 매일", value: 3 },
];


const AGREE5_04: Choice[] = [
  { label: "전혀 아니다", value: 0 },
  { label: "별로 아니다", value: 1 },
  { label: "보통이다", value: 2 },
  { label: "그런 편이다", value: 3 },
  { label: "매우 그렇다", value: 4 },
];

// PSS-10 : 0~4 (지난 한 달 빈도)
const FREQ_5: Choice[] = [
  { label: "전혀 없었다", value: 0 },
  { label: "거의 없었다", value: 1 },
  { label: "때때로 있었다", value: 2 },
  { label: "자주 있었다", value: 3 },
  { label: "매우 자주 있었다", value: 4 },
];

// CBI 개인 소진 : 빈도 0~100 (평균 채점)
const CBI_FREQ: Choice[] = [
  { label: "전혀 / 거의 아니다", value: 0 },
  { label: "거의 아니다", value: 25 },
  { label: "가끔", value: 50 },
  { label: "자주", value: 75 },
  { label: "항상", value: 100 },
];

// Rosenberg : 0~3 동의 (역채점은 엔진이 자동 반전)
const AGREE_4: Choice[] = [
  { label: "전혀 아니다", value: 0 },
  { label: "아니다", value: 1 },
  { label: "그렇다", value: 2 },
  { label: "매우 그렇다", value: 3 },
];

// BRS : 1~5 동의 (평균 채점)
const AGREE_5: Choice[] = [
  { label: "전혀 그렇지 않다", value: 1 },
  { label: "그렇지 않다", value: 2 },
  { label: "보통이다", value: 3 },
  { label: "그렇다", value: 4 },
  { label: "매우 그렇다", value: 5 },
];

// BSMAS : 1~5 빈도 (지난 1년)
const BSMAS_FREQ: Choice[] = [
  { label: "매우 드물게", value: 1 },
  { label: "드물게", value: 2 },
  { label: "때때로", value: 3 },
  { label: "자주", value: 4 },
  { label: "매우 자주", value: 5 },
];

// SAS-SV : 1~6 동의
const AGREE_6: Choice[] = [
  { label: "전혀 그렇지 않다", value: 1 },
  { label: "그렇지 않다", value: 2 },
  { label: "약간 그렇지 않다", value: 3 },
  { label: "약간 그렇다", value: 4 },
  { label: "그렇다", value: 5 },
  { label: "매우 그렇다", value: 6 },
];

// Big Five(IPIP-50) : 1~5 정확도
const BIG5_SCALE: Choice[] = [
  { label: "전혀 아니다", value: 1 },
  { label: "아닌 편이다", value: 2 },
  { label: "보통이다", value: 3 },
  { label: "그런 편이다", value: 4 },
  { label: "매우 그렇다", value: 5 },
];

// 게임 자가점검(DSM-5 IGD 기준 기반) : 1~5 빈도
const GAME_FREQ: Choice[] = [
  { label: "전혀 아니다", value: 1 },
  { label: "드물게", value: 2 },
  { label: "때때로", value: 3 },
  { label: "자주", value: 4 },
  { label: "매우 자주", value: 5 },
];

// AUDIT 문항별 보기
const AUDIT_FREQ: Choice[] = [
  { label: "전혀 없음", value: 0 },
  { label: "월 1회 미만", value: 1 },
  { label: "월 1회", value: 2 },
  { label: "주 1회", value: 3 },
  { label: "거의 매일", value: 4 },
];
const AUDIT_YN: Choice[] = [
  { label: "아니오", value: 0 },
  { label: "있지만 지난 1년간은 아니다", value: 2 },
  { label: "지난 1년간 있었다", value: 4 },
];

// ASRS(성인 ADHD) : 0~4 빈도 (지난 6개월)
const ASRS_FREQ: Choice[] = [
  { label: "전혀 없음", value: 0 },
  { label: "거의 없음", value: 1 },
  { label: "가끔", value: 2 },
  { label: "자주", value: 3 },
  { label: "매우 자주", value: 4 },
];

// OCI-R(강박) : 0~4 고통 정도 (지난 한 달)
const OCIR_SCALE: Choice[] = [
  { label: "전혀 아니다", value: 0 },
  { label: "조금", value: 1 },
  { label: "보통", value: 2 },
  { label: "많이", value: 3 },
  { label: "매우 심하다", value: 4 },
];

/* ── 테스트 데이터 ─────────────────────────────── */

export const TESTS: PsychTest[] = [
  // ═══════════════ 🧠 마음 건강 ═══════════════
  {
    kind: "scored",
    id: "phq9",
    category: "mind",
    emoji: "🌧️",
    title: "우울 정밀 검사",
    subtitle: "40문항 · 우울 증상 정밀 점검",
    source: "PHQ-9·우울 증상 기준 기반 확장 검사",
    time: "약 5분",
    intro: "우울 증상을 12개 영역에서 40문항으로 폭넓게 살피는 정밀 검사예요. 문항이 많을수록 결과의 신뢰도가 높아져요. 지난 2주를 떠올리며 솔직하게 답해주세요.",
    question: "지난 2주 동안, 다음 문제로 얼마나 자주 힘들었나요?",
    crisis: true,
    disclaimer: "이 검사는 우울 '선별'용이며 진단이 아니에요. 결과가 높게 나와도 그 자체로 병을 의미하지 않아요.",
    scale: FREQ_2W,
    items: ITEMS["depression"],
    bands: [
      { max: 18, label: "최소 수준", emoji: "😌", tone: "good", desc: "지난 2주간 우울 증상이 거의 없어요. 지금의 안정감을 잘 유지하고 있네요.", advice: "가벼운 기분 변화는 누구에게나 있어요. 규칙적인 수면·활동·관계가 이 상태를 지켜줘요." },
      { max: 36, label: "경도 우울감", emoji: "🙂", tone: "mild", desc: "가벼운 우울감이 있어요. 일상이 크게 무너질 정도는 아니지만 마음이 보내는 신호로 볼 만해요.", advice: "수면·운동·햇빛·대화를 의식적으로 챙겨보세요. 2주 뒤 다시 점검하면 변화가 보일 거예요." },
      { max: 60, label: "중등도 우울", emoji: "😟", tone: "warn", desc: "중간 정도의 우울 증상이 있어요. 컨디션과 일상에 영향을 줄 수 있는 수준이에요.", advice: "혼자 버티기보다 가까운 사람에게 털어놓고, 가능하면 상담이나 진료를 한 번 받아보길 권해요." },
      { max: 84, label: "중등도–중증", emoji: "😣", tone: "high", desc: "우울 증상이 뚜렷해요. 일상 기능에 부담이 큰 수준일 수 있어요.", advice: "정신건강의학과·상담센터의 도움을 적극 권해요. 빨리 시작할수록 회복도 빨라요." },
      { max: 120, label: "중증 우울", emoji: "😢", tone: "high", desc: "우울 증상이 심한 수준이에요. 지금 많이 힘들 수 있어요.", advice: "꼭 전문가의 도움을 받으세요. 아래 상담 전화로 지금 바로 이야기할 수 있어요." },
    ],
    note: "죽음·자해에 대한 생각을 묻는 문항에 조금이라도 해당된다면, 총점과 무관하게 꼭 주변이나 전문가에게 이야기해 주세요.",
  },
  {
    kind: "scored",
    id: "gad7",
    category: "mind",
    emoji: "🌀",
    title: "불안 정밀 검사",
    subtitle: "40문항 · 불안 증상 정밀 점검",
    source: "GAD-7·불안 증상 기준 기반 확장 검사",
    time: "약 5분",
    intro: "불안을 걱정·신체증상·자율신경·회피 등 12개 영역에서 40문항으로 살피는 정밀 검사예요. 지난 2주의 나를 떠올리며 답해주세요.",
    question: "지난 2주 동안, 다음 문제로 얼마나 자주 힘들었나요?",
    disclaimer: "불안 '선별'용 검사이며 진단이 아니에요.",
    scale: FREQ_2W,
    items: ITEMS["anxiety"],
    bands: [
      { max: 18, label: "최소 수준", emoji: "😌", tone: "good", desc: "불안 증상이 거의 없어요. 마음이 비교적 차분한 상태예요.", advice: "지금처럼 호흡·휴식·규칙적인 생활 리듬을 유지해 보세요." },
      { max: 36, label: "경도 불안", emoji: "🙂", tone: "mild", desc: "가벼운 불안이 있어요. 일상에 큰 지장은 아니지만 신경 쓰이는 정도예요.", advice: "걱정이 떠오를 때 '지금·여기'로 주의를 돌리는 호흡·산책이 도움이 돼요." },
      { max: 60, label: "중등도 불안", emoji: "😟", tone: "warn", desc: "중간 정도의 불안이 있어요. 집중·수면·관계에 영향을 줄 수 있어요.", advice: "카페인·정보 과다를 줄이고, 불안이 반복되면 전문가 상담을 고려해 보세요." },
      { max: 120, label: "중증 불안", emoji: "😣", tone: "high", desc: "불안 증상이 뚜렷하고 강해요. 일상이 꽤 힘들 수 있어요.", advice: "전문가(정신건강의학과·상담센터)의 도움을 권해요. 적절한 도움으로 충분히 나아질 수 있어요." },
    ],
  },
  {
    kind: "scored",
    id: "pss10",
    category: "mind",
    emoji: "🪨",
    title: "스트레스 정밀 검사",
    subtitle: "40문항 · 지각된 스트레스",
    source: "PSS(지각된 스트레스 척도) 기반 확장 검사",
    time: "약 5분",
    intro: "최근 한 달, 삶을 얼마나 통제 불가능하고 버겁게 느꼈는지를 12개 영역 40문항으로 살펴요. 정답은 없어요.",
    question: "지난 한 달 동안, 얼마나 자주 그랬나요?",
    disclaimer: "이 검사의 구간은 절대적 기준이 아니라 대략적인 참고용이에요.",
    scale: FREQ_5,
    items: ITEMS["stress"],
    bands: [
      { max: 53, label: "낮은 스트레스", emoji: "😌", tone: "good", desc: "최근 스트레스를 비교적 잘 다루고 있어요. 통제감이 안정적인 편이에요.", advice: "지금의 루틴과 회복 습관(수면·운동·관계)을 그대로 이어가세요." },
      { max: 106, label: "보통 스트레스", emoji: "🙂", tone: "mild", desc: "누구나 겪는 보통 수준의 스트레스예요. 다만 누적되면 지칠 수 있어요.", advice: "할 일을 잘게 쪼개고, 통제 가능한 것에 집중해 보세요. 짧은 휴식을 자주 넣는 것도 좋아요." },
      { max: 160, label: "높은 스트레스", emoji: "😟", tone: "warn", desc: "스트레스를 상당히 강하게 지각하고 있어요. 통제하기 벅차다고 느낄 수 있어요.", advice: "혼자 짊어진 짐을 나누고, 우선순위를 과감히 줄여보세요. 지속되면 상담도 도움이 돼요." },
    ],
  },
  {
    kind: "scored",
    id: "burnout",
    category: "mind",
    emoji: "🔥",
    title: "번아웃(소진) 정밀 검사",
    subtitle: "40문항 · 소진 정밀 점검",
    source: "Copenhagen Burnout Inventory 기반 확장 검사",
    time: "약 5분",
    intro: "신체·정서·정신적 탈진부터 냉소·효능감 저하까지, 소진을 10개 영역 40문항으로 살피는 정밀 검사예요. 요즘 상태를 떠올려 주세요.",
    question: "요즘 얼마나 자주 그런가요?",
    disclaimer: "‘소진’ 정도를 보는 참고 지표예요.",
    scale: FREQ_5,
    items: ITEMS["burnout"],
    bands: [
      { max: 64, label: "양호", emoji: "😌", tone: "good", desc: "소진 수준이 낮아요. 에너지를 비교적 잘 회복하고 있어요.", advice: "지금의 일·휴식 균형을 유지하세요. 작은 회복 루틴이 큰 차이를 만들어요." },
      { max: 112, label: "중등도 번아웃", emoji: "😟", tone: "warn", desc: "소진 신호가 보여요. 쉬어도 피로가 잘 안 풀리는 상태일 수 있어요.", advice: "업무·역할을 덜어내고 회복 시간을 의도적으로 확보하세요. 거절하는 연습도 필요해요." },
      { max: 160, label: "높은 번아웃", emoji: "😣", tone: "high", desc: "소진이 상당히 진행됐어요. 몸과 마음이 한계 신호를 보내고 있어요.", advice: "지금은 '더 버티기'보다 '멈추고 회복하기'가 우선이에요. 휴식 확보와 함께 전문가 상담을 권해요." },
    ],
  },

  {
    kind: "scored",
    id: "adhd",
    category: "mind",
    emoji: "🌀",
    title: "성인 ADHD 정밀 검사",
    subtitle: "40문항 · 성인 ADHD 특성",
    source: "ASRS(WHO 성인 ADHD 척도) 기반 확장 검사",
    time: "약 5분",
    intro: "주의력 결핍과 과잉행동·충동성을 14개 영역 40문항으로 살피는 정밀 검사예요. 지난 6개월의 나를 떠올리며 답해주세요.",
    question: "지난 6개월 동안, 다음 일이 얼마나 자주 있었나요?",
    disclaimer: "ADHD '선별'용 검사이며 진단이 아니에요. 결과가 높아도 그 자체로 ADHD를 의미하지 않아요.",
    scale: ASRS_FREQ,
    items: ITEMS["adhd"],
    bands: [
      { max: 48, label: "특성 약함", emoji: "😌", tone: "good", desc: "주의력·과잉행동 관련 어려움이 두드러지지 않아요.", advice: "지금처럼 일정·할 일 관리를 이어가세요." },
      { max: 96, label: "일부 특성 있음", emoji: "🙂", tone: "mild", desc: "ADHD와 비슷한 특성이 일부 보여요. 일상에 큰 지장이 없다면 자연스러운 개인차일 수 있어요.", advice: "집중이 흐트러지는 상황을 메모해 패턴을 살펴보세요. 체크리스트·타이머가 도움이 돼요." },
      { max: 160, label: "뚜렷한 특성", emoji: "😟", tone: "warn", desc: "ADHD와 일치하는 특성이 잦은 편이에요. 주의력·충동성이 생활을 자주 방해할 수 있어요.", advice: "일상·일·관계에 지장이 있다면 정신건강의학과의 정밀 평가를 권해요. ADHD는 진단되면 효과적으로 도울 수 있어요." },
    ],
    note: "이 검사는 자가점검이에요. 어린 시절부터 증상이 이어졌고 여러 상황에서 지장을 준다면 전문 평가가 특히 권장돼요.",
  },
  {
    kind: "scored",
    id: "ocd",
    category: "mind",
    emoji: "🔁",
    title: "강박 성향 정밀 검사",
    subtitle: "40문항 · 강박 증상",
    source: "OCI-R(강박 증상 검사) 기반 확장 검사",
    time: "약 5분",
    intro: "씻기·확인·정렬·강박사고·저장 등 강박 증상을 11개 영역 40문항으로 살피는 정밀 검사예요. 지난 한 달 각 경험이 당신을 얼마나 괴롭혔는지 답해주세요.",
    question: "지난 한 달 동안, 다음 경험이 당신을 얼마나 괴롭혔나요?",
    disclaimer: "강박 증상 '선별'용 검사이며 진단이 아니에요.",
    scale: OCIR_SCALE,
    items: ITEMS["ocd"],
    bands: [
      { max: 48, label: "낮음", emoji: "😌", tone: "good", desc: "강박 증상이 일상에 부담을 줄 정도로 두드러지지 않아요.", advice: "지금의 상태를 잘 유지하고 있어요." },
      { max: 96, label: "주의 수준", emoji: "😟", tone: "warn", desc: "확인·정렬·강박사고 등이 생활을 꽤 방해할 수 있는 수준이에요.", advice: "증상이 시간을 많이 뺏거나 괴롭다면 전문가 상담을 권해요. 강박은 치료 효과가 좋은 편이에요." },
      { max: 160, label: "높음", emoji: "😣", tone: "high", desc: "강박 증상이 강하고 광범위해요. 일상 기능에 상당한 영향을 줄 수 있어요.", advice: "정신건강의학과·임상심리 전문가의 도움을 적극 권해요. 인지행동치료(노출·반응방지)가 특히 효과적이에요." },
    ],
    note: "점수가 높아도 진단이 아니며, 전문가 평가가 필요해요.",
  },

  // ═══════════════ 🪞 자기 이해 ═══════════════
  {
    kind: "multi",
    id: "bigfive",
    category: "self",
    emoji: "🧬",
    title: "성격 정밀 검사 (Big Five)",
    subtitle: "120문항 · 5요인 × 30개 하위척도",
    source: "IPIP-NEO-120 (Johnson 2014, 공개 척도)",
    time: "약 12분",
    intro: "심리학에서 가장 신뢰받는 성격 모델을 정밀 검사 버전으로 담았어요. 5개 큰 축을 각각 6개 하위 특성으로 나눠, 당신의 성격을 30개 측면에서 입체적으로 보여줘요. 정답은 없으니 평소의 나를 떠올리며 솔직하게 답해주세요.",
    question: "다음 문장이 나를 얼마나 정확하게 묘사하나요?",
    disclaimer: "성격에는 좋고 나쁨이 없어요. 결과는 '경향'이며, 상황과 시기에 따라 달라질 수 있어요. 120문항으로 약 12분 걸려요.",
    scale: BIG5_SCALE,
    dimensions: [
      {
        key: "O",
        name: "개방성",
        emoji: "🎨",
        desc: "새로운 생각·경험·예술에 끌리는 정도",
        high: {
          text: "호기심 많고 상상력이 풍부해요. 익숙한 것보다 새로운 아이디어와 경험에 끌리고, 추상적인 주제도 즐겨 다뤄요.",
          strengths: "창의적 발상, 변화 적응, 폭넓은 관심사",
          watch: "관심이 너무 넓어 한 가지에 깊이 머무르기 어려울 수 있어요.",
        },
        low: {
          text: "현실적이고 익숙한 것을 선호해요. 검증된 방식과 구체적인 사실을 신뢰하며, 안정감 있게 일을 처리해요.",
          strengths: "실용성, 일관성, 현실 감각",
          watch: "새로운 방식이나 낯선 관점에 마음을 닫지 않도록 가끔 열어두면 좋아요.",
        },
        mid: "익숙함과 새로움 사이에서 균형을 잡는 편이에요. 필요할 때 호기심을, 필요할 때 현실 감각을 발휘해요.",
        facets: [
          { name: "상상력", desc: "풍부한 공상과 상상을 즐김", items: [
            { text: "나는 상상력이 풍부하다" },
            { text: "나는 자유로운 공상에 빠지는 것을 즐긴다" },
            { text: "나는 공상에 잠기는 것을 좋아한다" },
            { text: "나는 생각에 깊이 빠져드는 것을 좋아한다" },
          ]},
          { name: "예술적 관심", desc: "예술과 아름다움을 감상하고 중시함", items: [
            { text: "나는 예술이 중요하다고 믿는다" },
            { text: "나는 남들이 못 보는 아름다움을 발견한다" },
            { text: "나는 시를 좋아하지 않는다", reverse: true },
            { text: "나는 미술관에 가는 것을 즐기지 않는다", reverse: true },
          ]},
          { name: "정서성", desc: "감정을 강하게 느끼고 알아차림", items: [
            { text: "나는 감정을 강렬하게 느낀다" },
            { text: "나는 다른 사람의 감정을 함께 느낀다" },
            { text: "나는 내 감정 반응을 잘 알아차리지 못한다", reverse: true },
            { text: "나는 감정적으로 구는 사람들을 이해하지 못한다", reverse: true },
          ]},
          { name: "모험성", desc: "변화와 새로움을 선호함", items: [
            { text: "나는 반복되는 일상보다 변화를 선호한다" },
            { text: "나는 익숙한 것을 고수하는 편이다", reverse: true },
            { text: "나는 변화를 싫어한다", reverse: true },
            { text: "나는 전통적인 방식에 애착이 있다", reverse: true },
          ]},
          { name: "지성", desc: "추상적·이론적 사고를 즐김", items: [
            { text: "나는 어려운 글 읽기를 좋아한다" },
            { text: "나는 철학적인 토론을 피한다", reverse: true },
            { text: "나는 추상적인 개념을 이해하기 어려워한다", reverse: true },
            { text: "나는 이론적인 토론에 관심이 없다", reverse: true },
          ]},
          { name: "진보성", desc: "기존 권위·관습에 의문을 품음", items: [
            { text: "나는 진보적인 후보에게 투표하는 편이다" },
            { text: "나는 절대적인 옳고 그름은 없다고 생각한다" },
            { text: "나는 보수적인 후보에게 투표하는 편이다", reverse: true },
            { text: "나는 범죄에 엄격하게 대응해야 한다고 믿는다", reverse: true },
          ]},
        ],
      },
      {
        key: "C",
        name: "성실성",
        emoji: "✅",
        desc: "계획적이고 책임감 있게 행동하는 정도",
        high: {
          text: "체계적이고 책임감이 강해요. 계획을 세워 끝까지 해내고, 정돈과 준비를 중요하게 여겨요.",
          strengths: "자기관리, 끈기, 신뢰감",
          watch: "완벽을 좇다 자신을 너무 몰아붙이거나 유연함을 잃지 않도록 주의해요.",
        },
        low: {
          text: "즉흥적이고 자유로운 편이에요. 규칙에 얽매이기보다 그때그때 상황에 맞춰 움직이는 걸 편하게 느껴요.",
          strengths: "유연함, 융통성, 부담 없는 태도",
          watch: "중요한 마감·약속은 작은 장치(알림·체크리스트)로 챙기면 도움이 돼요.",
        },
        mid: "계획성과 융통성을 함께 갖춘 편이에요. 필요하면 체계적으로, 때로는 유연하게 움직여요.",
        facets: [
          { name: "자기효능감", desc: "일을 잘 해낼 수 있다는 자신감", items: [
            { text: "나는 맡은 일을 성공적으로 끝낸다" },
            { text: "나는 내가 하는 일에서 뛰어나다" },
            { text: "나는 일을 매끄럽게 처리한다" },
            { text: "나는 일을 해내는 방법을 잘 안다" },
          ]},
          { name: "정돈성", desc: "정리정돈하고 체계적으로 유지함", items: [
            { text: "나는 정리정돈하는 것을 좋아한다" },
            { text: "나는 물건을 제자리에 두는 것을 자주 잊는다", reverse: true },
            { text: "나는 방을 어질러 놓는다", reverse: true },
            { text: "나는 내 물건을 여기저기 늘어놓는다", reverse: true },
          ]},
          { name: "책임감", desc: "약속·규칙을 지키고 의무를 다함", items: [
            { text: "나는 약속을 지킨다" },
            { text: "나는 진실을 말한다" },
            { text: "나는 규칙을 어긴다", reverse: true },
            { text: "나는 약속을 어긴다", reverse: true },
          ]},
          { name: "성취 추구", desc: "열심히 노력하고 기대 이상을 해냄", items: [
            { text: "나는 기대받는 것 이상으로 해낸다" },
            { text: "나는 열심히 일한다" },
            { text: "나는 일에 시간과 노력을 거의 들이지 않는다", reverse: true },
            { text: "나는 그저 버틸 만큼만 일한다", reverse: true },
          ]},
          { name: "자기통제", desc: "미루지 않고 계획을 끝까지 실행함", items: [
            { text: "나는 늘 준비가 되어 있다" },
            { text: "나는 세운 계획을 끝까지 실행한다" },
            { text: "나는 시간을 허비한다", reverse: true },
            { text: "나는 일을 시작하는 것을 어려워한다", reverse: true },
          ]},
          { name: "신중성", desc: "충동적으로 행동하지 않고 깊이 생각함", items: [
            { text: "나는 생각 없이 일에 뛰어든다", reverse: true },
            { text: "나는 성급하게 결정한다", reverse: true },
            { text: "나는 일을 서둘러 처리한다", reverse: true },
            { text: "나는 생각 없이 행동한다", reverse: true },
          ]},
        ],
      },
      {
        key: "E",
        name: "외향성",
        emoji: "🔆",
        desc: "사람·자극·활동에서 에너지를 얻는 정도",
        high: {
          text: "활기차고 사교적이에요. 사람들과 어울릴 때 에너지를 얻고, 먼저 다가가 분위기를 이끄는 걸 즐겨요.",
          strengths: "사교성, 추진력, 긍정적 에너지",
          watch: "혼자만의 회복 시간도 일부러 챙겨야 지치지 않아요.",
        },
        low: {
          text: "차분하고 내향적인 편이에요. 혼자 또는 소수와 보내는 시간에서 에너지를 충전하고, 깊은 대화를 선호해요.",
          strengths: "집중력, 신중함, 깊이 있는 관계",
          watch: "필요할 때 먼저 의견을 표현하면 기회를 더 잡을 수 있어요.",
        },
        mid: "어울림과 혼자 시간 사이에서 균형을 잡아요. 상황에 따라 활발해지기도, 조용해지기도 해요.",
        facets: [
          { name: "친밀성", desc: "사람들에게 쉽게 다가가고 편하게 어울림", items: [
            { text: "나는 친구를 쉽게 사귄다" },
            { text: "나는 사람들 사이에서 편안함을 느낀다" },
            { text: "나는 다른 사람과 접촉하는 것을 피한다", reverse: true },
            { text: "나는 사람들과 거리를 둔다", reverse: true },
          ]},
          { name: "사교성", desc: "많은 사람과 어울리는 것을 즐김", items: [
            { text: "나는 큰 모임을 아주 좋아한다" },
            { text: "나는 모임에서 여러 사람과 두루 이야기한다" },
            { text: "나는 혼자 있는 것을 더 좋아한다", reverse: true },
            { text: "나는 사람 많은 곳을 피한다", reverse: true },
          ]},
          { name: "자기주장", desc: "주도권을 잡고 이끌려는 경향", items: [
            { text: "나는 주도적으로 일을 맡아 한다" },
            { text: "나는 다른 사람들을 이끌려고 한다" },
            { text: "나는 상황을 직접 통제하려 한다" },
            { text: "나는 남이 앞장서기를 기다리는 편이다", reverse: true },
          ]},
          { name: "활동성", desc: "늘 바쁘고 활기차게 움직임", items: [
            { text: "나는 늘 바쁘다" },
            { text: "나는 항상 바쁘게 움직인다" },
            { text: "나는 여가 시간에도 많은 것을 한다" },
            { text: "나는 느긋하게 쉬는 것을 좋아한다", reverse: true },
          ]},
          { name: "자극 추구", desc: "흥분·모험·스릴을 즐김", items: [
            { text: "나는 짜릿한 흥분을 좋아한다" },
            { text: "나는 모험을 찾아 나선다" },
            { text: "나는 무모하게 행동하는 것을 즐긴다" },
            { text: "나는 거침없이 자유분방하게 행동한다" },
          ]},
          { name: "쾌활함", desc: "즐거움과 긍정적 기분을 잘 느낌", items: [
            { text: "나는 즐거움이 절로 묻어난다" },
            { text: "나는 즐겁게 잘 논다" },
            { text: "나는 삶을 사랑한다" },
            { text: "나는 삶의 밝은 면을 본다" },
          ]},
        ],
      },
      {
        key: "A",
        name: "우호성",
        emoji: "🤝",
        desc: "타인을 배려하고 협력하려는 정도",
        high: {
          text: "따뜻하고 협력적이에요. 다른 사람의 감정에 공감하고, 신뢰와 배려를 바탕으로 관계를 맺어요.",
          strengths: "공감, 협동, 신뢰받는 태도",
          watch: "남을 챙기느라 내 욕구·경계를 놓치지 않도록 살펴요.",
        },
        low: {
          text: "솔직하고 독립적이에요. 분위기에 휩쓸리기보다 자기 기준으로 판단하고, 할 말은 분명히 해요.",
          strengths: "객관성, 경쟁력, 솔직함",
          watch: "표현 방식에 따뜻함을 더하면 협력이 한결 수월해져요.",
        },
        mid: "배려와 솔직함의 균형을 갖췄어요. 공감하면서도 필요할 땐 자기 의견을 분명히 해요.",
        facets: [
          { name: "신뢰", desc: "타인의 선의를 믿음", items: [
            { text: "나는 다른 사람을 믿는다" },
            { text: "나는 사람들이 선한 의도를 가졌다고 믿는다" },
            { text: "나는 사람들의 말을 믿는다" },
            { text: "나는 사람들을 잘 믿지 않는다", reverse: true },
          ]},
          { name: "도덕성", desc: "솔직하고 술수 없이 대함", items: [
            { text: "나는 내 이익을 위해 남을 이용한다", reverse: true },
            { text: "나는 앞서기 위해 속임수를 쓴다", reverse: true },
            { text: "나는 남을 이용해 먹는다", reverse: true },
            { text: "나는 남의 계획을 방해한다", reverse: true },
          ]},
          { name: "이타성", desc: "타인을 돕고 배려함", items: [
            { text: "나는 다른 사람을 염려한다" },
            { text: "나는 남을 돕는 것을 좋아한다" },
            { text: "나는 남의 감정에 무관심하다", reverse: true },
            { text: "나는 남을 위해 시간을 내지 않는다", reverse: true },
          ]},
          { name: "협력성", desc: "다툼을 피하고 협조함", items: [
            { text: "나는 한판 붙는 것을 즐긴다", reverse: true },
            { text: "나는 사람들에게 소리를 지른다", reverse: true },
            { text: "나는 사람들에게 모욕적인 말을 한다", reverse: true },
            { text: "나는 남에게 앙갚음을 한다", reverse: true },
          ]},
          { name: "겸손", desc: "자신을 내세우지 않음", items: [
            { text: "나는 내가 남보다 낫다고 생각한다", reverse: true },
            { text: "나는 나 자신을 높게 평가한다", reverse: true },
            { text: "나는 나 자신을 대단하게 여긴다", reverse: true },
            { text: "나는 내 장점을 자랑한다", reverse: true },
          ]},
          { name: "공감", desc: "약자와 어려운 이에게 연민을 느낌", items: [
            { text: "나는 노숙인들에게 연민을 느낀다" },
            { text: "나는 나보다 어려운 처지의 사람들에게 동정심을 느낀다" },
            { text: "나는 다른 사람의 문제에 관심이 없다", reverse: true },
            { text: "나는 어려운 사람들에 대해 굳이 생각하지 않으려 한다", reverse: true },
          ]},
        ],
      },
      {
        key: "N",
        name: "신경성",
        emoji: "🌊",
        desc: "스트레스와 부정적 감정을 느끼는 민감성",
        high: {
          text: "감정을 예민하게 느끼고 스트레스에 민감해요. 기복이 있을 수 있지만, 그만큼 위험을 빨리 감지하고 섬세하게 알아차려요.",
          strengths: "섬세함, 위험 감지, 깊은 감정 이해",
          watch: "걱정·기복이 커질 땐 호흡·수면·대화로 다독이고, 지속되면 도움을 받는 것도 좋아요.",
        },
        low: {
          text: "감정이 안정적이고 회복이 빨라요. 스트레스 상황에서도 비교적 침착함을 유지하고, 동요가 적어요.",
          strengths: "평정심, 압박 견딤, 안정감",
          watch: "너무 무덤덤해 보이지 않도록, 감정을 표현하는 것도 관계에 도움이 돼요.",
        },
        mid: "대체로 안정적이되 감정도 적절히 느껴요. 상황에 따라 차분함과 예민함을 오가요.",
        facets: [
          { name: "불안", desc: "걱정·긴장을 잘 느낌", items: [
            { text: "나는 이런저런 걱정을 많이 한다" },
            { text: "나는 늘 최악의 상황을 두려워한다" },
            { text: "나는 두려워하는 것이 많다" },
            { text: "나는 쉽게 스트레스를 받는다" },
          ]},
          { name: "분노", desc: "쉽게 화나고 짜증이 남", items: [
            { text: "나는 쉽게 화가 난다" },
            { text: "나는 쉽게 짜증이 난다" },
            { text: "나는 화를 참지 못하고 터뜨린다" },
            { text: "나는 웬만해서는 짜증 내지 않는다", reverse: true },
          ]},
          { name: "우울", desc: "자주 가라앉고 자신을 부정적으로 봄", items: [
            { text: "나는 자주 우울한 기분이 든다" },
            { text: "나는 나 자신이 마음에 들지 않는다" },
            { text: "나는 자주 기분이 가라앉는다" },
            { text: "나는 나 자신에게 만족하며 편안하다", reverse: true },
          ]},
          { name: "자의식", desc: "남의 시선을 의식하고 위축됨", items: [
            { text: "나는 다른 사람에게 다가가기가 어렵다" },
            { text: "나는 남의 주목을 받는 것이 두렵다" },
            { text: "나는 친한 친구들과 있을 때만 마음이 편하다" },
            { text: "나는 어색한 사회적 상황에서도 당황하지 않는다", reverse: true },
          ]},
          { name: "무절제", desc: "충동·욕구를 절제하기 어려움", items: [
            { text: "나는 한번 빠지면 과도하게 몰두(폭식·폭음 등)한다" },
            { text: "나는 좀처럼 지나치게 탐닉하지 않는다", reverse: true },
            { text: "나는 유혹을 쉽게 이겨낸다", reverse: true },
            { text: "나는 욕구를 잘 다스릴 수 있다", reverse: true },
          ]},
          { name: "취약성", desc: "스트레스에 쉽게 압도됨", items: [
            { text: "나는 쉽게 당황한다" },
            { text: "나는 일이 닥치면 쉽게 압도된다" },
            { text: "나는 상황을 감당할 수 없다고 느낀다" },
            { text: "나는 압박 속에서도 침착함을 유지한다", reverse: true },
          ]},
        ],
      },
    ],
  },
  {
    kind: "scored",
    id: "self-esteem",
    category: "self",
    emoji: "🌱",
    title: "자존감 정밀 검사",
    subtitle: "40문항 · 자기 가치감",
    source: "Rosenberg(RSES) 기반 확장 검사",
    time: "약 5분",
    intro: "자기 가치감·자기 수용·자기 비판 등 자존감을 10개 영역 40문항으로 살피는 정밀 검사예요. 평소 자신에 대한 생각에 얼마나 동의하는지 골라주세요.",
    question: "다음 문장에 얼마나 동의하나요?",
    higherWorse: false,
    scale: AGREE_4,
    items: ITEMS["self-esteem"],
    bands: [
      { max: 47, label: "낮은 자존감", emoji: "🌧️", tone: "warn", desc: "요즘 자신을 향한 평가가 박한 편이에요. 스스로를 가혹하게 보고 있을 수 있어요.", advice: "잘한 일을 작게라도 기록해 보세요. 자존감은 고정된 게 아니라 경험으로 자라요. 힘들면 상담도 좋아요." },
      { max: 84, label: "건강한 범위", emoji: "🙂", tone: "good", desc: "전반적으로 안정된 자기 가치감을 갖고 있어요. 흔들릴 때도 있지만 균형이 잡혀 있어요.", advice: "잘하고 있어요. 자기비판이 심해지는 순간을 알아차리고 다정하게 다독여 주세요." },
      { max: 120, label: "높은 자존감", emoji: "😎", tone: "good", desc: "자신을 긍정적으로 바라보는 힘이 강해요. 좋은 자원이에요.", advice: "이 단단함을 유지하되, 타인의 약함에도 너그러운 시선을 함께 가져가면 더 좋아요." },
    ],
    note: "자존감은 상황·시기에 따라 자연스럽게 오르내려요. 한 번의 점수보다 흐름이 더 중요해요.",
  },
  {
    kind: "scored",
    id: "resilience",
    category: "self",
    emoji: "🪴",
    title: "회복탄력성 정밀 검사",
    subtitle: "40문항 · 다시 일어서는 힘",
    source: "Brief Resilience Scale(BRS) 기반 확장 검사",
    time: "약 5분",
    intro: "역경에서 회복하는 힘을 빠른 회복·스트레스 견딤·적응·지지자원 등 10개 영역 40문항으로 살피는 정밀 검사예요. 평소 나의 모습에 가까운 걸 골라주세요.",
    question: "다음 문장에 얼마나 동의하나요?",
    higherWorse: false,
    scale: AGREE_5,
    items: ITEMS["resilience"],
    bands: [
      { max: 104, label: "낮은 회복탄력성", emoji: "🥀", tone: "warn", desc: "요즘 회복하는 데 힘이 많이 드는 시기예요. 충격에서 돌아오는 속도가 느리다고 느낄 수 있어요.", advice: "회복탄력성은 훈련돼요. 작은 성공 경험, 안정적인 관계, 충분한 수면이 토대가 돼요." },
      { max: 160, label: "보통 회복탄력성", emoji: "🙂", tone: "mild", desc: "대체로 무난하게 회복하는 편이에요. 큰 충격에선 시간이 좀 걸릴 수 있어요.", advice: "의지할 사람과 나만의 회복 루틴(운동·취미·휴식)을 미리 갖춰두면 더 단단해져요." },
      { max: 200, label: "높은 회복탄력성", emoji: "💪", tone: "good", desc: "어려움에서 빠르게 회복하는 강한 힘을 가졌어요. 든든한 심리 자원이에요.", advice: "이 힘을 잘 유지하고, 가끔은 충분히 쉬어가는 것도 회복탄력성의 일부예요." },
    ],
  },

  // ═══════════════ 📵 중독·의존 ═══════════════
  {
    kind: "scored",
    id: "sns",
    category: "addiction",
    emoji: "📱",
    title: "SNS 중독 정밀 검사",
    subtitle: "40문항 · 소셜미디어 의존",
    source: "BSMAS(중독 6요소) 기반 확장 검사",
    time: "약 5분",
    intro: "인스타·유튜브·틱톡 등 SNS 의존을 현저성·금단·내성·비교·FOMO 등 11개 영역 40문항으로 살피는 정밀 검사예요. 지난 1년을 떠올려 주세요.",
    question: "지난 1년 동안, 얼마나 자주 그랬나요?",
    scale: BSMAS_FREQ,
    items: ITEMS["sns"],
    bands: [
      { max: 96, label: "낮음", emoji: "😌", tone: "good", desc: "SNS를 비교적 건강하게 쓰고 있어요. 휘둘리지 않는 편이에요.", advice: "지금처럼 '내가 쓰는' 거리감을 유지하세요. 알림 정리만으로도 충분히 좋아요." },
      { max: 136, label: "보통", emoji: "🙂", tone: "mild", desc: "평범한 사용 수준이지만, 무심코 오래 머무는 순간이 있을 수 있어요.", advice: "사용 시간을 한 번 확인해 보세요. 시간 제한·홈화면 정리가 도움이 돼요." },
      { max: 168, label: "주의", emoji: "😟", tone: "warn", desc: "SNS에 끌려다니는 신호가 보여요. 줄이려 해도 잘 안 되는 패턴일 수 있어요.", advice: "특정 앱은 로그아웃해두거나 사용 시간을 정해보세요. 비교로 인한 박탈감도 점검해 보세요." },
      { max: 200, label: "높음", emoji: "😣", tone: "high", desc: "SNS 의존 경향이 뚜렷해요. 일상·기분에 부정적 영향을 줄 수 있어요.", advice: "디지털 디톡스 기간을 정하거나, 어려우면 상담의 도움을 받는 것도 좋아요." },
    ],
  },
  {
    kind: "scored",
    id: "smartphone",
    category: "addiction",
    emoji: "📲",
    title: "스마트폰 중독 정밀 검사",
    subtitle: "40문항 · 스마트폰 의존",
    source: "Smartphone Addiction Scale 기반 확장 검사",
    time: "약 6분",
    intro: "스마트폰 과의존을 현저성·금단·내성·일상장애·신체증상·수면방해 등 12개 영역 40문항으로 살피는 정밀 검사예요. 평소 내 모습에 얼마나 가까운지 골라주세요.",
    question: "다음 문장에 얼마나 동의하나요?",
    scale: AGREE_6,
    items: ITEMS["smartphone"],
    bands: [
      { max: 130, label: "양호", emoji: "😌", tone: "good", desc: "스마트폰을 비교적 잘 통제하며 쓰고 있어요.", advice: "지금의 사용 습관을 유지하세요. 자기 전 1시간 멀리 두기만 해도 좋아요." },
      { max: 180, label: "주의", emoji: "😟", tone: "warn", desc: "스마트폰 의존 경향이 슬슬 보이는 구간이에요.", advice: "사용 시간 통계를 확인하고, 알림·집중 모드를 활용해 보세요. 대체 활동을 만들면 좋아요." },
      { max: 240, label: "높음", emoji: "😣", tone: "high", desc: "스마트폰 의존 위험이 높은 편이에요. 일상 기능에 영향을 줄 수 있어요.", advice: "사용 환경을 바꿔보세요(앱 삭제·흑백 화면·침실 밖 충전). 지속되면 상담도 도움이 돼요." },
    ],
  },
  {
    kind: "scored",
    id: "game",
    category: "addiction",
    emoji: "🎮",
    title: "게임 과몰입 정밀 검사",
    subtitle: "40문항 · 게임 이용",
    source: "DSM-5 인터넷게임장애(IGD) 기반 확장 검사",
    time: "약 5분",
    intro: "게임 과몰입을 몰두·금단·내성·흥미상실·도피·과금 등 11개 영역 40문항으로 살피는 정밀 검사예요. 지난 1년을 떠올려 주세요.",
    question: "지난 1년 동안, 얼마나 자주 그랬나요?",
    scale: GAME_FREQ,
    items: ITEMS["game"],
    bands: [
      { max: 96, label: "낮음", emoji: "😌", tone: "good", desc: "게임을 즐거운 여가로 건강하게 누리고 있어요.", advice: "지금의 균형(게임·수면·관계·할 일)을 유지하면 충분해요." },
      { max: 136, label: "보통", emoji: "🙂", tone: "mild", desc: "대체로 괜찮지만, 가끔 계획보다 길어지는 순간이 있을 수 있어요.", advice: "플레이 시간을 정해두고, 게임 외 즐거움도 함께 챙겨보세요." },
      { max: 168, label: "주의", emoji: "😟", tone: "warn", desc: "과몰입 신호가 보여요. 게임이 일상의 다른 영역을 밀어내고 있을 수 있어요.", advice: "줄이려 할 때 어떤 기분이 드는지 살펴보세요. 시간·상황 규칙을 정하면 도움이 돼요." },
      { max: 200, label: "높음", emoji: "😣", tone: "high", desc: "게임 이용 문제 경향이 뚜렷해요. 학업·일·관계에 영향을 줄 수 있어요.", advice: "혼자 조절이 어렵다면 상담센터·중독관리통합지원센터의 도움을 받아보세요." },
    ],
    note: "이 검사는 진단이 아닌 자가점검이에요. 게임이 학업·일·관계를 자주 밀어낸다면 전문 상담이 도움이 돼요.",
  },
  {
    kind: "scored",
    id: "audit",
    category: "addiction",
    emoji: "🍷",
    title: "음주 습관 정밀 검사",
    subtitle: "40문항 · 음주 문제",
    source: "AUDIT(WHO) 기반 확장 검사",
    time: "약 5분",
    intro: "지난 1년의 음주를 빈도·폭음·내성·조절실패·갈망·금단·피해 등 14개 영역 40문항으로 살피는 정밀 검사예요.",
    question: "지난 1년 동안, 다음에 얼마나 자주 해당했나요?",
    scale: ASRS_FREQ,
    items: ITEMS["audit"],
    bands: [
      { max: 32, label: "저위험 음주", emoji: "😌", tone: "good", desc: "현재 음주는 비교적 낮은 위험 수준이에요.", advice: "지금의 절제된 습관을 유지하세요. 술 없는 날을 정해두면 더 좋아요." },
      { max: 72, label: "위험 음주", emoji: "😟", tone: "warn", desc: "건강에 해가 될 수 있는 '위험 음주' 구간이에요. 아직 돌이키기 쉬운 단계예요.", advice: "마시는 양·횟수를 정해 줄여보세요. 음주 일기를 써보면 패턴이 보여요." },
      { max: 104, label: "유해 음주", emoji: "😣", tone: "high", desc: "이미 몸이나 생활에 해를 주고 있을 가능성이 높은 구간이에요.", advice: "절주 목표를 구체적으로 세우고, 어려우면 전문 상담을 받아보세요." },
      { max: 160, label: "의존 의심", emoji: "🚨", tone: "high", desc: "알코올 의존이 의심되는 수준이에요. 스스로 조절이 어려울 수 있어요.", advice: "혼자 끊기 어려울 수 있어요. 중독관리통합지원센터·정신건강의학과의 도움을 꼭 권해요." },
    ],
    note: "여성·청소년·고령자는 더 낮은 점수부터 주의해서 보는 게 좋아요. 이 검사는 선별·자기점검이며 진단이 아니에요.",
  },

  {
    kind: "scored",
    id: "trauma",
    category: "mind",
    emoji: "🌫️",
    title: "트라우마(PTSD) 정밀 검사",
    subtitle: "40문항 · 외상 후 스트레스",
    source: "PCL-5(DSM-5 PTSD) 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 충격적이거나 생명을 위협하는 사건을 겪은 뒤 나타날 수 있는 외상 후 스트레스 반응을 스스로 점검해 보는 자가 선별 도구입니다. 국제적으로 널리 쓰이는 PCL-5(DSM-5 PTSD 증상 체크리스트)의 구조를 바탕으로, 지난 한 달 동안의 경험을 여섯 영역에서 살펴봅니다. 진단을 내리는 검사가 아니라 지금 나의 상태를 이해하고 도움이 필요한지 가늠해 보는 출발점입니다.",
    question: "지난 한 달 동안, 다음을 얼마나 자주 겪었나요?",
    crisis: true,
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: FREQ_5,
    items: ITEMS["trauma"],
    bands: [
      { max: 40, label: "낮음", emoji: "🌿", tone: "good", desc: "외상 후 스트레스 반응이 거의 나타나지 않거나 매우 약한 수준입니다. 힘든 일을 겪었더라도 현재는 비교적 안정적으로 일상을 유지하고 있는 상태로 보입니다.", advice: "지금의 안정감을 지켜 주는 규칙적인 수면, 운동, 신뢰하는 사람들과의 연결을 이어 가세요. 이후에 기억이나 감정이 다시 떠올라 힘들어진다면 언제든 다시 점검해 보면 됩니다." },
      { max: 80, label: "경미", emoji: "🌤️", tone: "mild", desc: "일부 외상 반응이 있지만 강도는 가벼운 편입니다. 특정 상황에서 긴장하거나 기억이 떠오를 수 있으나 대체로 스스로 다룰 수 있는 수준입니다.", advice: "무리하게 피하기보다는 안전한 환경에서 감정을 인정하고 흘려보내는 연습이 도움이 됩니다. 호흡·이완법과 충분한 휴식을 챙기면서 증상이 점점 심해지지는 않는지 스스로 살펴보세요." },
      { max: 120, label: "중등도", emoji: "⚠️", tone: "warn", desc: "여러 영역에서 외상 후 스트레스 증상이 뚜렷하게 나타나며 일상과 기분에 영향을 주고 있는 상태입니다. 혼자 버티기에 부담이 커지고 있을 수 있습니다.", advice: "증상을 방치하면 만성화될 수 있으므로 정신건강의학과나 심리상담 등 전문적인 평가를 받아 보시길 권합니다. 신뢰할 수 있는 사람에게 지금의 어려움을 털어놓는 것도 큰 힘이 됩니다." },
      { max: 160, label: "높음", emoji: "🚨", tone: "high", desc: "외상 후 스트레스 증상이 광범위하고 강하게 나타나 일상생활과 대인관계, 미래에 대한 전망까지 크게 흔들리고 있는 상태입니다. 적극적인 도움이 필요한 시점입니다.", advice: "가능한 한 빨리 정신건강의학과 전문의나 트라우마 전문 상담자의 도움을 받으시길 강력히 권합니다. 만약 자해나 극단적인 생각이 든다면 망설이지 말고 즉시 정신건강 위기상담전화(1577-0199)나 자살예방 상담전화(109)로 연락하세요." },
    ],
    note: "이 검사는 충격적이거나 생명을 위협하는 사건을 겪은 분을 전제로 한 증상 문항으로 구성되어 있습니다. 문항을 읽고 답하는 과정에서 힘든 기억이나 감정이 떠오를 수 있으니, 안전하고 편안한 환경에서 무리하지 말고 천천히 진행하세요. 이 결과는 의학적 진단이 아니라 자기 이해를 돕기 위한 선별 자료이며, 어려움이 지속되거나 심해진다면 반드시 정신건강 전문가의 도움을 받으시기 바랍니다.",
  },
  {
    kind: "scored",
    id: "insomnia",
    category: "mind",
    emoji: "🌙",
    title: "불면증·수면의 질 검사",
    subtitle: "40문항 · 수면 건강",
    source: "ISI(불면증 심각도 지수) 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 최근 2주 동안의 수면 상태를 점검해 불면 증상의 정도와 수면의 질을 가늠해 보는 자가 선별 도구입니다. 잠드는 어려움, 자주 깨는 정도, 새벽 조기 각성, 수면 만족도, 그리고 낮 동안의 기능 저하와 수면에 대한 불안·생활습관까지 폭넓게 살핍니다. 결과는 지금 내 잠을 객관적으로 돌아보고 필요한 변화를 찾는 출발점이 됩니다.",
    question: "최근 2주 동안, 다음이 얼마나 자주 있었나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: FREQ_5,
    items: ITEMS["insomnia"],
    bands: [
      { max: 40, label: "양호", emoji: "😴", tone: "good", desc: "현재 수면의 질이 대체로 안정적이며 불면 증상이 뚜렷하지 않은 상태입니다. 잠들고 유지하는 데 큰 어려움이 없고 낮 동안의 컨디션도 잘 유지되고 있습니다.", advice: "지금의 규칙적인 수면 리듬과 좋은 습관을 그대로 이어 가세요. 일정한 기상·취침 시각을 지키고 잠들기 전 화면 사용을 줄이면 좋은 상태를 오래 유지할 수 있습니다." },
      { max: 80, label: "경미", emoji: "🌙", tone: "mild", desc: "가벼운 불면 증상이 나타나지만 일상에 큰 지장을 주지는 않는 단계입니다. 가끔 잠들기 어렵거나 밤중에 깨는 일이 있을 수 있습니다.", advice: "카페인 섭취 시간 조절, 취침 전 스마트폰 줄이기, 일정한 기상 시각 지키기 같은 수면위생을 점검해 보세요. 작은 습관 변화만으로도 충분히 나아질 수 있는 시기입니다." },
      { max: 120, label: "중간", emoji: "😟", tone: "warn", desc: "불면 증상이 뚜렷해 잠의 질과 낮 동안의 컨디션에 영향을 주는 단계입니다. 피로·졸음·집중 저하나 수면에 대한 걱정이 반복될 수 있습니다.", advice: "취침·기상 시각을 규칙적으로 고정하고, 잠이 오지 않으면 침대에서 벗어났다가 졸릴 때 다시 눕는 자극조절법을 시도해 보세요. 증상이 2~4주 이상 이어지면 전문가 상담을 고려하는 것이 좋습니다." },
      { max: 160, label: "심각", emoji: "🚨", tone: "high", desc: "불면 증상이 심해 수면과 일상생활 모두에 분명한 지장을 주는 단계입니다. 잠 부족으로 인한 피로·기분 저하·기능 저하가 두드러질 수 있습니다.", advice: "혼자 습관을 바꾸는 것만으로는 회복이 어려울 수 있으니, 수면 클리닉이나 정신건강의학과·가정의학과 전문가의 평가와 도움을 받기를 권합니다. 불면 인지행동치료(CBT-I) 같은 검증된 치료가 큰 도움이 됩니다." },
    ],
    note: "이 검사는 진단이 아닌 선별 도구입니다. '자고 일어나면 몸이 개운하다'처럼 수면 만족·개운함을 묻는 긍정 방향 문항은 역채점되니, 점수를 의식하지 말고 최근 2주간 실제 느낌 그대로 솔직하게 응답하세요. 증상이 2주 이상 지속되거나 일상에 지장을 준다면 전문가의 평가를 받아 보시기 바랍니다.",
  },
  {
    kind: "scored",
    id: "social_anxiety",
    category: "social",
    emoji: "🫥",
    title: "사회불안 정밀 검사",
    subtitle: "40문항 · 사회불안",
    source: "LSAS·SPIN(사회불안) 기반 확장 검사",
    time: "약 5분",
    intro: "사회불안 자가검사는 발표·대화·낯선 사람과의 만남처럼 타인의 시선과 평가가 따르는 사회적 상황에서 느끼는 두려움과 회피 정도를 스스로 점검하는 선별 도구입니다. 국제적으로 널리 쓰이는 LSAS(리보위츠 사회불안척도)와 SPIN(사회공포증척도)의 핵심 증상 영역을 바탕으로, 평소의 경험을 6개 하위영역으로 나누어 살펴봅니다. 의학적 진단이 아니라 사회불안 경향이 어느 정도인지 가늠하고 도움이 필요한지 판단하는 데 참고가 되는 검사입니다.",
    question: "평소 다음이 얼마나 자주 있었나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: FREQ_5,
    items: ITEMS["social_anxiety"],
    bands: [
      { max: 40, label: "낮음", emoji: "🙂", tone: "good", desc: "사회적 상황에서 느끼는 두려움이나 회피가 크지 않은 편입니다. 긴장이 있더라도 대체로 스스로 감당하며, 일상과 대인관계에 큰 지장을 주지 않는 상태로 보입니다.", advice: "지금의 편안함을 유지하면서 가끔 부담스러운 자리도 너무 피하지 않고 경험을 쌓아 두면 좋습니다. 충분한 수면과 규칙적인 생활이 평소 긴장 관리에 도움이 됩니다." },
      { max: 80, label: "가벼움", emoji: "😐", tone: "mild", desc: "발표나 낯선 사람과의 대화 같은 특정 상황에서는 긴장과 부담을 느끼지만, 전반적인 일상 기능은 유지되는 단계입니다. 누구나 겪을 수 있는 수준에 가깝습니다.", advice: "두려운 상황을 무조건 피하기보다 작은 것부터 단계적으로 부딪쳐 보세요. 복식호흡 같은 이완법과 미리 준비하기가 도움이 되며, 불편이 잦아지면 자가 관리법을 익혀 두는 것이 좋습니다." },
      { max: 120, label: "중간", emoji: "😟", tone: "warn", desc: "여러 사회적 상황에서 두려움과 회피가 반복되어 생활·관계·학업이나 일에 어느 정도 지장이 생기는 단계입니다. 예기불안, 사후 곱씹기나 신체증상으로 힘들 수 있습니다.", advice: "회피가 오히려 불안을 키우는 악순환을 만들 수 있으니, 인지행동치료(CBT)나 노출 기반 자기훈련 자료를 찾아보세요. 어려움이 몇 주 이상 지속된다면 전문가 상담을 받아 보길 권합니다." },
      { max: 160, label: "높음", emoji: "😣", tone: "high", desc: "사회적 상황에 대한 두려움과 회피가 강하고 광범위하여 일상·대인관계·기회 전반에 뚜렷한 지장을 주는 단계입니다. 사회불안장애의 가능성을 살펴볼 필요가 있습니다.", advice: "혼자 견디기보다 정신건강의학과나 임상심리전문가의 평가를 받아 보시길 분명히 권합니다. 사회불안은 인지행동치료와 필요시 약물치료로 충분히 호전될 수 있으니, 도움을 청하는 것이 회복의 가장 빠른 길입니다." },
    ],
    note: "이 검사는 진단이 아닌 선별 도구이며, 평소의 두려움·회피 정도를 기준으로 솔직하게 답할 때 가장 정확합니다. 결과 점수 자체보다 일상생활에 얼마나 지장이 있는지가 더 중요합니다. 결과가 높거나 사회적 상황으로 인해 일상이 힘들다면 반드시 정신건강의학과나 임상심리전문가의 평가를 받아 보세요.",
  },
  {
    kind: "scored",
    id: "anger",
    category: "mind",
    emoji: "😤",
    title: "분노 조절 검사",
    subtitle: "40문항 · 분노 조절",
    source: "STAXI(분노) 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 STAXI(상태-특성 분노 표현 척도) 이론을 토대로 평소 나의 분노 경험과 표현 방식을 살펴보는 자가 선별 도구입니다. 분노를 밖으로 터뜨리는 편인지, 속으로 삭이는 편인지, 그리고 분노가 몸과 관계에 어떤 영향을 주는지를 여러 각도에서 점검합니다. 진단이 아니라 자기 이해와 점검을 돕기 위한 것입니다.",
    question: "평소 다음이 얼마나 자주 있나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: FREQ_5,
    items: ITEMS["anger"],
    bands: [
      { max: 40, label: "안정적 조절", emoji: "🟢", tone: "good", desc: "분노가 일어나도 비교적 잘 알아차리고 건강하게 다루는 편입니다. 화가 일상이나 관계에 큰 지장을 주지 않는 상태입니다.", advice: "지금의 조절 방식을 유지하세요. 가벼운 짜증이 쌓이지 않도록 평소 운동·수면·휴식으로 스트레스 기저를 낮게 관리하면 좋습니다." },
      { max: 80, label: "경미한 분노 경향", emoji: "🟡", tone: "mild", desc: "특정 상황에서 화가 다소 빠르게 올라오거나 속으로 쌓이는 경향이 있습니다. 아직 일상 기능에 큰 문제는 아닙니다.", advice: "화가 날 때 여섯을 세며 천천히 숨쉬기, 잠시 자리 피하기 같은 간단한 일시정지 기술을 연습해 보세요. 며칠간 어떤 상황에서 화가 나는지 기록하면 패턴이 보입니다." },
      { max: 120, label: "주의가 필요한 수준", emoji: "🟠", tone: "warn", desc: "분노가 자주·강하게 일어나고 몸의 긴장이나 관계 마찰, 후회가 반복되고 있을 수 있습니다. 분노가 삶에 부담을 주기 시작한 단계입니다.", advice: "분노 일지, 생각 다시 보기(인지 재구성), 이완 훈련 같은 구조화된 분노조절 기법을 꾸준히 적용해 보세요. 가까운 사람과 솔직히 상황을 나누고, 개선이 더디면 전문 상담을 고려하세요." },
      { max: 160, label: "높은 수준 · 전문 도움 권장", emoji: "🔴", tone: "high", desc: "분노가 통제하기 어려울 만큼 자주 폭발하거나 깊이 억눌려, 신체 증상·충동 행동·관계 손상으로 이어지고 있을 수 있습니다.", advice: "혼자 조절하기 어려운 단계일 수 있으니 정신건강의학과나 심리상담 전문가의 평가를 받아보시길 권합니다. 분노로 자신이나 타인이 다칠 위험이 느껴진다면 지체 말고 즉시 도움을 요청하세요." },
    ],
    note: "이 검사는 진단이 아닌 자기점검용 선별 도구입니다. 결과는 시점·상황에 따라 달라질 수 있으며 전문가의 평가를 대신하지 않습니다. 분노로 인해 자신이나 타인을 해칠 위험이 느껴진다면 즉시 전문가나 위기상담(예: 정신건강 상담전화 1577-0199)에 연락하세요.",
  },
  {
    kind: "scored",
    id: "loneliness",
    category: "social",
    emoji: "🕯️",
    title: "외로움·사회적 고립 검사",
    subtitle: "40문항 · 외로움·고립",
    source: "UCLA 외로움 척도 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 '요즘' 내가 느끼는 외로움과 사회적 고립의 정도를 살펴보는 자가 선별 도구입니다. 단순히 혼자 있는 시간이 많은지를 넘어, 친밀함의 부재·단절감·이해받지 못함처럼 주관적으로 경험하는 외로움을 여러 각도에서 살펴봅니다. 전 세계적으로 널리 쓰이는 UCLA 외로움 척도의 핵심 개념을 토대로 자체 문항으로 구성했습니다.",
    question: "요즘 다음을 얼마나 자주 느끼나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: FREQ_5,
    items: ITEMS["loneliness"],
    bands: [
      { max: 40, label: "낮음", emoji: "🟢", tone: "good", desc: "요즘 외로움이나 고립감이 거의 느껴지지 않는 편입니다. 친밀함과 소속감, 기댈 수 있는 관계가 비교적 잘 유지되고 있는 상태로 보입니다.", advice: "지금의 관계를 소중히 가꾸세요. 가까운 사람에게 먼저 안부를 전하거나 정기적인 만남을 이어 가면 이 안정감을 더 오래 유지할 수 있습니다." },
      { max: 80, label: "약간", emoji: "🟡", tone: "mild", desc: "가끔 외롭거나 사람들과 거리감을 느끼는 순간이 있습니다. 일상에 큰 지장은 없지만 연결되고 싶은 마음이 충분히 채워지지 않을 때가 있는 상태입니다.", advice: "마음이 가는 사람에게 가벼운 연락을 먼저 건네 보세요. 취미 모임이나 정기적인 활동 한 가지에 참여하는 것만으로도 어울림의 기회가 늘어납니다." },
      { max: 120, label: "뚜렷함", emoji: "🟠", tone: "warn", desc: "요즘 외로움과 단절감을 자주 또렷하게 느끼고 있습니다. 이해받지 못한다는 느낌이나 기댈 사람이 없다는 생각이 일상의 기분에 영향을 줄 수 있는 단계입니다.", advice: "믿을 만한 사람 한 명에게 솔직한 마음을 조금씩 나눠 보세요. 작더라도 규칙적인 모임을 만들거나 지역 커뮤니티·상담 자원을 알아보는 것도 도움이 됩니다. 혼자 버티려 애쓰지 않아도 됩니다." },
      { max: 160, label: "심함", emoji: "🔴", tone: "high", desc: "외로움과 고립감이 깊고 지속적으로 느껴지는 상태입니다. 이런 상태가 길어지면 우울감·무기력으로 이어지거나 위기 상황으로 번질 수 있어 주의가 필요합니다.", advice: "가능한 한 빨리 정신건강 전문가(정신건강의학과·심리상담)의 도움을 받으시길 권합니다. 혼자 있는 시간이 너무 힘들고 절망감이 든다면 정신건강 상담전화 1577-0199나 자살예방 상담 109(24시간)에 즉시 연락하세요. 가까운 사람에게 지금의 어려움을 알리는 것도 중요한 첫걸음입니다." },
    ],
    note: "이 검사는 진단이 아닌 자가 선별 도구이며, 점수가 특정 질환을 확정하지는 않습니다. 외로움이 깊어지면 무기력·우울·위기감으로 이어질 수 있으니, 마음이 많이 힘들거나 극단적인 생각이 든다면 혼자 견디지 말고 정신건강 상담전화 1577-0199 또는 자살예방 상담 109(24시간)로 즉시 도움을 요청하세요.",
  },
  {
    kind: "scored",
    id: "eating",
    category: "mind",
    emoji: "🍽️",
    title: "섭식 태도 검사",
    subtitle: "40문항 · 섭식 태도",
    source: "EAT-26(섭식 태도) 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 최근 3개월 동안 식사·체중·체형에 대한 태도와 행동을 스스로 점검해 보는 자가 선별 도구입니다. 섭식 태도 평가에 널리 쓰이는 EAT-26(Eating Attitudes Test, 섭식 태도 검사)의 핵심 증상 영역을 바탕으로, 다이어트와 음식 통제, 폭식 충동, 구토·과도한 운동 같은 보상행동, 체형 불만족 등 섭식 문제와 관련된 경험을 여러 각도에서 살펴봅니다. 진단을 내리는 검사가 아니라, 도움이 필요한 신호가 있는지 미리 알아차리도록 돕는 선별 검사입니다.",
    question: "최근 3개월 동안, 다음이 얼마나 자주 있었나요?",
    crisis: true,
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: FREQ_5,
    items: ITEMS["eating"],
    bands: [
      { max: 40, label: "안정 범위", emoji: "🟢", tone: "good", desc: "식사와 체형에 대한 태도가 비교적 건강하고 안정적인 편입니다. 음식이나 몸무게가 일상을 크게 지배하지 않으며, 먹는 즐거움과 절제 사이의 균형이 잡혀 있는 상태로 보입니다.", advice: "지금의 균형 잡힌 식습관과 몸에 대한 태도를 계속 유지하세요. 규칙적인 식사, 충분한 수면, 무리하지 않는 신체활동이 좋은 토대가 됩니다. 스트레스나 감정 때문에 식사 패턴이 흔들릴 때는 잠깐 멈추고 자신의 상태를 살펴보세요." },
      { max: 80, label: "가벼운 신호", emoji: "🟡", tone: "mild", desc: "체중·체형이나 음식에 대한 신경 씀이 평소보다 조금 두드러지는 단계입니다. 일상에 큰 지장은 없지만, 다이어트 생각이나 먹은 뒤 후회 같은 경험이 종종 나타날 수 있습니다.", advice: "체중계 숫자나 거울에 매달리는 시간을 의식적으로 줄여 보세요. 끼니를 거르지 말고 규칙적으로 먹으며, 음식을 '좋은 음식·나쁜 음식'으로 나누는 생각이 들 때 알아차려 보는 연습이 도움이 됩니다. 불편이 늘어나면 가볍게 상담을 고려해 보세요." },
      { max: 120, label: "주의가 필요함", emoji: "🟠", tone: "warn", desc: "음식과 체형에 대한 집착, 통제 시도, 죄책감 등이 일상에 영향을 주기 시작하는 단계입니다. 식사가 편안하지 않고, 몸에 대한 불만이 자주 마음을 차지하고 있을 수 있습니다.", advice: "혼자 견디기보다 신뢰할 수 있는 사람에게 솔직히 털어놓고, 정신건강의학과나 임상심리·상담 전문가의 평가를 받아 보길 권합니다. 폭식, 구토, 굶기, 과도한 운동 같은 행동이 있다면 점수와 상관없이 더 적극적으로 도움을 구하세요." },
      { max: 160, label: "전문가 도움 권고", emoji: "🔴", tone: "high", desc: "섭식 태도와 관련된 어려움의 신호가 뚜렷하게 나타나는 단계입니다. 음식·체중·체형에 대한 생각과 행동이 일상과 건강에 상당한 부담이 되고 있을 가능성이 큽니다.", advice: "가능한 한 빨리 정신건강의학과 전문의나 섭식장애를 다루는 전문기관의 평가를 받으세요. 이 검사는 진단이 아니지만, 지금의 상태는 전문적인 도움이 분명히 필요한 신호입니다. 위기 상황이거나 자해·극단적 생각이 든다면 정신건강 위기상담전화 1577-0199로 즉시 연락하세요." },
    ],
    note: "이 검사는 진단이 아닌 선별 도구이며, 섭식은 민감한 주제입니다. 구토·약물·극단적 굶기 등 위험 신호가 있거나 일상이 힘들다면 점수와 상관없이 정신건강의학과·전문기관의 도움을 받고, 위기 상황에서는 정신건강 위기상담전화 1577-0199로 연락하세요.",
  },
  {
    kind: "scored",
    id: "perfectionism",
    category: "self",
    emoji: "🎯",
    title: "완벽주의 검사",
    subtitle: "40문항 · 다차원 완벽주의",
    source: "FMPS·APS-R 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 다차원 완벽주의 이론(FMPS, APS-R)을 바탕으로 당신의 완벽주의 성향을 여러 측면에서 살펴봅니다. 단순히 '완벽주의가 있다/없다'가 아니라, 높은 기준을 세우는 성취지향적 면과 실수·평가에 과도하게 얽매이는 부적응적 면을 구분해 보여줍니다. 점수가 높을수록 부적응적 완벽주의 경향이 강함을 뜻합니다.",
    question: "평소 다음이 나에게 얼마나 해당하나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: AGREE5_04,
    items: ITEMS["perfectionism"],
    bands: [
      { max: 40, label: "낮음 · 유연한 태도", emoji: "🌿", tone: "good", desc: "높은 기준을 갖더라도 실수와 불완전함을 유연하게 받아들이는 편입니다. 완벽주의가 삶을 크게 압박하지 않습니다.", advice: "지금의 균형 잡힌 태도를 유지하세요. 목표를 향해 나아가되 실수를 배움으로 여기는 지금의 방식이 큰 자산입니다." },
      { max: 80, label: "보통 · 성취지향", emoji: "🌱", tone: "mild", desc: "목표의식이 뚜렷하고 성실하지만, 때때로 실수나 평가에 신경이 쓰이는 정도입니다. 대체로 건강한 범위입니다.", advice: "'충분히 잘함'의 기준을 스스로 정해 두세요. 모든 일에 100점을 요구하기보다 중요도에 따라 힘을 배분하면 지치지 않습니다." },
      { max: 120, label: "다소 높음 · 주의", emoji: "⚠️", tone: "warn", desc: "실수 염려, 자기비판, 수행 의심 등이 일상에 반복적으로 나타나 스스로를 자주 몰아붙이는 경향이 보입니다.", advice: "완벽함과 자기 가치를 분리해 보세요. 자신에게 친구를 대하듯 말을 건네는 연습, 작은 '미완성'을 일부러 허용해 보는 연습이 도움이 됩니다." },
      { max: 160, label: "높음 · 부담 큼", emoji: "🔴", tone: "high", desc: "완벽하지 못하면 무가치하게 느끼거나 실수·평가에 대한 불안이 커, 일상과 정서에 상당한 부담을 주고 있을 수 있습니다.", advice: "혼자 감당하기 버겁다면 심리상담사나 정신건강 전문가의 도움을 받아 보시길 권합니다. 부적응적 완벽주의는 상담·인지행동적 접근으로 충분히 완화될 수 있습니다." },
    ],
    note: "이 검사는 완벽주의 성향을 가늠하는 선별 도구일 뿐, 강박장애·불안·우울 등에 대한 의학적 진단이 아니며 진단은 반드시 전문가의 평가로 이루어져야 합니다. 결과로 인해 불안이 크거나 일상에 뚜렷한 어려움이 있다면 정신건강 전문가와 상담하시기를 권합니다.",
  },
  {
    kind: "scored",
    id: "procrastination",
    category: "self",
    emoji: "⏳",
    title: "미루기(지연행동) 검사",
    subtitle: "40문항 · 지연행동",
    source: "PPS·Tuckman 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 평소 나의 미루기(지연행동) 경향을 스스로 점검하는 자가 선별 도구입니다. 시작을 미루는 습관부터 마감 임박까지의 방치, 결정 지연, 주의분산과 회피, 자기조절 실패, 미룬 뒤의 자책, 계획대로 실행하지 못하는 정도까지 7개 영역을 두루 살펴봅니다. 순수 지연행동 척도(PPS)와 Tuckman 지연 척도의 관점을 참고해 구성했습니다.",
    question: "평소 다음이 나에게 얼마나 해당하나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: AGREE5_04,
    items: ITEMS["procrastination"],
    bands: [
      { max: 40, label: "낮음", emoji: "🌱", tone: "good", desc: "미루기 경향이 낮고, 대체로 제때 시작해 계획한 대로 일을 처리하는 편입니다.", advice: "지금의 좋은 습관을 유지하세요. 작은 일도 미루지 않고 바로 처리하는 리듬을 계속 이어가면 됩니다." },
      { max: 80, label: "약간 있음", emoji: "🙂", tone: "mild", desc: "평소에는 무난하지만 특정 상황에서 가끔 미루는 모습이 나타납니다.", advice: "미루게 되는 순간의 패턴(주로 어떤 일, 어떤 시간대인지)을 관찰해 보세요. 일을 잘게 쪼개 첫 5분만 시작하는 방법이 도움이 됩니다." },
      { max: 120, label: "주의", emoji: "⚠️", tone: "warn", desc: "여러 영역에서 미루기가 반복되며 일상과 마음에 부담을 주기 시작하는 수준입니다.", advice: "마감을 스스로 앞당겨 정하고, 주의분산 요인(휴대폰 등)을 물리적으로 차단해 보세요. 미룬 자신을 탓하기보다 다음 한 걸음에 집중하는 편이 회복에 좋습니다. 어려움이 이어진다면 전문가 상담도 도움이 됩니다." },
      { max: 160, label: "높음", emoji: "🧭", tone: "high", desc: "지연행동이 광범위하고 뚜렷하여 학업·업무·생활과 자존감에 상당한 지장을 주는 수준입니다.", advice: "혼자 습관을 바꾸기 어렵다면 상담심리 전문가나 정신건강 전문가의 도움을 받아보길 권합니다. 미루기 뒤에 불안·우울·완벽주의 같은 요인이 있는지 함께 점검하면 좋습니다." },
    ],
    note: "이 검사는 진단이 아닌 자기 점검용 선별 도구이며, 결과는 그날의 컨디션과 상황에 따라 달라질 수 있으니 참고 정보로만 활용하세요. 어려움이 크게 느껴진다면 점수와 무관하게 전문가의 도움을 고려하시기 바랍니다.",
  },
  {
    kind: "scored",
    id: "narcissism",
    category: "self",
    emoji: "👑",
    title: "자기애(나르시시즘) 성향 검사",
    subtitle: "40문항 · 자기애 성향",
    source: "NPI 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 자기애적 성격 척도(NPI)의 개념 틀을 바탕으로, 평소 나의 자기애 성향이 어느 정도인지 스스로 살펴보는 자가검사입니다. 리더십 욕구, 특권의식, 자기과시, 우월감, 착취적 태도, 인정 갈구, 공감 등 여러 측면을 두루 다룹니다. 이는 성격 특성을 이해하기 위한 것이며, '자기애성 성격장애'를 진단하는 도구가 아닙니다.",
    question: "평소 다음이 나에게 얼마나 해당하나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: AGREE5_04,
    items: ITEMS["narcissism"],
    bands: [
      { max: 40, label: "낮음", emoji: "🌱", tone: "good", desc: "자기애 성향이 낮은 편으로, 겸손과 타인 배려가 두드러지는 결과입니다. 남의 감정을 잘 헤아리고 특권을 바라지 않는 경향이 있습니다.", advice: "지금의 균형 잡힌 태도는 분명한 강점입니다. 다만 자신의 정당한 욕구나 성취도 편하게 드러낼 수 있으면 더 건강한 자기표현에 도움이 됩니다." },
      { max: 80, label: "보통", emoji: "🙂", tone: "mild", desc: "대다수 사람과 비슷한 수준의 자기애 성향입니다. 자신감과 배려가 상황에 따라 적절히 오가는 흔한 범위입니다.", advice: "자기 확신과 타인 존중 사이의 균형을 의식적으로 살펴보세요. 인정 욕구가 커지는 순간을 알아차리는 연습이 도움이 됩니다." },
      { max: 120, label: "다소 높음", emoji: "✨", tone: "warn", desc: "자기애 성향이 평균보다 다소 높게 나타납니다. 주목·인정 욕구나 우월감, 특권의식이 두드러질 수 있습니다.", advice: "관계에서 상대의 입장을 먼저 헤아리는 연습이 도움이 됩니다. 인정에 기대지 않아도 흔들리지 않는 자기 가치감을 키워 보세요." },
      { max: 160, label: "높음", emoji: "🔎", tone: "high", desc: "자기애 성향이 뚜렷하게 높은 편입니다. 특권의식·착취적 태도·공감의 어려움이 대인관계에 부담을 줄 수 있습니다. 이는 성향에 대한 선별 결과일 뿐 장애 진단이 아닙니다.", advice: "자신을 낙인찍기보다, 관계나 일상에서 반복되는 갈등이나 공허감이 크게 느껴진다면 심리상담 전문가와 이야기 나눠 보길 권합니다. 전문가의 도움은 자기 이해와 관계 개선에 큰 힘이 됩니다." },
    ],
    note: "이 검사는 성격 특성에 대한 자가 선별 도구이며, '자기애성 성격장애' 진단이 아닙니다. 자기애 성향은 누구에게나 어느 정도 있는 정상적 요소이니, 결과로 자신이나 타인을 규정하거나 낙인찍지 마세요. 걱정이 되거나 일상·관계에 어려움이 크다면 정신건강 전문가와 상의하시길 권합니다.",
  },
  {
    kind: "scored",
    id: "alexithymia",
    category: "self",
    emoji: "🎭",
    title: "감정표현 불능 검사",
    subtitle: "40문항 · 알렉시티미아",
    source: "TAS-20 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 자신의 감정을 알아차리고 말로 표현하는 데 얼마나 어려움을 느끼는지를 살펴보는 자가 선별 도구입니다. 감정을 잘 인식하지 못하고 내면보다 사실·행동 위주로 사고하는 경향을 '감정표현 불능(알렉시티미아)'이라 부르며, 국제적으로 널리 쓰이는 TAS-20(토론토 감정표현불능척도)의 개념 틀을 바탕으로 구성했습니다. 결과는 진단이 아니라 지금 나의 감정 인식·표현 성향을 돌아보는 참고 자료입니다.",
    question: "평소 다음이 나에게 얼마나 해당하나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: AGREE5_04,
    items: ITEMS["alexithymia"],
    bands: [
      { max: 40, label: "낮음 (감정 인식·표현 양호)", emoji: "🌿", tone: "good", desc: "자신의 감정을 비교적 잘 알아차리고 말로 표현하는 편입니다. 몸의 신호와 감정을 연결하고 타인의 마음도 무리 없이 헤아립니다.", advice: "지금의 감정 알아차림 습관을 유지하세요. 하루를 마치며 '오늘 어떤 감정을 느꼈나'를 짧게 돌아보면 이 강점이 더 단단해집니다." },
      { max: 80, label: "약간 있음 (부분적 어려움)", emoji: "🍃", tone: "mild", desc: "대체로 괜찮지만 특정 상황이나 영역에서는 감정을 알아차리거나 표현하기가 조금 버거울 수 있습니다.", advice: "하위영역 중 점수가 높은 부분을 살펴보세요. 감정을 느낄 때 그 감정에 이름을 붙여 보는 '감정 명명' 연습이 도움이 됩니다." },
      { max: 120, label: "중간 (뚜렷한 어려움)", emoji: "🌥️", tone: "warn", desc: "감정을 식별하거나 말로 옮기는 일이 자주 어렵게 느껴지고, 몸의 반응과 감정을 구분하기 힘든 경향이 보입니다.", advice: "감정 일기를 쓰거나 감정 단어 목록을 참고해 지금의 느낌을 문장으로 적어 보세요. 신뢰하는 사람에게 마음을 말로 표현하는 연습도 권합니다." },
      { max: 160, label: "높음 (상당한 어려움)", emoji: "🌧️", tone: "high", desc: "감정을 알아차리고 표현하는 데 전반적으로 큰 어려움을 겪고 있을 가능성이 높습니다. 이는 대인관계나 스트레스 관리에 부담이 될 수 있습니다.", advice: "혼자 애쓰기보다 상담·임상심리 전문가나 정신건강의학과의 도움을 받아 보시길 권합니다. 전문적인 평가와 함께 감정 다루기를 연습하면 한결 수월해집니다." },
    ],
    note: "이 검사는 감정표현 불능 성향을 스스로 점검해 보는 선별 도구일 뿐 의학적 진단이 아니며, 결과가 걱정된다면 반드시 정신건강 전문가와 상의하세요.",
  },
  {
    kind: "scored",
    id: "relcontrol",
    category: "social",
    emoji: "🚩",
    title: "데이트·통제 관계 점검",
    subtitle: "40문항 · 통제·정서학대 신호",
    source: "친밀관계 내 통제·정서학대 지표 기반",
    time: "약 5분",
    intro: "이 검사는 현재 또는 최근의 연애·친밀 관계에서 '상대가 나에게' 하는 통제와 정서적 학대(가스라이팅) 신호를 점검하는 자가 선별 도구입니다. 감시·고립·비난·가스라이팅·죄책감 조종·위협·경제적 통제·애정과 냉대의 반복·사과와 재발의 순환 같은 패턴이 얼마나 나타나는지 살펴봅니다. 진단이 아니라, 지금 내 관계를 안전하게 돌아보기 위한 참고 자료입니다.",
    question: "현재 또는 최근 연애·친밀 관계에서, 상대가 나에게 다음처럼 하나요?",
    disclaimer: "이 검사는 선별·자기점검이며 의학적 진단이 아니에요.",
    scale: AGREE5_04,
    items: ITEMS["relcontrol"],
    bands: [
      { max: 40, label: "존중받는 관계 신호", emoji: "🌱", tone: "good", desc: "통제나 정서적 학대의 신호가 거의 나타나지 않고, 서로 존중하는 건강한 관계에 가깝습니다.", advice: "지금처럼 서로의 경계와 자유를 존중하는 방식을 이어가세요. 다만 특정 문항에서 마음에 걸리는 부분이 있었다면 그 감정도 소중히 살펴보세요." },
      { max: 80, label: "주의가 필요한 신호", emoji: "🟡", tone: "mild", desc: "일부 통제·조종의 신호가 보입니다. 반복되면 관계가 나를 위축시키는 방향으로 굳어질 수 있습니다.", advice: "어떤 문항에서 점수가 높았는지 돌아보고, 불편한 지점을 상대에게 명확히 말하거나 믿을 만한 사람과 이야기 나눠 보세요." },
      { max: 120, label: "통제·정서학대 신호 뚜렷", emoji: "🟠", tone: "warn", desc: "감시·비난·가스라이팅·조종 등 여러 영역에서 통제와 정서적 학대의 신호가 뚜렷하게 나타납니다.", advice: "이는 당신의 잘못이 아닙니다. 혼자 견디지 말고 신뢰할 수 있는 사람이나 상담 기관에 상황을 털어놓고, 안전을 위한 거리와 지원을 함께 마련해 보세요. 필요하다면 여성긴급전화 1366(24시간) 등 전문 상담을 이용할 수 있습니다." },
      { max: 160, label: "위험 수준·전문 도움 필요", emoji: "🔴", tone: "high", desc: "위협·경제적 통제를 포함한 강한 통제와 정서적 학대의 신호가 심각한 수준입니다. 당신의 안전이 가장 우선입니다.", advice: "결코 당신의 탓이 아닙니다. 지금 바로 여성긴급전화 1366(24시간)이나 긴급 상황 시 112, 또는 믿을 수 있는 주변 사람에게 도움을 요청하세요. 전문 상담 기관과 함께 안전 계획을 세우는 것이 중요합니다." },
    ],
    note: "이 검사는 '상대가 나에게' 하는 통제·정서학대 행동을 점검하는 것이며, 결과가 어떻든 학대는 당신의 잘못이 아닙니다. 선별용 참고 자료일 뿐 진단이 아니며, 안전이 위협받는다면 점수와 무관하게 즉시 도움을 요청하세요(여성긴급전화 1366, 긴급 시 112).",
  },
  {
    kind: "multi",
    id: "attachment",
    category: "social",
    emoji: "💞",
    title: "성인 애착유형 검사",
    subtitle: "애착 불안·회피 2축 → 4유형",
    source: "ECR-R(친밀관계 경험) 기반 확장 검사",
    time: "약 5분",
    intro: "이 검사는 성인의 연애·친밀 관계에서 드러나는 애착 방식을 두 축으로 측정합니다. 하나는 '애착 불안'(상대에게 버림받거나 사랑받지 못할까 봐 느끼는 두려움과 인정 갈구), 다른 하나는 '애착 회피'(친밀함과 의존을 불편해하며 거리를 두려는 성향)입니다. 두 축의 조합으로 안정형·몰입형·거부회피형·공포회피형이라는 네 가지 관계 유형을 확인합니다.",
    question: "연애·친밀한 관계에서 다음이 나에게 얼마나 해당하나요?",
    disclaimer: "애착유형은 고정된 게 아니라 관계·경험에 따라 달라질 수 있어요. 결과는 참고용이에요.",
    resultTitle: "나의 애착유형",
    scale: BIG5_SCALE,
    dimensions: [
      {
        key: "anxiety",
        name: "애착 불안",
        emoji: "🌊",
        desc: "관계에서 버림받을까 봐 두려워하고 상대의 사랑과 인정을 끊임없이 확인받고 싶어 하는 정도입니다. 높을수록 상대에게 몰두·집착하기 쉽고, 낮을수록 관계 안에서 자신의 가치를 안정적으로 느낍니다.",
        high: { text: "나는 상대의 마음을 자주 확인하고 싶고, 사랑받지 못하거나 버림받을까 봐 쉽게 불안해집니다. 연락이 늦거나 반응이 미지근하면 금세 마음이 크게 흔들리고, 관계에 온통 몰두하는 편입니다.", strengths: "나는 관계에 깊이 헌신하고 상대에게 진심으로 다가갑니다. 정서적으로 예민하게 반응해 상대의 감정 변화를 잘 알아채고, 가까워지려는 마음이 강합니다.", watch: "작은 신호를 큰 위협으로 해석해 확인·집착·서운함이 반복되면 오히려 상대를 지치게 할 수 있습니다. 내 불안이 상대의 잘못이 아닐 수 있다는 점을 놓치기 쉽습니다." },
        low: { text: "나는 상대의 사랑을 비교적 안정적으로 믿고, 잠깐 연락이 뜸하거나 갈등이 있어도 크게 흔들리지 않습니다. 버림받을까 봐 전전긍긍하기보다 관계를 여유 있게 대합니다.", strengths: "나는 정서적으로 안정적이어서 관계에 불필요한 긴장을 만들지 않습니다. 상대에게 안정감을 주고, 갈등 상황에서도 침착함을 유지합니다.", watch: "너무 무던해서 상대가 보내는 정서적 신호나 서운함을 대수롭지 않게 넘길 수 있습니다. 가끔은 상대가 나의 관심과 확인을 필요로 한다는 점을 기억할 필요가 있습니다." },
        mid: "나는 대체로 안정적이지만, 관계가 중요해지거나 상황이 불안정할 때는 상대의 마음을 확인하고 싶어집니다. 평소에는 여유롭다가도 특정 순간에 버림받는 두려움이 올라올 수 있는, 상황에 따라 달라지는 편입니다.",
        facets: [
          { name: "버림받음 두려움", desc: "관계가 끝나거나 상대에게 버려질 가능성에 대한 민감함과 두려움", items: [
            { text: "상대가 나를 떠날지도 모른다는 생각이 자주 든다" },
            { text: "연인이 예전만큼 나를 원하지 않을까 봐 두렵다" },
            { text: "관계가 잘 되어갈 때조차 언젠가 버림받을까 봐 불안하다" },
            { text: "상대에게 무슨 일이 생기면 나만 혼자 남겨질까 봐 겁이 난다" },
            { text: "나는 상대가 나를 떠날 거라는 걱정을 거의 하지 않는다", reverse: true },
          ]},
          { name: "인정·확인 갈구", desc: "상대의 사랑과 관심을 반복적으로 확인받고 싶어 하는 욕구", items: [
            { text: "상대가 나를 정말 사랑하는지 자주 확인하고 싶다" },
            { text: "상대의 애정 표현이 없으면 마음이 불안해진다" },
            { text: "내가 사랑받고 있다는 확신을 계속 얻어야 안심이 된다" },
            { text: "상대의 반응이 미지근하면 내가 부족한 사람인가 싶어진다" },
            { text: "상대의 애정을 굳이 확인하지 않아도 나는 편안하다", reverse: true },
          ]},
          { name: "상대에 몰두·집착", desc: "관계와 상대에게 마음과 생각이 과도하게 쏠리는 정도", items: [
            { text: "연애를 하면 그 사람 생각으로 하루가 가득 찬다" },
            { text: "상대와 늘 붙어 있고 최대한 가까이 있고 싶다" },
            { text: "상대에게 마음을 쏟다 보면 내 일상이 뒷전이 되곤 한다" },
            { text: "상대가 나에게 몰입하는 만큼 나도 그러길 바란다" },
          ]},
          { name: "분리 불안·서운함", desc: "연락이나 접촉이 줄 때 느끼는 초조함과 서운함", items: [
            { text: "상대의 답장이 늦으면 마음이 초조하고 불안해진다" },
            { text: "상대와 떨어져 있으면 관계가 흔들릴까 봐 걱정된다" },
            { text: "연락이 뜸해지면 무언가 잘못됐다는 생각에 사로잡힌다" },
            { text: "상대가 나에게 소홀한 것 같으면 크게 서운해진다" },
            { text: "상대와 잠시 떨어져 있어도 나는 별로 불안하지 않다", reverse: true },
          ]},
        ],
      },
      {
        key: "avoidance",
        name: "애착 회피",
        emoji: "🧊",
        desc: "친밀함과 감정적 개방을 불편해하고 상대에게 기대거나 의지하기를 꺼리는 정도입니다. 높을수록 자기 의존과 거리두기를 선호하고, 낮을수록 가까움과 상호 의존을 편안하게 받아들입니다.",
        high: { text: "나는 누군가와 지나치게 가까워지는 것이 부담스럽고, 속마음을 털어놓거나 상대에게 기대는 일이 잘 안 됩니다. 혼자만의 공간과 독립을 지키는 것이 편하고, 감정을 드러내기보다 담아두는 편입니다.", strengths: "나는 독립적이고 자기 삶을 스스로 잘 꾸려갑니다. 위기 상황에서도 감정에 휩쓸리지 않고 침착하며, 상대에게 과하게 의존하지 않아 스스로를 잘 지탱합니다.", watch: "거리를 두고 감정을 억누르다 보면 상대가 벽을 느끼고 외로워질 수 있습니다. 도움이 필요할 때조차 혼자 감당하려다 관계의 깊이가 얕아질 위험이 있습니다." },
        low: { text: "나는 상대와 가까워지고 속마음을 나누는 것이 편안합니다. 필요할 때 기대고 도움을 청하는 데 거리낌이 없으며, 감정을 솔직하게 표현하며 서로 의지하는 관계를 자연스럽게 받아들입니다.", strengths: "나는 정서적으로 열려 있어 친밀한 유대를 잘 만듭니다. 마음을 나누고 함께 문제를 풀어가며, 상대에게 신뢰와 안정감을 줍니다.", watch: "가까움을 소중히 여기는 만큼, 혼자만의 시간이나 상대의 독립적인 공간도 존중할 필요가 있습니다. 때로는 나만의 경계를 지키는 연습도 도움이 됩니다." },
        mid: "나는 가까움과 거리 사이에서 균형을 찾는 편입니다. 상대와 마음을 나누는 것도 좋지만 혼자만의 공간도 필요하고, 상황이나 상대에 따라 개방과 거리두기 사이를 오갈 수 있습니다.",
        facets: [
          { name: "친밀감 불편", desc: "정서적·심리적으로 가까워지는 것에 대한 불편함", items: [
            { text: "누군가와 아주 가까워지면 오히려 부담스럽고 답답하다" },
            { text: "상대가 너무 가까이 다가오면 한 발 물러서고 싶어진다" },
            { text: "깊은 정서적 친밀함은 나에게 불편하게 느껴진다" },
            { text: "나는 상대와 정서적으로 가까워지는 것이 편안하다", reverse: true },
          ]},
          { name: "자기의존·독립 고수", desc: "상대에게 기대기보다 혼자 해결하려는 자립 성향", items: [
            { text: "문제가 생기면 상대보다 나 혼자 해결하는 편이 낫다" },
            { text: "누군가에게 의지하는 것보다 스스로 감당하는 게 마음 편하다" },
            { text: "관계 안에서도 나만의 독립성을 지키는 것이 중요하다" },
            { text: "필요할 때 상대에게 기대는 것이 나에게는 어렵다" },
            { text: "나는 힘들 때 상대에게 편하게 기대고 도움을 청한다", reverse: true },
          ]},
          { name: "감정 표현 억제", desc: "속마음과 감정을 드러내지 않고 담아두는 경향", items: [
            { text: "내 속마음이나 감정을 상대에게 잘 드러내지 않는다" },
            { text: "힘든 일이 있어도 혼자 삭이는 편이다" },
            { text: "감정을 표현하기보다 담아두는 것이 익숙하다" },
            { text: "나는 내 감정과 고민을 상대에게 솔직하게 이야기한다", reverse: true },
          ]},
          { name: "의지 꺼림·거리두기", desc: "상대에게 마음으로 의지하기를 미루고 심리적 거리를 두는 태도", items: [
            { text: "상대에게 마음을 완전히 여는 데는 시간이 오래 걸린다" },
            { text: "관계가 깊어지려 하면 무의식적으로 거리를 두게 된다" },
            { text: "상대를 온전히 믿고 의지하기가 조심스럽다" },
            { text: "나는 상대를 신뢰하고 마음을 열어 의지하는 편이다", reverse: true },
          ]},
        ],
      },
    ],
    quadrant: [
      { key: "secure", label: "안정형", emoji: "🌿", desc: "나는 불안도 회피도 낮아, 가까움과 독립 사이에서 균형을 잡는 편입니다. 상대를 믿고 마음을 열면서도 나 자신을 잃지 않으며, 갈등이 생겨도 크게 흔들리지 않고 대화로 풀어갑니다.", strengths: "신뢰와 안정감을 바탕으로 깊고 편안한 관계를 만듭니다. 감정을 솔직하게 나누고, 상대에게 기대는 것과 지지해 주는 것 모두 자연스럽습니다.", watch: "모든 관계가 나처럼 안정적이지 않을 수 있습니다. 불안하거나 회피적인 상대의 방식을 이해하려는 인내가 때로 필요합니다.", tip: "내가 느끼는 안정감을 관계의 기준점으로 삼되, 상대의 속도를 존중하며 안전한 분위기를 먼저 만들어 주세요. 나의 솔직한 소통이 상대의 애착도 안정 쪽으로 이끌 수 있습니다." },
      { key: "anxious", label: "몰입형", emoji: "💗", desc: "나는 불안은 높고 회피는 낮아, 관계에 깊이 몰두하면서도 버림받을까 봐 자주 불안해합니다. 상대와 가까워지고 싶은 마음이 크지만, 사랑을 확인받지 못하면 쉽게 흔들립니다.", strengths: "관계에 헌신적이고 정서적으로 따뜻하며 상대의 감정에 민감하게 반응합니다. 가까워지려는 진심과 표현력이 큽니다.", watch: "작은 신호를 위협으로 해석해 확인·집착·서운함이 반복되면 스스로도 지치고 상대도 부담을 느낄 수 있습니다.", tip: "불안이 올라올 때 곧바로 반응하기 전에 잠시 멈추고 '이게 사실인지, 내 두려움인지' 구분해 보세요. 상대에게 확인을 요구하기보다 내 감정을 담담히 표현하고, 나 자신을 안심시키는 연습이 관계를 편안하게 합니다." },
      { key: "dismissing", label: "거부회피형", emoji: "🧊", desc: "나는 불안은 낮고 회피는 높아, 혼자서도 잘 지내며 지나친 친밀함을 부담스러워합니다. 감정을 드러내거나 상대에게 기대기보다 독립과 자기 통제를 선호합니다.", strengths: "자립적이고 위기에도 침착하며, 관계에 과도하게 매달리지 않아 스스로를 안정적으로 지탱합니다.", watch: "거리를 두고 감정을 억누르다 보면 상대가 벽을 느끼고 외로워질 수 있습니다. 친밀함을 회피하다 관계가 얕아질 위험이 있습니다.", tip: "물러서고 싶은 순간이 바로 가까워질 기회일 수 있습니다. 작은 감정이라도 한 문장씩 말로 표현하고, 도움이 필요할 때 상대에게 기대 보세요. 친밀함이 나의 독립을 위협하지 않는다는 것을 경험으로 확인하는 것이 중요합니다." },
      { key: "fearful", label: "공포회피형", emoji: "🌊", desc: "나는 불안도 회피도 높아, 가까워지고 싶은 마음과 상처받을까 봐 물러서는 마음이 동시에 있습니다. 사랑을 원하면서도 다가오면 두려워, 밀고 당기는 갈등을 자주 겪습니다.", strengths: "관계의 복잡한 감정을 예민하게 알아채고, 깊은 연결을 향한 갈망이 있습니다. 자기 성찰의 힘이 크고, 진정성 있는 관계를 바랍니다.", watch: "다가가고 싶다가도 겁이 나 밀어내는 패턴이 반복되면 나도 상대도 혼란스럽고 지칠 수 있습니다. 신뢰를 쌓기까지 시간이 걸립니다.", tip: "안전하다고 느껴지는 관계에서 아주 작은 것부터 조금씩 마음을 열어 보세요. 불안과 회피가 함께 올라올 때 스스로를 몰아세우지 말고, 필요하면 전문적인 도움이나 신뢰할 사람과의 꾸준한 경험을 통해 '가까워져도 안전하다'는 감각을 천천히 회복하는 것이 좋습니다." },
    ],
  },
  {
    kind: "typed",
    id: "lovestyle",
    category: "social",
    emoji: "💘",
    title: "연애 스타일 검사",
    subtitle: "6유형 · 사랑의 6가지 유형",
    source: "Lee의 사랑의 유형(LAS) 기반",
    time: "약 3분",
    intro: "이 검사는 캐나다 사회학자 존 앨런 리(John Alan Lee)의 '사랑의 색깔(Colors of Love)' 이론을 바탕으로, 내가 연애에서 어떤 사랑의 유형에 가까운지 알아보는 심리 테스트다. 사랑을 여섯 가지 스타일 — 에로스(낭만적·열정), 루두스(유희적·자유), 스토르게(우정 같은 편안함), 프라그마(현실적·조건), 마니아(소유적·집착), 아가페(헌신적·이타) — 로 나누어 살펴본다.",
    questions: [
      { q: "토요일 저녁, 연인과 데이트 계획을 세운다. 나는?", options: [
        { t: "분위기 좋은 곳을 예약하고 촛불이며 음악까지 완벽하게 세팅해둔다. 특별한 밤을 만들고 싶다", type: "eros" },
        { t: "딱히 정하지 않는다. 그냥 나가서 발길 닿는 대로, 재밌어 보이는 데 아무 데나 들어가면 되지", type: "ludus" },
        { t: "늘 가던 그 카페, 늘 앉던 그 자리. 편한 게 최고다", type: "storge" },
        { t: "가성비 좋고 후기 검증된 곳으로 고른다. 괜히 실패해서 시간 버리기 싫으니까", type: "pragma" },
      ]},
      { q: "연인에게서 몇 시간째 답장이 없다. 내 머릿속은?", options: [
        { t: "'무슨 일 있나? 혹시 나한테 삐졌나?' 온갖 생각이 꼬리를 물어 다른 일이 손에 안 잡힌다", type: "mania" },
        { t: "바쁜가 보다 하고 내 할 일 한다. 답장이야 언젠가 오겠지", type: "storge" },
        { t: "뭐, 나도 다른 사람들이랑 놀면 되지. 딱히 신경 안 쓴다", type: "ludus" },
        { t: "괜찮아, 그 사람도 사정이 있을 거야. 내가 힘들 때 곁에 있어준 사람이니 믿는다", type: "agape" },
      ]},
      { q: "사랑에 빠지는 순간을 떠올려 본다. 나는 언제 '이 사람이다' 싶은가?", options: [
        { t: "첫눈에 심장이 쿵. 외모든 분위기든 강렬하게 끌리는 그 느낌이 온몸을 사로잡을 때", type: "eros" },
        { t: "오래 알고 지내다 어느 날 문득. 친구처럼 편하던 사이가 스르르 사랑으로 물들 때", type: "storge" },
        { t: "조건이 나와 잘 맞는다고 판단될 때. 가치관, 배경, 미래까지 그림이 그려질 때", type: "pragma" },
        { t: "그 사람을 위해서라면 뭐든 해주고 싶어질 때. 내 것을 내어줘도 아깝지 않을 때", type: "agape" },
      ]},
      { q: "연인이 갑자기 '우리 얘기 좀 하자'고 한다. 첫 반응은?", options: [
        { t: "'혹시 헤어지자는 거 아냐?' 가슴이 철렁 내려앉고 최악의 상황부터 상상한다", type: "mania" },
        { t: "'무슨 일이지?' 진지하게 마주 앉아 그 사람 마음부터 헤아리려 한다", type: "eros" },
        { t: "'오, 무슨 얘기? 재밌겠다' 가볍게 받아넘긴다. 너무 무겁게 갈 필요 있나", type: "ludus" },
        { t: "차분하게 듣는다. 우리가 오래 쌓아온 사이니 뭐든 대화로 풀 수 있다고 믿는다", type: "storge" },
      ]},
      { q: "이상형을 묻는 친구에게, 나는 뭐라고 답하나?", options: [
        { t: "'딱 보면 알아. 외모나 눈빛에서 확 끌리는 사람 있잖아' 설명보다 느낌이 먼저다", type: "eros" },
        { t: "'조건이 중요하지. 직업, 경제력, 성격, 집안까지 두루 봐야지' 현실을 무시할 순 없다", type: "pragma" },
        { t: "'나랑 잘 맞고 편한 사람. 오래 봐도 질리지 않을 친구 같은 사람'", type: "storge" },
        { t: "'글쎄, 한 명으로 정해두진 않아. 만나면서 알아가는 재미가 있지'", type: "ludus" },
      ]},
      { q: "연인을 위해 기꺼이 할 수 있는 일은?", options: [
        { t: "내가 좀 손해 보고 희생하더라도 그 사람이 행복하면 됐다. 그게 사랑 아닌가", type: "agape" },
        { t: "온 세상이 우리 둘뿐인 것처럼, 매 순간을 뜨겁고 특별하게 함께하는 것", type: "eros" },
        { t: "그 사람 곁을 잠시도 떠나지 않는 것. 늘 붙어 있고 싶고, 나만 바라봐 주면 좋겠다", type: "mania" },
        { t: "서로 부담 안 주는 선에서, 각자 삶도 지키며 즐겁게 만나는 것", type: "ludus" },
      ]},
      { q: "연인과 다퉜다. 화해까지 나의 방식은?", options: [
        { t: "먼저 사과한다. 내가 조금 참고 숙이면 관계가 편해지니까, 그 사람이 우선이다", type: "agape" },
        { t: "불안해서 견딜 수가 없다. 밤새 연락하고 매달려서라도 당장 풀어야 잠이 온다", type: "mania" },
        { t: "시간을 두고 자연스럽게 화해한다. 어차피 우리 사이가 이 정도로 흔들리진 않으니까", type: "storge" },
        { t: "이성적으로 원인을 짚어본다. 감정 소모보다 문제를 해결하는 게 먼저다", type: "pragma" },
      ]},
      { q: "연인의 SNS에 처음 보는 이성 친구가 댓글을 달았다. 나는?", options: [
        { t: "누구지? 신경이 쓰인다. 확인하고 싶고, 솔직히 조금 질투도 난다", type: "mania" },
        { t: "뭐 어때, 친구겠지. 나도 이성 친구 많은데 서로 자유로운 거지", type: "ludus" },
        { t: "별생각 없다. 우리 사이 믿으니까 그런 걸로 흔들리지 않는다", type: "storge" },
        { t: "그 사람이 즐거우면 됐다. 인간관계까지 내가 뭐라 할 건 아니지", type: "agape" },
      ]},
      { q: "연애에서 '설렘'이란 나에게?", options: [
        { t: "연애의 전부. 심장 뛰는 그 짜릿함이 없으면 사랑이라 할 수 있나", type: "eros" },
        { t: "있으면 좋지만, 편안함과 신뢰가 더 오래간다고 생각한다", type: "storge" },
        { t: "밀당의 즐거움. 밀고 당기는 그 긴장감이 제일 재밌다", type: "ludus" },
        { t: "솔직히 설렘보다 이 관계가 내 삶에 도움이 되는지가 더 중요하다", type: "pragma" },
      ]},
      { q: "미래의 결혼 상대를 고른다면, 결정적 기준은?", options: [
        { t: "경제력, 성격, 가정환경, 미래 계획까지 종합적으로 따진다. 결혼은 현실이니까", type: "pragma" },
        { t: "함께 있으면 세상 편하고 안정되는 사람. 30년 뒤에도 옆에 있고 싶은 사람", type: "storge" },
        { t: "내가 아낌없이 사랑을 쏟을 수 있는 사람. 그 사람 행복이 내 행복인 사람", type: "agape" },
        { t: "보기만 해도 가슴 뛰는 사람. 열정이 식지 않을 것 같은 사람", type: "eros" },
      ]},
      { q: "연인이 '요즘 우리 사이 어때?'라고 묻는다면?", options: [
        { t: "'매일이 특별해. 너랑 있으면 온 세상이 빛나는 것 같아' 진심을 뜨겁게 표현한다", type: "eros" },
        { t: "'좋지~ 근데 너무 진지해지진 말자, 부담스럽잖아' 가볍게 웃어넘긴다", type: "ludus" },
        { t: "'편안하고 좋아. 너랑 있으면 아무것도 안 해도 든든해'", type: "storge" },
        { t: "'네가 좋으면 나도 좋아. 넌 어때? 뭐 불편한 건 없어?' 그 사람 마음부터 챙긴다", type: "agape" },
      ]},
      { q: "연애 초반, 상대의 마음을 확인하는 나의 방식은?", options: [
        { t: "직진한다. 좋으면 좋다고, 감정을 숨김없이 뜨겁게 전한다", type: "eros" },
        { t: "은근히 밀당한다. 너무 쉽게 마음을 보여주면 재미없지 않나", type: "ludus" },
        { t: "상대가 나와 맞는 사람인지 여러 조건을 조용히 관찰하고 판단한다", type: "pragma" },
        { t: "자꾸 확인하고 싶어진다. '나 좋아해? 얼마나?' 계속 묻게 된다", type: "mania" },
      ]},
      { q: "주변에서 '너 그 사람한테 너무 잘해준다'는 말을 듣는다면?", options: [
        { t: "'잘해주고 싶어서 그러는 건데 뭐. 그 사람이 행복하면 난 됐어'", type: "agape" },
        { t: "'맞아, 나 좀 집착하는 편이야. 그만큼 좋으니까 어쩔 수 없어'", type: "mania" },
        { t: "'에이, 난 그렇게 다 쏟지 않아. 적당히가 좋지' 선을 지키는 편이다", type: "ludus" },
        { t: "'주는 만큼 받는 게 공평하지. 나도 받을 건 받아야지' 균형을 따진다", type: "pragma" },
      ]},
      { q: "이별을 상상해 본다. 나는 어떤 사람일까?", options: [
        { t: "쉽게 놓지 못한다. 미련이 남아 오래 힘들고, 어쩌면 매달릴지도 모른다", type: "mania" },
        { t: "슬프지만 담담하게 정리한다. 좋은 친구로 남을 수도 있다고 생각한다", type: "storge" },
        { t: "'좋은 추억이었어' 하고 비교적 쿨하게 다음으로 넘어간다", type: "ludus" },
        { t: "그 사람이 더 나은 선택을 한 거라면, 아프지만 응원하며 보내준다", type: "agape" },
      ]},
      { q: "연인과의 이상적인 하루를 그린다면?", options: [
        { t: "단둘이 떠나는 로맨틱한 여행. 잊지 못할 순간을 함께 만드는 하루", type: "eros" },
        { t: "소파에 나란히 붙어 배달 음식 시켜 먹으며 뒹구는, 세상 편한 하루", type: "storge" },
        { t: "각자 볼일 보다 저녁에 만나 가볍게 한잔. 서로 얽매이지 않는 자유로운 하루", type: "ludus" },
        { t: "그 사람이 하고 싶은 걸 다 하게 해주는 하루. 웃는 얼굴만 봐도 배부른 하루", type: "agape" },
      ]},
      { q: "'좋은 연애란 무엇인가'라는 질문에 나의 답은?", options: [
        { t: "서로 뜨겁게 사랑하고, 그 열정을 오래 간직하는 것", type: "eros" },
        { t: "오래된 친구처럼 편안하고 믿음직한, 흔들리지 않는 관계", type: "storge" },
        { t: "서로의 인생에 실질적으로 도움이 되고, 함께 성장하는 관계", type: "pragma" },
        { t: "부담 없이 서로 즐겁고, 각자의 자유를 존중하는 관계", type: "ludus" },
      ]},
    ],
    results: {
      "eros": { emoji: "🔥", title: "에로스 · 불꽃처럼 타오르는 낭만가", desc: "나는 첫눈에 반하고, 온몸으로 사랑을 느끼는 사람이다. 상대에게 열정적으로 몰입하고 감정을 숨김없이 표현하니 함께 있으면 세상이 반짝인다. 강점은 사랑에 진심이고 로맨틱한 순간을 만들 줄 안다는 것. 다만 설렘이 식으면 마음도 빨리 식을 수 있으니, 뜨거움 뒤에 오는 잔잔한 애정도 소중히 여길 필요가 있다." },
      "ludus": { emoji: "🃏", title: "루두스 · 자유로운 유희의 연애가", desc: "나에게 사랑은 즐거운 놀이이자 게임이다. 밀당의 긴장감을 즐기고, 서로 얽매이지 않는 가벼움 속에서 편안함을 느낀다. 강점은 상대에게 부담을 주지 않고 관계를 산뜻하게 이끈다는 것. 다만 진심으로 다가오는 사람에게는 그 가벼움이 상처가 될 수 있으니, 마음을 열어야 할 순간을 놓치지 않도록 조심하자." },
      "storge": { emoji: "🌿", title: "스토르게 · 우정 같은 편안한 사랑", desc: "나는 오래된 친구처럼 서서히 스며드는 사랑을 한다. 익숙함과 신뢰를 무엇보다 소중히 여기고, 함께 있으면 아무것도 안 해도 든든하다. 강점은 흔들리지 않는 안정감과 긴 호흡의 관계. 다만 설렘 부족을 서운해하는 상대도 있으니, 편안함에 안주하지 말고 가끔은 특별한 순간도 만들어 주자." },
      "pragma": { emoji: "📋", title: "프라그마 · 현실을 보는 지혜로운 사랑", desc: "나는 감정에 휩쓸리기보다 조건과 미래를 차분히 따지는 사람이다. 가치관, 안정성, 궁합까지 종합적으로 보고 신중하게 사랑을 선택한다. 강점은 현실적이고 오래 지속 가능한 관계를 설계한다는 것. 다만 지나친 계산은 마음의 온도를 낮출 수 있으니, 때로는 머리보다 가슴을 믿어봐도 좋다." },
      "mania": { emoji: "🌀", title: "마니아 · 뜨겁게 몰입하는 열정가", desc: "나는 사랑에 온 마음을 쏟고 그만큼 깊이 빠져드는 사람이다. 상대를 향한 마음이 크기에 확인받고 싶고, 늘 곁에 두고 싶어 한다. 강점은 누구보다 진심이고 헌신적이라는 것. 다만 불안과 집착이 관계를 조이면 서로 지칠 수 있으니, 나 자신을 사랑하고 상대를 믿는 연습이 나를 더 편안하게 만들어 줄 것이다." },
      "agape": { emoji: "🕊️", title: "아가페 · 조건 없이 내어주는 헌신가", desc: "나는 상대의 행복을 나의 행복으로 여기는 이타적인 사랑을 한다. 받기보다 주는 데서 기쁨을 느끼고, 그 사람을 위해 기꺼이 나를 내어준다. 강점은 깊고 따뜻하며 상대를 진심으로 성장시킨다는 것. 다만 나를 자꾸 뒤로 미루면 지칠 수 있으니, 나 자신도 사랑받아 마땅한 존재임을 잊지 말자." },
    },
  },
  // ═══════════════ ✨ 가볍게 (기존 테스트 보존) ═══════════════
  {
    kind: "typed",
    id: "ai-type",
    category: "fun",
    emoji: "🤖",
    title: "나는 어떤 AI 사용자일까?",
    subtitle: "6문항 · AI 활용 성향",
    source: "illo 자체 제작 (재미용)",
    time: "약 1분",
    intro: "6개의 질문으로 알아보는 나의 AI 활용 성향. 가볍게 즐겨보세요!",
    questions: [
      { q: "AI에게 가장 먼저 시키고 싶은 일은?", options: [
        { t: "내 아이디어로 앱·서비스 만들기", type: "builder" },
        { t: "그림·영상·음악 같은 작품 만들기", type: "creator" },
        { t: "어려운 주제를 쉽게 설명받기", type: "learner" },
        { t: "매일 반복하는 귀찮은 일 자동화", type: "automator" },
      ]},
      { q: "주말에 AI로 논다면?", options: [
        { t: "작은 프로그램 하나 뚝딱 만들기", type: "builder" },
        { t: "AI로 웹툰·노래 만들어보기", type: "creator" },
        { t: "관심 분야 깊게 파보기", type: "learner" },
        { t: "최신 AI 뉴스 정주행", type: "explorer" },
      ]},
      { q: "새로운 AI 도구가 나왔다. 당신은?", options: [
        { t: "일단 만들어보며 익힌다", type: "builder" },
        { t: "예쁜 결과물부터 뽑아본다", type: "creator" },
        { t: "문서·원리부터 읽어본다", type: "learner" },
        { t: "남들보다 먼저 써보고 공유한다", type: "explorer" },
      ]},
      { q: "AI가 가장 고마운 순간은?", options: [
        { t: "막막한 작업을 대신 해줄 때", type: "automator" },
        { t: "불가능할 것 같던 걸 만들어낼 때", type: "builder" },
        { t: "복잡한 걸 한 번에 이해시켜줄 때", type: "learner" },
        { t: "내 창작에 날개를 달아줄 때", type: "creator" },
      ]},
      { q: "친구에게 AI를 추천한다면?", options: [
        { t: "“이걸로 이런 것도 만들 수 있어!”", type: "builder" },
        { t: "“이 그림/영상, AI가 만든 거야!”", type: "creator" },
        { t: "“이거 배우면 진짜 똑똑해져”", type: "learner" },
        { t: "“이 뉴스 봤어? AI 미쳤다”", type: "explorer" },
      ]},
      { q: "이상적인 AI 라이프는?", options: [
        { t: "반복은 AI, 나는 중요한 것만", type: "automator" },
        { t: "내 손으로 뭐든 만드는 삶", type: "builder" },
        { t: "매일 새로 배우는 삶", type: "learner" },
        { t: "트렌드 최전선에 있는 삶", type: "explorer" },
      ]},
    ],
    results: {
      builder:   { emoji: "🛠️", title: "실전 빌더", desc: "아이디어를 곧장 결과물로 만드는 행동파! AI는 당신의 가장 강력한 작업 도구예요.", rec: { label: "워크일로로 만들기", href: "/illo/app" } },
      creator:   { emoji: "🎨", title: "AI 크리에이터", desc: "상상을 현실로 꺼내는 창작가! 이미지·영상·음악, 무엇이든 만들어내요.", rec: { label: "AI 도구 둘러보기", href: "/ai-tools" } },
      learner:   { emoji: "📚", title: "탐구 학습러", desc: "원리부터 파고드는 지식 탐험가! AI로 세상을 더 깊이 이해해요.", rec: { label: "인사이트 읽으러 가기", href: "/insight" } },
      automator: { emoji: "🤖", title: "자동화 마니아", desc: "반복은 기계에게 맡기는 효율의 화신! 시간을 버는 사람이에요.", rec: { label: "워크일로로 자동화", href: "/illo/app" } },
      explorer:  { emoji: "🧭", title: "트렌드 헌터", desc: "가장 빠르게 새 흐름을 캐치하는 얼리어답터! AI 소식이라면 1등이에요.", rec: { label: "트렌드 보러 가기", href: "/insight" } },
    },
  },
];

/* ── 엔진 유틸 ─────────────────────────────────── */

export function getTest(id: string): PsychTest | undefined {
  return TESTS.find((t) => t.id === id);
}

// 한 문항의 환산 점수(역채점 처리)
export function itemScore(item: ScoredItem, scale: Choice[], chosenValue: number): number {
  const opts = item.choices ?? scale;
  if (!item.reverse) return chosenValue;
  const min = Math.min(...opts.map((o) => o.value));
  const max = Math.max(...opts.map((o) => o.value));
  return min + max - chosenValue; // 역채점
}

export function maxPossible(test: ScoredTest): number {
  return test.items.reduce((s, it) => {
    const opts = it.choices ?? test.scale;
    return s + Math.max(...opts.map((o) => o.value));
  }, 0);
}

export function minPossible(test: ScoredTest): number {
  return test.items.reduce((s, it) => {
    const opts = it.choices ?? test.scale;
    return s + Math.min(...opts.map((o) => o.value));
  }, 0);
}

export type ScoredResult = {
  band: Band;
  displayScore: string; // 화면 표시 점수("12" 또는 "3.7" 또는 "58")
  unit: number; // 만점(합산) 또는 척도 최대값(평균)
  unitLabel: string; // "27점" / "5.0" / "100"
  pct: number; // 게이지 채움 비율(0~100)
};

export function computeScored(test: ScoredTest, answers: number[]): ScoredResult {
  const raw = test.items.reduce((s, it, i) => s + itemScore(it, test.scale, answers[i]), 0);
  const mode = test.scoreMode ?? "sum";

  if (mode === "avg") {
    const avg = raw / test.items.length;
    const maxOpt = Math.max(...test.scale.map((o) => o.value));
    const minOpt = Math.min(...test.scale.map((o) => o.value));
    const band = test.bands.find((b) => avg <= b.max) ?? test.bands[test.bands.length - 1];
    const pct = Math.round(((avg - minOpt) / (maxOpt - minOpt)) * 100);
    const isInt = maxOpt > 10; // CBI(0~100)는 정수, BRS(1~5)는 소수
    return {
      band,
      displayScore: isInt ? String(Math.round(avg)) : avg.toFixed(1),
      unit: maxOpt,
      unitLabel: isInt ? String(maxOpt) : maxOpt.toFixed(1),
      pct: Math.max(0, Math.min(100, pct)),
    };
  }

  const hi = maxPossible(test);
  const lo = minPossible(test);
  const band = test.bands.find((b) => raw <= b.max) ?? test.bands[test.bands.length - 1];
  const pct = Math.round(((raw - lo) / (hi - lo)) * 100);
  return { band, displayScore: String(raw), unit: hi, unitLabel: `${hi}점`, pct: Math.max(0, Math.min(100, pct)) };
}

/* ── 다차원(Big Five) 채점 ─────────────────────── */

export type MultiLevelKey = "high" | "mid" | "low";
export type FacetResult = { name: string; desc: string; pct: number };
export type MultiDimResult = {
  dim: MultiDimension;
  pct: number; // 0~100
  level: MultiLevelKey;
  levelLabel: string; // "높음" / "균형" / "낮음"
  facets: FacetResult[]; // 하위척도별 결과
};

// 다차원 검사를 관리용 평면 항목 목록으로(차원·하위척도 인덱스 포함)
export type FlowRef = { d: number; f: number; i: number; text: string; reverse?: boolean };
export function flattenMulti(test: MultiTest): FlowRef[][] {
  // [차원][하위척도·항목 순서] 형태. 차원별로 항목을 일렬로 펴서 라운드로빈에 사용.
  return test.dimensions.map((dim, d) => {
    const list: FlowRef[] = [];
    dim.facets.forEach((fac, f) => {
      fac.items.forEach((it, i) => list.push({ d, f, i, text: it.text, reverse: it.reverse }));
    });
    return list;
  });
}

// answers: answers[d][f][i] 형태의 중첩 응답
export function computeMulti(test: MultiTest, answers: number[][][]): MultiDimResult[] {
  const minOpt = Math.min(...test.scale.map((o) => o.value));
  const maxOpt = Math.max(...test.scale.map((o) => o.value));
  const span = maxOpt - minOpt;
  return test.dimensions.map((dim, d) => {
    let dimRaw = 0, dimN = 0;
    const facets: FacetResult[] = dim.facets.map((fac, f) => {
      let raw = 0;
      fac.items.forEach((it, i) => {
        const v = answers[d][f][i];
        raw += it.reverse ? minOpt + maxOpt - v : v;
      });
      dimRaw += raw; dimN += fac.items.length;
      const pct = Math.round(((raw - fac.items.length * minOpt) / (fac.items.length * span)) * 100);
      return { name: fac.name, desc: fac.desc, pct: Math.max(0, Math.min(100, pct)) };
    });
    const pct = Math.round(((dimRaw - dimN * minOpt) / (dimN * span)) * 100);
    const level: MultiLevelKey = pct >= 60 ? "high" : pct <= 40 ? "low" : "mid";
    const levelLabel = level === "high" ? "높음" : level === "low" ? "낮음" : "균형";
    return { dim, pct: Math.max(0, Math.min(100, pct)), level, levelLabel, facets };
  });
}

// 2축(anxiety/avoidance) 결과 → 4유형 하나로 매핑
export function deriveQuadrant(test: MultiTest, results: MultiDimResult[]): QuadrantType | null {
  if (!test.quadrant || test.quadrant.length !== 4) return null;
  const ax = results.find((r) => r.dim.key === "anxiety");
  const av = results.find((r) => r.dim.key === "avoidance");
  if (!ax || !av) return null;
  const aLow = ax.pct <= 50, vLow = av.pct <= 50;
  const key = aLow && vLow ? "secure" : !aLow && vLow ? "anxious" : aLow && !vLow ? "dismissing" : "fearful";
  return test.quadrant.find((q) => q.key === key) || null;
}

/* ── 검사 상세 안내(브리핑) ─────────────────────── */

export const ABOUT: Record<string, TestAbout> = {
  "perfectionism": {
    what: "이 검사는 다차원 완벽주의 이론(FMPS, APS-R)을 바탕으로 당신의 완벽주의 성향을 여러 측면에서 살펴봅니다. 단순히 '완벽주의가 있다/없다'가 아니라, 높은 기준을 세우는 성취지향적 면과 실수·평가에 과도하게 얽매이는 부적응적 면을 구분해 보여줍니다. 점수가 높을수록 부적응적 완벽주의 경향이 강함을 뜻합니다.",
    measures: [
      { label: "높은 개인 기준", desc: "스스로에게 부과하는 목표와 기준이 얼마나 높은지를 봅니다. 그 자체로는 성취의 원동력이 될 수 있는 중립적 특성입니다." },
      { label: "실수에 대한 지나친 염려", desc: "작은 실수를 실패로 확대해 받아들이고 두려워하는 정도를 봅니다. 부적응적 완벽주의의 핵심 지표입니다." },
      { label: "수행에 대한 의심", desc: "자신이 한 일이 충분한지 확신하지 못하고 반복 점검·확인하는 경향을 봅니다." },
      { label: "정리·질서 집착", desc: "정돈·순서·규칙에 대한 강한 필요와, 그것이 흐트러졌을 때의 불편감을 봅니다." },
      { label: "부모/타인 기대의 내면화", desc: "중요한 타인의 높은 기대를 자기 기준으로 받아들여 스스로를 몰아붙이는 정도를 봅니다." },
      { label: "자기비판", desc: "기대에 못 미쳤을 때 자신을 가혹하게 다그치고 비난하는 경향을 봅니다." },
      { label: "완벽하지 못하면 무가치하게 느낌", desc: "성과·완벽함과 자기 가치를 동일시하여, 완벽하지 않으면 자신을 무가치하게 느끼는 정도를 봅니다." },
    ],
    how: "40개 문항에 각각 0(전혀 아니다)부터 4(매우 그렇다)까지로 답합니다. 건강·긍정 방향의 역채점 문항은 점수를 뒤집어(4→0) 계산한 뒤 모두 합산합니다. 총점 범위는 0~160점이며, 점수가 높을수록 부적응적 완벽주의 경향이 강함을 의미합니다.",
    interpret: "결과는 낮음부터 높음까지 단계로 나뉘어 현재 경향의 강도를 보여줍니다. 이는 성향을 가늠하는 선별(스크리닝) 도구일 뿐 의학적·심리학적 진단이 아닙니다. 점수가 곧 병을 뜻하지 않으며, 일상에 뚜렷한 불편이 있다면 전문가 상담으로 정확히 평가받는 것이 좋습니다.",
    background: "문항은 Frost 등의 다차원 완벽주의 척도(FMPS)와 Slaney 등의 개정판 거의 완벽 척도(APS-R)에서 다루는 하위차원(높은 기준, 실수 염려, 수행 의심, 정리, 타인 기대, 자기비판, 조건적 자기가치)을 참고해 한국어 맥락에 맞게 새로 작성했습니다. 원 척도의 문항을 그대로 옮기지 않았으며, 학술적으로 널리 알려진 공개 이론 틀에 근거한 비진단용 자가검사입니다.",
  },
  "procrastination": {
    what: "이 검사는 평소 나의 미루기(지연행동) 경향을 스스로 점검하는 자가 선별 도구입니다. 시작을 미루는 습관부터 마감 임박까지의 방치, 결정 지연, 주의분산과 회피, 자기조절 실패, 미룬 뒤의 자책, 계획대로 실행하지 못하는 정도까지 7개 영역을 두루 살펴봅니다. 순수 지연행동 척도(PPS)와 Tuckman 지연 척도의 관점을 참고해 구성했습니다.",
    measures: [
      { label: "시작 미루기", desc: "해야 할 일에 좀처럼 착수하지 못하고 첫발을 늦추는 경향" },
      { label: "마감 임박까지 방치", desc: "시간이 있어도 기한이 코앞에 닥쳐야 몰아서 하는 경향" },
      { label: "결정 지연", desc: "선택과 판단을 확정하지 못하고 계속 뒤로 미루는 경향" },
      { label: "주의분산·회피", desc: "딴짓과 회피로 집중을 피하며 일에서 도망치는 경향" },
      { label: "자기조절 실패", desc: "의지와 통제력이 약해 유혹과 편함에 밀려나는 경향" },
      { label: "미룬 뒤 자책", desc: "미루고 난 뒤 죄책감·후회·자기비난을 겪는 정도" },
      { label: "계획대로 실행 못함", desc: "세운 계획과 실제 행동 사이의 간극이 큰 경향" },
    ],
    how: "각 문항에 0(전혀 아니다)부터 4(매우 그렇다)까지로 답합니다. 긍정(건강) 방향으로 쓰인 문항은 역채점하며, 40문항을 모두 합산하면 0점에서 160점 사이의 총점이 나옵니다. 점수가 높을수록 지연행동 경향이 강함을 뜻합니다.",
    interpret: "총점은 낮음부터 높음까지의 단계로 나누어 지금의 미루기 경향 수준을 가늠하는 데 쓰입니다. 이 결과는 의학적 진단이 아니라 자기 이해를 돕는 선별 정보이며, 그날의 상태나 상황에 따라 달라질 수 있습니다. 어려움이 크게 느껴진다면 점수와 무관하게 전문가의 도움을 고려하세요.",
    background: "문항은 순수 지연행동 척도(Pure Procrastination Scale, PPS; Steel, 2010)와 Tuckman 지연 척도(Tuckman, 1991)의 문항 관점을 참고해 한국어 자가점검용으로 새로 작성했습니다. 이들 척도는 학술 문헌에 공개되어 널리 연구·활용되어 왔으나, 본 검사는 원 척도의 직접 번역이 아닌 재구성이며 공식 규준(norm)을 제공하지 않습니다.",
  },
  "narcissism": {
    what: "이 검사는 자기애적 성격 척도(NPI)의 개념 틀을 바탕으로, 평소 나의 자기애 성향이 어느 정도인지 스스로 살펴보는 자가검사입니다. 리더십 욕구, 특권의식, 자기과시, 우월감, 착취적 태도, 인정 갈구, 공감 등 여러 측면을 두루 다룹니다. 이는 성격 특성을 이해하기 위한 것이며, '자기애성 성격장애'를 진단하는 도구가 아닙니다.",
    measures: [
      { label: "권위·리더십 욕구", desc: "집단을 이끌고 주도하며 영향력을 갖고 싶어 하는 성향" },
      { label: "특권의식", desc: "남다른 대우와 우선권을 당연하게 여기는 정도" },
      { label: "자기과시·주목 욕구", desc: "자신을 드러내고 시선의 중심에 서고 싶어 하는 경향" },
      { label: "우월감", desc: "자신이 남보다 뛰어나고 특별하다고 느끼는 정도" },
      { label: "착취적 태도", desc: "목표나 이익을 위해 타인을 이용·조종하려는 경향" },
      { label: "감탄·인정 갈구", desc: "칭찬과 인정, 부러움을 지속적으로 필요로 하는 정도" },
      { label: "공감", desc: "타인의 감정과 입장을 헤아리는 능력(역채점 문항으로, 낮을수록 자기애 성향과 연결)" },
    ],
    how: "각 문항에 대해 평소 나의 모습을 떠올리며 0(전혀 아니다)부터 4(매우 그렇다)까지로 답합니다. 겸손·타인 배려·공감을 담은 일부 문항은 역채점되어, 그 문항에 '그렇다'고 답할수록 자기애 성향 점수는 낮아집니다. 40문항의 점수를 모두 합산하면 0~160점 범위가 되며, 점수가 높을수록 자기애 성향이 강함을 시사합니다.",
    interpret: "결과는 단계형 구간으로 자기애 성향의 상대적 강도를 보여주는 '선별' 자료일 뿐, 확정 진단이 아닙니다. 자기애 성향은 누구나 어느 정도 지니는 정상적 성격 요소이며, 높은 점수가 곧 장애를 뜻하지 않습니다. 하루의 기분이나 상황에 따라 답이 달라질 수 있으니, 결과가 마음에 걸리거나 대인관계·일상에 어려움이 크다면 참고 자료로만 활용하세요.",
    background: "이 검사는 Raskin과 Terry(1988) 등이 정립한 자기애적 성격 척도(NPI, Narcissistic Personality Inventory)의 하위 개념(권위, 특권의식, 자기과시, 우월성, 착취성 등)에 근거해 자가점검용으로 재구성한 것입니다. NPI는 학계에서 널리 쓰여 온 공개 연구 척도이나, 본 문항은 원척도의 직접 번역본이 아니며 개념을 참고해 만든 비공식 자가검사입니다. 임상 진단이나 평가를 대체하지 않습니다.",
  },
  "alexithymia": {
    what: "이 검사는 자신의 감정을 알아차리고 말로 표현하는 데 얼마나 어려움을 느끼는지를 살펴보는 자가 선별 도구입니다. 감정을 잘 인식하지 못하고 내면보다 사실·행동 위주로 사고하는 경향을 '감정표현 불능(알렉시티미아)'이라 부르며, 국제적으로 널리 쓰이는 TAS-20(토론토 감정표현불능척도)의 개념 틀을 바탕으로 구성했습니다. 결과는 진단이 아니라 지금 나의 감정 인식·표현 성향을 돌아보는 참고 자료입니다.",
    measures: [
      { label: "감정 식별의 어려움", desc: "지금 느끼는 감정이 무엇인지 알아차리고 이름 붙이는 능력" },
      { label: "감정과 신체감각 구분 곤란", desc: "두근거림·답답함 같은 몸의 반응을 감정 신호로 연결해 이해하는 정도" },
      { label: "감정을 말로 표현하기 어려움", desc: "자신의 감정을 적절한 말로 상대에게 전달하는 능력" },
      { label: "외부지향적 사고", desc: "내면의 느낌보다 외부의 사실·사건·행동에 초점을 두는 사고 경향" },
      { label: "상상·공상 빈곤", desc: "머릿속으로 장면을 그리거나 공상을 펼치는 내적 상상 활동의 풍부함" },
      { label: "타인 감정 읽기 어려움", desc: "표정·말투 등에서 상대의 감정을 알아채고 공감하는 능력" },
    ],
    how: "각 문항에 평소 자신의 모습을 떠올리며 0(전혀 아니다)부터 4(매우 그렇다)까지 답합니다. 긍정(건강) 방향으로 쓰인 문항은 자동으로 역채점되며, 40문항의 점수를 모두 더해 0점부터 160점 사이의 총점을 냅니다. 점수가 높을수록 감정을 인식하고 표현하는 데 어려움이 크다는 뜻입니다.",
    interpret: "총점은 낮음부터 높음까지 단계로 나뉘며, 점수가 높을수록 감정표현 불능 성향이 뚜렷함을 시사합니다. 이는 어디까지나 선별 참고치일 뿐 의학적 진단이 아니며, 같은 점수라도 사람과 상황에 따라 의미가 다를 수 있습니다. 하위영역별로 나누어 살펴보면 내가 특히 어느 부분에서 어려움을 느끼는지 이해하는 데 도움이 됩니다.",
    background: "TAS-20(Toronto Alexithymia Scale, 토론토 감정표현불능척도)은 Bagby, Parker, Taylor 등이 개발해 전 세계 임상·연구에서 널리 쓰이는 20문항 자기보고 척도로, 감정 식별의 어려움·감정 표현의 어려움·외부지향적 사고 세 요인을 측정합니다. 이 검사는 그 공개된 개념 구조를 참고하되 문항은 새로 작성해 6개 하위영역 40문항으로 확장한 비공식 자가 점검판이며, TAS-20 원척도 자체나 그 공식 점수 기준을 대체하지 않습니다.",
  },
  "relcontrol": {
    what: "이 검사는 현재 또는 최근의 연애·친밀 관계에서 '상대가 나에게' 하는 통제와 정서적 학대(가스라이팅) 신호를 점검하는 자가 선별 도구입니다. 감시·고립·비난·가스라이팅·죄책감 조종·위협·경제적 통제·애정과 냉대의 반복·사과와 재발의 순환 같은 패턴이 얼마나 나타나는지 살펴봅니다. 진단이 아니라, 지금 내 관계를 안전하게 돌아보기 위한 참고 자료입니다.",
    measures: [
      { label: "행동 감시·통제", desc: "연락·위치·옷차림·인간관계를 감시하고 통제하려는 행동" },
      { label: "고립", desc: "친구·가족 등 주변 사람들과 나를 떼어놓으려는 행동" },
      { label: "비난·깎아내림", desc: "외모·능력·존재를 반복적으로 비난하며 나를 하찮게 대하는 행동" },
      { label: "가스라이팅", desc: "내 기억·감정·판단을 부정해 스스로를 의심하게 만드는 행동" },
      { label: "죄책감 유발·조종", desc: "죄책감과 서운함으로 나를 원하는 대로 움직이려는 조종" },
      { label: "위협·분노 폭발", desc: "고함·물건 던지기·협박 등 두려움을 일으키는 위협 행동" },
      { label: "경제적 통제", desc: "돈·소비·경제적 독립을 통제하고 간섭하는 행동" },
      { label: "애정과 냉대·사과와 재발의 순환", desc: "잘해줌과 냉대, 사과와 재발이 반복되며 관계를 끊기 어렵게 만드는 패턴" },
    ],
    how: "각 문항에 최근 관계에서의 빈도를 0(전혀 아니다)~4(매우 그렇다)로 응답합니다. 건강·존중 방향의 문항(reverse)은 역채점하여, 40문항을 모두 합산하면 0~160점이 나옵니다. 점수가 높을수록 관계 내 통제·정서적 학대 신호가 크다는 의미입니다.",
    interpret: "총점은 신호의 강도를 대략적으로 보여주는 단계형 참고치일 뿐, 학대 여부를 확정하는 진단이 아닙니다. 점수가 낮아도 특정 문항(특히 위협·경제적 통제·가스라이팅)에서 강하게 해당한다면 그 자체로 주의가 필요합니다. 중요한 것은 숫자가 아니라 지금 내가 안전하고 존중받고 있는지입니다.",
    background: "이 검사는 친밀관계 내 강압적 통제(coercive control)와 정서적 학대·가스라이팅에 관한 임상·상담 문헌에서 반복적으로 지적되는 지표(감시·고립·비하·현실 왜곡·경제적 통제·위협·긴장과 화해가 반복되는 학대의 순환)를 참고해 자가 점검용으로 구성했습니다. 특정 표준화 척도의 문항을 그대로 옮긴 것이 아니며, 공개적으로 자유롭게 활용할 수 있는 선별용 자료입니다.",
  },
  "attachment": {
    what: "이 검사는 성인의 연애·친밀 관계에서 드러나는 애착 방식을 두 축으로 측정합니다. 하나는 '애착 불안'(상대에게 버림받거나 사랑받지 못할까 봐 느끼는 두려움과 인정 갈구), 다른 하나는 '애착 회피'(친밀함과 의존을 불편해하며 거리를 두려는 성향)입니다. 두 축의 조합으로 안정형·몰입형·거부회피형·공포회피형이라는 네 가지 관계 유형을 확인합니다.",
    measures: [
      { label: "애착 불안 (Anxiety)", desc: "관계에서 버림받는 것을 두려워하고, 상대의 사랑과 인정을 확인받고 싶어 하며, 상대에게 몰두하거나 집착하기 쉬운 정도" },
      { label: "애착 회피 (Avoidance)", desc: "친밀함과 감정적 개방을 불편해하고, 상대에게 기대거나 의지하기를 꺼리며, 자기 독립과 거리두기를 우선하는 정도" },
    ],
    how: "나는 각 문항을 읽고 지금의 나, 그리고 최근의 연애·친밀 관계 경험을 떠올리며 '전혀 그렇지 않다'부터 '매우 그렇다'까지 솔직하게 답하면 됩니다. 특정 상대가 없다면 가장 가깝게 지내는 사람과의 관계나 평소 나의 성향을 기준으로 답하세요. 일부 문항은 역채점되어, 겉으로 상반돼 보이는 문항이 같은 축을 재는 경우가 있습니다.",
    interpret: "두 점수는 좋고 나쁨이 아니라 나의 관계 습관을 보여주는 지도입니다. 불안 축이 높으면 연결에 대한 갈망이, 회피 축이 높으면 자율성에 대한 욕구가 강한 편입니다. 두 축이 모두 낮은 쪽에 가까울수록 안정 애착에 가깝고, 어느 한쪽이나 양쪽이 높을수록 관계에서 특정 패턴이 반복되기 쉽습니다. 점수는 고정된 낙인이 아니라, 안전한 관계 경험과 연습으로 충분히 변할 수 있는 현재 상태의 스냅숏입니다.",
    background: "이 검사는 성인 애착 연구에서 널리 쓰이는 ECR-R(친밀 관계 경험 검사 개정판)의 두 차원 구조를 바탕으로 각색했습니다. 성인 애착 이론은 어린 시절 양육자와의 관계에서 형성된 애착이 성인기의 연애·친밀 관계에도 이어진다고 보며, 불안과 회피 두 축으로 개인차를 설명합니다. 이 검사는 의학적 진단이 아니라 자기 이해를 돕는 선별·성찰 도구입니다.",
  },
  "lovestyle": {
    what: "이 검사는 캐나다 사회학자 존 앨런 리(John Alan Lee)의 '사랑의 색깔(Colors of Love)' 이론을 바탕으로, 내가 연애에서 어떤 사랑의 유형에 가까운지 알아보는 심리 테스트다. 사랑을 여섯 가지 스타일 — 에로스(낭만적·열정), 루두스(유희적·자유), 스토르게(우정 같은 편안함), 프라그마(현실적·조건), 마니아(소유적·집착), 아가페(헌신적·이타) — 로 나누어 살펴본다.",
    measures: [
      { label: "에로스 (Eros)", desc: "낭만적이고 열정적인 사랑. 강렬한 끌림과 신체적·감정적 몰입을 중시한다." },
      { label: "루두스 (Ludus)", desc: "유희적이고 자유로운 사랑. 사랑을 즐거운 게임처럼 여기며 얽매이지 않는다." },
      { label: "스토르게 (Storge)", desc: "우정에서 자라나는 편안한 사랑. 익숙함과 신뢰, 안정감을 중시한다." },
      { label: "프라그마 (Pragma)", desc: "현실적이고 실용적인 사랑. 조건과 궁합, 미래를 이성적으로 따진다." },
      { label: "마니아 (Mania)", desc: "소유적이고 집착적인 사랑. 강한 몰입과 함께 불안·질투를 동반한다." },
      { label: "아가페 (Agape)", desc: "헌신적이고 이타적인 사랑. 대가를 바라지 않고 상대에게 조건 없이 내어준다." },
    ],
    how: "연애 상황을 담은 여러 문항이 주어지고, 각 문항마다 나에게 가장 가까운 보기를 하나씩 고르면 된다. 모든 보기는 여섯 유형 중 하나에 연결되어 있으며, 검사가 끝나면 내가 가장 많이 선택한 유형이 나의 대표 연애 스타일로 나온다.",
    interpret: "결과로 나온 유형은 '내가 지금 사랑을 대하는 방식'을 보여줄 뿐, 좋고 나쁨을 가르는 것이 아니다. 대부분의 사람은 여러 유형을 조금씩 섞어 가지고 있고, 상대나 시기에 따라 스타일이 달라지기도 한다. 각 유형의 강점은 살리고 주의점은 참고하는 정도로 가볍게 즐기면 된다.",
    background: "'사랑의 색깔' 이론은 존 앨런 리가 1973년 저서 『사랑의 색깔들(Colours of Love)』에서 제시했고, 이후 헨드릭 부부(Clyde & Susan Hendrick)가 이를 측정하는 '사랑의 태도 척도(Love Attitudes Scale, LAS)'로 발전시켰다. 이 테스트는 해당 이론과 척도의 개념을 대중적으로 각색한 것으로, 학술적·임상적 진단이 아닌 자기 이해와 재미를 위한 콘텐츠다.",
  },

  "trauma": {
    what: "이 검사는 충격적이거나 생명을 위협하는 사건을 겪은 뒤 나타날 수 있는 외상 후 스트레스 반응을 스스로 점검해 보는 자가 선별 도구입니다. 국제적으로 널리 쓰이는 PCL-5(DSM-5 PTSD 증상 체크리스트)의 구조를 바탕으로, 지난 한 달 동안의 경험을 여섯 영역에서 살펴봅니다. 진단을 내리는 검사가 아니라 지금 나의 상태를 이해하고 도움이 필요한지 가늠해 보는 출발점입니다.",
    measures: [
      { label: "침습·재경험", desc: "원치 않는 기억, 악몽, 플래시백처럼 그 사건이 반복해서 되살아나며 마음과 몸을 흔드는 정도를 살핍니다." },
      { label: "회피", desc: "사건을 떠올리게 하는 생각·감정·사람·장소·상황을 의식적으로 피하려는 경향을 살핍니다." },
      { label: "부정적 인지·기분", desc: "자책, 무력감, 세상에 대한 불신, 흥미 상실, 정서적 단절과 무감각 등 생각과 기분의 부정적 변화를 살핍니다." },
      { label: "과각성", desc: "늘 경계하고 쉽게 놀라며, 짜증·집중곤란·수면장애·무모한 행동이 지속되는 정도를 살핍니다." },
      { label: "해리·비현실감", desc: "내 몸이나 주변이 비현실적으로 느껴지거나, 자신과 분리된 듯한 해리 경험의 정도를 살핍니다." },
      { label: "일상 기능 영향", desc: "이러한 증상들이 일, 학업, 대인관계, 미래에 대한 전망 등 실제 생활을 얼마나 어렵게 만드는지를 살핍니다." },
    ],
    how: "각 문항에 지난 한 달 동안의 경험을 떠올리며 0(전혀 그렇지 않다)부터 4(매우 그렇다)까지로 답합니다. 일부 긍정·건강 방향 문항은 점수를 거꾸로 환산해 채점하며, 40문항의 점수를 모두 합산하면 0점에서 160점 사이의 총점이 나옵니다. 점수가 높을수록 외상 후 스트레스 반응의 강도와 범위가 크다는 것을 뜻합니다.",
    interpret: "총점은 낮음·경미·중등도·높음의 네 단계로 나누어 현재 상태의 대략적인 수준을 보여 줍니다. 점수가 높다고 해서 곧바로 PTSD라는 뜻은 아니며, 반대로 점수가 낮더라도 특정 증상으로 크게 힘들다면 얼마든지 도움을 구할 수 있습니다. 이 결과는 진단이 아닌 선별이므로, 정확한 평가와 진단은 반드시 정신건강 전문가와의 면담을 통해 이루어져야 합니다.",
    background: "PCL-5(PTSD Checklist for DSM-5)는 미국 국가 PTSD 센터(National Center for PTSD)가 개발한 자기보고식 척도로, DSM-5의 PTSD 진단기준 증상을 반영하며 연구와 임상에서 무료로 널리 사용됩니다. 본 검사는 그 구성개념과 증상 영역(침습, 회피, 인지·기분의 부정적 변화, 각성·반응성)을 참고하고, DSM-5의 해리형 명시자와 기능 손상 기준을 더해 자체 문항으로 새로 작성한 비공식 선별 도구입니다. 원 척도의 문구를 그대로 사용하지 않았으며, 공식 PCL-5 점수 기준과는 다릅니다.",
  },
  "insomnia": {
    what: "이 검사는 최근 2주 동안의 수면 상태를 점검해 불면 증상의 정도와 수면의 질을 가늠해 보는 자가 선별 도구입니다. 잠드는 어려움, 자주 깨는 정도, 새벽 조기 각성, 수면 만족도, 그리고 낮 동안의 기능 저하와 수면에 대한 불안·생활습관까지 폭넓게 살핍니다. 결과는 지금 내 잠을 객관적으로 돌아보고 필요한 변화를 찾는 출발점이 됩니다.",
    measures: [
      { label: "입면 곤란", desc: "잠자리에 누운 뒤 실제로 잠들기까지 걸리는 시간과 그 어려움의 정도를 봅니다." },
      { label: "수면 유지", desc: "밤중에 깨는 횟수와 다시 잠들기 어려움 등 잠을 끊김 없이 이어 가는 능력을 봅니다." },
      { label: "새벽 조기 각성", desc: "원하는 시각보다 너무 일찍 깨어 다시 잠들지 못하는 양상을 봅니다." },
      { label: "수면 만족도", desc: "전반적인 잠의 질과 개운함에 대한 주관적 만족도를 봅니다(역채점)." },
      { label: "주간 기능", desc: "수면 문제로 인한 낮 시간의 피로·졸음·집중 저하·기분 변화를 봅니다." },
      { label: "수면 불안", desc: "잠을 못 잘까 걱정하고 수면에 과도하게 신경 쓰는 정도를 봅니다." },
      { label: "수면위생", desc: "잠을 방해하는 생활습관(카페인·화면·불규칙한 수면 시간 등)을 봅니다." },
    ],
    how: "각 문항에 0(전혀 아님)부터 4(매우 그러함)까지 응답한 뒤 40문항 점수를 모두 더합니다. 총점 범위는 0~160점이며, 점수가 높을수록 불면 증상이 뚜렷하고 수면의 질이 낮음을 뜻합니다. '자고 일어나면 몸이 개운하다'처럼 건강·긍정 방향의 문항은 역채점되어 같은 방향으로 합산됩니다.",
    interpret: "총점은 양호·경미·중간·심각의 네 단계로 나누어 해석합니다. 점수가 낮을수록 수면이 안정적이고, 높을수록 일상에 지장을 주는 불면 가능성이 큽니다. 이 결과는 의학적 진단이 아니라 현재 상태를 가늠하는 선별 정보이며, 어떤 단계든 정확한 평가와 진단은 전문가의 몫입니다.",
    background: "이 검사는 국제적으로 널리 쓰이는 ISI(불면증 심각도 지수, Insomnia Severity Index)의 핵심 영역(입면·수면 유지·조기 각성·수면 만족도·주간 기능·수면에 대한 걱정)을 참고해 자체 문항으로 재구성했습니다. 원 척도의 문구를 그대로 옮기지 않고 한국어 자기보고에 맞게 다듬었으며, 수면위생 영역을 더해 생활습관까지 함께 살피도록 했습니다. 누구나 무료로 자기 점검에 활용할 수 있도록 공개된 형태로 제공합니다.",
  },
  "social_anxiety": {
    what: "사회불안 자가검사는 발표·대화·낯선 사람과의 만남처럼 타인의 시선과 평가가 따르는 사회적 상황에서 느끼는 두려움과 회피 정도를 스스로 점검하는 선별 도구입니다. 국제적으로 널리 쓰이는 LSAS(리보위츠 사회불안척도)와 SPIN(사회공포증척도)의 핵심 증상 영역을 바탕으로, 평소의 경험을 6개 하위영역으로 나누어 살펴봅니다. 의학적 진단이 아니라 사회불안 경향이 어느 정도인지 가늠하고 도움이 필요한지 판단하는 데 참고가 되는 검사입니다.",
    measures: [
      { label: "발표·주목 상황 두려움", desc: "발표·보고·시연처럼 여러 사람의 주목을 받는 수행 상황에서 느끼는 긴장과 두려움을 봅니다." },
      { label: "대화·상호작용 두려움", desc: "낯선 사람에게 말 걸기, 모임 합류, 부탁·전화·호감 표현 등 상호작용을 시작하고 이어가는 데 따르는 불안을 봅니다." },
      { label: "부정적 평가 걱정", desc: "남들이 나를 우습거나 이상하게 볼까, 무능하다고 평가할까 하는 사회불안의 핵심 두려움을 봅니다." },
      { label: "신체증상", desc: "긴장 상황에서 나타나는 떨림·얼굴 붉어짐·땀·심장 두근거림·목소리 떨림 등 신체 반응과 그에 대한 신경 씀을 봅니다." },
      { label: "회피·안전행동", desc: "두려운 사회적 상황을 미루거나 빠지거나, 눈을 피하고 말을 아끼는 등 회피·안전행동의 정도를 봅니다." },
      { label: "예기불안·사후 곱씹기", desc: "사회적 상황을 앞두고 미리 걱정하거나, 끝난 뒤 자신의 말·행동을 반복해서 되짚으며 자책하는 경향을 봅니다." },
    ],
    how: "각 문항을 평소 자신의 두려움·회피 정도에 따라 0점(전혀 그렇지 않다)부터 4점(매우 그렇다)까지로 답합니다. 40문항 점수를 모두 더하면 0점에서 160점 사이가 되며, 점수가 높을수록 사회불안 경향이 강하고 일상에 미치는 영향이 클 가능성이 높습니다. 하위영역별 점수를 따로 살펴보면 어떤 상황에서 특히 어려움을 겪는지 파악하는 데 도움이 됩니다.",
    interpret: "총점은 사회불안 경향의 대략적인 정도를 단계로 보여주는 참고치입니다. 점수가 낮으면 사회적 상황에서의 불편이 크지 않은 편이고, 중간 단계는 특정 상황에서 부담을 느끼는 정도, 높은 단계는 두려움과 회피가 일상·관계·일에 뚜렷한 지장을 줄 가능성을 시사합니다. 이 결과는 선별 참고일 뿐 진단이 아니며, 실제 진단과 치료 필요성은 정신건강의학과 의사나 임상심리전문가의 평가를 통해 확인해야 합니다.",
    background: "이 검사는 사회불안 평가에 가장 널리 쓰이는 LSAS(Liebowitz Social Anxiety Scale)와 SPIN(Social Phobia Inventory)의 핵심 증상 구성(수행·상호작용 상황의 두려움과 회피, 부정적 평가에 대한 걱정, 신체 반응 등)을 참고해 자체 문항으로 새로 작성했습니다. 원척도 문구를 그대로 옮기지 않았으며, 비전문가의 자기점검을 돕기 위한 무료·비상업 목적의 선별 도구입니다. 사회불안은 흔하면서도 인지행동치료(CBT)와 필요시 약물치료로 충분히 호전될 수 있는 영역입니다.",
  },
  "anger": {
    what: "이 검사는 STAXI(상태-특성 분노 표현 척도) 이론을 토대로 평소 나의 분노 경험과 표현 방식을 살펴보는 자가 선별 도구입니다. 분노를 밖으로 터뜨리는 편인지, 속으로 삭이는 편인지, 그리고 분노가 몸과 관계에 어떤 영향을 주는지를 여러 각도에서 점검합니다. 진단이 아니라 자기 이해와 점검을 돕기 위한 것입니다.",
    measures: [
      { label: "분노 표출", desc: "화가 났을 때 목소리·표정·행동으로 곧바로 밖으로 드러내는 경향" },
      { label: "분노 억제", desc: "화를 겉으로 내지 못하고 속으로 참고 삭이는 경향" },
      { label: "신체 반응", desc: "분노에 동반되는 심박 증가·근육 긴장·열감 등 몸의 반응" },
      { label: "충동·공격성", desc: "분노 상황에서 결과를 고려하지 못하고 충동적·공격적으로 행동하는 정도" },
      { label: "적대감·곱씹기", desc: "타인을 적대적으로 해석하고 화났던 일을 반복해 곱씹는 경향" },
      { label: "후회·관계 손상", desc: "분노 표현이 관계·평판에 남긴 손상과 그에 따른 후회" },
      { label: "도발 민감성", desc: "비판·방해·지연 같은 자극에 쉽게 발화하는 민감도" },
    ],
    how: "40문항을 각각 0(전혀 아니다)에서 4(거의 항상 그렇다)의 빈도로 평가해 합산합니다. 총점 범위는 0~160점이며, 점수가 높을수록 평소 분노의 빈도·강도와 그로 인한 영향이 큰 것을 뜻합니다. 건강한 조절 방향을 묻는 역채점 문항 3개는 점수를 뒤집어 합산하여 응답 편향을 보정합니다.",
    interpret: "점수는 양호에서 심각까지 단계로 나누어 해석합니다. 낮은 점수는 분노를 비교적 잘 다루고 있음을, 높은 점수는 분노가 자주·강하게 일어나며 몸과 관계에 부담을 주고 있음을 시사합니다. 하위영역별 점수를 함께 보면 자신의 분노가 주로 어떤 방식(표출·억제·신체화·충동·곱씹기 등)으로 나타나는지 파악하는 데 도움이 됩니다. 이 결과는 선별 참고용이며 의학적·심리학적 진단을 대체하지 않습니다. 점수가 높다면 전문가 상담을 고려하세요.",
    background: "STAXI(상태-특성 분노 표현 척도, Spielberger)는 분노를 일시적 상태(state)와 지속적 특성(trait)으로 구분하고, 표출(anger-out)·억제(anger-in)·조절(anger-control)의 차원으로 보는 대표적 분노 평가 틀입니다. 본 검사는 그 핵심 개념을 자체 표현으로 재구성한 비공식 무료 자가점검 도구로, 원 척도의 문항을 그대로 사용하지 않습니다.",
  },
  "loneliness": {
    what: "이 검사는 '요즘' 내가 느끼는 외로움과 사회적 고립의 정도를 살펴보는 자가 선별 도구입니다. 단순히 혼자 있는 시간이 많은지를 넘어, 친밀함의 부재·단절감·이해받지 못함처럼 주관적으로 경험하는 외로움을 여러 각도에서 살펴봅니다. 전 세계적으로 널리 쓰이는 UCLA 외로움 척도의 핵심 개념을 토대로 자체 문항으로 구성했습니다.",
    measures: [
      { label: "정서적 외로움(친밀함 부재)", desc: "마음을 깊이 나눌 친밀한 대상이 없다고 느끼는 정도입니다. 사랑받고 가까이 연결되어 있다는 느낌의 결핍을 봅니다." },
      { label: "사회적 고립(어울림 부족)", desc: "사람들과 어울리고 함께 활동할 기회가 실제로 얼마나 부족한지를 살펴봅니다." },
      { label: "소속감 결여", desc: "어떤 집단이나 모임에 자신이 속해 있고 받아들여진다는 느낌이 얼마나 부족한지를 봅니다." },
      { label: "단절·소외감", desc: "사람들 속에서도 혼자라고 느끼거나 세상과 동떨어져 있다고 느끼는 정도입니다." },
      { label: "이해받지 못함", desc: "내 생각과 감정을 진심으로 알아주고 이해해 주는 사람이 없다고 느끼는 정도입니다." },
      { label: "관계 불만족", desc: "현재 맺고 있는 관계의 깊이와 질이 내가 원하는 만큼인지에 대한 주관적 만족도입니다." },
      { label: "도움 청할 사람 없음", desc: "위기나 곤란한 순간에 기대고 도움을 청할 수 있는 사람이 있는지에 대한 인식입니다." },
    ],
    how: "총 40문항을 각각 0점(전혀 그렇지 않다)부터 4점(매우 자주 그렇다)까지 빈도로 응답합니다. 건강·긍정 방향으로 서술된 문항은 역으로 채점되어, 모든 문항이 '외로움이 클수록 높은 점수'가 되도록 합산됩니다. 합산 점수의 범위는 0~160점이며, 점수가 높을수록 요즘 느끼는 외로움과 고립감이 크다는 것을 뜻합니다.",
    interpret: "점수는 낮음·약간·뚜렷함·심함의 네 단계로 나누어 해석합니다. 이는 외로움 경험의 정도를 가늠하는 선별 결과일 뿐, 우울증이나 다른 질환에 대한 의학적 진단이 아닙니다. 점수가 높거나 일상에 지장이 클 때, 혹은 무기력·절망감이 함께 든다면 전문가의 도움을 받는 것이 좋습니다.",
    background: "이 검사는 1978년 처음 개발되어 전 세계 연구·임상에서 가장 널리 사용되는 UCLA 외로움 척도(UCLA Loneliness Scale)의 핵심 구성개념을 근거로 합니다. UCLA 척도는 비영리 연구·교육 목적의 사용이 폭넓게 허용되어 온 도구이며, 본 검사는 그 개념을 참고하되 원 척도의 저작권 문구를 그대로 옮기지 않고 자체 표현으로 새로 작성했습니다. 따라서 점수 절단값과 해석은 원 척도의 공식 규준이 아니라 본 검사의 안내용 기준입니다.",
  },
  "eating": {
    what: "이 검사는 최근 3개월 동안 식사·체중·체형에 대한 태도와 행동을 스스로 점검해 보는 자가 선별 도구입니다. 섭식 태도 평가에 널리 쓰이는 EAT-26(Eating Attitudes Test, 섭식 태도 검사)의 핵심 증상 영역을 바탕으로, 다이어트와 음식 통제, 폭식 충동, 구토·과도한 운동 같은 보상행동, 체형 불만족 등 섭식 문제와 관련된 경험을 여러 각도에서 살펴봅니다. 진단을 내리는 검사가 아니라, 도움이 필요한 신호가 있는지 미리 알아차리도록 돕는 선별 검사입니다.",
    measures: [
      { label: "체중·체형 집착", desc: "체중과 몸매에 대한 생각이 하루를 지배하고, 체중계 숫자나 거울에 과도하게 매달리는 정도를 살핍니다." },
      { label: "다이어트·음식 통제", desc: "칼로리·양·종류를 엄격하게 제한하거나 특정 음식을 피하는 등 음식을 강하게 통제하려는 경향을 봅니다." },
      { label: "폭식·과식 충동", desc: "짧은 시간에 많은 양을 먹거나 멈추기 어려운 과식·폭식 충동의 빈도를 측정합니다." },
      { label: "보상행동", desc: "먹은 것을 되돌리려고 토하기, 굶기, 지나친 운동, 약물 사용 등을 하는 행동을 확인합니다." },
      { label: "음식에 대한 죄책감·두려움", desc: "먹는 것 자체에 대한 불안과 죄책감, 살이 찔 것에 대한 두려움의 정도를 봅니다." },
      { label: "체형 불만족", desc: "자신의 몸에 대한 불만과 부정적 평가, 몸을 향한 자기비난의 정도를 살핍니다." },
      { label: "먹는 것에 대한 통제 상실감", desc: "먹는 것 앞에서 스스로를 통제하지 못한다는 느낌과 음식에 휘둘리는 경험을 측정합니다." },
    ],
    how: "40개 문항에 대해 최근 3개월의 경험을 0(전혀 그렇지 않다)부터 4(거의 항상 그렇다)까지 빈도로 답합니다. 건강·긍정 방향 문항(역채점)은 점수를 뒤집어 계산하며, 모든 문항 점수를 더하면 총점은 0~160점 범위입니다. 점수가 높을수록 섭식 태도와 관련된 어려움의 신호가 많다는 뜻이고, 낮을수록 식사와 체형에 대한 관계가 비교적 안정적임을 시사합니다.",
    interpret: "결과는 안정 범위·가벼운 신호·주의가 필요함·전문가 도움 권고 단계로 해석하며, 점수가 높을수록 전문적인 평가가 필요할 가능성이 커집니다. 다만 이 점수는 섭식장애를 확정하는 진단이 아니라 위험 신호를 가려내는 선별 결과입니다. 총점이 낮더라도 구토·약물 사용 같은 보상행동이 있거나 일상에 지장이 크다면 점수와 무관하게 도움을 받는 것이 좋습니다. 정확한 진단과 평가는 정신건강의학과 전문의나 임상심리 전문가를 통해 이루어져야 합니다.",
    background: "이 검사는 1979년 Garner와 Garfinkel이 개발하고 이후 26문항으로 축약된 EAT-26(Eating Attitudes Test)을 토대로 합니다. EAT-26은 전 세계 임상·연구 현장에서 섭식 문제 선별에 가장 널리 쓰이는 도구 중 하나로, 비상업적 선별 목적의 사용이 공개되어 있습니다. 본 문항은 EAT-26의 핵심 증상 영역을 참고하되 원문을 그대로 옮기지 않고 자체 표현으로 새로 작성했습니다.",
  },

  phq9: {
    what: "PHQ-9는 우울장애의 의학적 진단 기준(DSM)에 1:1로 대응하도록 설계된 9문항 우울 선별 도구입니다. 전 세계 1차 의료기관과 정신건강 현장에서 가장 널리 쓰이며, 지난 2주간 우울 증상의 심각도를 점수로 정량화합니다.",
    measures: [
      { label: "흥미·즐거움 상실", desc: "평소 즐기던 일에서 무쾌감(anhedonia)" },
      { label: "우울 정서", desc: "가라앉음·절망감" },
      { label: "수면 문제", desc: "불면 또는 과수면" },
      { label: "피로·에너지 저하", desc: "기운 없음" },
      { label: "식욕 변화", desc: "감소 또는 증가" },
      { label: "자기 비하·죄책감", desc: "실패감·자책" },
      { label: "집중력 저하", desc: "주의 유지 곤란" },
      { label: "정신운동 변화", desc: "느려짐 또는 초조" },
      { label: "자살 사고", desc: "죽음·자해에 대한 생각" },
    ],
    how: "우울 증상 40문항을 각각 0(전혀)~3(거의 매일)으로 답해 합산합니다(총 0~120점). 점수가 높을수록 우울 경향이 강하며, 문항이 많을수록 결과가 안정적이에요.",
    interpret: "결과는 점수에 따라 최소~중증 5단계로 보여드려요. 이는 선별·자기점검이며 진단이 아닙니다(진단은 전문가가 면담으로 내립니다). 특히 죽음·자해 관련 문항에 해당된다면 점수와 무관하게 즉시 도움을 구하세요.",
    background: "Kroenke & Spitzer(2001) 개발, Pfizer 교육지원. 별도 허가 없이 사용 가능한 공개 도구.",
  },
  gad7: {
    what: "GAD-7은 범불안장애의 핵심 증상을 바탕으로 만든 7문항 불안 선별 도구입니다. 지난 2주간 불안 증상의 심각도를 측정하며, 불안 전반의 1차 선별 지표로 널리 쓰입니다.",
    measures: [
      { label: "신경과민·초조", desc: "긴장되고 조마조마함" },
      { label: "걱정 통제 곤란", desc: "걱정을 멈추기 어려움" },
      { label: "과도한 걱정", desc: "여러 일에 대한 지나친 염려" },
      { label: "이완 곤란", desc: "편하게 있기 어려움" },
      { label: "안절부절", desc: "가만히 있기 힘듦" },
      { label: "과민·짜증", desc: "쉽게 예민해짐" },
      { label: "막연한 두려움", desc: "나쁜 일이 생길 것 같은 불안" },
    ],
    how: "불안 증상 40문항을 0~3으로 답해 합산합니다(총 0~120점). 높을수록 불안 경향이 강합니다.",
    interpret: "결과는 최소~중증 4단계로 보여드려요. 선별 도구이며 진단을 대체하지 않아요. 카페인·신체 질환 등 다른 원인도 불안 증상을 만들 수 있어요.",
    background: "Spitzer 등(2006) 개발. 허가 없이 사용 가능한 공개 도구.",
  },
  pss10: {
    what: "PSS-10은 '스트레스 사건' 자체가 아니라, 최근 한 달 삶을 얼마나 통제 불가능하고 예측 불가능하며 버겁다고 '지각'하는지를 측정합니다. 같은 상황도 사람마다 다르게 느낀다는 점에 초점을 둔, 주관적 스트레스 인식 척도입니다.",
    measures: [
      { label: "통제 불가능감", desc: "중요한 일을 통제 못 한다는 느낌" },
      { label: "예측 불가능감", desc: "예상 못 한 일에 당황함" },
      { label: "과부하감", desc: "감당할 수 없이 쌓인다는 느낌" },
      { label: "대처 자신감(역)", desc: "문제를 다룰 수 있다는 자신감" },
      { label: "장악감(역)", desc: "일이 뜻대로 된다는 느낌" },
    ],
    how: "지각된 스트레스 40문항을 0~4 빈도로 답해 합산합니다(총 0~160점).",
    interpret: "결과는 낮음·보통·높음 3단계로 보여드려요. 스트레스 '인식' 정도를 보는 참고 지표이며, 같은 사람의 시점 간 비교에 특히 유용해요.",
    background: "Cohen 등(1983) 개발. 지각된 스트레스를 재는 가장 널리 쓰이는 척도. 비영리·교육 목적 무료.",
  },
  burnout: {
    what: "코펜하겐 번아웃 척도(CBI)의 '개인 소진' 영역으로, 직업 유무와 관계없이 한 사람이 전반적으로 느끼는 신체적·정서적 피로와 소진의 정도를 측정합니다.",
    measures: [
      { label: "신체적 탈진", desc: "피곤·기진맥진" },
      { label: "정서적 탈진", desc: "정서적으로 바닥난 느낌" },
      { label: "소진감", desc: "'더는 못 견디겠다'는 느낌" },
      { label: "회복 저하", desc: "쉬어도 안 풀리고 병에 약해짐" },
    ],
    how: "소진 관련 40문항을 0~4 빈도로 답해 합산합니다(총 0~160점).",
    interpret: "결과는 양호·중등도·높음 3단계로 보여드려요. 소진 정도를 보는 참고 지표이며 진단이 아니에요.",
    background: "Kristensen 등(2005) 개발. 공개(public domain) 도구로 자유롭게 사용 가능.",
  },
  "self-esteem": {
    what: "로젠버그 자존감 척도(RSES)는 자기 자신에 대한 전반적인 가치감·만족감(자존감)을 재는 10문항 단일 차원 척도로, 사회과학에서 가장 많이 인용되는 자존감 측정 도구입니다.",
    measures: [
      { label: "자기 가치감", desc: "스스로를 가치 있다고 느끼는 정도(긍정 문항)" },
      { label: "자기 수용·만족", desc: "자신에 대한 긍정적 태도" },
      { label: "자기 비하(역)", desc: "무가치감·실패감 등 부정적 자기평가" },
    ],
    how: "자존감 40문항을 4점 척도로 답하고, 부정 문항(약 절반)을 역채점한 뒤 합산합니다(0~120점). 높을수록 자존감이 높습니다.",
    interpret: "결과는 낮음·건강한 범위·높음 3단계로 보여드려요. 자존감은 상황·시기에 따라 변하므로 한 번의 점수보다 흐름이 중요해요.",
    background: "Morris Rosenberg(1965) 개발. 교육·연구·임상 목적 무료.",
  },
  resilience: {
    what: "간이 회복탄력성 척도(BRS)는 '역경에서 원래 상태로 회복(bounce back)하는 능력' 그 자체를 측정합니다. 회복을 돕는 자원·요인을 재는 다른 척도들과 달리, 회복 '결과'에 직접 초점을 둡니다.",
    measures: [
      { label: "회복 속도", desc: "힘든 일 뒤 빠르게 회복함" },
      { label: "스트레스 견딤(역)", desc: "스트레스 사건을 버텨내는 힘" },
      { label: "좌절 극복(역)", desc: "안 좋은 일에서 다시 일어서는 시간" },
    ],
    how: "회복탄력성 40문항을 1~5로 답하고, 부정 문항(약 절반)을 역채점한 뒤 합산합니다(40~200점). 높을수록 회복탄력성이 높습니다.",
    interpret: "결과는 낮음·보통·높음 3단계로 보여드려요. 회복탄력성은 타고나는 것이 아니라 경험·관계·습관으로 길러져요.",
    background: "Smith 등(2008) 개발·검증. 연구·실무에서 자유롭게 사용.",
  },
  bigfive: {
    what: "성격 5요인 모델(Big Five)은 성격심리학에서 가장 과학적으로 검증된 성격 이론입니다. 이 정밀 검사는 5개 큰 축을 각각 6개 하위척도로 나눠, 성격을 30개 측면에서 입체적으로 분석합니다(전문 성격검사가 쓰는 방식).",
    measures: [
      { label: "개방성 (6)", desc: "상상력·예술적 관심·정서성·모험성·지성·진보성" },
      { label: "성실성 (6)", desc: "자기효능감·정돈성·책임감·성취추구·자기통제·신중성" },
      { label: "외향성 (6)", desc: "친밀성·사교성·자기주장·활동성·자극추구·쾌활함" },
      { label: "우호성 (6)", desc: "신뢰·도덕성·이타성·협력성·겸손·공감" },
      { label: "신경성 (6)", desc: "불안·분노·우울·자의식·무절제·취약성" },
    ],
    how: "120문항(축마다 6개 하위척도 × 4문항)을 1~5로 답하고, 역문항을 보정해 축·하위척도별로 합산한 뒤 백분율로 환산합니다.",
    interpret: "각 축의 높고 낮음에 좋고 나쁨은 없습니다. 모든 특성은 상황에 따라 강점도 약점도 됩니다. 백분율은 문항 응답에 기반한 상대 위치이며, 대규모 규준집단 백분위는 아닙니다.",
    background: "IPIP-NEO-120 (Johnson 2014) — NEO-PI-R 30개 facet을 재현한 공개(public domain) 척도로 상업적 사용까지 자유.",
  },
  adhd: {
    what: "ASRS v1.1은 세계보건기구(WHO)가 성인 ADHD를 선별하기 위해 만든 18문항 자기보고 척도입니다. DSM의 ADHD 진단기준에 대응하며, 특히 앞 6문항(파트 A)이 가장 강력한 선별 지표로 검증되어 있습니다.",
    measures: [
      { label: "주의력 결핍 (9문항)", desc: "마무리·정리·기억·집중·물건 분실·산만함" },
      { label: "과잉행동·충동성 (9문항)", desc: "안절부절·과도한 활동·말 끼어들기·차례 기다리기 어려움" },
    ],
    how: "ADHD 특성 40문항을 0~4 빈도로 답해 합산합니다(0~160점). 점수가 높을수록 주의력·과잉행동·충동성 특성이 잦습니다.",
    interpret: "결과는 특성 약함·일부·뚜렷 3단계로 보여드려요. 선별 도구이며 진단이 아니에요. 어린 시절부터 여러 상황에서 지장이 있었다면 정밀 평가가 권장돼요.",
    background: "WHO·성인 ADHD 워크그룹(Adler, Kessler, Spencer 등) 개발. 임상·연구용으로 무료 사용 가능.",
  },
  ocd: {
    what: "OCI-R은 강박장애의 다양한 증상을 폭넓게 측정하는 18문항 자기보고 척도입니다. 강박 증상을 6개 유형으로 나눠, 각 영역이 지난 한 달 얼마나 당신을 괴롭혔는지 평가합니다.",
    measures: [
      { label: "씻기", desc: "오염에 대한 두려움과 과도한 씻기" },
      { label: "확인", desc: "문·가스·잠금 등 반복 확인" },
      { label: "정렬", desc: "물건이 제 순서·자리에 있어야 하는 욕구" },
      { label: "강박사고", desc: "원치 않게 떠오르는 불쾌한 생각" },
      { label: "저장", desc: "필요 없는 물건을 버리지 못함" },
      { label: "중화", desc: "숫자 세기 등 불안을 상쇄하는 반복 행위" },
    ],
    how: "강박 증상 40문항을 0~4의 '고통 정도'로 답해 합산합니다(0~160점). 역채점 문항은 없습니다.",
    interpret: "결과는 낮음·주의·높음 3단계로 보여드려요. 선별 도구이며 진단이 아니에요 — 강박은 인지행동치료(노출·반응방지)로 효과적으로 치료돼요.",
    background: "Foa 등(2002) 개발. 원 논문에 전문 공개, 임상·연구용 무료 사용.",
  },
  sns: {
    what: "버겐 소셜미디어 중독 척도(BSMAS)는 행위중독의 6가지 핵심 요소 이론에 따라, 인스타·유튜브·틱톡 등 소셜미디어의 문제적·중독적 사용을 측정합니다.",
    measures: [
      { label: "현저성", desc: "늘 SNS를 생각하고 계획함" },
      { label: "기분 조절", desc: "고민을 잊으려 SNS에 의존" },
      { label: "내성", desc: "점점 더 많이 쓰고 싶음" },
      { label: "금단", desc: "못 하면 안절부절·괴로움" },
      { label: "갈등", desc: "학업·일에 지장" },
      { label: "재발", desc: "줄이려 해도 실패" },
    ],
    how: "SNS 의존 40문항을 1~5 빈도로 답해 합산합니다(40~200점).",
    interpret: "결과는 낮음·보통·주의·높음 4단계로 보여드려요. 단정적 판정보다 위험 단계로 이해하세요.",
    background: "Andreassen 등(2016) 개발. 비영리 연구·임상 목적 무료.",
  },
  smartphone: {
    what: "스마트폰 중독 척도 단축형(SAS-SV)은 한국에서 개발된 스마트폰 과의존 위험 측정 도구로, 일상 기능 손상부터 금단·내성까지 폭넓게 평가합니다.",
    measures: [
      { label: "일상생활 장애", desc: "계획한 일·집중에 지장" },
      { label: "금단", desc: "없으면 초조·불안" },
      { label: "내성·몰두", desc: "생각보다 길게, 늘 떠오름" },
      { label: "강박적 사용", desc: "지장에도 포기 못 함" },
      { label: "사이버 지향 관계", desc: "온라인 소식 확인 집착" },
    ],
    how: "스마트폰 의존 40문항을 1~6으로 답해 합산합니다(40~240점).",
    interpret: "결과는 양호·주의·높음 3단계로 보여드려요. 절대 기준이 아니라 사용 습관을 돌아보는 참고 지표예요.",
    background: "Kwon 등(2013), PLoS ONE 게재(CC BY).",
  },
  game: {
    what: "세계보건기구(ICD-11)와 미국정신의학회(DSM-5)가 정의한 '게임이용장애/인터넷게임장애'의 9개 진단 기준을 자가점검 형태로 옮긴 검사입니다.",
    measures: [
      { label: "몰두", desc: "게임 생각에 사로잡힘" },
      { label: "금단", desc: "줄일 때 짜증·불안" },
      { label: "내성", desc: "점점 더 많은 시간 필요" },
      { label: "조절 실패", desc: "줄이려 해도 실패" },
      { label: "흥미 상실", desc: "다른 취미에 무관심" },
      { label: "문제에도 지속·속임·도피·관계 상실", desc: "해가 되는데도 지속, 거짓말, 도피적 사용, 관계·기회 상실" },
    ],
    how: "게임 이용 40문항을 1~5 빈도로 답해 합산합니다(40~200점).",
    interpret: "결과는 낮음·보통·주의·높음 4단계로 보여드려요. 합산 점수는 과몰입 심각도의 참고 지표이며, 이 검사는 진단이 아닌 자가점검이에요.",
    background: "DSM-5(2013)·ICD-11 진단기준 기반. 본 문항은 기준을 바탕으로 한 자체 각색.",
  },
  audit: {
    what: "AUDIT는 세계보건기구(WHO)가 여러 나라 공동연구로 개발한 음주 문제 선별검사로, 지난 1년의 위험·유해 음주와 알코올 의존 가능성을 평가합니다.",
    measures: [
      { label: "음주 소비", desc: "음주 빈도·1회 음주량·폭음" },
      { label: "의존 증상", desc: "조절 실패·음주에 대한 집착·해장술" },
      { label: "음주로 인한 피해", desc: "죄책감·블랙아웃·부상·주변의 우려" },
    ],
    how: "음주 문제 40문항을 0~4 빈도로 답해 합산합니다(0~160점).",
    interpret: "결과는 저위험·위험·유해·의존 의심 4단계로 보여드려요. 선별·자기점검이며 진단이 아니에요. 여성·청소년·고령자는 더 낮은 점수부터 주의하세요.",
    background: "Babor 등(WHO, 2001) 개발. 공개(public domain) 도구.",
  },
  "ai-type": {
    what: "illo가 재미로 만든 가벼운 유형 테스트입니다. 검증된 심리척도가 아니며, 결과는 과학적 해석의 대상이 아닙니다.",
    measures: [
      { label: "AI 활용 성향", desc: "만들기·창작·학습·자동화·탐색 중 어디에 끌리는지" },
    ],
    how: "6개 질문에서 고른 답을 유형별로 집계해, 가장 많이 나온 유형을 보여줍니다.",
    interpret: "순수 재미용입니다. 자신을 칸에 가두기보다 가볍게 즐겨주세요.",
    background: "illo 자체 제작.",
  },
};

export function getAbout(id: string): TestAbout | undefined {
  return ABOUT[id];
}
