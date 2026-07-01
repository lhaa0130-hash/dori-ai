"use client";

import Link from "next/link";
import {
  ArrowRight,
  Search,
  PenLine,
  Image as ImageIcon,
  Mic,
  KeyRound,
  Users,
  Workflow,
  Check,
} from "lucide-react";

// 워크일로 = 일로. 웹 구독 서비스(설치 없음, BYOK). 손님은 /illo/app 에서 바로 사용.
// 디자인: 미니멀 — 좌측 정렬, 얇은 구분선, 절제된 주황 강조 하나.

const FEATURES = [
  {
    icon: KeyRound,
    title: "내 키(BYOK)로, 원가에 가깝게",
    desc: "GPT·Claude·Gemini·fal.ai·ElevenLabs… 내 API 키를 한 번만 넣으면 돼요. 중간 마진 없이 쓴 만큼만, 키는 암호화돼 안전하게 동기화됩니다.",
  },
  {
    icon: Users,
    title: "AI 직원을 불러와 일 시키기",
    desc: "리서처·작가·화가처럼 목적별 AI 직원을 채용하고 지시만 하세요. 어떤 모델을 쓸지는 직원마다 직접 고를 수 있어요.",
  },
  {
    icon: Workflow,
    title: "검색→글→이미지→발행까지 한 번에",
    desc: "여러 AI를 노드로 이어 붙이면 하나의 작업으로 굴러갑니다. 결과는 결재함에 모여, 확인하고 누르면 자동 발행돼요.",
  },
];

const CATALOG = [
  { icon: Search, label: "검색·리서치", tools: "Tavily · Perplexity" },
  { icon: PenLine, label: "글쓰기", tools: "GPT · Claude · Gemini" },
  { icon: ImageIcon, label: "이미지", tools: "fal.ai · DALL·E" },
  { icon: Mic, label: "음성·음악", tools: "ElevenLabs · Suno" },
];

const PIPELINE = [
  "리서처가 검색해 자료를 모으고",
  "검토자가 내 사이트와 중복인지 확인",
  "작가가 글을 쓰고, 화가가 어울리는 이미지를 그려요",
  "사이트관리자가 dori-ai.com/trend에 발행",
  "SEO·SNS용 글까지 만들어 메일·카톡으로 보고",
];

const GUIDE = [
  { t: "로그인 — 30초면 끝", d: "dori-ai.com 계정으로 로그인. 처음이면 앱에서 바로 가입할 수 있어요. 설치·다운로드 없이 브라우저면 충분합니다." },
  { t: "먼저 무료로 둘러보기", d: "로그인만 하면 하루 50회 무료. 키를 넣기 전에 글쓰기·요약 같은 기본 기능부터 가볍게 써보세요." },
  { t: "내 API 키 연결하기", d: "설정에서 내 키를 한 번만 입력해요. OpenAI·Claude·Gemini·fal.ai·ElevenLabs·Tavily 중 쓰고 싶은 것만." },
  { t: "AI 직원 불러오기", d: "목적별 직원을 채용하고, 직원마다 어떤 모델로 일할지 직접 고를 수 있어요." },
  { t: "지시 → 결재 → 발행", d: "한 줄 지시하면 결과가 결재함에 도착. 확인하고 누르면 발행. 여러 직원을 노드로 이어 자동 흐름도 만들 수 있어요." },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">{children}</p>;
}
function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[20px] sm:text-[22px] font-extrabold text-neutral-950 dark:text-white tracking-tight break-keep leading-snug">{children}</h2>;
}

