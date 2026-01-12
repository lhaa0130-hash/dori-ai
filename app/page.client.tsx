"use client";

import { useRef, useState, MouseEvent, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { 
  Sparkles, 
  Brain, 
  Layout, 
  MessageSquare, 
  ShoppingBag,
  TrendingUp,
  BookOpen,
  Target,
  BarChart3,
  FileText,
  ArrowRight
} from "lucide-react";

export default function HomePageClient() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const user = session?.user || null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  // --- 상태 관리 ---
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  

  // --- 데이터 로딩 (커뮤니티 글) ---
  useEffect(() => {
    // 커뮤니티 글 불러오기 (좋아요 순으로 정렬)
    const savedPosts = JSON.parse(localStorage.getItem("dori_community_posts") || "[]");
    if (savedPosts.length > 0) {
      // 좋아요 순으로 정렬하고 상위 5개만 가져오기
      const sortedPosts = [...savedPosts]
        .sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 5);
      setBlogPosts(sortedPosts); 
    }
  }, []);

  // --- 가로 스크롤 드래그 핸들러 ---
  const latestRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);

  function onLatestMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (!latestRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragScrollLeftRef.current = latestRef.current.scrollLeft;
  }
  function onLatestMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || !latestRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    latestRef.current.scrollLeft = dragScrollLeftRef.current - dx;
  }
  function endLatestDrag() { isDraggingRef.current = false; }
  function scrollLatestBy(dir: 1 | -1) {
    const box = latestRef.current;
    if (!box) return;
    box.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  // --- 로그인/회원가입 로직 ---
  async function handleCredentialLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return alert("아이디와 비밀번호를 입력해주세요.");
    setIsLoading(true);
    
    const res = await signIn("credentials", { 
      redirect: false, 
      username, 
      password 
    });
    
    setIsLoading(false);
    if (res?.error) {
      alert("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
    } else { 
      setLoginOpen(false); 
      window.location.reload(); 
    }
  }

  async function handleRegister(e: React.FormEvent) {
          e.preventDefault();
    if (!username || !password || !name) return alert("모든 필드를 입력해주세요.");
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name }),
      });
      
      if (!res.ok) throw new Error("회원가입 실패");
      
      alert("가입 성공! 로그인해주세요.");
      setIsLoginMode(true);
    } catch (err) { 
      alert("회원가입 중 오류가 발생했습니다."); 
    } finally { 
      setIsLoading(false); 
    }
  }

  // 좌측 사이드바 네비게이션 아이템
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  
  const navItems = [
    { id: 'home', label: '홈', href: '#home' },
    { id: 'features', label: '기능', href: '#features' },
    { id: 'insight', label: '인사이트', href: '#insight' },
    { id: 'community', label: '커뮤니티', href: '#community' },
    { id: 'faq', label: 'FAQ', href: '#faq' },
  ];

  // 스크롤 스파이: Intersection Observer를 사용하여 현재 보이는 섹션 감지
  const activeSection = useScrollSpy({
    items: navItems.map(item => ({
      sectionId: item.href.startsWith('#') ? item.href.substring(1) : item.href,
      menuId: item.id,
    })),
    sectionRefs,
    threshold: 0.5, // 섹션이 화면의 50% 이상 보일 때 활성화
    rootMargin: '-20% 0px -20% 0px', // 화면 중앙 60% 영역에서 감지
    mounted,
  }) || 'home'; // 기본값은 'home'

  return (
    <main 
      className="page scroll-container"
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 좌측 사이드바 네비게이션 */}
      {mounted && (
      <aside 
          className="fixed left-0 z-50 hidden lg:block"
        style={{
            top: '50%',
            transform: 'translateY(-50%)',
        }}
      >
          <nav className="ml-8">
          <div 
              className="flex flex-col gap-3 p-4 rounded-2xl backdrop-blur-xl transition-all duration-500"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                  href={item.href}
                  className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: activeSection === item.id 
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                    if (item.href.startsWith('#')) {
                  e.preventDefault();
                      const sectionId = item.href.substring(1);
                      const element = sectionRefs.current[sectionId];
                      if (element) {
                        // 부드러운 스크롤 이동
                        element.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                          inline: 'nearest'
                        });
                      }
                    } else {
                      // 외부 링크는 그대로 이동
                      return;
                    }
                }}
              >
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    activeSection === item.id ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: activeSection === item.id 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                  }}
                />
                <span 
                    className="text-xs font-medium transition-all duration-300"
                  style={{
                    color: activeSection === item.id 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    transform: activeSection === item.id ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </nav>
      </aside>
      )}

      {/* --- Home Section (Hero) --- */}
      <section 
        id="home" 
        className="top-section"
        ref={(el) => { sectionRefs.current['home'] = el; }}
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxSizing: 'border-box',
          paddingTop: '80px',
          paddingBottom: '80px',
        }}
      >
        {/* 오로라 배경 효과 */}
        <div className="aurora-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          </div>
          
        <div className="top-header fade-in-up">
          <h1>Creative Studio</h1>
          
          {/* 알록달록 움직이는 그라데이션 바 */}
          <div className="colorful-bar fade-in-up delay-1">
            <div className="gradient-bar animated-gradient"></div>
          </div>

          <h2 className="sub-title">DORI-AI</h2>
          <div className="description">
            <p>작은 시작을 함께 만들어갑니다</p>
            <p>AI가 처음이어도, 누구나 배우고 성장할 수 있는 공간</p>
            </div>
        </div>
      </section>

      {/* --- Features Section (Bento Grid Style) --- */}
      <section 
        id="features" 
        ref={(el) => { sectionRefs.current['features'] = el; }}
        style={{
          width: '100%',
          backgroundColor: isDark ? '#000000' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative',
          boxSizing: 'border-box',
          paddingTop: '120px',
          paddingBottom: '120px',
        }}
      >
        <div className="container max-w-7xl mx-auto px-6 lg:px-12 py-24" style={{ width: '100%' }}>
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 
            className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
            style={{ 
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            기능
          </h2>
          
          {/* 그라데이션 바 */}
          <div 
            className="w-full max-w-2xl mx-auto h-1 md:h-1.5 mb-6 rounded-full overflow-hidden"
            style={{
              boxShadow: isDark 
                ? '0 0 30px rgba(96, 165, 250, 0.4), 0 4px 20px rgba(96, 165, 250, 0.2)'
                : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 15px rgba(37, 99, 235, 0.2)',
            }}
          >
            <div 
              className="gradient-flow h-full rounded-full"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%, #60a5fa 100%)'
                  : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%, #2563eb 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradientFlow 4s linear infinite',
              }}
            />
          </div>

          <p 
            className="text-lg md:text-xl font-medium opacity-70 break-keep leading-relaxed"
            style={{ 
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            DORI-AI의 다양한 기능을 탐색해보세요
          </p>
        </div>

        {/* Bento Grid */}
        <div className="features-bento-grid">
          {[
            {
              id: "ai-tools",
              title: "AI Tools",
              description: "수천 개의 AI 도구를 카테고리별로 탐색하고 비교해보세요",
              href: "/ai-tools",
              icon: <Sparkles className="w-7 h-7" />,
              color: "#06b6d4",
              glowColor: "rgba(6, 182, 212, 0.4)",
              size: "large" as const,
              isMain: true, // AI Tools를 메인으로 설정
            },
            {
              id: "insight",
              title: "인사이트",
              description: "AI 업계 트렌드와 실무 활용 가이드를 확인하세요",
              href: "/insight",
              icon: <Brain className="w-6 h-6" />,
              color: "#a855f7",
              glowColor: "rgba(168, 85, 247, 0.3)",
              size: "medium" as const,
              isMain: false,
            },
            {
              id: "project",
              title: "프로젝트",
              description: "AI를 활용한 창작 프로젝트를 둘러보고 영감을 얻으세요",
              href: "/project",
              icon: <Layout className="w-6 h-6" />,
              color: "#10b981",
              glowColor: "rgba(16, 185, 129, 0.3)",
              size: "medium" as const,
              isMain: false,
            },
            {
              id: "community",
              title: "커뮤니티",
              description: "멤버들과 소통하고 질문과 답변을 나누세요",
              href: "/community",
              icon: <MessageSquare className="w-6 h-6" />,
              color: "#3b82f6",
              glowColor: "rgba(59, 130, 246, 0.3)",
              size: "small" as const,
              isMain: false,
            },
            {
              id: "market",
              title: "마켓",
              description: "AI 관련 제품과 서비스를 구매하고 판매하세요",
              href: "/market",
              icon: <ShoppingBag className="w-6 h-6" />,
              color: "#f59e0b",
              glowColor: "rgba(245, 158, 11, 0.3)",
              size: "small" as const,
              isMain: false,
            },
          ].map((feature, index) => (
            <Link
              key={feature.id}
              href={feature.href}
              className={`feature-bento-item ${feature.size} ${feature.isMain ? 'main-feature' : ''}`}
              style={{
                animation: `fadeInUpStagger 0.8s ease-out ${index * 0.15}s both`,
              }}
            >
              <div
                className="relative h-full rounded-2xl p-6 md:p-8 transition-all duration-500 cursor-pointer overflow-hidden group"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(0, 0, 0, 0.01)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  backdropFilter: feature.isMain ? 'blur(20px)' : 'blur(12px)',
                  WebkitBackdropFilter: feature.isMain ? 'blur(20px)' : 'blur(12px)',
                  boxShadow: isDark
                    ? `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)`
                    : `0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = isDark
                    ? `0 0 40px ${feature.glowColor}, 0 12px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                    : `0 0 30px ${feature.glowColor}60, 0 12px 48px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)`;
                  // 텍스트 선명도 증가
                  const title = e.currentTarget.querySelector('h3');
                  const desc = e.currentTarget.querySelector('p');
                  if (title) title.style.opacity = '1';
                  if (desc) desc.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDark
                    ? `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)`
                    : `0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)`;
                  // 텍스트 원래대로
                  const title = e.currentTarget.querySelector('h3');
                  const desc = e.currentTarget.querySelector('p');
                  if (title) title.style.opacity = '';
                  if (desc) desc.style.opacity = '';
                }}
              >
                {/* 회로선 패턴 배경 (AI Tools 메인 카드에만) */}
                {feature.isMain && (
                  <div 
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-5"
                    style={{
                      backgroundImage: `
                        linear-gradient(90deg, ${feature.color} 1px, transparent 1px),
                        linear-gradient(${feature.color} 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px',
                      maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
                      WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
                    }}
                  />
                )}

                {/* Glassmorphism 오버레이 */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, transparent 50%, rgba(0, 0, 0, 0.02) 100%)',
                  }}
                />

                {/* 아이콘 및 헤더 */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div
                    className="p-3 rounded-full transition-all duration-300 relative"
                    style={{
                      background: isDark
                        ? `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`
                        : `linear-gradient(135deg, ${feature.color}15, ${feature.color}08)`,
                      border: `1.5px solid ${feature.color}40`,
                      color: feature.color,
                      boxShadow: `0 0 20px ${feature.color}30, 0 0 40px ${feature.color}15, inset 0 0 20px ${feature.color}10`,
                    }}
                  >
                    {feature.icon}
                    {/* 아이콘 뒤 글로우 */}
                    <div 
                      className="absolute -inset-2 rounded-full blur-xl opacity-50"
                      style={{
                        background: feature.color,
                      }}
                    />
                  </div>
                </div>

                {/* 제목 */}
                <h3
                  className="text-2xl md:text-3xl font-black mb-3 relative z-10"
                  style={{
                    color: isDark ? '#ffffff' : '#000000',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    lineHeight: '1.2',
                  }}
                >
                  {feature.title}
                </h3>

                {/* 설명 */}
                <p
                  className={`mb-6 relative z-10 ${feature.size === 'large' ? 'text-base' : 'text-sm'}`}
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    lineHeight: '1.6',
                  }}
                >
                  {feature.description}
                </p>

                {/* EXPLORE 링크 (화살표 스타일) */}
                <div className="flex items-center gap-2 relative z-10 mt-auto">
                  <span
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all duration-300"
                    style={{
                      color: feature.color,
                    }}
                  >
                    Explore
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>

                {/* 호버 시 글로우 효과 */}
                <div 
                  className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl pointer-events-none transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle, ${feature.color}40, transparent 70%)`,
                  }}
                />
              </div>
            </Link>
          ))} 
        </div>
        </div>
      </section>

      {/* --- Insight Section (Premium Glassmorphism) --- */}
      <section 
        id="insight" 
        ref={(el) => { sectionRefs.current['insight'] = el; }}
        style={{
          width: '100%',
          backgroundColor: isDark ? '#000000' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative',
          boxSizing: 'border-box',
          paddingTop: '120px',
          paddingBottom: '120px',
        }}
      >
        <div className="container max-w-7xl mx-auto px-6 lg:px-12 py-24" style={{ width: '100%' }}>
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 
            className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
            style={{ 
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            인사이트
          </h2>
          
          {/* 무지개 그라데이션 구분선 */}
          <div 
            className="w-full max-w-2xl mx-auto h-1 md:h-1.5 mb-6 rounded-full overflow-hidden"
            style={{
              boxShadow: isDark 
                ? '0 0 30px rgba(96, 165, 250, 0.4), 0 4px 20px rgba(96, 165, 250, 0.2)'
                : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 15px rgba(37, 99, 235, 0.2)',
            }}
          >
            <div 
              className="gradient-flow h-full rounded-full"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%, #60a5fa 100%)'
                  : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%, #2563eb 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradientFlow 4s linear infinite',
              }}
            />
          </div>

          <p 
            className="text-lg md:text-xl font-medium opacity-70 break-keep leading-relaxed"
            style={{ 
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            AI 업계 속보와 심층 칼럼을 만나보세요
          </p>
        </div>

        {/* Insight Workflow Grid */}
        <div className="insight-workflow-container relative">
          {[
            {
              id: "trend",
              title: "트렌드",
              description: "최신 AI 기술 동향과 업계 트렌드를 확인하세요",
              href: "/insight?category=트렌드",
              icon: <TrendingUp className="w-5 h-5" />,
              color: "#ef4444",
              glowColor: "rgba(239, 68, 68, 0.3)",
              position: { x: 0, y: 0 },
            },
            {
              id: "guide",
              title: "가이드",
              description: "AI 도구를 실무에 바로 적용하는 실용적인 가이드",
              href: "/insight?category=가이드",
              icon: <BookOpen className="w-5 h-5" />,
              color: "#3b82f6",
              glowColor: "rgba(59, 130, 246, 0.3)",
              position: { x: 1, y: 0 },
            },
            {
              id: "curation",
              title: "큐레이션",
              description: "엄선된 AI 도구와 리소스를 한눈에 확인하세요",
              href: "/insight?category=큐레이션",
              icon: <Target className="w-5 h-5" />,
              color: "#a855f7",
              glowColor: "rgba(168, 85, 247, 0.3)",
              position: { x: 2, y: 0 },
            },
            {
              id: "analysis",
              title: "분석",
              description: "AI 시장과 기술에 대한 깊이 있는 분석 자료",
              href: "/insight?category=분석",
              icon: <BarChart3 className="w-5 h-5" />,
              color: "#06b6d4",
              glowColor: "rgba(6, 182, 212, 0.3)",
              position: { x: 0, y: 1 },
            },
            {
              id: "report",
              title: "리포트",
              description: "AI 업계 전문 리포트와 통계 자료를 확인하세요",
              href: "/insight?category=리포트",
              icon: <FileText className="w-5 h-5" />,
              color: "#10b981",
              glowColor: "rgba(16, 185, 129, 0.3)",
              position: { x: 1, y: 1 },
            },
          ].map((item, index) => (
            <div
              key={item.id}
              className="insight-workflow-item"
              style={{
                gridColumn: item.position.x + 1,
                gridRow: item.position.y + 1,
                animation: `fadeInUpStagger 0.8s ease-out ${index * 0.15}s both`,
              }}
            >
              {/* 연결선 (다음 아이템으로) */}
              {index < 4 && (
                <svg
                  className="absolute inset-0 pointer-events-none workflow-connector"
                  style={{
                    zIndex: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <defs>
                    <linearGradient id={`gradient-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={item.color} stopOpacity="0" />
                      <stop offset="50%" stopColor={item.color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={item.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {item.position.x < 2 && (
                    <line
                      x1="100%"
                      y1="50%"
                      x2="calc(100% + 1.5rem)"
                      y2="50%"
                      stroke={item.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.3"
                      className="workflow-line"
                      style={{
                        stroke: `url(#gradient-${item.id})`,
                        animation: `drawLine 1.5s ease-out ${index * 0.2 + 0.5}s both`,
                      }}
                    />
                  )}
                  {item.position.y === 0 && item.position.x < 2 && (
                    <line
                      x1="calc(100% + 1.5rem)"
                      y1="50%"
                      x2="calc(100% + 1.5rem)"
                      y2="calc(100% + 1.5rem)"
                      stroke={item.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.3"
                      className="workflow-line"
                      style={{
                        stroke: `url(#gradient-${item.id})`,
                        animation: `drawLine 1.5s ease-out ${index * 0.2 + 0.8}s both`,
                      }}
                    />
                  )}
                </svg>
              )}

              <Link
                href={item.href}
                className="insight-bento-card block h-full"
              >
              <div
                className="relative h-full rounded-2xl p-6 transition-all duration-500 cursor-pointer overflow-hidden group"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(0, 0, 0, 0.01)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: isDark
                    ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                    : '0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = isDark
                    ? `${item.color}60`
                    : `${item.color}40`;
                  e.currentTarget.style.boxShadow = isDark
                    ? `0 0 40px ${item.glowColor}, 0 12px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 0 1px ${item.color}30`
                    : `0 0 30px ${item.glowColor}60, 0 12px 48px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 0 0 1px ${item.color}20`;
                  // 연결선 색상 변경
                  const connector = e.currentTarget.closest('.insight-workflow-item')?.querySelector('.workflow-connector');
                  if (connector) {
                    const lines = connector.querySelectorAll('.workflow-line');
                    lines.forEach((line: any) => {
                      line.style.stroke = item.color;
                      line.style.opacity = '0.6';
                      line.style.strokeWidth = '2';
                    });
                  }
                  // 텍스트 선명도 증가
                  const title = e.currentTarget.querySelector('h3');
                  const desc = e.currentTarget.querySelector('p');
                  if (title) title.style.opacity = '1';
                  if (desc) desc.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.boxShadow = isDark
                    ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                    : '0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
                  // 연결선 원래대로
                  const connector = e.currentTarget.closest('.insight-workflow-item')?.querySelector('.workflow-connector');
                  if (connector) {
                    const lines = connector.querySelectorAll('.workflow-line');
                    lines.forEach((line: any) => {
                      line.style.stroke = item.color;
                      line.style.opacity = '0.3';
                      line.style.strokeWidth = '1.5';
                    });
                  }
                  // 텍스트 원래대로
                  const title = e.currentTarget.querySelector('h3');
                  const desc = e.currentTarget.querySelector('p');
                  if (title) title.style.opacity = '';
                  if (desc) desc.style.opacity = '';
                }}
              >
                {/* Glassmorphism 오버레이 */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, transparent 50%, rgba(0, 0, 0, 0.02) 100%)',
                  }}
                />

                {/* 워크플로우 스타일 원형 아이콘 */}
                <div className="mb-5 relative z-10">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center relative"
                    style={{
                      background: isDark
                        ? 'rgba(15, 23, 42, 0.6)'
                        : 'rgba(255, 255, 255, 0.8)',
                      border: isDark
                        ? `1.5px solid ${item.color}40`
                        : `1.5px solid ${item.color}30`,
                      color: item.color,
                      boxShadow: isDark
                        ? `0 0 20px ${item.color}40, 0 0 40px ${item.color}20, inset 0 0 20px ${item.color}10`
                        : `0 0 15px ${item.color}30, 0 0 30px ${item.color}15`,
                      animation: `insightIconPulse 2.5s ease-in-out infinite ${index * 0.4}s`,
                    }}
                  >
                    {item.icon}
                    {/* 내부 글로우 */}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle at center, ${item.color}25, transparent 70%)`,
                        animation: `insightInnerGlow 2.5s ease-in-out infinite ${index * 0.4}s`,
                        opacity: 0.6,
                      }}
                    />
                    {/* 외부 글로우 링 */}
                    <div 
                      className="absolute -inset-1 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${item.color}30, transparent 70%)`,
                        filter: 'blur(8px)',
                        animation: `insightOuterGlow 2.5s ease-in-out infinite ${index * 0.4}s`,
                        opacity: 0.4,
                      }}
                    />
                  </div>
                </div>

                {/* 제목 */}
                <h3
                  className="text-xl font-black mb-2 relative z-10"
                  style={{
                    color: isDark ? '#ffffff' : '#000000',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.2',
                  }}
                >
                  {item.title}
                </h3>

                {/* 설명 */}
                <p
                  className="text-sm mb-4 relative z-10"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    lineHeight: '1.6',
                  }}
                >
                  {item.description}
                </p>

                {/* EXPLORE 링크 */}
                <div className="flex items-center gap-2 relative z-10">
                  <span
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all duration-300"
                    style={{
                      color: item.color,
                    }}
                  >
                    Explore
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
            </div>
          ))} 
        </div>
        </div>
      </section>

      {/* --- Community Section (Hot Posts) --- */}
      <section 
        id="community" 
        className="fade-in-up delay-2"
        ref={(el) => { sectionRefs.current['community'] = el; }}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative',
          boxSizing: 'border-box',
          paddingTop: '120px',
          paddingBottom: '120px',
        }}
      >
        <div className="container section" style={{ width: '100%' }}>
        <div className="section-header left-align">
          <div>
            <h2>핫한 글</h2>
            <p>커뮤니티에서 지금 가장 인기 있는 글</p>
          </div>
          <Link href="/community" className="view-all">전체보기 →</Link>
        </div>
                
        {blogPosts.length === 0 ? (
          <div className="latest-empty">
            <p>아직 등록된 글이 없습니다.</p>
            <Link href="/community/write" className="link-text">첫 번째 글의 주인공이 되어보세요!</Link>
          </div>
        ) : (
          <div className="community-hot-posts">
            {blogPosts.map((post: any, index: number) => (
              <Link 
                className="hot-post-card" 
                href={`/community/${post.id}`} 
                key={post.id}
              >
                <div className="hot-post-rank">{index + 1}</div>
                <div className="hot-post-content">
                  <div className="hot-post-title">{post.title || '제목 없음'}</div>
                  <div className="hot-post-meta">
                    <span className="hot-post-author">{post.author || '익명'}</span>
                    <span className="hot-post-likes">❤️ {post.likes || 0}</span>
                    {post.category && (
                      <span className="hot-post-category">{post.category}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section 
        id="faq" 
        className="fade-in-up delay-2"
        ref={(el) => { sectionRefs.current['faq'] = el; }}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative',
          boxSizing: 'border-box',
          paddingTop: '120px',
          paddingBottom: '120px',
        }}
      >
        <div className="container section" style={{ width: '100%' }}>
        <div className="section-header">
          <h2>자주 묻는 질문</h2>
          <p>DORI-AI에 대해 궁금한 점을 확인하세요</p>
        </div>
        <div className="faq-content">
          <div className="faq-item">
            <h3 className="faq-question">DORI-AI는 무엇인가요?</h3>
            <p className="faq-answer">DORI-AI는 AI 도구 탐색부터 실무 활용 인사이트까지 제공하는 종합 플랫폼입니다. AI 입문자부터 전문가까지 누구나 쉽게 AI를 배우고 활용할 수 있는 공간입니다.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">회원가입이 필수인가요?</h3>
            <p className="faq-answer">기본적인 AI 도구 탐색과 인사이트 읽기는 회원가입 없이도 가능합니다. 다만 커뮤니티 참여, 프로젝트 공유, 좋아요 및 댓글 기능을 사용하려면 회원가입이 필요합니다.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">AI 도구는 어떻게 추천되나요?</h3>
            <p className="faq-answer">AI 도구는 카테고리별로 분류되어 있으며, 사용자 평가와 실시간 순위를 기반으로 추천됩니다. 각 도구의 상세 정보, 가격, 사용 후기를 확인할 수 있습니다.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">커뮤니티 글 작성은 누구나 가능한가요?</h3>
            <p className="faq-answer">네, 회원가입 후 누구나 커뮤니티에 글을 작성할 수 있습니다. 질문, 정보 공유, 작품 자랑 등 다양한 주제로 소통할 수 있습니다.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">인사이트 콘텐츠는 얼마나 자주 업데이트되나요?</h3>
            <p className="faq-answer">인사이트 섹션은 매일 최신 AI 업계 동향과 트렌드를 업데이트합니다. 트렌드, 가이드, 큐레이션, 분석, 리포트 등 다양한 형태의 콘텐츠를 제공합니다.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">프로젝트를 공유하려면 어떻게 해야 하나요?</h3>
            <p className="faq-answer">프로젝트 페이지에서 '새 프로젝트' 버튼을 클릭하여 AI를 활용한 창작 프로젝트를 업로드할 수 있습니다. 이미지, 설명, 사용한 AI 도구 등을 포함하여 공유하세요.</p>
          </div>
        </div>
        </div>
      </section>


      {/* --- Login Modal --- */}
      {loginOpen && (
        <div className="modal-backdrop" onClick={() => setLoginOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isLoginMode ? "환영합니다!" : "회원가입"}</h3>
              <p>{isLoginMode ? "로그인하여 DORI-AI를 이용하세요." : "회원가입하고 모든 기능을 이용하세요."}</p>
                </div>
            
            {isLoginMode ? (
              <div className="login-body">
                {/* 구글 로그인 */}
                <button className="google-btn" onClick={() => signIn("google", { callbackUrl: "/" })} disabled={isLoading}>
                  <span className="g-icon">G</span> Google로 계속하기
                </button>
                
                <div className="divider"><span>또는 아이디로 로그인</span></div>

                <form onSubmit={handleCredentialLogin} className="auth-form">
                  <input type="text" placeholder="아이디" value={username} onChange={e=>setUsername(e.target.value)} className="input-field"/>
                  <input type="password" placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)} className="input-field"/>
                  <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? "로그인 중..." : "로그인"}
                  </button>
                </form>
                <div className="switch-mode">
                  계정이 없으신가요? <span onClick={()=>setIsLoginMode(false)}>회원가입</span>
          </div>
        </div>
            ) : (
              <form onSubmit={handleRegister} className="auth-form">
                <input type="text" placeholder="아이디" value={username} onChange={e=>setUsername(e.target.value)} className="input-field"/>
                <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e=>setPassword(e.target.value)} className="input-field"/>
                <input type="text" placeholder="닉네임" value={name} onChange={e=>setName(e.target.value)} className="input-field"/>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? "가입 처리 중..." : "회원가입"}
                </button>
                <div className="switch-mode">
                  이미 계정이 있으신가요? <span onClick={()=>setIsLoginMode(true)}>로그인</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- Global Styles --- */}
      <style jsx global>{`
        :root { --bg: #ffffff; --text: #111; --gray: #666; --line: #e5e5e5; --blue: #007AFF; }
        * { box-sizing: border-box; }
        /* 이 페이지 전용 스타일 - 다른 페이지에 영향 없음 */
        html { 
          scroll-behavior: smooth;
        }
        body { 
          margin: 0; 
          padding: 0; 
          background: var(--bg); 
          color: var(--text); 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .page { 
          display: flex; 
          flex-direction: column; 
          min-height: 100vh;
          width: 100%; 
          overflow-x: hidden; 
          position: relative;
        }
        
        
        /* Animations */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }

        /* Layout Utilities */
        .container { max-width: 1000px; margin: 0 auto; padding: 0 24px; }
        .section { padding: 80px 24px; }

        /* Top Section */
        .top-section {
          position: relative;
          padding: 100px 24px; 
          max-width: 1200px; 
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        /* 사이드바가 있을 때 콘텐츠 왼쪽 여백 추가 */
        @media (min-width: 1024px) {
          /* Hero 섹션 */
          #home.top-section {
            margin-left: 180px;
            width: calc(100% - 180px);
            max-width: calc(100% - 180px);
          }
          
          /* Features 섹션 */
          #features {
            margin-left: 180px;
            width: calc(100% - 180px);
            max-width: calc(100% - 180px);
          }
          #features > div {
            padding-left: 48px;
            padding-right: 48px;
          }
          
          /* Insight 섹션 */
          #insight {
            margin-left: 180px;
            width: calc(100% - 180px);
            max-width: calc(100% - 180px);
          }
          #insight > div {
            padding-left: 48px;
            padding-right: 48px;
          }
          
          /* Community 섹션 */
          #community {
            margin-left: 180px;
            width: calc(100% - 180px);
            max-width: calc(100% - 180px);
          }
          #community > div {
            padding-left: 48px;
            padding-right: 48px;
          }
          
          /* FAQ 섹션 */
          #faq {
            margin-left: 180px;
            width: calc(100% - 180px);
            max-width: calc(100% - 180px);
          }
          #faq > div {
            padding-left: 48px;
            padding-right: 48px;
          }
          
          /* 푸터 여백 조정 */
          footer,
          .footer-wrapper {
            margin-left: 180px;
            width: calc(100% - 180px);
          }
        }
        
        /* 푸터 스타일 - 자연스러운 배치 */
        footer {
          position: relative;
          margin-top: auto;
        }

        /* Hero Text */
        .top-header { text-align: center; margin-bottom: 0; }
        .top-header h1 { 
          font-size: 64px; 
          font-weight: 700; 
          margin-bottom: 32px; 
          color: ${isDark ? '#ffffff' : '#111'}; 
          letter-spacing: -0.03em; 
          line-height: 1.1;
        }
        .top-header .sub-title {
          font-size: 48px;
          font-weight: 600;
          color: ${isDark ? '#ffffff' : '#111'};
          margin: 32px 0 40px 0;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .top-header .description {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .top-header .description p {
          font-size: 18px;
          font-weight: 400;
          color: ${isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'};
          margin: 0;
          line-height: 1.7;
          letter-spacing: -0.01em;
        }

        /* 알록달록 움직이는 그라데이션 바 */
        .colorful-bar {
          max-width: 700px;
          margin: 0 auto 36px;
          padding: 0;
        }
        .gradient-bar {
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: linear-gradient(90deg, 
            #ff6b9d 0%, 
            #ff8c42 25%, 
            #ffd23f 50%, 
            #06ffa5 75%, 
            #4ecdc4 100%
          );
          background-size: 200% 100%;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .animated-gradient {
          animation: gradientMove 3s ease infinite;
        }

        /* Aurora Background - 미니멀하게 제거 */
        .aurora-bg { display: none; }

        /* 🔥 Bento Grid Services (3열 그리드 시스템) */
        .bento-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          grid-auto-rows: minmax(240px, auto); 
          gap: 24px; 
          margin-bottom: 80px;
        }

        /* [1] Studio: 2x2 대형 카드 */
        .bento-card.studio { 
          grid-column: span 2; 
          grid-row: span 2; 
          background: #111; 
          color: white; 
          border: none;
          position: relative; 
          overflow: hidden;
        }

        /* [5] Community: 가로 2칸 와이드 카드 */
        .bento-card.community {
          grid-column: span 2; 
        }

        /* Studio 카드 전용 스타일 */
        .bento-card.studio .card-bg-glow { 
          position: absolute; top: -50%; right: -20%; width: 100%; height: 100%; 
          background: radial-gradient(circle, rgba(0,122,255,0.4) 0%, transparent 70%); 
          filter: blur(60px); z-index: 0; pointer-events: none; 
        }
        .bento-card.studio .card-content { 
          position: relative; z-index: 1; height: 100%; 
          display: flex; flex-direction: column; justify-content: center; 
        }
        .bento-card.studio h3 { font-size: 32px; margin-bottom: 12px; font-weight: 800; }
        .bento-card.studio p { font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; }
        .bento-card.studio .card-arrow { 
          position: absolute; bottom: 30px; right: 30px; 
          color: white; border: 1px solid rgba(255,255,255,0.3); 
          padding: 10px 24px; border-radius: 30px; font-weight: 600; 
          transition: 0.2s; font-size: 14px;
        }
        .bento-card.studio:hover .card-arrow { background: white; color: #111; }

        /* 일반 카드 공통 스타일 */
        .bento-card { 
          background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : 'white'}; 
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#eee'}; 
          border-radius: 24px; 
          padding: 28px; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          position: relative; 
          text-decoration: none; 
          color: inherit; 
          z-index: 1; 
          transition: 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); 
          box-shadow: ${isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.02)'}; 
        }
        .bento-card:hover { transform: translateY(-6px); box-shadow: ${isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.08)'}; border-color: transparent; }

        /* 아이콘 박스 */
        .icon-box { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px; }
        .icon-box.glass { background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#f5f7fa'}; color: ${isDark ? '#ffffff' : '#333'}; }
        .icon-box.dark { background: rgba(255,255,255,0.2); color: white; }
        
        .bento-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: ${isDark ? '#ffffff' : '#111'}; }
        .bento-card p { font-size: 15px; color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : '#666'}; line-height: 1.5; margin: 0; word-break: keep-all; }

        /* Latest Posts Styles */
        .section-header { text-align: center; margin-bottom: 0; }
        .section-header.left-align { text-align: left; display: flex; justify-content: space-between; align-items: flex-end; }
        .section-header h2 { font-size: 28px; font-weight: 500; margin-bottom: 8px; letter-spacing: -0.02em; color: ${isDark ? '#ffffff' : '#111'}; }
        .section-header p { color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : '#666'}; font-size: 14px; font-weight: 400; }
        .view-all { font-size: 12px; color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : '#666'}; font-weight: 300; cursor: pointer; transition: 0.2s; }
        .view-all:hover { color: ${isDark ? '#ffffff' : '#111'}; }

        .latest-wrapper { position: relative; }
        .latest-scroller { display: flex; gap: 24px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 30px; user-select: none; }
        .latest-scroller::-webkit-scrollbar { display: none; }
        .latest-card { flex: 0 0 300px; background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : 'white'}; border-radius: 20px; overflow: hidden; scroll-snap-align: start; text-decoration: none; color: inherit; transition: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: ${isDark ? '0 4px 10px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.03)'}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0'}; }
        .latest-card:hover { transform: translateY(-8px); box-shadow: ${isDark ? '0 15px 30px rgba(0,0,0,0.5)' : '0 15px 30px rgba(0,0,0,0.08)'}; }
        
        .latest-thumb-wrap { width: 100%; aspect-ratio: 16/10; background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#f0f0f0'}; position: relative; overflow: hidden; }
        .latest-thumb-wrap img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .latest-card:hover .latest-thumb-wrap img { transform: scale(1.05); }
        .card-gradient-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.1), transparent); opacity: 0; transition: 0.3s; }
        .latest-card:hover .card-gradient-overlay { opacity: 1; }
        .placeholder-thumb { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 40px; color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#ccc'}; }
        
        .latest-meta { padding: 20px; }
        .latest-title { font-weight: 700; font-size: 17px; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${isDark ? '#ffffff' : '#111'}; }
        .latest-info { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: ${isDark ? 'rgba(255, 255, 255, 0.6)' : '#888'}; }
        
        .latest-arrow { position: absolute; top: 40%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'white'}; border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : '#eee'}; box-shadow: ${isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'}; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; transition: 0.2s; font-size: 20px; color: ${isDark ? '#ffffff' : '#333'}; }
        .latest-arrow:hover { background: ${isDark ? 'rgba(255, 255, 255, 0.2)' : '#111'}; color: ${isDark ? '#ffffff' : 'white'}; border-color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#111'}; }
        .latest-arrow.left { left: -24px; }
        .latest-arrow.right { right: -24px; }
        
        .latest-empty { text-align: center; padding: 60px; background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : '#f9fafb'}; border-radius: 20px; color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : '#666'}; border: 1px dashed ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#ddd'}; }
        .link-text { color: var(--blue); text-decoration: underline; font-weight: 600; cursor: pointer; }

        /* Features Bento Grid */
        .features-bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: minmax(200px, auto);
          gap: 1.5rem;
        }

        .feature-bento-item.large {
          grid-column: span 12;
          grid-row: span 2;
          min-height: 350px;
        }

        .feature-bento-item.medium {
          grid-column: span 6;
          grid-row: span 1;
          min-height: 280px;
        }

        .feature-bento-item.small {
          grid-column: span 6;
          grid-row: span 1;
          min-height: 240px;
        }

        @media (min-width: 1024px) {
          .feature-bento-item.large {
            grid-column: span 6;
            grid-row: span 2;
          }

          .feature-bento-item.medium {
            grid-column: span 3;
            grid-row: span 1;
          }

          .feature-bento-item.small {
            grid-column: span 3;
            grid-row: span 1;
          }
        }

        @media (max-width: 768px) {
          .features-bento-grid {
            grid-template-columns: 1fr;
          }

          .feature-bento-item.large,
          .feature-bento-item.medium,
          .feature-bento-item.small {
            grid-column: span 1;
            grid-row: span 1;
            min-height: 300px;
          }
        }

        /* Insight Workflow Container */
        .insight-workflow-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 1.5rem;
          position: relative;
        }

        .insight-workflow-item {
          position: relative;
        }

        .workflow-connector {
          overflow: visible;
        }

        .workflow-line {
          transition: all 0.3s ease;
        }

        @keyframes drawLine {
          from {
            stroke-dashoffset: 100;
            opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
            opacity: 0.3;
          }
        }

        /* Insight Bento Cards */
        .insight-bento-card {
          text-decoration: none;
          color: inherit;
        }

        @keyframes insightIconPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 20px rgba(6, 182, 212, 0.1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.2);
            transform: scale(1.02);
          }
        }

        @keyframes insightInnerGlow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes insightOuterGlow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        @keyframes fadeInUpStagger {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Features Bento Grid - AI Tools 2x2 */
        .feature-bento-item.main-feature {
          grid-column: span 8 !important;
          grid-row: span 2 !important;
        }

        @media (max-width: 1024px) {
          .feature-bento-item.main-feature {
            grid-column: span 12 !important;
            grid-row: span 2 !important;
          }
        }

        @media (max-width: 768px) {
          .insight-workflow-container {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }

          .insight-workflow-item {
            grid-column: 1 !important;
            grid-row: auto !important;
          }

          .workflow-connector {
            display: none;
          }
        }

        /* Community Hot Posts */
        .community-hot-posts {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 80px;
        }
        .hot-post-card {
          background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : '#fff'};
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e8e8e8'};
          border-radius: 16px;
          padding: 28px 32px;
          text-decoration: none;
          color: inherit;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: ${isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'};
        }
        .hot-post-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, #3b82f6, #8b5cf6);
          transform: scaleY(0);
          transition: transform 0.4s ease;
        }
        .hot-post-card:hover {
          border-color: #d1d1d1;
          transform: translateX(6px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .hot-post-card:hover::before {
          transform: scaleY(1);
        }
        .hot-post-rank {
          font-size: 22px;
          font-weight: 500;
          color: ${isDark ? 'rgba(255, 255, 255, 0.5)' : '#999'};
          min-width: 36px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .hot-post-card:hover .hot-post-rank {
          color: #3b82f6;
          font-weight: 600;
        }
        .hot-post-content {
          flex: 1;
        }
        .hot-post-title {
          font-size: 17px;
          font-weight: 500;
          margin-bottom: 10px;
          color: ${isDark ? '#ffffff' : '#111'};
          transition: color 0.3s ease;
          letter-spacing: -0.01em;
        }
        .hot-post-card:hover .hot-post-title {
          color: #3b82f6;
        }
        .hot-post-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          color: ${isDark ? 'rgba(255, 255, 255, 0.6)' : '#999'};
        }
        .hot-post-author {
          font-weight: 400;
        }
        .hot-post-likes {
          color: #e91e63;
          font-weight: 400;
        }
        .hot-post-category {
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5'};
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 400;
          color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : '#666'};
        }

        /* FAQ Section */
        .faq-content {
          margin-top: 60px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        .faq-item {
          background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : '#fff'};
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e5'};
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: ${isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)'};
        }
        .faq-item:last-child {
          margin-bottom: 0;
        }
        .faq-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #10b981, #3b82f6);
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }
        .faq-item:hover {
          border-color: #111;
          transform: translateX(4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .faq-item:hover::before {
          transform: scaleY(1);
        }
        .faq-question {
          font-size: 17px;
          font-weight: 600;
          margin-bottom: 12px;
          color: ${isDark ? '#ffffff' : '#111'};
        }
        .faq-answer {
          font-size: 14px;
          color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : '#666'};
          line-height: 1.7;
          margin: 0;
          font-weight: 400;
        }

        /* Login Modal */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 200; }
        .modal { background: white; width: 420px; padding: 40px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: modalUp 0.3s ease; }
        .modal-header { text-align: center; margin-bottom: 32px; }
        .modal-header h3 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .modal-header p { color: #666; font-size: 15px; }
        
        .google-btn { display: flex; align-items: center; justify-content: center; width: 100%; padding: 14px; background: white; border: 1px solid #ddd; border-radius: 12px; font-size: 15px; font-weight: 600; color: #333; cursor: pointer; transition: 0.2s; margin-bottom: 20px; }
        .google-btn:hover { background: #f9f9f9; border-color: #ccc; }
        .g-icon { font-weight: 900; color: #4285F4; margin-right: 8px; font-size: 18px; font-family: sans-serif; }
        
        .divider { display: flex; align-items: center; text-align: center; color: #aaa; font-size: 12px; margin: 20px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #eee; }
        .divider span { padding: 0 10px; }

        .auth-form { display: flex; flex-direction: column; gap: 16px; }
        .input-field { padding: 16px; border: 1px solid #e0e0e0; border-radius: 12px; font-size: 16px; transition: 0.2s; background: #f9f9f9; }
        .input-field:focus { outline: none; border-color: var(--blue); background: white; box-shadow: 0 0 0 4px rgba(0,122,255,0.1); }
        .submit-btn { padding: 16px; background: #111; color: white; border-radius: 12px; font-size: 16px; font-weight: 700; border: none; cursor: pointer; transition: 0.2s; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .switch-mode { text-align: center; font-size: 14px; margin-top: 20px; color: #666; }
        .switch-mode span { color: var(--blue); font-weight: 700; cursor: pointer; margin-left: 6px; }

        /* 스크롤바 숨김 */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* 모바일 반응형: 모든 그리드를 1열로 변경 */
        @media (max-width: 768px) {
          .top-header h1 { font-size: 42px; }
          .top-header .sub-title { font-size: 32px; }
          .bento-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
          .bento-card.studio { grid-column: span 1; grid-row: span 1; height: 320px; }
          .bento-card.community { grid-column: span 1; }
          .bento-card.studio h3 { font-size: 26px; }
          .latest-arrow { display: none; }
          .colorful-bar { margin-bottom: 20px; }
        }
      `}</style>
    </main>
  );
}
