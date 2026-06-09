"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROJECTS, type ProjectItem } from "@/constants/projectsData";

function ProjectCard({ project, delay }: { project: ProjectItem; delay: number }) {
  return (
    <div className={`scroll-reveal-item scroll-delay-${delay}`}>
      <Link
        href={`/projects/${project.slug}`}
        className="toss-card group flex flex-col rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden"
      >
        {/* 배너 */}
        <div className={`h-28 flex items-center justify-center relative overflow-hidden ${
          project.isMain ? "bg-[#F9954E]" : "bg-neutral-50 dark:bg-zinc-900"
        }`}>
          {project.image ? (
            <img src={project.image} alt={project.name} className="w-16 h-16 rounded-2xl shadow-md object-cover" />
          ) : (
            <span className="text-5xl drop-shadow-sm">{project.emoji}</span>
          )}
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              project.isMain ? "bg-white/25 text-white" : "bg-neutral-200/70 dark:bg-zinc-700 text-neutral-600 dark:text-neutral-300"
            }`}>
              {project.tag}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              project.isActive ? "bg-[#F9954E] text-white" : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400"
            }`}>
              {project.status}
            </span>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-5">
          <h2 className="text-[17px] font-extrabold text-neutral-900 dark:text-white mb-1">{project.name}</h2>
          <p className="text-[13px] font-semibold text-[#F9954E] mb-2">{project.desc}</p>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4 break-keep">{project.longDesc}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400">#{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#F9954E]">
            <span>자세히 보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function ProjectsPage() {
  const mains = PROJECTS.filter((p) => p.category === "main");
  const kids = PROJECTS.filter((p) => p.category === "kids");

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black">

      {/* ── 히어로 ── */}
      <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">프로젝트</p>
        <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
          AI가 만드는<br />특별한 프로젝트
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          DORI-AI가 개발 중인 프로그램들을 만나보세요.
        </p>
      </section>

      {/* ── 일반 프로그램 ── */}
      <section className="py-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[13px] font-extrabold text-neutral-900 dark:text-white">🚀 DORI 프로그램</span>
          <div className="flex-1 h-px bg-neutral-100 dark:bg-zinc-900" />
        </div>
        <div className="flex flex-col gap-4">
          {mains.map((project, i) => (
            <ProjectCard key={project.slug} project={project} delay={(i % 4) + 1} />
          ))}
        </div>
      </section>

      {/* ── 키즈 전용 ── */}
      {kids.length > 0 && (
        <section className="pb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[13px] font-extrabold text-neutral-900 dark:text-white">🧒 키즈 전용</span>
            <span className="text-[11px] font-bold text-[#F9954E] px-2 py-0.5 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10">아이와 함께</span>
            <div className="flex-1 h-px bg-neutral-100 dark:bg-zinc-900" />
          </div>
          <div className="flex flex-col gap-4">
            {kids.map((project, i) => (
              <ProjectCard key={project.slug} project={project} delay={(i % 4) + 1} />
            ))}
          </div>
        </section>
      )}

      {/* ── Coming Soon ── */}
      <section className="pb-16">
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
            <span className="text-xl">✨</span>
          </div>
          <p className="text-[13px] font-bold text-neutral-400 dark:text-neutral-500 mb-1">Coming Soon</p>
          <p className="text-[12px] text-neutral-300 dark:text-zinc-600">새로운 프로젝트를 준비 중입니다</p>
        </div>
      </section>

    </main>
  );
}
