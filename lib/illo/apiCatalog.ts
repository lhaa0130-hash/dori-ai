// API 카탈로그 — 목적별 분류 + ★지정/추천 + 키 발급 가이드 + 최소 충전·무료 크레딧·묶는 법.
// 플랜 v2의 "손잡아주는 5단계(키 발급→카탈로그→비교→조합→자립)" 중 1~3단계를 한 화면에 담는다.
// ⚠️ 가격·정책은 제공사 사정으로 자주 바뀐다. 정확한 최신 수치는 각 제공사 페이지에서 확인하도록 링크를 함께 둔다.

export type ApiRole = "pick" | "recommend" | "warn";

export interface ApiEntry {
  name: string;
  role: ApiRole;          // pick=★직접 고른 핵심 / recommend=함께 제안 / warn=주의(공식 API 없음 등)
  use: string;            // 한 줄 용도·특성
  free?: string;          // 무료 크레딧·티어
  topup?: string;         // 최소 충전·과금 방식
  keyUrl?: string;        // 키 발급 페이지
  keySteps?: string[];    // 키 발급 단계 (확실한 곳만)
  note?: string;          // 비고
}

export interface ApiCategory {
  id: string;
  icon: string;
  name: string;
  en: string;
  desc: string;
  entries: ApiEntry[];
  catNote?: string;
}

