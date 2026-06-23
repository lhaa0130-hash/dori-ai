"use client";

// AI 활용 유형 심리테스트 — 6문항 → 5유형. 가볍게 즐기는 테스트.
import { useState } from "react";
import Link from "next/link";
import { RotateCcw, ArrowRight } from "lucide-react";

type Type = "builder" | "creator" | "learner" | "automator" | "explorer";

const QUESTIONS: { q: string; options: { t: string; type: Type }[] }[] = [
  { q: "AI에게 가장 먼저 시키고 싶은 일은?", options: [
    { t: "내 아이디어로 앱·서비스 만들기", type: "builder" },
    { t: "그림·영상·음악 같은 작품 만들기", type: "creator" },
    { t: "어려운 주제를 쉽게 설명받기", type: "learner" },
    { t: "매일 반복하는 귀찮은 일 자동화", type: "automator" },
  ]},
  { q: "주말에 AI로 논다면?", options: [
    { t: "작은 프로그램 하나 뚝딱 만들기", type: "builder" },
    { t: "AI로 웹툰·노래 만들어보기", type: "creator" },
    { t: "관심 분야 깊게 파보기", type: "learner" },
    { t: "최신 AI 뉴스 정주행", type: "explorer" },
  ]},
  { q: "새로운 AI 도구가 나왔다. 당신은?", options: [
    { t: "일단 만들어보며 익힌다", type: "builder" },
    { t: "예쁜 결과물부터 뽑아본다", type: "creator" },
    { t: "문서·원리부터 읽어본다", type: "learner" },
    { t: "남들보다 먼저 써보고 공유한다", type: "explorer" },
  ]},
  { q: "AI가 가장 고마운 순간은?", options: [
    { t: "막막한 작업을 대신 해줄 때", type: "automator" },
    { t: "불가능할 것 같던 걸 만들어낼 때", type: "builder" },
    { t: "복잡한 걸 한 번에 이해시켜줄 때", type: "learner" },
    { t: "내 창작에 날개를 달아줄 때", type: "creator" },
  ]},
  { q: "친구에게 AI를 추천한다면?", options: [
    { t: "“이걸로 이런 것도 만들 수 있어!”", type: "builder" },
    { t: "“이 그림/영상, AI가 만든 거야!”", type: "creator" },
    { t: "“이거 배우면 진짜 똑똑해져”", type: "learner" },
    { t: "“이 뉴스 봤어? AI 미쳤다”", type: "explorer" },
  ]},
  { q: "이상적인 AI 라이프는?", options: [
    { t: "반복은 AI, 나는 중요한 것만", type: "automator" },
    { t: "내 손으로 뭐든 만드는 삶", type: "builder" },
    { t: "매일 새로 배우는 삶", type: "learner" },
    { t: "트렌드 최전선에 있는 삶", type: "explorer" },
  ]},
];

const RESULTS: Record<Type, { emoji: string; title: string; desc: string; rec: { label: string; href: string } }> = {
  builder:   { emoji: "🛠️", title: "실전 빌더", desc: "아이디어를 곧장 결과물로 만드는 행동파! AI는 당신의 가장 강력한 작업 도구예요.", rec: { label: "워크일로로 만들기", href: "/illo/app" } },
  creator:   { emoji: "🎨", title: "AI 크리에이터", desc: "상상을 현실로 꺼내는 창작가! 이미지·영상·음악, 무엇이든 만들어내요.", rec: { label: "AI 도구 둘러보기", href: "/ai-tools" } },
  learner:   { emoji: "📚", title: "탐구 학습러", desc: "원리부터 파고드는 지식 탐험가! AI로 세상을 더 깊이 이해해요.", rec: { label: "인사이트 읽으러 가기", href: "/insight" } },
  automator: { emoji: "🤖", title: "자동화 마니아", desc: "반복은 기계에게 맡기는 효율의 화신! 시간을 버는 사람이에요.", rec: { label: "워크일로로 자동화", href: "/illo/app" } },
  explorer:  { emoji: "🧭", title: "트렌드 헌터", desc: "가장 빠르게 새 흐름을 캐치하는 얼리어답터! AI 소식이라면 1등이에요.", rec: { label: "트렌드 보러 가기", href: "/insight" } },
};

export default function PsychTestClient() {
  const [step, setStep] = useState(0);
  const [tally, setTally] = useState<Record<Type, number>>({ builder: 0, creator: 0, learner: 0, automator: 0, explorer: 0 });
  const [done, setDone] = useState<Type | null>(null);

  const pick = (type: Type) => {
    const next = { ...tally, [type]: tally[type] + 1 };
    setTally(next);
    if (step + 1 >= QUESTIONS.length) {
      const winner = (Object.keys(next) as Type[]).reduce((a, b) => (next[b] > next[a] ? b : a), "builder");
      setDone(winner);
    } else {
      setStep(step + 1);
    }
  };

  const restart = () => { setStep(0); setTally({ builder: 0, creator: 0, learner: 0, automator: 0, explorer: 0 }); setDone(null); };

  if (done) {
    const r = RESULTS[done];
    return (
      <main className="w-full min-h-screen py-10">
        <p className="text-center text-[12px] font-bold text-[#F9954E] mb-4">나의 AI 활용 유형은…</p>
        <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm">
          <div className="text-[64px] leading-none mb-3">{r.emoji}</div>
          <h1 className="text-[26px] font-extrabold text-neutral-950 dark:text-white mb-3">{r.title}</h1>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep mb-7">{r.desc}</p>
          <Link href={r.rec.href} className="flex items-center justify-center gap-1.5 w-full py-3.5 rounded-2xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85 transition-opacity mb-2.5">
            {r.rec.label} <ArrowRight className="w-4 h-4" />
          </Link>
          <button onClick={restart} className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 text-[13px] font-bold active:opacity-70 transition-opacity">
            <RotateCcw className="w-3.5 h-3.5" /> 다시 하기
          </button>
        </div>
      </main>
    );
  }

  const cur = QUESTIONS[step];
  const progress = Math.round((step / QUESTIONS.length) * 100);

  return (
    <main className="w-full min-h-screen py-10">
      {/* 헤더 */}
      <div className="mb-7">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-2">🧠 AI 활용 유형 테스트</p>
        <h1 className="text-[22px] font-extrabold text-neutral-950 dark:text-white break-keep">나는 어떤 AI 사용자일까?</h1>
      </div>

      {/* 진행바 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-[#F9954E] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[12px] font-bold text-neutral-400 tabular-nums">{step + 1}/{QUESTIONS.length}</span>
      </div>

      {/* 질문 */}
      <h2 className="text-[19px] font-extrabold text-neutral-900 dark:text-white leading-snug break-keep mb-5">{cur.q}</h2>

      {/* 선택지 */}
      <div className="flex flex-col gap-2.5">
        {cur.options.map((o, i) => (
          <button
            key={i}
            onClick={() => pick(o.type)}
            className="text-left px-4 py-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[14px] font-semibold text-neutral-800 dark:text-neutral-100 hover:border-[#F9954E] hover:bg-[#FFF8F1] dark:hover:bg-[#F9954E]/10 active:scale-[0.99] transition-all break-keep"
          >
            {o.t}
          </button>
        ))}
      </div>
    </main>
  );
}
