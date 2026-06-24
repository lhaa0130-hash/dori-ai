"use client";

// 심리테스트 허브 — 검증된 임상/연구 척도 기반 점수형 테스트 + 가벼운 유형 테스트.
// 단일 라우트에서 허브 → 인트로 → 문항 → 결과를 상태로 전환(정적 export 호환).
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { RotateCcw, ArrowRight, ArrowLeft, ChevronRight, Info, ShieldAlert, Lock, Share2, BookmarkPlus, Check } from "lucide-react";
import {
  TESTS, CATEGORIES, getTest, computeScored, computeMulti, getAbout,
  type PsychTest, type ScoredTest, type TypedTest, type MultiTest, type Tone,
} from "@/lib/psychTests";
import { shareResultCard, type CardData } from "@/lib/shareCard";
import { savePsychResult, type PsychResult } from "@/lib/social";
import { getFirebaseAuth } from "@/lib/firebase";

const TONE: Record<Tone, { ring: string; text: string; bar: string; soft: string }> = {
  good: { ring: "border-emerald-200 dark:border-emerald-900/50", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", soft: "bg-emerald-50 dark:bg-emerald-950/30" },
  mild: { ring: "border-amber-200 dark:border-amber-900/50",     text: "text-amber-600 dark:text-amber-400",     bar: "bg-amber-500",   soft: "bg-amber-50 dark:bg-amber-950/30" },
  warn: { ring: "border-orange-200 dark:border-orange-900/50",   text: "text-orange-600 dark:text-orange-400",   bar: "bg-orange-500",  soft: "bg-orange-50 dark:bg-orange-950/30" },
  high: { ring: "border-rose-200 dark:border-rose-900/50",       text: "text-rose-600 dark:text-rose-400",       bar: "bg-rose-500",    soft: "bg-rose-50 dark:bg-rose-950/30" },
};

export default function PsychTestClient() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const test = activeId ? getTest(activeId) : null;

  if (!test) return <Hub onPick={setActiveId} />;
  return <Runner key={test.id} test={test} onExit={() => setActiveId(null)} />;
}

