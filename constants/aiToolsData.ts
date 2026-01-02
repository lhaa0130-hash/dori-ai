import { AiTool } from "@/types/content";

/**
 * AI Tools 데이터 목록
 * 
 * @description AI Tools 페이지에 표시될 도구 데이터입니다.
 * 각 항목은 AiTool 타입을 따르며, 카테고리별로 분류되어 있습니다.
 * 대중적이고 널리 사용되는 AI 도구만 포함합니다.
 */
export const AI_TOOLS_DATA: AiTool[] = [
  // =====================================================================================
  // 1. LLM (대화형/언어모델) - 대중적인 4개
  // =====================================================================================
  {
    id: "llm-01",
    name: "ChatGPT",
    category: "llm",
    description: "OpenAI가 개발한 가장 대중적인 대화형 AI로, GPT-4o 모델을 기반으로 텍스트 생성, 코딩, 번역, 분석 등 다양한 작업을 수행합니다. 직관적인 인터페이스와 강력한 성능으로 전 세계 수억 명이 사용하고 있습니다.",
    summary: "대화형 AI의 표준, GPT-4o 탑재",
    strength: "다양한 작업을 통합적으로 처리하는 범용성과 직관적인 인터페이스",
    website: "https://chat.openai.com",
    releaseDate: "2022.11",
    pricing: "Free / $20 mo",
    tags: ["Chat", "Coding", "Writing"],
    thumbnail: "https://logo.clearbit.com/openai.com",
    company: "OpenAI",
    rating: 0,
    ratingCount: 0,
    userRatings: [],
    comments: []
  },
  {
    id: "llm-02", name: "Claude 3", category: "llm",
    description: "Anthropic이 개발한 인간다운 대화형 AI로, 특히 긴 문서 분석과 정확한 문맥 이해에 뛰어납니다. 안전성과 정직성을 중시하는 설계 철학으로 신뢰할 수 있는 AI 어시스턴트 역할을 합니다.",
    summary: "가장 인간다운 문맥 이해력을 가진 AI",
    strength: "긴 문서 분석과 정확한 문맥 이해, 안전성과 신뢰성",
    website: "https://claude.ai", releaseDate: "2024.03", pricing: "Free / $20 mo", tags: ["Writing", "Analysis", "Long-context"],
    thumbnail: "https://logo.clearbit.com/anthropic.com",
    company: "Anthropic",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  {
    id: "llm-03", name: "Gemini", category: "llm",
    description: "Google이 개발한 멀티모달 AI 모델로, 텍스트, 이미지, 음성을 동시에 처리할 수 있습니다. Gmail, Google Docs, YouTube 등 구글 서비스와 완벽하게 통합되어 생산성을 극대화합니다.",
    summary: "구글 생태계와 완벽하게 연동되는 멀티모달",
    strength: "텍스트, 이미지, 음성을 동시에 처리하는 멀티모달 능력과 구글 서비스 통합",
    website: "https://gemini.google.com", releaseDate: "2023.12", pricing: "Free / $20 mo", tags: ["Multimodal", "Google"],
    thumbnail: "https://logo.clearbit.com/google.com",
    company: "Google",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  { id: "llm-04", name: "Perplexity", category: "llm", summary: "실시간 검색 기반 답변 엔진.", description: "실시간 웹 검색과 AI 답변을 결합한 혁신적인 검색 엔진입니다. 모든 답변에 출처를 명시하여 신뢰성을 보장하며, 최신 정보를 빠르게 찾아 요약해줍니다.", strength: "실시간 검색과 출처 명시로 신뢰할 수 있는 최신 정보 제공", releaseDate: "2022.08", website: "https://perplexity.ai", pricing: "Free / $20 mo", tags: ["Search", "Citations"], thumbnail: "https://logo.clearbit.com/perplexity.ai", company: "Perplexity", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "llm-05", name: "Grok", category: "llm", summary: "xAI의 위트 있는 AI.", description: "엘론 머스크의 xAI가 개발한 AI로, X(트위터)의 실시간 데이터에 접근할 수 있어 최신 트렌드와 뉴스를 반영합니다. 유머러스하고 솔직한 답변 스타일이 특징입니다.", strength: "X(트위터) 실시간 데이터 접근과 유머러스한 답변 스타일", releaseDate: "2023.11", website: "https://x.ai", pricing: "Paid (X Premium)", tags: ["Real-time", "Humor"], thumbnail: "https://logo.clearbit.com/x.ai", company: "xAI", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 2. Image Generation (이미지 생성) - 대중적인 7개
  // =====================================================================================
  {
    id: "img-gen-01", name: "Midjourney", category: "image-generation",
    summary: "가장 예술적인 이미지 생성기.",
    description: "Discord 봇 형태로 동작하는 이미지 생성 AI로, 현존하는 AI 중 가장 뛰어난 예술적 화질과 창의성을 자랑합니다. 미술, 일러스트, 컨셉 아트 제작에 최적화되어 있습니다.",
    strength: "현존 최고 수준의 예술적 화질과 창의적인 이미지 생성",
    releaseDate: "2022.07", website: "https://midjourney.com", pricing: "$10~$120 mo", tags: ["High Quality", "Art"],
    thumbnail: "https://logo.clearbit.com/midjourney.com",
    company: "Midjourney",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  { id: "img-gen-02", name: "DALL-E 3", category: "image-generation", summary: "ChatGPT 안에서 그리는 그림.", description: "OpenAI가 개발한 이미지 생성 AI로, ChatGPT Plus 구독 시 사용할 수 있습니다. 프롬프트를 정확하게 이해하며 이미지 내 텍스트 렌더링 능력이 뛰어나 로고나 포스터 제작에 적합합니다.", strength: "프롬프트 정확한 이해와 이미지 내 텍스트 렌더링 능력", releaseDate: "2023.10", website: "https://openai.com/dall-e-3", pricing: "Included in ChatGPT Plus", tags: ["Simple", "Text Rendering"], thumbnail: "https://logo.clearbit.com/openai.com", company: "OpenAI", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-gen-03", name: "Stable Diffusion", category: "image-generation", summary: "로컬 설치 가능한 오픈소스.", description: "Stability AI가 개발한 오픈소스 이미지 생성 모델로, PC에 직접 설치하여 무료로 무제한 이미지를 생성할 수 있습니다. ControlNet, LoRA 등 다양한 확장 기능을 지원합니다.", strength: "로컬 설치 가능한 오픈소스와 무제한 무료 생성, 확장 기능 풍부", releaseDate: "2022.08", website: "https://stability.ai", pricing: "Free (Open Source)", tags: ["Local", "ControlNet"], thumbnail: "https://logo.clearbit.com/stability.ai", company: "Stability AI", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-gen-04", name: "Leonardo.ai", category: "image-generation", summary: "게임 에셋과 아트에 특화.", description: "게임 개발자와 아티스트를 위한 이미지 생성 플랫폼으로, 다양한 커스텀 모델을 제공합니다. 게임 아이템, 캐릭터, 배경 등 게임 에셋 제작에 최적화되어 있으며 직관적인 UI를 제공합니다.", strength: "게임 에셋 제작 최적화와 직관적인 UI, 다양한 커스텀 모델", releaseDate: "2022.12", website: "https://leonardo.ai", pricing: "Free / Paid", tags: ["Game Asset", "Easy UI"], thumbnail: "https://logo.clearbit.com/leonardo.ai", company: "Leonardo.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-gen-05", name: "Adobe Firefly", category: "image-generation", summary: "상업적 사용이 안전한 AI.", description: "Adobe가 개발한 상업적 이용이 안전한 이미지 생성 AI로, Adobe Stock 이미지로만 학습되어 저작권 문제가 없습니다. Photoshop, Illustrator 등 어도비 제품군과 완벽하게 통합됩니다.", strength: "상업적 사용 안전성과 어도비 제품군 완벽 통합", releaseDate: "2023.03", website: "https://firefly.adobe.com", pricing: "Free / Credits", tags: ["Commercial", "Photoshop"], thumbnail: "https://logo.clearbit.com/adobe.com", company: "Adobe", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-gen-06", name: "Ideogram", category: "image-generation", summary: "텍스트 타이포그래피 최강자.", description: "이미지 내에 정확한 글자를 삽입하는 능력이 매우 뛰어납니다.", strength: "이미지 내 정확한 텍스트 삽입 능력", releaseDate: "2023.08", website: "https://ideogram.ai", pricing: "Free / Paid", tags: ["Typography", "Logo"], thumbnail: "https://logo.clearbit.com/ideogram.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-gen-07", name: "Bing Image Creator", category: "image-generation", summary: "DALL-E 3 기반 무료 생성기.", description: "MS 계정만 있으면 무료로 고품질 이미지를 생성할 수 있습니다.", strength: "MS 계정만으로 무료 고품질 이미지 생성", website: "https://bing.com/images/create", releaseDate: "2023.03", pricing: "Free", tags: ["Microsoft", "Free"], thumbnail: "https://logo.clearbit.com/bing.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 3. Image Editing (이미지 편집) - 대중적인 5개
  // =====================================================================================
  { id: "img-edit-01", name: "Clipdrop", category: "image-editing", summary: "이미지 편집 및 생성 도구 모음.", description: "배경 제거, 조명 조절 등 다양한 AI 편집 도구를 제공합니다.", strength: "다양한 AI 편집 도구를 한곳에 모은 올인원 솔루션", website: "https://clipdrop.co", releaseDate: "2020.07", pricing: "Free / Paid", tags: ["Editing", "Tools"], thumbnail: "https://logo.clearbit.com/clipdrop.co", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-edit-02", name: "Getimg.ai", category: "image-editing", summary: "올인원 이미지 생성 및 편집.", description: "생성, 인페인팅, 아웃페인팅 등 다양한 기능을 한곳에서 제공합니다.", strength: "이미지 생성부터 편집까지 모든 기능을 통합 제공", website: "https://getimg.ai", releaseDate: "2022", pricing: "Free / Paid", tags: ["Editor", "Suite"], thumbnail: "https://logo.clearbit.com/getimg.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-edit-03", name: "Remove.bg", category: "image-editing", summary: "AI 배경 제거 전문 도구.", description: "한 번의 클릭으로 이미지 배경을 완벽하게 제거하는 가장 인기 있는 도구입니다.", strength: "한 번의 클릭으로 완벽한 배경 제거, 가장 정확한 결과", website: "https://remove.bg", releaseDate: "2018", pricing: "Free / Paid", tags: ["Background", "Removal"], thumbnail: "https://logo.clearbit.com/remove.bg", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-edit-04", name: "Photopea", category: "image-editing", summary: "웹 기반 무료 포토샵 대체.", description: "브라우저에서 실행되는 강력한 이미지 편집 도구로, Photoshop과 유사한 기능을 무료로 제공합니다.", strength: "브라우저에서 실행되는 무료 포토샵 대체 도구", website: "https://photopea.com", releaseDate: "2013", pricing: "Free", tags: ["Web", "Photoshop"], thumbnail: "https://logo.clearbit.com/photopea.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "img-edit-05", name: "Canva Photo Editor", category: "image-editing", summary: "캔바의 AI 이미지 편집 기능.", description: "Canva 플랫폼 내에서 배경 제거, 자동 향상, 필터 등 다양한 AI 편집 기능을 제공합니다.", strength: "Canva 플랫폼과 통합된 간편한 AI 편집 기능", website: "https://canva.com", releaseDate: "2023", pricing: "Free / Paid", tags: ["Canva", "Easy"], thumbnail: "https://logo.clearbit.com/canva.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 4. Video Generation (영상 생성) - 대중적인 5개
  // =====================================================================================
  {
    id: "vid-gen-01", name: "Runway", category: "video-generation",
    summary: "영상 생성 AI의 선두주자.",
    description: "텍스트 투 비디오, 모션 브러쉬 등 다양한 제어 기능을 제공합니다.",
    strength: "텍스트 투 비디오와 모션 브러쉬 등 정밀한 제어 기능",
    releaseDate: "2023.06", website: "https://runwayml.com", pricing: "Free Trial / Paid", tags: ["Gen-2", "Motion Brush"],
    thumbnail: "https://logo.clearbit.com/runwayml.com",
    company: "Runway",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  { id: "vid-gen-02", name: "Pika", category: "video-generation", summary: "애니메이션에 강한 생성기.", description: "누구나 쉽게 사용하는 영상 생성.", strength: "애니메이션 생성에 특화된 쉬운 사용성", website: "https://pika.art", releaseDate: "2023.12", pricing: "Free / Paid", tags: ["Animation", "Easy"], thumbnail: "https://logo.clearbit.com/pika.art", company: "Pika", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "vid-gen-03", name: "Sora", category: "video-generation", summary: "OpenAI의 혁명적 비디오 모델.", description: "최대 1분 길이의 고해상도 영상을 물리 법칙에 맞게 생성합니다. (현재 제한적 공개)", strength: "물리 법칙을 따르는 최대 1분 고해상도 영상 생성", releaseDate: "2024.02", pricing: "Unreleased", tags: ["Realistic", "OpenAI"], thumbnail: "https://logo.clearbit.com/openai.com", company: "OpenAI", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "vid-gen-04", name: "Luma Dream Machine", category: "video-generation", summary: "고퀄리티 무료 영상 생성.", description: "빠른 생성 속도와 높은 퀄리티를 무료로 체험할 수 있습니다.", strength: "빠른 생성 속도와 높은 퀄리티를 무료로 제공", releaseDate: "2024.06", website: "https://lumalabs.ai", pricing: "Free / Paid", tags: ["High Quality", "Fast"], thumbnail: "https://logo.clearbit.com/lumalabs.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "vid-gen-05", name: "Kling", category: "video-generation", summary: "중국의 고성능 비디오 모델.", description: "Sora에 버금가는 긴 영상 생성 능력과 자연스러운 움직임을 보여줍니다.", strength: "긴 영상 생성 능력과 자연스러운 움직임 표현", releaseDate: "2024.06", website: "https://kling.kuaishou.com", pricing: "Free / Paid", tags: ["Long Video", "Realistic"], thumbnail: "https://logo.clearbit.com/kuaishou.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 5. Video Editing (영상 편집) - 대중적인 5개
  // =====================================================================================
  { id: "vid-edit-01", name: "Veed.io", category: "video-editing", summary: "AI 기반 온라인 영상 편집기.", description: "자동 자막, 컷 편집 등 AI 기능을 갖춘 웹 기반 에디터입니다.", strength: "자동 자막 생성과 AI 기반 편집 기능이 강점인 웹 에디터", website: "https://veed.io", releaseDate: "2018", pricing: "Free / Paid", tags: ["Editing", "Subtitles"], thumbnail: "https://logo.clearbit.com/veed.io", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "vid-edit-02", name: "InVideo", category: "video-editing", summary: "텍스트로 비디오 만들기.", description: "스크립트만 입력하면 스톡 영상을 조합해 비디오를 완성해줍니다.", strength: "스크립트만으로 스톡 영상을 자동 조합하여 비디오 생성", website: "https://invideo.io", releaseDate: "2017", pricing: "Free / Paid", tags: ["Marketing", "Text-to-Video"], thumbnail: "https://logo.clearbit.com/invideo.io", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "vid-edit-03", name: "CapCut", category: "video-editing", summary: "바이트댄스의 무료 영상 편집기.", description: "모바일과 데스크톱 모두 지원하는 강력한 무료 영상 편집 도구로, AI 기능이 풍부합니다.", strength: "모바일과 데스크톱 모두 지원하는 무료 AI 편집 도구", website: "https://capcut.com", releaseDate: "2020", pricing: "Free", tags: ["Free", "Mobile"], thumbnail: "https://logo.clearbit.com/capcut.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "vid-edit-04", name: "Descript", category: "video-editing", summary: "오디오/영상 편집을 문서처럼.", description: "텍스트를 수정하면 영상도 수정되는 혁신적인 편집 방식입니다.", strength: "텍스트 수정으로 영상을 편집하는 혁신적인 방식", website: "https://descript.com", releaseDate: "2017.12", pricing: "Free / Paid", tags: ["Text-based", "Editing"], thumbnail: "https://logo.clearbit.com/descript.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "vid-edit-05", name: "Fliki", category: "video-editing", summary: "텍스트를 비디오와 음성으로.", description: "블로그 글이나 트윗을 영상으로 빠르게 변환해주는 툴입니다.", strength: "블로그 글이나 트윗을 영상으로 빠르게 변환", website: "https://fliki.ai", releaseDate: "2022", pricing: "Free / Paid", tags: ["Blog-to-Video", "Social"], thumbnail: "https://logo.clearbit.com/fliki.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 6. Voice TTS (음성 변환) - 대중적인 5개
  // =====================================================================================
  {
    id: "voice-tts-01", name: "ElevenLabs", category: "voice-tts",
    summary: "가장 자연스러운 TTS.",
    description: "감정 표현이 가능한 최고의 텍스트 음성 변환 AI입니다.",
    strength: "감정 표현이 가능한 가장 자연스러운 음성 생성",
    website: "https://elevenlabs.io", releaseDate: "2023.01", pricing: "Free / Paid", tags: ["TTS", "Voice Cloning"],
    thumbnail: "https://logo.clearbit.com/elevenlabs.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  { id: "voice-tts-02", name: "Murf AI", category: "voice-tts", summary: "스튜디오 품질의 AI 보이스오버.", description: "영상 내레이션 및 프레젠테이션용 보이스 생성.", strength: "스튜디오 품질의 전문적인 보이스오버 생성", website: "https://murf.ai", releaseDate: "2020.10", pricing: "Free / Paid", tags: ["Voiceover", "Studio"], thumbnail: "https://logo.clearbit.com/murf.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "voice-tts-03", name: "PlayHT", category: "voice-tts", summary: "초현실적인 AI 음성 생성기.", description: "팟캐스트 및 오디오북 제작에 최적화되어 있습니다.", strength: "팟캐스트와 오디오북 제작에 최적화된 초현실적 음성", website: "https://play.ht", releaseDate: "2020.08", pricing: "Free / Paid", tags: ["Podcast", "Ultra Realistic"], thumbnail: "https://logo.clearbit.com/play.ht", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "voice-tts-04", name: "Lovo", category: "voice-tts", summary: "감정 표현이 풍부한 AI 성우.", description: "다양한 감정과 스타일의 목소리를 제공합니다.", strength: "다양한 감정과 스타일을 표현하는 AI 성우", website: "https://lovo.ai", releaseDate: "2019.11", pricing: "Free / Paid", tags: ["Genny", "Emotion"], thumbnail: "https://logo.clearbit.com/lovo.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "voice-tts-05", name: "Speechify", category: "voice-tts", summary: "텍스트를 오디오로 읽어주는 도구.", description: "문서, 웹페이지를 듣기 편한 음성으로 변환합니다.", strength: "문서와 웹페이지를 듣기 편한 음성으로 변환", website: "https://speechify.com", releaseDate: "2017.01", pricing: "Free / Paid", tags: ["Productivity", "Reading"], thumbnail: "https://logo.clearbit.com/speechify.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 7. Music (음악 생성) - 대중적인 5개
  // =====================================================================================
  { id: "music-01", name: "Suno", category: "music", summary: "AI 작곡 혁명.", description: "가사와 스타일만 입력하면 노래를 작곡하고 불러줍니다.", strength: "가사와 스타일만으로 완성된 노래를 작곡하고 불러주는 능력", website: "https://suno.com", releaseDate: "2023.12", pricing: "Free / Paid", tags: ["Music", "Song"], thumbnail: "https://logo.clearbit.com/suno.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "music-02", name: "Udio", category: "music", summary: "고음질 음악 생성.", description: "음질이 뛰어나고 음악적 구조가 탄탄한 노래를 생성합니다.", strength: "뛰어난 음질과 탄탄한 음악적 구조의 노래 생성", website: "https://udio.com", releaseDate: "2024.04", pricing: "Free / Paid", tags: ["High Fidelity", "Music"], thumbnail: "https://logo.clearbit.com/udio.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "music-03", name: "Soundraw", category: "music", summary: "저작권 없는 AI 음악 생성.", description: "영상 배경음악으로 쓰기 좋은 음악을 커스터마이징합니다.", strength: "저작권 없는 영상 배경음악 커스터마이징", website: "https://soundraw.io", releaseDate: "2020", pricing: "Free / Paid", tags: ["BGM", "Creator"], thumbnail: "https://logo.clearbit.com/soundraw.io", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "music-04", name: "AIVA", category: "music", summary: "클래식 및 영화 음악 작곡.", description: "감동적인 오케스트라 및 영화 음악 스타일에 강점이 있습니다.", strength: "오케스트라와 영화 음악 스타일의 전문 작곡", website: "https://aiva.ai", releaseDate: "2016", pricing: "Free / Paid", tags: ["Composer", "Orchestra"], thumbnail: "https://logo.clearbit.com/aiva.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "music-05", name: "Boomy", category: "music", summary: "누구나 쉽게 노래 만들기.", description: "몇 번의 클릭으로 노래를 만들고 스트리밍 사이트에 배포까지 가능합니다.", strength: "몇 번의 클릭으로 노래 제작부터 배포까지 원스톱", website: "https://boomy.com", releaseDate: "2019", pricing: "Free / Paid", tags: ["Easy", "Distribution"], thumbnail: "https://logo.clearbit.com/boomy.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 8. Automation (자동화) - 대중적인 5개
  // =====================================================================================
  {
    id: "auto-01", name: "n8n", category: "automation",
    description: "워크플로우 자동화를 위한 공정한 코드 기반 툴.",
    summary: "복잡한 업무 자동화도 노코드로 해결",
    strength: "복잡한 워크플로우를 노코드로 자동화하는 강력한 도구",
    website: "https://n8n.io", releaseDate: "2019.10", pricing: "Free / Enterprise", tags: ["Workflow", "No-code"],
    thumbnail: "https://logo.clearbit.com/n8n.io",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  { id: "auto-02", name: "Make", category: "automation", summary: "시각적 자동화 도구.", description: "직관적인 비주얼 오토메이션 플랫폼.", strength: "직관적인 비주얼 인터페이스로 복잡한 자동화 구축", website: "https://make.com", releaseDate: "2016", pricing: "Free / Paid", tags: ["Workflow", "Integration"], thumbnail: "https://logo.clearbit.com/make.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "auto-03", name: "Zapier", category: "automation", summary: "가장 많은 앱을 연동하는 자동화.", description: "5000개 이상의 앱을 손쉽게 연결.", strength: "5000개 이상의 앱을 연결하는 가장 넓은 통합 범위", website: "https://zapier.com", releaseDate: "2011.08", pricing: "Free / Paid", tags: ["Integration", "Easy"], thumbnail: "https://logo.clearbit.com/zapier.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "auto-04", name: "IFTTT", category: "automation", summary: "간단한 조건문 자동화.", description: "일상 생활 자동화에 최적화된 서비스.", strength: "간단한 조건문으로 일상 생활 자동화에 최적화", website: "https://ifttt.com", releaseDate: "2010.12", pricing: "Free / Paid", tags: ["IoT", "Personal"], thumbnail: "https://logo.clearbit.com/ifttt.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "auto-05", name: "Bardeen", category: "automation", summary: "브라우저 기반 AI 자동화.", description: "웹 브라우저에서 반복 작업을 대신해주는 AI.", strength: "브라우저에서 반복 작업을 자동화하는 AI 어시스턴트", website: "https://bardeen.ai", releaseDate: "2020.05", pricing: "Free / Paid", tags: ["Browser", "Scraping"], thumbnail: "https://logo.clearbit.com/bardeen.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 9. Search (검색) - 대중적인 5개
  // =====================================================================================
  {
    id: "search-01", name: "Perplexity", category: "search",
    description: "답변과 함께 출처를 제공하는 AI 검색.",
    summary: "신뢰할 수 있는 대화형 검색 엔진",
    strength: "실시간 검색과 출처 명시로 신뢰할 수 있는 정보 제공",
    website: "https://perplexity.ai", releaseDate: "2022.08", pricing: "Free / $20", tags: ["Search", "Citations"],
    thumbnail: "https://logo.clearbit.com/perplexity.ai",
    rating: 0, ratingCount: 0, userRatings: [], comments: []
  },
  { id: "search-02", name: "Bing Chat", category: "search", summary: "GPT-4 기반 마이크로소프트 검색.", description: "웹 검색과 결합된 강력한 생성형 답변.", strength: "웹 검색과 결합된 강력한 생성형 답변 제공", website: "https://bing.com/chat", releaseDate: "2023.02", pricing: "Free", tags: ["Microsoft", "GPT-4"], thumbnail: "https://logo.clearbit.com/bing.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "search-03", name: "You.com", category: "search", summary: "개인화된 AI 검색 어시스턴트.", description: "다양한 모드를 제공하는 사생활 보호 검색.", strength: "개인화된 검색과 사생활 보호 기능", website: "https://you.com", releaseDate: "2021.11", pricing: "Free / Paid", tags: ["Private", "Assistant"], thumbnail: "https://logo.clearbit.com/you.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "search-04", name: "Arc Search", category: "search", summary: "브라우저가 대신 검색.", description: "여러 페이지를 읽고 요약해주는 모바일 검색.", strength: "여러 페이지를 읽고 요약해주는 스마트 검색", website: "https://arc.net", releaseDate: "2024.01", pricing: "Free", tags: ["Browser", "Summary"], thumbnail: "https://logo.clearbit.com/arc.net", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "search-05", name: "Phind", category: "search", summary: "개발자를 위한 AI 검색.", description: "코딩 질문에 최적화된 답변 제공.", strength: "개발자와 코딩 질문에 특화된 검색 엔진", website: "https://phind.com", releaseDate: "2023", pricing: "Free / Paid", tags: ["Developer", "Coding"], thumbnail: "https://logo.clearbit.com/phind.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "search-06", name: "Google Anti Gravity", category: "search", summary: "구글의 실험적 검색 AI.", description: "Google이 개발한 혁신적인 검색 기술로, 중력처럼 정보를 끌어당기는 방식으로 관련성 높은 결과를 제공합니다.", strength: "중력처럼 정보를 끌어당기는 혁신적인 검색 기술", website: "https://google.com", releaseDate: "2024", pricing: "Free", tags: ["Google", "Experimental", "Search"], thumbnail: "https://logo.clearbit.com/google.com", company: "Google", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 10. Agent (AI 에이전트) - 대중적인 5개
  // =====================================================================================
  { id: "agent-01", name: "AutoGPT", category: "agent", summary: "자율 AI 에이전트의 시초.", description: "목표를 설정하면 스스로 계획을 세우고 실행하는 오픈소스 에이전트.", strength: "목표 설정만으로 자율적으로 계획 수립 및 실행", website: "https://news.agpt.co", releaseDate: "2023.03", pricing: "Open Source", tags: ["Autonomous", "Open Source"], thumbnail: "https://logo.clearbit.com/github.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "agent-02", name: "AgentGPT", category: "agent", summary: "웹에서 실행하는 자율 에이전트.", description: "브라우저에서 바로 목표를 입력하고 실행 과정을 지켜볼 수 있습니다.", strength: "브라우저에서 바로 실행 가능한 쉬운 자율 에이전트", website: "https://agentgpt.reworkd.ai", releaseDate: "2023.04", pricing: "Free / Paid", tags: ["Web", "Easy"], thumbnail: "https://logo.clearbit.com/reworkd.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "agent-03", name: "Character.ai", category: "agent", summary: "페르소나 챗봇.", description: "다양한 캐릭터와 대화할 수 있는 엔터테인먼트 에이전트.", strength: "다양한 캐릭터와의 대화형 엔터테인먼트 경험", website: "https://character.ai", releaseDate: "2022", pricing: "Free / Paid", tags: ["Chat", "Fun"], thumbnail: "https://logo.clearbit.com/character.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "agent-04", name: "BabyAGI", category: "agent", summary: "간결한 작업 관리 에이전트.", description: "작업을 생성하고 우선순위를 정해 실행하는 파이썬 스크립트.", strength: "작업 생성과 우선순위 자동 관리", website: "https://github.com/yoheinakajima/babyagi", releaseDate: "2023.03", pricing: "Open Source", tags: ["Task", "Python"], thumbnail: "https://logo.clearbit.com/github.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "agent-05", name: "Lindy", category: "agent", summary: "모든 업무를 처리하는 AI 비서.", description: "이메일 관리, 일정 예약 등 개인 비서 역할을 수행합니다.", strength: "이메일 관리와 일정 예약 등 종합적인 비서 기능", website: "https://lindy.ai", releaseDate: "2023", pricing: "Paid", tags: ["Assistant", "Task"], thumbnail: "https://logo.clearbit.com/lindy.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 11. Coding (코딩 보조) - 대중적인 5개
  // =====================================================================================
  { id: "code-01", name: "GitHub Copilot", category: "coding", summary: "AI 코딩 파트너.", description: "가장 널리 쓰이는 코드 자동 완성 및 제안 도구.", strength: "가장 널리 사용되는 코드 자동 완성 및 제안", website: "https://github.com/features/copilot", releaseDate: "2021", pricing: "Paid", tags: ["Completion", "Microsoft"], thumbnail: "https://logo.clearbit.com/github.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "code-02", name: "Cursor", category: "coding", summary: "AI 네이티브 코드 에디터.", description: "VS Code 기반으로 AI 기능이 내장된 강력한 에디터.", strength: "VS Code 기반의 AI 네이티브 통합 에디터", website: "https://cursor.sh", releaseDate: "2023", pricing: "Free / Paid", tags: ["Editor", "Chat"], thumbnail: "https://logo.clearbit.com/cursor.sh", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "code-03", name: "Tabnine", category: "coding", summary: "프라이버시 중심 코드 완성.", description: "개인정보 보호를 중시하는 AI 코딩 어시스턴트.", strength: "개인정보 보호를 중시하는 안전한 코드 완성", website: "https://tabnine.com", releaseDate: "2018", pricing: "Free / Paid", tags: ["Privacy", "Completion"], thumbnail: "https://logo.clearbit.com/tabnine.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "code-04", name: "Codeium", category: "coding", summary: "빠르고 무료인 코딩 도구.", description: "개인 개발자에게 무료로 제공되는 고성능 자동 완성.", strength: "개인 개발자에게 무료로 제공되는 고성능 자동 완성", website: "https://codeium.com", releaseDate: "2022", pricing: "Free / Enterprise", tags: ["Free", "Fast"], thumbnail: "https://logo.clearbit.com/codeium.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "code-05", name: "Claude Code", category: "coding", summary: "Anthropic의 코딩 특화 AI.", description: "Claude 모델을 기반으로 한 코딩에 최적화된 AI 어시스턴트로, 코드 생성, 리뷰, 디버깅 등 개발 작업을 효율적으로 지원합니다.", strength: "코드 생성, 리뷰, 디버깅을 통합 지원하는 코딩 특화 AI", website: "https://claude.ai", releaseDate: "2024", pricing: "Free / Paid", tags: ["Coding", "Anthropic", "Code Review"], thumbnail: "https://logo.clearbit.com/anthropic.com", company: "Anthropic", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 12. Design (디자인) - 대중적인 5개
  // =====================================================================================
  { id: "design-01", name: "Canva", category: "design", summary: "누구나 쉽게 하는 AI 디자인.", description: "Magic Studio 기능을 통해 이미지, 텍스트 등을 AI로 편집.", strength: "누구나 쉽게 사용할 수 있는 AI 디자인 도구", website: "https://canva.com", releaseDate: "2013", pricing: "Free / Paid", tags: ["Easy", "Graphic"], thumbnail: "https://logo.clearbit.com/canva.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "design-02", name: "Figma AI", category: "design", summary: "UI/UX 디자인의 미래.", description: "디자인 자동화 및 생성 기능을 갖춘 협업 툴.", strength: "디자인 자동화와 협업 기능이 강점인 UI/UX 툴", website: "https://figma.com", releaseDate: "2016", pricing: "Free / Paid", tags: ["UI/UX", "Pro"], thumbnail: "https://logo.clearbit.com/figma.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "design-03", name: "Uizard", category: "design", summary: "스케치를 UI로 변환.", description: "손그림이나 텍스트로 앱/웹 디자인 시안을 생성.", strength: "손그림이나 텍스트를 UI 디자인으로 자동 변환", website: "https://uizard.io", releaseDate: "2018", pricing: "Free / Paid", tags: ["Prototype", "Wireframe"], thumbnail: "https://logo.clearbit.com/uizard.io", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "design-04", name: "Looka", category: "design", summary: "AI 로고 메이커.", description: "브랜드 아이덴티티에 맞는 로고와 브랜드 키트 생성.", strength: "브랜드 아이덴티티에 맞는 로고와 브랜드 키트 자동 생성", website: "https://looka.com", releaseDate: "2016", pricing: "Paid", tags: ["Logo", "Brand"], thumbnail: "https://logo.clearbit.com/looka.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "design-05", name: "Galileo AI", category: "design", summary: "텍스트 투 UI 디자인.", description: "설명만으로 고퀄리티 인터페이스 디자인을 생성.", strength: "텍스트 설명만으로 고퀄리티 UI 디자인 생성", website: "https://usegalileo.ai", releaseDate: "2023", pricing: "Paid", tags: ["Generative UI", "Figma"], thumbnail: "https://logo.clearbit.com/usegalileo.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 13. 3D (3D 생성) - 대중적인 5개
  // =====================================================================================
  { id: "3d-01", name: "Meshy AI 3D", category: "3d", summary: "AI 기반 3D 모델 생성.", description: "텍스트나 이미지로부터 고품질 3D 모델을 생성하는 AI 도구로, 게임 개발, AR/VR, 제품 디자인 등 다양한 분야에서 활용됩니다.", strength: "텍스트나 이미지로부터 고품질 3D 모델 생성", website: "https://meshy.ai", releaseDate: "2023", pricing: "Free / Paid", tags: ["3D", "Modeling", "Text-to-3D"], thumbnail: "https://logo.clearbit.com/meshy.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "3d-02", name: "Luma Genie", category: "3d", summary: "3D 모델 생성 AI.", description: "텍스트로 3D 자산을 빠르게 생성합니다.", strength: "텍스트로 3D 자산을 빠르게 생성하는 능력", website: "https://lumalabs.ai/genie", releaseDate: "2023", pricing: "Free / Paid", tags: ["3D", "Asset"], thumbnail: "https://logo.clearbit.com/lumalabs.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "3d-03", name: "Spline AI", category: "3d", summary: "AI 3D 디자인 툴.", description: "프롬프트로 3D 씬과 객체를 생성하고 편집.", strength: "프롬프트로 3D 씬과 객체를 생성하고 편집하는 통합 도구", website: "https://spline.design/ai", releaseDate: "2023", pricing: "Free / Paid", tags: ["3D", "Web"], thumbnail: "https://logo.clearbit.com/spline.design", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "3d-04", name: "Rodin", category: "3d", summary: "고품질 3D 모델 생성 AI.", description: "이미지나 텍스트로부터 사실적인 3D 모델을 생성하는 도구입니다.", strength: "이미지나 텍스트로부터 사실적인 고품질 3D 모델 생성", website: "https://rodin.ai", releaseDate: "2024", pricing: "Free / Paid", tags: ["3D", "High Quality"], thumbnail: "https://logo.clearbit.com/rodin.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "3d-05", name: "CSM AI", category: "3d", summary: "3D 자산 생성 플랫폼.", description: "게임 개발자와 디자이너를 위한 3D 모델 생성 도구입니다.", strength: "게임 개발자와 디자이너를 위한 전문 3D 자산 생성", website: "https://csm.ai", releaseDate: "2023", pricing: "Free / Paid", tags: ["3D", "Game Asset"], thumbnail: "https://logo.clearbit.com/csm.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 14. Writing (글쓰기) - 대중적인 5개
  // =====================================================================================
  { id: "writing-01", name: "Jasper", category: "writing", summary: "마케팅 콘텐츠 생성.", description: "블로그, 광고 문구 등 마케팅에 특화된 글쓰기 AI.", strength: "마케팅 콘텐츠와 카피라이팅에 특화된 전문 도구", website: "https://jasper.ai", releaseDate: "2021.01", pricing: "Paid", tags: ["Marketing", "Copywriting"], thumbnail: "https://logo.clearbit.com/jasper.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "writing-02", name: "Copy.ai", category: "writing", summary: "카피라이팅 자동화.", description: "다양한 템플릿으로 빠른 카피라이팅 지원.", strength: "다양한 템플릿으로 빠른 카피라이팅 자동화", website: "https://copy.ai", releaseDate: "2020.10", pricing: "Free / Paid", tags: ["Copywriting", "Social"], thumbnail: "https://logo.clearbit.com/copy.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "writing-03", name: "GrammarlyGO", category: "writing", summary: "AI 문법 교정 및 작성.", description: "영어 문법 교정을 넘어 문맥에 맞는 글쓰기 제안.", strength: "문법 교정을 넘어 문맥에 맞는 글쓰기 제안", website: "https://grammarly.com", releaseDate: "2023", pricing: "Free / Paid", tags: ["Grammar", "Correction"], thumbnail: "https://logo.clearbit.com/grammarly.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "writing-04", name: "Quillbot", category: "writing", summary: "패러프레이징 도구.", description: "문장을 재구성하여 표절을 피하고 표현을 다듬는 툴.", strength: "문장 재구성으로 표절 방지와 표현 개선", website: "https://quillbot.com", releaseDate: "2017", pricing: "Free / Paid", tags: ["Paraphrase", "Writing"], thumbnail: "https://logo.clearbit.com/quillbot.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "writing-05", name: "Writesonic", category: "writing", summary: "SEO 최적화 글쓰기.", description: "검색 엔진 상위 노출을 위한 콘텐츠 작성.", strength: "SEO 최적화된 콘텐츠 작성으로 검색 상위 노출", website: "https://writesonic.com", releaseDate: "2020", pricing: "Free / Paid", tags: ["SEO", "Blog"], thumbnail: "https://logo.clearbit.com/writesonic.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 15. Translation (번역) - 대중적인 5개
  // =====================================================================================
  { id: "translation-01", name: "DeepL", category: "translation", summary: "가장 자연스러운 번역기.", description: "뉘앙스를 살리는 고품질 AI 번역.", strength: "뉘앙스를 살리는 가장 자연스러운 고품질 번역", website: "https://deepl.com", releaseDate: "2017.08", pricing: "Free / Paid", tags: ["Translation", "Language"], thumbnail: "https://logo.clearbit.com/deepl.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "translation-02", name: "Google Translate", category: "translation", summary: "가장 널리 쓰이는 번역기.", description: "100개 이상의 언어를 지원하는 구글의 무료 번역 서비스입니다.", strength: "100개 이상의 언어를 지원하는 가장 널리 쓰이는 번역기", website: "https://translate.google.com", releaseDate: "2006", pricing: "Free", tags: ["Google", "Multi-language"], thumbnail: "https://logo.clearbit.com/google.com", company: "Google", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "translation-03", name: "Microsoft Translator", category: "translation", summary: "마이크로소프트의 번역 서비스.", description: "다양한 플랫폼과 앱에서 사용 가능한 번역 도구입니다.", strength: "다양한 플랫폼과 앱에서 사용 가능한 통합 번역 도구", website: "https://translator.microsoft.com", releaseDate: "2011", pricing: "Free / Paid", tags: ["Microsoft", "API"], thumbnail: "https://logo.clearbit.com/microsoft.com", company: "Microsoft", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "translation-04", name: "Papago", category: "translation", summary: "네이버의 한국어 특화 번역기.", description: "한국어 번역에 특화된 네이버의 AI 번역 서비스입니다.", strength: "한국어 번역에 특화된 정확한 번역 서비스", website: "https://papago.naver.com", releaseDate: "2017", pricing: "Free", tags: ["Korean", "Naver"], thumbnail: "https://logo.clearbit.com/navercorp.com", company: "Naver", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "translation-05", name: "Reverso", category: "translation", summary: "컨텍스트 기반 번역 도구.", description: "문맥과 예문을 함께 제공하는 고급 번역 서비스입니다.", strength: "문맥과 예문을 함께 제공하는 컨텍스트 기반 번역", website: "https://reverso.net", releaseDate: "1998", pricing: "Free / Paid", tags: ["Context", "Examples"], thumbnail: "https://logo.clearbit.com/reverso.net", rating: 0, ratingCount: 0, userRatings: [], comments: [] },

  // =====================================================================================
  // 16. Presentation (프레젠테이션) - 대중적인 5개
  // =====================================================================================
  { id: "presentation-01", name: "Gamma", category: "presentation", summary: "AI 프레젠테이션 생성.", description: "텍스트만 입력하면 디자인된 슬라이드와 문서를 생성.", strength: "텍스트만으로 디자인된 슬라이드와 문서 자동 생성", website: "https://gamma.app", releaseDate: "2022", pricing: "Free / Paid", tags: ["Slide", "Design"], thumbnail: "https://logo.clearbit.com/gamma.app", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "presentation-02", name: "Tome", category: "presentation", summary: "스토리텔링 형식의 슬라이드.", description: "모바일 친화적이고 인터랙티브한 스토리북 생성.", strength: "모바일 친화적이고 인터랙티브한 스토리텔링 슬라이드", website: "https://tome.app", releaseDate: "2022", pricing: "Free / Paid", tags: ["Storytelling", "Slide"], thumbnail: "https://logo.clearbit.com/tome.app", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "presentation-03", name: "Beautiful.ai", category: "presentation", summary: "자동 디자인 슬라이드.", description: "내용을 넣으면 레이아웃을 알아서 잡아주는 PPT 툴.", strength: "내용 입력만으로 자동 레이아웃 디자인", website: "https://beautiful.ai", releaseDate: "2016", pricing: "Paid", tags: ["Presentation", "Design"], thumbnail: "https://logo.clearbit.com/beautiful.ai", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "presentation-04", name: "Decktopus", category: "presentation", summary: "가장 빠른 PPT 생성기.", description: "주제만 입력하면 완벽한 구조의 프레젠테이션 완성.", strength: "주제만으로 완벽한 구조의 프레젠테이션 빠른 생성", website: "https://decktopus.com", releaseDate: "2020", pricing: "Free / Paid", tags: ["Fast", "PPT"], thumbnail: "https://logo.clearbit.com/decktopus.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
  { id: "presentation-05", name: "Pitch", category: "presentation", summary: "협업 중심 프레젠테이션 도구.", description: "팀 협업에 최적화된 현대적인 프레젠테이션 플랫폼입니다.", strength: "팀 협업에 최적화된 현대적인 프레젠테이션 플랫폼", website: "https://pitch.com", releaseDate: "2019", pricing: "Free / Paid", tags: ["Collaboration", "Modern"], thumbnail: "https://logo.clearbit.com/pitch.com", rating: 0, ratingCount: 0, userRatings: [], comments: [] },
];
