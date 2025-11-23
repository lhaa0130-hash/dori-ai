"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

// 댓글 타입 정의
type Comment = {
  id: number;
  user: string;
  text: string;
  date: string;
  rating: number;
};

export default function StudioPage() {
  const { data: session } = useSession();
  const user = session?.user || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  
  const [tools, setTools] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  const [hoverState, setHoverState] = useState<{id: number, score: number} | null>(null);

  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState("INFO");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    loadTools();
  }, []);

  function loadTools() {
    // ★ v10: 평점 완전 초기화 버전
    const savedTools = JSON.parse(localStorage.getItem("dori_tools_v10") || "[]");
    const savedVotes = JSON.parse(localStorage.getItem("dori_my_votes_v10") || "{}");

    setMyVotes(savedVotes);

    if (savedTools.length === 0) {
      // ★ 초기 데이터: rating: 0, reviews: 0 으로 설정
      const initialData = [
        // 1. [LLM & Chatbots]
        { 
          id: 101, title: "ChatGPT", category: "LLM", desc: "가장 똑똑하고 범용적인 대화형 AI 표준", logo: "https://logo.clearbit.com/openai.com", price: "Freemium", rating: 0, reviews: 0, link: "https://chat.openai.com",
          history: "2022년 11월 OpenAI가 출시한 대화형 인공지능. GPT-3.5를 시작으로 전 세계적인 AI 붐을 일으켰습니다.", news: "GPT-4o 모델 업데이트로 음성, 이미지, 텍스트를 실시간으로 처리하는 멀티모달 기능 강화.", commentsList: []
        },
        { id: 102, title: "Claude", category: "LLM", desc: "자연스러운 한국어와 뛰어난 코딩/작문 능력", logo: "https://logo.clearbit.com/anthropic.com", price: "Free", rating: 0, reviews: 0, link: "https://claude.ai", history: "OpenAI 출신 연구원들이 설립한 Anthropic에서 개발. 안전하고 윤리적인 AI를 지향합니다.", news: "Claude 3.5 Sonnet 출시 이후 코딩 및 작문 성능에서 압도적인 평가를 받고 있습니다.", commentsList: [] },
        { id: 103, title: "Perplexity", category: "LLM", desc: "실시간 검색 기반 AI 엔진", logo: "https://logo.clearbit.com/perplexity.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.perplexity.ai", history: "전통적인 검색엔진을 대체하기 위해 등장. 답변과 함께 정확한 출처(Citations)를 제공하는 것이 특징.", news: "최근 기업가치 급상승 및 다양한 LLM 모델(Claude, GPT-4)을 선택하여 검색할 수 있는 기능 제공.", commentsList: [] },
        { id: 104, title: "Gemini", category: "LLM", desc: "구글 생태계 연동 멀티모달 AI", logo: "https://logo.clearbit.com/deepmind.google", price: "Free", rating: 0, reviews: 0, link: "https://gemini.google.com", history: "구글의 바드(Bard)가 리브랜딩된 서비스. 구글 워크스페이스와의 강력한 연동성을 자랑함.", news: "1.5 Pro 모델 업데이트로 긴 문맥 처리 능력이 획기적으로 향상됨.", commentsList: [] },
        { id: 105, title: "Grok", category: "LLM", desc: "X(트위터) 데이터 기반의 실시간 대화형 AI", logo: "https://logo.clearbit.com/x.ai", price: "Paid", rating: 0, reviews: 0, link: "https://grok.x.ai", history: "일론 머스크의 xAI가 개발. 유머러스하고 반항적인 성격을 가진 것이 특징.", news: "이미지 인식 기능 추가 및 처리 속도 개선.", commentsList: [] },
        { id: 106, title: "Mistral", category: "LLM", desc: "유럽 최고의 성능을 자랑하는 오픈소스 기반 모델", logo: "https://logo.clearbit.com/mistral.ai", price: "Paid", rating: 0, reviews: 0, link: "https://mistral.ai", history: "프랑스 스타트업 Mistral AI가 개발. 효율적인 파라미터 수로 높은 성능을 냄.", news: "Codestral 모델 출시로 코딩 보조 기능 강화.", commentsList: [] },
        { id: 107, title: "Copilot", category: "LLM", desc: "MS Office와 결합된 생산성 향상 AI", logo: "https://logo.clearbit.com/microsoft.com", price: "Freemium", rating: 0, reviews: 0, link: "https://copilot.microsoft.com", history: "Bing Chat이 리브랜딩됨. GPT-4 기술을 기반으로 윈도우 및 오피스에 통합.", news: "Copilot PC 출시로 하드웨어와 AI의 결합 가속화.", commentsList: [] },
        { id: 108, title: "Llama", category: "LLM", desc: "메타(Meta)에서 공개한 고성능 오픈소스 LLM", logo: "https://logo.clearbit.com/meta.com", price: "Free", rating: 0, reviews: 0, link: "https://llama.meta.com", history: "연구 및 상업적 이용이 가능한 오픈소스 모델로 AI 민주화에 기여.", news: "Llama 3 공개로 오픈소스 모델의 성능 기준을 한 단계 높임.", commentsList: [] },
        { id: 109, title: "Poe", category: "LLM", desc: "여러 AI 봇을 한곳에서 사용하는 플랫폼", logo: "https://logo.clearbit.com/poe.com", price: "Freemium", rating: 0, reviews: 0, link: "https://poe.com", history: "Quora에서 만든 AI 챗봇 플랫폼. 사용자가 직접 봇을 만들고 공유할 수 있음.", news: "크리에이터 수익화 모델 도입.", commentsList: [] },
        { id: 110, title: "Jasper", category: "LLM", desc: "마케팅 카피라이팅에 특화된 작문 AI", logo: "https://logo.clearbit.com/jasper.ai", price: "Paid", rating: 0, reviews: 0, link: "https://www.jasper.ai", history: "마케터를 위한 템플릿과 브랜드 보이스 기능을 제공하여 빠르게 성장.", news: "기업용 솔루션 강화 및 API 확장.", commentsList: [] },

        // 2. [IMAGE Generation]
        { id: 201, title: "Midjourney", category: "IMAGE", desc: "예술적 퀄리티와 표현력이 압도적인 생성 툴", logo: "https://logo.clearbit.com/midjourney.com", price: "Paid", rating: 0, reviews: 0, link: "https://midjourney.com", history: "데이비드 홀츠가 설립한 독립 연구소. 디스코드 기반으로 시작하여 독보적인 예술적 화풍을 구축.", news: "웹사이트에서 직접 이미지를 생성할 수 있는 기능이 알파 테스트 중.", commentsList: [] },
        { id: 202, title: "Stable Diffusion", category: "IMAGE", desc: "내 PC에 설치해 제한 없이 쓰는 강력한 도구", logo: "https://logo.clearbit.com/stability.ai", price: "Free", rating: 0, reviews: 0, link: "https://stability.ai", history: "Stability AI가 공개한 오픈소스 모델. 전 세계 개발자들이 다양한 파생 모델과 로라(LoRA)를 제작함.", news: "SD3 모델 발표로 텍스트 렌더링 능력이 크게 개선됨.", commentsList: [] },
        { id: 203, title: "DALL-E 3", category: "IMAGE", desc: "ChatGPT 안에서 대화하듯 그리는 쉬운 툴", logo: "https://logo.clearbit.com/openai.com", price: "Paid", rating: 0, reviews: 0, link: "https://openai.com/dall-e-3", history: "OpenAI의 이미지 생성 모델. 자연어 이해도가 매우 높아 복잡한 프롬프트도 잘 반영함.", news: "ChatGPT 내 편집 기능 추가로 생성된 이미지의 특정 부분만 수정 가능해짐.", commentsList: [] },
        { id: 204, title: "Leonardo.ai", category: "IMAGE", desc: "게임 에셋과 캐릭터 생성에 특화된 플랫폼", logo: "https://logo.clearbit.com/leonardo.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://leonardo.ai", history: "스테이블 디퓨전 기반이지만 독자적인 모델과 뛰어난 UI 제공.", news: "실시간 캔버스 기능 및 모션 기능 강화.", commentsList: [] },
        { id: 205, title: "Adobe Firefly", category: "IMAGE", desc: "저작권 걱정 없는 상업용 이미지 생성", logo: "https://logo.clearbit.com/adobe.com", price: "Freemium", rating: 0, reviews: 0, link: "https://firefly.adobe.com", history: "어도비 스톡 이미지만을 학습하여 저작권 문제 해결.", news: "포토샵 생성형 채우기 기능 통합.", commentsList: [] },
        { id: 206, title: "Krea", category: "IMAGE", desc: "실시간 드로잉 및 고해상도 업스케일링", logo: "https://logo.clearbit.com/krea.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.krea.ai", history: "사용자의 스케치를 실시간으로 고퀄리티 이미지로 변환.", news: "비디오 생성 기능 추가.", commentsList: [] },
        { id: 207, title: "Ideogram", category: "IMAGE", desc: "이미지 내 텍스트(타이포그래피) 표현력 최강", logo: "https://logo.clearbit.com/ideogram.ai", price: "Free", rating: 0, reviews: 0, link: "https://ideogram.ai", history: "기존 모델들이 어려워하던 텍스트 렌더링 문제를 해결하며 등장.", news: "v1.0 모델 출시로 사실성 향상.", commentsList: [] },
        { id: 208, title: "Playground", category: "IMAGE", desc: "쉽고 빠르게 이미지를 생성하고 편집하는 툴", logo: "https://logo.clearbit.com/playgroundai.com", price: "Free", rating: 0, reviews: 0, link: "https://playgroundai.com", history: "직관적인 인터페이스와 필터 기능으로 초보자에게 인기.", news: "자체 모델 v2.5 공개.", commentsList: [] },
        { id: 209, title: "Civitai", category: "IMAGE", desc: "스테이블 디퓨전 모델 커뮤니티", logo: "https://logo.clearbit.com/civitai.com", price: "Free", rating: 0, reviews: 0, link: "https://civitai.com", history: "전 세계 모델 공유의 중심.", news: "온사이트 생성 기능 지원.", commentsList: [] },
        { id: 210, title: "Recraft", category: "IMAGE", desc: "벡터 그래픽 및 아이콘 생성", logo: "https://logo.clearbit.com/recraft.ai", price: "Free", rating: 0, reviews: 0, link: "https://www.recraft.ai", history: "디자이너를 위한 벡터 AI.", news: "피그마 플러그인 지원.", commentsList: [] },

        // 3. [VIDEO Creation]
        { id: 301, title: "Runway", category: "VIDEO", desc: "텍스트로 영화 같은 영상 제작", logo: "https://logo.clearbit.com/runwayml.com", price: "Freemium", rating: 0, reviews: 0, link: "https://runwayml.com", history: "영상 생성 AI의 선구자.", news: "Gen-3 Alpha 공개.", commentsList: [] },
        { id: 302, title: "Pika", category: "VIDEO", desc: "이미지 움직임 효과 최강자", logo: "https://logo.clearbit.com/pika.art", price: "Free", rating: 0, reviews: 0, link: "https://pika.art", history: "애니메이션 스타일에 강점.", news: "Lip Sync 기능.", commentsList: [] },
        { id: 303, title: "Sora", category: "VIDEO", desc: "OpenAI의 혁명적인 비디오 모델", logo: "https://logo.clearbit.com/openai.com", price: "Waitlist", rating: 0, reviews: 0, link: "https://openai.com/sora", history: "최대 1분 길이의 고해상도 영상.", news: "영상 업계와 협업 중.", commentsList: [] },
        { id: 304, title: "Luma Dream Machine", category: "VIDEO", desc: "5초 만에 고퀄리티 영상 무료 생성", logo: "https://logo.clearbit.com/lumalabs.ai", price: "Free", rating: 0, reviews: 0, link: "https://lumalabs.ai", history: "3D 기술 기업 Luma AI 개발.", news: "공개 직후 큰 인기.", commentsList: [] },
        { id: 305, title: "HeyGen", category: "VIDEO", desc: "실제 사람 같은 AI 아바타 영상", logo: "https://logo.clearbit.com/heygen.com", price: "Paid", rating: 0, reviews: 0, link: "https://www.heygen.com", history: "기업용 아바타 솔루션.", news: "실시간 번역 기능.", commentsList: [] },
        { id: 306, title: "Kling", category: "VIDEO", desc: "중국에서 만든 소라(Sora)급 생성기", logo: "https://logo.clearbit.com/kuaishou.com", price: "Free", rating: 0, reviews: 0, link: "https://kling.kwai.com", history: "Kuaishou 개발.", news: "글로벌 버전 출시.", commentsList: [] },
        { id: 307, title: "Haiper", category: "VIDEO", desc: "예술적인 비디오 생성 특화", logo: "https://logo.clearbit.com/haiper.ai", price: "Free", rating: 0, reviews: 0, link: "https://haiper.ai", history: "구글 딥마인드 출신 설립.", news: "v1.5 업데이트.", commentsList: [] },
        { id: 308, title: "Kaiber", category: "VIDEO", desc: "애니메이션 스타일 뮤직비디오", logo: "https://logo.clearbit.com/kaiber.ai", price: "Paid", rating: 0, reviews: 0, link: "https://kaiber.ai", history: "Linkin Park MV 제작.", news: "오디오 반응형 생성.", commentsList: [] },
        { id: 309, title: "Synthesia", category: "VIDEO", desc: "기업용 AI 아바타 프레젠테이션", logo: "https://logo.clearbit.com/synthesia.io", price: "Paid", rating: 0, reviews: 0, link: "https://www.synthesia.io", history: "기업 교육 영상 표준.", news: "감정 표현 아바타.", commentsList: [] },
        { id: 310, title: "D-ID", category: "VIDEO", desc: "사진 한 장으로 말하는 영상 만들기", logo: "https://logo.clearbit.com/d-id.com", price: "Freemium", rating: 0, reviews: 0, link: "https://www.d-id.com", history: "정지 사진 애니메이션화.", news: "실시간 대화 에이전트.", commentsList: [] },

        // 4. [MUSIC & AUDIO]
        { id: 401, title: "Suno", category: "MUSIC", desc: "가사만 입력하면 작곡/보컬까지 완성", logo: "https://logo.clearbit.com/suno.com", price: "Free", rating: 0, reviews: 0, link: "https://suno.com", history: "음악 생성의 혁명.", news: "v3.5 모델 업데이트.", commentsList: [] },
        { id: 402, title: "Udio", category: "MUSIC", desc: "고음질 음악 생성의 강력한 경쟁자", logo: "https://logo.clearbit.com/udio.com", price: "Free", rating: 0, reviews: 0, link: "https://www.udio.com", history: "구글 딥마인드 출신 개발.", news: "오디오 인페인팅 지원.", commentsList: [] },
        { id: 403, title: "AIVA", category: "MUSIC", desc: "클래식, 영화 음악 작곡 AI", logo: "https://logo.clearbit.com/aiva.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.aiva.ai", history: "작곡 보조 툴.", news: "MIDI 파일 내보내기.", commentsList: [] },
        { id: 404, title: "Soundraw", category: "MUSIC", desc: "저작권 걱정 없는 크리에이터 BGM", logo: "https://logo.clearbit.com/soundraw.io", price: "Paid", rating: 0, reviews: 0, link: "https://soundraw.io", history: "영상용 BGM 생성.", news: "Premiere Pro 플러그인.", commentsList: [] },
        { id: 405, title: "Boomy", category: "MUSIC", desc: "쉽게 비트 만들고 발매까지", logo: "https://logo.clearbit.com/boomy.com", price: "Free", rating: 0, reviews: 0, link: "https://boomy.com", history: "음악 비전공자용.", news: "스트리밍 수익 배분.", commentsList: [] },
        
        // 5. [VOICE]
        { id: 501, title: "ElevenLabs", category: "VOICE", desc: "가장 자연스러운 TTS 및 보이스 클로닝", logo: "https://logo.clearbit.com/elevenlabs.io", price: "Freemium", rating: 0, reviews: 0, link: "https://elevenlabs.io", history: "음성 합성 1위.", news: "다국어 더빙 기능.", commentsList: [] },
        { id: 502, title: "Murf", category: "VOICE", desc: "스튜디오 품질 AI 성우 나레이션", logo: "https://logo.clearbit.com/murf.ai", price: "Paid", rating: 0, reviews: 0, link: "https://murf.ai", history: "나레이션 제작 툴.", news: "Canva 연동.", commentsList: [] },
        { id: 503, title: "Lovo", category: "VOICE", desc: "감정 표현이 풍부한 AI 보이스", logo: "https://logo.clearbit.com/lovo.ai", price: "Paid", rating: 0, reviews: 0, link: "https://lovo.ai", history: "감정 연기 특화.", news: "Genny 업데이트.", commentsList: [] },
        
        // 6. [AUDIO Engineering]
        { id: 601, title: "Adobe Podcast", category: "AUDIO", desc: "음성을 스튜디오 품질로 향상", logo: "https://logo.clearbit.com/podcast.adobe.com", price: "Free", rating: 0, reviews: 0, link: "https://podcast.adobe.com", history: "AI 음질 향상.", news: "무료 공개로 인기.", commentsList: [] },
        { id: 602, title: "Auphonic", category: "AUDIO", desc: "오디오 레벨링/노이즈 제거 자동화", logo: "https://logo.clearbit.com/auphonic.com", price: "Freemium", rating: 0, reviews: 0, link: "https://auphonic.com", history: "팟캐스트 후처리.", news: "영상 파일 지원.", commentsList: [] },
        { id: 603, title: "Krisp", category: "AUDIO", desc: "통화 중 소음/에코 제거", logo: "https://logo.clearbit.com/krisp.ai", price: "Free", rating: 0, reviews: 0, link: "https://krisp.ai", history: "노이즈 캔슬링.", news: "회의 요약 기능.", commentsList: [] },

        // 7. [AUTOMATION]
        { id: 701, title: "Make", category: "AUTOMATION", desc: "복잡한 워크플로우 시각적 자동화", logo: "https://logo.clearbit.com/make.com", price: "Freemium", rating: 0, reviews: 0, link: "https://www.make.com", history: "구 Integromat.", news: "AI 에이전트 통합.", commentsList: [] },
        { id: 702, title: "Zapier", category: "AUTOMATION", desc: "앱 연동 자동화의 대명사", logo: "https://logo.clearbit.com/zapier.com", price: "Freemium", rating: 0, reviews: 0, link: "https://zapier.com", history: "가장 많은 앱 지원.", news: "Zapier Canvas 출시.", commentsList: [] },
        { id: 703, title: "n8n", category: "AUTOMATION", desc: "자유로운 오픈소스 워크플로우", logo: "https://logo.clearbit.com/n8n.io", price: "Free", rating: 0, reviews: 0, link: "https://n8n.io", history: "자체 호스팅 가능.", news: "LangChain 연동.", commentsList: [] },
      ];
      
      setTools(initialData);
      localStorage.setItem("dori_tools_v10", JSON.stringify(initialData));
    } else {
      setTools(savedTools);
    }
  }

  function onLogout() { signOut({ callbackUrl: "/" }); }

  // ★ 간편 평가 (리뷰 없이 별점만 줘도 OK)
  const handleVote = (id: number, score: number) => {
    if (!user) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const previousVote = myVotes[id];
    
    const updatedTools = tools.map(tool => {
      if (tool.id === id) {
        let newRating, newReviewCount;
        if (previousVote) {
          // 점수 수정 로직
          const currentTotalScore = tool.rating * tool.reviews;
          const newTotalScore = currentTotalScore - previousVote + score;
          newReviewCount = tool.reviews; 
          newRating = newTotalScore / newReviewCount;
        } else {
          // 신규 투표 로직 (리뷰 없어도 카운트 증가)
          const currentTotalScore = tool.rating * tool.reviews;
          newReviewCount = tool.reviews + 1;
          newRating = (currentTotalScore + score) / newReviewCount;
        }
        // NaN 방지 (0/0 일 경우)
        if (isNaN(newRating)) newRating = score;

        return { ...tool, rating: parseFloat(newRating.toFixed(2)), reviews: newReviewCount };
      }
      return tool;
    });

    // 랭킹 재정렬
    const sortedTools = updatedTools.sort((a, b) => {
        if (a.reviews === 0 && b.reviews === 0) return 0;
        if (a.reviews === 0) return 1;
        if (b.reviews === 0) return -1;
        return b.rating - a.rating;
    });

    setTools(sortedTools);
    const newMyVotes = { ...myVotes, [id]: score };
    setMyVotes(newMyVotes);

    localStorage.setItem("dori_tools_v10", JSON.stringify(sortedTools));
    localStorage.setItem("dori_my_votes_v10", JSON.stringify(newMyVotes));
    
    alert("평가가 반영되었습니다!");
  };

  // 상세 리뷰 작성
  const handleReviewSubmit = () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!reviewText.trim()) return alert("리뷰 내용을 입력해주세요.");

    const newComment: Comment = {
      id: Date.now(),
      user: user.name || "익명",
      text: reviewText,
      date: new Date().toLocaleDateString(),
      rating: reviewRating
    };

    const updatedTools = tools.map(tool => {
      if (tool.id === selectedTool.id) {
        const updatedTool = { ...tool, commentsList: [newComment, ...(tool.commentsList || [])] };
        // 리뷰 작성 시에도 평점 반영 (이미 투표했으면 수정으로 처리됨)
        handleVote(tool.id, reviewRating);
        return updatedTool;
      }
      return tool;
    });

    const sortedTools = updatedTools.sort((a, b) => {
       if (a.reviews === 0 && b.reviews === 0) return 0;
       return b.rating - a.rating;
    });
    setTools(sortedTools);
    localStorage.setItem("dori_tools_v10", JSON.stringify(sortedTools));
    
    const newSelectedTool = sortedTools.find(t => t.id === selectedTool.id);
    setSelectedTool(newSelectedTool);
    setReviewText("");
    // alert는 handleVote에서 띄우므로 여기선 생략하거나 중복 방지
  };

  const categoryList = [
    { key: "LLM", label: "🤖 Chat & LLM" },
    { key: "IMAGE", label: "🎨 Image Gen" },
    { key: "VIDEO", label: "🎬 Video Gen" },
    { key: "MUSIC", label: "🎵 Music Gen" },
    { key: "VOICE", label: "🗣️ Voice AI" },
    { key: "AUDIO", label: "🎧 Audio Edit" },
    { key: "AUTOMATION", label: "⚡ Automation" },
  ];

  const activeCategories = selectedCategory === "ALL" 
    ? categoryList 
    : categoryList.filter(c => c.key === selectedCategory);

  return (
    <main className="page">
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "80vh", paddingTop: "60px" }}>
        <div className="page-header">
          <h1 className="page-title">AI Tools Ranking</h1>
          <p className="page-desc">
            분야별 최고의 AI 툴 랭킹.<br/>
            직접 사용해본 툴을 평가(⭐)하고 공유하세요.
          </p>
        </div>

        <div className="filter-bar">
          <div className="category-tabs">
            <button className={`tab-btn ${selectedCategory === "ALL" ? 'active' : ''}`} onClick={() => setSelectedCategory("ALL")}>전체 보기</button>
            {categoryList.map((cat) => (
              <button key={cat.key} className={`tab-btn ${selectedCategory === cat.key ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.key)}>{cat.label}</button>
            ))}
          </div>
          <div className="search-wrap">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <span className="icon">🔍</span>
          </div>
        </div>

        <div className="ranking-content">
          {activeCategories.map((cat) => {
            let categoryTools = tools.filter(t => t.category === cat.key).filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // 리뷰 없는 건 맨 뒤로
            categoryTools.sort((a, b) => {
                if (a.reviews === 0 && b.reviews === 0) return 0;
                if (a.reviews === 0) return 1;
                if (b.reviews === 0) return -1;
                return b.rating - a.rating;
            });

            if (categoryTools.length === 0) return null;

            return (
              <div key={cat.key} className="category-section">
                <h2 className="section-title">{cat.label}</h2>
                <div className="ranking-grid">
                  {categoryTools.map((item, index) => {
                    const hasRank = item.reviews > 0;
                    const rank = hasRank ? index + 1 : null;
                    const isTop3 = rank && rank <= 3;

                    return (
                      <div key={item.id} className={`resource-card ${isTop3 ? `rank-${rank}` : ''}`} onClick={() => setSelectedTool(item)}>
                        {hasRank && <div className="rank-badge">{rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}</div>}
                        
                        <div className="card-top">
                          <div className="card-logo-wrap">
                            <img src={item.logo} alt={item.title} className="card-logo" onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60?text=AI'} />
                          </div>
                          <span className={`price-badge ${item.price === 'Free' ? 'free' : ''}`}>{item.price}</span>
                        </div>
                        
                        <div className="card-info">
                          <h3>{item.title}</h3>
                          <p>{item.desc}</p>
                        </div>

                        <div className="rating-area" onMouseLeave={() => setHoverState(null)}>
                          <div className="current-rating">
                            {item.reviews > 0 ? (
                                <>
                                    <span className="star-icon">⭐</span> 
                                    <span className="score">{item.rating}</span>
                                    <span className="count">({item.reviews})</span>
                                </>
                            ) : <span className="no-rating">평가 대기중</span>}
                          </div>
                          <div className="vote-actions">
                            {[1, 2, 3, 4, 5].map((score) => {
                              const isHovered = hoverState?.id === item.id && score <= hoverState.score;
                              const isSelected = !hoverState && (myVotes[item.id] || 0) >= score;
                              return (
                                <button key={score} type="button" className={`star-btn ${isHovered || isSelected ? 'active' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); handleVote(item.id, score); }}
                                  onMouseEnter={() => setHoverState({id: item.id, score: score})}>★</button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="card-footer">
                          <button className="detail-btn" onClick={(e) => { e.stopPropagation(); setSelectedTool(item); }}>상세정보</button>
                          {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="visit-btn" onClick={(e) => e.stopPropagation()}>바로가기 →</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 상세 모달 */}
      {selectedTool && (
        <div className="modal-overlay" onClick={() => setSelectedTool(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTool(null)}>✕</button>
            
            <div className="modal-header-area">
              <div className="modal-logo-large">
                <img src={selectedTool.logo} alt="logo" onError={(e) => e.currentTarget.src = 'https://placehold.co/80x80?text=AI'}/>
              </div>
              <div className="modal-title-group">
                <h2>{selectedTool.title}</h2>
                <div className="modal-tags">
                  <span className="m-tag cat">{selectedTool.category}</span>
                  <span className="m-tag price">{selectedTool.price}</span>
                </div>
              </div>
              <a href={selectedTool.link} target="_blank" className="modal-visit-btn">공식 홈페이지 →</a>
            </div>

            <div className="modal-tabs">
              <button className={`m-tab ${modalTab === "INFO" ? "active" : ""}`} onClick={() => setModalTab("INFO")}>상세 정보</button>
              <button className={`m-tab ${modalTab === "REVIEW" ? "active" : ""}`} onClick={() => setModalTab("REVIEW")}>유저 리뷰 <span className="count">{selectedTool.commentsList?.length || 0}</span></button>
            </div>

            <div className="modal-body">
              {modalTab === "INFO" ? (
                <div className="info-view fade-in">
                  <div className="info-card">
                    <h4>💡 서비스 소개</h4>
                    <p>{selectedTool.desc}</p>
                  </div>
                  <div className="info-card">
                    <h4>📜 주요 연혁 (History)</h4>
                    <div className="timeline">
                      {selectedTool.history ? selectedTool.history.split('\n').map((line: string, i: number) => (
                        <div key={i} className="timeline-item">
                          <div className="dot"></div>
                          <p>{line}</p>
                        </div>
                      )) : <p className="no-data">등록된 연혁이 없습니다.</p>}
                    </div>
                  </div>
                  <div className="info-card">
                    <h4>📰 최신 뉴스</h4>
                    <div className="news-box">
                      <span className="news-icon">📢</span>
                      <p>{selectedTool.news || "관련 뉴스가 없습니다."}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="review-view fade-in">
                  <div className="rating-panel">
                    <div className="big-score">
                      <span className="score-num">{selectedTool.rating || 0}</span>
                      <span className="score-max">/ 5.0</span>
                    </div>
                    <div className="my-vote">
                      <p>나의 평가</p>
                      <div className="stars">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} 
                            className={`star-l ${s <= reviewRating ? 'on' : ''}`} 
                            onClick={() => setReviewRating(s)}
                          >★</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="review-input-box">
                    <textarea placeholder="사용 후기를 남겨주세요." value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    <button onClick={handleReviewSubmit}>등록</button>
                  </div>

                  <div className="review-list">
                    {selectedTool.commentsList?.length > 0 ? selectedTool.commentsList.map((c: Comment) => (
                      <div key={c.id} className="review-bubble-row">
                        <div className="review-avatar" style={{background: '#eee'}}>
                          {c.user[0]?.toUpperCase()}
                        </div>
                        <div className="review-bubble">
                          <div className="rb-header">
                            <span className="rb-user">{c.user}</span>
                            <span className="rb-rating">{"⭐".repeat(c.rating)}</span>
                            <span className="rb-date">{c.date}</span>
                          </div>
                          <p className="rb-text">{c.text}</p>
                        </div>
                      </div>
                    )) : <div className="no-review">아직 리뷰가 없습니다.</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .page-header { text-align: center; margin-bottom: 60px; }
        .page-title { font-size: 42px; font-weight: 800; margin-bottom: 12px; color: var(--text-main); }
        .page-desc { font-size: 16px; color: var(--text-sub); line-height: 1.6; }
        .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; border-bottom: 1px solid var(--line); padding-bottom: 20px; }
        .category-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .tab-btn { padding: 8px 20px; border-radius: 20px; border: 1px solid var(--line); background: white; cursor: pointer; font-weight: 600; color: var(--text-sub); transition: 0.2s; font-size: 14px; white-space: nowrap; }
        .tab-btn.active { background: var(--text-main); color: white; border-color: var(--text-main); }
        .search-wrap { position: relative; width: 260px; }
        .search-wrap input { width: 100%; padding: 10px 16px; padding-right: 40px; border: 1px solid var(--line); border-radius: 12px; font-size: 14px; outline: none; transition: 0.2s; background: #f9f9f9; }
        .search-wrap input:focus { border-color: var(--blue); background: white; box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }
        .search-wrap .icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); opacity: 0.5; font-size: 14px; }
        
        .category-section { margin-bottom: 80px; }
        .section-title { font-size: 28px; font-weight: 800; color: var(--text-main); margin-bottom: 24px; padding-left: 12px; border-left: 5px solid var(--blue); line-height: 1.2; letter-spacing: -0.5px; }
        .ranking-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .resource-card { background: white; border: 1px solid var(--line); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); cursor: pointer; position: relative; overflow: hidden; }
        .resource-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-color: var(--blue); }
        .resource-card.rank-1 { border: 2px solid #FFD700; background: linear-gradient(to bottom right, #fff, #fffdf0); }
        .rank-badge { position: absolute; top: 0; left: 0; background: #f0f0f0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; border-bottom-right-radius: 16px; z-index: 10; }
        .rank-1 .rank-badge { background: #FFD700; font-size: 22px; } 
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; padding-left: 10px; }
        .card-logo-wrap { width: 52px; height: 52px; background: #fff; border: 1px solid #eee; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .card-logo { width: 100%; height: 100%; object-fit: contain; }
        .price-badge { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: #f0f0f0; color: #666; }
        .card-info h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text-main); }
        .card-info p { font-size: 14px; color: var(--text-sub); line-height: 1.5; margin: 0; }
        .rating-area { background: #f9fafb; padding: 12px; border-radius: 12px; margin-bottom: 8px; }
        .current-rating { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .star-icon { color: #FFD700; } .score { font-weight: 800; font-size: 16px; color: var(--text-main); } .count { font-size: 12px; color: #999; }
        .vote-actions { display: flex; align-items: center; gap: 6px; }
        .star-btn { background: none; border: none; cursor: pointer; font-size: 24px; color: #ddd; transition: 0.1s; padding: 4px; line-height: 1; z-index: 10; position: relative; }
        .star-btn.active { color: #FFD700; transform: scale(1.1); text-shadow: 0 0 2px rgba(255, 215, 0, 0.5); }
        .card-footer { display: flex; gap: 8px; margin-top: auto; }
        .detail-btn { flex: 1; padding: 10px; background: #f5f5f7; border: none; border-radius: 10px; font-weight: 600; color: var(--text-main); cursor: pointer; font-size: 13px; }
        .visit-btn { flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px; background: #111; border: none; border-radius: 10px; font-weight: 600; color: white; cursor: pointer; font-size: 13px; text-decoration: none; }
        .empty-message { text-align: center; padding: 60px; color: #999; grid-column: 1 / -1; }

        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 200; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
        .modal-content { background: #fff; width: 700px; max-width: 95vw; height: 85vh; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 60px rgba(0,0,0,0.3); }
        .modal-close { position: absolute; top: 20px; right: 20px; z-index: 10; background: rgba(255,255,255,0.5); border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 20px; cursor: pointer; }
        .modal-header-area { position: relative; padding: 40px 30px 30px; border-bottom: 1px solid var(--line); background: #fff; overflow: hidden; display: flex; align-items: center; gap: 24px; }
        .modal-bg-blur { position: absolute; top: -50%; left: -20%; width: 150%; height: 200%; background: radial-gradient(circle, rgba(0,122,255,0.05) 0%, transparent 60%); z-index: 0; pointer-events: none; }
        .modal-header-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 20px; width: 100%; }
        .modal-logo-large { width: 80px; height: 80px; background: #fff; border: 1px solid #eee; border-radius: 20px; display: flex; align-items: center; justify-content: center; padding: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .modal-logo-large img { width: 100%; height: 100%; object-fit: contain; }
        .modal-title-group h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
        .modal-tags { display: flex; gap: 8px; }
        .m-tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
        .m-tag.cat { background: #f0f7ff; color: var(--blue); }
        .m-tag.price { background: #f5f5f5; color: #666; }
        .modal-visit-btn { margin-left: auto; padding: 12px 24px; background: #111; color: white; border-radius: 30px; font-size: 14px; font-weight: 700; transition: 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .modal-tabs { display: flex; border-bottom: 1px solid var(--line); padding: 0 30px; background: #fff; }
        .m-tab { padding: 16px 0; margin-right: 32px; background: none; border: none; border-bottom: 3px solid transparent; font-size: 15px; font-weight: 600; color: #999; cursor: pointer; transition: 0.2s; }
        .m-tab.active { color: #111; border-bottom-color: #111; }
        .m-tab .count { background: #eee; font-size: 11px; padding: 2px 6px; border-radius: 10px; margin-left: 4px; color: #666; }
        .modal-body { padding: 30px; overflow-y: auto; flex: 1; background: #fcfcfc; }
        .info-view { display: flex; flex-direction: column; gap: 24px; }
        .info-card { background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--line); }
        .info-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #111; }
        .info-card p { font-size: 15px; color: #555; line-height: 1.6; margin: 0; }
        .timeline { border-left: 2px solid #eee; padding-left: 20px; margin-left: 8px; }
        .timeline-item { position: relative; margin-bottom: 16px; }
        .timeline-item .dot { position: absolute; left: -25px; top: 6px; width: 8px; height: 8px; background: var(--blue); border-radius: 50%; box-shadow: 0 0 0 4px #fff; }
        .news-box { background: #f0f9ff; padding: 16px; border-radius: 12px; display: flex; gap: 12px; align-items: flex-start; }
        .news-icon { font-size: 20px; }
        .rating-panel { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 20px; border-radius: 16px; border: 1px solid var(--line); margin-bottom: 20px; }
        .big-score { display: flex; align-items: baseline; gap: 8px; }
        .score-num { font-size: 48px; font-weight: 800; color: #111; }
        .score-max { font-size: 16px; color: #999; }
        .my-vote { text-align: right; }
        .stars { font-size: 24px; color: #ddd; cursor: pointer; }
        .stars .on { color: #FFD700; }
        .review-input-box { background: #fff; padding: 20px; border-radius: 16px; border: 1px solid var(--line); margin-bottom: 30px; }
        .review-input-box textarea { width: 100%; height: 80px; border: 1px solid #eee; border-radius: 8px; padding: 12px; font-size: 14px; resize: none; outline: none; margin-bottom: 12px; }
        .review-input-box button { width: 100%; padding: 10px; background: var(--text-main); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; float: right; }
        .review-list { display: flex; flex-direction: column; gap: 16px; }
        .review-bubble-row { display: flex; gap: 16px; }
        .review-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; font-size: 14px; flex-shrink: 0; }
        .review-bubble { background: #fff; padding: 16px; border-radius: 0 16px 16px 16px; border: 1px solid var(--line); flex: 1; }
        .rb-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .rb-user { font-weight: 700; font-size: 14px; }
        .rb-rating { font-size: 12px; }
        .rb-date { margin-left: auto; font-size: 12px; color: #aaa; }
        .rb-text { font-size: 14px; color: #444; line-height: 1.5; margin: 0; }
        .no-review { text-align: center; padding: 40px; color: #999; background: #fff; border-radius: 16px; border: 1px dashed #ddd; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) { .filter-bar { flex-direction: column-reverse; align-items: stretch; } .search-wrap { width: 100%; } .category-tabs { overflow-x: auto; padding-bottom: 4px; } }
      `}</style>
    </main>
  );
}