/* ───────────────────────── 허브 ───────────────────────── */
function Hub({ onPick }: { onPick: (id: string) => void }) {
  return (
    <main className="w-full min-h-screen py-9">
      <div className="mb-7">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-2">🧩 심리테스트</p>
        <h1 className="text-[24px] font-extrabold text-neutral-950 dark:text-white break-keep leading-tight">
          제대로 만든 심리테스트
        </h1>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-2 break-keep leading-relaxed">
          실제 심리학·정신건강 분야에서 검증된 척도를 바탕으로 만들었어요. 결과는 <b>진단이 아닌 자기점검</b>이에요.
        </p>
      </div>

      {/* 개인정보 안내 */}
      <div className="flex items-start gap-2 rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 px-4 py-3 mb-7">
        <Lock className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          응답은 <b>내 기기에서만</b> 계산되고 어디에도 저장·전송되지 않아요.
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const tests = TESTS.filter((t) => t.category === cat.id);
        if (tests.length === 0) return null;
        return (
          <section key={cat.id} className="mb-8">
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="text-[16px] font-extrabold text-neutral-900 dark:text-white">
                {cat.emoji} {cat.name}
              </h2>
              <span className="text-[11px] text-neutral-400">{cat.desc}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tests.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onPick(t.id)}
                  className="group flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-[#F9954E] hover:bg-[#FFF8F1] dark:hover:bg-[#F9954E]/10 active:scale-[0.99] transition-all"
                >
                  <span className="text-[26px] leading-none shrink-0">{t.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-bold text-neutral-900 dark:text-white break-keep">{t.title}</span>
                    <span className="block text-[11.5px] text-neutral-400 mt-0.5 truncate">{t.subtitle} · {t.time}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#F9954E] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

/* ───────────────────────── 러너(분기) ───────────────────────── */
function Runner({ test, onExit }: { test: PsychTest; onExit: () => void }) {
  if (test.kind === "typed") return <TypedRunner test={test} onExit={onExit} />;
  if (test.kind === "multi") return <MultiRunner test={test} onExit={onExit} />;
  return <ScoredRunner test={test} onExit={onExit} />;
}

/* ───────────────────────── 점수형 테스트 ───────────────────────── */
function ScoredRunner({ test, onExit }: { test: ScoredTest; onExit: () => void }) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => test.items.map(() => null));

  // 인트로 화면
  if (!started) {
    return (
      <Intro test={test} onBack={onExit} onStart={() => setStarted(true)} />
    );
  }

  const done = answers.every((a) => a !== null);
  if (done) {
    return <ScoredResult test={test} answers={answers as number[]} onBack={onExit} onRetry={() => { setAnswers(test.items.map(() => null)); setStep(0); setStarted(false); }} />;
  }

  const item = test.items[step];
  const opts = item.choices ?? test.scale;
  const progress = Math.round((step / test.items.length) * 100);

  const choose = (value: number) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    // 다음 미응답 문항으로
    if (step + 1 < test.items.length) setStep(step + 1);
    else {
      const firstUnanswered = next.findIndex((a) => a === null);
      if (firstUnanswered !== -1) setStep(firstUnanswered);
    }
  };

  return (
    <main className="w-full min-h-screen py-9">
      <TopBar
        label={test.title}
        step={step}
        total={test.items.length}
        progress={progress}
        onBack={() => (step === 0 ? setStarted(false) : setStep(step - 1))}
      />

      {test.question ? (
        <p className="text-[12.5px] font-semibold text-neutral-400 mb-2 break-keep">{test.question}</p>
      ) : (
        <p className="text-[12.5px] text-neutral-400 mb-2 break-keep">{test.subtitle}</p>
      )}
      <h2 className="text-[18.5px] font-extrabold text-neutral-900 dark:text-white leading-snug break-keep mb-6 min-h-[2.4em]">
        {item.text}
      </h2>

      <div className="flex flex-col gap-2.5">
        {opts.map((o, i) => {
          const selected = answers[step] === o.value;
          return (
            <button
              key={i}
              onClick={() => choose(o.value)}
              className={`text-left px-4 py-3.5 rounded-2xl border text-[14px] font-semibold transition-all active:scale-[0.99] break-keep ${
                selected
                  ? "border-[#F9954E] bg-[#FFF8F1] dark:bg-[#F9954E]/15 text-[#d97a2e] dark:text-[#F9954E]"
                  : "border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-neutral-800 dark:text-neutral-100 hover:border-[#F9954E]/60"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </main>
  );
}

function ScoredResult({ test, answers, onBack, onRetry }: { test: ScoredTest; answers: number[]; onBack: () => void; onRetry: () => void }) {
  const { band, displayScore, unitLabel, pct } = computeScored(test, answers);
  const tone = TONE[band.tone];
  const higherWorse = test.higherWorse !== false;

  return (
    <main className="w-full min-h-screen py-9">
      <button onClick={onBack} className="flex items-center gap-1 text-[12.5px] font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-5">
        <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
      </button>

      <p className="text-center text-[12px] font-bold text-[#F9954E] mb-3">{test.title} 결과</p>

      <div className={`rounded-3xl border ${tone.ring} bg-white dark:bg-zinc-950 p-7 shadow-sm`}>
        <div className="text-center">
          <div className="text-[56px] leading-none mb-2">{band.emoji}</div>
          <h1 className={`text-[24px] font-extrabold mb-1 ${tone.text}`}>{band.label}</h1>
          <p className="text-[13px] text-neutral-400 tabular-nums">
            점수 <b className="text-neutral-700 dark:text-neutral-200">{displayScore}</b> / {unitLabel}
          </p>
        </div>

        {/* 게이지 */}
        <div className="mt-5 mb-6">
          <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full ${tone.bar} transition-all duration-500`} style={{ width: `${Math.max(4, pct)}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-neutral-400 mt-1.5">
            <span>{higherWorse ? "양호" : "낮음"}</span><span>{higherWorse ? "심함" : "높음"}</span>
          </div>
        </div>

        <div className={`rounded-2xl ${tone.soft} px-4 py-4 mb-4`}>
          <p className="text-[13.5px] text-neutral-700 dark:text-neutral-200 leading-relaxed break-keep">{band.desc}</p>
        </div>

        <div className="px-1">
          <p className="text-[11.5px] font-bold text-neutral-400 mb-1.5">이렇게 해보세요</p>
          <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep">{band.advice}</p>
        </div>
      </div>

      {/* 위기 자원 */}
      {test.crisis && (
        <div className="flex items-start gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 px-4 py-3.5 mt-3">
          <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-rose-700 dark:text-rose-300 leading-relaxed break-keep">
            힘든 마음이 든다면 혼자 견디지 마세요. <b>자살예방상담전화 109</b>, <b>정신건강상담전화 1577-0199</b>에서 24시간 무료로 이야기할 수 있어요.
          </p>
        </div>
      )}

      {/* 출처 + 고지 */}
      <div className="mt-3 space-y-2">
        {test.note && (
          <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep px-1">{test.note}</p>
        )}
        <div className="flex items-start gap-2 rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 px-4 py-3">
          <Info className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
          <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
            근거: {test.source}. 이 결과는 <b>선별 목적의 자기점검</b>이며 의학적 진단이 아니에요. 걱정되는 점이 있다면 전문가 상담을 권해요.
          </p>
        </div>
      </div>

      <ResultActions
        card={{ kicker: test.title, emoji: band.emoji, headline: band.label, sub: `${displayScore} / ${unitLabel}`, lines: [band.desc, "💡 " + band.advice] }}
        badge={{ testId: test.id, title: test.title, label: band.label, sub: `${displayScore}/${unitLabel}`, emoji: band.emoji }}
        allowBadge={test.category === "self"}
      />

      <button onClick={onRetry} className="flex items-center justify-center gap-1.5 w-full py-3 mt-3 rounded-2xl bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 text-[13px] font-bold active:opacity-70 transition-opacity">
        <RotateCcw className="w-3.5 h-3.5" /> 다시 하기
      </button>
    </main>
  );
}

/* ───────────────────────── 유형형 테스트(가벼움) ───────────────────────── */
function TypedRunner({ test, onExit }: { test: TypedTest; onExit: () => void }) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [done, setDone] = useState<string | null>(null);

  if (!started) return <Intro test={test} onBack={onExit} onStart={() => setStarted(true)} />;

  if (done) {
    const r = test.results[done];
    return (
      <main className="w-full min-h-screen py-9">
        <button onClick={onExit} className="flex items-center gap-1 text-[12.5px] font-semibold text-neutral-400 hover:text-neutral-600 mb-5">
          <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
        </button>
        <p className="text-center text-[12px] font-bold text-[#F9954E] mb-4">{test.title}</p>
        <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm">
          <div className="text-[64px] leading-none mb-3">{r.emoji}</div>
          <h1 className="text-[26px] font-extrabold text-neutral-950 dark:text-white mb-3">{r.title}</h1>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep mb-7">{r.desc}</p>
          {r.rec && (
            <Link href={r.rec.href} className="flex items-center justify-center gap-1.5 w-full py-3.5 rounded-2xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85 transition-opacity mb-2.5">
              {r.rec.label} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button onClick={() => { setStep(0); setTally({}); setDone(null); setStarted(false); }} className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 text-[13px] font-bold active:opacity-70 transition-opacity">
            <RotateCcw className="w-3.5 h-3.5" /> 다시 하기
          </button>
        </div>
        <ResultActions
          card={{ kicker: test.title, emoji: r.emoji, headline: r.title, lines: [r.desc] }}
          badge={{ testId: test.id, title: test.title, label: r.title, sub: "", emoji: r.emoji }}
          allowBadge={test.category === "fun"}
        />
      </main>
    );
  }

  const cur = test.questions[step];
  const progress = Math.round((step / test.questions.length) * 100);
  const pick = (type: string) => {
    const next = { ...tally, [type]: (tally[type] || 0) + 1 };
    setTally(next);
    if (step + 1 >= test.questions.length) {
      const winner = Object.keys(next).reduce((a, b) => (next[b] > next[a] ? b : a), Object.keys(next)[0]);
      setDone(winner);
    } else setStep(step + 1);
  };

  return (
    <main className="w-full min-h-screen py-9">
      <TopBar label={test.title} step={step} total={test.questions.length} progress={progress} onBack={() => (step === 0 ? setStarted(false) : setStep(step - 1))} />
      <h2 className="text-[19px] font-extrabold text-neutral-900 dark:text-white leading-snug break-keep mb-5 min-h-[2.4em]">{cur.q}</h2>
      <div className="flex flex-col gap-2.5">
        {cur.options.map((o, i) => (
          <button key={i} onClick={() => pick(o.type)} className="text-left px-4 py-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[14px] font-semibold text-neutral-800 dark:text-neutral-100 hover:border-[#F9954E] hover:bg-[#FFF8F1] dark:hover:bg-[#F9954E]/10 active:scale-[0.99] transition-all break-keep">
            {o.t}
          </button>
        ))}
      </div>
    </main>
  );
}

/* ───────────────────────── 다차원(Big Five) 테스트 ───────────────────────── */
// 차원별 문항을 라운드로빈으로 섞어 같은 축이 연달아 나오지 않게 함
function buildFlow(test: MultiTest): { d: number; i: number }[] {
  const flow: { d: number; i: number }[] = [];
  const maxLen = Math.max(...test.dimensions.map((d) => d.items.length));
  for (let r = 0; r < maxLen; r++) {
    test.dimensions.forEach((dim, d) => {
      if (r < dim.items.length) flow.push({ d, i: r });
    });
  }
  return flow;
}

function MultiRunner({ test, onExit }: { test: MultiTest; onExit: () => void }) {
  const [started, setStarted] = useState(false);
  const flow = buildFlow(test);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[][]>(() => test.dimensions.map((d) => d.items.map(() => -1)));

  if (!started) return <Intro test={test} onBack={onExit} onStart={() => setStarted(true)} />;

  const filled = answers.every((dim) => dim.every((v) => v >= 0));
  if (filled) {
    const flat = answers.flat();
    return <MultiResult test={test} answers={flat} onBack={onExit} onRetry={() => { setAnswers(test.dimensions.map((d) => d.items.map(() => -1))); setStep(0); setStarted(false); }} />;
  }

  const cur = flow[step];
  const item = test.dimensions[cur.d].items[cur.i];
  const progress = Math.round((step / flow.length) * 100);

  const choose = (value: number) => {
    const next = answers.map((a) => [...a]);
    next[cur.d][cur.i] = value;
    setAnswers(next);
    if (step + 1 < flow.length) setStep(step + 1);
    else {
      // 마지막: 혹시 빈 문항이 있으면 그쪽으로
      let s = 0;
      for (const f of flow) { if (next[f.d][f.i] < 0) break; s++; }
      if (s < flow.length) setStep(s);
    }
  };

  return (
    <main className="w-full min-h-screen py-9">
      <TopBar label={test.title} step={step} total={flow.length} progress={progress} onBack={() => (step === 0 ? setStarted(false) : setStep(step - 1))} />
      <p className="text-[12.5px] font-semibold text-neutral-400 mb-2 break-keep">{test.question}</p>
      <h2 className="text-[18.5px] font-extrabold text-neutral-900 dark:text-white leading-snug break-keep mb-6 min-h-[2.4em]">{item.text}</h2>
      <div className="flex flex-col gap-2.5">
        {test.scale.map((o, i) => {
          const selected = answers[cur.d][cur.i] === o.value;
          return (
            <button
              key={i}
              onClick={() => choose(o.value)}
              className={`text-left px-4 py-3.5 rounded-2xl border text-[14px] font-semibold transition-all active:scale-[0.99] break-keep ${
                selected
                  ? "border-[#F9954E] bg-[#FFF8F1] dark:bg-[#F9954E]/15 text-[#d97a2e] dark:text-[#F9954E]"
                  : "border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-neutral-800 dark:text-neutral-100 hover:border-[#F9954E]/60"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </main>
  );
}

function MultiResult({ test, answers, onBack, onRetry }: { test: MultiTest; answers: number[]; onBack: () => void; onRetry: () => void }) {
  const results = computeMulti(test, answers);
  // 가장 두드러진 축(높음/낮음 중 50%에서 가장 먼 것)으로 한 줄 요약
  const standout = [...results].sort((a, b) => Math.abs(b.pct - 50) - Math.abs(a.pct - 50))[0];
  const summary = standout.level === "mid"
    ? "전반적으로 균형 잡힌 성향을 가지고 있어요."
    : `가장 두드러지는 특성은 '${standout.dim.name}'(${standout.levelLabel})이에요.`;

  return (
    <main className="w-full min-h-screen py-9">
      <button onClick={onBack} className="flex items-center gap-1 text-[12.5px] font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-5">
        <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
      </button>

      <div className="text-center mb-6">
        <div className="text-[52px] leading-none mb-2">{test.emoji}</div>
        <h1 className="text-[22px] font-extrabold text-neutral-950 dark:text-white">나의 성격 5요인</h1>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-2 break-keep">{summary}</p>
      </div>

      <div className="flex flex-col gap-3">
        {results.map((r) => {
          const lv = r.level === "high" ? r.dim.high : r.level === "low" ? r.dim.low : null;
          const text = lv ? lv.text : r.dim.mid;
          const tone: Tone = r.level === "mid" ? "mild" : "good";
          return (
            <div key={r.dim.key} className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[20px]">{r.dim.emoji}</span>
                <h3 className="text-[15px] font-extrabold text-neutral-900 dark:text-white">{r.dim.name}</h3>
                <span className={`ml-auto text-[12px] font-bold tabular-nums ${TONE[tone].text}`}>{r.levelLabel} · {r.pct}%</span>
              </div>
              <p className="text-[11.5px] text-neutral-400 mb-3 break-keep">{r.dim.desc}</p>
              <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden mb-3">
                <div className={`h-full rounded-full ${TONE[tone].bar} transition-all duration-500`} style={{ width: `${Math.max(4, r.pct)}%` }} />
              </div>
              <p className="text-[13px] text-neutral-700 dark:text-neutral-200 leading-relaxed break-keep mb-3">{text}</p>
              {lv && (
                <div className="grid grid-cols-1 gap-1.5">
                  <p className="text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep"><b className="text-emerald-600 dark:text-emerald-400">강점</b> {lv.strengths}</p>
                  <p className="text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep"><b className="text-amber-600 dark:text-amber-400">살필 점</b> {lv.watch}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 px-4 py-3 mt-3">
        <Info className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
        <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          근거: {test.source}. 성격에 좋고 나쁨은 없어요. 각 특성은 상황에 따라 강점도, 약점도 될 수 있어요.
        </p>
      </div>

      <ResultActions
        card={{
          kicker: "성격 5요인 검사",
          emoji: test.emoji,
          headline: "나의 성격 5요인",
          sub: standout.level === "mid" ? "균형형" : `${standout.dim.name} ${standout.levelLabel}`,
          lines: results.map((r) => `${r.dim.emoji} ${r.dim.name} — ${r.levelLabel} ${r.pct}%`),
        }}
        badge={{
          testId: test.id,
          title: "성격 5요인",
          label: standout.level === "mid" ? "균형형" : `${standout.dim.name} ${standout.levelLabel}`,
          sub: results.map((r) => `${r.dim.name[0]}${r.pct}`).join("·"),
          emoji: test.emoji,
        }}
        allowBadge={true}
      />

      <button onClick={onRetry} className="flex items-center justify-center gap-1.5 w-full py-3 mt-3 rounded-2xl bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 text-[13px] font-bold active:opacity-70 transition-opacity">
        <RotateCcw className="w-3.5 h-3.5" /> 다시 하기
      </button>
    </main>
  );
}

/* ───────────────────────── 결과 액션(공유 카드 + 코지홈 저장) ───────────────────────── */
function ResultActions({ card, badge, allowBadge }: { card: CardData; badge: Omit<PsychResult, "at">; allowBadge: boolean }) {
  const [shareMsg, setShareMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "login" | "fail">("idle");

  const onShare = async () => {
    setBusy(true); setShareMsg("");
    try {
      const r = await shareResultCard(card, `dori-${badge.testId}`);
      setShareMsg(r === "downloaded" ? "결과 카드를 이미지로 저장했어요 📥" : "공유했어요 🎉");
    } catch {
      setShareMsg("카드를 만들지 못했어요. 다시 시도해 주세요.");
    } finally { setBusy(false); }
  };

  const onSave = async () => {
    let uid: string | null = null;
    try { uid = getFirebaseAuth().currentUser?.uid || null; } catch { uid = null; }
    if (!uid) { setSaveState("login"); return; }
    setSaveState("saving");
    const ok = await savePsychResult(badge);
    setSaveState(ok ? "saved" : "fail");
  };

  return (
    <div className="mt-3">
      <div className={`grid ${allowBadge ? "grid-cols-2" : "grid-cols-1"} gap-2.5`}>
        <button
          onClick={onShare}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#F9954E] text-white text-[13.5px] font-bold active:opacity-85 transition-opacity disabled:opacity-60"
        >
          <Share2 className="w-4 h-4" /> 결과 카드 공유
        </button>
        {allowBadge && (
          <button
            onClick={onSave}
            disabled={saveState === "saving" || saveState === "saved"}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 text-[13.5px] font-bold active:opacity-70 transition-opacity"
          >
            {saveState === "saved" ? <><Check className="w-4 h-4 text-emerald-500" /> 저장됨</> : <><BookmarkPlus className="w-4 h-4" /> 코지홈에 저장</>}
          </button>
        )}
      </div>
      {shareMsg && <p className="text-center text-[12px] text-neutral-500 dark:text-neutral-400 mt-2">{shareMsg}</p>}
      {saveState === "saved" && (
        <p className="text-center text-[12px] text-neutral-500 dark:text-neutral-400 mt-2">
          내 <Link href="/profile" className="font-bold text-[#F9954E]">코지홈 프로필</Link>에 결과 뱃지가 추가됐어요.
        </p>
      )}
      {saveState === "login" && (
        <p className="text-center text-[12px] text-neutral-500 dark:text-neutral-400 mt-2">
          <Link href="/login?next=/psychtest" className="font-bold text-[#F9954E]">로그인</Link>하면 결과를 코지홈에 저장할 수 있어요.
        </p>
      )}
      {saveState === "fail" && <p className="text-center text-[12px] text-rose-500 mt-2">저장에 실패했어요. 잠시 후 다시 시도해 주세요.</p>}
    </div>
  );
}

/* ───────────────────────── 공통 조각 ───────────────────────── */
function MetaPill({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 px-3 py-2.5 text-center">
      <p className="text-[10px] text-neutral-400 mb-0.5">{k}</p>
      <p className="text-[13px] font-extrabold text-neutral-800 dark:text-neutral-100 break-keep">{v}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-3.5 rounded-full bg-[#F9954E]" />
        <h2 className="text-[13px] font-extrabold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Intro({ test, onBack, onStart }: { test: PsychTest; onBack: () => void; onStart: () => void }) {
  const count =
    test.kind === "scored" ? test.items.length
    : test.kind === "multi" ? test.dimensions.reduce((s, d) => s + d.items.length, 0)
    : test.questions.length;
  const disclaimer = (test.kind === "scored" || test.kind === "multi") ? test.disclaimer : undefined;
  const about = getAbout(test.id);

  return (
    <main className="w-full min-h-screen py-9">
      <button onClick={onBack} className="flex items-center gap-1 text-[12.5px] font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> 검사 목록
      </button>

      {/* 표제부 */}
      <div className="text-center mb-5">
        <div className="text-[58px] leading-none mb-3">{test.emoji}</div>
        <p className="text-[11px] font-bold text-[#F9954E] mb-1.5 tracking-wide">검사 안내</p>
        <h1 className="text-[23px] font-extrabold text-neutral-950 dark:text-white break-keep leading-tight">{test.title}</h1>
      </div>

      {/* 메타 3종 */}
      <div className="flex gap-2 mb-6">
        <MetaPill k="문항" v={`${count}문항`} />
        <MetaPill k="예상 소요" v={test.time} />
        <MetaPill k="근거 척도" v={test.subtitle.split(" · ").pop() || "—"} />
      </div>

      {about ? (
        <>
          <Section title="이 검사는">
            <p className="text-[13.5px] text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep">{about.what}</p>
          </Section>

          <Section title="측정 영역">
            <div className="flex flex-col gap-1.5">
              {about.measures.map((m, i) => (
                <div key={i} className="flex gap-2.5 rounded-xl bg-neutral-50 dark:bg-zinc-900 px-3.5 py-2.5">
                  <span className="text-[12.5px] font-extrabold text-neutral-800 dark:text-neutral-100 shrink-0 min-w-[88px] break-keep">{m.label}</span>
                  <span className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">{m.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="측정·채점 방식">
            <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep">{about.how}</p>
          </Section>

          <Section title="결과 해석">
            <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep">{about.interpret}</p>
          </Section>
        </>
      ) : (
        <p className="text-[14px] text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep mb-6">{test.intro}</p>
      )}

      {disclaimer && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 px-4 py-3 mb-4">
          <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-amber-700 dark:text-amber-300 leading-relaxed break-keep">{disclaimer}</p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 px-4 py-3 mb-2">
        <Info className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
        <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          근거: {about ? about.background : test.source} · 응답은 내 기기에서만 계산되며 저장·전송되지 않습니다.
        </p>
      </div>

      <button onClick={onStart} className="flex items-center justify-center gap-1.5 w-full py-4 mt-4 rounded-2xl bg-[#F9954E] text-white text-[15px] font-bold active:opacity-85 transition-opacity">
        검사 시작 <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-center text-[11px] text-neutral-400 mt-3 break-keep">정확한 결과를 위해 평소의 자신을 떠올리며 솔직하게 답해주세요.</p>
    </main>
  );
}

function TopBar({ label, step, total, progress, onBack }: { label: string; step: number; total: number; progress: number; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-[12.5px] font-bold text-neutral-500 dark:text-neutral-400 truncate">{label}</p>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-[#F9954E] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[12px] font-bold text-neutral-400 tabular-nums">{step + 1}/{total}</span>
      </div>
    </>
  );
}
