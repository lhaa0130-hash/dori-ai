// AI 정보 사이트 큐레이션 — 뉴스·커뮤니티·뉴스레터·리더보드·연구
// /ai-news 페이지에서 사용. 링크 디렉토리(외부 이동). 평점/댓글 없음.

export interface AiSource {
  name: string;
  url: string;
  desc: string;
  badge?: "KR" | "HOT" | "NEW"; // 선택 배지
}

export interface AiSourceCategory {
  key: string;
  label: string;
  emoji: string;
  desc: string;
  sites: AiSource[];
}

// 도메인 기반 파비콘 (구글 s2). 실패 시 onError로 이니셜 대체.
export function faviconOf(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return "";
  }
}

export const AI_NEWS_CATEGORIES: AiSourceCategory[] = [
  {
    key: "kr",
    label: "한국 AI 소식",
    emoji: "🇰🇷",
    desc: "국내 개발자·실무자가 가장 많이 보는 한글 AI 소식",
    sites: [
      { name: "GeekNews", url: "https://news.hada.io/", desc: "국내 개발자 필독 기술 뉴스 모음. AI·스타트업 토픽 활발", badge: "KR" },
      { name: "AI타임스", url: "https://www.aitimes.com/", desc: "국내 대표 AI 전문 미디어. 산업·정책·연구 뉴스", badge: "KR" },
      { name: "요즘IT", url: "https://yozm.wishket.com/magazine/", desc: "실무자 시선의 IT·AI 아티클 매거진", badge: "KR" },
      { name: "AI 포스트", url: "https://www.aipostkorea.com/", desc: "생성형 AI·서비스 동향 한글 뉴스", badge: "KR" },
    ],
  },
  {
    key: "news",
    label: "글로벌 뉴스·미디어",
    emoji: "📰",
    desc: "전 세계 AI 산업·제품 동향을 빠르게 전하는 매체",
    sites: [
      { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/", desc: "스타트업·제품 출시·투자 속보" },
      { name: "The Verge AI", url: "https://www.theverge.com/ai-artificial-intelligence", desc: "소비자 친화적 AI 뉴스·리뷰" },
      { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/", desc: "엔터프라이즈 AI·인프라 중심" },
      { name: "MIT Tech Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/", desc: "깊이 있는 AI 분석·전망" },
    ],
  },
  {
    key: "community",
    label: "커뮤니티",
    emoji: "💬",
    desc: "실사용자 토론·실험·트러블슈팅이 모이는 곳",
    sites: [
      { name: "Hacker News", url: "https://news.ycombinator.com/", desc: "기술·창업 토론의 본진. AI 글 상위 노출 활발", badge: "HOT" },
      { name: "r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/", desc: "로컬 LLM·오픈모델 실전 커뮤니티", badge: "HOT" },
      { name: "r/MachineLearning", url: "https://www.reddit.com/r/MachineLearning/", desc: "연구·논문 토론 서브레딧" },
      { name: "r/artificial", url: "https://www.reddit.com/r/artificial/", desc: "일반 AI 뉴스·토론" },
    ],
  },
  {
    key: "newsletter",
    label: "뉴스레터",
    emoji: "✉️",
    desc: "매일·매주 핵심만 요약해 받아보는 AI 다이제스트",
    sites: [
      { name: "TLDR AI", url: "https://tldr.tech/ai", desc: "매일 5분 AI 핵심 요약. 가입자 다수", badge: "HOT" },
      { name: "Ben's Bites", url: "https://www.bensbites.com/", desc: "친근한 톤의 데일리 AI 뉴스레터" },
      { name: "The Rundown AI", url: "https://www.therundown.ai/", desc: "도구·활용 팁 중심 데일리" },
      { name: "Import AI", url: "https://importai.net/", desc: "Jack Clark의 주간 심층 분석" },
    ],
  },
  {
    key: "leaderboard",
    label: "리더보드·도구 발견",
    emoji: "🏆",
    desc: "모델 순위·벤치마크·신규 도구를 발견하는 허브",
    sites: [
      { name: "LMArena", url: "https://lmarena.ai/", desc: "사람 투표 기반 LLM 랭킹(구 Chatbot Arena)", badge: "HOT" },
      { name: "Hugging Face", url: "https://huggingface.co/", desc: "오픈 모델·데이터셋·스페이스 총본산" },
      { name: "OpenRouter Rankings", url: "https://openrouter.ai/rankings", desc: "실사용량 기반 모델·앱 순위" },
      { name: "There's An AI For That", url: "https://theresanaiforthat.com/", desc: "용도별 AI 도구 대형 디렉토리" },
      { name: "Product Hunt", url: "https://www.producthunt.com/topics/artificial-intelligence", desc: "신규 AI 제품 런칭·트렌드" },
    ],
  },
  {
    key: "research",
    label: "연구·공식 블로그",
    emoji: "🔬",
    desc: "원천 연구와 주요 랩의 1차 발표를 직접 확인",
    sites: [
      { name: "arXiv (cs.AI)", url: "https://arxiv.org/list/cs.AI/recent", desc: "AI 논문 최신 프리프린트" },
      { name: "Papers with Code", url: "https://paperswithcode.com/", desc: "논문+구현 코드+벤치마크 연결" },
      { name: "OpenAI News", url: "https://openai.com/news/", desc: "OpenAI 공식 발표·연구" },
      { name: "Anthropic News", url: "https://www.anthropic.com/news", desc: "Anthropic(Claude) 공식 발표·연구" },
      { name: "Google DeepMind", url: "https://deepmind.google/discover/blog/", desc: "DeepMind 연구 블로그" },
    ],
  },
];