export default function IlloPageClient() {
  return (
    <main className="w-full min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-8 pb-16 sm:pb-24">
        {/* ── 히어로 ── */}
        <section className="pb-8 border-b border-neutral-100 dark:border-zinc-900">
          <Eyebrow>AI 업무비서</Eyebrow>
          <div className="flex items-center gap-3 mb-3">
            <img src="/illo-logo.png" alt="워크일로" width={44} height={44} className="w-11 h-11 rounded-2xl shrink-0" />
            <h1 className="text-[30px] sm:text-[38px] font-extrabold text-neutral-950 dark:text-white leading-[1.1] tracking-tight break-keep">
              워크일로
            </h1>
          </div>
          <p className="text-[14px] text-neutral-400 dark:text-neutral-500 leading-relaxed break-keep mb-5 max-w-xl">
            ChatGPT·Claude·Gemini를 내 API 키로, 구독 없이 원하는 만큼 써요.<br />
            글·이미지·음성을 조합하고 사이트·메일·카톡으로 자동 발행합니다.
          </p>
          <Link
            href="/illo/app"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F9954E]/10 text-[#F9954E] text-[13px] font-extrabold transition-colors hover:bg-[#F9954E]/20"
          >
            테스트 참여하기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* 기능 */}
        <section className="mt-16">
          <Eyebrow>무엇을 하나</Eyebrow>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-7 mt-1">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <f.icon className="w-5 h-5 text-[#F9954E] mb-3" />
                <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white mb-1.5 break-keep">{f.title}</h3>
                <p className="text-[13px] text-neutral-400 dark:text-neutral-500 leading-relaxed break-keep">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 왜 만들었나 */}
        <section className="mt-16 pt-14 border-t border-neutral-100 dark:border-zinc-900">
          <Eyebrow>왜 만들었나</Eyebrow>
          <Title>“구독은 하는데, 정작 제일 좋은 건 못 쓰고 있더라고요.”</Title>
          <div className="space-y-3.5 text-[13.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep max-w-2xl mt-5">
            <p>
              ChatGPT·Claude·Gemini, 다들 매달 구독합니다. 그런데 이 회사들이 진짜 힘을 쏟는 곳은{" "}
              <b className="text-neutral-800 dark:text-neutral-200">API</b>예요. 가장 빠르고 강한 모델, 검색·이미지·음성까지 전부 API로 열려 있죠.
              문제는 그게 개발자 전용이라는 것 — 키 발급받고, 코드 짜고, 도구마다 따로 가입하고. 일반 사용자에겐 너무 멀었어요.
            </p>
            <p>
              그래서 생각했어요.{" "}
              <b className="text-neutral-800 dark:text-neutral-200">“개발 몰라도, 내 키로, 직원에게 일 시키듯 여러 AI를 조합해 쓰게 하면 안 될까?”</b>{" "}
              그게 워크일로의 출발점입니다.
            </p>
            <p>
              검색은 Tavily, 글은 GPT·Claude, 이미지는 fal.ai, 음성은 ElevenLabs — ‘뭘 시킬지’만 고르면 알맞은 AI가 이미 연결돼 있어요.
              결과는 결재함에 모이고, 확인 후 누르면 사이트·메일·카톡으로 발행됩니다.
            </p>
            <p>
              저희는 실제로 <b className="text-[#E8832E] dark:text-[#FBAA60]">1인 + AI</b>로 dori-ai.com을 직접 만들고 굴립니다.
              그 방식을 누구나 쓸 수 있게 옮긴 게 워크일로예요. 완벽하진 않지만, 매일 한 걸음씩 더 낫게 다듬고 있습니다.
            </p>
          </div>
        </section>

        {/* 목적별 API */}
        <section className="mt-16 pt-14 border-t border-neutral-100 dark:border-zinc-900">
          <Eyebrow>목적별 API</Eyebrow>
          <Title>‘뭘 구독할지’ 말고 ‘뭘 시킬지’로</Title>
          <p className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-2 mb-6 break-keep">목적만 고르면 어떤 API가 맞는지 워크일로가 추천하고 연결해줘요.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATALOG.map((c) => (
              <div key={c.label} className="border border-neutral-200 dark:border-zinc-800 rounded-xl p-4">
                <c.icon className="w-5 h-5 text-neutral-400 dark:text-neutral-500 mb-2.5" />
                <h3 className="text-[13px] font-bold text-neutral-900 dark:text-white mb-0.5">{c.label}</h3>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 break-keep">{c.tools}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 파이프라인 */}
        <section className="mt-16 pt-14 border-t border-neutral-100 dark:border-zinc-900">
          <Eyebrow>한 번 지시 → 발행까지 자동</Eyebrow>
          <Title>여러 AI가 이어서 일해요</Title>
          <ol className="space-y-2.5 mt-5 max-w-2xl">
            {PIPELINE.map((step, i) => (
              <li key={i} className="flex gap-3 text-[13.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
                <span className="text-[#F9954E] font-bold tabular-nums shrink-0">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-[12px] text-neutral-400 dark:text-neutral-600 mt-5">이메일·카카오톡으로 보고 · 발행은 항상 내 확인 후</p>
        </section>

        {/* 처음 사용 가이드 */}
        <section className="mt-16 pt-14 border-t border-neutral-100 dark:border-zinc-900">
          <Eyebrow>처음이세요?</Eyebrow>
          <Title>5분이면 첫 결과물까지</Title>
          <ol className="space-y-4 mt-5 max-w-2xl">
            {GUIDE.map((g, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="text-[#F9954E] font-bold tabular-nums text-[13px] pt-0.5 shrink-0">{i + 1}</span>
                <div>
                  <h3 className="text-[14px] font-bold text-neutral-900 dark:text-white mb-0.5 break-keep">{g.t}</h3>
                  <p className="text-[13px] text-neutral-400 dark:text-neutral-500 leading-relaxed break-keep">{g.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/illo/app" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[#F9954E]/10 text-[#F9954E] text-[13px] font-extrabold transition-colors hover:bg-[#F9954E]/20">
            지금 따라 해보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* 보안 */}
        <section className="mt-16 pt-14 border-t border-neutral-100 dark:border-zinc-900">
          <Eyebrow>보안</Eyebrow>
          <Title>키는 암호화하고, 잃어버리지 않게</Title>
          <p className="text-[13.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep max-w-2xl mt-4">
            내 API 키는 암호화해 보관하고 계정에 동기화돼, 기기를 바꿔도 그대로 복원돼요.
            자가복구 백업까지 갖춰 데이터가 사라지지 않게 설계했습니다. AI는 회원님 키로만 동작합니다.
          </p>
        </section>

        {/* 요금 */}
        <section id="pricing" className="mt-16 pt-14 border-t border-neutral-100 dark:border-zinc-900">
          <Eyebrow>요금</Eyebrow>
          <Title>요금은 단순하게</Title>
          <p className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-2 mb-6 break-keep">구독료는 도구값일 뿐, AI 사용료는 내 키로 원가에 가깝게.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            <div className="border border-neutral-200 dark:border-zinc-800 rounded-xl p-5">
              <h3 className="text-[14px] font-bold text-neutral-900 dark:text-white mb-1">무료 체험</h3>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-4">₩0</p>
              <ul className="space-y-2 text-[13px] text-neutral-500 dark:text-neutral-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#F9954E] shrink-0" /> 로그인하면 하루 50회 무료</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#F9954E] shrink-0" /> 키 없이 바로 체험</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#F9954E] shrink-0" /> 핵심 기능 둘러보기</li>
              </ul>
            </div>
            <div className="border border-[#F9954E]/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[14px] font-bold text-neutral-900 dark:text-white">워크일로 구독</h3>
                <span className="text-[10px] font-bold text-[#F9954E]">추천</span>
              </div>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-0.5">₩990<span className="text-sm font-bold text-neutral-400">/월</span></p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-4">+ AI 사용료는 내 키로 직접 결제</p>
              <ul className="space-y-2 text-[13px] text-neutral-500 dark:text-neutral-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#F9954E] shrink-0" /> 내 키(BYOK) 무제한 연결</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#F9954E] shrink-0" /> AI 직원·노드 파이프라인</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#F9954E] shrink-0" /> 사이트·메일·카톡 자동 발행</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#F9954E] shrink-0" /> 키 암호화·자가복구 동기화</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 pt-14 border-t border-neutral-100 dark:border-zinc-900">
          <Title>지금 바로 시작해보세요</Title>
          <p className="text-[13.5px] text-neutral-400 dark:text-neutral-500 mt-2 mb-5 break-keep">로그인만 하면 하루 50회 무료. 설치도 결제도 필요 없어요.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/illo/app" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white text-[13px] font-extrabold transition-colors">
              웹에서 바로 시작 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/signup" className="text-[13px] font-bold text-neutral-400 dark:text-neutral-500 hover:text-[#E8832E] transition-colors">
              아직 계정이 없으신가요? 회원가입
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
