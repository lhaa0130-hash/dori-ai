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
        <h1 className="text-[18px] font-extrabold text-stone-900 dark:text-white mb-2">프로젝트를 찾을 수 없어요</h1>
        <Link href="/projects" className="text-[13px] font-bold text-[#F9954E]">← 프로젝트 목록으로</Link>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black">

      {/* 뒤로 */}
      <div className="pt-6">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-stone-400 hover:text-[#F9954E] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> 프로젝트
        </Link>
      </div>

      {/* 히어로 */}
      <section className="pt-6 pb-8 border-b border-stone-100 dark:border-zinc-900">
        <div className="flex items-center gap-4 mb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${project.isMain ? "bg-[#F9954E]" : "bg-stone-50 dark:bg-zinc-900"}`}>
            {project.image
              ? <img src={project.image} alt={project.name} loading="lazy" className="w-12 h-12 rounded-xl object-cover" />
              : <span className="text-4xl">{project.emoji}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-300">{project.tag}</span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${project.isActive ? "bg-[#F9954E] text-white" : "bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-400"}`}>{project.status}</span>
          </div>
        </div>

        <h1 className="text-[32px] sm:text-[42px] font-extrabold text-stone-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          {project.name}
        </h1>
        <p className="text-[15px] font-bold text-[#F9954E] mb-4">{project.desc}</p>
        <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep">{project.longDesc}</p>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {project.tags.map((t) => (
            <span key={t} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-400">#{t}</span>
          ))}
        </div>

        {/* 실행/체험 버튼 — 비활성(준비 중) 프로젝트는 링크 없이 '준비 중' 표시.
            2026-08-15: 개발노트(docHref)가 있으면 옆에 함께 놓는다. 만든 과정을 읽는 것과
            실제로 돌려보는 것은 다른 행동이라, 한쪽만 있으면 나머지로 가는 길이 사라진다. */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          {project.isActive && project.launchHref ? (
            <Link
              href={project.launchHref}
              className="toss-shine inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-[#F9954E] text-white text-[14px] font-bold shadow-md shadow-[#F9954E]/25 active:opacity-85 transition-opacity"
            >
              {project.launchLabel || "바로가기"} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-400 text-[14px] font-bold">
              출시 준비 중이에요
            </div>
          )}

          {project.docHref && (
            <Link
              href={project.docHref}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-stone-300 text-[14px] font-bold hover:border-[#F9954E]/50 hover:text-[#F9954E] transition-colors"
            >
              {project.docLabel || "개발노트"} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </section>

      {/* 주요 기능 */}
      <section className="py-8">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-4">주요 기능</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {project.features.map((f) => (
            <div key={f.title} className="p-5 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
              <span className="text-[26px] leading-none">{f.icon}</span>
              <h3 className="text-[15px] font-extrabold text-stone-900 dark:text-white mt-3 mb-1">{f.title}</h3>
              <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep">{f.detail}</p>
            </div>
          ))}
        </div>

        {/* 프로젝트별 건의사항 */}
        <ProjectSuggestion slug={project.slug} projectName={project.name} />
      </section>

      {/* ── 날짜별 개발 기록 ──
          한 줄이 "그날의 글 + 그날의 게임" 한 쌍이다. 개발노트를 매일 쓰는 프로젝트에만 나온다.
          ⚠️ 게임 링크는 **날짜 폴더**를 가리킨다. 그래서 8월 14일 줄을 누르면 몇 달 뒤에도
             8월 14일자 빌드가 뜬다 — 글에 적힌 내용과 실제로 돌아가는 게임이 어긋나지 않는다.
             (프로젝트 상단 '바로가기'가 이 표로 내려온다) */}
      {project.versions && project.versions.length > 0 && (
        <section id="versions" className="py-8 scroll-mt-20 border-t border-stone-100 dark:border-zinc-900">
          <p className="text-[12px] font-semibold text-[#F9954E] mb-1.5">개발 기록</p>
          <p className="text-[13px] text-stone-500 dark:text-stone-400 mb-5 break-keep">
            날짜를 누르면 그날 쓴 개발노트로, 오른쪽 버튼을 누르면 <strong className="font-bold text-stone-700 dark:text-stone-300">그날 버전의 게임</strong>이 그대로 실행됩니다.
            이후 개발이 더 진행돼도 지난 버전은 바뀌지 않습니다.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-stone-100 dark:border-zinc-900">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="bg-stone-50 dark:bg-zinc-900/60">
                  <th className="px-4 py-3 text-[12px] font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap">날짜</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-stone-500 dark:text-stone-400">개발노트</th>
                  <th className="px-4 py-3 text-[12px] font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap text-right">게임</th>
                </tr>
              </thead>
              <tbody>
                {[...project.versions].sort((a, b) => b.date.localeCompare(a.date)).map((v) => (
                  <tr key={v.date} className="border-t border-stone-100 dark:border-zinc-900">
                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                      <span className="text-[13px] font-bold tabular-nums text-stone-900 dark:text-white">{v.date}</span>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <Link href={v.noteHref} className="group inline-block">
                        <span className="text-[12px] font-bold text-[#F9954E] mr-1.5">개발노트 {v.noteNo}</span>
                        <span className="text-[13.5px] text-stone-700 dark:text-stone-300 break-keep group-hover:text-[#F9954E] transition-colors">
                          {v.noteTitle}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                      <Link
                        href={v.gameHref}
                        className="inline-flex items-center gap-1 rounded-full bg-[#F9954E] px-3.5 py-2 text-[12px] font-bold text-white transition active:scale-95 hover:bg-[#f0862f]"
                      >
                        게임 바로가기 <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </main>
  );
}
