"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PROJECTS = [
  {
    id: "illo",
    name: "illo(일로)",
    emoji: "🟧",
    image: "/illo-logo.png",
    tag: "정식 프로그램",
    isMain: true,
    desc: "수많은 AI로, 혼자서도 사업을",
    longDesc:
      "하고 싶은 일을 클릭만 하면, 그 작업에 가장 잘 맞는 AI가 이미 연결돼 있어요. 글쓰기·마케팅·고객응대·요약까지 — 복잡한 설정 없이 누구나 손쉽게 1인 사업을 시작할 수 있는 AI 사무실입니다.",
    href: "/illo/app",
    tags: ["수많은 AI", "1인 사업", "지금 무료"],
    status: "지금 무료",
    isActive: true,
  },
  {
    id: "animal",
    name: "동물도감",
    emoji: "🐾",
    image: "",
    tag: "1st Project",
    isMain: false,
    desc: "포켓몬처럼, 진짜 동물을 배워요",
    longDesc:
      "요즘 아이들이 접하는 동물의 수는 점점 줄고 있어요. 동물도감은 아이들이 다양한 동물을 포켓몬처럼 친숙하게 알아가고, 엑셀처럼 셀을 클릭해서 원하는 조건의 동물을 찾을 수 있도록 만든 교육 프로젝트입니다.",
    href: "/animal",
    tags: ["어린이 교육", "동물 생태", "셀 검색"],
    status: "준비 중",
    isActive: false,
  },
  {
    id: "family",
    name: "가족기록",
    emoji: "👨‍👩‍👧‍👦",
    image: "",
    tag: "2nd Project",
    isMain: false,
    desc: "가족의 모든 것을 하나의 앱으로",
    longDesc:
      "일정·사진·건강·추억·할 일까지, 가족 구성원 모두가 실시간으로 공유하는 가족 전용 플랫폼이에요. 카카오에 흩어진 사진, 각자의 캘린더, 메모장의 건강 기록을 한곳에 모아 온 가족이 함께 볼 수 있게 만들어드려요.",
    href: "/family",
    tags: ["가족 공유", "추억 기록", "AI 요약"],
    status: "기획 중",
    isActive: false,
  },
];

export default function ProjectsPage() {
  return (
    <main className="w-full min-h-screen bg-white dark:bg-black">

      {/* ── Toss 히어로 ── */}
      <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">프로젝트</p>
        <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
          AI가 만드는<br />특별한 프로젝트
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          DORI-AI가 개발 중인 AI 기반 인터랙티브 프로젝트들을 만나보세요.
        </p>
      </section>

      {/* ── 프로젝트 그리드 ── */}
      <section className="py-8">
        <div className="flex flex-col gap-4">

          {PROJECTS.map((project, i) => (
            <div key={project.id} className={`scroll-reveal-item scroll-delay-${i + 1}`}>
              <Link
                href={project.href}
                className="toss-card group flex flex-col rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden"
              >
                {/* 배너 */}
                <div className={`h-28 flex items-center justify-center relative overflow-hidden ${
                  project.isMain
                    ? "bg-[#F9954E]"
                    : "bg-neutral-50 dark:bg-zinc-900"
                }`}>
                  {project.image ? (
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-16 h-16 rounded-2xl shadow-md object-cover"
                    />
                  ) : (
                    <span className="text-5xl drop-shadow-sm">{project.emoji}</span>
                  )}
                  {/* 태그 */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      project.isMain
                        ? "bg-white/25 text-white"
                        : "bg-neutral-200/70 dark:bg-zinc-700 text-neutral-600 dark:text-neutral-300"
                    }`}>
                      {project.tag}
                    </span>
                  </div>
                  {/* 상태 */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      project.isActive
                        ? "bg-[#F9954E] text-white"
                        : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* 콘텐츠 */}
                <div className="p-5">
                  <h2 className="text-[17px] font-extrabold text-neutral-900 dark:text-white mb-1">
                    {project.name}
                  </h2>
                  <p className="text-[13px] font-semibold text-[#F9954E] mb-2">{project.desc}</p>
                  <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4 break-keep">
                    {project.longDesc}
                  </p>

                  {/* 태그들 */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#F9954E]">
                    <span>자세히 보기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            </div>
          ))}

          {/* Coming Soon */}
          <div className="scroll-reveal-item scroll-delay-4 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <span className="text-xl">✨</span>
            </div>
            <p className="text-[13px] font-bold text-neutral-400 dark:text-neutral-500 mb-1">Coming Soon</p>
            <p className="text-[12px] text-neutral-300 dark:text-zinc-600">새로운 프로젝트를 준비 중입니다</p>
          </div>

        </div>
      </section>

    </main>
  );
}
