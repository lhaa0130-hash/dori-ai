// 프로젝트(개발 중 프로그램) 공유 데이터 — 목록/상세 페이지 공용
export type ProjectStatus = "지금 무료" | "이용 가능" | "준비 중" | "기획 중";

export interface ProjectFeature {
  icon: string;
  title: string;
  detail: string;
}

export type ProjectCategory = "main" | "kids";

export interface ProjectItem {
  slug: string;
  name: string;        // 새 이름 — 뭔 프로젝트인지 바로 알 수 있도록
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
    slug: "illo",
    name: "AI 업무비서",
    emoji: "🟧",
    image: "/illo-logo.png",
    tag: "정식 서비스",
    category: "main",
    isMain: true,
    status: "지금 무료",
    isActive: true,
    desc: "수많은 AI를 한 공간에서 — 1인 사업용 AI 사무실",
    longDesc:
      "하고 싶은 일을 고르면 그 작업에 딱 맞는 AI가 이미 연결돼 있어요. 글쓰기·마케팅·고객응대·요약·번역까지 — 복잡한 설정 없이 누구나 손쉽게 원하는 업무를 처리할 수 있는 AI 사무실입니다. 도구마다 따로 가입하고 프롬프트를 고민할 필요 없이 '일'만 고르면 됩니다.",
    tags: ["1인 사업", "AI 자동화", "지금 무료"],
    launchHref: "/illo/app",
    launchLabel: "지금 무료로 시작",
    features: [
      { icon: "🎯", title: "할 일만 고르면 끝", detail: "글쓰기·마케팅·고객응대 등 하고 싶은 업무를 클릭하면 최적의 AI가 자동 연결돼요." },
      { icon: "🔑", title: "내 API 키로 무제한", detail: "내 키를 연결하면 최신 최강 모델로 한도 없이 사용할 수 있어요." },
      { icon: "🛠️", title: "나만의 워크플로우", detail: "입력→조사→작성→검토 단계를 노드로 이어 나만의 자동화를 설계해요." },
      { icon: "📁", title: "결과 보관함", detail: "만든 결과물을 자동 저장, 언제든 다시 보거나 텍스트로 내려받아요." },
    ],
  },
  {
    slug: "trader",
    name: "AI 자동매매",
    emoji: "📈",
    image: "",
    tag: "정식 서비스",
    category: "main",
    isMain: true,
    status: "이용 가능",
    isActive: true,
    desc: "코인·주식을 AI가 알아서 사고파는 자동 투자 프로그램",
    longDesc:
      "코인·국내주식·해외주식을 추세추종 전략과 엄격한 리스크 관리로 자동 매매해요. 손절·트레일링·분산·시장국면 필터로 손실을 통제하면서 상승 추세에 올라타고, 모든 거래 내역(매수·매도 시간·사유·수익률)을 매일 투명하게 공개합니다. ⚠️ 투자에 완벽은 없으며 손실 위험이 있습니다.",
    tags: ["자동매매", "리스크 관리", "거래 투명 공개"],
    launchHref: "/trader",
    launchLabel: "성과 보기",
    launchDate: "2026-07-01",
    features: [
      { icon: "🛡️", title: "손실 최소 우선", detail: "손절·트레일링·일일 손실한도·분산을 동시 적용해 손실을 작게 끊어요." },
      { icon: "📈", title: "추세 올라타기", detail: "상승 추세에서 신고가를 돌파할 때만 진입해 큰 흐름을 노려요." },
      { icon: "🌍", title: "코인·국내·해외 분산", detail: "비트코인부터 미국·일본 지수까지 나눠 담아 위험을 분산해요." },
      { icon: "📊", title: "매일 투명 공개", detail: "매수·매도 시간과 사유, 수익률을 매일 자동으로 공개해요." },
    ],
  },
  {
    slug: "flat-form",
    name: "AI 건축설계",
    emoji: "📐",
    image: "",
    tag: "정식 서비스",
    category: "main",
    isMain: true,
    status: "이용 가능",
    isActive: true,
    desc: "지번 입력만 하면 지적도·건폐율·용적률까지 자동으로",
    longDesc:
      "주소를 입력하면 VWorld 지적도가 자동 로드되고, 건폐율·용적률을 계산해 건축한계선이 표시돼요. 실 편집으로 간단한 평면도를 직접 그리고 저장할 수 있는 건축 보조 도구입니다. 건축사·인테리어 디자이너·부동산 관심자 모두에게 유용해요.",
    tags: ["건축설계", "지적도 조회", "평면도 편집"],
    launchHref: "/flat-form",
    launchLabel: "설계 시작하기",
    features: [
      { icon: "🗺️", title: "지적도 자동 로드", detail: "주소를 입력하면 VWorld 지적도가 자동으로 불러와져요." },
      { icon: "📏", title: "건축한계선 자동 계산", detail: "건폐율·용적률·이격거리를 자동 계산해 한계선을 그려줘요." },
      { icon: "✏️", title: "실 편집·저장", detail: "실(Room)을 직접 배치하고 로컬에 저장해요." },
      { icon: "🔄", title: "필지 회전 정렬", detail: "두 점을 찍으면 필지를 수평으로 자동 회전해요." },
    ],
  },
  {
    slug: "animal",
    name: "AI 동물도감",
    emoji: "🐾",
    image: "",
    tag: "키즈 서비스",
    category: "kids",
    isMain: false,
    status: "이용 가능",
    isActive: true,
    desc: "300종 동물을 도감처럼 탐험하는 어린이 교육 앱",
    longDesc:
      "요즘 아이들이 접하는 동물의 수는 점점 줄고 있어요. AI 동물도감은 아이들이 300종+ 동물을 도감처럼 친숙하게 탐험하고, 색깔·먹이·크기·사는 곳 같은 특징으로 원하는 동물을 쉽게 찾을 수 있도록 만든 교육 프로젝트예요. 매일 5종씩 새 동물이 추가됩니다.",
    tags: ["어린이 교육", "동물 생태", "매일 업데이트"],
    launchHref: "/animal",
    launchLabel: "동물 탐험하기",
    features: [
      { icon: "🔎", title: "특징으로 찾기", detail: "곤충을 먹는 동물, 흰색 동물, 손바닥만한 동물처럼 특징을 골라 찾아요." },
      { icon: "🃏", title: "도감 수집의 재미", detail: "도감을 하나씩 채워가며 300종 동물을 친숙하게 익혀요." },
      { icon: "📚", title: "아이 눈높이 설명", detail: "먹이·서식지·크기 등 핵심 정보를 쉽고 재미있게 풀어줘요." },
      { icon: "🔄", title: "매일 5종 추가", detail: "n8n 자동화로 매일 새 동물이 추가돼요." },
    ],
  },
  {
    slug: "family",
    name: "AI 가족앱",
    emoji: "👨‍👩‍👧‍👦",
    image: "",
    tag: "준비 중",
    category: "main",
    isMain: false,
    status: "기획 중",
    isActive: false,
    desc: "온 가족 일정·사진·건강·추억을 한 앱에서",
    longDesc:
      "일정·사진·건강·추억·할 일까지 가족 구성원 모두가 실시간으로 공유하는 가족 전용 플랫폼이에요. 카카오에 흩어진 사진, 각자의 캘린더, 메모장의 건강 기록을 한곳에 모아 온 가족이 함께 볼 수 있게 만들어드려요.",
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
