"use client";

// app/en/psychtest/page.client.tsx — English edition of the psychological self-check hub.
// Self-contained: it reuses the locale-neutral scoring engine from lib/psychTests.ts
// (computeScored / getTest helpers are pure maths) plus the English data in lib/psychTestsEn.ts.
// The Korean client at app/psychtest/page.client.tsx is untouched.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { RotateCcw, ArrowRight, ArrowLeft, Info, ShieldAlert, Lock, Phone } from "lucide-react";
import { computeScored, type PsychTest, type ScoredTest, type TypedTest, type Tone } from "@/lib/psychTests";
import { TESTS_EN, CATEGORIES_EN, getTestEn, getAboutEn, getResourcesEn } from "@/lib/psychTestsEn";

const TONE: Record<Tone, { ring: string; text: string; bar: string; soft: string }> = {
  good: { ring: "border-emerald-200 dark:border-emerald-900/50", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", soft: "bg-emerald-50 dark:bg-emerald-950/30" },
  mild: { ring: "border-amber-200 dark:border-amber-900/50",     text: "text-amber-600 dark:text-amber-400",     bar: "bg-amber-500",   soft: "bg-amber-50 dark:bg-amber-950/30" },
  warn: { ring: "border-orange-200 dark:border-orange-900/50",   text: "text-orange-600 dark:text-orange-400",   bar: "bg-orange-500",  soft: "bg-orange-50 dark:bg-orange-950/30" },
  high: { ring: "border-rose-200 dark:border-rose-900/50",       text: "text-rose-600 dark:text-rose-400",       bar: "bg-rose-500",    soft: "bg-rose-50 dark:bg-rose-950/30" },
};

// A word of support calibrated to severity, so the message never rings hollow.
const COMFORT: Record<Tone, string> = {
  good: "Things look relatively steady right now. That is not luck — some of it is the effort you have been putting in. Give yourself a bit of credit for it.",
  mild: "There are some early signals here, but nothing alarming. Stretches like this come to everyone. Go easy on yourself and start with the small things you can look after.",
  warn: "This may be a genuinely heavy or unsettling period for you. That is not weakness — it is a signal that you need some care. You do not have to carry all of it alone.",
  high: "It looks like you are going through something really hard right now. Checking in on yourself like this already takes courage. What you are dealing with can get better, and you deserve support with it.",
};

export default function PsychTestEnClient() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const test = activeId ? getTestEn(activeId) : null;

  if (!test) return <Hub onPick={setActiveId} />;
  return <Runner key={test.id} test={test} onExit={() => setActiveId(null)} />;
}

/* ───────────────────────── Hub ───────────────────────── */
function testCount(t: PsychTest): number {
  if (t.kind === "scored") return t.items.length;
  if (t.kind === "multi") return t.dimensions.reduce((s, d) => s + d.facets.reduce((a, f) => a + f.items.length, 0), 0);
  return t.questions.length;
}
function scaleTag(t: PsychTest): string {
  const parts = t.subtitle.split(" · ");
  return parts[parts.length - 1] || t.subtitle;
}

