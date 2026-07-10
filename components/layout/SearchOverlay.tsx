"use client";

// 헤더 검색 — 글(인사이트, titles.json) + 주요 메뉴를 즉시 필터. Enter=첫 결과 이동, Esc 닫기.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

type Item = { t: string; c: string; s: string };

const SHORTCUTS: { t: string; href: string }[] = [
  { t: "커뮤니티", href: "/community" }, { t: "피드", href: "/feed" }, { t: "인사이트", href: "/insight" },
  { t: "AI 도구", href: "/ai-tools" }, { t: "AI 모델", href: "/ai-models" }, { t: "미니게임", href: "/minigame" },
  { t: "몽글로 : 동물도감", href: "/animal" }, { t: "마켓", href: "/market" }, { t: "상점", href: "/shop" },
  { t: "공지사항", href: "/notice" }, { t: "FAQ", href: "/faq" }, { t: "마이페이지", href: "/profile" },
];

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    if (idx.length === 0) {
      fetch("/titles.json").then((r) => r.json()).then((j) => setIdx(j.items || [])).catch(() => {});
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const term = q.trim().toLowerCase();
  const shortcutHits = term ? SHORTCUTS.filter((s) => s.t.toLowerCase().includes(term)).slice(0, 6) : SHORTCUTS.slice(0, 8);
  const articleHits = term ? idx.filter((a) => a.t.toLowerCase().includes(term)).slice(0, 14) : [];

  const go = (href: string) => { onClose(); router.push(href); };
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const first = articleHits[0] ? `/insight/article/${articleHits[0].s}` : shortcutHits[0]?.href;
    if (first) go(first);
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-[11vh] -translate-x-1/2 w-[92vw] max-w-[560px] bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-neutral-200 dark:border-zinc-800 overflow-hidden">
        <form onSubmit={onSubmit} className="flex items-center gap-2.5 px-4 py-3.5 border-b border-neutral-100 dark:border-zinc-800">
          <Search className="w-[18px] h-[18px] text-neutral-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="글·메뉴 검색"
            className="flex-1 bg-transparent outline-none text-[15px] text-neutral-900 dark:text-white placeholder:text-neutral-400"
          />
          <button type="button" onClick={onClose} aria-label="닫기" className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </form>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {shortcutHits.length > 0 && (
            <>
              <p className="px-2.5 py-1.5 text-[10px] font-bold tracking-widest uppercase text-neutral-400">바로가기</p>
              {shortcutHits.map((s) => (
                <button key={s.href} onClick={() => go(s.href)} className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-left hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors">
                  <span className="text-[13.5px] font-semibold text-neutral-800 dark:text-neutral-100">{s.t}</span>
                </button>
              ))}
            </>
          )}

          {articleHits.length > 0 && (
            <>
              <p className="px-2.5 py-1.5 mt-1 text-[10px] font-bold tracking-widest uppercase text-neutral-400">인사이트 글</p>
              {articleHits.map((a) => (
                <button key={a.s} onClick={() => go(`/insight/article/${a.s}`)} className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors">
                  <span className="text-[10px] font-bold text-[#F9954E] bg-[#FFF1E3] dark:bg-[#F9954E]/15 rounded px-1.5 py-0.5 flex-shrink-0">{a.c}</span>
                  <span className="text-[13px] text-neutral-700 dark:text-neutral-200 line-clamp-1">{a.t}</span>
                </button>
              ))}
            </>
          )}

          {term && articleHits.length === 0 && shortcutHits.length === 0 && (
            <p className="text-center text-[13px] text-neutral-400 py-10">‘{q}’ 검색 결과가 없어요</p>
          )}
        </div>
      </div>
    </div>
  );
}
