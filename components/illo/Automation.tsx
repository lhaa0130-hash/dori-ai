"use client";

// 자동화 — 관제탑에서 세팅이 끝난 팀에 업무를 지시하면, 팀원(직원)이 순서대로 일을 처리한다.
// 각 직원은 배정된 AI 모델로 실행되고, 앞 직원의 결과가 다음 직원의 입력으로 넘어간다(파이프라인).
// 루프: 한 바퀴가 끝나면 그 결과를 다시 입력으로 물려 같은 팀을 반복 실행 → 결과가 점점 다듬어진다.

import { useEffect, useRef, useState } from "react";
import {
  Play, Square, RotateCw, Users, User, Sparkles, AlertTriangle,
  Check, Loader2, Trash2, ArrowDown, Info,
} from "lucide-react";
import {
  loadOrg, saveOrg, syncOrg, saveOrgCloudDebounced,
  isRunnable, toolLabel, modelLabelOf, DEFAULT_MODEL,
  type OrgDivision, type OrgTeam, type OrgMember, type OrgStatus,
} from "@/lib/illo/orgchart";
import { saveResult } from "@/lib/illo/history";

// 직원의 (도구, 상세모델) → 실제 호출 모델.
// 실행 경로는 Claude 직접 호출뿐이라, Claude가 아닌 도구는 저렴한 Claude(Haiku)로 폴백한다.
function toClaudeModel(m: OrgMember): string {
  return isRunnable(m.tool) ? m.model : DEFAULT_MODEL;
}
function memberModelLabel(m: OrgMember): string {
  return `${toolLabel(m.tool)} · ${modelLabelOf(m.tool, m.model)}`;
}

type LogEntry = {
  round: number;
  memberName: string;
  role: string;
  model: string;
  text: string;
  error?: boolean;
};

