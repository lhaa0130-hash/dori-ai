"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  Globe,
  Smartphone,
  Video,
  Film,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  Workflow,
  Database,
  Bot,
  FileText,
  Code,
  Palette,
  Brain,
  Settings,
  BookOpen
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  detail: string;
  status: "ACTIVE" | "COMING SOON" | "UPCOMING" | "CREATIVE" | "AUTOMATION";
  statusLabel: string;
  tech: string[] | Array<{ name: string; icon: React.ReactNode }>;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  size: "large" | "medium" | "small";
  workflow?: Array<{ step: string; icon: React.ReactNode }>;
  href?: string;
}

const PROJECTS: Project[] = [
  {
    id: "site",
    title: "SITE: DORI-AI",
    subtitle: "AI 커뮤니티 플랫폼",
    description: "AI 커뮤니티 및 정보 공유 플랫폼",
    detail: "기획 배경부터 제작 공정, n8n을 활용한 콘텐츠 수집 및 포스팅 자동화 워크플로우 포함",
    status: "ACTIVE",
    statusLabel: "진행 중",
    tech: [
      { name: "Next.js", icon: <Code className="w-3.5 h-3.5" /> },
      { name: "Tailwind CSS", icon: <Palette className="w-3.5 h-3.5" /> },
      { name: "Gemini API", icon: <Brain className="w-3.5 h-3.5" /> },
      { name: "n8n Automation", icon: <Settings className="w-3.5 h-3.5" /> },
    ],
    icon: <Globe className="w-7 h-7" />,
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.4)",
    size: "large",
    workflow: [
      { step: "콘텐츠 수집", icon: <Database className="w-4 h-4" /> },
      { step: "AI 가공", icon: <Bot className="w-4 h-4" /> },
      { step: "자동 포스팅", icon: <FileText className="w-4 h-4" /> },
      { step: "배포 완료", icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
  },
  {
    id: "app",
    title: "APPLICATION",
    subtitle: "모바일 앱",
    description: "DORI-AI 모바일 전용 앱",
    detail: "PC 환경의 제약을 넘어선 사용자 접근성 강화",
    status: "COMING SOON",
    statusLabel: "예정",
    tech: [
      { name: "Android", icon: <Smartphone className="w-3.5 h-3.5" /> },
      { name: "iOS", icon: <Smartphone className="w-3.5 h-3.5" /> },
      { name: "React Native", icon: <Code className="w-3.5 h-3.5" /> },
    ],
    icon: <Smartphone className="w-6 h-6" />,
    color: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.3)",
    size: "medium",
  },
  {
    id: "shorts",
    title: "YOUTUBE SHORTS",
    subtitle: "AI 뉴스 채널",
    description: "매일 업데이트되는 AI 최신 뉴스",
    detail: "자동 가공하여 숏폼 영상으로 업로드",
    status: "UPCOMING",
    statusLabel: "예정",
    tech: [
      { name: "YouTube API", icon: <Video className="w-3.5 h-3.5" /> },
      { name: "AI Video", icon: <Bot className="w-3.5 h-3.5" /> },
      { name: "Automation", icon: <Zap className="w-3.5 h-3.5" /> },
    ],
    icon: <Video className="w-6 h-6" />,
    color: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.3)",
    size: "medium",
  },
  {
    id: "animation",
    title: "YOUTUBE ANIMATION",
    subtitle: "키즈 채널",
    description: "도리(Dori) & 라라(Lara) 키즈 채널",
    detail: "AI를 활용한 유아용 교육 애니메이션",
    status: "CREATIVE",
    statusLabel: "예정",
    tech: [
      { name: "AI Animation", icon: <Film className="w-3.5 h-3.5" /> },
      { name: "Storytelling", icon: <FileText className="w-3.5 h-3.5" /> },
      { name: "Education", icon: <BookOpen className="w-3.5 h-3.5" /> },
    ],
    icon: <Film className="w-6 h-6" />,
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.3)",
    size: "small",
  },
  {
    id: "gumroad",
    title: "GUMROAD MARKET",
    subtitle: "디지털 마켓",
    description: "디지털 에셋 및 교육 자료 마켓",
    detail: "AI로 생성한 동화책 및 학습 교안 판매",
    status: "AUTOMATION",
    statusLabel: "예정",
    tech: [
      { name: "Gumroad API", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
      { name: "AI Content", icon: <Bot className="w-3.5 h-3.5" /> },
      { name: "E-commerce", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    ],
    icon: <ShoppingBag className="w-6 h-6" />,
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.3)",
    size: "small",
  },
  {
    id: "animal",
    title: "DORI'S 동물도감",
    subtitle: "AI 기반 맞춤형 동물 백과사전",
    description: "아이들의 상상력을 자극하는 AI 기반 맞춤형 동물 백과사전",
    detail: "Notion DB와 연동하여 다양한 동물 정보를 AI 이미지 생성 및 도감 레이아웃으로 자동 구성",
    status: "CREATIVE",
    statusLabel: "진행 중",
    tech: [
      { name: "Notion API", icon: <Database className="w-3.5 h-3.5" /> },
      { name: "AI Image", icon: <Bot className="w-3.5 h-3.5" /> },
      { name: "Next.js", icon: <Code className="w-3.5 h-3.5" /> },
      { name: "Tailwind CSS", icon: <Palette className="w-3.5 h-3.5" /> },
    ],
    icon: <BookOpen className="w-6 h-6" />,
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.4)",
    size: "medium",
    href: "/animal",
    workflow: [
      { step: "동물 데이터 수집", icon: <Database className="w-4 h-4" /> },
      { step: "AI 이미지 생성", icon: <Bot className="w-4 h-4" /> },
      { step: "도감 레이아웃 구성", icon: <FileText className="w-4 h-4" /> },
      { step: "도감 완성", icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
  },
];

const STATUS_CONFIG = {
  ACTIVE: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    text: "text-cyan-400",
  },
  "COMING SOON": {
    icon: <Clock className="w-3.5 h-3.5" />,
    text: "text-blue-400",
  },
  UPCOMING: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    text: "text-red-400",
  },
  CREATIVE: {
    icon: <Film className="w-3.5 h-3.5" />,
    text: "text-purple-400",
  },
  AUTOMATION: {
    icon: <Zap className="w-3.5 h-3.5" />,
    text: "text-amber-400",
  },
};

