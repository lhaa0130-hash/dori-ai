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
  { id: "self", name: "자기 이해", emoji: "🪞", desc: "자존감·회복탄력성" },
  { id: "addiction", name: "중독·의존", emoji: "📵", desc: "SNS·스마트폰·게임·음주 습관" },
  { id: "fun", name: "가볍게", emoji: "✨", desc: "재미로 보는 유형 테스트" },
] as const;

/* ── 공통 응답 보기 ─────────────────────────────── */

// PHQ-9 / GAD-7 : 0~3 (지난 2주 빈도)
const FREQ_2W: Choice[] = [
  { label: "전혀 아니다", value: 0 },
  { label: "며칠 동안", value: 1 },
  { label: "일주일 이상", value: 2 },
  { label: "거의 매일", value: 3 },
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
  { label: "매우 그렇다", value: 3 },
  { label: "그렇다", value: 2 },
  { label: "아니다", value: 1 },
  { label: "전혀 아니다", value: 0 },
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
  { label: "전혀 그렇지 않다", value: 0 },
  { label: "약간 그렇다", value: 1 },
  { label: "보통이다", value: 2 },
  { label: "많이 그렇다", value: 3 },
  { label: "매우 그렇다", value: 4 },
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

  // ═══════════════ ✨ 가볍게 (기존 테스트 보존) ═══════════════
  {
    kind: "typed",
    id: "ai-type",
    category: "fun",
    emoji: "🤖",
    title: "나는 어떤 AI 사용자일까?",
    subtitle: "6문항 · AI 활용 성향",
    source: "DORI-AI 자체 제작 (재미용)",
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

/* ── 검사 상세 안내(브리핑) ─────────────────────── */

export const ABOUT: Record<string, TestAbout> = {
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
    what: "DORI-AI가 재미로 만든 가벼운 유형 테스트입니다. 검증된 심리척도가 아니며, 결과는 과학적 해석의 대상이 아닙니다.",
    measures: [
      { label: "AI 활용 성향", desc: "만들기·창작·학습·자동화·탐색 중 어디에 끌리는지" },
    ],
    how: "6개 질문에서 고른 답을 유형별로 집계해, 가장 많이 나온 유형을 보여줍니다.",
    interpret: "순수 재미용입니다. 자신을 칸에 가두기보다 가볍게 즐겨주세요.",
    background: "DORI-AI 자체 제작.",
  },
};

export function getAbout(id: string): TestAbout | undefined {
  return ABOUT[id];
}
