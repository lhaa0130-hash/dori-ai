// AI 정보 사이트 큐레이션 — 뉴스·커뮤니티·뉴스레터·유튜브·리더보드·도구·연구·학습
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
    key: "kr-news",
    label: "한국 AI 소식",
    emoji: "🇰🇷",
    desc: "국내 개발자·실무자가 가장 많이 보는 한글 AI 소식",
    sites: [
      { name: "GeekNews", url: "https://news.hada.io/", desc: "국내 개발자 필독 기술 뉴스 모음. AI·스타트업 토픽 활발", badge: "KR" },
      { name: "AI타임스", url: "https://www.aitimes.com/", desc: "국내 대표 AI 전문 미디어. 산업·정책·연구 뉴스", badge: "KR" },
      { name: "인공지능신문", url: "https://www.aitimes.kr/", desc: "AI 산업·서비스 동향 한글 뉴스", badge: "KR" },
      { name: "요즘IT", url: "https://yozm.wishket.com/magazine/", desc: "실무자 시선의 IT·AI 아티클 매거진", badge: "KR" },
      { name: "바이라인네트워크", url: "https://byline.network/", desc: "기술·스타트업 심층 보도", badge: "KR" },
      { name: "더밀크", url: "https://www.themiilk.com/", desc: "실리콘밸리발 AI·테크 분석", badge: "KR" },
      { name: "ZDNet Korea", url: "https://zdnet.co.kr/news/?lstcode=0050", desc: "IT·AI 산업 뉴스", badge: "KR" },
      { name: "AI 포스트", url: "https://www.aipostkorea.com/", desc: "생성형 AI·서비스 동향 한글 뉴스", badge: "KR" },
    ],
  },
  {
    key: "kr-community",
    label: "한국 커뮤니티·블로그",
    emoji: "🧑‍💻",
    desc: "국내 개발자·메이커가 모여 정보를 나누는 곳",
    sites: [
      { name: "GPTers", url: "https://www.gpters.org/", desc: "생성형 AI 활용 국내 최대 커뮤니티", badge: "KR" },
      { name: "디스콰이엇", url: "https://disquiet.io/", desc: "메이커·스타트업 제품 커뮤니티", badge: "KR" },
      { name: "OKKY", url: "https://okky.kr/", desc: "개발자 Q&A·커뮤니티", badge: "KR" },
      { name: "velog", url: "https://velog.io/tags/AI", desc: "국내 개발자 기술 블로그(AI 태그)", badge: "KR" },
      { name: "모두의연구소", url: "https://modulabs.co.kr/", desc: "AI 연구·교육 커뮤니티", badge: "KR" },
    ],
  },
  {
    key: "news",
    label: "글로벌 뉴스·미디어",
    emoji: "📰",
    desc: "전 세계 AI 산업·제품 동향을 빠르게 전하는 매체",
    sites: [
      { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/", desc: "스타트업·제품 출시·투자 속보", badge: "HOT" },
      { name: "The Verge AI", url: "https://www.theverge.com/ai-artificial-intelligence", desc: "소비자 친화적 AI 뉴스·리뷰" },
      { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/", desc: "엔터프라이즈 AI·인프라 중심" },
      { name: "MIT Tech Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/", desc: "깊이 있는 AI 분석·전망" },
      { name: "The Decoder", url: "https://the-decoder.com/", desc: "AI 전문 데일리 뉴스" },
      { name: "Ars Technica AI", url: "https://arstechnica.com/ai/", desc: "기술 깊이가 있는 AI 보도" },
      { name: "WIRED AI", url: "https://www.wired.com/tag/artificial-intelligence/", desc: "문화·사회 관점의 AI 기사" },
      { name: "The Information", url: "https://www.theinformation.com/", desc: "테크 산업 고급 인사이더 보도(유료)" },
      { name: "Semafor Tech", url: "https://www.semafor.com/vertical/technology", desc: "테크·AI 분석 뉴스레터형 매체" },
    ],
  },
  {
    key: "community",
    label: "글로벌 커뮤니티",
    emoji: "💬",
    desc: "실사용자 토론·실험·트러블슈팅이 모이는 곳",
    sites: [
      { name: "Hacker News", url: "https://news.ycombinator.com/", desc: "기술·창업 토론의 본진. AI 글 상위 노출 활발", badge: "HOT" },
      { name: "r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/", desc: "로컬 LLM·오픈모델 실전 커뮤니티", badge: "HOT" },
      { name: "r/MachineLearning", url: "https://www.reddit.com/r/MachineLearning/", desc: "연구·논문 토론 서브레딧" },
      { name: "r/OpenAI", url: "https://www.reddit.com/r/OpenAI/", desc: "ChatGPT·OpenAI 토론" },
      { name: "r/ChatGPT", url: "https://www.reddit.com/r/ChatGPT/", desc: "ChatGPT 활용·밈·토론 대형 서브" },
      { name: "r/StableDiffusion", url: "https://www.reddit.com/r/StableDiffusion/", desc: "이미지 생성 모델 실전" },
      { name: "r/singularity", url: "https://www.reddit.com/r/singularity/", desc: "AGI·미래 기술 토론" },
      { name: "Lobsters", url: "https://lobste.rs/", desc: "기술 중심 큐레이션 커뮤니티" },
    ],
  },
  {
    key: "newsletter",
    label: "뉴스레터",
    emoji: "✉️",
    desc: "매일·매주 핵심만 요약해 받아보는 AI 다이제스트",
    sites: [
      { name: "TLDR AI", url: "https://tldr.tech/ai", desc: "매일 5분 AI 핵심 요약. 가입자 다수", badge: "HOT" },
      { name: "The Batch", url: "https://www.deeplearning.ai/the-batch/", desc: "Andrew Ng의 주간 AI 다이제스트" },
      { name: "Ben's Bites", url: "https://www.bensbites.com/", desc: "친근한 톤의 데일리 AI 뉴스레터" },
      { name: "The Rundown AI", url: "https://www.therundown.ai/", desc: "도구·활용 팁 중심 데일리" },
      { name: "The Neuron", url: "https://www.theneurondaily.com/", desc: "쉽게 읽히는 데일리 AI" },
      { name: "Import AI", url: "https://importai.net/", desc: "Jack Clark의 주간 심층 분석" },
      { name: "Last Week in AI", url: "https://lastweekin.ai/", desc: "주간 연구·산업 정리" },
      { name: "One Useful Thing", url: "https://www.oneusefulthing.org/", desc: "Ethan Mollick의 실용 AI 에세이" },
    ],
  },
  {
    key: "youtube",
    label: "유튜브·팟캐스트",
    emoji: "🎬",
    desc: "영상·오디오로 따라가는 AI 트렌드와 해설",
    sites: [
      { name: "Two Minute Papers", url: "https://www.youtube.com/@TwoMinutePapers", desc: "최신 논문을 2분 영상으로", badge: "HOT" },
      { name: "AI Explained", url: "https://www.youtube.com/@aiexplained-official", desc: "균형 잡힌 심층 AI 해설" },
      { name: "Lex Fridman Podcast", url: "https://lexfridman.com/podcast/", desc: "AI 거장 인터뷰 롱폼" },
      { name: "Yannic Kilcher", url: "https://www.youtube.com/@YannicKilcher", desc: "논문 리뷰·딥다이브" },
      { name: "Matthew Berman", url: "https://www.youtube.com/@matthew_berman", desc: "신규 모델·도구 실습 리뷰" },
      { name: "Latent Space", url: "https://www.latent.space/", desc: "AI 엔지니어 대상 팟캐스트·뉴스레터" },
      { name: "TWIML AI Podcast", url: "https://twimlai.com/", desc: "머신러닝 실무·연구 인터뷰" },
    ],
  },
  {
    key: "leaderboard",
    label: "리더보드·벤치마크",
    emoji: "🏆",
    desc: "모델 성능·순위를 객관 지표로 비교",
    sites: [
      { name: "LMArena", url: "https://lmarena.ai/", desc: "사람 투표 기반 LLM 랭킹(구 Chatbot Arena)", badge: "HOT" },
      { name: "Artificial Analysis", url: "https://artificialanalysis.ai/", desc: "지능·속도·가격 종합 비교", badge: "HOT" },
      { name: "Open LLM Leaderboard", url: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard", desc: "오픈 모델 벤치마크 순위" },
      { name: "OpenRouter Rankings", url: "https://openrouter.ai/rankings", desc: "실사용량 기반 모델·앱 순위" },
      { name: "LiveBench", url: "https://livebench.ai/", desc: "오염 방지 설계의 LLM 벤치마크" },
      { name: "Aider Leaderboard", url: "https://aider.chat/docs/leaderboards/", desc: "코딩 성능 리더보드" },
      { name: "SWE-bench", url: "https://www.swebench.com/", desc: "실제 GitHub 이슈 해결 벤치마크" },
      { name: "Vellum Leaderboard", url: "https://www.vellum.ai/llm-leaderboard", desc: "모델 스펙·가격 한눈 비교" },
    ],
  },
  {
    key: "tools",
    label: "도구 발견·디렉토리",
    emoji: "🧰",
    desc: "새 AI 도구·모델을 찾고 바로 써보는 허브",
    sites: [
      { name: "There's An AI For That", url: "https://theresanaiforthat.com/", desc: "용도별 AI 도구 대형 디렉토리", badge: "HOT" },
      { name: "Product Hunt AI", url: "https://www.producthunt.com/topics/artificial-intelligence", desc: "신규 AI 제품 런칭·트렌드" },
      { name: "Future Tools", url: "https://www.futuretools.io/", desc: "매트 울프가 큐레이션한 도구 모음" },
      { name: "Futurepedia", url: "https://www.futurepedia.io/", desc: "대규모 AI 도구 디렉토리" },
      { name: "Toolify", url: "https://www.toolify.ai/", desc: "트래픽 순위까지 보는 도구 디렉토리" },
      { name: "Hugging Face", url: "https://huggingface.co/", desc: "오픈 모델·데이터셋·스페이스 총본산" },
      { name: "Replicate", url: "https://replicate.com/explore", desc: "모델을 API로 바로 실행" },
      { name: "Civitai", url: "https://civitai.com/", desc: "이미지 생성 모델·LoRA 공유" },
    ],
  },
  {
    key: "research",
    label: "연구·논문",
    emoji: "🔬",
    desc: "원천 연구와 최신 논문을 직접 추적",
    sites: [
      { name: "arXiv (cs.AI)", url: "https://arxiv.org/list/cs.AI/recent", desc: "AI 논문 최신 프리프린트" },
      { name: "HF Papers", url: "https://huggingface.co/papers", desc: "화제의 논문 일일 큐레이션", badge: "HOT" },
      { name: "Papers with Code", url: "https://paperswithcode.com/", desc: "논문+구현 코드+벤치마크 연결" },
      { name: "alphaXiv", url: "https://www.alphaxiv.org/", desc: "arXiv 논문 토론·해설" },
      { name: "Semantic Scholar", url: "https://www.semanticscholar.org/", desc: "AI 기반 논문 검색" },
      { name: "Connected Papers", url: "https://www.connectedpapers.com/", desc: "논문 인용 관계 시각화" },
      { name: "Google Scholar", url: "https://scholar.google.com/", desc: "학술 논문 통합 검색" },
    ],
  },
  {
    key: "labs",
    label: "공식 랩·기업 블로그",
    emoji: "🏛️",
    desc: "주요 AI 랩의 1차 발표를 직접 확인",
    sites: [
      { name: "OpenAI News", url: "https://openai.com/news/", desc: "OpenAI 공식 발표·연구" },
      { name: "Anthropic News", url: "https://www.anthropic.com/news", desc: "Anthropic(Claude) 공식 발표·연구" },
      { name: "Google DeepMind", url: "https://deepmind.google/discover/blog/", desc: "DeepMind 연구 블로그" },
      { name: "Google Research", url: "https://research.google/blog/", desc: "구글 연구 블로그" },
      { name: "Meta AI", url: "https://ai.meta.com/blog/", desc: "Llama 등 메타 AI 발표" },
      { name: "Microsoft Research", url: "https://www.microsoft.com/en-us/research/blog/", desc: "MS 연구 블로그" },
      { name: "Mistral AI", url: "https://mistral.ai/news/", desc: "Mistral 모델 발표" },
      { name: "Hugging Face Blog", url: "https://huggingface.co/blog", desc: "오픈소스 AI 실전 글" },
      { name: "NVIDIA Blog", url: "https://blogs.nvidia.com/", desc: "GPU·AI 인프라 소식" },
      { name: "xAI", url: "https://x.ai/news", desc: "Grok 등 xAI 발표" },
    ],
  },
  {
    key: "learn",
    label: "학습·튜토리얼",
    emoji: "📚",
    desc: "기초부터 실전까지, AI를 배우는 자료",
    sites: [
      { name: "DeepLearning.AI", url: "https://www.deeplearning.ai/", desc: "Andrew Ng의 AI 강의 허브", badge: "HOT" },
      { name: "fast.ai", url: "https://www.fast.ai/", desc: "실전 중심 무료 딥러닝 코스" },
      { name: "Hugging Face Learn", url: "https://huggingface.co/learn", desc: "NLP·LLM·에이전트 무료 코스" },
      { name: "Kaggle", url: "https://www.kaggle.com/learn", desc: "데이터·ML 실습과 대회" },
      { name: "ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course", desc: "구글의 머신러닝 입문" },
      { name: "Prompt Engineering Guide", url: "https://www.promptingguide.ai/", desc: "프롬프트 기법 종합 가이드" },
      { name: "Learn Prompting", url: "https://learnprompting.org/", desc: "프롬프트 무료 학습 사이트" },
    ],
  },
];
