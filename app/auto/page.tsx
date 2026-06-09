import Link from "next/link";
import { ArrowRight, Zap, Clock, RefreshCw, Bot, Workflow, BarChart3 } from "lucide-react";

const TOOLS = [
  { name: "n8n",      desc: "오픈소스 자동화 워크플로우",  emoji: "⚡", href: "/ai-tools" },
  { name: "Make",     desc: "비주얼 자동화 플랫폼",        emoji: "🔄", href: "/ai-tools" },
  { name: "Zapier",   desc: "앱 연결 자동화",              emoji: "⚡", href: "/ai-tools" },
  { name: "ChatGPT",  desc: "AI 기반 텍스트 자동화",       emoji: "🤖", href: "/ai-tools" },
];

const BENEFITS = [
  {
    icon: Clock,
    title: "시간 절약",
    desc: "반복 작업을 자동화해 하루 수 시간을 되찾으세요. 단순 업무는 AI에게 맡기세요.",
  },
  {
    icon: RefreshCw,
    title: "24/7 무중단 실행",
    desc: "사람이 없어도 자동으로 돌아갑니다. 새벽에도, 주말에도, 쉬지 않고.",
  },
  {
    icon: BarChart3,
    title: "실수 없는 처리",
    desc: "사람이 하면 실수할 수 있는 작업도 자동화하면 일관되고 정확하게 처리됩니다.",
  },
];

const USE_CASES = [
  { label: "SNS 자동 포스팅",    emoji: "📱" },
  { label: "이메일 자동 분류",    emoji: "📧" },
  { label: "데이터 수집 & 정리", emoji: "📊" },
  { label: "보고서 자동 생성",   emoji: "📝" },
  { label: "알림 & 슬랙 연동",   emoji: "🔔" },
  { label: "파일 변환 & 이동",   emoji: "📁" },
];

export default function AutoPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">

      {/* ── 히어로 ── */}
      <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3 toss-fade-line toss-delay-0">자동화</p>
        <h1 className="text-[38px] sm:text-[52px] font-extrabold leading-[1.1] tracking-tight mb-4 break-keep overflow-hidden">
          <span className="block toss-fade-line toss-delay-0 text-neutral-950 dark:text-white">반복 업무는</span>
          <span className="block toss-fade-line toss-delay-1 text-[#F9954E]">AI에게 맡기세요.</span>
        </h1>
        <p className="toss-fade-up toss-delay-2 text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep mb-6">
          n8n, Make, Zapier 같은 자동화 도구와 ChatGPT를 연결하면<br className="hidden sm:block" />
          매일 반복하는 지루한 작업들이 사라집니다.
        </p>
        <div className="toss-fade-up toss-delay-3 flex gap-3">
          <Link
            href="/ai-tools"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#F9954E] text-white text-[13px] font-bold active:opacity-80 transition-opacity"
          >
            자동화 도구 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/insight"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300 text-[13px] font-bold active:opacity-80 transition-opacity"
          >
            자동화 가이드
          </Link>
        </div>
      </section>

      {/* ── 자동화로 얻는 것 ── */}
      <section className="py-12 border-b border-neutral-100 dark:border-zinc-900">
        <div className="scroll-reveal mb-8">
          <p className="text-[12px] font-semibold text-[#F9954E] mb-2">WHY 자동화</p>
          <h2 className="text-[24px] sm:text-[30px] font-extrabold text-neutral-950 dark:text-white leading-[1.2] tracking-tight break-keep">
            왜 지금 자동화인가
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className={`scroll-reveal-item scroll-delay-${i + 1} flex items-start gap-4 p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-5 h-5 text-[#F9954E]" />
              </div>
              <div>
                <p className="text-[14px] font-extrabold text-neutral-900 dark:text-white mb-1">{b.title}</p>
                <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 자동화 활용 사례 ── */}
      <section className="py-12 border-b border-neutral-100 dark:border-zinc-900">
        <div className="scroll-reveal mb-6">
          <p className="text-[12px] font-semibold text-[#F9954E] mb-2">활용 사례</p>
          <h2 className="text-[24px] sm:text-[30px] font-extrabold text-neutral-950 dark:text-white leading-[1.2] tracking-tight break-keep">
            이런 것들을 자동화할 수 있어요
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {USE_CASES.map((uc, i) => (
            <div
              key={uc.label}
              className={`scroll-reveal-item scroll-delay-${(i % 4) + 1} flex items-center gap-3 p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50 dark:bg-zinc-950`}
            >
              <span className="text-[20px]">{uc.emoji}</span>
              <span className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 break-keep">{uc.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 추천 자동화 도구 ── */}
      <section className="py-12 border-b border-neutral-100 dark:border-zinc-900">
        <div className="scroll-reveal mb-6">
          <p className="text-[12px] font-semibold text-[#F9954E] mb-2">도구</p>
          <h2 className="text-[24px] sm:text-[30px] font-extrabold text-neutral-950 dark:text-white leading-[1.2] tracking-tight break-keep">
            추천 자동화 도구
          </h2>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-2 break-keep">
            도리가 엄선한 자동화 도구들을 확인해보세요.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {TOOLS.map((tool, i) => (
            <Link
              key={tool.name}
              href={tool.href}
              className={`scroll-reveal-item scroll-delay-${i + 1} toss-card flex items-center justify-between p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{tool.emoji}</span>
                <div>
                  <p className="text-[14px] font-extrabold text-neutral-900 dark:text-white">{tool.name}</p>
                  <p className="text-[12px] text-neutral-400 dark:text-neutral-500">{tool.desc}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14">
        <div className="scroll-reveal text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center mb-5">
            <Zap className="w-7 h-7 text-[#F9954E]" />
          </div>
          <h2 className="text-[24px] font-extrabold text-neutral-950 dark:text-white mb-3 break-keep">
            지금 바로 시작해보세요
          </h2>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-6 break-keep leading-relaxed">
            도리의 AI 도구 모음에서 자동화 카테고리를 탐색하고<br />
            나에게 맞는 도구를 찾아보세요.
          </p>
          <Link
            href="/ai-tools"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-80 transition-opacity"
          >
            AI 도구 탐색하기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </main>
  );
}
