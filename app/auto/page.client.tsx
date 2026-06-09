"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, ArrowUpRight, Clock, RefreshCw, Bot, Loader2 } from "lucide-react";

// ── GitHub 레포 설정 (auto-post-*.md 가 루트에 1시간마다 커밋됨) ──
const OWNER = "lhaa0130-hash";
const REPO = "dori-ai";
const BRANCH = "main";
const LIST_API = `https://api.github.com/repos/${OWNER}/${REPO}/contents?ref=${BRANCH}`;
const RAW = (name: string) => `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${name}`;
const META_CACHE_KEY = "dori_auto_meta_v1";
const MAX_POSTS = 36;

interface AutoPost {
  name: string;
  title: string;
  date: string;   // ISO or ""
}

// 프론트매터 파싱 (gray-matter 대신 경량 파서)
function parseFrontmatter(md: string): { data: Record<string, string>; body: string } {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: md };
  const data: Record<string, string> = {};
  m[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      let v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      data[k] = v;
    }
  });
  return { data, body: m[2] };
}

function prettyTitleFromName(name: string): string {
  return name.replace(/^auto-post-/, "").replace(/\.md$/, "").replace(/[-_]+/g, " ").trim() || "자동 생성 글";
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "방금 전";
  if (h < 24) return `${h}시간 전`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}일 전`;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function AutoClient() {
  const [posts, setPosts] = useState<AutoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<AutoPost | null>(null);
  const [body, setBody] = useState<string>("");
  const [bodyLoading, setBodyLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 캐시(제목/날짜)는 파일명별로 영구 — 한 번 읽은 글은 재요청 안 함
    let metaCache: Record<string, { title: string; date: string }> = {};
    try { metaCache = JSON.parse(localStorage.getItem(META_CACHE_KEY) || "{}"); } catch {}

    try {
      const res = await fetch(LIST_API, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error(`목록을 불러오지 못했어요 (${res.status})`);
      const files: { name: string; type: string }[] = await res.json();

      const names = files
        .filter((f) => f.type === "file" && /^auto-post-.*\.md$/.test(f.name))
        .map((f) => f.name)
        .sort((a, b) => b.localeCompare(a)) // 파일명(타임스탬프) 최신순
        .slice(0, MAX_POSTS);

      if (names.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // 캐시에 없는 글만 raw에서 프론트매터 fetch (raw는 rate-limit 없음)
      const results = await Promise.all(
        names.map(async (name): Promise<AutoPost> => {
          if (metaCache[name]) return { name, ...metaCache[name] };
          try {
            const r = await fetch(RAW(name));
            const text = await r.text();
            const { data } = parseFrontmatter(text);
            const meta = {
              title: (data.title || prettyTitleFromName(name)).trim(),
              date: data.date || "",
            };
            metaCache[name] = meta;
            return { name, ...meta };
          } catch {
            return { name, title: prettyTitleFromName(name), date: "" };
          }
        })
      );

      try { localStorage.setItem(META_CACHE_KEY, JSON.stringify(metaCache)); } catch {}

      // 날짜 있으면 날짜 최신순, 없으면 파일명순 유지
      results.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setPosts(results);
    } catch (e: any) {
      setError(e?.message || "불러오기에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 본문 열기
  const openPost = useCallback(async (post: AutoPost) => {
    setActive(post);
    setBody("");
    setBodyLoading(true);
    document.body.style.overflow = "hidden";
    try {
      const r = await fetch(RAW(post.name));
      const text = await r.text();
      setBody(parseFrontmatter(text).body);
    } catch {
      setBody("내용을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBodyLoading(false);
    }
  }, []);

  const closePost = useCallback(() => {
    setActive(null);
    setBody("");
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePost(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePost]);

  return (
    <main className="w-full min-h-screen">

      {/* 히어로 */}
      <section className="pt-8 pb-6 border-b border-neutral-100 dark:border-zinc-900">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 mb-4">
          <Bot className="w-3.5 h-3.5 text-[#F9954E]" />
          <span className="text-[11px] font-bold text-[#F9954E]">AI 자동 생성 · 매시간 업데이트</span>
        </div>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          오토 매거진
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-500 leading-relaxed break-keep">
          글로벌 테크 트렌드를 AI가 1시간마다 수집·정리해 올리는 자동 콘텐츠예요.
        </p>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 text-[13px] font-bold active:opacity-70 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
          {!loading && !error && (
            <span className="text-[12px] text-neutral-400">총 {posts.length}편</span>
          )}
        </div>
      </section>

      {/* 목록 */}
      <section className="py-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-neutral-100 dark:border-zinc-900 p-5 animate-pulse">
                <div className="h-4 w-16 bg-neutral-100 dark:bg-zinc-900 rounded-full mb-3" />
                <div className="h-4 w-full bg-neutral-100 dark:bg-zinc-900 rounded mb-2" />
                <div className="h-4 w-2/3 bg-neutral-100 dark:bg-zinc-900 rounded mb-5" />
                <div className="h-3 w-20 bg-neutral-100 dark:bg-zinc-900 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-3xl mb-3">📡</p>
            <p className="text-[15px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">목록을 불러오지 못했어요</p>
            <p className="text-[13px] text-neutral-400 mb-4">{error}</p>
            <button onClick={load} className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white text-[13px] font-bold">다시 시도</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-3xl mb-2">📰</p>
            <p className="text-[15px] font-medium text-neutral-500">아직 자동 생성된 글이 없어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {posts.map((post) => (
              <button
                key={post.name}
                onClick={() => openPost(post)}
                className="group text-left flex flex-col p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-200 min-h-[160px]"
              >
                <span className="inline-flex items-center gap-1 self-start text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 text-[#F9954E] mb-3">
                  <Bot className="w-2.5 h-2.5" /> AI 리뷰
                </span>
                <h2 className="text-[15px] font-extrabold text-neutral-900 dark:text-white leading-snug line-clamp-3 break-keep group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">
                  {post.title}
                </h2>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <Clock className="w-3 h-3" />
                    {fmtDate(post.date) || "자동 생성"}
                  </span>
                  <span className="flex items-center gap-0.5 text-[12px] font-bold text-[#F9954E]">
                    읽기 <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 본문 리더 모달 */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-8" onClick={closePost}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-2xl h-[92vh] sm:h-[88vh] flex flex-col bg-white dark:bg-zinc-950 sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden border border-neutral-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-zinc-800">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 text-[#F9954E] mb-2">
                  <Bot className="w-2.5 h-2.5" /> AI 자동 생성
                </span>
                <h2 className="text-[17px] font-extrabold text-neutral-900 dark:text-white leading-snug break-keep">{active.title}</h2>
                {fmtDate(active.date) && <p className="text-[12px] text-neutral-400 mt-1">{fmtDate(active.date)}</p>}
              </div>
              <button onClick={closePost} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {bodyLoading ? (
                <div className="flex items-center justify-center py-20 text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="prose-premium max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                    }}
                  >
                    {body}
                  </ReactMarkdown>
                </div>
              )}
              <p className="mt-10 pt-5 border-t border-neutral-100 dark:border-zinc-800 text-[11px] text-neutral-400 leading-relaxed">
                ⚠️ 이 글은 AI가 자동으로 작성한 콘텐츠이며, 일부 제휴(어필리에이트) 링크가 포함될 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
