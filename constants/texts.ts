export const TEXTS = {
  nav: {
    home: { ko: "홈", en: "Home" },
    aiTools: { ko: "AI TOOLS", en: "AI TOOLS" },
    insight: { ko: "INSIGHT", en: "INSIGHT" },
    academy: { ko: "ACADEMY", en: "ACADEMY" },
    community: { ko: "COMMUNITY", en: "COMMUNITY" },
    market: { ko: "MARKET", en: "MARKET" },
    login: { ko: "로그인", en: "Login" },
    logout: { ko: "로그아웃", en: "Logout" },
    myPage: { ko: "마이페이지", en: "My Page" },
    menu: { ko: "메뉴", en: "Menu" }
  },
  home: {
    heroTitle: { ko: "작은 시작을 함께 만들어갑니다", en: "AI Knowledge, Workflow & Community Platform" },
    heroSubtitle: { ko: "AI가 처음이어도, 누구나 배우고 성장할 수 있는 공간", en: "Designed by GPT, Executed with Gemini, Empowered by You" },
    sectionTitles: {
      tools: { ko: "AI Tools 인기", en: "Popular AI Tools" },
      insight: { ko: "최신 인사이트", en: "Latest Insights" },
      academy: { ko: "아카데미", en: "Academy Tutorials" },
      community: { ko: "지금 커뮤니티 인기", en: "Trending in Community" },
      communityDesc: { ko: "커뮤니티에서 지금 주목받는 최신 글", en: "Hot topics from the community" },
      viewAll: { ko: "전체보기 →", en: "View All →" },
      empty: { ko: "아직 등록된 글이 없습니다.", en: "No posts yet." },
      writeFirst: { ko: "첫 번째 글의 주인공이 되어보세요!", en: "Be the first to write!" }
    },
    bento: {
      tools: { title: "AI Tools", desc: { ko: "평점·리뷰 포함", en: "Ratings & Reviews" }, detail: { ko: "다양한 분야에서 활용되는 AI를 한눈에 탐색하세요.\n원하는 툴을 찾고, 실제 사용자들의 평가와 활용 경험을 확인할 수 있습니다.", en: "Curated list of the best AI tools.\nCheck real-time rankings and honest reviews." }, linkText: { ko: "AI 랭킹 확인", en: "View Rankings →" } },
      insight: { title: "Insight", desc: { ko: "트렌드 / 큐레이션 / 가이드 / 리포트 / 분석", en: "AI Concepts / Trends / Insights" } },
      academy: { title: "Academy", desc: { ko: "참고영상(youtube) / AI사용법", en: "Tutorials / Tips / References" } },
      community: { title: "Community", desc: { ko: "잡담 / 질문 / 정보 공유", en: "Chat / Q&A / Information Sharing" }, detail: { ko: "혼자 고민하지 마세요. AI에 관련된 이야기를 함께 공유해주세요.", en: "Don't struggle alone. Share your work, ask questions, and grow together with DORI-AI members." } },
      market: { title: "Market(준비중)", desc: { ko: "AI 작업 의뢰 / AI 자료 판매", en: "Asset Market + Work Requests" } }
    }
  },
  aiTools: {
    heroTitle: { ko: "AI Tools", en: "AI Tools" },
    heroSubtitle: { ko: "생성형 AI, 자동화, 이미지·영상 등 모든 도구를 한눈에 정리했습니다.", en: "Browse and compare AI tools for text, image, video, audio, and automation." },
    filters: { category: { ko: "카테고리", en: "Category" }, priceType: { ko: "가격", en: "Price Type" }, sortBy: { ko: "정렬", en: "Sort By" }, all: { ko: "전체", en: "All" } },
    button: { visit: { ko: "사이트 방문", en: "Visit Website" }, loadMore: { ko: "더보기", en: "Load More" } }
  },
  insight: {
    heroTitle: { ko: "Insight", en: "Insight" },
    heroSubtitle: { ko: "AI 개념과 트렌드를 빠르게 이해하는 공간입니다.", en: "Understand AI concepts and trends effortlessly." },
    filters: { category: { ko: "카테고리", en: "Category" }, sort: { ko: "정렬", en: "Sort" }, all: { ko: "전체", en: "All" }, resetTag: { ko: "태그 초기화", en: "Reset Tag" } },
    sortOptions: { newest: { ko: "최신순", en: "Newest" }, popular: { ko: "인기순", en: "Popular" } },
    button: { readMore: { ko: "자세히 보기", en: "Read More" }, loadMore: { ko: "더보기", en: "Load More" } }
  },
  academy: {
    heroTitle: { ko: "Academy", en: "Academy" },
    heroSubtitle: { ko: "AI 활용을 배우는 가장 쉬운 방법.", en: "Learn how to use AI efficiently." },
    searchPlaceholder: { ko: "검색 (예: 프롬프트, Pika, 자동화…)", en: "Search tutorials…" },
    filters: { level: { ko: "난이도", en: "Level" }, category: { ko: "카테고리", en: "Category" }, all: { ko: "전체", en: "All" } },
    button: { watch: { ko: "강의 보기", en: "Watch Now" }, loadMore: { ko: "더보기", en: "Load More" } }
  },
  communityPage: {
    heroTitle: { ko: "Community", en: "Community" },
    heroSubtitle: { ko: "자유롭게 질문하고, 정보를 나누고, 소통하세요.", en: "Ask questions, share info, and connect with others." },
    form: { nickname: { ko: "닉네임", en: "Nickname" }, title: { ko: "제목", en: "Title" }, content: { ko: "내용을 입력하세요...", en: "Write your content..." }, submit: { ko: "등록하기", en: "Post" }, tags: { ko: "태그 선택", en: "Select Tag" } },
    filters: { sort: { ko: "정렬", en: "Sort" }, all: { ko: "전체", en: "All" }, tags: { question: { ko: "질문", en: "Q&A" }, info: { ko: "정보", en: "Info" }, showoff: { ko: "자랑", en: "Showoff" }, chat: { ko: "잡담", en: "Chat" } } },
    sortOptions: { newest: { ko: "최신순", en: "Newest" }, likes: { ko: "좋아요순", en: "Most Liked" } },
    errors: { short: { ko: "제목이나 내용이 너무 짧습니다.", en: "Title or content is too short." }, banned: { ko: "비방/욕설이 포함된 글은 등록할 수 없습니다.", en: "Content contains inappropriate words." } }
  },
  market: {
    heroTitle: { ko: "Market", en: "Market" },
    heroSubtitle: { ko: "프롬프트, 템플릿, 워크플로우부터 AI 작업 의뢰까지 한 곳에서.", en: "From prompts and templates to custom AI work requests in one place." },
    section: { productsTitle: { ko: "AI 자료 마켓", en: "AI Asset Market" }, requestTitle: { ko: "AI 작업 의뢰", en: "AI Work Request" } },
    filters: { category: { ko: "카테고리", en: "Category" }, price: { ko: "가격", en: "Price" }, sort: { ko: "정렬", en: "Sort" }, all: { ko: "전체", en: "All" } },
    requestForm: { name: { ko: "이름", en: "Name" }, email: { ko: "이메일", en: "Email" }, type: { ko: "의뢰 종류", en: "Request Type" }, budget: { ko: "예산 범위", en: "Budget" }, description: { ko: "상세 내용", en: "Details" }, submit: { ko: "의뢰 보내기", en: "Submit Request" }, errorRequired: { ko: "필수 항목을 모두 입력해주세요.", en: "Please fill in all required fields." }, errorBanned: { ko: "비방/욕설이 포함된 의뢰는 접수할 수 없습니다.", en: "Requests containing abusive language cannot be submitted." }, success: { ko: "의뢰가 접수되었습니다. 곧 연락드리겠습니다.", en: "Your request has been received. We will contact you soon." } }
  },
  suggestions: {
    heroTitle: { ko: "건의사항 및 버그 제보", en: "Suggestions & Bug Reports" },
    heroSubtitle: { ko: "서비스 개선을 위한 의견을 자유롭게 남겨주세요.", en: "Share your ideas and help us improve the service." },
    form: { name: { ko: "이름", en: "Name" }, email: { ko: "이메일 (선택)", en: "Email (optional)" }, type: { ko: "유형", en: "Type" }, priority: { ko: "우선순위", en: "Priority" }, message: { ko: "내용", en: "Message" }, needsReply: { ko: "답변이 필요합니다.", en: "I would like a response." }, submit: { ko: "건의 등록", en: "Submit Suggestion" }, errorRequired: { ko: "필수 항목을 모두 입력해주세요.", en: "Please fill in all required fields." }, errorTooShort: { ko: "너무 짧은 건의는 등록할 수 없습니다.", en: "The message is too short to submit." }, errorBanned: { ko: "비방/욕설이 포함된 건의는 등록할 수 없습니다.", en: "Suggestions containing abusive language cannot be submitted." }, success: { ko: "건의가 접수되었습니다. 감사합니다.", en: "Your suggestion has been received. Thank you." } },
    filters: { type: { ko: "유형", en: "Type" }, priority: { ko: "우선순위", en: "Priority" }, sort: { ko: "정렬", en: "Sort" }, all: { ko: "전체", en: "All" } }
  },
  footer: {
    copyright: { ko: "© 2026 DORI-AI. All rights reserved.", en: "© 2024 DORI-AI. All rights reserved." },
    privacy: { ko: "개인정보처리방침", en: "Privacy Policy" },
    terms: { ko: "이용약관", en: "Terms of Service" },
    suggestion: { ko: "건의사항", en: "Suggestions" }
  },
  admin: {
    heroTitle: { ko: "Admin Dashboard", en: "Admin Dashboard" },
    heroSubtitle: { ko: "DORI-AI 서비스 현황을 한 눈에 확인할 수 있는 관리자 전용 화면입니다.", en: "An internal view of the overall DORI-AI service status." },
    stats: { communityCount: { ko: "커뮤니티 글 수", en: "Community Posts" }, suggestionsCount: { ko: "건의사항 수", en: "Suggestions" }, academyCount: { ko: "Academy 강의 수", en: "Academy Lessons" }, marketCount: { ko: "Market 상품 수", en: "Market Items" }, todayVisitors: { ko: "오늘 방문자", en: "Today's Visitors" }, totalVisitors: { ko: "누적 방문자", en: "Total Visitors" } },
    sections: { recentCommunity: { ko: "최근 커뮤니티 글", en: "Recent Community Posts" }, recentSuggestions: { ko: "최근 건의사항", en: "Recent Suggestions" }, systemNotes: { ko: "시스템 노트 및 추후 계획", en: "System Notes & Future Plan" }, visitorChart: { ko: "방문자 통계", en: "Visitor Statistics" } },
    chart: { daily: { ko: "일간", en: "Daily" }, weekly: { ko: "주간", en: "Weekly" }, monthly: { ko: "월간", en: "Monthly" }, yearly: { ko: "연간", en: "Yearly" } }
  }
};