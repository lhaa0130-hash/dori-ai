"use client";

import Link from "next/link";
import {
  Sparkles,
  Users,
  ShieldCheck,
  Globe,
  ArrowRight,
  Search,
  PenLine,
  Image as ImageIcon,
  Mic,
  KeyRound,
  Workflow,
  Check,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";

// 워크일로 = 일로. 데스크톱 EXE가 아니라 웹 구독 서비스로 통일(설치 없음, BYOK).
// 손님은 웹에서 바로 사용(/illo/app). 풀버전 엔진은 운영자 검증용 프로토타입.

const FEATURES = [
  {
    icon: KeyRound,
    title: "내 키(BYOK)로, 원가에 가깝게",
    desc: "GPT·Claude·Gemini·fal.ai·ElevenLabs… 내 API 키를 한 번만 넣으면 돼요. 중간 마진 없이 쓴 만큼만, 키는 암호화돼 계정에 안전하게 동기화됩니다.",
  },
  {
    icon: Users,
    title: "AI 직원을 불러와 일 시키기",
    desc: "리서처·작가·화가·사이트관리자… 목적별 AI 직원을 채용하고, 사장님처럼 지시만 하세요. 어떤 모델을 쓸지는 직원마다 직접 고를 수 있어요.",
  },
  {
    icon: Workflow,
    title: "검색→글→이미지→발행까지 한 번에",
    desc: "여러 AI를 노드로 이어 붙이면 하나의 작업으로 굴러갑니다. 결과는 결재함에 모여, 확인하고 누르면 사이트·메일·카톡으로 자동 발행돼요.",
  },
];

// 목적별 API 카탈로그 — '뭘 구독할지' 대신 '뭘 시킬지'로 고른다.
const CATALOG = [
  { icon: Search, label: "검색·리서치", tools: "Tavily · OpenRouter", color: "#3B82F6" },
  { icon: PenLine, label: "글쓰기", tools: "GPT · Claude · Gemini", color: "#F9954E" },
  { icon: ImageIcon, label: "이미지", tools: "fal.ai (Imagen·FLUX)", color: "#A855F7" },
  { icon: Mic, label: "음성·내레이션", tools: "ElevenLabs", color: "#10B981" },
];

// 실제 동작하는 8단계 파이프라인을 손님 눈높이로 요약.
const PIPELINE = [
  "리서처가 검색해 자료를 모으고",
  "검토자가 내 사이트와 중복인지 확인",
  "작가가 글을 쓰고, 화가가 어울리는 이미지를 그려요",
  "사이트관리자가 dori-ai.com/trend에 발행",
  "SEO·SNS용 글까지 만들어 메일·카톡으로 보고",
];

const STEPS = [
  { n: "1", t: "로그인", d: "dori-ai.com 계정으로 로그인. 설치도, 다운로드도 없어요. 브라우저면 끝." },
  { n: "2", t: "무료로 체험 / 내 키 넣기", d: "로그인만 하면 하루 50회 무료. 더 쓰려면 내 API 키를 한 번만 넣으면 돼요." },
  { n: "3", t: "직원 불러와 일 시키기", d: "AI 직원을 채용하고 지시하면, 결과가 결재함에 도착. 확인하고 발행하세요." },
];

export default function IlloPageClient() {
  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-[560px] bg-gradient-to-b from-[#FEEBD0]/50 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/12 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-16 pb-12 sm:pb-24">
        {/* Hero */}
        <section className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-7">
            <Sparkles className="w-3 h-3" />
            <span>워크일로 = 일로 · AI API 활용 웹 구독</span>
          </div>

          <img src="/illo-logo.png" alt="워크일로" width={96} height={96} className="w-24 h-24 rounded-[26px] shadow-xl shadow-[#F9954E]/20 mb-6" />

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-4">
            워크일로
          </h1>
          <p className="text-lg md:text-2xl font-bold mb-3">
            <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              AI API, 구독 말고 필요한 만큼
            </span>
          </p>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed break-keep mb-9">
            ChatGPT·Claude·Gemini는 구독하면서도 API는 어려워서 못 쓰던 분들을 위한 서비스예요.
            내 키로 검색·글·이미지·음성을 조합하고, 결과를 사이트·메일·카톡으로 자동 발행합니다.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/illo/app"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-base shadow-lg shadow-[#F9954E]/25 transition-all hover:-translate-y-0.5"
            >
              <Globe className="w-5 h-5" />
              웹에서 바로 시작
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-200 font-bold text-base hover:border-[#F9954E] transition-colors"
            >
              요금 보기
            </Link>
          </div>
          <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-4">
            설치 없이 브라우저에서 바로 · 로그인하면 <b className="text-[#E8832E] dark:text-[#FBAA60]">하루 50회 무료</b> · 월 <b className="text-[#E8832E] dark:text-[#FBAA60]">₩990</b>
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

        {/* API 카탈로그 — 목적별로 고른다 */}
        <section className="mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-neutral-900 dark:text-white mb-3">
            ‘뭘 구독할지’ 말고 ‘뭘 시킬지’로
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-12 break-keep">
            목적만 고르면 어떤 API가 맞는지 워크일로가 추천하고 연결해줘요.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATALOG.map((c) => (
              <div
                key={c.label}
                className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 text-center hover:-translate-y-0.5 transition-transform"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 mx-auto"
                  style={{ backgroundColor: `${c.color}1A` }}
                >
                  <c.icon className="w-6 h-6" style={{ color: c.color }} />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">{c.label}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 break-keep">{c.tools}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 이렇게 일합니다 — 파이프라인 */}
        <section className="mt-24 rounded-[28px] bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 p-8 md:p-10">
          <div className="text-center mb-9">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-4">
              <Workflow className="w-3 h-3" /> 한 번 지시 → 발행까지 자동
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white">
              여러 AI가 이어서 일해요
            </h2>
          </div>
          <ol className="max-w-2xl mx-auto space-y-3">
            {PIPELINE.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-[#F9954E] text-white text-xs font-extrabold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed break-keep">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-neutral-400 dark:text-zinc-600">
            <Mail className="w-4 h-4" /> 이메일
            <span className="mx-1">·</span>
            <MessageCircle className="w-4 h-4" /> 카카오톡으로 보고
            <span className="mx-1">·</span>
            <Send className="w-4 h-4" /> 발행은 항상 내 확인 후
          </div>
        </section>

        {/* How to start */}
        <section className="mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-neutral-900 dark:text-white mb-3">
            3단계면 시작 준비 끝
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-12 break-keep">
            설치도 다운로드도 없어요. 로그인하면 바로 시작합니다.
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

        {/* 보안 */}
        <section className="mt-24 flex flex-col md:flex-row items-center gap-8 rounded-[28px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-8 md:p-10">
          <div className="flex-none w-16 h-16 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-[#F9954E]" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">키는 암호화하고, 잃어버리지 않게</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
              내 API 키는 암호화해 보관하고 계정에 동기화돼, 기기를 바꿔도 그대로 복원돼요.
              자가복구 백업까지 갖춰 데이터가 사라지지 않게 설계했습니다. AI는 회원님 키로만 동작합니다.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-neutral-900 dark:text-white mb-3">
            요금은 단순하게
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-12 break-keep">
            구독료는 도구값일 뿐, AI 사용료는 내 키로 원가에 가깝게.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-8">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">무료 체험</h3>
              <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-5">₩0</p>
              <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F9954E] flex-none" /> 로그인하면 하루 50회 무료</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F9954E] flex-none" /> 키 없이 바로 체험</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F9954E] flex-none" /> 핵심 기능 둘러보기</li>
              </ul>
            </div>
            {/* Pro */}
            <div className="relative bg-gradient-to-br from-[#FFF5EB] to-[#FEEBD0] dark:from-zinc-900 dark:to-zinc-900/40 border-2 border-[#F9954E] rounded-3xl p-8">
              <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-[#F9954E] text-white text-xs font-bold">추천</div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">워크일로 구독</h3>
              <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-1">₩990<span className="text-base font-bold text-neutral-500">/월</span></p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">+ AI 사용료는 내 키로 직접 결제</p>
              <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F9954E] flex-none" /> 내 키(BYOK) 무제한 연결</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F9954E] flex-none" /> AI 직원·노드 파이프라인</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F9954E] flex-none" /> 사이트·메일·카톡 자동 발행</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#F9954E] flex-none" /> 키 암호화·자가복구 동기화</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-24 rounded-[28px] bg-gradient-to-br from-[#FFF5EB] to-[#FEEBD0] dark:from-zinc-900 dark:to-zinc-900/40 border border-[#FDD5A5] dark:border-zinc-800 p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white mb-3">지금 바로 시작해보세요</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 break-keep">
            로그인만 하면 <b className="text-[#E8832E] dark:text-[#FBAA60]">하루 50회 무료</b>. 설치도 결제도 필요 없어요.
          </p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Link href="/illo/app" className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-base shadow-lg shadow-[#F9954E]/25 transition-all hover:-translate-y-0.5">
              <Globe className="w-5 h-5" /> 웹에서 바로 시작
            </Link>
          </div>
          <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E8832E] dark:text-[#FBAA60] hover:gap-3 transition-all">
            아직 계정이 없으신가요? 회원가입 <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