interface ProjectClientProps {
  initialProjects?: any[];
}

export default function ProjectClient({ initialProjects }: ProjectClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <main
      className="w-full min-h-screen relative overflow-x-hidden"
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {/* 배경 노이즈 텍스처 */}
      <div
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 20s ease infinite',
        }}
      />

      {/* 히어로 섹션 */}
      <section className="relative pt-20 pb-12 px-6 lg:pl-12 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1
            className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
            style={{
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Project
          </h1>

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
            AI 기술 블로그 및 커뮤니티 플랫폼을 위한 프로젝트 포트폴리오
          </p>
        </div>
      </section>

      {/* Bento Grid 섹션 */}
      <section className="container max-w-7xl mx-auto px-6 lg:px-12 pb-24 relative z-10">
        <div className="bento-grid">
          {PROJECTS.map((project, index) => {
            const statusConfig = STATUS_CONFIG[project.status];
            const isMain = project.size === "large";

            return (
              <div
                key={project.id}
                className={`bento-item ${project.size}`}
                style={{
                  animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`,
                }}
              >
                <div
                  className={`relative h-full rounded-2xl p-6 md:p-8 transition-all duration-500 cursor-pointer overflow-hidden group ${isMain ? 'main-card' : ''}`}
                  style={{
                    background: isDark
                      ? '#000000'
                      : isMain
                        ? 'rgba(0, 0, 0, 0.02)'
                        : 'rgba(0, 0, 0, 0.01)',
                    border: `1px solid ${isDark ? '#27272a' : 'rgba(0, 0, 0, 0.1)'}`,
                    backdropFilter: isMain ? 'blur(20px)' : 'blur(12px)',
                    WebkitBackdropFilter: isMain ? 'blur(20px)' : 'blur(12px)',
                    boxShadow: isMain
                      ? isDark
                        ? `0 0 80px ${project.glowColor}, 0 0 40px ${project.glowColor}60, 0 12px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)`
                        : `0 0 60px ${project.glowColor}50, 0 0 30px ${project.glowColor}30, 0 12px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)`
                      : isDark
                        ? '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                        : '0 4px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  }}
                  onMouseEnter={(e) => {
                    if (isMain) {
                      e.currentTarget.style.boxShadow = isDark
                        ? `0 0 120px ${project.glowColor}80, 0 0 60px ${project.glowColor}70, 0 16px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)`
                        : `0 0 80px ${project.glowColor}70, 0 0 50px ${project.glowColor}50, 0 16px 64px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 1)`;
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)';
                      // 데이터 스트림 속도 증가
                      const workflowContainer = e.currentTarget.querySelector('.workflow-container');
                      if (workflowContainer) {
                        (workflowContainer as HTMLElement).style.setProperty('--stream-speed', '0.8s');
                      }
                    } else {
                      e.currentTarget.style.boxShadow = isDark
                        ? `0 0 40px ${project.glowColor}, 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                        : `0 0 30px ${project.glowColor}60, 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)`;
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isMain) {
                      e.currentTarget.style.boxShadow = isDark
                        ? `0 0 80px ${project.glowColor}, 0 0 40px ${project.glowColor}60, 0 12px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)`
                        : `0 0 60px ${project.glowColor}50, 0 0 30px ${project.glowColor}30, 0 12px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)`;
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      // 데이터 스트림 속도 원복
                      const workflowContainer = e.currentTarget.querySelector('.workflow-container');
                      if (workflowContainer) {
                        (workflowContainer as HTMLElement).style.setProperty('--stream-speed', '2s');
                      }
                    } else {
                      e.currentTarget.style.boxShadow = isDark
                        ? '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                        : '0 4px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* 다층 글래스 효과 - 레이어 1 (가장 뒤) */}
                  {isMain && (
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.01)'
                          : 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        transform: 'translateZ(-10px)',
                        opacity: 0.5,
                      }}
                    />
                  )}

                  {/* 다층 글래스 효과 - 레이어 2 (중간) */}
                  {isMain && (
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        transform: 'translateZ(-5px)',
                        opacity: 0.7,
                      }}
                    />
                  )}

                  {/* Specular Highlights - 상단/왼쪽 가장자리 */}
                  {isMain && (
                    <>
                      <div
                        className="absolute top-0 left-0 right-0 h-1/3 rounded-t-2xl pointer-events-none"
                        style={{
                          background: isDark
                            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%)'
                            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)',
                          opacity: 0.6,
                        }}
                      />
                      <div
                        className="absolute top-0 left-0 bottom-0 w-1/3 rounded-l-2xl pointer-events-none"
                        style={{
                          background: isDark
                            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0%, transparent 100%)'
                            : 'linear-gradient(90deg, rgba(255, 255, 255, 0.7) 0%, transparent 100%)',
                          opacity: 0.5,
                        }}
                      />
                    </>
                  )}

                  {/* 강화된 엣지 글로우 */}
                  {isMain && (
                    <div
                      className="absolute -inset-1 rounded-2xl pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${project.color}40, ${project.color}20, ${project.color}40)`,
                        filter: 'blur(20px)',
                        opacity: 0.6,
                        animation: 'edgeGlow 4s ease-in-out infinite',
                      }}
                    />
                  )}

                  {/* Glassmorphism 오버레이 - 메인 레이어 */}
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 50%, rgba(0, 0, 0, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 50%, rgba(0, 0, 0, 0.03) 100%)',
                    }}
                  />

                  {/* 메인 프로젝트 특별 스타일 */}
                  {isMain && (
                    <>
                      {/* 고품질 Automation Workflow 컴포넌트 */}
                      {project.workflow && (
                        <div className="workflow-container mb-8 relative z-10" style={{ '--stream-speed': '2s' } as React.CSSProperties}>
                          {/* 헤더 */}
                          <div className="flex items-center gap-2.5 mb-6">
                            <Workflow className="w-4 h-4" style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
                            <span
                              className="text-xs font-semibold uppercase tracking-wider"
                              style={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                letterSpacing: '0.1em',
                              }}
                            >
                              AUTOMATION WORKFLOW
                            </span>
                          </div>

                          {/* 워크플로우 스텝 */}
                          <div className="flex items-center justify-between relative">
                            {project.workflow.map((step, idx) => (
                              <div key={idx} className="flex-1 flex flex-col items-center relative">
                                {/* 연결선 (왼쪽에서 오른쪽으로 그려지는 애니메이션) */}
                                {idx < project.workflow!.length - 1 && (
                                  <div
                                    className="workflow-connector absolute top-6 left-[calc(50%+28px)] right-[-28px] h-[1px]"
                                    style={{
                                      zIndex: 0,
                                      animation: `drawLine 1.5s ease-out ${idx * 0.3 + 0.5}s both`,
                                    }}
                                  >
                                    {/* 정적 배경선 */}
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        background: isDark
                                          ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.3), rgba(6, 182, 212, 0.1))'
                                          : 'linear-gradient(90deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))',
                                      }}
                                    />
                                    {/* 애니메이션 데이터 스트림 */}
                                    <div
                                      className="data-stream-line absolute inset-0 overflow-hidden"
                                      style={{
                                        background: `linear-gradient(90deg, transparent, ${project.color}, ${project.color}80, transparent)`,
                                        width: '60%',
                                        animation: `dataStreamFlow var(--stream-speed, 2s) linear infinite ${idx * 0.2}s`,
                                        filter: `blur(1px)`,
                                        boxShadow: `0 0 8px ${project.color}50`,
                                      }}
                                    />
                                  </div>
                                )}

                                {/* 아이콘 컨테이너 */}
                                <div className="relative z-10">
                                  <div
                                    className="workflow-icon w-14 h-14 rounded-full flex items-center justify-center relative"
                                    style={{
                                      background: isDark
                                        ? 'rgba(15, 23, 42, 0.6)'
                                        : 'rgba(255, 255, 255, 0.8)',
                                      border: isDark
                                        ? `1.5px solid rgba(6, 182, 212, 0.4)`
                                        : `1.5px solid rgba(6, 182, 212, 0.3)`,
                                      color: project.color,
                                      boxShadow: isDark
                                        ? `0 0 20px ${project.color}40, 0 0 40px ${project.color}20, inset 0 0 20px ${project.color}10`
                                        : `0 0 15px ${project.color}30, 0 0 30px ${project.color}15`,
                                      animation: `workflowIconPulse 2.5s ease-in-out infinite ${idx * 0.4}s`,
                                      transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.1)';
                                      e.currentTarget.style.boxShadow = isDark
                                        ? `0 0 30px ${project.color}60, 0 0 60px ${project.color}40, inset 0 0 30px ${project.color}20`
                                        : `0 0 25px ${project.color}50, 0 0 50px ${project.color}30`;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.boxShadow = isDark
                                        ? `0 0 20px ${project.color}40, 0 0 40px ${project.color}20, inset 0 0 20px ${project.color}10`
                                        : `0 0 15px ${project.color}30, 0 0 30px ${project.color}15`;
                                    }}
                                  >
                                    {/* 아이콘 */}
                                    <div className="relative z-10">
                                      {step.icon}
                                    </div>

                                    {/* 내부 글로우 레이어 */}
                                    <div
                                      className="absolute inset-0 rounded-full"
                                      style={{
                                        background: `radial-gradient(circle at center, ${project.color}25, transparent 70%)`,
                                        animation: `workflowInnerGlow 2.5s ease-in-out infinite ${idx * 0.4}s`,
                                        opacity: 0.6,
                                      }}
                                    />

                                    {/* 외부 글로우 링 */}
                                    <div
                                      className="absolute -inset-1 rounded-full"
                                      style={{
                                        background: `radial-gradient(circle, ${project.color}30, transparent 70%)`,
                                        filter: 'blur(8px)',
                                        animation: `workflowOuterGlow 2.5s ease-in-out infinite ${idx * 0.4}s`,
                                        opacity: 0.4,
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* 라벨 */}
                                <span
                                  className="text-xs font-medium text-center mt-4 whitespace-nowrap"
                                  style={{
                                    color: isDark ? '#ffffff' : '#1d1d1f',
                                    letterSpacing: '0.02em',
                                    fontFamily: '"Pretendard", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                                  }}
                                >
                                  {step.step}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div
                      className="p-3 rounded-xl transition-all duration-300"
                      style={{
                        background: isDark
                          ? `linear-gradient(135deg, ${project.color}20, ${project.color}10)`
                          : `linear-gradient(135deg, ${project.color}15, ${project.color}08)`,
                        border: `1px solid ${project.color}30`,
                        color: project.color,
                      }}
                    >
                      {project.icon}
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold ${statusConfig.text}`}
                      style={{
                        background: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      {statusConfig.icon}
                      <span>{project.statusLabel}</span>
                    </div>
                  </div>

                  {/* 제목 */}
                  <h3
                    className="text-2xl md:text-3xl font-black mb-2 relative z-10"
                    style={{
                      color: isDark ? '#ffffff' : '#000000',
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      lineHeight: '1.2',
                    }}
                  >
                    {project.title}
                  </h3>

                  {/* 서브타이틀 */}
                  {project.subtitle && (
                    <p
                      className="text-sm mb-3 relative z-10"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {project.subtitle}
                    </p>
                  )}

                  {/* 설명 */}
                  <p
                    className={`mb-4 relative z-10 ${isMain ? 'text-base' : 'text-sm'}`}
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                      lineHeight: '1.6',
                    }}
                  >
                    {project.description}
                  </p>

                  {/* 상세 설명 (메인만) */}
                  {isMain && (
                    <p
                      className="text-sm mb-6 relative z-10"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        lineHeight: '1.5',
                      }}
                    >
                      {project.detail}
                    </p>
                  )}

                  {/* Tech Stack with Icons */}
                  <div className="flex flex-wrap gap-2.5 mb-6 relative z-10">
                    {(Array.isArray(project.tech) && typeof project.tech[0] === 'object'
                      ? project.tech
                      : project.tech.map(name => ({ name, icon: null }))
                    ).map((tech: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-300"
                        style={{
                          background: isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.04)',
                          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
                          color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.06)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.04)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {tech.icon && (
                          <span style={{ color: project.color, display: 'flex', alignItems: 'center' }}>
                            {tech.icon}
                          </span>
                        )}
                        <span>{tech.name || tech}</span>
                      </span>
                    ))}
                  </div>

                  {/* 프리미엄 EXPLORE 버튼 */}
                  <div className="relative z-10">
                    {project.href ? (
                      <Link href={project.href}>
                        <button
                          className="explore-btn px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 relative overflow-hidden group w-full"
                          style={{
                            background: isMain
                              ? `linear-gradient(135deg, ${project.color}, ${project.color}80)`
                              : 'transparent',
                            border: isMain ? 'none' : `1.5px solid ${project.color}50`,
                            color: isMain ? '#ffffff' : project.color,
                            boxShadow: isMain
                              ? `0 4px 20px ${project.color}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                              : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (isMain) {
                              e.currentTarget.style.boxShadow = `0 6px 30px ${project.color}70, inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            } else {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${project.color}20, ${project.color}10)`;
                              e.currentTarget.style.boxShadow = `0 0 20px ${project.color}30`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isMain) {
                              e.currentTarget.style.boxShadow = `0 4px 20px ${project.color}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            } else {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.boxShadow = 'none';
                            }
                          }}
                        >
                          {/* 버튼 내부 글로우 */}
                          {isMain && (
                            <div
                              className="absolute inset-0 rounded-xl"
                              style={{
                                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent)`,
                                opacity: 0.6,
                              }}
                            />
                          )}
                          <span>Explore</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </button>
                      </Link>
                    ) : (
                      <button
                        className="explore-btn px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 relative overflow-hidden group"
                        style={{
                          background: isMain
                            ? `linear-gradient(135deg, ${project.color}, ${project.color}80)`
                            : 'transparent',
                          border: isMain ? 'none' : `1.5px solid ${project.color}50`,
                          color: isMain ? '#ffffff' : project.color,
                          boxShadow: isMain
                            ? `0 4px 20px ${project.color}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                            : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (isMain) {
                            e.currentTarget.style.boxShadow = `0 6px 30px ${project.color}70, inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                          } else {
                            e.currentTarget.style.background = `linear-gradient(135deg, ${project.color}20, ${project.color}10)`;
                            e.currentTarget.style.boxShadow = `0 0 20px ${project.color}30`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isMain) {
                            e.currentTarget.style.boxShadow = `0 4px 20px ${project.color}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          } else {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {/* 버튼 내부 글로우 */}
                        {isMain && (
                          <div
                            className="absolute inset-0 rounded-xl"
                            style={{
                              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent)`,
                              opacity: 0.6,
                            }}
                          />
                        )}
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </button>
                    )}
                  </div>

                  {/* 메인 카드 글로우 효과 */}
                  {isMain && (
                    <div
                      className="absolute -inset-1 rounded-2xl opacity-50 blur-xl pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${project.color}40, transparent 70%)`,
                        animation: 'pulseGlow 3s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes workflowIconPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 20px rgba(6, 182, 212, 0.1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.2);
            transform: scale(1.02);
          }
        }

        @keyframes workflowInnerGlow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes workflowOuterGlow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes drawLine {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: 100%;
            opacity: 1;
          }
        }

        @keyframes dataStreamFlow {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(200%);
            opacity: 0;
          }
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: minmax(200px, auto);
          gap: 1.5rem;
        }

        .bento-item.large {
          grid-column: span 12;
          grid-row: span 2;
          min-height: 400px;
        }

        .bento-item.medium {
          grid-column: span 6;
          grid-row: span 1;
          min-height: 280px;
        }

        .bento-item.small {
          grid-column: span 6;
          grid-row: span 1;
          min-height: 240px;
        }

        @media (min-width: 1024px) {
          .bento-item.large {
            grid-column: span 8;
            grid-row: span 2;
          }

          .bento-item.medium {
            grid-column: span 4;
            grid-row: span 1;
          }

          .bento-item.small {
            grid-column: span 4;
            grid-row: span 1;
          }
        }

        @media (max-width: 768px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }

          .bento-item.large,
          .bento-item.medium,
          .bento-item.small {
            grid-column: span 1;
            grid-row: span 1;
            min-height: 300px;
          }
        }
      `}</style>
    </main>
  );
}
