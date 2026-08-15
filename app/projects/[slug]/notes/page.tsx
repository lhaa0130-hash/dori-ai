import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PROJECTS, getProjectBySlug } from "@/constants/projectsData";
import { createMetadata } from "@/lib/seo";

// 프로젝트별 **개발 기록** 페이지 — 날짜별로 "그날의 글 + 그날의 게임"을 한 줄씩 쌓는다.
//
// 2026-08-15: 처음엔 상세 페이지 안에 #versions 앵커로 넣었는데, '바로가기'를 눌러도
// 같은 페이지에서 스크롤만 되어 아무 데도 안 간 것처럼 보였다. 그래서 페이지로 분리했다.
//
// ⚠️ 게임 링크는 반드시 **날짜 폴더**(/games/palhyup/2026-08-14/)를 가리킨다.
//    /latest/ 를 넣으면 개발이 더 진행됐을 때 글과 게임이 어긋난다 — 이 페이지의 존재 이유가 사라진다.
//    운영 규칙: docs/palhyup-versions.md

// 개발 기록이 있는 프로젝트만 이 경로를 만든다(없는 프로젝트는 404).
export function generateStaticParams() {
  return PROJECTS.filter((p) => p.versions && p.versions.length > 0).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const project = getProjectBySlug(params.slug);
  if (!project) return {};
  return createMetadata({
    title: `${project.name} 개발 기록`,
    description: `${project.name}의 날짜별 개발노트와 그날 버전 게임을 모아 봅니다. 각 날짜의 게임은 그 시점 빌드로 고정되어 있어 이후 개발과 무관하게 그대로 실행됩니다.`,
    path: `/projects/${project.slug}/notes`,
  });
}

export default function ProjectNotesPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);
  if (!project || !project.versions || project.versions.length === 0) notFound();

  const versions = [...project.versions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="w-full">
      <section className="pt-8 pb-6 border-b border-stone-100 dark:border-zinc-900">
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-stone-400 hover:text-[#F9954E] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {project.name}
        </Link>
        <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide">개발 기록</p>
        <h1 className="text-[30px] sm:text-[38px] font-extrabold text-stone-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
          날짜별 개발노트와<br />그날의 게임
        </h1>
        <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep">
          왼쪽 제목을 누르면 그날 쓴 개발노트로, 오른쪽 버튼을 누르면{" "}
          <strong className="font-bold text-stone-700 dark:text-stone-300">그날 버전의 게임</strong>이 그대로 실행됩니다.
          이후 개발이 더 진행돼도 지난 버전은 바뀌지 않습니다.
        </p>
      </section>

      <section className="py-8">
        <div className="overflow-x-auto rounded-2xl border border-stone-100 dark:border-zinc-900">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="bg-stone-50 dark:bg-zinc-900/60">
                <th className="px-4 py-3 text-[12px] font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap">날짜</th>
                <th className="px-4 py-3 text-[12px] font-bold text-stone-500 dark:text-stone-400">개발노트</th>
                <th className="px-4 py-3 text-[12px] font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap text-right">게임</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.date} className="border-t border-stone-100 dark:border-zinc-900">
                  <td className="px-4 py-4 align-top whitespace-nowrap">
                    <span className="text-[13px] font-bold tabular-nums text-stone-900 dark:text-white">{v.date}</span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Link href={v.noteHref} className="group inline-block">
                      <span className="text-[12px] font-bold text-[#F9954E] mr-1.5">개발노트 {v.noteNo}</span>
                      <span className="text-[13.5px] text-stone-700 dark:text-stone-300 break-keep group-hover:text-[#F9954E] transition-colors">
                        {v.noteTitle}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 align-top text-right whitespace-nowrap">
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

        <p className="mt-4 text-[12.5px] text-stone-400 break-keep">
          총 {versions.length}개의 기록 · 가장 최근이 위에 옵니다.
        </p>
      </section>
    </main>
  );
}
