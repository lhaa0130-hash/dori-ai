import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PROJECTS, getProjectBySlug } from "@/constants/projectsData";
import ProjectSuggestion from "@/components/projects/ProjectSuggestion";

const SITE_URL = "https://illo.im";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const project = getProjectBySlug(params.slug);
  if (!project) return { title: "프로젝트 | illo" };
  const url = `${SITE_URL}/projects/${project.slug}`;
  return {
    title: `${project.name} | illo 프로젝트`,
    description: project.longDesc,
    alternates: { canonical: url },
    openGraph: {
      title: `${project.name} | illo`,
      description: project.desc,
      url,
      siteName: "illo",
      locale: "ko_KR",
      type: "website",
    },
  };
}

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center text-center py-24">
        <p className="text-[40px] mb-3">🧩</p>
        <h1 className="text-[18px] font-extrabold text-neutral-900 dark:text-white mb-2">프로젝트를 찾을 수 없어요</h1>
        <Link href="/projects" className="text-[13px] font-bold text-[#F9954E]">← 프로젝트 목록으로</Link>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black">

      {/* 뒤로 */}
      <div className="pt-6">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-400 hover:text-[#F9954E] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> 프로젝트
        </Link>
      </div>

      {/* 히어로 */}
      <section className="pt-6 pb-8 border-b border-neutral-100 dark:border-zinc-900">
        <div className="flex items-center gap-4 mb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${project.isMain ? "bg-[#F9954E]" : "bg-neutral-50 dark:bg-zinc-900"}`}>
            {project.image
              ? <img src={project.image} alt={project.name} loading="lazy" className="w-12 h-12 rounded-xl object-cover" />
              : <span className="text-4xl">{project.emoji}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-300">{project.tag}</span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${project.isActive ? "bg-[#F9954E] text-white" : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400"}`}>{project.status}</span>
          </div>
        </div>

        <h1 className="text-[32px] sm:text-[42px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          {project.name}
        </h1>
        <p className="text-[15px] font-bold text-[#F9954E] mb-4">{project.desc}</p>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">{project.longDesc}</p>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {project.tags.map((t) => (
            <span key={t} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400">#{t}</span>
          ))}
        </div>

        {/* 실행/체험 버튼 */}
        {project.launchHref ? (
          <Link
            href={project.launchHref}
            className="toss-shine inline-flex items-center gap-1.5 mt-6 px-6 py-3 rounded-full bg-[#F9954E] text-white text-[14px] font-bold shadow-md shadow-[#F9954E]/25 active:opacity-85 transition-opacity"
          >
            {project.launchLabel || "바로가기"} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="inline-flex items-center gap-1.5 mt-6 px-6 py-3 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-400 text-[14px] font-bold">
            출시 준비 중이에요
          </div>
        )}
      </section>

      {/* 주요 기능 */}
      <section className="py-8">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-4">주요 기능</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {project.features.map((f) => (
            <div key={f.title} className="p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
              <span className="text-[26px] leading-none">{f.icon}</span>
              <h3 className="text-[15px] font-extrabold text-neutral-900 dark:text-white mt-3 mb-1">{f.title}</h3>
              <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">{f.detail}</p>
            </div>
          ))}
        </div>

        {/* 프로젝트별 건의사항 */}
        <ProjectSuggestion slug={project.slug} projectName={project.name} />
      </section>

    </main>
  );
}