export const API_CATALOG: ApiCategory[] = [
  {
    id: "search", icon: "🔎", name: "검색", en: "Search",
    desc: "최신 정보를 실시간으로 찾아오는 API. 글쓰기·리서치의 첫 단계로 자주 쓴다.",
    entries: [
      {
        name: "Tavily", role: "pick",
        use: "AI 작업에 최적화된 검색 — 결과를 요약해 바로 쓰기 좋게 돌려줘요.",
        free: "가입 즉시 매월 무료 검색 크레딧 제공",
        topup: "무료로 시작 → 이후 사용량만큼(종량제)",
        keyUrl: "https://app.tavily.com",
        keySteps: [
          "app.tavily.com 가입/로그인",
          "대시보드에서 API Key 확인·복사",
          "워크일로 설정 → AI 키에 붙여넣기",
        ],
      },
      { name: "Perplexity", role: "recommend", use: "출처(링크)까지 붙여주는 검색·답변. Sonar API 제공." },
      { name: "Exa", role: "recommend", use: "의미 기반(임베딩) 검색 — 키워드보다 '비슷한 내용' 찾기에 강함." },
      { name: "Brave Search", role: "recommend", use: "독립 검색 인덱스, 비교적 저렴. 무료 구간 있음." },
    ],
  },
  {
    id: "text", icon: "✍️", name: "글 생성", en: "Text",
    desc: "기획·글쓰기·요약·번역의 핵심. 워크일로 대부분의 작업이 이 위에서 돈다.",
    entries: [
      {
        name: "GPT (OpenAI)", role: "pick",
        use: "범용 최강자. 글·코드·요약 두루 잘함. 이미지(DALL·E)도 같은 키로.",
        free: "무료 크레딧 없음 — 선불 충전 방식",
        topup: "최소 약 $5 선불 충전",
        keyUrl: "https://platform.openai.com/api-keys",
        keySteps: [
          "platform.openai.com 가입/로그인",
          "Billing → 결제수단 등록 후 크레딧 충전(최소 약 $5)",
          "API keys → Create new secret key",
          "키 복사(한 번만 보임) → 워크일로 설정에 붙여넣기",
        ],
      },
      {
        name: "Claude (Anthropic)", role: "pick",
        use: "길고 정교한 글·문서·코드에 강함. 차분하고 안정적인 문체.",
        free: "무료 크레딧 없음 — 선불 충전 방식",
        topup: "최소 약 $5 선불 충전",
        keyUrl: "https://console.anthropic.com/settings/keys",
        keySteps: [
          "console.anthropic.com 가입/로그인",
          "Billing(Plans & Billing)에서 크레딧 충전",
          "API Keys → Create Key",
          "키 복사 → 워크일로 설정에 붙여넣기",
        ],
      },
      {
        name: "Gemini (Google)", role: "pick",
        use: "이미지·문서 이해(멀티모달) 강점. 무료로 시작하기 가장 쉬움.",
        free: "무료 티어 제공 — 결제 등록 없이 바로 시작 가능",
        topup: "더 많이 쓰면 유료 전환(종량제)",
        keyUrl: "https://aistudio.google.com/app/apikey",
        keySteps: [
          "Google AI Studio(aistudio.google.com) 로그인",
          "Get API key → Create API key",
          "키 복사 → 워크일로 설정에 붙여넣기 (무료 티어로 바로 테스트)",
        ],
      },
    ],
    catNote: "💡 셋을 따로 충전하기 부담되면, 아래 '묶는 법'의 OpenRouter 키 하나로 GPT·Claude·Gemini를 함께 쓸 수 있어요.",
  },
  {
    id: "image", icon: "🎨", name: "이미지 생성", en: "Image",
    desc: "글로 설명하면 그림·사진을 만들어내는 API.",
    entries: [
      {
        name: "DALL·E / GPT-image (OpenAI)", role: "pick",
        use: "OpenAI 키 하나로 글과 이미지를 함께. 지시 이해도가 좋아요.",
        note: "글(GPT) 키가 있으면 추가 발급 없이 그대로 사용",
        keyUrl: "https://platform.openai.com/api-keys",
      },
      { name: "Midjourney", role: "warn", use: "퀄리티 최상급이지만 공식 API가 없어요.", note: "API 자동화엔 부적합 → 아래 Flux·Ideogram으로 대체 권장" },
      {
        name: "Flux (fal.ai)", role: "recommend",
        use: "고품질·빠른 생성. fal.ai로 키 하나에서 여러 이미지·영상 모델을 함께.",
        free: "가입 시 소액 무료 크레딧(확인)",
        keyUrl: "https://fal.ai/dashboard/keys",
        keySteps: [
          "fal.ai 가입/로그인",
          "Billing에서 충전",
          "Keys → 키 발급 → 워크일로 설정에 붙여넣기",
        ],
      },
      { name: "Ideogram", role: "recommend", use: "이미지 안에 글자(텍스트)를 정확히 넣는 데 강점 — 포스터·로고에 좋음." },
    ],
  },
  {
    id: "video", icon: "🎬", name: "영상 생성", en: "Video",
    desc: "글·이미지로 짧은 영상을 만드는 API. 아직 비싸고 빠르게 발전 중인 분야.",
    entries: [
      { name: "힉스필드 (Higgsfield)", role: "pick", use: "역동적인 카메라 무빙·연출에 강한 영상 생성." },
      { name: "Kling", role: "pick", use: "사실적인 움직임·길이로 인기. 이미지→영상도 가능." },
      { name: "Seedance", role: "pick", use: "가성비 좋은 영상 생성 — 짧은 클립을 빠르게." },
      { name: "Runway", role: "recommend", use: "영상 편집·생성의 대표 주자. 다양한 도구 제공." },
      { name: "Luma", role: "recommend", use: "Dream Machine — 부드러운 영상 생성." },
    ],
    catNote: "💡 영상 모델 상당수는 fal.ai·Replicate 같은 '통합 제공사' 키 하나로 함께 쓸 수 있어요(개별 가입 부담 ↓).",
  },
  {
    id: "voice", icon: "🎙️", name: "음성 · 음악", en: "Voice / Music",
    desc: "텍스트를 음성으로(TTS), 음성을 텍스트로(STT), 그리고 음악까지.",
    entries: [
      {
        name: "ElevenLabs", role: "pick",
        use: "가장 자연스러운 다국어 음성(TTS)·더빙. 목소리 복제도.",
        free: "무료 티어 제공(매월 일정 글자 수)",
        keyUrl: "https://elevenlabs.io/app/settings/api-keys",
        keySteps: [
          "elevenlabs.io 가입/로그인 (무료 티어로 시작)",
          "Profile → API Keys",
          "키 복사 → 워크일로 설정에 붙여넣기",
        ],
      },
      { name: "Whisper (OpenAI)", role: "recommend", use: "음성→텍스트(받아쓰기·자막). OpenAI 키로 그대로 사용." },
      { name: "Suno", role: "recommend", use: "가사·분위기만 주면 노래(음악) 생성.", note: "API 접근은 제한적일 수 있어 확인 필요" },
    ],
  },
  {
    id: "deliver", icon: "📤", name: "자료 전송", en: "Delivery",
    desc: "완성한 결과를 나에게/고객에게 보내는 마지막 단계.",
    entries: [
      {
        name: "이메일", role: "pick",
        use: "결과를 메일로 발송. SMTP 또는 메일 API(Resend·SendGrid).",
        free: "Resend 등 무료 티어 있음",
        note: "Resend: resend.com 가입 → API Key 발급 후 사용",
      },
      {
        name: "카카오톡", role: "pick",
        use: "'나에게 보내기'로 결과를 카톡으로 받기.",
        keyUrl: "https://developers.kakao.com",
        keySteps: [
          "카카오 디벨로퍼스(developers.kakao.com)에서 앱 생성",
          "앱 키 중 REST API 키 확인",
          "카카오 로그인 + '메시지(나에게 보내기)' 권한 동의",
        ],
      },
      {
        name: "텔레그램", role: "pick",
        use: "텔레그램 봇으로 결과 알림 — 가장 간단하고 무료.",
        free: "완전 무료",
        keySteps: [
          "텔레그램에서 @BotFather 검색 → /newbot",
          "봇 이름 정하면 토큰(Token) 발급",
          "토큰 복사 → 워크일로 설정에 붙여넣기",
        ],
      },
    ],
  },
  {
    id: "rag", icon: "📚", name: "지식 학습 (내 자료 학습)", en: "RAG / Knowledge",
    desc: "내 문서를 AI에게 '학습'시키는 기능. 문서를 임베딩해 벡터DB에 넣고, 질문하면 관련 내용을 찾아 답하게 한다(RAG).",
    entries: [
      { name: "임베딩 (Embedding)", role: "pick", use: "문서를 숫자(벡터)로 바꿔 '의미'로 검색하게 함. OpenAI·Gemini 키로 생성 가능 — 보통 별도 키 불필요." },
      { name: "벡터DB", role: "pick", use: "임베딩을 저장·검색하는 DB. 아래 중 하나를 고르면 돼요." },
      { name: "Pinecone", role: "recommend", use: "관리형 벡터DB. 무료 티어로 시작.", keyUrl: "https://www.pinecone.io" },
      { name: "Supabase (pgvector)", role: "recommend", use: "DB+인증까지 한 번에. 무료 티어 넉넉.", keyUrl: "https://supabase.com" },
      { name: "Chroma", role: "recommend", use: "오픈소스 — 내 PC/서버에 무료로 띄울 수 있음." },
    ],
    catNote: "💡 어렵게 느껴지면: 'OpenAI 임베딩 + Supabase' 조합 하나면 충분해요. 워크일로가 이 흐름을 그대로 안내합니다.",
  },
  {
    id: "auto", icon: "⚙️", name: "자동화 · 조합 실행", en: "Orchestration",
    desc: "조합한 흐름(검색→글→이미지→전송)을 실제로 굴리는 엔진.",
    entries: [
      { name: "n8n", role: "recommend", use: "오픈소스 자동화. 자체 호스팅하면 무료, n8n.cloud는 유료 티어.", keyUrl: "https://n8n.io" },
      { name: "Make", role: "recommend", use: "노코드 자동화. 무료 티어로 가볍게 시작 가능.", keyUrl: "https://www.make.com" },
    ],
    catNote: "💡 워크일로의 '워크플로우'가 이 역할을 직접 해줘요 — 외부 엔진 없이 단계를 이어 실행하는 방향으로 갑니다.",
  },
];