export default function Automation({
  userKey, callModel, free, quota, onShowKey, onView,
}: {
  userKey: string;
  callModel: (prompt: string, model: string, maxTokens?: number) => Promise<string>;
  free: boolean;
  quota: number | null;
  onShowKey: () => void;
  onView: (id: string) => void;
}) {
  const [divisions, setDivisions] = useState<OrgDivision[]>([]);
  const [pick, setPick] = useState<{ divId: string; teamId: string } | null>(null);
  const [goal, setGoal] = useState("");
  const [loop, setLoop] = useState(false);
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [err, setErr] = useState("");
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDivisions(loadOrg(userKey));                       // 즉시(로컬)
    let cancelled = false;
    void syncOrg(userKey).then((d) => { if (!cancelled) setDivisions(d); }); // 계정 기준으로 맞춤
    return () => { cancelled = true; };
  }, [userKey]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [log]);

  // 실행 가능한(직원이 1명 이상인) 팀만 노출
  const ready: { div: OrgDivision; team: OrgTeam }[] = [];
  divisions.forEach((d) => d.teams.forEach((t) => { if (t.members.length > 0) ready.push({ div: d, team: t }); }));

  const sel = pick ? ready.find((r) => r.div.id === pick.divId && r.team.id === pick.teamId) || null : null;

  function setMemberStatus(divId: string, teamId: string, memberId: string, status: OrgStatus) {
    setDivisions((prev) => {
      const next = prev.map((d) => d.id !== divId ? d : {
        ...d,
        teams: d.teams.map((t) => t.id !== teamId ? t : {
          ...t, members: t.members.map((m) => m.id !== memberId ? m : { ...m, status }),
        }),
      });
      saveOrg(userKey, next);
      saveOrgCloudDebounced(next);   // 실행 중 상태(작업중→완료)도 계정에 반영
      return next;
    });
  }

  function buildPrompt(div: OrgDivision, team: OrgTeam, m: OrgMember, input: string, round: number, total: number) {
    return [
      `당신은 '${div.name || "부서"}' 부서, '${team.name || "팀"}' 팀의 직원 '${m.name || "담당자"}'입니다.`,
      `당신이 맡은 역할: ${m.role || "(역할 미지정 — 입력 내용에 맞게 판단해서 처리)"}`,
      total > 1 ? `지금은 총 ${total}회 반복 중 ${round}번째 회차입니다.` : "",
      "",
      "아래 입력을 당신의 역할에 맞게 처리해서 **결과물만** 내주세요.",
      "이 결과는 다음 담당자에게 그대로 전달되니, 설명이나 인사말 없이 결과 자체만 작성하세요.",
      "",
      "--- 입력 ---",
      input,
    ].filter(Boolean).join("\n");
  }

  async function run() {
    if (!sel || !goal.trim() || running) return;
    setRunning(true); setErr(""); setLog([]);
    stopRef.current = false;

    const { div, team } = sel;
    const total = loop ? rounds : 1;
    let context = goal.trim();
    let last = "";

    try {
      for (let r = 1; r <= total; r++) {
        for (const m of team.members) {
          if (stopRef.current) throw new Error("__STOP__");
          setMemberStatus(div.id, team.id, m.id, "work");
          try {
            const text = await callModel(buildPrompt(div, team, m, context, r, total), toClaudeModel(m), 2000);
            context = text;
            last = text;
            setLog((p) => [...p, { round: r, memberName: m.name || "담당자", role: m.role || "", model: memberModelLabel(m), text }]);
            setMemberStatus(div.id, team.id, m.id, "done");
          } catch (e) {
            if ((e as Error).message === "__STOP__") throw e;
            const msg = (e as Error).message || "실행 실패";
            setLog((p) => [...p, { round: r, memberName: m.name || "담당자", role: m.role || "", model: memberModelLabel(m), text: msg, error: true }]);
            setMemberStatus(div.id, team.id, m.id, "alert");
            throw e;
          }
        }
        // 루프: 완성된 결과를 다시 입력으로 물려 다음 회차를 돌린다
        if (r < total) {
          context = [
            "아래는 이전 회차에서 팀이 완성한 결과입니다.",
            "이 결과를 검토해서 부족하거나 어색한 부분을 찾아 더 낫게 개선해 주세요.",
            "",
            "--- 이전 결과 ---",
            context,
          ].join("\n");
        }
      }

      if (last) {
        saveResult({
          toolId: "automation",
          toolLabel: `자동화 · ${div.name || "부서"} / ${team.name || "팀"}`,
          input: goal.trim(),
          output: last,
          steps: team.members.map((m) => `${m.name || "담당자"}${m.role ? ` (${m.role})` : ""} · ${memberModelLabel(m)}`),
        });
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "__STOP__") setErr("사용자가 중지했습니다.");
      else if (msg === "LOGIN_REQUIRED") setErr("로그인이 필요해요.");
      else if (msg === "FREE_QUOTA_EXCEEDED") setErr("오늘 무료 한도를 다 썼어요. 설정에서 내 API 키를 넣으면 무제한으로 쓸 수 있어요.");
      else setErr(msg || "실행 중 문제가 생겼어요.");
    } finally {
      setRunning(false);
      stopRef.current = false;
    }
  }

  function stop() { stopRef.current = true; }

  // ── 조직이 아직 없을 때 ──
  if (ready.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-10">
          <h1 className="text-[22px] font-extrabold tracking-tight">자동화</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1.5 leading-relaxed">
            부서 · 팀 · 직원 세팅이 끝난 팀에 업무를 지시하면, 직원들이 순서대로 자동으로 처리해요.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <div className="text-3xl mb-3">🗂️</div>
            <div className="font-bold text-[15px]">아직 일 시킬 팀이 없어요</div>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed break-keep">
              먼저 <b className="text-foreground">AI 비서</b>에서 부서 → 팀 → 직원을 만들고<br />
              직원마다 역할과 AI 모델을 정해 주세요. 직원이 1명 이상인 팀부터 자동화에 나타나요.
            </p>
            <button onClick={() => onView("builder")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-[13.5px] font-semibold transition hover:opacity-90">
              AI 비서에서 팀 만들기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h1 className="text-[22px] font-extrabold tracking-tight">자동화</h1>
          {free && (
            <button onClick={onShowKey} className="shrink-0 text-[12px] text-muted-foreground hover:text-primary transition-colors">
              🆓 오늘 남은 <b className="text-primary">{quota ?? "–"}</b>회 · 내 키 넣기
            </button>
          )}
        </div>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed">
          세팅이 끝난 팀에 업무를 지시하면 직원들이 <b className="text-foreground">순서대로</b> 처리해요. 앞 직원의 결과가 다음 직원에게 넘어갑니다.
        </p>

        {/* 1. 팀 고르기 */}
        <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground mt-7 mb-2.5">1 · 일 시킬 팀</h2>
        <div className="space-y-2">
          {ready.map(({ div, team }) => {
            const on = pick?.divId === div.id && pick?.teamId === team.id;
            return (
              <button key={`${div.id}-${team.id}`} onClick={() => setPick({ divId: div.id, teamId: team.id })} disabled={running}
                className={"w-full text-left rounded-2xl border p-4 transition disabled:opacity-50 " + (on ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "border-border bg-card hover:border-primary/50")}>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Users className="w-3.5 h-3.5" /> {div.name || "부서"}
                </div>
                <div className="font-bold text-[15px] mt-0.5">{team.name || "팀"}</div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {team.members.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11.5px] text-muted-foreground">
                      <User className="w-3 h-3" /> {m.name || "담당자"}
                      {m.role && <span className="text-muted-foreground/70">· {m.role}</span>}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. 업무 지시 */}
        <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground mt-7 mb-2.5">2 · 업무 지시</h2>
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} disabled={running}
          placeholder="예) 신제품 '몽글로 동물도감' 출시 소식을 인스타에 올릴 글로 만들어줘."
          className="w-full min-h-[110px] rounded-2xl border border-border bg-card px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-primary resize-y placeholder:text-muted-foreground disabled:opacity-50" />

        {/* 3. 루프 */}
        <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground mt-7 mb-2.5">3 · 반복(루프)</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} disabled={running}
              className="mt-0.5 w-4 h-4 rounded accent-[hsl(var(--primary))] cursor-pointer shrink-0" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-bold text-[14px]"><RotateCw className="w-3.5 h-3.5 text-primary" /> 결과를 다시 물려서 반복</span>
              <span className="block text-[12.5px] text-muted-foreground mt-1 leading-relaxed break-keep">
                한 바퀴가 끝나면 <b className="text-foreground">완성된 결과를 다시 입력으로</b> 넣어 같은 팀이 한 번 더 검토·개선해요. 돌릴수록 결과가 다듬어져요.
              </span>
            </span>
          </label>
          {loop && (
            <div className="mt-3.5 pt-3.5 border-t border-border flex items-center gap-3">
              <span className="text-[13px] text-muted-foreground">몇 바퀴</span>
              <select value={rounds} onChange={(e) => setRounds(Number(e.target.value))} disabled={running}
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[13px] outline-none focus:border-primary cursor-pointer">
                {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}바퀴</option>)}
              </select>
              <span className="text-[12px] text-muted-foreground">
                총 {(sel?.team.members.length ?? 0) * rounds}회 실행
              </span>
            </div>
          )}
        </div>

        {/* 비-Claude 모델 안내 */}
        {sel && sel.team.members.some((m) => !isRunnable(m.tool)) && (
          <div className="mt-3 flex gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-2.5 text-[12.5px] text-muted-foreground leading-relaxed break-keep">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              {sel.team.members.filter((m) => !isRunnable(m.tool)).map((m) => m.name || "담당자").join(", ")} 님에게 배정된 모델
              (GPT · Gemini · 이미지)은 아직 자동화 실행이 안 돼서 <b className="text-foreground">Claude Sonnet 5</b>로 대신 실행돼요.
            </span>
          </div>
        )}

        {/* 실행 */}
        <div className="mt-6 flex items-center gap-2.5">
          {!running ? (
            <button onClick={run} disabled={!sel || !goal.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-[14px] font-bold transition enabled:hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              <Play className="w-4 h-4" /> 일 시키기
            </button>
          ) : (
            <button onClick={stop}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[14px] font-bold text-foreground transition hover:border-rose-400 hover:text-rose-500">
              <Square className="w-4 h-4" /> 정지
            </button>
          )}
          {running && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> 직원들이 일하는 중…
            </span>
          )}
        </div>

        {err && (
          <div className="mt-3 flex gap-2 rounded-xl border border-rose-300 bg-rose-500/5 px-3.5 py-2.5 text-[12.5px] text-rose-600 dark:text-rose-400 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {err}
          </div>
        )}

        {/* 진행 로그 */}
        {log.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-8 mb-2.5">
              <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">진행 상황</h2>
              <button onClick={() => setLog([])} disabled={running}
                className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
                <Trash2 className="w-3 h-3" /> 지우기
              </button>
            </div>
            <div className="space-y-2.5">
              {log.map((e, i) => (
                <div key={i}>
                  {i > 0 && log[i - 1].round !== e.round && (
                    <div className="flex items-center gap-2 my-3.5">
                      <div className="flex-1 h-px bg-border" />
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11.5px] font-semibold text-primary">
                        <RotateCw className="w-3 h-3" /> {e.round}바퀴째 — 결과를 다시 물림
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  {i > 0 && log[i - 1].round === e.round && (
                    <div className="flex justify-center py-0.5"><ArrowDown className="w-3.5 h-3.5 text-muted-foreground/50" /></div>
                  )}
                  <div className={"rounded-2xl border p-4 " + (e.error ? "border-rose-300 bg-rose-500/5" : "border-border bg-card")}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={"w-6 h-6 rounded-full grid place-items-center shrink-0 " + (e.error ? "bg-rose-500/15 text-rose-500" : "bg-primary/10 text-primary")}>
                        {e.error ? <AlertTriangle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className="font-bold text-[14px]">{e.memberName}</span>
                      {e.role && <span className="text-[12px] text-muted-foreground">· {e.role}</span>}
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Sparkles className="w-3 h-3" /> {e.model}
                      </span>
                    </div>
                    <pre className={"mt-2.5 whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed " + (e.error ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>{e.text}</pre>
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            {!running && !err && (
              <p className="mt-3.5 text-[12.5px] text-muted-foreground">
                ✓ 완료 — 마지막 결과는 <button onClick={() => onView("docs")} className="text-primary font-semibold hover:underline">자료함</button>에도 저장됐어요.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