function Hub({ onPick }: { onPick: (id: string) => void }) {
  return (
    <main className="w-full min-h-screen">
      {/* ── Hero ── */}
      <section className="pt-8 pb-8 border-b border-stone-100 dark:border-zinc-900">
        <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">Psychological Assessment</p>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-stone-950 dark:text-white leading-[1.12] tracking-tight mb-2">
          Check in on your mind<br />with validated scales
        </h1>
        <p className="text-[14px] text-stone-400 dark:text-stone-500 leading-relaxed">
          Built on the screening scales used in clinical and research settings worldwide.<br />
          Results are a self-check rather than a diagnosis, and every answer is scored on your own device.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">💸 Completely free</span>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#F9954E] bg-[#F9954E]/10 px-2.5 py-1 rounded-full">🔓 No sign-up needed</span>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-zinc-900 px-2.5 py-1 rounded-full">🔒 Nothing is stored or sent</span>
        </div>
      </section>

      {/* ── Tests by category ── */}
      {CATEGORIES_EN.map((cat) => {
        const tests = TESTS_EN.filter((t) => t.category === cat.id);
        if (tests.length === 0) return null;
        return (
          <section key={cat.id} className="py-8 border-b border-stone-100 dark:border-zinc-900 last:border-0">
            <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-600 uppercase tracking-wide mb-1">
              {cat.emoji} {cat.name} · {tests.length}
            </p>
            <p className="text-[12px] text-stone-400 dark:text-zinc-600 mb-5">{cat.desc}</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tests.map((t) => {
                const about = getAboutEn(t.id);
                return (
                  <div key={t.id} className="flex flex-col rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#F9954E]/8 dark:bg-[#F9954E]/10 flex items-center justify-center text-[22px] flex-shrink-0">
                            {t.emoji}
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-[16px] font-extrabold text-stone-950 dark:text-white leading-tight">{t.title}</h2>
                            <span className="text-[10px] text-stone-400 dark:text-zinc-500">{scaleTag(t)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-stone-400 tabular-nums">{testCount(t)} items</span>
                      </div>
                      <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">{about ? about.what : t.intro}</p>
                    </div>

                    <div className="px-5 py-4 flex-1">
                      {about ? (
                        <ul className="space-y-2">
                          {about.measures.slice(0, 4).map((m) => (
                            <li key={m.label} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F9954E] mt-1.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[12.5px] font-bold text-stone-900 dark:text-white">{m.label}</span>
                                <span className="text-[12px] text-stone-500 dark:text-stone-400"> — {m.desc}</span>
                              </div>
                            </li>
                          ))}
                          {about.measures.length > 4 && (
                            <li className="text-[11.5px] text-stone-400 pl-3.5">+ {about.measures.length - 4} more areas</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-[12.5px] text-stone-500 dark:text-stone-400">{t.intro}</p>
                      )}
                    </div>

                    <div className="px-5 pb-5">
                      <button
                        onClick={() => onPick(t.id)}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#F9954E]/10 dark:bg-[#F9954E]/10 text-[#F9954E] text-[13px] font-extrabold transition-colors hover:bg-[#F9954E]/20 dark:hover:bg-[#F9954E]/20"
                      >
                        Start · {t.time} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ── Notice ── */}
      <section className="py-8">
        <div className="flex items-start gap-2.5 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-stone-50 dark:bg-zinc-900/50 px-5 py-4">
          <Lock className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
          <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
            Every check here is <b>completely free</b> and intended for <b>screening and self-reflection</b> — none of it is a medical diagnosis. Your answers are scored in your browser and are never uploaded or stored. If anything here worries you, please speak with a qualified professional.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ───────────────────────── Runner ───────────────────────── */
function Runner({ test, onExit }: { test: PsychTest; onExit: () => void }) {
  if (test.kind === "typed") return <TypedRunner test={test} onExit={onExit} />;
  if (test.kind === "multi") return null; // no multi-dimension tests in the English set yet
  return <ScoredRunner test={test} onExit={onExit} />;
}

/* ───────────────────────── Scored tests ───────────────────────── */
function ScoredRunner({ test, onExit }: { test: ScoredTest; onExit: () => void }) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => test.items.map(() => null));

  if (!started) return <Intro test={test} onBack={onExit} onStart={() => setStarted(true)} />;

  const done = answers.every((a) => a !== null);
  if (done) {
    return (
      <ScoredResult
        test={test}
        answers={answers as number[]}
        onBack={onExit}
        onRetry={() => { setAnswers(test.items.map(() => null)); setStep(0); setStarted(false); }}
      />
    );
  }

  const item = test.items[step];
  const opts = item.choices ?? test.scale;
  const progress = Math.round((step / test.items.length) * 100);

  const choose = (value: number) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
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
        <p className="text-[12.5px] font-semibold text-stone-400 mb-2">{test.question}</p>
      ) : (
        <p className="text-[12.5px] text-stone-400 mb-2">{test.subtitle}</p>
      )}
      <h2 className="text-[18.5px] font-extrabold text-stone-900 dark:text-white leading-snug mb-6 min-h-[2.4em]">
        {item.text}
      </h2>

      <div className="flex flex-col gap-2.5">
        {opts.map((o, i) => {
          const selected = answers[step] === o.value;
          return (
            <button
              key={i}
              onClick={() => choose(o.value)}
              className={`text-left px-4 py-3.5 rounded-2xl border text-[14px] font-semibold transition-all active:scale-[0.99] ${
                selected
                  ? "border-[#F9954E] bg-[#FBEEE7] dark:bg-[#F9954E]/15 text-[#d97a2e] dark:text-[#F9954E]"
                  : "border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-stone-800 dark:text-stone-100 hover:border-[#F9954E]/60"
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
  const stageTotal = test.bands.length;
  const stageIdx = Math.max(1, test.bands.indexOf(band) + 1);

  return (
    <main className="w-full min-h-screen py-9">
      <button onClick={onBack} className="flex items-center gap-1 text-[12.5px] font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 mb-5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to all checks
      </button>

      <p className="text-center text-[12px] font-bold text-[#F9954E] mb-3">{test.title} — your result</p>

      <div className={`rounded-3xl border ${tone.ring} bg-white dark:bg-zinc-950 p-7 shadow-sm`}>
        <div className="text-center">
          <div className="text-[56px] leading-none mb-2">{band.emoji}</div>
          <h1 className={`text-[24px] font-extrabold mb-1 ${tone.text}`}>{band.label}</h1>
          <p className="text-[13px] text-stone-400 tabular-nums">
            Score <b className="text-stone-700 dark:text-stone-200">{displayScore}</b> / {unitLabel}
          </p>
          <p className="text-[11.5px] text-stone-400 mt-1">Band <b className={tone.text}>{stageIdx}</b> of {stageTotal}</p>
        </div>

        <div className="mt-5 mb-6">
          <div className="h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full ${tone.bar} transition-all duration-500`} style={{ width: `${Math.max(4, pct)}%` }} />
          </div>
          <div className="flex justify-between text-[10.5px] text-stone-400 mt-1.5">
            <span>{higherWorse ? "Minimal" : "Low"}</span><span>{higherWorse ? "Severe" : "High"}</span>
          </div>
        </div>

        <div className={`rounded-2xl ${tone.soft} px-4 py-4 mb-4`}>
          <p className="text-[11.5px] font-bold text-stone-400 mb-1.5">What this means</p>
          <p className="text-[13.5px] text-stone-700 dark:text-stone-200 leading-relaxed">{band.desc}</p>
        </div>

        <div className="px-1 mb-4">
          <p className="text-[11.5px] font-bold text-stone-400 mb-1.5">What you can try</p>
          <p className="text-[13px] text-stone-600 dark:text-stone-300 leading-relaxed">{band.advice}</p>
        </div>

        <div className={`rounded-2xl border ${tone.ring} px-4 py-3.5`}>
          <p className={`text-[11.5px] font-bold mb-1.5 ${tone.text}`}>💛 A word for you</p>
          <p className="text-[13px] text-stone-700 dark:text-stone-200 leading-relaxed">{COMFORT[band.tone]}</p>
        </div>
      </div>

      <ResourcesBox testId={test.id} emphasize={!!test.crisis || band.tone === "high"} />

      <div className="mt-3 space-y-2">
        {test.note && (
          <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed px-1">{test.note}</p>
        )}
        <div className="flex items-start gap-2 rounded-2xl bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 px-4 py-3">
          <Info className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
          <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed">
            Based on: {test.source}. This result is a <b>screening self-check, not a medical diagnosis</b>. If anything here concerns you, please talk it through with a qualified professional.
          </p>
        </div>
      </div>

      <button onClick={onRetry} className="flex items-center justify-center gap-1.5 w-full py-3 mt-3 rounded-2xl bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 text-[13px] font-bold active:opacity-70 transition-opacity">
        <RotateCcw className="w-3.5 h-3.5" /> Take it again
      </button>
    </main>
  );
}

/* ───────────────────────── Typed (fun) tests ───────────────────────── */
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
        <button onClick={onExit} className="flex items-center gap-1 text-[12.5px] font-semibold text-stone-400 hover:text-stone-600 mb-5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to all checks
        </button>
        <p className="text-center text-[12px] font-bold text-[#F9954E] mb-4">{test.title}</p>
        <div className="rounded-3xl border border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm">
          <div className="text-[64px] leading-none mb-3">{r.emoji}</div>
          <h1 className="text-[26px] font-extrabold text-stone-950 dark:text-white mb-3">{r.title}</h1>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed mb-7">{r.desc}</p>
          {r.rec && (
            <Link href={r.rec.href} className="flex items-center justify-center gap-1.5 w-full py-3.5 rounded-2xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85 transition-opacity mb-2.5">
              {r.rec.label} <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button onClick={() => { setStep(0); setTally({}); setDone(null); setStarted(false); }} className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 text-[13px] font-bold active:opacity-70 transition-opacity">
            <RotateCcw className="w-3.5 h-3.5" /> Take it again
          </button>
        </div>
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
      <h2 className="text-[19px] font-extrabold text-stone-900 dark:text-white leading-snug mb-5 min-h-[2.4em]">{cur.q}</h2>
      <div className="flex flex-col gap-2.5">
        {cur.options.map((o, i) => (
          <button key={i} onClick={() => pick(o.type)} className="text-left px-4 py-4 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[14px] font-semibold text-stone-800 dark:text-stone-100 hover:border-[#F9954E] hover:bg-[#FBEEE7] dark:hover:bg-[#F9954E]/10 active:scale-[0.99] transition-all">
            {o.t}
          </button>
        ))}
      </div>
    </main>
  );
}

/* ───────────────────────── Where to get help ───────────────────────── */
function ResourcesBox({ testId, emphasize }: { testId: string; emphasize?: boolean }) {
  const list = getResourcesEn(testId);
  if (!list.length) return null;
  return (
    <div className={`rounded-2xl border px-4 py-3.5 mt-3 ${emphasize ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50" : "bg-stone-50 dark:bg-zinc-900 border-stone-100 dark:border-zinc-800"}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <ShieldAlert className={`w-4 h-4 ${emphasize ? "text-rose-500" : "text-[#F9954E]"}`} />
        <p className={`text-[12.5px] font-extrabold ${emphasize ? "text-rose-600 dark:text-rose-300" : "text-stone-700 dark:text-stone-200"}`}>Where to get help</p>
      </div>
      {emphasize && (
        <p className="text-[12px] text-rose-700 dark:text-rose-300 leading-relaxed mb-2.5">
          You do not have to get through this on your own. The services below are free, confidential, and used to conversations exactly like the one you might be avoiding.
        </p>
      )}
      <div className="flex flex-col gap-2.5">
        {list.map((r) => (
          <div key={r.name} className="flex items-start gap-2">
            <Phone className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[12.5px] leading-snug">
                <b className="text-stone-800 dark:text-stone-100">{r.name}</b>{" "}
                <span className="font-extrabold text-[#F9954E] tabular-nums">{r.phone}</span>
                <span className="text-[11px] text-stone-400"> · {r.hours}</span>
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed mt-0.5">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Shared pieces ───────────────────────── */
function MetaPill({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 px-3 py-2.5 text-center">
      <p className="text-[10px] text-stone-400 mb-0.5">{k}</p>
      <p className="text-[13px] font-extrabold text-stone-800 dark:text-stone-100">{v}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-3.5 rounded-full bg-[#F9954E]" />
        <h2 className="text-[13px] font-extrabold text-stone-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Intro({ test, onBack, onStart }: { test: PsychTest; onBack: () => void; onStart: () => void }) {
  const count =
    test.kind === "scored" ? test.items.length
    : test.kind === "multi" ? test.dimensions.reduce((s, d) => s + d.facets.reduce((a, f) => a + f.items.length, 0), 0)
    : test.questions.length;
  const disclaimer = (test.kind === "scored" || test.kind === "multi") ? test.disclaimer : undefined;
  const about = getAboutEn(test.id);

  return (
    <main className="w-full min-h-screen py-9">
      <button onClick={onBack} className="flex items-center gap-1 text-[12.5px] font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> All checks
      </button>

      <div className="text-center mb-5">
        <div className="text-[58px] leading-none mb-3">{test.emoji}</div>
        <p className="text-[11px] font-bold text-[#F9954E] mb-1.5 tracking-wide">ABOUT THIS CHECK</p>
        <h1 className="text-[23px] font-extrabold text-stone-950 dark:text-white leading-tight">{test.title}</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <MetaPill k="Items" v={`${count}`} />
        <MetaPill k="Takes" v={test.time} />
        <MetaPill k="Based on" v={test.subtitle.split(" · ").pop() || "—"} />
      </div>

      {about ? (
        <>
          <Section title="What this measures">
            <p className="text-[13.5px] text-stone-600 dark:text-stone-300 leading-relaxed">{about.what}</p>
          </Section>

          <Section title="Areas covered">
            <div className="flex flex-col gap-1.5">
              {about.measures.map((m, i) => (
                <div key={i} className="flex gap-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900 px-3.5 py-2.5">
                  <span className="text-[12.5px] font-extrabold text-stone-800 dark:text-stone-100 shrink-0 min-w-[110px]">{m.label}</span>
                  <span className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">{m.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="How it is scored">
            <p className="text-[13px] text-stone-600 dark:text-stone-300 leading-relaxed">{about.how}</p>
          </Section>

          <Section title="Reading your result">
            <p className="text-[13px] text-stone-600 dark:text-stone-300 leading-relaxed">{about.interpret}</p>
          </Section>
        </>
      ) : (
        <p className="text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed mb-6">{test.intro}</p>
      )}

      {disclaimer && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 px-4 py-3 mb-4">
          <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-amber-700 dark:text-amber-300 leading-relaxed">{disclaimer}</p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl bg-stone-50 dark:bg-zinc-900 border border-stone-100 dark:border-zinc-800 px-4 py-3 mb-2">
        <Info className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
        <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed">
          Based on: {about ? about.background : test.source} · Your answers are scored in your browser and are never stored or sent anywhere.
        </p>
      </div>

      <button onClick={onStart} className="flex items-center justify-center gap-1.5 w-full py-4 mt-4 rounded-2xl bg-[#F9954E] text-white text-[15px] font-bold active:opacity-85 transition-opacity">
        Start the check <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-center text-[11px] text-stone-400 mt-3">Answer as honestly as you can — the result is only as useful as the answers you give it.</p>
    </main>
  );
}

function TopBar({ label, step, total, progress, onBack }: { label: string; step: number; total: number; progress: number; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-[12.5px] font-bold text-stone-500 dark:text-stone-400 truncate">{label}</p>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-[#F9954E] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[12px] font-bold text-stone-400 tabular-nums">{step + 1}/{total}</span>
      </div>
    </>
  );
}
