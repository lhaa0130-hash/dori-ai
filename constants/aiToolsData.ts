import { AiTool } from "@/types/content";

/**
 * AI Tools 데이터 목록 (100+ items)
 * Updated: 2026-02-04
 */
export const AI_TOOLS_DATA: AiTool[] = [
  // ===========================================
  // 1. LLM
  // ===========================================
  {
    id: "llm-chatgpt", name: "ChatGPT", category: "llm",
    summary: "AI의 표준, 가장 무난하고 강력함",
    description: "AI의 표준, 가장 무난하고 강력함",
    website: "https://chatgpt.com",
    thumbnail: "https://logo.clearbit.com/chatgpt.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-claude", name: "Claude", category: "llm",
    summary: "글쓰기와 코딩 능력이 인간에 가장 가까움",
    description: "글쓰기와 코딩 능력이 인간에 가장 가까움",
    website: "https://claude.ai",
    thumbnail: "https://logo.clearbit.com/claude.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-gemini", name: "Gemini", category: "llm",
    summary: "구글 서비스 연동 최강, 긴 글 요약 잘함",
    description: "구글 서비스 연동 최강, 긴 글 요약 잘함",
    website: "https://gemini.google.com",
    thumbnail: "https://logo.clearbit.com/google.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-perplexity", name: "Perplexity", category: "llm",
    summary: "검색과 답변을 동시에, 출처를 찾아줌",
    description: "검색과 답변을 동시에, 출처를 찾아줌",
    website: "https://perplexity.ai",
    thumbnail: "https://logo.clearbit.com/perplexity.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-copilot", name: "Microsoft Copilot", category: "llm",
    summary: "엑셀, PPT 등 오피스 업무에 최적화",
    description: "엑셀, PPT 등 오피스 업무에 최적화",
    website: "https://copilot.microsoft.com",
    thumbnail: "https://logo.clearbit.com/microsoft.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-grok", name: "Grok", category: "llm",
    summary: "트위터 정보 실시간 반영, 솔직한 답변",
    description: "트위터 정보 실시간 반영, 솔직한 답변",
    website: "https://x.ai",
    thumbnail: "https://logo.clearbit.com/x.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-llama", name: "Llama", category: "llm",
    summary: "내 컴퓨터에 설치해서 쓰는 무료 AI 최강자",
    description: "내 컴퓨터에 설치해서 쓰는 무료 AI 최강자",
    website: "https://llama.meta.com",
    thumbnail: "https://logo.clearbit.com/meta.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-mistral", name: "Mistral", category: "llm",
    summary: "가볍고 빠름, 유럽에서 만든 고성능 AI",
    description: "가볍고 빠름, 유럽에서 만든 고성능 AI",
    website: "https://mistral.ai",
    thumbnail: "https://logo.clearbit.com/mistral.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-deepseek", name: "DeepSeek", category: "llm",
    summary: "개발자 사이에서 핫한 가성비 코딩 AI",
    description: "개발자 사이에서 핫한 가성비 코딩 AI",
    website: "https://deepseek.com",
    thumbnail: "https://logo.clearbit.com/deepseek.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-notebooklm", name: "NotebookLM", category: "llm",
    summary: "내 자료만 학습해서 알려주는 똑똑한 비서",
    description: "내 자료만 학습해서 알려주는 똑똑한 비서",
    website: "https://notebooklm.google.com",
    thumbnail: "https://logo.clearbit.com/google.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 2. Image Generation
  // ===========================================
  {
    id: "img-midjourney", name: "Midjourney", category: "image-generation",
    summary: "현존 최고의 예술적 화질 (동물도감용)",
    description: "현존 최고의 예술적 화질 (동물도감용)",
    website: "https://midjourney.com",
    thumbnail: "https://logo.clearbit.com/midjourney.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-stablediffusion", name: "Stable Diffusion", category: "image-generation",
    summary: "내 맘대로 설치/개조 가능한 끝판왕",
    description: "내 맘대로 설치/개조 가능한 끝판왕",
    website: "https://stability.ai",
    thumbnail: "https://logo.clearbit.com/stability.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-dalle3", name: "DALL-E 3", category: "image-generation",
    summary: "챗지피티 안에서 말로 편하게 그림",
    description: "챗지피티 안에서 말로 편하게 그림",
    website: "https://openai.com/dall-e-3",
    thumbnail: "https://logo.clearbit.com/openai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-flux", name: "Flux", category: "image-generation",
    summary: "최근 미드저니를 위협하는 신흥 강자",
    description: "최근 미드저니를 위협하는 신흥 강자",
    website: "https://blackforestlabs.ai",
    thumbnail: "https://logo.clearbit.com/blackforestlabs.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-ideogram", name: "Ideogram", category: "image-generation",
    summary: "그림 속에 '글자(텍스트)'를 완벽하게 넣음",
    description: "그림 속에 '글자(텍스트)'를 완벽하게 넣음",
    website: "https://ideogram.ai",
    thumbnail: "https://logo.clearbit.com/ideogram.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-leonardo", name: "Leonardo.ai", category: "image-generation",
    summary: "무료 크레딧 많이 줌, 웹에서 쓰기 편함",
    description: "무료 크레딧 많이 줌, 웹에서 쓰기 편함",
    website: "https://leonardo.ai",
    thumbnail: "https://logo.clearbit.com/leonardo.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-firefly", name: "Adobe Firefly", category: "image-generation",
    summary: "포토샵 저작권 걱정 없는 안전한 생성",
    description: "포토샵 저작권 걱정 없는 안전한 생성",
    website: "https://firefly.adobe.com",
    thumbnail: "https://logo.clearbit.com/adobe.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-krea", name: "Krea AI", category: "image-generation",
    summary: "내가 대충 그린 낙서를 실시간으로 고퀄 변환",
    description: "내가 대충 그린 낙서를 실시간으로 고퀄 변환",
    website: "https://krea.ai",
    thumbnail: "https://logo.clearbit.com/krea.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-civitai", name: "Civitai", category: "image-generation",
    summary: "다양한 그림체(모델)를 공유하는 거대 커뮤니티",
    description: "다양한 그림체(모델)를 공유하는 거대 커뮤니티",
    website: "https://civitai.com",
    thumbnail: "https://logo.clearbit.com/civitai.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "img-runway", name: "Runway", category: "image-generation",
    summary: "이미지뿐만 아니라 영상 생성의 선두주자",
    description: "이미지뿐만 아니라 영상 생성의 선두주자",
    website: "https://runwayml.com", // Fixed shady link from user input
    thumbnail: "https://logo.clearbit.com/runwayml.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },

  // ===========================================
  // 3. Image Editing
  // ===========================================
  {
    id: "edit-magnific", name: "Magnific AI", category: "image-editing",
    summary: "흐릿한 사진을 초고화질로 업스케일링 (마법 수준)",
    description: "흐릿한 사진을 초고화질로 업스케일링 (마법 수준)",
    website: "https://magnific.ai",
    thumbnail: "https://logo.clearbit.com/magnific.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-canva", name: "Canva", category: "image-editing",
    summary: "매직 이레이저 등 AI 기능이 탑재된 국민 디자인 툴",
    description: "매직 이레이저 등 AI 기능이 탑재된 국민 디자인 툴",
    website: "https://canva.com",
    thumbnail: "https://logo.clearbit.com/canva.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-photoroom", name: "Photoroom", category: "image-editing",
    summary: "쇼핑몰 상품 사진 배경 제거나 합성에 최적화",
    description: "쇼핑몰 상품 사진 배경 제거나 합성에 최적화",
    website: "https://photoroom.com",
    thumbnail: "https://logo.clearbit.com/photoroom.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-clipdrop", name: "Clipdrop", category: "image-editing",
    summary: "조명 변경, 배경 제거 등 이미지 조작 종합 선물세트",
    description: "조명 변경, 배경 제거 등 이미지 조작 종합 선물세트",
    website: "https://clipdrop.co",
    thumbnail: "https://logo.clearbit.com/clipdrop.co",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "edit-topaz", name: "Topaz Photo AI", category: "image-editing",
    summary: "노이즈 제거와 선명도 개선 끝판왕 (사진가용)",
    description: "노이즈 제거와 선명도 개선 끝판왕 (사진가용)",
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

  // ===========================================
  // 6. Coding
  // ===========================================
  {
    id: "code-cursor", name: "Cursor", category: "coding",
    summary: "VS Code 기반, AI가 코드를 통째로 작성/수정해 줌",
    description: "VS Code 기반, AI가 코드를 통째로 작성/수정해 줌",
    website: "https://cursor.com",
    thumbnail: "https://logo.clearbit.com/cursor.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-github", name: "GitHub Copilot", category: "coding",
    summary: "개발자의 영혼의 단짝, 코드 자동 완성 표준",
    description: "개발자의 영혼의 단짝, 코드 자동 완성 표준",
    website: "https://github.com/features/copilot",
    thumbnail: "https://logo.clearbit.com/github.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-replit", name: "Replit", category: "coding",
    summary: "설치 없이 웹에서 바로 코딩하고 배포까지 한 번에",
    description: "설치 없이 웹에서 바로 코딩하고 배포까지 한 번에",
    website: "https://replit.com",
    thumbnail: "https://logo.clearbit.com/replit.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-supermaven", name: "Supermaven", category: "coding",
    summary: "엄청나게 빠른 속도와 긴 문맥을 자랑하는 코딩 비서",
    description: "엄청나게 빠른 속도와 긴 문맥을 자랑하는 코딩 비서",
    website: "https://supermaven.com",
    thumbnail: "https://logo.clearbit.com/supermaven.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-devin", name: "Devin", category: "coding",
    summary: "(초대형 루키) 스스로 계획하고 버그까지 잡는 완전 자율 AI 엔지니어",
    description: "(초대형 루키) 스스로 계획하고 버그까지 잡는 완전 자율 AI 엔지니어",
    website: "https://cognition.ai",
    thumbnail: "https://logo.clearbit.com/cognition.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-codeium", name: "Codeium", category: "coding",
    summary: "개인 사용자에게 무료로 풀린 고성능 코딩 도구",
    description: "개인 사용자에게 무료로 풀린 고성능 코딩 도구",
    website: "https://codeium.com",
    thumbnail: "https://logo.clearbit.com/codeium.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-tabnine", name: "Tabnine", category: "coding",
    summary: "기업 보안에 민감하다면 추천하는 안전한 코딩 AI",
    description: "기업 보안에 민감하다면 추천하는 안전한 코딩 AI",
    website: "https://tabnine.com",
    thumbnail: "https://logo.clearbit.com/tabnine.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "code-amazonq", name: "Amazon Q", category: "coding",
    summary: "AWS 클라우드 관련 코딩과 문제 해결에 특화",
    description: "AWS 클라우드 관련 코딩과 문제 해결에 특화",
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
    id: "code-cody", name: "Cody", category: "coding",
    summary: "전체 코드베이스를 이해하고 답변해 주는 똑똑한 녀석",
    description: "전체 코드베이스를 이해하고 답변해 주는 똑똑한 녀석",
    website: "https://sourcegraph.com/cody",
    thumbnail: "https://logo.clearbit.com/sourcegraph.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
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
    id: "auto-active", name: "ActivePieces", category: "automation",
    summary: "n8n처럼 오픈소스로 쓸 수 있는 가벼운 대안",
    description: "n8n처럼 오픈소스로 쓸 수 있는 가벼운 대안",
    website: "https://activepieces.com",
    thumbnail: "https://logo.clearbit.com/activepieces.com",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
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
