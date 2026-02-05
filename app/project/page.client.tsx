"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion } from "framer-motion";
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
    title: "사이트: DORI-AI",
    subtitle: "AI 커뮤니티 플랫폼",
    description: "AI 정보를 공유하고 소통하는 커뮤니티 플랫폼입니다.",
    detail: "기획부터 제작, 자동화 워크플로우까지 모든 공정을 포함합니다.",
    status: "ACTIVE",
    statusLabel: "진행 중",
    tech: [
      { name: "Next.js", icon: <Code className="w-3.5 h-3.5" /> },
      { name: "Tailwind", icon: <Palette className="w-3.5 h-3.5" /> },
      { name: "Gemini", icon: <Brain className="w-3.5 h-3.5" /> },
      { name: "n8n 자동화", icon: <Settings className="w-3.5 h-3.5" /> },
    ],
    icon: <Globe className="w-7 h-7" />,
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.4)",
    size: "large",
    workflow: [
      { step: "수집", icon: <Database className="w-4 h-4" /> },
      { step: "가공", icon: <Bot className="w-4 h-4" /> },
      { step: "생성", icon: <FileText className="w-4 h-4" /> },
      { step: "배포", icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
  },
  {
    id: "animal",
    title: "동물 도감",
    subtitle: "맞춤형 AI 백과사전",
    description: "아이들의 상상력을 자극하는 나만의 동물 도감입니다.",
    detail: "원하는 동물을 AI가 생성하고 도감 형태로 만들어줍니다.",
    status: "ACTIVE",
    statusLabel: "진행 중",
    tech: [
      { name: "Notion API", icon: <Database className="w-3.5 h-3.5" /> },
      { name: "AI 이미지", icon: <Bot className="w-3.5 h-3.5" /> },
      { name: "Next.js", icon: <Code className="w-3.5 h-3.5" /> },
    ],
    icon: <BookOpen className="w-6 h-6" />,
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.4)",
    size: "medium",
    href: "/animal",
    workflow: [
      { step: "데이터", icon: <Database className="w-4 h-4" /> },
      { step: "이미지", icon: <Bot className="w-4 h-4" /> },
      { step: "편집", icon: <FileText className="w-4 h-4" /> },
      { step: "완성", icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
  },
  {
    id: "app",
    title: "애플리케이션",
    subtitle: "전용 모바일 앱",
    description: "언제 어디서나 접근 가능한 DORI-AI 전용 앱입니다.",
    detail: "PC를 넘어 모바일에서도 최적화된 경험을 제공합니다.",
    status: "COMING SOON",
    statusLabel: "준비 중",
    tech: [
      { name: "Android", icon: <Smartphone className="w-3.5 h-3.5" /> },
      { name: "iOS", icon: <Smartphone className="w-3.5 h-3.5" /> },
      { name: "React Native", icon: <Code className="w-3.5 h-3.5" /> },
    ],
    icon: <Smartphone className="w-6 h-6" />,
    color: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.3)",
    size: "medium",
    workflow: [
      { step: "기획", icon: <FileText className="w-4 h-4" /> },
      { step: "디자인", icon: <Palette className="w-4 h-4" /> },
      { step: "개발", icon: <Code className="w-4 h-4" /> },
      { step: "출시", icon: <Smartphone className="w-4 h-4" /> },
    ],
  },
  {
    id: "shorts",
    title: "유튜브 숏츠",
    subtitle: "AI 뉴스 채널",
    description: "매일 업데이트되는 최신 AI 뉴스를 전해드립니다.",
    detail: "대본 작성부터 영상 편집까지 AI 자동화로 이루어집니다.",
    status: "COMING SOON",
    statusLabel: "준비 중",
    tech: [
      { name: "YouTube API", icon: <Video className="w-3.5 h-3.5" /> },
      { name: "AI Video", icon: <Bot className="w-3.5 h-3.5" /> },
      { name: "자동화", icon: <Zap className="w-3.5 h-3.5" /> },
    ],
    icon: <Video className="w-6 h-6" />,
    color: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.3)",
    size: "medium",
    workflow: [
      { step: "기획", icon: <Brain className="w-4 h-4" /> },
      { step: "대본", icon: <FileText className="w-4 h-4" /> },
      { step: "생성", icon: <Bot className="w-4 h-4" /> },
      { step: "업로드", icon: <Video className="w-4 h-4" /> },
    ],
  },
  {
    id: "animation",
    title: "유튜브 애니메이션",
    subtitle: "키즈 교육 채널",
    description: "도리(Dori)와 라라(Lara)가 함께하는 교육 애니메이션입니다.",
    detail: "아이들의 눈높이에 맞춘 AI 기반 스토리텔링 콘텐츠입니다.",
    status: "COMING SOON",
    statusLabel: "준비 중",
    tech: [
      { name: "AI 애니메이션", icon: <Film className="w-3.5 h-3.5" /> },
      { name: "스토리텔링", icon: <FileText className="w-3.5 h-3.5" /> },
      { name: "교육", icon: <BookOpen className="w-3.5 h-3.5" /> },
    ],
    icon: <Film className="w-6 h-6" />,
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.3)",
    size: "small",
    workflow: [
      { step: "시나리오", icon: <BookOpen className="w-4 h-4" /> },
      { step: "콘티", icon: <Palette className="w-4 h-4" /> },
      { step: "생성", icon: <Bot className="w-4 h-4" /> },
      { step: "편집", icon: <Film className="w-4 h-4" /> },
    ],
  },
  {
    id: "gumroad",
    title: "디지털 마켓",
    subtitle: "에셋 & 교육 자료",
    description: "AI로 생성한 고품질 디지털 에셋과 교육 자료를 판매합니다.",
    detail: "전자책, 학습 교안, 프롬프트 템플릿 등을 만나보세요.",
    status: "COMING SOON",
    statusLabel: "준비 중",
    tech: [
      { name: "Gumroad API", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
      { name: "AI 콘텐츠", icon: <Bot className="w-3.5 h-3.5" /> },
      { name: "이커머스", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    ],
    icon: <ShoppingBag className="w-6 h-6" />,
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.3)",
    size: "small",
    workflow: [
      { step: "기획", icon: <Brain className="w-4 h-4" /> },
      { step: "제작", icon: <Palette className="w-4 h-4" /> },
      { step: "등록", icon: <Database className="w-4 h-4" /> },
      { step: "판매", icon: <ShoppingBag className="w-4 h-4" /> },
    ],
  },
];

