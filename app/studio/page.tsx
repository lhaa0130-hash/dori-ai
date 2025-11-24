"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 

// 댓글 타입 정의
type Comment = {
  id: number;
  user: string;
  text: string;
  date: string;
  rating: number;
  avatarColor?: string;
};

export default function StudioPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  
  const [tools, setTools] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  
  // 별점 호버 상태
  const [hoverState, setHoverState] = useState<{id: number, score: number} | null>(null);

  // 상세 모달 상태
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState("INFO");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    loadTools();
  }, []);

  function loadTools() {
    // v11 데이터 키로 로드 (최신 툴 목록)
    const savedTools = JSON.parse(localStorage.getItem("dori_tools_v11") || "[]");
    const savedVotes = JSON.parse(localStorage.getItem("dori_my_votes_v4") || "{}");

    setMyVotes(savedVotes);

    if (savedTools.length === 0) {
      // 초기 데이터 (70+ 툴 데이터 복구)
      const initialData = [
        // 1. [LLM & Chatbots]
        { id: 101, title: "ChatGPT", category: "TEXT", desc: "가장 똑똑하고 범용적인 대화형 AI 표준", logo: "https://logo.clearbit.com/openai.com", price: "Freemium", rating: 0, reviews: 0, link: "https://chat.openai.com", history: "2022.11 GPT-3.5 출시\n2023.03 GPT-4 공개\n2024.05 GPT-4o 멀티모달 업데이트", news: "GPT-4o 모델 업데이트로 멀티모달 기능 강화.", commentsList: [] },
        { id: 102, title: "Claude", category: "TEXT", desc: "자연스러운 한국어와 뛰어난 코딩/작문 능력", logo: "https://logo.clearbit.com/anthropic.com", price: "Free", rating: 0, reviews: 0, link: "https://claude.ai", history: "OpenAI 출신 연구원들이 설립한 Anthropic에서 개발. 안전하고 윤리적인 AI를 지향.", news: "Claude 3.5 Sonnet 출시 이후 성능 입증.", commentsList: [] },
        { id: 103, title: "Perplexity", category: "TEXT", desc: "실시간 웹 검색 기반의 AI 검색엔진", logo: "https://logo.clearbit.com/perplexity.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.perplexity.ai", history: "전통적인 검색엔진을 대체하기 위해 등장.", news: "최근 기업가치 급상승 및 Pro Search 기능 고도화.", commentsList: [] },
        { id: 104, title: "Gemini", category: "TEXT", desc: "구글 생태계 연동 멀티모달 AI", logo: "https://logo.clearbit.com/deepmind.google", price: "Free", rating: 0, reviews: 0, link: "https://gemini.google.com", history: "구글의 바드(Bard)가 리브랜딩됨. 워크스페이스 연동성 강점.", news: "1.5 Pro 모델 업데이트로 긴 문맥 처리 능력 향상.", commentsList: [] },
        { id: 105, title: "Grok", category: "TEXT", desc: "X(트위터) 데이터 기반의 실시간 대화형 AI", logo: "https://logo.clearbit.com/x.ai", price: "Paid", rating: 0, reviews: 0, link: "https://grok.x.ai", history: "일론 머스크의 xAI가 개발. 유머러스하고 반항적인 성격.", news: "이미지 인식 기능 추가.", commentsList: [] },
        { id: 106, title: "Mistral", category: "TEXT", desc: "유럽 최고의 성능을 자랑하는 오픈소스 기반 모델", logo: "https://logo.clearbit.com/mistral.ai", price: "Paid", rating: 0, reviews: 0, link: "https://mistral.ai", history: "프랑스 스타트업 Mistral AI가 개발. 효율적인 파라미터 수로 높은 성능.", news: "Codestral 모델 출시.", commentsList: [] },
        { id: 107, title: "Copilot", category: "TEXT", desc: "MS Office와 결합된 생산성 향상 비서", logo: "https://logo.clearbit.com/microsoft.com", price: "Freemium", rating: 0, reviews: 0, link: "https://copilot.microsoft.com", history: "GPT-4 기술을 기반으로 윈도우 및 오피스에 통합.", news: "Copilot PC 출시.", commentsList: [] },
        { id: 108, title: "Llama", category: "TEXT", desc: "메타(Meta)에서 공개한 고성능 오픈소스 LLM", logo: "https://logo.clearbit.com/meta.com", price: "Free", rating: 0, reviews: 0, link: "https://llama.meta.com", history: "연구 및 상업적 이용 가능한 오픈소스 모델.", news: "Llama 3 공개.", commentsList: [] },
        { id: 109, title: "Poe", category: "TEXT", desc: "여러 AI 봇을 한곳에서 사용하는 플랫폼", logo: "https://logo.clearbit.com/poe.com", price: "Freemium", rating: 0, reviews: 0, link: "https://poe.com", history: "Quora에서 만든 AI 챗봇 플랫폼.", news: "크리에이터 수익화 모델 도입.", commentsList: [] },
        { id: 110, title: "Jasper", category: "TEXT", desc: "마케팅 카피라이팅에 특화된 작문 AI", logo: "https://logo.clearbit.com/jasper.ai", price: "Paid", rating: 0, reviews: 0, link: "https://www.jasper.ai", history: "마케터를 위한 템플릿 제공.", news: "기업용 솔루션 강화.", commentsList: [] },
        { id: 111, title: "You.com", category: "TEXT", desc: "작업과 검색을 동시에 처리하는 AI 에이전트", logo: "https://logo.clearbit.com/you.com", price: "Free", rating: 0, reviews: 0, link: "https://you.com", history: "개인화된 검색 경험 제공.", news: "다양한 AI 모드 선택 가능.", commentsList: [] },

        // 2. [IMAGE Generation]
        { id: 201, title: "Midjourney", category: "IMAGE", desc: "예술적 퀄리티가 압도적인 생성 툴", logo: "https://logo.clearbit.com/midjourney.com", price: "Paid", rating: 0, reviews: 0, link: "https://midjourney.com", history: "디스코드 기반으로 시작하여 독보적인 화풍 구축.", news: "웹사이트 생성 기능 알파 오픈.", commentsList: [] },
        { id: 202, title: "Stable Diffusion", category: "IMAGE", desc: "내 PC에 설치해 제한 없이 쓰는 강력한 도구", logo: "https://logo.clearbit.com/stability.ai", price: "Free", rating: 0, reviews: 0, link: "https://stability.ai", history: "오픈소스 생성형 AI의 표준. 다양한 파생 모델 보유.", news: "SD3 모델 발표.", commentsList: [] },
        { id: 203, title: "DALL-E", category: "IMAGE", desc: "ChatGPT 대화형 이미지 생성", logo: "https://logo.clearbit.com/openai.com", price: "Paid", rating: 0, reviews: 0, link: "https://openai.com/dall-e-3", history: "프롬프트를 정확하게 이해하는 능력 뛰어남.", news: "ChatGPT 내 편집 기능 추가.", commentsList: [] },
        { id: 204, title: "Leonardo", category: "IMAGE", desc: "게임 에셋과 캐릭터 생성 특화", logo: "https://logo.clearbit.com/leonardo.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://leonardo.ai", history: "독자적인 모델과 뛰어난 UI 제공.", news: "실시간 캔버스 기능 강화.", commentsList: [] },
        { id: 205, title: "Adobe Firefly", category: "IMAGE", desc: "저작권 걱정 없는 상업용 이미지 생성", logo: "https://logo.clearbit.com/adobe.com", price: "Freemium", rating: 0, reviews: 0, link: "https://firefly.adobe.com", history: "어도비 스톡 이미지만을 학습.", news: "포토샵 생성형 채우기 기능 통합.", commentsList: [] },
        { id: 206, title: "Krea", category: "IMAGE", desc: "실시간 드로잉 및 고해상도 업스케일링", logo: "https://logo.clearbit.com/krea.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.krea.ai", history: "스케치를 실시간으로 고퀄리티 이미지로 변환.", news: "비디오 생성 기능 추가.", commentsList: [] },
        { id: 207, title: "Ideogram", category: "IMAGE", desc: "이미지 내 타이포그래피(글자) 표현 최강", logo: "https://logo.clearbit.com/ideogram.ai", price: "Free", rating: 0, reviews: 0, link: "https://ideogram.ai", history: "기존 모델들이 어려워하던 텍스트 렌더링 문제를 해결하며 등장.", news: "v1.0 모델 출시.", commentsList: [] },
        { id: 208, title: "Playground", category: "IMAGE", desc: "쉽고 빠르게 이미지를 생성하고 편집", logo: "https://logo.clearbit.com/playgroundai.com", price: "Free", rating: 0, reviews: 0, link: "https://playgroundai.com", history: "직관적인 인터페이스와 필터 기능.", news: "자체 모델 v2.5 공개.", commentsList: [] },
        { id: 209, title: "Civitai", category: "IMAGE", desc: "스테이블 디퓨전 모델 커뮤니티", logo: "https://logo.clearbit.com/civitai.com", price: "Free", rating: 0, reviews: 0, link: "https://civitai.com", history: "전 세계 모델 공유의 중심.", news: "온사이트 생성 기능 지원.", commentsList: [] },
        { id: 210, title: "Recraft", category: "IMAGE", desc: "벡터 그래픽 및 아이콘 생성", logo: "https://logo.clearbit.com/recraft.ai", price: "Free", rating: 0, reviews: 0, link: "https://www.recraft.ai", history: "디자이너를 위한 벡터 AI.", news: "피그마 플러그인 지원.", commentsList: [] },

        // 3. [VIDEO Creation]
        { id: 301, title: "Runway", category: "VIDEO", desc: "텍스트로 영화 같은 영상 제작", logo: "https://logo.clearbit.com/runwayml.com", price: "Freemium", rating: 0, reviews: 0, link: "https://runwayml.com", history: "영상 생성 AI의 선구자.", news: "Gen-3 Alpha 공개.", commentsList: [] },
        { id: 302, title: "Pika", category: "VIDEO", desc: "이미지 움직임 효과 최강자", logo: "https://logo.clearbit.com/pika.art", price: "Free", rating: 0, reviews: 0, link: "https://pika.art", history: "애니메이션 스타일에 강점.", news: "Lip Sync 기능.", commentsList: [] },
        { id: 303, title: "Sora", category: "VIDEO", desc: "OpenAI의 혁명적인 비디오 모델", logo: "https://logo.clearbit.com/openai.com", price: "Waitlist", rating: 0, reviews: 0, link: "https://openai.com/sora", history: "최대 1분 길이의 고해상도 영상.", news: "영상 업계와 협업 중.", commentsList: [] },
        { id: 304, title: "Luma Dream Machine", category: "VIDEO", desc: "5초 만에 고퀄리티 영상 무료 생성", logo: "https://logo.clearbit.com/lumalabs.ai", price: "Free", rating: 0, reviews: 0, link: "https://lumalabs.ai", history: "3D 기술 기업 Luma AI 개발.", news: "공개 직후 큰 인기.", commentsList: [] },
        { id: 305, title: "HeyGen", category: "VIDEO", desc: "실제 사람 같은 AI 아바타 영상", logo: "https://logo.clearbit.com/heygen.com", price: "Paid", rating: 0, reviews: 0, link: "https://www.heygen.com", history: "기업용 아바타 솔루션.", news: "실시간 번역 기능.", commentsList: [] },
        { id: 306, title: "Kling", category: "VIDEO", desc: "중국의 소라(Sora)급 생성기", logo: "https://logo.clearbit.com/kuaishou.com", price: "Free", rating: 0, reviews: 0, link: "https://kling.kwai.com", history: "Kuaishou 개발.", news: "글로벌 버전 출시.", commentsList: [] },
        { id: 307, title: "Haiper", category: "VIDEO", desc: "예술적인 비디오 생성 특화", logo: "https://logo.clearbit.com/haiper.ai", price: "Free", rating: 0, reviews: 0, link: "https://haiper.ai", history: "구글 딥마인드 출신 설립.", news: "v1.5 업데이트.", commentsList: [] },
        { id: 308, title: "Kaiber", category: "VIDEO", desc: "애니메이션 스타일 뮤직비디오", logo: "https://logo.clearbit.com/kaiber.ai", price: "Paid", rating: 0, reviews: 0, link: "https://kaiber.ai", history: "Linkin Park MV 제작.", news: "오디오 반응형 생성.", commentsList: [] },
        { id: 309, title: "Synthesia", category: "VIDEO", desc: "기업용 AI 아바타 프레젠테이션", logo: "https://logo.clearbit.com/synthesia.io", price: "Paid", rating: 0, reviews: 0, link: "https://www.synthesia.io", history: "기업 교육 영상 표준.", news: "감정 표현 아바타.", commentsList: [] },
        { id: 310, title: "D-ID", category: "VIDEO", desc: "사진 한 장으로 말하는 영상 만들기", logo: "https://logo.clearbit.com/d-id.com", price: "Freemium", rating: 0, reviews: 0, link: "https://www.d-id.com", history: "정지 사진 애니메이션화.", news: "실시간 대화 에이전트.", commentsList: [] },

        // 4. [SOUND] (Music, Voice, Audio Integrated)
        { id: 401, title: "Suno", category: "SOUND", desc: "가사만 입력하면 작곡/보컬까지 완성", logo: "https://logo.clearbit.com/suno.com", price: "Free", rating: 0, reviews: 0, link: "https://suno.com", history: "음악 생성의 혁명.", news: "v3.5 모델 업데이트.", commentsList: [] },
        { id: 402, title: "ElevenLabs", category: "SOUND", desc: "가장 자연스러운 TTS 및 보이스 클로닝", logo: "https://logo.clearbit.com/elevenlabs.io", price: "Freemium", rating: 0, reviews: 0, link: "https://elevenlabs.io", history: "AI 음성 합성 분야의 압도적 1위.", news: "다국어 더빙 기능.", commentsList: [] },
        { id: 403, title: "Udio", category: "SOUND", desc: "고음질 음악 생성의 강력한 경쟁자", logo: "https://logo.clearbit.com/udio.com", price: "Free", rating: 0, reviews: 0, link: "https://www.udio.com", history: "구글 딥마인드 출신 개발.", news: "오디오 인페인팅 지원.", commentsList: [] },
        { id: 404, title: "Adobe Podcast", category: "SOUND", desc: "녹음된 음성을 스튜디오 품질로 향상", logo: "https://logo.clearbit.com/podcast.adobe.com", price: "Free", rating: 0, reviews: 0, link: "https://podcast.adobe.com", history: "AI 음질 향상.", news: "무료 공개로 인기.", commentsList: [] },
        { id: 405, title: "Murf", category: "SOUND", desc: "스튜디오 품질 AI 성우 나레이션", logo: "https://logo.clearbit.com/murf.ai", price: "Paid", rating: 0, reviews: 0, link: "https://murf.ai", history: "나레이션 제작 툴.", news: "Canva 연동.", commentsList: [] },
        { id: 406, title: "Lalal.ai", category: "SOUND", desc: "보컬과 악기를 정교하게 분리", logo: "https://logo.clearbit.com/lalal.ai", price: "Paid", rating: 0, reviews: 0, link: "https://www.lalal.ai", history: "음원 분리.", news: "비디오 배경음 제거.", commentsList: [] },
        { id: 407, title: "Krisp", category: "SOUND", desc: "통화 중 소음/에코 제거", logo: "https://logo.clearbit.com/krisp.ai", price: "Free", rating: 0, reviews: 0, link: "https://krisp.ai", history: "노이즈 캔슬링.", news: "회의 요약 기능.", commentsList: [] },
        { id: 408, title: "AIVA", category: "SOUND", desc: "클래식, 영화 음악 작곡 AI", logo: "https://logo.clearbit.com/aiva.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.aiva.ai", history: "작곡 보조 툴.", news: "MIDI 파일 내보내기.", commentsList: [] },
        { id: 409, title: "Descript", category: "SOUND", desc: "텍스트 수정으로 녹음 파일 편집 (Overdub)", logo: "https://logo.clearbit.com/descript.com", price: "Paid", rating: 0, reviews: 0, link: "https://www.descript.com", history: "문서 편집하듯 오디오 편집.", news: "Eye Contact 교정 기능.", commentsList: [] },
        { id: 410, title: "Moises", category: "SOUND", desc: "뮤지션을 위한 트랙 분리 및 연습", logo: "https://logo.clearbit.com/moises.ai", price: "Free", rating: 0, reviews: 0, link: "https://moises.ai", history: "악기 연습용 음원 분리 앱.", news: "스마트 메트로놈.", commentsList: [] },

        // 5. [AUTOMATION]
        { id: 501, title: "Make", category: "AUTOMATION", desc: "복잡한 워크플로우 시각적 자동화", logo: "https://logo.clearbit.com/make.com", price: "Freemium", rating: 0, reviews: 0, link: "https://www.make.com", history: "구 Integromat. 노코드 자동화의 강력한 툴.", news: "AI 에이전트 통합.", commentsList: [] },
        { id: 502, title: "Zapier", category: "AUTOMATION", desc: "앱 연동 자동화의 대명사", logo: "https://logo.clearbit.com/zapier.com", price: "Freemium", rating: 0, reviews: 0, link: "https://zapier.com", history: "가장 많은 앱 통합을 지원.", news: "Zapier Canvas(시각화 도구) 출시.", commentsList: [] },
        { id: 503, title: "n8n", category: "AUTOMATION", desc: "워크플로우 제어가 자유로운 오픈소스 자동화", logo: "https://logo.clearbit.com/n8n.io", price: "Free", rating: 0, reviews: 0, link: "https://n8n.io", history: "자체 서버 호스팅이 가능한 자동화 툴.", news: "LangChain 연동.", commentsList: [] },
        { id: 504, title: "Bardeen", category: "AUTOMATION", desc: "브라우저 기반 AI 웹 자동화 에이전트", logo: "https://logo.clearbit.com/bardeen.ai", price: "Free", rating: 0, reviews: 0, link: "https://www.bardeen.ai", history: "크롬 확장프로그램 형태의 자동화 툴.", news: "Magic Box 기능으로 자연어 자동화 생성.", commentsList: [] },
        { id: 505, title: "Gumloop", category: "AUTOMATION", desc: "AI 에이전트들을 연결해 파이프라인 구축", logo: "https://logo.clearbit.com/gumloop.com", price: "Paid", rating: 0, reviews: 0, link: "https://www.gumloop.com", history: "AI 모델들을 연결해 복잡한 작업 처리.", news: "Y Combinator 투자 유치.", commentsList: [] },
        { id: 506, title: "Relay", category: "AUTOMATION", desc: "사람 개입형(Human-in-the-loop) 자동화", logo: "https://logo.clearbit.com/relay.app", price: "Paid", rating: 0, reviews: 0, link: "https://www.relay.app", history: "구글 출신들이 만든 차세대 자동화 툴.", news: "원클릭 AI 요약 및 승인 기능.", commentsList: [] },
        { id: 507, title: "Power Automate", category: "AUTOMATION", desc: "MS 생태계의 강력한 자동화", logo: "https://logo.clearbit.com/microsoft.com", price: "Paid", rating: 0, reviews: 0, link: "https://powerautomate.microsoft.com", history: "마이크로소프트의 RPA 솔루션.", news: "Copilot 적용으로 흐름 생성 쉬워짐.", commentsList: [] },
        { id: 508, title: "IFTTT", category: "AUTOMATION", desc: "스마트홈과 소셜미디어 연동", logo: "https://logo.clearbit.com/ifttt.com", price: "Free", rating: 0, reviews: 0, link: "https://ifttt.com", history: "개인용 자동화의 원조.", news: "AI 쿼리 및 요약 기능 추가.", commentsList: [] },
        { id: 509, title: "PhantomBuster", category: "AUTOMATION", desc: "소셜 데이터 크롤링 자동화", logo: "https://logo.clearbit.com/phantombuster.com", price: "Paid", rating: 0, reviews: 0, link: "https://phantombuster.com", history: "리드 생성 및 소셜 자동화 전문.", news: "AI 기반 데이터 강화 기능.", commentsList: [] },
        { id: 510, title: "Browse AI", category: "AUTOMATION", desc: "웹사이트 데이터 추출/모니터링", logo: "https://logo.clearbit.com/browse.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.browse.ai", history: "코딩 없이 웹 스크래핑 로봇 생성.", news: "페이지 변경 감지 알림 기능.", commentsList: [] },
      ];
      
      setTools(initialData);
      localStorage.setItem("dori_tools_v11", JSON.stringify(initialData)); // Update key
    } else {
      setTools(savedTools);
    }
  }

  function onLogout() { signOut({ callbackUrl: "/" }); }

  const handleVote = (id: number, score: number) => {
    if (!user) { alert("로그인이 필요합니다."); return; }

    const previousVote = myVotes[id];
    
    const updatedTools = tools.map(tool => {
      if (tool.id === id) {
        let newRating, newReviewCount;
        if (previousVote) {
          const currentTotal = tool.rating * tool.reviews;
          const newTotal = currentTotal - previousVote + score;
          newReviewCount = tool.reviews; 
          newRating = newTotal / newReviewCount;
        } else {
          const currentTotal = tool.rating * tool.reviews;
          newReviewCount = tool.reviews + 1;
          newRating = (currentTotal + score) / newReviewCount;
        }
        if(isNaN(newRating)) newRating = score;

        return { ...tool, rating: parseFloat(newRating.toFixed(2)), reviews: newReviewCount };
      }
      return tool;
    });

    const sortedTools = updatedTools.sort((a, b) => {
        if (a.reviews === 0 && b.reviews === 0) return 0;
        if (a.reviews === 0) return 1;
        if (b.reviews === 0) return -1;
        return b.rating - a.rating;
    });

    setTools(sortedTools);
    const newMyVotes = { ...myVotes, [id]: score };
    setMyVotes(newMyVotes);

    localStorage.setItem("dori_tools_v11", JSON.stringify(sortedTools));
    localStorage.setItem("dori_my_votes_v4", JSON.stringify(newMyVotes));
  };

  const handleReviewSubmit = () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!reviewText.trim()) return alert("리뷰 내용을 입력해주세요.");

    const colors = ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF", "#BDB2FF", "#FFC6FF"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newComment: Comment = {
      id: Date.now(),
      user: user.name || "익명",
      text: reviewText,
      date: new Date().toLocaleDateString(),
      rating: reviewRating,
      avatarColor: randomColor
    };

    const updatedTools = tools.map(tool => {
      if (tool.id === selectedTool.id) {
        const updatedTool = { ...tool, commentsList: [newComment, ...(tool.commentsList || [])] };
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
    localStorage.setItem("dori_tools_v11", JSON.stringify(sortedTools));
    
    const newSelectedTool = sortedTools.find(t => t.id === selectedTool.id);
    setSelectedTool(newSelectedTool);
    setReviewText("");
    alert("리뷰가 등록되었습니다.");
  };

  const handleSuggest = () => {
    if (!user) return alert("로그인이 필요한 기능입니다.");
    router.push("/community/write");
  };

  const categoryList = [
    { key: "TEXT", label: "🤖 Text & LLM", color: "#E3F2FD", text: "#1565C0" },
    { key: "IMAGE", label: "🎨 Image & Art", color: "#FCE4EC", text: "#C2185B" },
    { key: "VIDEO", label: "🎬 Video & Motion", color: "#FFF3E0", text: "#E65100" },
    { key: "SOUND", label: "🎵 Sound & Voice", color: "#F3E5F5", text: "#7B1FA2" },
    { key: "AUTOMATION", label: "⚡ Automation", color: "#FFF8E1", text: "#FF6F00" },
  ];

  const activeCategories = selectedCategory === "ALL" 
    ? categoryList 
    : categoryList.filter(c => c.key === selectedCategory);

  const getCatColor = (catKey: string) => categoryList.find(c => c.key === catKey) || { color: '#eee', text: '#666' };

  return (
    <main className="page">
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "80vh", paddingTop: "60px" }}>
        <div className="page-header">
          <h1 className="page-title">AI Tools Ranking</h1>
          <p className="page-desc">엄선된 AI 툴 데이터베이스와 생생한 유저 리뷰</p>
        </div>

        <div className="filter-bar">
          <div className="category-tabs">
            <button className={`tab-btn ${selectedCategory === "ALL" ? 'active' : ''}`} onClick={() => setSelectedCategory("ALL")}>All</button>
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
            
            categoryTools.sort((a, b) => {
                if (a.reviews === 0 && b.reviews === 0) return 0;
                if (a.reviews === 0) return 1;
                if (b.reviews === 0) return -1;
                return b.rating - a.rating;
            });

            if (categoryTools.length === 0) return null;

            return (
              <div key={cat.key} className="category-section">
                <h2 className="section-title" style={{ borderLeftColor: cat.text }}>{cat.label}</h2>
                <div className="ranking-grid">
                  {categoryTools.map((item, index) => {
                    const hasRank = item.reviews > 0;
                    const rank = hasRank ? index + 1 : null;
                    const isTop3 = rank && rank <= 3;
                    const catStyle = getCatColor(item.category);

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
                          <span className="mini-cat" style={{ backgroundColor: catStyle.color, color: catStyle.text }}>{item.category}</span>
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
                            ) : <span className="no-rating">No ratings yet</span>}
                          </div>
                          <div className="vote-actions">
                            {[1, 2, 3, 4, 5].map((score) => {
                              const isHovered = hoverState !== null && score <= hoverState.score;
                              const isSelected = hoverState === null && myVotes[item.id] >= score;
                              return (
                                <button key={score} type="button" className={`star-btn ${isHovered || isSelected ? 'active' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); handleVote(item.id, score); }}
                                  onMouseEnter={() => setHoverState({id: item.id, score: score})}
                                >★</button>
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
        <div className="info-banner">
          <h3>Know a great AI tool?</h3>
          <button onClick={handleSuggest}>Suggest a Tool</button>
        </div>
      </section>

      {/* 상세 모달 */}
      {selectedTool && (
        <div className="modal-overlay" onClick={() => setSelectedTool(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTool(null)}>✕</button>
            
            <div className="modal-header-area">
              <div className="modal-bg-blur"></div>
              <div className="modal-header-inner">
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
                <a href={selectedTool.link} target="_blank" className="modal-link-btn">Visit Site →</a>
              </div>
            </div>

            <div className="modal-tabs">
              <button className={`m-tab ${modalTab === "INFO" ? "active" : ""}`} onClick={() => setModalTab("INFO")}>Info</button>
              <button className={`m-tab ${modalTab === "REVIEW" ? "active" : ""}`} onClick={() => setModalTab("REVIEW")}>Reviews <span className="count">{selectedTool.commentsList?.length || 0}</span></button>
            </div>

            <div className="modal-body">
              {modalTab === "INFO" ? (
                <div className="info-view fade-in">
                  <div className="info-card">
                    <h4>💡 Description</h4>
                    <p>{selectedTool.desc}</p>
                  </div>
                  <div className="info-card">
                    <h4>📜 History</h4>
                    <div className="timeline">
                      {selectedTool.history ? selectedTool.history.split('\n').map((line: string, i: number) => (
                        <div key={i} className="timeline-item">
                          <div className="dot"></div>
                          <p>{line}</p>
                        </div>
                      )) : <p className="no-data">Information updating...</p>}
                    </div>
                  </div>
                  <div className="info-card">
                    <h4>📰 Latest News</h4>
                    <div className="news-box">
                      <span className="news-icon">📢</span>
                      <p>{selectedTool.news || "No recent news."}</p>
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
                      <p>Your Rating</p>
                      <div 
                        className="stars"
                        onMouseLeave={() => setHoverState(null)}
                      >
                        {[1,2,3,4,5].map(s => {
                          const isHovered = hoverState !== null && s <= hoverState.score;
                          const isSelected = hoverState === null && myVotes[selectedTool.id] >= s;
                          
                          return (
                            <span 
                              key={s} 
                              className={`star-l ${isHovered || isSelected ? 'on' : ''}`} 
                              onClick={() => handleVote(selectedTool.id, s)}
                              onMouseEnter={() => setHoverState({id: selectedTool.id, score: s})}
                            >★</span>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="review-input-box">
                    <textarea placeholder="Leave your honest review here." value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    <button onClick={handleReviewSubmit}>Submit Review</button>
                  </div>

                  <div className="review-list">
                    {selectedTool.commentsList?.length > 0 ? selectedTool.commentsList.map((c: Comment) => (
                      <div key={c.id} className="review-bubble-row">
                        <div className="review-avatar" style={{background: c.avatarColor || '#eee'}}>
                          {c.user[0]?.toUpperCase()}
                        </div>
                        <div className="review-bubble">
                          <div className="rb-header"><span className="rb-user">{c.user}</span><span className="rb-rating">{"⭐".repeat(c.rating)}</span><span className="rb-date">{c.date}</span></div>
                          <p className="rb-text">{c.text}</p>
                        </div>
                      </div>
                    )) : <div className="no-review">Be the first to review!</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* (Styles omitted for brevity, assumed to be correct based on previous context) */
        .page-header { text-align: center; margin-bottom: 60px; }
        .page-title { font-size: 42px; font-weight: 800; margin-bottom: 12px; color: var(--text-main); }
        .page-desc { font-size: 16px; color: var(--text-sub); line-height: 1.6; }
        .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; border-bottom: 1px solid var(--line); padding-bottom: 20px; }
        .category-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .tab-btn { padding: 8px 20px; border-radius: 20px; border: 1px solid var(--line); background: white; cursor: pointer; font-weight: 600; color: var(--text-sub); transition: 0.2s; font-size: 14px; white-space: nowrap; }
        .tab-btn.active { background: var(--text-main); color: white; border-color: var(--text-main); }
        .search-wrap { position: relative; width: 260px; }
        .search-wrap input { width: 100%; padding: 10px 16px; padding-right: 40px; border: 1px solid var(--line); border-radius: 12px; font-size: 14px; outline: none; transition: 0.2s; background: #f9f9f9; }
        .search-wrap .icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); opacity: 0.5; font-size: 14px; }
        
        .category-section { margin-bottom: 80px; }
        .section-title { font-size: 28px; font-weight: 800; color: var(--text-main); margin-bottom: 24px; padding-left: 12px; border-left: 5px solid var(--blue); line-height: 1.2; letter-spacing: -0.5px; }
        .ranking-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .resource-card { background: white; border: 1px solid var(--line); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); cursor: pointer; position: relative; overflow: hidden; }
        .resource-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); border-color: var(--blue); }
        
        .resource-card.rank-1 { border: 2px solid #FFD700; background: linear-gradient(to bottom right, #fff, #fffdf0); }
        .rank-badge { position: absolute; top: 0; left: 0; background: #f0f0f0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; border-bottom-right-radius: 16px; z-index: 10; }
        .rank-1 .rank-badge { background: #FFD700; font-size: 22px; } 
        
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; padding-left: 10px; }
        .card-logo-wrap { width: 52px; height: 52px; background: #fff; border: 1px solid #eee; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .card-logo { width: 100%; height: 100%; object-fit: contain; }
        .price-badge { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: #f0f0f0; color: #666; }
        
        .mini-cat { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-bottom: 6px; }
        .card-info h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; color: var(--text-main); }
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
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
        .modal-content { background: #fff; width: 700px; max-width: 95vw; height: 85vh; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); }
        .modal-close { position: absolute; top: 20px; right: 20px; z-index: 10; background: rgba(255,255,255,0.5); border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 20px; cursor: pointer; }
        
        .modal-header-area { position: relative; padding: 40px 30px 30px; border-bottom: 1px solid var(--line); background: #fff; overflow: hidden; display: flex; align-items: center; gap: 24px; }
        .modal-bg-blur { position: absolute; top: -50%; left: -20%; width: 150%; height: 200%; background: radial-gradient(circle, rgba(0,122,255,0.05) 0%, transparent 60%); z-index: 0; pointer-events: none; }
        .modal-header-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 20px; width: 100%; }
        .modal-logo-large { width: 80px; height: 80px; background: #fff; border: 1px solid #eee; border-radius: 20px; display: flex; align-items: center; justify-content: center; padding: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .modal-logo-large img { width: 100%; height: 100%; object-fit: contain; }
        
        .modal-title-group h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
        .modal-tabs { display: flex; border-bottom: 1px solid var(--line); padding: 0 30px; background: #fff; }
        .m-tab { padding: 16px 0; margin-right: 32px; background: none; border: none; border-bottom: 3px solid transparent; font-size: 15px; font-weight: 600; color: #999; cursor: pointer; transition: 0.2s; }
        .m-tab.active { color: #111; border-bottom-color: #111; }
        .modal-body { padding: 30px; overflow-y: auto; flex: 1; background: #fcfcfc; }
        .info-block { margin-bottom: 30px; }
        .info-block h4 { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #111; }
        .info-block p { font-size: 15px; color: #555; line-height: 1.6; margin: 0; }

        .timeline { border-left: 2px solid #eee; padding-left: 20px; margin-left: 8px; }
        .timeline-item { position: relative; margin-bottom: 16px; }
        .timeline-item .dot { position: absolute; left: -25px; top: 6px; width: 8px; height: 8px; background: var(--blue); border-radius: 50%; box-shadow: 0 0 0 4px #fff; }
        
        .review-form textarea { width: 100%; height: 80px; border: 1px solid #eee; border-radius: 8px; padding: 12px; font-size: 14px; resize: none; outline: none; margin-bottom: 12px; }
        .review-form button { width: 100%; padding: 10px; background: var(--text-main); color: white; border-radius: 8px; font-weight: 700; cursor: pointer; float: right; }
        .review-list { display: flex; flex-direction: column; gap: 16px; }
        .review-bubble-row { display: flex; gap: 16px; }
        .review-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; font-size: 14px; flex-shrink: 0; }
        .review-bubble { background: #fff; padding: 16px; border-radius: 0 16px 16px 16px; border: 1px solid var(--line); flex: 1; }
        .rb-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .rb-user { font-weight: 700; font-size: 14px; }
        .rb-rating { font-size: 12px; }
        .rb-date { margin-left: auto; font-size: 12px; color: #aaa; }
        .rb-text { font-size: 14px; color: #444; line-height: 1.5; margin: 0; }

        @media (max-width: 768px) {
          .filter-bar { flex-direction: column-reverse; align-items: stretch; }
          .search-wrap { width: 100%; }
        }
      `}</style>
    </main>
  );
}