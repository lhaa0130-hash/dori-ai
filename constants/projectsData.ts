// 프로젝트(개발 중 프로그램) 공유 데이터 — 목록/상세 페이지 공용
// 정적 export 환경이라 fs 없이 순수 데이터로 관리합니다.

export type ProjectStatus = "지금 무료" | "준비 중" | "기획 중";

export interface ProjectFeature {
  icon: string;
  title: string;
  detail: string;
}

export type ProjectCategory = "main" | "kids";

export interface ProjectItem {
  slug: string; // illo | animal | family
  name: string;
  emoji: string;
  image: string;
  tag: string; // 정식 프로그램 / 1st Project / 2nd Project
  category: ProjectCategory; // main: 일반 / kids: 키즈 전용
  isMain: boolean;
  status: ProjectStatus;
  isActive: boolean;
  desc: string; // 한 줄 슬로건
  longDesc: string; // 소개 문단
  tags: string[];
  launchHref?: string; // 실제 프로그램/체험 링크
  launchLabel?: string;
  features: ProjectFeature[];
}

export const PROJECTS: ProjectItem[] = [
  {
    slug: "animal",
    name: "동물도감",
    emoji: "🐾",
    image: "",
    tag: "키즈 전용",
    category: "kids",
    isMain: false,
    status: "이용 가능",
    isActive: true,
    desc: "다양한 동물을 도감처럼 만나요",
    longDesc:
      "요즘 아이들이 접하는 동물의 수는 점점 줄고 있어요. 동물도감은 아이들이 다양한 동물을 도감처럼 친숙하게 모으고, 색깔·먹이·크기·사는 곳 같은 특징을 골라 원하는 동물을 쉽게 찾을 수 있도록 만든 교육 프로젝트입니다. 다양한 기준으로 동물을 탐험해보세요.",
    tags: ["어린이 교육", "동물 생태", "특징 검색"],
    launchHref: "/animal",
    launchLabel: "바로 가기",
    features: [
      { icon: "🔎", title: "특징으로 찾기", detail: "곤충을 먹는 동물, 흰색 동물, 손바닥만한 동물처럼 원하는 특징을 골라 찾아요." },
      { icon: "🃏", title: "도감 수집의 재미", detail: "도감을 하나씩 채워가며 동물을 친숙하게 익혀요." },
      { icon: "📚", title: "아이 눈높이 설명", detail: "먹이·서식지·크기 등 핵심 정보를 쉽고 재미있게 풀어줘요." },
    ],
  },
  {
    slug: "illo",
    name: "워키 (Worki)",
    emoji: "🟧",
    image: "/illo-logo.png",
    tag: "정식 프로그램",
    category: "main",
    isMain: true,
    status: "지금 무료",
    isActive: true,
    desc: "수많은 AI로, 혼자서도 사업을",
    longDesc:
      "하고 싶은 일을 클릭만 하면, 그 작업에 가장 잘 맞는 AI가 이미 연결돼 있어요. 글쓰기·마케팅·고객응대·요약까지 — 복잡한 설정 없이 누구나 손쉽게 1인 사업을 시작할 수 있는 AI 사무실입니다. 도구마다 따로 가입하고 프롬프트를 고민할 필요 없이, '일'만 고르면 됩니다.",
    tags: ["수많은 AI", "1인 사업", "지금 무료"],
    launchHref: "/illo/app",
    launchLabel: "지금 체험하기",
    features: [
      { icon: "🎯", title: "작업만 고르면 끝", detail: "글쓰기·마케팅·고객응대 등 하고 싶은 일을 고르면 최적의 AI가 자동 연결돼요." },
      { icon: "🔑", title: "내 API 키로 무제한", detail: "내 키를 연결하면 한도까지 마음껏, 가장 강력한 최신 모델로 사용할 수 있어요." },
      { icon: "🛠️", title: "나만의 워크플로우", detail: "입력 → 조사 → 작성 → 검토 단계를 노드로 연결해 나만의 자동화를 직접 설계해요." },
      { icon: "📁", title: "결과 보관함", detail: "만든 결과물을 자동으로 보관하고 언제든 다시 보거나 텍스트로 내려받을 수 있어요." },
    ],
  },
  {
    slug: "family",
    name: "가족기록",
    emoji: "👨‍👩‍👧‍👦",
    image: "",
    tag: "2nd Project",
    category: "main",
    isMain: false,
    status: "기획 중",
    isActive: false,
    desc: "가족의 모든 것을 하나의 앱으로",
    longDesc:
      "일정·사진·건강·추억·할 일까지, 가족 구성원 모두가 실시간으로 공유하는 가족 전용 플랫폼이에요. 카카오에 흩어진 사진, 각자의 캘린더, 메모장의 건강 기록을 한곳에 모아 온 가족이 함께 볼 수 있게 만들어드려요.",
    tags: ["가족 공유", "추억 기록", "AI 요약"],
    features: [
      { icon: "🗓️", title: "가족 캘린더", detail: "각자 흩어진 일정을 하나로 모아 온 가족이 함께 봐요." },
      { icon: "🖼️", title: "추억 아카이브", detail: "카카오·갤러리에 흩어진 사진을 한곳에 모아 정리해요." },
      { icon: "💗", title: "건강 기록", detail: "복약·검진 등 가족 건강 기록을 함께 챙겨요." },
      { icon: "✨", title: "AI 요약", detail: "이번 주 가족 소식을 AI가 한눈에 정리해줘요." },
    ],
  },
];

export function getProjectBySlug(slug: string): ProjectItem | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
