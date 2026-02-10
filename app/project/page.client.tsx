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
      {/* Clean Pastel Orange Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50 via-orange-50/30 to-transparent dark:from-orange-950/10 dark:via-transparent pointer-events-none z-0" />

      {/* 히어로 섹션 - Minimal & Clean */}
      <section className="relative pt-40 pb-20 px-6 text-center z-10">
        <div className="max-w-2xl mx-auto flex flex-col items-center space-y-6">
          {/* Simple Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/30 text-orange-500 dark:text-orange-400 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Projects</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white">
            프로젝트
          </h1>

          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed">
            DORI-AI의 여정과 기술적 실험들
          </p>

          {/* Clean Statistics */}
          <div className="flex items-center gap-12 mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-1">
                {PROJECTS.filter(p => p.status === "ACTIVE").length}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                진행중
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-1">
                {PROJECTS.length}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                전체
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 프로젝트 그리드 */}
      <section className="container max-w-7xl mx-auto px-6 lg:px-12 pb-32 relative z-10">
        <div className="grid grid-cols-1 gap-6">
          {PROJECTS.map((project, index) => {
            const statusStyle = STATUS_CONFIG[project.status];
            const isMain = project.size === "large";

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
                className="group relative rounded-3xl p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-xl hover:shadow-orange-100/50 dark:hover:shadow-orange-950/20 transition-all duration-300 flex flex-col lg:flex-row items-start lg:items-center gap-6"
              >
                {/* Clean Icon */}
                <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/30 text-orange-500 group-hover:scale-105 transition-transform duration-300">
                  {project.icon}
                </div>

                {/* Main Info - Clean & Minimal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                      {project.title}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.style} flex items-center gap-1.5 shrink-0`}>
                      {statusStyle.icon}
                      <span>{statusStyle.label}</span>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Simple Tech Tags */}
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(project.tech) && typeof project.tech[0] === 'object'
                      ? project.tech
                      : project.tech.map(name => ({ name, icon: null }))
                    ).map((tech: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-100 dark:border-neutral-700"
                      >
                        {tech.name || tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Simple Action Button */}
                <div className="shrink-0 ml-auto">
                  {project.href ? (
                    <Link href={project.href}>
                      <button className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/50">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