// 초기 비용을 줄이는 4가지 — 플랜 'Honest Disclosure'.
export interface CostTip { tag: string; title: string; body: string; }
export const COST_TIPS: CostTip[] = [
  { tag: "START SMALL", title: "한 번에 다 X", body: "7개를 동시에 충전할 필요 없어요. 지금 꼭 필요한 1~2개부터. 나머지는 실제로 쓸 때 충전." },
  { tag: "ROUTER", title: "라우터로 묶기", body: "OpenRouter 키 하나면 GPT·Claude·Gemini를 단일 충전으로. 글 모델을 따로 충전 안 해도 돼요." },
  { tag: "FREE TIER", title: "무료 구간 먼저", body: "Gemini·Tavily처럼 무료 티어/가입 크레딧이 있는 곳부터. 돈 들이기 전에 충분히 체험." },
  { tag: "PREPAID", title: "매월 빠지는 돈 아님", body: "충전액은 사라지지 않는 선불 잔액. 한 번 넣으면 소진될 때까지 — 구독처럼 매달 자동으로 안 빠져요." },
];

// 글 모델 묶는 법 — OpenRouter.
export const ROUTER_TIP = {
  name: "OpenRouter",
  desc: "키 하나로 GPT·Claude·Gemini 등 수십 개 모델을 호출. 글 모델 3개를 따로 충전할 필요가 없어요.",
  keyUrl: "https://openrouter.ai/keys",
  steps: [
    "openrouter.ai 가입/로그인",
    "Credits에서 한 번 충전",
    "Keys → Create Key → 워크일로 설정에 붙여넣기",
  ],
};

export const ROLE_LABEL: Record<ApiRole, string> = { pick: "★ 지정", recommend: "추천", warn: "⚠ 주의" };
