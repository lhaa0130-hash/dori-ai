"use client";

import { useState, useEffect } from "react";
import { AiTool } from "@/types/content";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";
import { AI_TOOL_API_LINKS } from "@/constants/aiToolApiLinks";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from "@/constants/aiCategories";
import { ExternalLink, Code2, Star } from "lucide-react";

// 에디터 지정 순위 (트래픽 왜곡 보정 — 대기업 통합도메인이 위로 가는 문제 해결). 여기 있으면 최우선, 없으면 트래픽순.
const EDITORIAL_RANK: Record<string, number> = {
  "agent-cursor": 1, "agent-claude-code": 2, "agent-openai-operator": 3, "agent-manus": 4,
  "agent-devin": 5, "agent-perplexity-agent": 6, "agent-n8n": 7, "agent-genspark": 8,
  "agent-zapier-ai": 9, "agent-langchain": 10, "agent-autogpt": 11,
};

// ── 로고: DuckDuckGo 아이콘(안정적) → 실패 시 글자 아바타 ────────────
function toolFavicon(tool: AiTool) {
  try { return `https://icons.duckduckgo.com/ip3/${new URL(tool.website).hostname}.ico`; }
  catch { return letterAvatar(tool.name); }
}
function letterAvatar(name: string) {
  const ch = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#F9954E"/><text x="32" y="44" font-size="34" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">${ch}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// API 링크: 데이터 필드 우선, 없으면 별도 매핑 조회
function apiHref(tool: AiTool): string | null {
  return tool.apiUrl || AI_TOOL_API_LINKS[tool.id] || null;
}

// ── TOP 5 통합 카드 (1~5위 동일 크기) ─────────────────────────────
function TopCard({ tool, rank }: { tool: AiTool; rank: number }) {
  const api = apiHref(tool);
  const desc = tool.strength || tool.summary || tool.description || "";
  const features = (tool.pros && tool.pros.length > 0)
    ? tool.pros.slice(0, 3)
    : (tool.tags || []).slice(0, 3);

  return (
    <div
      className="group flex flex-col px-4 py-1.5 rounded-2xl bg-white dark:bg-zinc-950
        border border-neutral-100 dark:border-zinc-900
        hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5
        transition-all duration-200"
    >
      {/* 상단: 랭크 + 로고 + 이름/설명 + 평점 */}
      <div className="flex items-start gap-3.5">
        <span className={`text-[15px] font-black w-5 text-center mt-1 flex-shrink-0 ${
          rank === 1 ? "text-[#F9954E]"
          : rank === 2 ? "text-[#F9954E]/70"
          : rank === 3 ? "text-[#F9954E]/50"
          : "text-neutral-300 dark:text-zinc-600"
        }`}>
          {rank}
        </span>

        <img
          src={toolFavicon(tool)}
          alt={tool.name}
          className="w-10 h-10 rounded-xl object-contain bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex-shrink-0 p-0.5"
          loading="lazy"
          onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = letterAvatar(tool.name); } }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-extrabold text-neutral-900 dark:text-white leading-tight truncate">
              {tool.name}
            </h3>
            {tool.company && (
              <span className="text-[11px] text-neutral-300 dark:text-zinc-600 flex-shrink-0 truncate hidden sm:inline">
                {tool.company}
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2 break-keep">
            {desc}
          </p>
        </div>

        {tool.rating > 0 && (
          <div className="flex items-center gap-0.5 flex-shrink-0 mt-1">
            <Star className="w-3 h-3 fill-[#F9954E] text-[#F9954E]" />
            <span className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300">
              {tool.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* 핵심 특징 칩 */}
      {features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pl-[34px]">
          {features.map((f, i) => (
            <span
              key={i}
              className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-zinc-900
                px-2 py-0.5 rounded-full border border-neutral-100 dark:border-zinc-800 leading-snug"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* 하단: 버튼 2개 (API 연결 / 사이트 방문) */}
      <div className="flex gap-2 mt-auto pt-2 pl-[34px]">
        {api && (
          <a
            href={api}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12.5px] font-bold
              border border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-300
              hover:border-[#F9954E]/50 hover:text-[#F9954E] transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            API 연결
          </a>
        )}
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12.5px] font-bold
            bg-[#F9954E] text-white hover:bg-[#E8832E] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          사이트 방문
        </a>
      </div>
    </div>
  );
}

// ── 미니 카드 (6위 이하, 필터 모드 전체 목록용) ───────────────────
function MiniCard({ tool, rank }: { tool: AiTool; rank: number }) {
  const api = apiHref(tool);
  return (
    <div
      className="group flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-zinc-950
        border border-neutral-100 dark:border-zinc-900 hover:border-[#F9954E]/30 transition-all duration-150"
    >
      <span className="text-[11px] font-black text-neutral-300 dark:text-zinc-600 w-4 text-center flex-shrink-0">
        {rank}
      </span>
      <img
        src={toolFavicon(tool)}
        alt={tool.name}
        className="w-[30px] h-[30px] rounded-lg object-contain bg-neutral-50 dark:bg-zinc-900
          border border-neutral-100 dark:border-zinc-800 flex-shrink-0"
        loading="lazy"
        onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = letterAvatar(tool.name); } }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">{tool.name}</span>
        <p className="text-[11px] text-neutral-400 truncate hidden sm:block mt-0.5">{tool.summary || ""}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {api && (
          <a
            href={api}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md text-[11px] font-bold border border-neutral-200 dark:border-zinc-800
              text-neutral-400 hover:text-[#F9954E] hover:border-[#F9954E]/30 transition-colors"
          >
            API
          </a>
        )}
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-[#F9954E]
            hover:bg-[#E8832E] transition-colors"
        >
          방문
        </a>
      </div>
    </div>
  );
}

// ── 카테고리 섹션 ─────────────────────────────────────────────────
function CategorySection({
  cat,
  tools,
  sectionRef,
  isFiltered = false,
}: {
  cat: string;
  tools: AiTool[];
  sectionRef?: (el: HTMLElement | null) => void;
  isFiltered?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  // 점수(낮을수록 상위): ① OpenRouter 실시간 사용량 매칭분 최우선(높을수록 위) → ② 에디터 지정 순위 → ③ Tranco 트래픽순
  const score = (t: AiTool) => {
    const orv = (t as any).__or || 0;
    if (orv > 0) return -orv;                 // OpenRouter 실사용량(매칭 도구): 사용량 클수록 상위
    const ed = EDITORIAL_RANK[t.id];
    if (ed != null) return ed;                // 에디터 지정(에이전트 등 미매칭 도구)
    return 100000 + ((t as any).__pop ?? 999999);  // Tranco 웹트래픽
  };
  const sortedTools = tools.slice().sort((a, b) => {
    const sa = score(a), sb = score(b);
    if (sa !== sb) return sa - sb;
    return b.rating - a.rating;
  });

  const top5 = sortedTools.slice(0, 5).map((t, i) => ({ ...t, topRank: i + 1 }));
  const rest = sortedTools.slice(5);

  return (
    <section
      id={`category-${cat}`}
      ref={sectionRef}
      className="py-6 border-b border-neutral-100 dark:border-zinc-900 last:border-0"
      style={{ scrollMarginTop: "80px" }}
    >
      {/* 카테고리 헤더 */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold text-[#F9954E] mb-1.5 uppercase tracking-wide">
            {cat === "agent" ? "🆕 신규" : "Top 5"}
          </p>
          <h2 className="text-[22px] font-extrabold text-neutral-950 dark:text-white tracking-tight leading-tight">
            {CATEGORY_LABELS[cat] || cat}
          </h2>
          <p className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-1 leading-relaxed break-keep max-w-xs">
            {CATEGORY_DESCRIPTIONS[cat]}
          </p>
        </div>
        <span className="text-[12px] font-semibold text-neutral-400 flex-shrink-0">
          {sortedTools.length}개
        </span>
      </div>

      {/* Top 5 통합 카드 (동일 크기) */}
      <div className="flex flex-col gap-1.5">
        {top5.map((tool) => (
          <TopCard key={tool.id} tool={tool} rank={tool.topRank ?? 1} />
        ))}
      </div>

      {/* 6위 이하: 필터 모드는 항상, 전체창은 펼치기 시 */}
      {rest.length > 0 && (isFiltered || expanded) && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-neutral-100 dark:bg-zinc-900" />
            <span className="text-[11px] font-bold text-neutral-300 dark:text-zinc-600 uppercase tracking-widest whitespace-nowrap">
              전체 {sortedTools.length}개
            </span>
            <div className="h-px flex-1 bg-neutral-100 dark:bg-zinc-900" />
          </div>
          <div className="flex flex-col gap-1.5">
            {rest.map((tool, i) => (
              <MiniCard key={tool.id} tool={tool} rank={i + 6} />
            ))}
          </div>
        </div>
      )}

      {/* 전체창: 펼치기 / 접기 */}
      {!isFiltered && rest.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 w-full py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 text-[13px] font-bold
            text-neutral-500 dark:text-neutral-400 hover:border-[#F9954E]/40 hover:text-[#F9954E] transition-colors"
        >
          {expanded ? "접기 ▲" : `+ ${rest.length}개 더 보기 ▼`}
        </button>
      )}
    </section>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
interface AiToolsListProps {
  filters: { category: string };
  sectionRefs?: React.MutableRefObject<{ [key: string]: HTMLElement | null }>;
}

export default function AiToolsList({ filters, sectionRefs }: AiToolsListProps) {
  const [tools, setTools] = useState<AiTool[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [popRanks, setPopRanks] = useState<Record<string, number>>({});
  const [orPop, setOrPop] = useState<Record<string, number>>({});
  const [orApps, setOrApps] = useState<AiTool[]>([]);

  useEffect(() => {
    const savedRatings = JSON.parse(localStorage.getItem("dori_tool_ratings") || "{}");
    const updated = AI_TOOLS_DATA.map((tool) => {
      const saved = savedRatings[tool.id];
      if (saved) {
        const avg = saved.count > 0 ? Number((saved.totalScore / saved.count).toFixed(1)) : 0;
        return { ...tool, rating: avg, ratingCount: saved.count };
      }
      return tool;
    });
    setTools(updated);
    setIsLoaded(true);
  }, []);

  // 6시간마다 갱신되는 전 세계 인기 순위(Tranco) 로드
  useEffect(() => {
    fetch("/tool-ranks.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && d.ranks) setPopRanks(d.ranks); })
      .catch(() => {});
  }, []);

  // OpenRouter 실시간 사용량 로드 → 매칭되는 도구는 실사용량 순으로 라이브 정렬
  // (LLM=provider 요청량, 그 외=OpenRouter 앱 토큰량으로 매칭. 매칭 안 되면 기존 순서 유지)
  useEffect(() => {
    const norm = (x: string) => (x || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
    const providerOf = (name: string) => {
      const s = (name || "").toLowerCase();
      if (/chatgpt|gpt|openai/.test(s)) return "openai";
      if (/gemini|google/.test(s)) return "google";
      if (/deepseek|딥시크/.test(s)) return "deepseek";
      if (/grok|x\.?ai/.test(s)) return "x-ai";
      if (/llama|meta|메타/.test(s)) return "meta";
      if (/mistral/.test(s)) return "mistralai";
      if (/qwen|alibaba|tongyi/.test(s)) return "qwen";
      if (/claude|anthropic/.test(s)) return "anthropic";
      return null;
    };
    const compute = (j: any) => {
      if (!j) return;
      const providerReq: Record<string, number> = {};
      for (const m of (j.usageTop || [])) providerReq[m.provider] = (providerReq[m.provider] || 0) + (m.req || 0);
      const appTokens: Record<string, number> = {};
      for (const a of (j.appsTop || [])) { const k = norm(a.title); if (k) appTokens[k] = a.tokensB || 0; }
      const map: Record<string, number> = {};
      for (const t of AI_TOOLS_DATA) {
        let v = 0;
        if (String(t.category) === "llm") {
          const p = providerOf(t.name); if (p && providerReq[p]) v = providerReq[p];
        } else {
          const k = norm(t.name);
          if (k) for (const title in appTokens) { if (title.includes(k) || k.includes(title)) v = Math.max(v, appTokens[title]); }
        }
        if (v > 0) map[t.id] = v;
      }
      setOrPop(map);

      // OpenRouter 실사용 톱 '에이전트/코딩' 앱을 에이전트 카테고리에 합치기(목록에 없던 Hermes 등 실제 1위가 뜨도록)
      const curatedNames = new Set(AI_TOOLS_DATA.map((t) => norm(t.name)));
      const isAgentApp = (a: any) => /agent|code|coding|cli|dev|build|automat|claw|assistant|copilot|에이전트|코드/i.test(((a.title || "") + " " + (a.desc || "")));
      const apps = (j.appsTop || [])
        .filter((a: any) => a.title && isAgentApp(a) && !curatedNames.has(norm(a.title)))
        .slice(0, 20)
        .map((a: any) => {
          const d = a.descKo || ((a.desc || "").replace(/\s*\S*$/, "") + "…");
          return {
            id: "orapp-" + norm(a.title), name: a.title, category: "agent",
            summary: d, strength: d,
            description: a.descKo || a.desc || "", website: a.url || a.favicon || "#",
            pros: [], rating: 0, ratingCount: 0, userRatings: [], comments: [], __or: a.tokensB || 0,
          };
        });
      setOrApps(apps as any);
    };
    // 에이전트 앱 설명 한글(descKo)은 수집기가 stats.json에만 넣으므로 정적 JSON 우선, 엣지(/api/openrouter)는 폴백
    fetch("/openrouter-stats.json").then((r) => (r.ok ? r.json() : null))
      .then((j) => (j ? compute(j) : fetch("/api/openrouter").then((r) => (r.ok ? r.json() : null)).then(compute)))
      .catch(() => fetch("/api/openrouter").then((r) => (r.ok ? r.json() : null)).then(compute).catch(() => {}));
  }, []);

  const base = isLoaded && tools.length > 0 ? tools : AI_TOOLS_DATA;
  const currentTools = [
    ...base.map((t) => ({ ...t, __pop: popRanks[t.id] ?? null, __or: orPop[t.id] ?? 0 })),
    ...orApps, // OpenRouter 실사용 톱 에이전트 앱(Hermes 등) 합류
  ] as AiTool[];
  const isOverviewMode = filters.category === "All";

  if (isOverviewMode) {
    return (
      <div className="w-full flex flex-col">
        {DISPLAY_CATEGORIES.map((cat) => {
          const catTools = currentTools.filter((t) => String(t.category) === String(cat));
          if (catTools.length === 0) return null;
          return (
            <CategorySection
              key={cat}
              cat={cat}
              tools={catTools}
              isFiltered={false}
              sectionRef={(el) => { if (sectionRefs) sectionRefs.current[`category-${cat}`] = el; }}
            />
          );
        })}
      </div>
    );
  }

  const filteredTools = currentTools.filter(
    (t) => t.category.toLowerCase() === filters.category.toLowerCase()
  );

  if (filteredTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[32px] mb-3">🔍</p>
        <p className="text-[15px] font-semibold text-neutral-500">조건에 맞는 도구가 없어요</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <CategorySection cat={filters.category} tools={filteredTools} isFiltered={true} />
    </div>
  );
}
