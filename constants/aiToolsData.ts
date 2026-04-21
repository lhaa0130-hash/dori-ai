import { AiTool } from "@/types/content";

/**
 * AI Tools 데이터 목록 (100+ items)
 * Updated: 2026-02-04
 */
export const AI_TOOLS_DATA: AiTool[] = [
  // ===========================================
  // 0. AI AGENTS (최상단)
  // ===========================================
  {
    id: "agent-cursor", name: "Cursor", category: "agent",
    summary: "AI가 코드를 직접 작성하는 개발자용 에디터",
    description: "AI가 코드를 직접 작성하는 개발자용 에디터",
    website: "https://cursor.sh",
    thumbnail: "https://logo.clearbit.com/cursor.sh",
    strength: "자율 코딩, 컨텍스트 이해 최강",
    rating: 0, ratingCount: 0, userRatings: [], comments: [],
    pros: ["파일 전체를 이해하고 코드 작성", "자연어 명령으로 리팩토링", "무료 플랜 제공"],
    cons: ["고급 기능은 유료 ($20/월)", "대형 프로젝트에서 느릴 수 있음"],
    userReview: "한 번 쓰면 못 돌아가요. 코딩 속도가 3배는 빨라집니다.",
    topPick: true, topRank: 3
  },
  {
    id: "agent-devin", name: "Devin", category: "agent",
    summary: "세계 최초 완전 자율 AI 소프트웨어 엔지니어",
    description: "세계 최초 완전 자율 AI 소프트웨어 엔지니어",
    website: "https://devin.ai",
    thumbnail: "https://logo.clearbit.com/devin.ai",
    strength: "엔드투엔드 개발, 버그 수정, 배포까지 자율 처리",
    rating: 0, ratingCount: 0, userRatings: [], comments: [],
    pros: ["전체 개발 프로세스 자동화", "GitHub 이슈 자동 해결", "24시간 개발 가능"],
    cons: ["월 $500 이상 고가", "복잡한 비즈니스 로직은 아직 한계"],
    userReview: "PR 올리고 자고 일어나면 머지 준비 완료. 미래에서 온 것 같음.",
    topPick: false
  },
  {
    id: "agent-manus", name: "Manus", category: "agent",
    summary: "웹 서핑, 파일 작업, 코딩을 혼자 다 해주는 범용 AI 에이전트",
    description: "웹 서핑, 파일 작업, 코딩을 혼자 다 해주는 범용 AI 에이전트",
    website: "https://manus.im",
    thumbnail: "https://logo.clearbit.com/manus.im",
    strength: "브라우저 조작, 파일 처리, 코드 실행 멀티태스킹",
    rating: 0, ratingCount: 0, userRatings: [], comments: [],
    pros: ["완전 자율 멀티태스킹", "실제 컴퓨터처럼 작업 수행", "복잡한 리서치 자동화"],
    cons: ["현재 대기자 초대 방식", "긴 작업은 비용 증가"],
    userReview: "리서치 보고서 작성 시켰더니 출처까지 찾아서 완성해줬어요.",
    topPick: true, topRank: 2
  },
  {
    id: "agent-n8n", name: "n8n", category: "agent",
    summary: "노코드로 ChatGPT·슬랙·노션 연결. 자동화 입문자에게 추천",
    description: "노코드로 ChatGPT·슬랙·노션 연결. 자동화 입문자에게 추천",
    website: "https://n8n.io",
    thumbnail: "https://logo.clearbit.com/n8n.io",
    userReview: "ChatGPT + 슬랙 + 노션 연동을 30분 만에 완성했어요.",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "agent-langchain", name: "LangChain", category: "agent",
    summary: "AI 에이전트 개발 시 필수 라이브러리. 1억 다운로드 돌파",
    description: "AI 에이전트 개발 시 필수 라이브러리. 1억 다운로드 돌파",
    website: "https://langchain.com",
    thumbnail: "https://logo.clearbit.com/langchain.com",
    userReview: "RAG 파이프라인 구축할 때 없으면 안 되는 존재.",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "agent-autogpt", name: "AutoGPT", category: "agent",
    summary: "목표 주면 스스로 검색·코딩·실행. 아직 발전 중이지만 잠재력 큼",
    description: "목표 주면 스스로 검색·코딩·실행. 아직 발전 중이지만 잠재력 큼",
    website: "https://agpt.co",
    thumbnail: "https://logo.clearbit.com/agpt.co",
    userReview: "완전 자율은 아직 멀었지만, 반복 작업 자동화엔 충분해요.",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "agent-perplexity-agent", name: "Perplexity Agent", category: "agent",
    summary: "실시간 웹 정보 + 딥리서치 자동화. 조사 업무 시간 80% 절감",
    description: "실시간 웹 정보 + 딥리서치 자동화. 조사 업무 시간 80% 절감",
    website: "https://perplexity.ai",
    thumbnail: "https://logo.clearbit.com/perplexity.ai",
    userReview: "경쟁사 분석이나 시장 조사할 때 ChatGPT보다 훨씬 유용해요.",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "agent-claude-code", name: "Claude Code", category: "agent",
    summary: "터미널에서 동작하는 Anthropic의 코딩 에이전트",
    description: "터미널에서 동작하는 Anthropic의 코딩 에이전트",
    website: "https://claude.ai",
    thumbnail: "https://logo.clearbit.com/claude.ai",
    userReview: "복잡한 리팩토링도 컨텍스트를 잘 유지해서 믿고 맡길 수 있어요.",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "agent-genspark", name: "Genspark", category: "agent",
    summary: "검색·리서치·슬라이드·영상까지 한 번에 처리하는 올인원 AI 에이전트",
    description: "검색·리서치·슬라이드·영상까지 한 번에 처리하는 올인원 AI 에이전트",
    website: "https://genspark.ai",
    thumbnail: "https://logo.clearbit.com/genspark.ai",
    userReview: "리서치부터 PPT 완성까지 한 번의 프롬프트로 끝납니다. 업무 시간이 반으로 줄었어요.",
    topPick: true, topRank: 1,
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "agent-openai-operator", name: "OpenAI Operator", category: "agent",
    summary: "웹 브라우저를 직접 조작해 예약·쇼핑·양식 작성을 자동으로 처리",
    description: "웹 브라우저를 직접 조작해 예약·쇼핑·양식 작성을 자동으로 처리",
    website: "https://openai.com",
    thumbnail: "https://logo.clearbit.com/openai.com",
    userReview: "항공권 예약을 그냥 시켜봤는데 진짜 다 해줬어요. 소름 돋음.",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "agent-zapier-ai", name: "Zapier AI", category: "agent",
    summary: "7,000개 앱 연동 + AI로 자동화 로직을 자연어로 생성",
    description: "7,000개 앱 연동 + AI로 자동화 로직을 자연어로 생성",
    website: "https://zapier.com",
    thumbnail: "https://logo.clearbit.com/zapier.com",
    userReview: "코딩 몰라도 Gmail→Slack→Notion 자동화를 5분 만에 만들었어요.",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 1. LLM
  // ===========================================
  {
    id: "llm-chatgpt", name: "ChatGPT", category: "llm",
    summary: "뭘 물어봐도 잘 답해줌. AI 처음 쓴다면 무조건 여기서 시작",
    description: "뭘 물어봐도 잘 답해줌. AI 처음 쓴다면 무조건 여기서 시작",
    website: "https://chatgpt.com",
    thumbnail: "https://logo.clearbit.com/chatgpt.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-claude", name: "Claude", category: "llm",
    summary: "긴 글 맥락을 귀신같이 잡아냄. 보고서 쓸 때 진짜 갑임",
    description: "긴 글 맥락을 귀신같이 잡아냄. 보고서 쓸 때 진짜 갑임",
    website: "https://claude.ai",
    thumbnail: "https://logo.clearbit.com/claude.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-gemini", name: "Gemini", category: "llm",
    summary: "구글 드라이브 문서 바로 요약. 구글 생태계 쓰는 분께 추천",
    description: "구글 드라이브 문서 바로 요약. 구글 생태계 쓰는 분께 추천",
    website: "https://gemini.google.com",
    thumbnail: "https://logo.clearbit.com/google.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-perplexity", name: "Perplexity", category: "llm",
    summary: "구글 대신 쓰기 딱 좋음. 출처 링크가 함께 나와서 믿음직함",
    description: "구글 대신 쓰기 딱 좋음. 출처 링크가 함께 나와서 믿음직함",
    website: "https://perplexity.ai",
    thumbnail: "https://logo.clearbit.com/perplexity.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-copilot", name: "Microsoft Copilot", category: "llm",
    summary: "Word·Excel에 AI가 붙어서 편집이 진짜 편해짐",
    description: "Word·Excel에 AI가 붙어서 편집이 진짜 편해짐",
    website: "https://copilot.microsoft.com",
    thumbnail: "https://logo.clearbit.com/microsoft.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-grok", name: "Grok", category: "llm",
    summary: "X(트위터) 실시간 정보 반영. 검열 없이 직설적으로 답해줌",
    description: "X(트위터) 실시간 정보 반영. 검열 없이 직설적으로 답해줌",
    website: "https://x.ai",
    thumbnail: "https://logo.clearbit.com/x.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-llama", name: "Llama", category: "llm",
    summary: "로컬에서 돌리는 무료 AI. 개인 정보 유출 걱정 없이 쓸 수 있음",
    description: "로컬에서 돌리는 무료 AI. 개인 정보 유출 걱정 없이 쓸 수 있음",
    website: "https://llama.meta.com",
    thumbnail: "https://logo.clearbit.com/meta.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-mistral", name: "Mistral", category: "llm",
    summary: "유럽산 오픈소스 AI. 빠르고 가벼워서 서버 비용 아끼기 좋음",
    description: "유럽산 오픈소스 AI. 빠르고 가벼워서 서버 비용 아끼기 좋음",
    website: "https://mistral.ai",
    thumbnail: "https://logo.clearbit.com/mistral.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-deepseek", name: "DeepSeek", category: "llm",
    summary: "GPT-4 수준인데 거의 무료. 개발자 커뮤니티에서 핫한 이유 있음",
    description: "GPT-4 수준인데 거의 무료. 개발자 커뮤니티에서 핫한 이유 있음",
    website: "https://deepseek.com",
    thumbnail: "https://logo.clearbit.com/deepseek.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-notebooklm", name: "NotebookLM", category: "llm",
    summary: "PDF 올리면 그 문서 기반으로만 답해줌. 내부 자료 분석에 최고",
    description: "PDF 올리면 그 문서 기반으로만 답해줌. 내부 자료 분석에 최고",
    website: "https://notebooklm.google.com",
    thumbnail: "https://logo.clearbit.com/google.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-gpt4o", name: "GPT-4o", category: "llm",
    summary: "이미지·음성·텍스트 동시 처리. 제일 빠른 GPT 모델",
    description: "이미지·음성·텍스트 동시 처리. 제일 빠른 GPT 모델",
    website: "https://openai.com", thumbnail: "https://logo.clearbit.com/openai.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-claude-3-5", name: "Claude 3.5 Sonnet", category: "llm",
    summary: "코딩 실력은 GPT-4o랑 쌍벽. 긴 대화도 맥락을 절대 안 잃어버림",
    description: "코딩 실력은 GPT-4o랑 쌍벽. 긴 대화도 맥락을 절대 안 잃어버림",
    website: "https://claude.ai", thumbnail: "https://logo.clearbit.com/anthropic.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-gemini-1-5", name: "Gemini 1.5 Pro", category: "llm",
    summary: "100만 토큰 컨텍스트. 책 한 권 통째로 분석 가능",
    description: "100만 토큰 컨텍스트. 책 한 권 통째로 분석 가능",
    website: "https://gemini.google.com", thumbnail: "https://logo.clearbit.com/google.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-cohere", name: "Cohere Command R+", category: "llm",
    summary: "기업 문서 검색 연동에 특화. B2B 서비스 만들 때 유용함",
    description: "기업 문서 검색 연동에 특화. B2B 서비스 만들 때 유용함",
    website: "https://cohere.com", thumbnail: "https://logo.clearbit.com/cohere.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-solar", name: "Solar (Upstage)", category: "llm",
    summary: "한국 스타트업 Upstage 작품. 작은 사이즈에 성능이 놀라움",
    description: "한국 스타트업 Upstage 작품. 작은 사이즈에 성능이 놀라움",
    website: "https://upstage.ai", thumbnail: "https://logo.clearbit.com/upstage.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-hyperclova", name: "HyperCLOVA X", category: "llm",
    summary: "한국어 맥락 이해는 최고. 국내 서비스 개발할 때 고려할 것",
    description: "한국어 맥락 이해는 최고. 국내 서비스 개발할 때 고려할 것",
    website: "https://clova.ai", thumbnail: "https://logo.clearbit.com/navercorp.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-qwen", name: "Qwen", category: "llm",
    summary: "알리바바 오픈소스 모델. GPT-4급 성능에 무료로 사용 가능",
    description: "알리바바 오픈소스 모델. GPT-4급 성능에 무료로 사용 가능",
    website: "https://github.com/QwenLM", thumbnail: "https://logo.clearbit.com/alibaba.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-yi", name: "Yi-34B", category: "llm",
    summary: "01.AI가 만든 가성비 좋은 오픈 모델",
    description: "01.AI가 만든 가성비 좋은 오픈 모델",
    website: "https://01.ai", thumbnail: "https://logo.clearbit.com/01.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-huggingchat", name: "HuggingChat", category: "llm",
    summary: "수십 개 오픈소스 모델을 한 곳에서. 모델 비교할 때 자주 들름",
    description: "수십 개 오픈소스 모델을 한 곳에서. 모델 비교할 때 자주 들름",
    website: "https://huggingface.co/chat", thumbnail: "https://logo.clearbit.com/huggingface.co", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-poe-plus", name: "Poe+", category: "llm",
    summary: "GPT·Claude·Gemini를 한 화면에서 비교. 모델마다 답변 스타일 차이가 재미있음",
    description: "GPT·Claude·Gemini를 한 화면에서 비교. 모델마다 답변 스타일 차이가 재미있음",
    website: "https://poe.com", thumbnail: "https://logo.clearbit.com/poe.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 2. Image Generation
  // ===========================================
  {
    id: "img-midjourney", name: "Midjourney", category: "image-generation",
    summary: "예술적 화질은 압도적 1위. 프로 디자이너들이 가장 많이 씀",
    description: "예술적 화질은 압도적 1위. 프로 디자이너들이 가장 많이 씀",
    website: "https://midjourney.com",
    thumbnail: "https://logo.clearbit.com/midjourney.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-stablediffusion", name: "Stable Diffusion", category: "image-generation",
    summary: "내 PC에 설치해서 무한 생성. 모델 교체로 화풍을 마음대로 바꿈",
    description: "내 PC에 설치해서 무한 생성. 모델 교체로 화풍을 마음대로 바꿈",
    website: "https://stability.ai",
    thumbnail: "https://logo.clearbit.com/stability.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-dalle3", name: "DALL-E 3", category: "image-generation",
    summary: "ChatGPT Plus 구독하면 바로 사용. 복잡한 설정 없이 즉시 시작",
    description: "ChatGPT Plus 구독하면 바로 사용. 복잡한 설정 없이 즉시 시작",
    website: "https://openai.com/dall-e-3",
    thumbnail: "https://logo.clearbit.com/openai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-flux", name: "Flux", category: "image-generation",
    summary: "미드저니 대비 저렴하고 빠름. 상업 프로젝트에도 무난히 사용 가능",
    description: "미드저니 대비 저렴하고 빠름. 상업 프로젝트에도 무난히 사용 가능",
    website: "https://blackforestlabs.ai",
    thumbnail: "https://logo.clearbit.com/blackforestlabs.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-ideogram", name: "Ideogram", category: "image-generation",
    summary: "이미지에 텍스트를 완벽하게 렌더링. 썸네일·로고 제작에 강추",
    description: "이미지에 텍스트를 완벽하게 렌더링. 썸네일·로고 제작에 강추",
    website: "https://ideogram.ai",
    thumbnail: "https://logo.clearbit.com/ideogram.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-leonardo", name: "Leonardo.ai", category: "image-generation",
    summary: "무료 크레딧이 후함. 웹에서 로그인 없이 바로 생성 가능",
    description: "무료 크레딧이 후함. 웹에서 로그인 없이 바로 생성 가능",
    website: "https://leonardo.ai",
    thumbnail: "https://logo.clearbit.com/leonardo.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-firefly", name: "Adobe Firefly", category: "image-generation",
    summary: "Adobe 정품 사용자라면 추가 비용 없이 사용. 저작권 안전",
    description: "Adobe 정품 사용자라면 추가 비용 없이 사용. 저작권 안전",
    website: "https://firefly.adobe.com",
    thumbnail: "https://logo.clearbit.com/adobe.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-krea", name: "Krea AI", category: "image-generation",
    summary: "낙서 수준 스케치를 실시간으로 고화질 변환. 아이디어 시각화 최고",
    description: "낙서 수준 스케치를 실시간으로 고화질 변환. 아이디어 시각화 최고",
    website: "https://krea.ai",
    thumbnail: "https://logo.clearbit.com/krea.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-civitai", name: "Civitai", category: "image-generation",
    summary: "수천 개 커스텀 모델을 무료로 다운. 원하는 화풍 뭐든 있음",
    description: "수천 개 커스텀 모델을 무료로 다운. 원하는 화풍 뭐든 있음",
    website: "https://civitai.com",
    thumbnail: "https://logo.clearbit.com/civitai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-runway", name: "Runway", category: "image-generation",
    summary: "이미지+영상 모두 가능. 크리에이티브 작업의 전천후 도구",
    description: "이미지+영상 모두 가능. 크리에이티브 작업의 전천후 도구",
    website: "https://runwayml.com", // Fixed shady link from user input
    thumbnail: "https://logo.clearbit.com/runwayml.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-playground", name: "Playground AI", category: "image-generation",
    summary: "하루 1,000장 무료. 품질도 미드저니급이라 가성비 최고",
    description: "하루 1,000장 무료. 품질도 미드저니급이라 가성비 최고",
    website: "https://playgroundai.com", thumbnail: "https://logo.clearbit.com/playgroundai.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-bluewillow", name: "BlueWillow", category: "image-generation",
    summary: "디스코드에서 무료로 사용. 미드저니 못지않은 퀄리티",
    description: "디스코드에서 무료로 사용. 미드저니 못지않은 퀄리티",
    website: "https://bluewillow.ai", thumbnail: "https://logo.clearbit.com/bluewillow.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-tensor", name: "Tensor.art", category: "image-generation",
    summary: "설치 없이 웹에서 SD 모델 실행. 빠른 프로토타이핑에 유용",
    description: "설치 없이 웹에서 SD 모델 실행. 빠른 프로토타이핑에 유용",
    website: "https://tensor.art", thumbnail: "https://logo.clearbit.com/tensor.art", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-dreamstudio", name: "DreamStudio", category: "image-generation",
    summary: "Stability AI 공식 서비스. 최신 SD 모델을 API로 바로 쓸 수 있음",
    description: "Stability AI 공식 서비스. 최신 SD 모델을 API로 바로 쓸 수 있음",
    website: "https://dreamstudio.ai", thumbnail: "https://logo.clearbit.com/stability.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-imagefx", name: "ImageFX", category: "image-generation",
    summary: "Google 생태계 안에서 이미지 생성. Gemini와 연동이 매끄러움",
    description: "Google 생태계 안에서 이미지 생성. Gemini와 연동이 매끄러움",
    website: "https://aitestkitchen.withgoogle.com/tools/image-fx", thumbnail: "https://logo.clearbit.com/google.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-bing", name: "Bing Image Creator", category: "image-generation",
    summary: "MS 계정만 있으면 무료. DALL-E 3 기반이라 품질도 좋음",
    description: "MS 계정만 있으면 무료. DALL-E 3 기반이라 품질도 좋음",
    website: "https://bing.com/create", thumbnail: "https://logo.clearbit.com/bing.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-picfinder", name: "PicFinder", category: "image-generation",
    summary: "클릭 한 번에 이미지 무한 생성. 빠른 아이디어 스케치에 딱임",
    description: "클릭 한 번에 이미지 무한 생성. 빠른 아이디어 스케치에 딱임",
    website: "https://picfinder.ai", thumbnail: "https://logo.clearbit.com/picfinder.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-stockimg", name: "Stockimg.ai", category: "image-generation",
    summary: "상업용 디자인 특화. 로고·포스터·책 표지를 분 단위로 완성",
    description: "상업용 디자인 특화. 로고·포스터·책 표지를 분 단위로 완성",
    website: "https://stockimg.ai", thumbnail: "https://logo.clearbit.com/stockimg.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-getimg", name: "Getimg.ai", category: "image-generation",
    summary: "생성+편집이 한 플랫폼에. 워크플로우를 따로 분리할 필요가 없음",
    description: "생성+편집이 한 플랫폼에. 워크플로우를 따로 분리할 필요가 없음",
    website: "https://getimg.ai", thumbnail: "https://logo.clearbit.com/getimg.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-seaart", name: "SeaArt", category: "image-generation",
    summary: "실사 사진 퀄리티가 압도적. 인물 이미지 생성에서 특히 강함",
    description: "실사 사진 퀄리티가 압도적. 인물 이미지 생성에서 특히 강함",
    website: "https://seaart.ai", thumbnail: "https://logo.clearbit.com/seaart.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 3. Image Editing
  // ===========================================
  {
    id: "edit-magnific", name: "Magnific AI", category: "image-editing",
    summary: "흐릿한 사진을 4K로 복원. 옛날 사진 되살릴 때 마법 같음",
    description: "흐릿한 사진을 4K로 복원. 옛날 사진 되살릴 때 마법 같음",
    website: "https://magnific.ai",
    thumbnail: "https://logo.clearbit.com/magnific.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-canva", name: "Canva", category: "image-editing",
    summary: "디자인의 기본. AI 배경 제거와 마법 지우개로 편집이 너무 쉬움",
    description: "디자인의 기본. AI 배경 제거와 마법 지우개로 편집이 너무 쉬움",
    website: "https://canva.com",
    thumbnail: "https://logo.clearbit.com/canva.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-photoroom", name: "Photoroom", category: "image-editing",
    summary: "쇼핑몰 상품 사진 배경 1초 제거. 사진작가 없이 혼자 운영 가능",
    description: "쇼핑몰 상품 사진 배경 1초 제거. 사진작가 없이 혼자 운영 가능",
    website: "https://photoroom.com",
    thumbnail: "https://logo.clearbit.com/photoroom.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-clipdrop", name: "Clipdrop", category: "image-editing",
    summary: "조명 추가, 배경 변경, 얼굴 수정까지. 사진 편집 올인원 도구",
    description: "조명 추가, 배경 변경, 얼굴 수정까지. 사진 편집 올인원 도구",
    website: "https://clipdrop.co",
    thumbnail: "https://logo.clearbit.com/clipdrop.co",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-topaz", name: "Topaz Photo AI", category: "image-editing",
    summary: "노이즈 제거 성능은 업계 1위. 사진작가들이 Lightroom 다음으로 씀",
    description: "노이즈 제거 성능은 업계 1위. 사진작가들이 Lightroom 다음으로 씀",
    website: "https://topazlabs.com",
    thumbnail: "https://logo.clearbit.com/topazlabs.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-cleanup", name: "Cleanup.pictures", category: "image-editing",
    summary: "사진에서 원하지 않는 사람이나 물건만 쏙 지움",
    description: "사진에서 원하지 않는 사람이나 물건만 쏙 지움",
    website: "https://cleanup.pictures",
    thumbnail: "https://logo.clearbit.com/cleanup.pictures",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-pixelcut", name: "Pixelcut", category: "image-editing",
    summary: "모바일 친화적인 AI 배경 제거 및 디자인 편집",
    description: "모바일 친화적인 AI 배경 제거 및 디자인 편집",
    website: "https://pixelcut.ai",
    thumbnail: "https://logo.clearbit.com/pixelcut.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-upscayl", name: "Upscayl", category: "image-editing",
    summary: "내 컴퓨터에 설치해 쓰는 무료 AI 화질 개선기",
    description: "내 컴퓨터에 설치해 쓰는 무료 AI 화질 개선기",
    website: "https://upscayl.org",
    thumbnail: "https://logo.clearbit.com/upscayl.org",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-removebg", name: "Remove.bg", category: "image-editing",
    summary: "배경 제거 분야의 근본, 빠르고 정확함",
    description: "배경 제거 분야의 근본, 빠르고 정확함",
    website: "https://remove.bg",
    thumbnail: "https://logo.clearbit.com/remove.bg",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-photoshop", name: "Photoshop (AI)", category: "image-editing",
    summary: "생성형 채우기 기능으로 없던 배경도 만들어냄",
    description: "생성형 채우기 기능으로 없던 배경도 만들어냄",
    website: "https://adobe.com",
    thumbnail: "https://logo.clearbit.com/adobe.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-magiceraser", name: "Magic Eraser", category: "image-editing",
    summary: "로그인도 필요 없는 초간단 지우개",
    description: "로그인도 필요 없는 초간단 지우개",
    website: "https://magicstudio.com/magiceraser", thumbnail: "https://logo.clearbit.com/magicstudio.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-hama", name: "Hama", category: "image-editing",
    summary: "드래그 한 번으로 깔끔하게 지워주는 무료 툴",
    description: "드래그 한 번으로 깔끔하게 지워주는 무료 툴",
    website: "https://hama.app", thumbnail: "https://logo.clearbit.com/hama.app", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-watermark", name: "WatermarkRemover", category: "image-editing",
    summary: "유료 이미지의 워터마크를 감쪽같이 삭제 (주의)",
    description: "유료 이미지의 워터마크를 감쪽같이 삭제 (주의)",
    website: "https://watermarkremover.io", thumbnail: "https://logo.clearbit.com/pixelbin.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-bigjpg", name: "BigJPG", category: "image-editing",
    summary: "애니메이션 그림 확대에 특화된 업스케일러",
    description: "애니메이션 그림 확대에 특화된 업스케일러",
    website: "https://bigjpg.com", thumbnail: "https://logo.clearbit.com/bigjpg.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-waifu2x", name: "Waifu2x", category: "image-editing",
    summary: "덕후들을 위한 고전 명작 2배 확대기",
    description: "덕후들을 위한 고전 명작 2배 확대기",
    website: "https://waifu2x.udp.jp", thumbnail: "https://logo.clearbit.com/udp.jp", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-vance", name: "VanceAI", category: "image-editing",
    summary: "흐린 사진 복구, 흑백 컬러링 등 기능이 다양함",
    description: "흐린 사진 복구, 흑백 컬러링 등 기능이 다양함",
    website: "https://vanceai.com", thumbnail: "https://logo.clearbit.com/vanceai.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-photoai", name: "PhotoAI", category: "image-editing",
    summary: "내 사진을 학습해 다양한 컨셉의 프로필 사진 생성",
    description: "내 사진을 학습해 다양한 컨셉의 프로필 사진 생성",
    website: "https://photoai.com", thumbnail: "https://logo.clearbit.com/photoai.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-retouch4me", name: "Retouch4me", category: "image-editing",
    summary: "피부 보정, 잡티 제거 등 인물 사진 보정 끝판왕",
    description: "피부 보정, 잡티 제거 등 인물 사진 보정 끝판왕",
    website: "https://retouch4me.com", thumbnail: "https://logo.clearbit.com/retouch4me.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-evoto", name: "Evoto", category: "image-editing",
    summary: "웨딩 사진 보정에 혁명을 일으킨 AI 툴",
    description: "웨딩 사진 보정에 혁명을 일으킨 AI 툴",
    website: "https://evoto.ai", thumbnail: "https://logo.clearbit.com/evoto.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-cutout", name: "Cutout.pro", category: "image-editing",
    summary: "동영상 배경 제거부터 증명사진 만들기까지 다 됨",
    description: "동영상 배경 제거부터 증명사진 만들기까지 다 됨",
    website: "https://cutout.pro", thumbnail: "https://logo.clearbit.com/cutout.pro", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 4. Video Generation
  // ===========================================
  {
    id: "vid-runway-gen3", name: "Runway (Gen-3)", category: "video-generation",
    summary: "사실적인 영상 생성의 선두주자, 영화 제작용",
    description: "사실적인 영상 생성의 선두주자, 영화 제작용",
    website: "https://runwayml.com",
    thumbnail: "https://logo.clearbit.com/runwayml.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-luma", name: "Luma Dream Machine", category: "video-generation",
    summary: "무료로도 꽤 쓸만한 고퀄리티 영상 생성",
    description: "무료로도 꽤 쓸만한 고퀄리티 영상 생성",
    website: "https://lumalabs.ai",
    thumbnail: "https://logo.clearbit.com/lumalabs.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-kling", name: "Kling", category: "video-generation",
    summary: "최근 혜성처럼 등장한 중국발 리얼한 영상 AI",
    description: "최근 혜성처럼 등장한 중국발 리얼한 영상 AI",
    website: "https://kling.kuaishou.com",
    thumbnail: "https://logo.clearbit.com/kuaishou.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-pika", name: "Pika", category: "video-generation",
    summary: "애니메이션 스타일이나 부드러운 움직임에 강점",
    description: "애니메이션 스타일이나 부드러운 움직임에 강점",
    website: "https://pika.art",
    thumbnail: "https://logo.clearbit.com/pika.art",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-sora", name: "Sora", category: "video-generation",
    summary: "(출시 예정) 공개되자마자 업계를 뒤집어놓은 OpenAI 모델",
    description: "(출시 예정) 공개되자마자 업계를 뒤집어놓은 OpenAI 모델",
    website: "https://openai.com/sora",
    thumbnail: "https://logo.clearbit.com/openai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-haiper", name: "Haiper", category: "video-generation",
    summary: "짧지만 임팩트 있는 고해상도 비디오 생성",
    description: "짧지만 임팩트 있는 고해상도 비디오 생성",
    website: "https://haiper.ai",
    thumbnail: "https://logo.clearbit.com/haiper.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-stablevideo", name: "Stable Video", category: "video-generation",
    summary: "이미지 한 장으로 영상 만들기 좋은 오픈소스 기반",
    description: "이미지 한 장으로 영상 만들기 좋은 오픈소스 기반",
    website: "https://stability.ai",
    thumbnail: "https://logo.clearbit.com/stability.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-vidu", name: "Vidu", category: "video-generation",
    summary: "일관성 있는 캐릭터 움직임 표현에 좋음",
    description: "일관성 있는 캐릭터 움직임 표현에 좋음",
    website: "https://vidu.studio",
    thumbnail: "https://logo.clearbit.com/vidu.studio",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-minimax", name: "Minimax", category: "video-generation",
    summary: "화려한 이펙트와 역동적인 장면에 강함",
    description: "화려한 이펙트와 역동적인 장면에 강함",
    website: "https://hailuoai.com",
    thumbnail: "https://logo.clearbit.com/hailuoai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-veo", name: "Veo", category: "video-generation",
    summary: "구글이 작정하고 만든 영상 생성 모델 (곧 유튜브 쇼츠 탑재)",
    description: "구글이 작정하고 만든 영상 생성 모델 (곧 유튜브 쇼츠 탑재)",
    website: "https://deepmind.google/technologies/veo",
    thumbnail: "https://logo.clearbit.com/google.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-morph", name: "Morph Studio", category: "video-generation",
    summary: "텍스트 투 비디오 모델을 스토리보드처럼 연결",
    description: "텍스트 투 비디오 모델을 스토리보드처럼 연결",
    website: "https://morphstudio.com", thumbnail: "https://logo.clearbit.com/morphstudio.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-moonvalley", name: "Moonvalley", category: "video-generation",
    summary: "디스코드에서 고퀄리티 시네마틱 영상 생성",
    description: "디스코드에서 고퀄리티 시네마틱 영상 생성",
    website: "https://moonvalley.ai", thumbnail: "https://logo.clearbit.com/moonvalley.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-genmo", name: "Genmo", category: "video-generation",
    summary: "2D 이미지를 3D 영상처럼 입체적으로 움직이게 함",
    description: "2D 이미지를 3D 영상처럼 입체적으로 움직이게 함",
    website: "https://genmo.ai", thumbnail: "https://logo.clearbit.com/genmo.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-deforum", name: "Deforum", category: "video-generation",
    summary: "음악에 맞춰 춤추는 듯한 기하학적 영상 생성",
    description: "음악에 맞춰 춤추는 듯한 기하학적 영상 생성",
    website: "https://deforum.art", thumbnail: "https://logo.clearbit.com/deforum.art", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-kaiber", name: "Kaiber", category: "video-generation",
    summary: "린킨파크 뮤비 제작에 쓰인 감각적인 AI",
    description: "린킨파크 뮤비 제작에 쓰인 감각적인 AI",
    website: "https://kaiber.ai", thumbnail: "https://logo.clearbit.com/kaiber.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-zeroscope", name: "Zeroscope", category: "video-generation",
    summary: "워터마크 없는 무료 오픈소스 텍스트-비디오 모델",
    description: "워터마크 없는 무료 오픈소스 텍스트-비디오 모델",
    website: "https://huggingface.co/cerspense/zeroscope_v2_576w", thumbnail: "https://logo.clearbit.com/huggingface.co", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-modelscope", name: "ModelScope", category: "video-generation",
    summary: "짧고 기괴하지만 밈(Meme) 만들기에 최적화됨",
    description: "짧고 기괴하지만 밈(Meme) 만들기에 최적화됨",
    website: "https://modelscope.cn", thumbnail: "https://logo.clearbit.com/modelscope.cn", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-animatediff", name: "AnimateDiff", category: "video-generation",
    summary: "스테이블 디퓨전 그림을 부드럽게 움직이게 만듦",
    description: "스테이블 디퓨전 그림을 부드럽게 움직이게 만듦",
    website: "https://animatediff.com", thumbnail: "https://logo.clearbit.com/github.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-hotshot", name: "Hotshot", category: "video-generation",
    summary: "GIF 만들기에 특화된 가볍고 빠른 생성기",
    description: "GIF 만들기에 특화된 가볍고 빠른 생성기",
    website: "https://hotshot.co", thumbnail: "https://logo.clearbit.com/hotshot.co", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vid-neverends", name: "Neverends", category: "video-generation",
    summary: "내가 올린 사진 속 인물이 춤추고 연기하게 만듦",
    description: "내가 올린 사진 속 인물이 춤추고 연기하게 만듦",
    website: "https://neverends.ai", thumbnail: "https://logo.clearbit.com/neverends.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 5. Video Editing
  // ===========================================
  {
    id: "vedit-capcut", name: "CapCut", category: "video-editing",
    summary: "AI 자막, 효과 등 숏폼 편집의 필수품",
    description: "AI 자막, 효과 등 숏폼 편집의 필수품",
    website: "https://capcut.com",
    thumbnail: "https://logo.clearbit.com/capcut.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-opus", name: "Opus Clip", category: "video-editing",
    summary: "긴 유튜브 영상을 알아서 하이라이트 쇼츠로 잘라줌",
    description: "긴 유튜브 영상을 알아서 하이라이트 쇼츠로 잘라줌",
    website: "https://opus.pro",
    thumbnail: "https://logo.clearbit.com/opus.pro",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-vrew", name: "Vrew", category: "video-editing",
    summary: "음성을 분석해 자동으로 자막을 달아주는 국산 꿀템",
    description: "음성을 분석해 자동으로 자막을 달아주는 국산 꿀템",
    website: "https://vrew.ai",
    thumbnail: "https://logo.clearbit.com/vrew.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-descript", name: "Descript", category: "video-editing",
    summary: "영상을 워드 문서처럼 텍스트로 편집함",
    description: "영상을 워드 문서처럼 텍스트로 편집함",
    website: "https://descript.com",
    thumbnail: "https://logo.clearbit.com/descript.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-invideo", name: "InVideo", category: "video-editing",
    summary: "텍스트만 주면 영상+자막+음성까지 풀세트로 제작",
    description: "텍스트만 주면 영상+자막+음성까지 풀세트로 제작",
    website: "https://invideo.io",
    thumbnail: "https://logo.clearbit.com/invideo.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-premiere", name: "Premiere Pro", category: "video-editing",
    summary: "어도비 AI 기능으로 편집 시간 단축 (전문가용)",
    description: "어도비 AI 기능으로 편집 시간 단축 (전문가용)",
    website: "https://adobe.com",
    thumbnail: "https://logo.clearbit.com/adobe.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-munch", name: "Munch", category: "video-editing",
    summary: "트렌드를 분석해서 가장 뜰만한 구간을 숏폼으로 제작",
    description: "트렌드를 분석해서 가장 뜰만한 구간을 숏폼으로 제작",
    website: "https://getmunch.com",
    thumbnail: "https://logo.clearbit.com/getmunch.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-filmora", name: "Wondershare Filmora", category: "video-editing",
    summary: "초보자도 쓰기 쉬운 AI 편집 효과가 많음",
    description: "초보자도 쓰기 쉬운 AI 편집 효과가 많음",
    website: "https://filmora.wondershare.com",
    thumbnail: "https://logo.clearbit.com/wondershare.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-kapwing", name: "Kapwing", category: "video-editing",
    summary: "웹에서 바로 쓰는 협업 가능한 영상 편집기",
    description: "웹에서 바로 쓰는 협업 가능한 영상 편집기",
    website: "https://kapwing.com",
    thumbnail: "https://logo.clearbit.com/kapwing.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-autocut", name: "AutoCut", category: "video-editing",
    summary: "영상 속의 무음 구간(침묵)을 자동으로 삭제",
    description: "영상 속의 무음 구간(침묵)을 자동으로 삭제",
    website: "https://autocut.com",
    thumbnail: "https://logo.clearbit.com/autocut.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-wisecut", name: "Wisecut", category: "video-editing",
    summary: "긴 영상을 짧은 쇼츠로 만들고 음악까지 자동 삽입",
    description: "긴 영상을 짧은 쇼츠로 만들고 음악까지 자동 삽입",
    website: "https://wisecut.video", thumbnail: "https://logo.clearbit.com/wisecut.video", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-rawshorts", name: "RawShorts", category: "video-editing",
    summary: "텍스트 스크립트를 입력하면 애니메이션 영상 제작",
    description: "텍스트 스크립트를 입력하면 애니메이션 영상 제작",
    website: "https://rawshorts.com", thumbnail: "https://logo.clearbit.com/rawshorts.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-pictory", name: "Pictory", category: "video-editing",
    summary: "블로그 글 주소를 넣으면 영상으로 변환해 줌",
    description: "블로그 글 주소를 넣으면 영상으로 변환해 줌",
    website: "https://pictory.ai", thumbnail: "https://logo.clearbit.com/pictory.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-gliacloud", name: "Gliacloud", category: "video-editing",
    summary: "뉴스 기사를 영상 뉴스로 자동 변환 (전통 강자)",
    description: "뉴스 기사를 영상 뉴스로 자동 변환 (전통 강자)",
    website: "https://gliacloud.com", thumbnail: "https://logo.clearbit.com/gliacloud.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-elai", name: "Elai.io", category: "video-editing",
    summary: "PPT를 영상으로 만들고 아바타가 발표하게 함",
    description: "PPT를 영상으로 만들고 아바타가 발표하게 함",
    website: "https://elai.io", thumbnail: "https://logo.clearbit.com/elai.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-deepbrain", name: "DeepBrain AI", category: "video-editing",
    summary: "방송국 수준의 가상 앵커 영상 제작 (국산)",
    description: "방송국 수준의 가상 앵커 영상 제작 (국산)",
    website: "https://deepbrain.io", thumbnail: "https://logo.clearbit.com/deepbrain.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-hourone", name: "Hour One", category: "video-editing",
    summary: "텍스트만 있으면 뉴스 리포트 영상 뚝딱",
    description: "텍스트만 있으면 뉴스 리포트 영상 뚝딱",
    website: "https://hourone.ai", thumbnail: "https://logo.clearbit.com/hourone.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-synthesia-edit", name: "Synthesia (Edit)", category: "video-editing",
    summary: "영상 편집 기술 없이도 텍스트로 영상 수정",
    description: "영상 편집 기술 없이도 텍스트로 영상 수정",
    website: "https://synthesia.io", thumbnail: "https://logo.clearbit.com/synthesia.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-heygen-trans", name: "HeyGen Video Translate", category: "video-editing",
    summary: "내 영상의 언어를 입모양까지 맞춰서 번역해 줌",
    description: "내 영상의 언어를 입모양까지 맞춰서 번역해 줌",
    website: "https://heygen.com", thumbnail: "https://logo.clearbit.com/heygen.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "vedit-rask", name: "Rask.ai", category: "video-editing",
    summary: "영상 더빙과 번역을 한 번에 해결하는 툴",
    description: "영상 더빙과 번역을 한 번에 해결하는 툴",
    website: "https://rask.ai", thumbnail: "https://logo.clearbit.com/rask.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 6. Coding
  // ===========================================
  {
    id: "code-github", name: "GitHub Copilot", category: "coding",
    summary: "탭 한 번에 코드 한 블록. 안 쓰는 개발자가 없을 정도",
    description: "탭 한 번에 코드 한 블록. 안 쓰는 개발자가 없을 정도",
    website: "https://github.com/features/copilot",
    thumbnail: "https://logo.clearbit.com/github.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-replit", name: "Replit", category: "coding",
    summary: "브라우저에서 바로 코딩+배포. 포트폴리오 사이트 1시간에 완성",
    description: "브라우저에서 바로 코딩+배포. 포트폴리오 사이트 1시간에 완성",
    website: "https://replit.com",
    thumbnail: "https://logo.clearbit.com/replit.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-supermaven", name: "Supermaven", category: "coding",
    summary: "GitHub Copilot보다 빠름. 코드 완성 속도 차이가 느껴짐",
    description: "GitHub Copilot보다 빠름. 코드 완성 속도 차이가 느껴짐",
    website: "https://supermaven.com",
    thumbnail: "https://logo.clearbit.com/supermaven.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-codeium", name: "Codeium", category: "coding",
    summary: "무료인데 Copilot 수준. 학생이나 개인 개발자에게 강추",
    description: "무료인데 Copilot 수준. 학생이나 개인 개발자에게 강추",
    website: "https://codeium.com",
    thumbnail: "https://logo.clearbit.com/codeium.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-tabnine", name: "Tabnine", category: "coding",
    summary: "코드가 외부에 안 나감. 회사에서 보안 이슈 없이 쓰고 싶다면",
    description: "코드가 외부에 안 나감. 회사에서 보안 이슈 없이 쓰고 싶다면",
    website: "https://tabnine.com",
    thumbnail: "https://logo.clearbit.com/tabnine.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-amazonq", name: "Amazon Q", category: "coding",
    summary: "AWS 서비스 코드 작성에 특화. 클라우드 인프라 작업할 때 유용함",
    description: "AWS 서비스 코드 작성에 특화. 클라우드 인프라 작업할 때 유용함",
    website: "https://aws.amazon.com/q",
    thumbnail: "https://logo.clearbit.com/amazon.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-jetbrains", name: "JetBrains AI", category: "coding",
    summary: "IntelliJ 등을 쓴다면 가장 궁합이 좋은 내장 AI",
    description: "IntelliJ 등을 쓴다면 가장 궁합이 좋은 내장 AI",
    website: "https://jetbrains.com/ai",
    thumbnail: "https://logo.clearbit.com/jetbrains.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-v0", name: "v0.dev", category: "coding",
    summary: "말만 하면 웹사이트 UI를 뚝딱 만들어주는 생성기",
    description: "말만 하면 웹사이트 UI를 뚝딱 만들어주는 생성기",
    website: "https://v0.dev",
    thumbnail: "https://logo.clearbit.com/v0.dev",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-cody", name: "Cody", category: "coding",
    summary: "전체 코드베이스를 이해하고 답변해 주는 똑똑한 녀석",
    description: "전체 코드베이스를 이해하고 답변해 주는 똑똑한 녀석",
    website: "https://sourcegraph.com/cody",
    thumbnail: "https://logo.clearbit.com/sourcegraph.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-blackbox", name: "Blackbox AI", category: "coding",
    summary: "코딩 질문을 위해 복사/붙여넣기 할 필요 없는 AI",
    description: "코딩 질문을 위해 복사/붙여넣기 할 필요 없는 AI",
    website: "https://useblackbox.io", thumbnail: "https://logo.clearbit.com/useblackbox.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-codium", name: "CodiumAI", category: "coding",
    summary: "버그 없는 코드를 위해 테스트 케이스를 자동 생성",
    description: "버그 없는 코드를 위해 테스트 케이스를 자동 생성",
    website: "https://codium.ai", thumbnail: "https://logo.clearbit.com/codium.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-sourcery", name: "Sourcery", category: "coding",
    summary: "지저분한 파이썬 코드를 깔끔하게 리팩토링",
    description: "지저분한 파이썬 코드를 깔끔하게 리팩토링",
    website: "https://sourcery.ai", thumbnail: "https://logo.clearbit.com/sourcery.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-mintlify", name: "Mintlify", category: "coding",
    summary: "코드만 짜면 문서(Docs)는 알아서 만들어 줌",
    description: "코드만 짜면 문서(Docs)는 알아서 만들어 줌",
    website: "https://mintlify.com", thumbnail: "https://logo.clearbit.com/mintlify.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-adrenaline", name: "Adrenaline", category: "coding",
    summary: "스택오버플로우 대신 내 코드를 바로 고쳐주는 디버거",
    description: "스택오버플로우 대신 내 코드를 바로 고쳐주는 디버거",
    website: "https://useadrenaline.com", thumbnail: "https://logo.clearbit.com/useadrenaline.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-figstack", name: "Figstack", category: "coding",
    summary: "난해한 코드를 쉬운 영어(한글)로 해석해 줌",
    description: "난해한 코드를 쉬운 영어(한글)로 해석해 줌",
    website: "https://figstack.com", thumbnail: "https://logo.clearbit.com/figstack.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-kodezi", name: "Kodezi", category: "coding",
    summary: "학생들이 코딩 배울 때 쓰기 좋은 자동 수정 툴",
    description: "학생들이 코딩 배울 때 쓰기 좋은 자동 수정 툴",
    website: "https://kodezi.com", thumbnail: "https://logo.clearbit.com/kodezi.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-safurai", name: "Safurai", category: "coding",
    summary: "개인 정보 유출 걱정 없는 로컬 기반 코딩 비서",
    description: "개인 정보 유출 걱정 없는 로컬 기반 코딩 비서",
    website: "https://safurai.com", thumbnail: "https://logo.clearbit.com/safurai.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-askcodi", name: "AskCodi", category: "coding",
    summary: "노션이나 VS Code 안에서 바로 쓰는 코딩 질문 봇",
    description: "노션이나 VS Code 안에서 바로 쓰는 코딩 질문 봇",
    website: "https://askcodi.com", thumbnail: "https://logo.clearbit.com/askcodi.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-whatthediff", name: "What The Diff", category: "coding",
    summary: "PR(풀 리퀘스트) 내용을 요약해서 코드 리뷰 시간 단축",
    description: "PR(풀 리퀘스트) 내용을 요약해서 코드 리뷰 시간 단축",
    website: "https://whatthediff.ai", thumbnail: "https://logo.clearbit.com/whatthediff.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 7. Voice (TTS/Cloning)
  // ===========================================
  {
    id: "voice-elevenlabs", name: "ElevenLabs", category: "voice-tts",
    summary: "현존 최고의 자연스러운 목소리 복제 및 생성",
    description: "현존 최고의 자연스러운 목소리 복제 및 생성",
    website: "https://elevenlabs.io",
    thumbnail: "https://logo.clearbit.com/elevenlabs.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-murf", name: "Murf.ai", category: "voice-tts",
    summary: "스튜디오 품질의 성우 내레이션 생성",
    description: "스튜디오 품질의 성우 내레이션 생성",
    website: "https://murf.ai",
    thumbnail: "https://logo.clearbit.com/murf.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-playht", name: "Play.ht", category: "voice-tts",
    summary: "감정 표현이 풍부하고 실시간 대화도 가능한 AI 음성",
    description: "감정 표현이 풍부하고 실시간 대화도 가능한 AI 음성",
    website: "https://play.ht",
    thumbnail: "https://logo.clearbit.com/play.ht",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-openai", name: "OpenAI Voice", category: "voice-tts",
    summary: "챗지피티의 그 목소리, API로 활용 가능",
    description: "챗지피티의 그 목소리, API로 활용 가능",
    website: "https://openai.com",
    thumbnail: "https://logo.clearbit.com/openai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-speechify", name: "Speechify", category: "voice-tts",
    summary: "난독증 환자를 위해 만든, 뭐든지 읽어주는 리더기",
    description: "난독증 환자를 위해 만든, 뭐든지 읽어주는 리더기",
    website: "https://speechify.com",
    thumbnail: "https://logo.clearbit.com/speechify.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-lovo", name: "LOVO", category: "voice-tts",
    summary: "영상 제작자를 위한 다양한 감정의 AI 성우",
    description: "영상 제작자를 위한 다양한 감정의 AI 성우",
    website: "https://lovo.ai",
    thumbnail: "https://logo.clearbit.com/lovo.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-rvc", name: "RVC (Model)", category: "voice-tts",
    summary: "내 목소리를 유명 가수나 캐릭터로 변조 (오픈소스)",
    description: "내 목소리를 유명 가수나 캐릭터로 변조 (오픈소스)",
    website: "https://github.com/RVC-Project",
    thumbnail: "https://logo.clearbit.com/github.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-overdub", name: "Descript Overdub", category: "voice-tts",
    summary: "내 목소리를 학습시켜 오타 수정하듯 음성 수정",
    description: "내 목소리를 학습시켜 오타 수정하듯 음성 수정",
    website: "https://descript.com",
    thumbnail: "https://logo.clearbit.com/descript.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-gcloud", name: "Google Cloud TTS", category: "voice-tts",
    summary: "가장 안정적이고 다양한 언어를 지원하는 구글 엔진",
    description: "가장 안정적이고 다양한 언어를 지원하는 구글 엔진",
    website: "https://cloud.google.com/text-to-speech",
    thumbnail: "https://logo.clearbit.com/google.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-typecast", name: "Typecast", category: "voice-tts",
    summary: "한국어 발음이 가장 자연스러운 국내 원탑 서비스",
    description: "한국어 발음이 가장 자연스러운 국내 원탑 서비스",
    website: "https://typecast.ai",
    thumbnail: "https://logo.clearbit.com/typecast.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-resemble", name: "Resemble AI", category: "voice-tts",
    summary: "딥페이크 탐지 기능까지 갖춘 음성 복제 도구",
    description: "딥페이크 탐지 기능까지 갖춘 음성 복제 도구",
    website: "https://resemble.ai", thumbnail: "https://logo.clearbit.com/resemble.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-wellsaid", name: "WellSaid Labs", category: "voice-tts",
    summary: "사람과 구별하기 힘든 기업용 내레이션 생성",
    description: "사람과 구별하기 힘든 기업용 내레이션 생성",
    website: "https://wellsaidlabs.com", thumbnail: "https://logo.clearbit.com/wellsaidlabs.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-replica", name: "Replica Studios", category: "voice-tts",
    summary: "게임이나 영화 캐릭터 연기에 특화된 AI 성우",
    description: "게임이나 영화 캐릭터 연기에 특화된 AI 성우",
    website: "https://replicastudios.com", thumbnail: "https://logo.clearbit.com/replicastudios.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-uberduck", name: "Uberduck", category: "voice-tts",
    summary: "래퍼 목소리로 랩을 시키는 재미있는 음성 생성",
    description: "래퍼 목소리로 랩을 시키는 재미있는 음성 생성",
    website: "https://uberduck.ai", thumbnail: "https://logo.clearbit.com/uberduck.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-voicify", name: "Voicify.ai", category: "voice-tts",
    summary: "유명 가수 목소리로 커버곡을 만드는 도구",
    description: "유명 가수 목소리로 커버곡을 만드는 도구",
    website: "https://voicify.ai", thumbnail: "https://logo.clearbit.com/voicify.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-kits", name: "Kits.ai", category: "voice-tts",
    summary: "음악가를 위한 로열티 프리 AI 목소리 라이브러리",
    description: "음악가를 위한 로열티 프리 AI 목소리 라이브러리",
    website: "https://kits.ai", thumbnail: "https://logo.clearbit.com/kits.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-altered", name: "Altered", category: "voice-tts",
    summary: "내 목소리를 전문 성우처럼 바꿔주는 보이스 체인저",
    description: "내 목소리를 전문 성우처럼 바꿔주는 보이스 체인저",
    website: "https://altered.ai", thumbnail: "https://logo.clearbit.com/altered.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-metavoice", name: "Metavoice", category: "voice-tts",
    summary: "실시간으로 감정까지 전달하는 고성능 음성 변환",
    description: "실시간으로 감정까지 전달하는 고성능 음성 변환",
    website: "https://metavoice.xyz", thumbnail: "https://logo.clearbit.com/metavoice.xyz", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-voiceai", name: "Voice.ai", category: "voice-tts",
    summary: "디스코드나 게임에서 실시간으로 목소리 변조",
    description: "디스코드나 게임에서 실시간으로 목소리 변조",
    website: "https://voice.ai", thumbnail: "https://logo.clearbit.com/voice.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "voice-coqui", name: "Coqui (TTS)", category: "voice-tts",
    summary: "오픈소스 음성 합성의 근본, 텍스트 투 스피치",
    description: "오픈소스 음성 합성의 근본, 텍스트 투 스피치",
    website: "https://coqui.ai", thumbnail: "https://logo.clearbit.com/coqui.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 8. 3D Generation
  // ===========================================
  {
    id: "3d-meshy", name: "Meshy", category: "3d",
    summary: "텍스트나 이미지를 넣으면 1분 만에 3D 모델 생성",
    description: "텍스트나 이미지를 넣으면 1분 만에 3D 모델 생성",
    website: "https://meshy.ai",
    thumbnail: "https://logo.clearbit.com/meshy.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-tripo", name: "Tripo AI", category: "3d",
    summary: "빠르고 가볍게 3D 에셋을 뽑아내는 도구",
    description: "빠르고 가볍게 3D 에셋을 뽑아내는 도구",
    website: "https://tripo3d.ai",
    thumbnail: "https://logo.clearbit.com/tripo3d.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-csm", name: "CSM", category: "3d",
    summary: "단 한 장의 사진으로 360도 회전하는 3D 큐브 생성",
    description: "단 한 장의 사진으로 360도 회전하는 3D 큐브 생성",
    website: "https://csm.ai",
    thumbnail: "https://logo.clearbit.com/csm.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-spline", name: "Spline AI", category: "3d",
    summary: "웹에서 바로 3D 디자인을 하고 AI로 수정",
    description: "웹에서 바로 3D 디자인을 하고 AI로 수정",
    website: "https://spline.design",
    thumbnail: "https://logo.clearbit.com/spline.design",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-lumagenie", name: "Luma Genie", category: "3d",
    summary: "디스코드에서 명령어로 뚝딱 만드는 3D 모델",
    description: "디스코드에서 명령어로 뚝딱 만드는 3D 모델",
    website: "https://lumalabs.ai",
    thumbnail: "https://logo.clearbit.com/lumalabs.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-rodin", name: "Rodin", category: "3d",
    summary: "3D 피규어나 캐릭터 생성에 특화된 고퀄리티 모델",
    description: "3D 피규어나 캐릭터 생성에 특화된 고퀄리티 모델",
    website: "https://hyperhuman.deemos.com",
    thumbnail: "https://logo.clearbit.com/deemos.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-masterpiece", name: "Masterpiece X", category: "3d",
    summary: "VR 기기 끼고 들어가서 AI와 함께 조각하듯 만듦",
    description: "VR 기기 끼고 들어가서 AI와 함께 조각하듯 만듦",
    website: "https://masterpiecex.com",
    thumbnail: "https://logo.clearbit.com/masterpiecex.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-leonardo", name: "Leonardo 3D", category: "3d",
    summary: "2D 그림을 3D 텍스처로 입혀주는 기능 보유",
    description: "2D 그림을 3D 텍스처로 입혀주는 기능 보유",
    website: "https://leonardo.ai",
    thumbnail: "https://logo.clearbit.com/leonardo.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-shape", name: "Shap-E", category: "3d",
    summary: "오픈AI가 만든 3D 생성 오픈소스 모델",
    description: "오픈AI가 만든 3D 생성 오픈소스 모델",
    website: "https://github.com/openai/shap-e",
    thumbnail: "https://logo.clearbit.com/openai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-blockade", name: "Blockade Labs", category: "3d",
    summary: "360도 파노라마 배경(스카이박스)을 순식간에 생성",
    description: "360도 파노라마 배경(스카이박스)을 순식간에 생성",
    website: "https://skybox.blockadelabs.com",
    thumbnail: "https://logo.clearbit.com/blockadelabs.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-kaedim", name: "Kaedim", category: "3d",
    summary: "2D 이미지를 넣으면 즉시 3D 모델로 변환",
    description: "2D 이미지를 넣으면 즉시 3D 모델로 변환",
    website: "https://kaedim3d.com", thumbnail: "https://logo.clearbit.com/kaedim3d.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-polycam", name: "Polycam", category: "3d",
    summary: "아이폰 라이다 센서로 사물을 스캔해 3D화",
    description: "아이폰 라이다 센서로 사물을 스캔해 3D화",
    website: "https://poly.cam", thumbnail: "https://logo.clearbit.com/poly.cam", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-kiri", name: "KIRI Engine", category: "3d",
    summary: "안드로이드에서도 가능한 3D 스캔 앱",
    description: "안드로이드에서도 가능한 3D 스캔 앱",
    website: "https://kiriengine.app", thumbnail: "https://logo.clearbit.com/kiriengine.app", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-sloyd", name: "Sloyd", category: "3d",
    summary: "게임을 위한 3D 소품(오브젝트) 생성에 특화",
    description: "게임을 위한 3D 소품(오브젝트) 생성에 특화",
    website: "https://sloyd.ai", thumbnail: "https://logo.clearbit.com/sloyd.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-genie", name: "Luma Genie", category: "3d",
    summary: "텍스트로 3D 모델을 만드는 루마 랩스의 도구",
    description: "텍스트로 3D 모델을 만드는 루마 랩스의 도구",
    website: "https://lumalabs.ai", thumbnail: "https://logo.clearbit.com/lumalabs.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-3dfy", name: "3DFY.ai", category: "3d",
    summary: "고품질 3D 모델을 대량으로 생성하는 솔루션",
    description: "고품질 3D 모델을 대량으로 생성하는 솔루션",
    website: "https://3dfy.ai", thumbnail: "https://logo.clearbit.com/3dfy.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-alpha3d", name: "Alpha3D", category: "3d",
    summary: "증강현실(AR) 용 3D 에셋을 빠르게 제작",
    description: "증강현실(AR) 용 3D 에셋을 빠르게 제작",
    website: "https://alpha3d.io", thumbnail: "https://logo.clearbit.com/alpha3d.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-ponzu", name: "Ponzu", category: "3d",
    summary: "3D 텍스처(재질)를 AI로 생성하는 도구",
    description: "3D 텍스처(재질)를 AI로 생성하는 도구",
    website: "https://ponzu.ai", thumbnail: "https://logo.clearbit.com/ponzu.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-latent", name: "Latent Labs", category: "3d",
    summary: "360도 스카이박스 이미지를 생성하는 또 다른 강자",
    description: "360도 스카이박스 이미지를 생성하는 또 다른 강자",
    website: "https://latent.gg", thumbnail: "https://logo.clearbit.com/latent.gg", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "3d-csm-ai", name: "Common Sense Machines", category: "3d",
    summary: "사진을 3D 게임 에셋으로 바꿔주는 플랫폼",
    description: "사진을 3D 게임 에셋으로 바꿔주는 플랫폼",
    website: "https://csm.ai", thumbnail: "https://logo.clearbit.com/csm.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 9. Automation
  // ===========================================
  {
    id: "auto-n8n", name: "n8n", category: "automation",
    summary: "무료로 자체 서버에 구축 가능한 무제한 자동화 툴",
    description: "무료로 자체 서버에 구축 가능한 무제한 자동화 툴",
    website: "https://n8n.io",
    thumbnail: "https://logo.clearbit.com/n8n.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-zapier", name: "Zapier", category: "automation",
    summary: "가장 유명하고 쉬운 자동화, 연동되는 앱이 제일 많음",
    description: "가장 유명하고 쉬운 자동화, 연동되는 앱이 제일 많음",
    website: "https://zapier.com",
    thumbnail: "https://logo.clearbit.com/zapier.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-make", name: "Make", category: "automation",
    summary: "복잡한 시각적 워크플로우를 짜기에 가장 좋음",
    description: "복잡한 시각적 워크플로우를 짜기에 가장 좋음",
    website: "https://make.com",
    thumbnail: "https://logo.clearbit.com/make.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-bardeen", name: "Bardeen", category: "automation",
    summary: "웹 브라우저에서 버튼 한 번으로 데이터 긁어오기 최강",
    description: "웹 브라우저에서 버튼 한 번으로 데이터 긁어오기 최강",
    website: "https://bardeen.ai",
    thumbnail: "https://logo.clearbit.com/bardeen.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-gumloop", name: "Gumloop", category: "automation",
    summary: "AI 기능(LLM)을 활용한 자동화 파이프라인 구축에 특화",
    description: "AI 기능(LLM)을 활용한 자동화 파이프라인 구축에 특화",
    website: "https://gumloop.com",
    thumbnail: "https://logo.clearbit.com/gumloop.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-ifttt", name: "IFTTT", category: "automation",
    summary: "이거 하면 저거 해 식의 초간단 생활 밀착형 자동화",
    description: "이거 하면 저거 해 식의 초간단 생활 밀착형 자동화",
    website: "https://ifttt.com",
    thumbnail: "https://logo.clearbit.com/ifttt.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-powerauto", name: "Power Automate", category: "automation",
    summary: "엑셀, 아웃룩 등 MS 오피스 업무 자동화 필수품",
    description: "엑셀, 아웃룩 등 MS 오피스 업무 자동화 필수품",
    website: "https://microsoft.com",
    thumbnail: "https://logo.clearbit.com/microsoft.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-relay", name: "Relay.app", category: "automation",
    summary: "사람의 개입(승인)이 필요한 업무 자동화에 좋음",
    description: "사람의 개입(승인)이 필요한 업무 자동화에 좋음",
    website: "https://relay.app",
    thumbnail: "https://logo.clearbit.com/relay.app",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-pabbly", name: "Pabbly", category: "automation",
    summary: "한 번 결제로 평생 쓰는 가성비 자동화 도구",
    description: "한 번 결제로 평생 쓰는 가성비 자동화 도구",
    website: "https://pabbly.com",
    thumbnail: "https://logo.clearbit.com/pabbly.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "prod-gamma", name: "Gamma", category: "automation",
    summary: "PPT, 문서, 웹사이트를 1분 만에 디자인해주는 마법",
    description: "PPT, 문서, 웹사이트를 1분 만에 디자인해주는 마법",
    website: "https://gamma.app",
    thumbnail: "https://logo.clearbit.com/gamma.app",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-active", name: "ActivePieces", category: "automation",
    summary: "n8n처럼 오픈소스로 쓸 수 있는 가벼운 대안",
    description: "n8n처럼 오픈소스로 쓸 수 있는 가벼운 대안",
    website: "https://activepieces.com",
    thumbnail: "https://logo.clearbit.com/activepieces.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-cheatlayer", name: "Cheat Layer", category: "automation",
    summary: "GPT-4를 이용해 어떤 웹사이트든 자동화 가능",
    description: "GPT-4를 이용해 어떤 웹사이트든 자동화 가능",
    website: "https://cheatlayer.com", thumbnail: "https://logo.clearbit.com/cheatlayer.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-browse", name: "Browse AI", category: "automation",
    summary: "웹사이트 변경 사항을 감지하고 데이터를 추출",
    description: "웹사이트 변경 사항을 감지하고 데이터를 추출",
    website: "https://browse.ai", thumbnail: "https://logo.clearbit.com/browse.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-levity", name: "Levity", category: "automation",
    summary: "이메일 분류 같은 반복 업무를 AI가 학습해서 처리",
    description: "이메일 분류 같은 반복 업무를 AI가 학습해서 처리",
    website: "https://levity.ai", thumbnail: "https://logo.clearbit.com/levity.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-axiom", name: "Axiom", category: "automation",
    summary: "브라우저 행동을 녹화해서 반복 실행하는 매크로",
    description: "브라우저 행동을 녹화해서 반복 실행하는 매크로",
    website: "https://axiom.ai", thumbnail: "https://logo.clearbit.com/axiom.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-hexomatic", name: "Hexomatic", category: "automation",
    summary: "웹 스크래핑과 업무 자동화를 동시에",
    description: "웹 스크래핑과 업무 자동화를 동시에",
    website: "https://hexomatic.com", thumbnail: "https://logo.clearbit.com/hexomatic.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-robomotion", name: "Robomotion", category: "automation",
    summary: "RPA(로봇 프로세스 자동화)를 웹에서 쉽게 구현",
    description: "RPA(로봇 프로세스 자동화)를 웹에서 쉽게 구현",
    website: "https://robomotion.io", thumbnail: "https://logo.clearbit.com/robomotion.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-automa", name: "Automa", category: "automation",
    summary: "크롬 확장 프로그램으로 브라우저 작업 자동화 (오픈소스)",
    description: "크롬 확장 프로그램으로 브라우저 작업 자동화 (오픈소스)",
    website: "https://automa.site", thumbnail: "https://logo.clearbit.com/automa.site", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-uibot", name: "UIBot", category: "automation",
    summary: "윈도우, 맥 가리지 않고 화면 클릭 자동화",
    description: "윈도우, 맥 가리지 않고 화면 클릭 자동화",
    website: "https://uibot.com.cn", thumbnail: "https://logo.clearbit.com/uibot.com.cn", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-magical", name: "Magical", category: "automation",
    summary: "복잡한 데이터 입력 작업을 마법처럼 자동화",
    description: "복잡한 데이터 입력 작업을 마법처럼 자동화",
    website: "https://getmagical.com", thumbnail: "https://logo.clearbit.com/getmagical.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "auto-harpa", name: "Harpa AI", category: "automation",
    summary: "웹 페이지 감시 및 자동화 최강의 크롬 확장",
    description: "웹 페이지 감시 및 자동화 최강의 크롬 확장",
    website: "https://harpa.ai", thumbnail: "https://logo.clearbit.com/harpa.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 10. Music
  // ===========================================
  {
    id: "music-suno", name: "Suno", category: "music",
    summary: "가사만 넣으면 라디오 퀄리티 노래 뚝딱 (현재 1타)",
    description: "가사만 넣으면 라디오 퀄리티 노래 뚝딱 (현재 1타)",
    website: "https://suno.com",
    thumbnail: "https://logo.clearbit.com/suno.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-udio", name: "Udio", category: "music",
    summary: "음악적 완성도가 높고 편집 기능이 강력한 경쟁자",
    description: "음악적 완성도가 높고 편집 기능이 강력한 경쟁자",
    website: "https://udio.com",
    thumbnail: "https://logo.clearbit.com/udio.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-stable", name: "Stable Audio", category: "music",
    summary: "고품질 배경음악과 효과음 생성에 최적화",
    description: "고품질 배경음악과 효과음 생성에 최적화",
    website: "https://stability.ai",
    thumbnail: "https://logo.clearbit.com/stability.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-soundraw", name: "Soundraw", category: "music",
    summary: "저작권 걱정 없는 유튜브 BGM 커스텀 생성기",
    description: "저작권 걱정 없는 유튜브 BGM 커스텀 생성기",
    website: "https://soundraw.io",
    thumbnail: "https://logo.clearbit.com/soundraw.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-riffusion", name: "Riffusion", category: "music",
    summary: "텍스트를 입력하면 짧은 리프(멜로디)를 생성",
    description: "텍스트를 입력하면 짧은 리프(멜로디)를 생성",
    website: "https://riffusion.com",
    thumbnail: "https://logo.clearbit.com/riffusion.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-aiva", name: "AIVA", category: "music",
    summary: "클래식이나 영화 음악 같은 감성적인 작곡에 강함",
    description: "클래식이나 영화 음악 같은 감성적인 작곡에 강함",
    website: "https://aiva.ai",
    thumbnail: "https://logo.clearbit.com/aiva.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-mubert", name: "Mubert", category: "music",
    summary: "스트리밍이나 게임에 쓸 실시간 생성 배경음악",
    description: "스트리밍이나 게임에 쓸 실시간 생성 배경음악",
    website: "https://mubert.com",
    thumbnail: "https://logo.clearbit.com/mubert.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-boomy", name: "Boomy", category: "music",
    summary: "초보자도 몇 초 만에 노래 만들고 스포티파이 등록 가능",
    description: "초보자도 몇 초 만에 노래 만들고 스포티파이 등록 가능",
    website: "https://boomy.com",
    thumbnail: "https://logo.clearbit.com/boomy.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-beatoven", name: "Beatoven", category: "music",
    summary: "영상 분위기에 맞춰 감정을 조절하는 BGM 생성",
    description: "영상 분위기에 맞춰 감정을 조절하는 BGM 생성",
    website: "https://beatoven.ai",
    thumbnail: "https://logo.clearbit.com/beatoven.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-loudly", name: "Loudly", category: "music",
    summary: "방대한 AI 음악 라이브러리와 생성 엔진 제공",
    description: "방대한 AI 음악 라이브러리와 생성 엔진 제공",
    website: "https://loudly.com",
    thumbnail: "https://logo.clearbit.com/loudly.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-ecrett", name: "Ecrett Music", category: "music",
    summary: "영상 제작자를 위한 직관적인 BGM 생성",
    description: "영상 제작자를 위한 직관적인 BGM 생성",
    website: "https://ecrettmusic.com", thumbnail: "https://logo.clearbit.com/ecrettmusic.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-cassette", name: "CassetteAI", category: "music",
    summary: "머신러닝으로 만드는 나만의 비트",
    description: "머신러닝으로 만드는 나만의 비트",
    website: "https://cassetteai.com", thumbnail: "https://logo.clearbit.com/cassetteai.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-splash", name: "Splash Pro", category: "music",
    summary: "로블록스 음악 게임으로 유명한 회사의 생성 AI",
    description: "로블록스 음악 게임으로 유명한 회사의 생성 AI",
    website: "https://splashmusic.com", thumbnail: "https://logo.clearbit.com/splashmusic.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-musiclm", name: "MusicLM", category: "music",
    summary: "구글이 연구용으로 공개한 고성능 음악 AI",
    description: "구글이 연구용으로 공개한 고성능 음악 AI",
    website: "https://aitestkitchen.withgoogle.com", thumbnail: "https://logo.clearbit.com/google.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-songr", name: "SongR", category: "music",
    summary: "가사만 입력하면 노래를 불러주는 무료 사이트",
    description: "가사만 입력하면 노래를 불러주는 무료 사이트",
    website: "https://songr.ai", thumbnail: "https://logo.clearbit.com/songr.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-voicemod", name: "Voicemod", category: "music",
    summary: "텍스트를 노래로 바꿔주는 AI 싱어 기능 탑재",
    description: "텍스트를 노래로 바꿔주는 AI 싱어 기능 탑재",
    website: "https://voicemod.net", thumbnail: "https://logo.clearbit.com/voicemod.net", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-koe", name: "Koe Recast", category: "music",
    summary: "내 목소리를 다른 스타일의 목소리로 변환",
    description: "내 목소리를 다른 스타일의 목소리로 변환",
    website: "https://koe.ai", thumbnail: "https://logo.clearbit.com/koe.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-voiceswap", name: "VoiceSwap", category: "music",
    summary: "아티스트의 목소리로 내 데모 곡을 바꿔봄 (합법)",
    description: "아티스트의 목소리로 내 데모 곡을 바꿔봄 (합법)",
    website: "https://voiceswap.ai", thumbnail: "https://logo.clearbit.com/voiceswap.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-moises", name: "Moises", category: "music",
    summary: "음악에서 보컬, 드럼 등 악기 소리를 분리 (최강)",
    description: "음악에서 보컬, 드럼 등 악기 소리를 분리 (최강)",
    website: "https://moises.ai", thumbnail: "https://logo.clearbit.com/moises.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-lalal", name: "Lalal.ai", category: "music",
    summary: "고품질 음원 분리 및 보컬 제거",
    description: "고품질 음원 분리 및 보컬 제거",
    website: "https://lalal.ai", thumbnail: "https://logo.clearbit.com/lalal.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-splitter", name: "Splitter.ai", category: "music",
    summary: "2스템부터 5스템까지 세밀하게 악기 분리",
    description: "2스템부터 5스템까지 세밀하게 악기 분리",
    website: "https://splitter.ai", thumbnail: "https://logo.clearbit.com/splitter.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "music-audioshake", name: "AudioShake", category: "music",
    summary: "기업용 고품질 음원 분리 솔루션",
    description: "기업용 고품질 음원 분리 솔루션",
    website: "https://audioshake.ai", thumbnail: "https://logo.clearbit.com/audioshake.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 11. Presentation
  // ===========================================
  {
    id: "ppt-gamma", name: "Gamma", category: "presentation",
    summary: "주제만 주면 디자인까지 끝난 PPT 자동 완성 (강추)",
    description: "주제만 주면 디자인까지 끝난 PPT 자동 완성 (강추)",
    website: "https://gamma.app",
    thumbnail: "https://logo.clearbit.com/gamma.app",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-tome", name: "Tome", category: "presentation",
    summary: "스토리텔링이 있는 세련된 슬라이드 제작",
    description: "스토리텔링이 있는 세련된 슬라이드 제작",
    website: "https://tome.app",
    thumbnail: "https://logo.clearbit.com/tome.app",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-beautiful", name: "Beautiful.ai", category: "presentation",
    summary: "디자인 감각 없어도 전문가처럼 배치해 주는 툴",
    description: "디자인 감각 없어도 전문가처럼 배치해 주는 툴",
    website: "https://beautiful.ai",
    thumbnail: "https://logo.clearbit.com/beautiful.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-slidesai", name: "SlidesAI", category: "presentation",
    summary: "구글 슬라이드 안에서 텍스트를 장표로 변환",
    description: "구글 슬라이드 안에서 텍스트를 장표로 변환",
    website: "https://slidesai.io",
    thumbnail: "https://logo.clearbit.com/slidesai.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-pitch", name: "Pitch", category: "presentation",
    summary: "협업과 AI 생성이 결합된 현대적인 프레젠테이션",
    description: "협업과 AI 생성이 결합된 현대적인 프레젠테이션",
    website: "https://pitch.com",
    thumbnail: "https://logo.clearbit.com/pitch.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-napkin", name: "Napkin", category: "presentation",
    summary: "텍스트를 넣으면 귀여운 손그림 다이어그램으로 변환",
    description: "텍스트를 넣으면 귀여운 손그림 다이어그램으로 변환",
    website: "https://napkin.ai",
    thumbnail: "https://logo.clearbit.com/napkin.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-decktopus", name: "Decktopus", category: "presentation",
    summary: "발표 대본과 Q&A 예상 질문까지 뽑아주는 AI",
    description: "발표 대본과 Q&A 예상 질문까지 뽑아주는 AI",
    website: "https://decktopus.com",
    thumbnail: "https://logo.clearbit.com/decktopus.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-msdesigner", name: "Microsoft Designer", category: "presentation",
    summary: "PPT 표지나 이미지를 AI로 즉석 생성",
    description: "PPT 표지나 이미지를 AI로 즉석 생성",
    website: "https://designer.microsoft.com",
    thumbnail: "https://logo.clearbit.com/microsoft.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-prezi", name: "Prezi (AI)", category: "presentation",
    summary: "줌인/줌아웃 효과에 AI 텍스트 생성 기능 추가",
    description: "줌인/줌아웃 효과에 AI 텍스트 생성 기능 추가",
    website: "https://prezi.com",
    thumbnail: "https://logo.clearbit.com/prezi.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-popai", name: "PopAi", category: "presentation",
    summary: "논문이나 PDF를 넣으면 발표 자료로 요약 변환",
    description: "논문이나 PDF를 넣으면 발표 자료로 요약 변환",
    website: "https://popai.pro",
    thumbnail: "https://logo.clearbit.com/popai.pro",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-sendsteps", name: "Sendsteps", category: "presentation",
    summary: "청중과 실시간으로 소통하는 인터랙티브 PPT 생성",
    description: "청중과 실시간으로 소통하는 인터랙티브 PPT 생성",
    website: "https://sendsteps.com", thumbnail: "https://logo.clearbit.com/sendsteps.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-slido", name: "Slido", category: "presentation",
    summary: "발표 도중 투표와 Q&A를 진행하는 최고의 도구",
    description: "발표 도중 투표와 Q&A를 진행하는 최고의 도구",
    website: "https://slido.com", thumbnail: "https://logo.clearbit.com/slido.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-deckrobot", name: "DeckRobot", category: "presentation",
    summary: "회사 브랜드 가이드라인에 맞춰 PPT 자동 정렬",
    description: "회사 브랜드 가이드라인에 맞춰 PPT 자동 정렬",
    website: "https://deckrobot.com", thumbnail: "https://logo.clearbit.com/deckrobot.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-slidebean", name: "Slidebean", category: "presentation",
    summary: "스타트업 피치덱(투자 유치용) 제작에 특화",
    description: "스타트업 피치덱(투자 유치용) 제작에 특화",
    website: "https://slidebean.com", thumbnail: "https://logo.clearbit.com/slidebean.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-powerpresenter", name: "PowerPresenter", category: "presentation",
    summary: "발표와 동시에 AI 코칭을 받아 실력 향상",
    description: "발표와 동시에 AI 코칭을 받아 실력 향상",
    website: "https://powerpresenter.ai", thumbnail: "https://logo.clearbit.com/powerpresenter.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-prezent", name: "Prezent", category: "presentation",
    summary: "기업용 지능형 프레젠테이션 플랫폼",
    description: "기업용 지능형 프레젠테이션 플랫폼",
    website: "https://prezent.ai", thumbnail: "https://logo.clearbit.com/prezent.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-visme", name: "Visme", category: "presentation",
    summary: "인포그래픽과 데이터 시각화가 강력한 툴",
    description: "인포그래픽과 데이터 시각화가 강력한 툴",
    website: "https://visme.co", thumbnail: "https://logo.clearbit.com/visme.co", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-zoho", name: "Zoho Show", category: "presentation",
    summary: "팀원들과 실시간 협업이 가능한 무료 PPT 도구",
    description: "팀원들과 실시간 협업이 가능한 무료 PPT 도구",
    website: "https://zoho.com/show", thumbnail: "https://logo.clearbit.com/zoho.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-haikudeck", name: "Haiku Deck", category: "presentation",
    summary: "심플하고 감성적인 슬라이드를 빠르게 제작",
    description: "심플하고 감성적인 슬라이드를 빠르게 제작",
    website: "https://haikudeck.com", thumbnail: "https://logo.clearbit.com/haikudeck.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "ppt-sway", name: "Sway", category: "presentation",
    summary: "마이크로소프트의 웹 기반 스토리텔링 툴",
    description: "마이크로소프트의 웹 기반 스토리텔링 툴",
    website: "https://sway.office.com", thumbnail: "https://logo.clearbit.com/microsoft.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 12. Meeting Notes
  // ===========================================
  {
    id: "meet-otter", name: "Otter.ai", category: "meeting-notes",
    summary: "영어 회의 녹음 및 실시간 텍스트 변환의 원조",
    description: "영어 회의 녹음 및 실시간 텍스트 변환의 원조",
    website: "https://otter.ai",
    thumbnail: "https://logo.clearbit.com/otter.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-lilys", name: "Lilys", category: "meeting-notes",
    summary: "긴 유튜브 영상이나 녹음 파일을 블로그 글처럼 요약 (국산)",
    description: "긴 유튜브 영상이나 녹음 파일을 블로그 글처럼 요약 (국산)",
    website: "https://lilys.ai",
    thumbnail: "https://logo.clearbit.com/lilys.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-fireflies", name: "Fireflies.ai", category: "meeting-notes",
    summary: "줌, 구글밋 등 화상회의에 자동 참여해 회의록 작성",
    description: "줌, 구글밋 등 화상회의에 자동 참여해 회의록 작성",
    website: "https://fireflies.ai",
    thumbnail: "https://logo.clearbit.com/fireflies.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-tldv", name: "tl;dv", category: "meeting-notes",
    summary: "회의 내용을 녹화하고 중요한 순간을 자동 태깅",
    description: "회의 내용을 녹화하고 중요한 순간을 자동 태깅",
    website: "https://tldv.io",
    thumbnail: "https://logo.clearbit.com/tldv.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-fathom", name: "Fathom", category: "meeting-notes",
    summary: "무료로 쓰는 줌/팀즈 회의 녹화 및 요약 비서",
    description: "무료로 쓰는 줌/팀즈 회의 녹화 및 요약 비서",
    website: "https://fathom.video",
    thumbnail: "https://logo.clearbit.com/fathom.video",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-krisp", name: "Krisp", category: "meeting-notes",
    summary: "통화 중 주변 소음(개 짖는 소리 등) 완벽 제거",
    description: "통화 중 주변 소음(개 짖는 소리 등) 완벽 제거",
    website: "https://krisp.ai",
    thumbnail: "https://logo.clearbit.com/krisp.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-supernormal", name: "Supernormal", category: "meeting-notes",
    summary: "회의 끝나자마자 깔끔한 포맷의 회의록 자동 발송",
    description: "회의 끝나자마자 깔끔한 포맷의 회의록 자동 발송",
    website: "https://supernormal.com",
    thumbnail: "https://logo.clearbit.com/supernormal.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-daglo", name: "Daglo", category: "meeting-notes",
    summary: "한국어 음성 인식률이 매우 뛰어난 받아쓰기 툴",
    description: "한국어 음성 인식률이 매우 뛰어난 받아쓰기 툴",
    website: "https://daglo.ai",
    thumbnail: "https://logo.clearbit.com/daglo.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-meetgeek", name: "MeetGeek", category: "meeting-notes",
    summary: "회의 내용을 분석해 팀의 강점과 약점까지 인사이트 제공",
    description: "회의 내용을 분석해 팀의 강점과 약점까지 인사이트 제공",
    website: "https://meetgeek.ai",
    thumbnail: "https://logo.clearbit.com/meetgeek.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-speakapp", name: "SpeakApp", category: "meeting-notes",
    summary: "아이폰 통화 녹음과 AI 텍스트 변환을 한 번에 (국산)",
    description: "아이폰 통화 녹음과 AI 텍스트 변환을 한 번에 (국산)",
    website: "https://speakapp.co.kr",
    thumbnail: "https://logo.clearbit.com/speakapp.co.kr",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-jamie", name: "Jamie", category: "meeting-notes",
    summary: "맥북 메뉴바에 상주하며 모든 회의를 요약",
    description: "맥북 메뉴바에 상주하며 모든 회의를 요약",
    website: "https://meetjamie.ai", thumbnail: "https://logo.clearbit.com/meetjamie.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-beulr", name: "Beulr", category: "meeting-notes",
    summary: "Zoom 회의에 봇을 대신 보내고 나는 땡땡이 침",
    description: "Zoom 회의에 봇을 대신 보내고 나는 땡땡이 침",
    website: "https://beulr.com", thumbnail: "https://logo.clearbit.com/beulr.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-avoma", name: "Avoma", category: "meeting-notes",
    summary: "영업 미팅과 고객 관리(CRM)에 최적화된 노트",
    description: "영업 미팅과 고객 관리(CRM)에 최적화된 노트",
    website: "https://avoma.com", thumbnail: "https://logo.clearbit.com/avoma.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-grain", name: "Grain", category: "meeting-notes",
    summary: "고객 인터뷰 영상을 공유하고 분석하기 좋음",
    description: "고객 인터뷰 영상을 공유하고 분석하기 좋음",
    website: "https://grain.com", thumbnail: "https://logo.clearbit.com/grain.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-assembly", name: "AssemblyAI", category: "meeting-notes",
    summary: "개발자를 위한 강력한 음성 인식 API",
    description: "개발자를 위한 강력한 음성 인식 API",
    website: "https://assemblyai.com", thumbnail: "https://logo.clearbit.com/assemblyai.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-sybill", name: "Sybill", category: "meeting-notes",
    summary: "상대방의 표정과 제스처까지 읽어 감정 분석",
    description: "상대방의 표정과 제스처까지 읽어 감정 분석",
    website: "https://sybill.ai", thumbnail: "https://logo.clearbit.com/sybill.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-nyota", name: "Nyota", category: "meeting-notes",
    summary: "노션과 완벽하게 연동되는 회의록 도우미",
    description: "노션과 완벽하게 연동되는 회의록 도우미",
    website: "https://nyota.ai", thumbnail: "https://logo.clearbit.com/nyota.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-tactiq", name: "Tactiq", category: "meeting-notes",
    summary: "구글밋 자막을 실시간으로 캡처해서 저장",
    description: "구글밋 자막을 실시간으로 캡처해서 저장",
    website: "https://tactiq.io", thumbnail: "https://logo.clearbit.com/tactiq.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-sembly", name: "Sembly", category: "meeting-notes",
    summary: "회의에서 결정된 행동 강령(Action Item) 자동 정리",
    description: "회의에서 결정된 행동 강령(Action Item) 자동 정리",
    website: "https://sembly.ai", thumbnail: "https://logo.clearbit.com/sembly.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "meet-airgram", name: "Airgram", category: "meeting-notes",
    summary: "회의 녹화, 스크립트, 공유를 한 번에 해결",
    description: "회의 녹화, 스크립트, 공유를 한 번에 해결",
    website: "https://airgram.io", thumbnail: "https://logo.clearbit.com/airgram.io", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 13. Etc (Productivity)
  // ===========================================
  {
    id: "etc-deepl", name: "DeepL", category: "etc",
    summary: "구글 번역기를 뛰어넘는 가장 자연스러운 AI 번역",
    description: "구글 번역기를 뛰어넘는 가장 자연스러운 AI 번역",
    website: "https://deepl.com",
    thumbnail: "https://logo.clearbit.com/deepl.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-grammarly", name: "Grammarly", category: "etc",
    summary: "영어 이메일이나 문서의 문법과 톤을 교정",
    description: "영어 이메일이나 문서의 문법과 톤을 교정",
    website: "https://grammarly.com",
    thumbnail: "https://logo.clearbit.com/grammarly.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-quillbot", name: "Quillbot", category: "etc",
    summary: "어색한 문장을 유창하게 바꿔주는 패러프레이징 툴",
    description: "어색한 문장을 유창하게 바꿔주는 패러프레이징 툴",
    website: "https://quillbot.com",
    thumbnail: "https://logo.clearbit.com/quillbot.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-chatpdf", name: "ChatPDF", category: "etc",
    summary: "PDF 파일을 올리면 챗봇처럼 대화하며 내용 파악",
    description: "PDF 파일을 올리면 챗봇처럼 대화하며 내용 파악",
    website: "https://chatpdf.com",
    thumbnail: "https://logo.clearbit.com/chatpdf.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-excelbot", name: "Excel Formula Bot", category: "etc",
    summary: "말로 설명하면 복잡한 엑셀 수식을 짜주는 비서",
    description: "말로 설명하면 복잡한 엑셀 수식을 짜주는 비서",
    website: "https://excelformulabot.com",
    thumbnail: "https://logo.clearbit.com/excelformulabot.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-goblin", name: "Goblin Tools", category: "etc",
    summary: "밥 차리기라고 쓰면 장보기부터 요리까지 할 일 쪼개줌",
    description: "밥 차리기라고 쓰면 장보기부터 요리까지 할 일 쪼개줌",
    website: "https://goblin.tools",
    thumbnail: "https://logo.clearbit.com/goblin.tools",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-pdfai", name: "PDF.ai", category: "etc",
    summary: "논문이나 계약서 등 문서를 분석하고 인용구 찾아줌",
    description: "논문이나 계약서 등 문서를 분석하고 인용구 찾아줌",
    website: "https://pdf.ai",
    thumbnail: "https://logo.clearbit.com/pdf.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-monica", name: "Monica", category: "etc",
    summary: "웹 브라우저 어디서나 쓸 수 있는 사이드바 AI 비서",
    description: "웹 브라우저 어디서나 쓸 수 있는 사이드바 AI 비서",
    website: "https://monica.im",
    thumbnail: "https://logo.clearbit.com/monica.im",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-arc", name: "Arc Search", category: "etc",
    summary: "검색하면 AI가 여러 사이트를 읽고 결과를 요약해 줌",
    description: "검색하면 AI가 여러 사이트를 읽고 결과를 요약해 줌",
    website: "https://arc.net",
    thumbnail: "https://logo.clearbit.com/arc.net",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-copyai", name: "Copy.ai", category: "etc",
    summary: "마케팅 문구, 블로그 글 등 상업적 글쓰기 자동화",
    description: "마케팅 문구, 블로그 글 등 상업적 글쓰기 자동화",
    website: "https://copy.ai",
    thumbnail: "https://logo.clearbit.com/copy.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-notion", name: "Notion AI", category: "etc",
    summary: "노션 안에서 글쓰기, 요약, 번역을 한 번에",
    description: "노션 안에서 글쓰기, 요약, 번역을 한 번에",
    website: "https://notion.so", thumbnail: "https://logo.clearbit.com/notion.so", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-mem", name: "Mem", category: "etc",
    summary: "내 생각을 알아서 정리해 주는 AI 메모 앱",
    description: "내 생각을 알아서 정리해 주는 AI 메모 앱",
    website: "https://mem.ai", thumbnail: "https://logo.clearbit.com/mem.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-rewind", name: "Rewind", category: "etc",
    summary: "내 화면의 모든 것을 기억하고 검색해 주는 도구",
    description: "내 화면의 모든 것을 기억하고 검색해 주는 도구",
    website: "https://rewind.ai", thumbnail: "https://logo.clearbit.com/rewind.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-taskade", name: "Taskade", category: "etc",
    summary: "프로젝트 관리부터 마인드맵까지 AI로 해결",
    description: "프로젝트 관리부터 마인드맵까지 AI로 해결",
    website: "https://taskade.com", thumbnail: "https://logo.clearbit.com/taskade.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-todoist", name: "Todoist (AI)", category: "etc",
    summary: "할 일 목록을 AI가 분석해 우선순위 추천",
    description: "할 일 목록을 AI가 분석해 우선순위 추천",
    website: "https://todoist.com", thumbnail: "https://logo.clearbit.com/todoist.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-morgen", name: "Morgen", category: "etc",
    summary: "모든 캘린더를 통합하고 AI로 일정 관리",
    description: "모든 캘린더를 통합하고 AI로 일정 관리",
    website: "https://morgen.so", thumbnail: "https://logo.clearbit.com/morgen.so", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-reclaim", name: "Reclaim", category: "etc",
    summary: "빈 시간을 찾아 업무와 휴식 시간을 자동 배치",
    description: "빈 시간을 찾아 업무와 휴식 시간을 자동 배치",
    website: "https://reclaim.ai", thumbnail: "https://logo.clearbit.com/reclaim.ai", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-clockwise", name: "Clockwise", category: "etc",
    summary: "팀원들의 일정을 조율해 집중 근무 시간 확보",
    description: "팀원들의 일정을 조율해 집중 근무 시간 확보",
    website: "https://getclockwise.com", thumbnail: "https://logo.clearbit.com/getclockwise.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-motion", name: "Motion", category: "etc",
    summary: "일정을 자동으로 계획해 주는 지능형 캘린더",
    description: "일정을 자동으로 계획해 주는 지능형 캘린더",
    website: "https://usemotion.com", thumbnail: "https://logo.clearbit.com/usemotion.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "etc-trevor", name: "Trevor AI", category: "etc",
    summary: "하루 계획을 드래그 앤 드롭으로 쉽게 짜는 툴",
    description: "하루 계획을 드래그 앤 드롭으로 쉽게 짜는 툴",
    website: "https://trevorai.com", thumbnail: "https://logo.clearbit.com/trevorai.com", rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 14. Marketing
  // ===========================================
  {
    id: "mkt-jasper", name: "Jasper", category: "marketing",
    summary: "마케팅 문구 작성의 원조, 브랜드 톤앤매너 학습 가능",
    description: "마케팅 문구 작성의 원조, 브랜드 톤앤매너 학습 가능",
    website: "https://jasper.ai",
    thumbnail: "https://logo.clearbit.com/jasper.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-surfer", name: "Surfer SEO", category: "marketing",
    summary: "구글 상위 노출을 위한 글쓰기 가이드를 실시간 제공",
    description: "구글 상위 노출을 위한 글쓰기 가이드를 실시간 제공",
    website: "https://surferseo.com",
    thumbnail: "https://logo.clearbit.com/surferseo.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-adcreative", name: "AdCreative.ai", category: "marketing",
    summary: "클릭률 높은 광고 배너와 문구를 수백 개 자동 생성",
    description: "클릭률 높은 광고 배너와 문구를 수백 개 자동 생성",
    website: "https://adcreative.ai",
    thumbnail: "https://logo.clearbit.com/adcreative.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-semrush", name: "Semrush", category: "marketing",
    summary: "경쟁사 분석부터 키워드 추천까지 SEO의 모든 것",
    description: "경쟁사 분석부터 키워드 추천까지 SEO의 모든 것",
    website: "https://semrush.com",
    thumbnail: "https://logo.clearbit.com/semrush.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-predis", name: "Predis.ai", category: "marketing",
    summary: "인스타그램/틱톡용 영상과 포스팅을 한 번에 생성",
    description: "인스타그램/틱톡용 영상과 포스팅을 한 번에 생성",
    website: "https://predis.ai",
    thumbnail: "https://logo.clearbit.com/predis.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-anyword", name: "Anyword", category: "marketing",
    summary: "어떤 문구가 클릭을 부를지 미리 예측 점수 제공",
    description: "어떤 문구가 클릭을 부를지 미리 예측 점수 제공",
    website: "https://anyword.com",
    thumbnail: "https://logo.clearbit.com/anyword.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-scalenut", name: "Scalenut", category: "marketing",
    summary: "긴 블로그 글 작성과 SEO 최적화를 동시에 해결",
    description: "긴 블로그 글 작성과 SEO 최적화를 동시에 해결",
    website: "https://scalenut.com",
    thumbnail: "https://logo.clearbit.com/scalenut.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-marketmuse", name: "MarketMuse", category: "marketing",
    summary: "내 콘텐츠의 권위와 경쟁력을 분석해 전략 수립",
    description: "내 콘텐츠의 권위와 경쟁력을 분석해 전략 수립",
    website: "https://marketmuse.com",
    thumbnail: "https://logo.clearbit.com/marketmuse.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-writer", name: "Writer", category: "marketing",
    summary: "기업용 마케팅 글쓰기, 보안과 가이드라인 준수",
    description: "기업용 마케팅 글쓰기, 보안과 가이드라인 준수",
    website: "https://writer.com",
    thumbnail: "https://logo.clearbit.com/writer.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "mkt-phrasee", name: "Phrasee", category: "marketing",
    summary: "이메일 오픈율을 높여주는 AI 카피라이팅",
    description: "이메일 오픈율을 높여주는 AI 카피라이팅",
    website: "https://phrasee.co",
    thumbnail: "https://logo.clearbit.com/phrasee.co",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 15. Writing
  // ===========================================
  {
    id: "write-rytr", name: "Rytr", category: "writing",
    summary: "가성비 최고, 한국어 지원 잘 되는 글쓰기 도구",
    description: "가성비 최고, 한국어 지원 잘 되는 글쓰기 도구",
    website: "https://rytr.me",
    thumbnail: "https://logo.clearbit.com/rytr.me",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-writesonic", name: "Writesonic", category: "writing",
    summary: "최신 구글 데이터 기반으로 블로그 글 작성",
    description: "최신 구글 데이터 기반으로 블로그 글 작성",
    website: "https://writesonic.com",
    thumbnail: "https://logo.clearbit.com/writesonic.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-sudowrite", name: "Sudowrite", category: "writing",
    summary: "소설가들을 위한 창작 도우미 (묘사, 전개 추천)",
    description: "소설가들을 위한 창작 도우미 (묘사, 전개 추천)",
    website: "https://sudowrite.com",
    thumbnail: "https://logo.clearbit.com/sudowrite.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-novelai", name: "NovelAI", category: "writing",
    summary: "내 취향대로 소설을 이어 써주는 서브컬처 특화 AI",
    description: "내 취향대로 소설을 이어 써주는 서브컬처 특화 AI",
    website: "https://novelai.net",
    thumbnail: "https://logo.clearbit.com/novelai.net",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-wordtune", name: "Wordtune", category: "writing",
    summary: "밋밋한 문장을 다채롭고 세련되게 바꿔줌",
    description: "밋밋한 문장을 다채롭고 세련되게 바꿔줌",
    website: "https://wordtune.com",
    thumbnail: "https://logo.clearbit.com/wordtune.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-jenni", name: "Jenni AI", category: "writing",
    summary: "논문이나 에세이 작성 시 문장 추천 및 출처 관리",
    description: "논문이나 에세이 작성 시 문장 추천 및 출처 관리",
    website: "https://jenni.ai",
    thumbnail: "https://logo.clearbit.com/jenni.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-type", name: "Type.ai", category: "writing",
    summary: "타자 치는 속도에 맞춰 문장을 미리 예측해 줌",
    description: "타자 치는 속도에 맞춰 문장을 미리 예측해 줌",
    website: "https://type.ai",
    thumbnail: "https://logo.clearbit.com/type.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-hemingway", name: "Hemingway (Plus)", category: "writing",
    summary: "복잡한 문장을 간결하고 읽기 쉽게 교정",
    description: "복잡한 문장을 간결하고 읽기 쉽게 교정",
    website: "https://hemingwayapp.com",
    thumbnail: "https://logo.clearbit.com/hemingwayapp.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-hypefury", name: "Hypefury", category: "writing",
    summary: "트위터(X)에서 바이럴 되기 좋은 스레드 작성",
    description: "트위터(X)에서 바이럴 되기 좋은 스레드 작성",
    website: "https://hypefury.com",
    thumbnail: "https://logo.clearbit.com/hypefury.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "write-blaze", name: "TextBlaze", category: "writing",
    summary: "자주 쓰는 문구를 단축키로 자동 완성 (AI 포함)",
    description: "자주 쓰는 문구를 단축키로 자동 완성 (AI 포함)",
    website: "https://blaze.today",
    thumbnail: "https://logo.clearbit.com/blaze.today",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 16. Education / Research
  // ===========================================
  {
    id: "edu-scispace", name: "Scispace", category: "education",
    summary: "논문 검색부터 분석, 요약까지 연구자를 위한 AI",
    description: "논문 검색부터 분석, 요약까지 연구자를 위한 AI",
    website: "https://typeset.io",
    thumbnail: "https://logo.clearbit.com/typeset.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-elicit", name: "Elicit", category: "education",
    summary: "연구 질문을 던지면 관련 논문을 찾아 답을 정리",
    description: "연구 질문을 던지면 관련 논문을 찾아 답을 정리",
    website: "https://elicit.com",
    thumbnail: "https://logo.clearbit.com/elicit.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-consensus", name: "Consensus", category: "education",
    summary: "과학적 근거가 필요한 질문에 논문 기반으로 답변",
    description: "과학적 근거가 필요한 질문에 논문 기반으로 답변",
    website: "https://consensus.app",
    thumbnail: "https://logo.clearbit.com/consensus.app",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-khan", name: "Khanmigo", category: "education",
    summary: "칸아카데미가 만든 소크라테스식 1:1 학습 튜터",
    description: "칸아카데미가 만든 소크라테스식 1:1 학습 튜터",
    website: "https://khanacademy.org",
    thumbnail: "https://logo.clearbit.com/khanacademy.org",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-quivr", name: "Quivr", category: "education",
    summary: "내 컴퓨터의 파일(지식)을 학습시켜 만드는 제2의 두뇌",
    description: "내 컴퓨터의 파일(지식)을 학습시켜 만드는 제2의 두뇌",
    website: "https://quivr.app",
    thumbnail: "https://logo.clearbit.com/quivr.app",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-humata", name: "Humata", category: "education",
    summary: "수백 페이지 PDF를 순식간에 읽고 질문에 답함",
    description: "수백 페이지 PDF를 순식간에 읽고 질문에 답함",
    website: "https://humata.ai",
    thumbnail: "https://logo.clearbit.com/humata.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-scholarcy", name: "Scholarcy", category: "education",
    summary: "복잡한 논문을 플래시카드 형태로 핵심만 요약",
    description: "복잡한 논문을 플래시카드 형태로 핵심만 요약",
    website: "https://scholarcy.com",
    thumbnail: "https://logo.clearbit.com/scholarcy.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-gradescope", name: "Gradescope", category: "education",
    summary: "수학, 코딩 등 시험 채점을 AI로 자동화 (교사용)",
    description: "수학, 코딩 등 시험 채점을 AI로 자동화 (교사용)",
    website: "https://gradescope.com",
    thumbnail: "https://logo.clearbit.com/gradescope.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-socratic", name: "Socratic", category: "education",
    summary: "구글이 만든 숙제 도우미, 사진 찍으면 풀이 검색",
    description: "구글이 만든 숙제 도우미, 사진 찍으면 풀이 검색",
    website: "https://socratic.org",
    thumbnail: "https://logo.clearbit.com/socratic.org",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edu-photomath", name: "Photomath", category: "education",
    summary: "수학 문제를 카메라로 비추면 풀이 과정까지 보여줌",
    description: "수학 문제를 카메라로 비추면 풀이 과정까지 보여줌",
    website: "https://photomath.com",
    thumbnail: "https://logo.clearbit.com/photomath.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 17. Chatbot / Persona
  // ===========================================
  {
    id: "chat-chatbase", name: "Chatbase", category: "chatbot",
    summary: "내 데이터를 넣으면 고객 응대용 챗봇 뚝딱 완성",
    description: "내 데이터를 넣으면 고객 응대용 챗봇 뚝딱 완성",
    website: "https://chatbase.co",
    thumbnail: "https://logo.clearbit.com/chatbase.co",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-botsonic", name: "Botsonic", category: "chatbot",
    summary: "기업용 AI 챗봇 빌더, 코딩 없이 쉽게 제작",
    description: "기업용 AI 챗봇 빌더, 코딩 없이 쉽게 제작",
    website: "https://writesonic.com/botsonic",
    thumbnail: "https://logo.clearbit.com/writesonic.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-dante", name: "Dante AI", category: "chatbot",
    summary: "GPT-4 기반의 커스텀 데이터 훈련 챗봇 플랫폼",
    description: "GPT-4 기반의 커스텀 데이터 훈련 챗봇 플랫폼",
    website: "https://dante-ai.com",
    thumbnail: "https://logo.clearbit.com/dante-ai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-myshell", name: "MyShell", category: "chatbot",
    summary: "다양한 목소리와 성격을 가진 봇을 만들고 공유",
    description: "다양한 목소리와 성격을 가진 봇을 만들고 공유",
    website: "https://myshell.ai",
    thumbnail: "https://logo.clearbit.com/myshell.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-poe", name: "Poe", category: "chatbot",
    summary: "여러 LLM 모델을 한곳에서 쓰고 봇도 만드는 플랫폼",
    description: "여러 LLM 모델을 한곳에서 쓰고 봇도 만드는 플랫폼",
    website: "https://poe.com",
    thumbnail: "https://logo.clearbit.com/poe.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-character", name: "Character.ai", category: "chatbot",
    summary: "유명인, 애니 캐릭터와 대화하는 가장 핫한 놀이터",
    description: "유명인, 애니 캐릭터와 대화하는 가장 핫한 놀이터",
    website: "https://character.ai",
    thumbnail: "https://logo.clearbit.com/character.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-janitor", name: "JanitorAI", category: "chatbot",
    summary: "규제 없이 자유로운 대화가 가능한 캐릭터 챗봇",
    description: "규제 없이 자유로운 대화가 가능한 캐릭터 챗봇",
    website: "https://janitorai.com",
    thumbnail: "https://logo.clearbit.com/janitorai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-replika", name: "Replika", category: "chatbot",
    summary: "나와 감정적인 유대를 쌓는 가장 오래된 AI 친구",
    description: "나와 감정적인 유대를 쌓는 가장 오래된 AI 친구",
    website: "https://replika.com",
    thumbnail: "https://logo.clearbit.com/replika.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-talkie", name: "Talkie", category: "chatbot",
    summary: "모바일에서 인기 있는 감성 대화 및 캐릭터 수집",
    description: "모바일에서 인기 있는 감성 대화 및 캐릭터 수집",
    website: "https://talkie-ai.com",
    thumbnail: "https://logo.clearbit.com/talkie-ai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "chat-crushon", name: "CrushOn.AI", category: "chatbot",
    summary: "검열 없는 로맨스/롤플레잉 특화 대화 서비스",
    description: "검열 없는 로맨스/롤플레잉 특화 대화 서비스",
    website: "https://crushon.ai",
    thumbnail: "https://logo.clearbit.com/crushon.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 18. Avatar
  // ===========================================
  {
    id: "avatar-heygen", name: "HeyGen", category: "avatar",
    summary: "사진 한 장으로 말하는 영상 생성, 입모양 싱크 최강",
    description: "사진 한 장으로 말하는 영상 생성, 입모양 싱크 최강",
    website: "https://heygen.com",
    thumbnail: "https://logo.clearbit.com/heygen.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-did", name: "D-ID", category: "avatar",
    summary: "말하는 얼굴 생성 API 분야의 전통 강자",
    description: "말하는 얼굴 생성 API 분야의 전통 강자",
    website: "https://d-id.com",
    thumbnail: "https://logo.clearbit.com/d-id.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-synthesia", name: "Synthesia", category: "avatar",
    summary: "기업용 교육/홍보 영상에 쓰는 전문 AI 아바타",
    description: "기업용 교육/홍보 영상에 쓰는 전문 AI 아바타",
    website: "https://synthesia.io",
    thumbnail: "https://logo.clearbit.com/synthesia.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-akool", name: "Akool", category: "avatar",
    summary: "얼굴 바꾸기(딥페이크)와 아바타 생성 고품질 툴",
    description: "얼굴 바꾸기(딥페이크)와 아바타 생성 고품질 툴",
    website: "https://akool.com",
    thumbnail: "https://logo.clearbit.com/akool.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-hedra", name: "Hedra", category: "avatar",
    summary: "감정 표현과 고개 돌림이 자유로운 차세대 아바타",
    description: "감정 표현과 고개 돌림이 자유로운 차세대 아바타",
    website: "https://hedra.com",
    thumbnail: "https://logo.clearbit.com/hedra.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-virbo", name: "Wondershare Virbo", category: "avatar",
    summary: "글로벌 상업용 영상 제작을 위한 가성비 아바타",
    description: "글로벌 상업용 영상 제작을 위한 가성비 아바타",
    website: "https://virbo.wondershare.com",
    thumbnail: "https://logo.clearbit.com/wondershare.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-argil", name: "Argil", category: "avatar",
    summary: "인플루언서를 위한 딥페이크 복제 및 영상 생성",
    description: "인플루언서를 위한 딥페이크 복제 및 영상 생성",
    website: "https://argil.ai",
    thumbnail: "https://logo.clearbit.com/argil.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-pipio", name: "Pipio", category: "avatar",
    summary: "배우 섭외 없이 텍스트로 영상 만드는 플랫폼",
    description: "배우 섭외 없이 텍스트로 영상 만드는 플랫폼",
    website: "https://pipio.ai",
    thumbnail: "https://logo.clearbit.com/pipio.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-colossyan", name: "Colossyan", category: "avatar",
    summary: "직장 내 교육(L&D) 영상 제작에 특화된 아바타",
    description: "직장 내 교육(L&D) 영상 제작에 특화된 아바타",
    website: "https://colossyan.com",
    thumbnail: "https://logo.clearbit.com/colossyan.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "avatar-hourone", name: "Hour One", category: "avatar",
    summary: "뉴스나 방송 스타일의 고화질 가상 인간 생성",
    description: "뉴스나 방송 스타일의 고화질 가상 인간 생성",
    website: "https://hourone.ai",
    thumbnail: "https://logo.clearbit.com/hourone.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 19. Web Builder
  // ===========================================
  {
    id: "web-framer", name: "Framer", category: "web-builder",
    summary: "디자이너가 코딩 없이 고퀄 웹사이트를 만드는 툴",
    description: "디자이너가 코딩 없이 고퀄 웹사이트를 만드는 툴",
    website: "https://framer.com",
    thumbnail: "https://logo.clearbit.com/framer.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-v0", name: "v0 (Vercel)", category: "web-builder",
    summary: "텍스트로 설명하면 리액트 코드를 즉시 짜줌",
    description: "텍스트로 설명하면 리액트 코드를 즉시 짜줌",
    website: "https://v0.dev",
    thumbnail: "https://logo.clearbit.com/vercel.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-websim", name: "WebSim", category: "web-builder",
    summary: "상상하는 모든 인터넷 사이트를 시뮬레이션해 줌",
    description: "상상하는 모든 인터넷 사이트를 시뮬레이션해 줌",
    website: "https://websim.ai",
    thumbnail: "https://logo.clearbit.com/websim.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-create", name: "Create", category: "web-builder",
    summary: "앱 개발 프로세스 전체를 자동화하려는 시도",
    description: "앱 개발 프로세스 전체를 자동화하려는 시도",
    website: "https://create.xyz",
    thumbnail: "https://logo.clearbit.com/create.xyz",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-relume", name: "Relume", category: "web-builder",
    summary: "피그마와 웹플로우용 사이트맵/와이어프레임 생성",
    description: "피그마와 웹플로우용 사이트맵/와이어프레임 생성",
    website: "https://relume.io",
    thumbnail: "https://logo.clearbit.com/relume.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-mixo", name: "Mixo", category: "web-builder",
    summary: "아이디어 한 줄이면 랜딩 페이지가 뚝딱 나옴",
    description: "아이디어 한 줄이면 랜딩 페이지가 뚝딱 나옴",
    website: "https://mixo.io",
    thumbnail: "https://logo.clearbit.com/mixo.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-dora", name: "Dora", category: "web-builder",
    summary: "화려한 3D 웹사이트를 글자로 명령해서 만듦",
    description: "화려한 3D 웹사이트를 글자로 명령해서 만듦",
    website: "https://dora.run",
    thumbnail: "https://logo.clearbit.com/dora.run",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-10web", name: "10Web", category: "web-builder",
    summary: "워드프레스 사이트를 AI가 자동으로 구축 및 관리",
    description: "워드프레스 사이트를 AI가 자동으로 구축 및 관리",
    website: "https://10web.io",
    thumbnail: "https://logo.clearbit.com/10web.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-pineapple", name: "Pineapple", category: "web-builder",
    summary: "블로그나 포트폴리오 사이트를 빠르게 생성",
    description: "블로그나 포트폴리오 사이트를 빠르게 생성",
    website: "https://pineapplebuilder.com",
    thumbnail: "https://logo.clearbit.com/pineapplebuilder.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "web-galileo", name: "Galileo AI", category: "web-builder",
    summary: "텍스트에서 모바일 UI 디자인(피그마) 생성",
    description: "텍스트에서 모바일 UI 디자인(피그마) 생성",
    website: "https://usegalileo.ai",
    thumbnail: "https://logo.clearbit.com/usegalileo.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 20. Game
  // ===========================================
  {
    id: "game-rosebud", name: "Rosebud AI", category: "game",
    summary: "코딩 몰라도 말로 설명해서 게임 만드는 플랫폼",
    description: "코딩 몰라도 말로 설명해서 게임 만드는 플랫폼",
    website: "https://rosebud.ai",
    thumbnail: "https://logo.clearbit.com/rosebud.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-scenario", name: "Scenario", category: "game",
    summary: "내 게임 아트 스타일을 학습시켜 무한 생성",
    description: "내 게임 아트 스타일을 학습시켜 무한 생성",
    website: "https://scenario.com",
    thumbnail: "https://logo.clearbit.com/scenario.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-layer", name: "Layer.ai", category: "game",
    summary: "게임 에셋 제작에 특화된 전문가용 생성 툴",
    description: "게임 에셋 제작에 특화된 전문가용 생성 툴",
    website: "https://layer.ai",
    thumbnail: "https://logo.clearbit.com/layer.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-inworld", name: "Inworld", category: "game",
    summary: "NPC에게 지능과 성격을 부여해 대화 가능하게 함",
    description: "NPC에게 지능과 성격을 부여해 대화 가능하게 함",
    website: "https://inworld.ai",
    thumbnail: "https://logo.clearbit.com/inworld.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-leonardo", name: "Leonardo.ai (Game)", category: "game",
    summary: "게임 아이템, 텍스처 생성에 강력한 모델 보유",
    description: "게임 아이템, 텍스처 생성에 강력한 모델 보유",
    website: "https://leonardo.ai",
    thumbnail: "https://logo.clearbit.com/leonardo.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-skybox", name: "Blockade Skybox", category: "game",
    summary: "게임 배경(스카이박스) 360도 이미지 생성",
    description: "게임 배경(스카이박스) 360도 이미지 생성",
    website: "https://skybox.blockadelabs.com",
    thumbnail: "https://logo.clearbit.com/blockadelabs.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-meshy", name: "Meshy (Game)", category: "game",
    summary: "3D 게임 오브젝트를 텍스트로 빠르게 생성",
    description: "3D 게임 오브젝트를 텍스트로 빠르게 생성",
    website: "https://meshy.ai",
    thumbnail: "https://logo.clearbit.com/meshy.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-promethean", name: "Promethean AI", category: "game",
    summary: "게임 속 환경(맵)을 알아서 배치하고 채워줌",
    description: "게임 속 환경(맵)을 알아서 배치하고 채워줌",
    website: "https://prometheanai.com",
    thumbnail: "https://logo.clearbit.com/prometheanai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-charisma", name: "Charisma.ai", category: "game",
    summary: "인터랙티브 스토리 게임을 위한 캐릭터 대화 엔진",
    description: "인터랙티브 스토리 게임을 위한 캐릭터 대화 엔진",
    website: "https://charisma.ai",
    thumbnail: "https://logo.clearbit.com/charisma.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "game-replica", name: "Replica Studios", category: "game",
    summary: "게임 캐릭터 목소리 연기를 AI로 해결",
    description: "게임 캐릭터 목소리 연기를 AI로 해결",
    website: "https://replicastudios.com",
    thumbnail: "https://logo.clearbit.com/replicastudios.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
];
