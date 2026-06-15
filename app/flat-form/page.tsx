import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Flat-Form · 건축설계 보조 프로그램 | DORI-AI",
  description: "선으로 도면을 그리면 실(室)과 면적을 자동으로 인식·계산하는 건축설계 보조 프로그램. (준비 중)",
  alternates: { canonical: "/flat-form" },
};

export default function FlatFormPage() {
  return (
    <main className="w-full min-h-screen">
      <section className="max-w-2xl mx-auto px-5 pt-16 pb-24 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-[34px] mb-5">
          📐
        </div>

        <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 mb-4">
          준비 중
        </span>

        <h1 className="text-[34px] sm:text-[42px] font-extrabold tracking-tight text-neutral-950 dark:text-white leading-[1.1] mb-3">
          Flat-Form
        </h1>
        <p className="text-[15px] font-semibold text-[#F9954E] mb-4">건축설계 보조 프로그램</p>

        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep max-w-lg mx-auto">
          선을 그어 도면을 만들면 닫힌 공간(실)을 자동으로 인식하고 면적을 계산해 주는
          건축설계 보조 도구입니다. 평면 설계부터 시작해 입면·3D·AI 사진 기반 설계까지 확장할 예정이에요.
        </p>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-full bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85"
          >
            메인으로
          </Link>
        </div>
      </section>
    </main>
  );
}
