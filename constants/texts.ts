export const TEXTS = {
  home: {
    heroTitle: {
      ko: "AI 시대의 지식·실전·커뮤니티 플랫폼",
      en: "AI Knowledge, Workflow & Community Platform"
    },
    heroSubtitle: {
      ko: "설계는 GPT, 실행은 Gemini, 그리고 당신",
      en: "Designed by GPT, Executed with Gemini, Empowered by You"
    },
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
      tools: { title: "AI Tools", desc: "평점·리뷰 포함", detail: "수천 개의 AI 툴 중 진짜만 엄선했습니다.\n실시간 순위와 유저들의 솔직한 평가를 확인하세요.", linkText: "랭킹 보러가기 →" },
      insight: { title: "Insight", desc: "AI 인사이트 / 개념 / 트렌드" },
      academy: { title: "Academy", desc: "실전 튜토리얼 / 팁 / 유튜브 참고자료" },
      community: { title: "Community", desc: "잡담 / 질문 / 정보 공유", detail: "혼자 고민하지 마세요. 작품 자랑부터 에러 해결 질문까지, DORI-AI 멤버들과 함께 성장하는 자유로운 소통 공간입니다." },
      market: { title: "Market", desc: "AI 자료 판매 + 작업 의뢰" }
    }
  },
  aiTools: {
    heroTitle: { ko: "AI Tools", en: "AI Tools" },
    heroSubtitle: { 
      ko: "생성형 AI, 자동화, 이미지·영상 등 모든 도구를 한눈에 정리했습니다.", 
      en: "Browse and compare AI tools for text, image, video, audio, and automation." 
    },
    filters: {
      category: { ko: "카테고리", en: "Category" },
      priceType: { ko: "가격", en: "Price Type" },
      sortBy: { ko: "정렬", en: "Sort By" },
      all: { ko: "전체", en: "All" }
    },
    button: {
      visit: { ko: "사이트 방문", en: "Visit Website" },
      loadMore: { ko: "더보기", en: "Load More" }
    }
  },
  insight: {
    heroTitle: { ko: "Insight", en: "Insight" },
    heroSubtitle: {
      ko: "AI 개념과 트렌드를 빠르게 이해하는 공간입니다.",
      en: "Understand AI concepts and trends effortlessly."
    },
    filters: {
      category: { ko: "카테고리", en: "Category" },
      sort: { ko: "정렬", en: "Sort" },
      all: { ko: "전체", en: "All" },
      resetTag: { ko: "태그 초기화", en: "Reset Tag" }
    },
    sortOptions: {
      newest: { ko: "최신순", en: "Newest" },
      popular: { ko: "인기순", en: "Popular" }
    },
    button: {
      readMore: { ko: "자세히 보기", en: "Read More" },
      loadMore: { ko: "더보기", en: "Load More" }
    }
  },
  academy: {
    heroTitle: { ko: "Academy", en: "Academy" },
    heroSubtitle: {
      ko: "AI 활용을 배우는 가장 쉬운 방법.",
      en: "Learn how to use AI efficiently."
    },
    searchPlaceholder: {
      ko: "검색 (예: 프롬프트, Pika, 자동화…)",
      en: "Search tutorials…"
    },
    filters: {
      level: { ko: "난이도", en: "Level" },
      category: { ko: "카테고리", en: "Category" },
      all: { ko: "전체", en: "All" }
    },
    button: {
      watch: { ko: "강의 보기", en: "Watch Now" },
      loadMore: { ko: "더보기", en: "Load More" }
    }
  },
  communityPage: {
    heroTitle: { ko: "Community", en: "Community" },
    heroSubtitle: {
      ko: "자유롭게 질문하고, 정보를 나누고, 소통하세요.",
      en: "Ask questions, share info, and connect with others."
    },
    form: {
      nickname: { ko: "닉네임", en: "Nickname" },
      title: { ko: "제목", en: "Title" },
      content: { ko: "내용을 입력하세요...", en: "Write your content..." },
      submit: { ko: "등록하기", en: "Post" },
      tags: { ko: "태그 선택", en: "Select Tag" }
    },
    filters: {
      sort: { ko: "정렬", en: "Sort" },
      all: { ko: "전체", en: "All" },
      tags: {
        question: { ko: "질문", en: "Q&A" },
        info: { ko: "정보", en: "Info" },
        showoff: { ko: "자랑", en: "Showoff" },
        chat: { ko: "잡담", en: "Chat" }
      }
    },
    sortOptions: {
      newest: { ko: "최신순", en: "Newest" },
      likes: { ko: "좋아요순", en: "Most Liked" }
    },
    errors: {
      short: { ko: "제목이나 내용이 너무 짧습니다.", en: "Title or content is too short." },
      banned: { ko: "비방/욕설이 포함된 글은 등록할 수 없습니다.", en: "Content contains inappropriate words." }
    }
  },
  // 👇 [추가] Market 페이지 전용 텍스트
  market: {
    heroTitle: { ko: "Market", en: "Market" },
    heroSubtitle: {
      ko: "프롬프트, 템플릿, 워크플로우부터 AI 작업 의뢰까지 한 곳에서.",
      en: "From prompts and templates to custom AI work requests in one place."
    },
    section: {
      productsTitle: { ko: "AI 자료 마켓", en: "AI Asset Market" },
      requestTitle: { ko: "AI 작업 의뢰", en: "AI Work Request" }
    },
    filters: {
      category: { ko: "카테고리", en: "Category" },
      price: { ko: "가격", en: "Price" },
      sort: { ko: "정렬", en: "Sort" },
      all: { ko: "전체", en: "All" }
    },
    requestForm: {
      name: { ko: "이름", en: "Name" },
      email: { ko: "이메일", en: "Email" },
      type: { ko: "의뢰 종류", en: "Request Type" },
      budget: { ko: "예산 범위", en: "Budget" },
      description: { ko: "상세 내용", en: "Details" },
      submit: { ko: "의뢰 보내기", en: "Submit Request" },
      errorRequired: { ko: "필수 항목을 모두 입력해주세요.", en: "Please fill in all required fields." },
      errorBanned: { ko: "비방/욕설이 포함된 의뢰는 접수할 수 없습니다.", en: "Requests containing abusive language cannot be submitted." },
      success: { ko: "의뢰가 접수되었습니다. 곧 연락드리겠습니다.", en: "Your request has been received. We will contact you soon." }
    }
  }
};