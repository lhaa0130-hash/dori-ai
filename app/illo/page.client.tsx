"use client";

import Link from "next/link";
import { Sparkles, MousePointerClick, Users, ShieldCheck, Smartphone, Globe, ArrowRight } from "lucide-react";

// 웹은 설치 없이 바로 실행(/illo/app), 안드로이드 APK(4MB)는 사이트에서 직접 다운로드.
const ANDROID_URL = "/download/Illo-v3.75.0.apk";

const FEATURES = [
  {
    icon: Users,
    title: "AI 직원을 불러와 일 시키기",
    desc: "기획·디자인·개발·마케팅 등 필요한 AI 직원을 채용하고, 사장님처럼 지시만 하면 됩니다.",
  },
  {
    icon: MousePointerClick,
    title: "필요한 기능만 드래그로",
    desc: "수십 개 기능 중 내게 필요한 것만 보관함에서 꺼내 좌측 메뉴에 배치. 드래그 앤 드롭으로 내 입맛대로.",
  },
  {
    icon: ShieldCheck,
    title: "내 키로, 내 데이터는 내 PC에",
    desc: "AI는 회원님의 API 키로 동작하고, 작업물·데이터는 본인 기기에 저장됩니다. 키는 계정에 안전하게 동기화돼 어느 기기에서든 복원돼요.",
  },
];

const STEPS = [
  { n: "1", t: "다운로드 & 실행", d: "윈도우(또는 폰 앱)를 받아 실행합니다. 설치 없이 바로 켜져요." },
  { n: "2", t: "회원가입 / 로그인", d: "dori-ai.com 계정으로 로그인. 처음이면 앱에서 바로 가입할 수 있어요." },
  { n: "3", t: "API 키 넣고 시작", d: "내 API 키를 한 번만 넣으면, AI 직원을 채용해 일을 맡길 수 있어요." },
];

export default function IlloPageClient() {
  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-[560px] bg-gradient-to-b from-[#FEEBD0]/50 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/12 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Hero */}
        <section className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-7">
            <Sparkles className="w-3 h-3" />
            <span>DORI-AI 정식 프로그램 · 베타</span>
          </div>

          <img src="/illo-logo.png" alt="일로" width={96} height={96} className="w-24 h-24 rounded-[26px] shadow-xl shadow-[#F9954E]/20 mb-6" />

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-4">
            일로
          </h1>
          <p className="text-lg md:text-2xl font-bold mb-3">
            <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              혼자서도, 일이 되는 곳
            </span>
          </p>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed break-keep mb-9">
            AI 직원을 불러와 지시하고, 내 사업·콘텐츠·사이트를 실제로 굴리는 1인용 AI 사무실.
            필요한 기능만 꺼내 쓰는 나만의 작업 공간이에요.
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/illo/app"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-[15px] shadow-lg shadow-[#F9954E]/25 transition-all hover:-translate-y-0.5"
            >
              <Globe className="w-5 h-5" />
              웹에서 바로 시작
            </Link>
            <a
              href={ANDROID_URL}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl border-2 border-[#F9954E]/40 hover:border-[#F9954E] text-[#E8832E] dark:text-[#FBAA60] font-bold text-[15px] transition-all hover:-translate-y-0.5"
            >
              <Smartphone className="w-5 h-5" />
              Android 앱
            </a>
          </div>
          <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-4">
            설치 없이 브라우저에서 바로 · Android 8.0+ · 본인 API 키로 동작
          </p>
        </section>

        {/* Features */}
        <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-7 hover:border-[#F9954E] dark:hover:border-[#F9954E] transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-[#F9954E]" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* How to start */}
        <section className="mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-neutral-900 dark:text-white mb-3">
            3단계면 시작 준비 끝
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-12 break-keep">
            복잡한 설치 없이, 받아서 켜면 바로 시작할 수 있어요.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="relative bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-7">
                <div className="w-10 h-10 rounded-full bg-[#F9954E] text-white font-extrabold flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1.5">{s.t}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Download detail / CTA */}
        <section className="mt-24 rounded-[28px] bg-gradient-to-br from-[#FFF5EB] to-[#FEEBD0] dark:from-zinc-900 dark:to-zinc-900/40 border border-[#FDD5A5] dark:border-zinc-800 p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white mb-3">지금 바로 시작해보세요</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 break-keep">
            일로는 무료로 받아 쓸 수 있어요. (AI 사용료는 회원님의 API 키로 정산됩니다)
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link href="/illo/app" className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-[15px] shadow-lg shadow-[#F9954E]/25 transition-all hover:-translate-y-0.5">
              <Globe className="w-5 h-5" /> 웹에서 바로 시작
            </Link>
            <a href={ANDROID_URL} className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-[#F9954E]/40 hover:border-[#F9954E] text-[#E8832E] dark:text-[#FBAA60] font-bold text-[15px] transition-all hover:-translate-y-0.5">
              <Smartphone className="w-5 h-5" /> Android 앱
            </a>
          </div>
          <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E8832E] dark:text-[#FBAA60] hover:gap-3 transition-all">
            아직 계정이 없으신가요? 회원가입 <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
