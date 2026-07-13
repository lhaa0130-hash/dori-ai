// 프로젝트(개발 중 프로그램) 공유 데이터 — 목록/상세 페이지 공용
export type ProjectStatus = "오픈" | "테스트 중" | "준비 중" | "기획 중";

export interface ProjectFeature {
  icon: string;
  title: string;
  detail: string;
}

export type ProjectCategory = "main" | "kids";

export interface ProjectItem {
  slug: string;
  name: string;
  emoji: string;
  image: string;
  tag: string;
  category: ProjectCategory;
  isMain: boolean;
  status: ProjectStatus;
  isActive: boolean;
  desc: string;
  longDesc: string;
  tags: string[];
  launchHref?: string;
  launchLabel?: string;
  launchDate?: string;
  features: ProjectFeature[];
}

export const PROJECTS: ProjectItem[] = [
  {
    slug: "animal",
    name: "몽글로 : 동물도감",
    emoji: "🐾",
    image: "",
    tag: "키즈 서비스",
    category: "kids",
    isMain: false,
    status: "오픈",
    isActive: true,
    desc: "300종 동물을 아이 눈높이로 탐험하는 교육 도감",
    longDesc:
      "요즘 아이들이 접하는 동물의 수는 점점 줄고 있어요. 몽글로 : 동물도감은 실제 동물 사진과 3D 이미지를 함께 활용해 아이들이 300종+ 동물을 도감처럼 친숙하게 탐험하고, 색깔·먹이·크기·사는 곳 같은 특징으로 원하는 동물을 쉽게 찾을 수 있도록 만든 어린이 교육 서비스예요. 매일 5종씩 새 동물이 추가됩니다.",
    tags: ["어린이 교육", "동물 생태", "매일 업데이트"],
    launchHref: "/animal",
    launchLabel: "동물 탐험하기",
    features: [
      { icon: "🔎", title: "특징으로 찾기", detail: "곤충을 먹는 동물, 흰색 동물, 손바닥만한 동물처럼 특징을 골라 찾아요." },
      { icon: "🃏", title: "도감 수집의 재미", detail: "300종 동물을 하나씩 모아가며 친숙하게 익혀요." },
      { icon: "📚", title: "아이 눈높이 설명", detail: "먹이·서식지·크기 등 핵심 정보를 쉽고 재미있게 풀어줘요." },
      { icon: "🔄", title: "매일 5종 추가", detail: "AI 자동화로 매일 새 동물이 도감에 추가돼요." },
    ],
  },
  {
    slug: "illo",
    name: "AI 비서",
    emoji: "🟧",
    image: "/illo-logo.png",
    tag: "오픈 베타",
    category: "main",
    isMain: true,
    status: "테스트 중",
    isActive: true,
    desc: "수많은 AI를 한 공간에서 — 1인 사업용 AI 사무실",
    longDesc:
      "하고 싶은 일을 고르면 그 작업에 딱 맞는 AI가 이미 연결돼 있어요. 글쓰기·마케팅·고객응대·요약·번역까지 복잡한 설정 없이 원하는 업무를 처리할 수 있는 AI 사무실입니다. illo.im 계정으로 로그인하면 바로 샘플을 사용할 수 있어요.",
    tags: ["1인 사업", "AI 자동화", "오픈 베타"],
    launchHref: "/ai-assistant",
    launchLabel: "AI 비서 사용하기",
    features: [
      { icon: "🎯", title: "할 일만 고르면 끝", detail: "글쓰기·마케팅·고객응대 등 원하는 업무를 클릭하면 최적의 AI가 자동 연결돼요." },
      { icon: "🔑", title: "내 API 키로 무제한", detail: "내 키를 연결하면 최신 최강 모델로 한도 없이 사용할 수 있어요." },
      { icon: "🛠️", title: "나만의 워크플로우", detail: "입력→조사→작성→검토 단계를 노드로 이어 자동화를 설계해요." },
      { icon: "📁", title: "결과 보관함", detail: "만든 결과물을 자동 저장, 언제든 다시 보거나 내려받아요." },
    ],
  },
  {
    slug: "flat-form",
    name: "건축보조(준비중)",
    emoji: "📐",
    image: "",
    tag: "준비 중",
    category: "main",
    isMain: true,
    status: "준비 중",
    isActive: false,
    desc: "지번 입력만 하면 지적도·건폐율·용적률까지 자동으로",
    longDesc:
      "주소를 입력하면 VWorld 지적도가 자동 로드되고, 건폐율·용적률을 계산해 건축한계선이 표시돼요. 실 편집으로 간단한 평면도를 직접 그리고 저장할 수 있는 건축 보조 도구예요. 현재 기능 검증 테스트 단계입니다.",
    tags: ["건축설계", "지적도 조회", "평면도 편집"],
    launchHref: "/flat-form",
    launchLabel: "테스트 참여하기",
    features: [
      { icon: "🗺️", title: "지적도 자동 로드", detail: "주소를 입력하면 VWorld 지적도가 자동으로 불러와져요." },
      { icon: "📏", title: "건축한계선 자동 계산", detail: "건폐율·용적률·이격거리를 자동 계산해 한계선을 그려줘요." },
      { icon: "✏️", title: "실 편집·저장", detail: "실(Room)을 직접 배치하고 로컬에 저장해요." },
      { icon: "🔄", title: "필지 회전 정렬", detail: "두 점을 찍으면 필지를 수평으로 자동 회전해요." },
    ],
  },
  {
    slug: "family",
    name: "가족정보(준비중)",
    emoji: "👨‍👩‍👧‍👦",
    image: "",
    tag: "준비 중",
    category: "main",
    isMain: false,
    status: "준비 중",
    isActive: false,
    desc: "온 가족 일정·사진·건강·추억을 한 앱에서",
    longDesc:
      "일정·사진·건강·추억·할 일까지 가족 구성원 모두가 실시간으로 공유하는 가족 전용 플랫폼이에요.",
    tags: ["가족 공유", "추억 기록", "AI 요약"],
    launchHref: "/family",
    launchLabel: "집안일로 열기",
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