const STATUS_CONFIG = {
  ACTIVE: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "진행 중",
    style: "bg-orange-50 dark:bg-black text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
  },
  "COMING SOON": {
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "준비 중",
    style: "bg-neutral-100 dark:bg-black text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-zinc-800",
  },
  UPCOMING: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: "출시 예정",
    style: "bg-neutral-100 dark:bg-black text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-zinc-800",
  },
  CREATIVE: {
    icon: <Film className="w-3.5 h-3.5" />,
    label: "제작 중",
    style: "bg-orange-50 dark:bg-black text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
  },
  AUTOMATION: {
    icon: <Zap className="w-3.5 h-3.5" />,
    label: "자동화",
    style: "bg-orange-50 dark:bg-black text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
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
      className="w-full min-h-screen relative overflow-x-hidden bg-white dark:!bg-black transition-colors duration-500"
      style={{
        fontFamily: '"Pretendard", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
    >
      {/* 배경 그라데이션 (Main Page Style - Explicit & Visible) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:hidden pointer-events-none z-0" />

      {/* 히어로 섹션 (Minimal & Compact - Enhanced) */}
      <section className="relative pt-32 pb-16 px-6 text-center z-10">
        <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-zinc-900/50 border border-orange-200 dark:border-zinc-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
            <Sparkles className="w-3 h-3" />
            <span>Project Gallery</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              프로젝트
            </span>
          </h1>
          <p className={`text-base md:text-lg font-medium break-keep leading-relaxed max-w-xl ${isDark ? "text-white" : "text-neutral-600"}`}>
            DORI-AI의 여정과 다양한 <span className="text-orange-500">기술적 실험</span>들을 기록합니다.
          </p>
        </div>
      </section>

      {/* 프로젝트 그리드 */}
      <section className="container max-w-7xl mx-auto px-6 lg:px-12 pb-32 relative z-10">
        <div className="grid grid-cols-1 gap-6">
          {PROJECTS.map((project, index) => {
            const statusStyle = STATUS_CONFIG[project.status];
            const isMain = project.size === "large";

            return (
              <div
                key={project.id}
                className={`group relative rounded-[2rem] p-6 transition-all duration-500 bg-white dark:!bg-black backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/30 dark:hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 hover:scale-[1.01] flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8`}
                style={{
                  animation: `slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`,
                }}
              >
                {/* Icon Section - Unified Orange Style (Main Page Match) */}
                <div
                  className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-105 group-hover:shadow-md bg-orange-50 dark:bg-neutral-900 border-orange-200 dark:border-neutral-800 text-orange-600 dark:text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.1)] dark:shadow-none"
                >
                  {project.icon}
                </div>

                {/* Main Info Section */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-xl font-bold group-hover:text-orange-500 transition-colors duration-300 truncate ${isDark ? "text-white" : "text-neutral-900"}`}>
                      {project.title}
                    </h3>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 ${statusStyle.style}`}>
                      {statusStyle.icon}
                      <span className="hidden sm:inline">{statusStyle.label}</span>
                    </div>
                  </div>

                  <p
                    className={`text-sm line-clamp-1 mb-3 ${isDark ? "text-white" : "text-neutral-600"}`}
                  >
                    {project.description}
                  </p>

                  {/* Minimal Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(project.tech) && typeof project.tech[0] === 'object'
                      ? project.tech
                      : project.tech.map(name => ({ name, icon: null }))
                    ).map((tech: any, idx: number) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${isDark
                          ? "bg-neutral-800 text-white hover:bg-black"
                          : "bg-neutral-100/50 text-neutral-500 hover:bg-white"
                          }`}
                      >
                        {tech.name || tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Side: Workflow or Placeholder + Action */}
                <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-6 lg:mx-4">

                  {/* Workflow Animation (Dynamic & Colorful) */}
                  {project.workflow && (
                    <div className="flex-1 lg:w-[280px] hidden sm:flex items-center justify-between relative px-2 py-3 bg-neutral-50/30 dark:!bg-black rounded-xl border border-transparent dark:border-neutral-800">
                      {/* 1. Base Track */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-100 dark:bg-neutral-800 -translate-y-1/2 rounded-full" />

                      {/* 2. Swirling Particle (SVG Animation) */}
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-30" style={{ filter: 'drop-shadow(0 0 2px rgba(255,165,0,0.5))' }}>
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 280 56">
                          <defs>
                            <radialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="white" stopOpacity="1" />
                              <stop offset="100%" stopColor="orange" stopOpacity="0" />
                            </radialGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {/* 
                                Precise Swirl Path Calculation:
                                Container Width: 280px. 4 Icons spaced evenly.
                                Centers: 24, 101, 179, 256. Radius: 18.
                                Pattern: Line -> 1.5 Loop (540deg) -> Line -> ...
                            */}
                          <path
                            id="swirlPath"
                            d="M 0 28 L 6 28 a 18 18 0 1 1 36 0 a 18 18 0 1 1 -36 0 a 18 18 0 1 1 36 0 L 83 28 a 18 18 0 1 1 36 0 a 18 18 0 1 1 -36 0 a 18 18 0 1 1 36 0 L 161 28 a 18 18 0 1 1 36 0 a 18 18 0 1 1 -36 0 a 18 18 0 1 1 36 0 L 238 28 a 18 18 0 1 1 36 0 a 18 18 0 1 1 -36 0 a 18 18 0 1 1 36 0 L 280 28"
                            fill="none"
                            stroke="none"
                          />

                          {/* Main Particle */}
                          <circle r="3" filter="url(#glow)">
                            <animate attributeName="fill" values="#FF00FF;#00FFFF;#00FF00;#FFFF00;#FF0000;#BF00FF;#FF00FF" dur="2s" repeatCount="indefinite" />
                            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                              <mpath href="#swirlPath" />
                            </animateMotion>
                          </circle>

                          {/* Trail Particle 1 */}
                          <circle r="2" opacity="0.9">
                            <animate attributeName="fill" values="#00FFFF;#00FF00;#FFFF00;#FF0000;#BF00FF;#FF00FF;#00FFFF" dur="2s" repeatCount="indefinite" />
                            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto" begin="0.1s">
                              <mpath href="#swirlPath" />
                            </animateMotion>
                          </circle>

                          {/* Trail Particle 2 */}
                          <circle r="1" opacity="0.8">
                            <animate attributeName="fill" values="#00FF00;#FFFF00;#FF0000;#BF00FF;#FF00FF;#00FFFF;#00FF00" dur="2s" repeatCount="indefinite" />
                            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto" begin="0.2s">
                              <mpath href="#swirlPath" />
                            </animateMotion>
                          </circle>
                        </svg>
                      </div>

                      {/* 3. Steps Icons */}
                      {project.workflow.map((step, idx) => (
                        <div key={idx} className="relative z-20 group/step">
                          <motion.div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center relative overflow-hidden ${isDark
                              ? "bg-black border-neutral-800 text-white"
                              : "bg-white border-neutral-100 text-neutral-400"
                              }`}
                            whileHover={{ scale: 1.15, rotate: 5 }}
                          >
                            {/* Icon Background Glow */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 opacity-0 group-hover/step:opacity-100 transition-opacity duration-300"
                            />

                            <div className="relative z-10 group-hover/step:text-transparent group-hover/step:bg-clip-text group-hover/step:bg-gradient-to-r group-hover/step:from-orange-500 group-hover/step:to-pink-500 transition-all duration-300">
                              {step.icon}
                            </div>
                          </motion.div>

                          {/* Label */}
                          <span
                            className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover/step:opacity-100 transition-all duration-300 whitespace-nowrap group-hover/step:-translate-y-1 ${isDark ? "text-white" : "text-neutral-400"
                              }`}
                          >
                            {step.step}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="shrink-0 ml-auto lg:ml-0">
                    {project.href ? (
                      <Link href={project.href}>
                        <button className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-orange-500/20 group-hover:bg-orange-500 group-hover:text-white">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-300 dark:text-neutral-600 flex items-center justify-center cursor-not-allowed">
                        <Clock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
