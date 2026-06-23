"use client";

// 인라인 미리보기 패널 — 인사이트 행에 마우스를 올리면 우측 절반에 표시(토스처럼).
// 요약 + 좋아요 수 + 최근 댓글(커뮤니티) + 전체 보기.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, ArrowRight } from "lucide-react";
import { getFirebaseFirestore } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export type PreviewItem = { slug: string; title: string; date: string; thumbnail?: string; category: string; summary?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cmt = { id: string; name: string; text: string };

const EMOJI: Record<string, string> = { 트렌드: "🔥", 가이드: "📖", 리포트: "📊", 분석: "🔬", 큐레이션: "✨", 영상: "🎬" };

export default function InsightPreviewPane({ item }: { item: PreviewItem }) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Cmt[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLikes(0); setComments([]);
    (async () => {
      try {
        const db = getFirebaseFirestore();
        const ls = await getDoc(doc(db, "articleLikes", item.slug));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!cancelled && ls.exists()) setLikes(Math.max(0, Number((ls.data() as any).count || 0)));
        const qs = await getDocs(query(collection(db, "articleComments", item.slug, "items"), orderBy("createdAt", "desc"), limit(3)));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!cancelled) setComments(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [item.slug]);

  const href = `/insight/article/${item.slug}`;
  const dateStr = (() => { const t = new Date(item.date); return isNaN(t.getTime()) ? "" : t.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }); })();

  return (
    <div className="rounded-2xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* 썸네일 */}
      {item.thumbnail ? (
        <div className="relative w-full h-[190px] bg-neutral-100 dark:bg-zinc-900">
          <Image src={item.thumbnail} alt={item.title} fill style={{ objectFit: "cover" }} sizes="(max-width:1280px) 50vw, 360px" />
        </div>
      ) : (
        <div className="w-full h-[120px] bg-neutral-50 dark:bg-zinc-900 flex items-center justify-center text-4xl">{EMOJI[item.category] || "📝"}</div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold text-[#F9954E] bg-[#FFF1E3] dark:bg-[#F9954E]/15 rounded px-2 py-0.5">{EMOJI[item.category] || "📝"} {item.category}</span>
          <span className="text-[11px] text-neutral-400">{dateStr}</span>
        </div>

        <h3 className="text-[18px] font-extrabold text-neutral-950 dark:text-white leading-snug break-keep mb-2 line-clamp-2">{item.title}</h3>

        {item.summary && (
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep line-clamp-4 mb-4">{item.summary}</p>
        )}

        <div className="flex items-center gap-4 py-3 border-y border-neutral-100 dark:border-zinc-900 mb-4 text-[13px] text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5"><Heart className="w-4 h-4 text-[#F9954E]" /> {likes}</span>
          <span className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-[#F9954E]" /> {comments.length}{comments.length >= 3 ? "+" : ""}</span>
        </div>

        <p className="text-[11px] font-bold text-neutral-400 mb-2">커뮤니티</p>
        {comments.length === 0 ? (
          <p className="text-[12.5px] text-neutral-400 mb-5">아직 댓글이 없어요. 첫 댓글을 남겨보세요 ✍️</p>
        ) : (
          <ul className="space-y-2.5 mb-5">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#FFF1E3] dark:bg-[#F9954E]/15 flex items-center justify-center text-[11px] font-bold text-[#E8832E] dark:text-[#F9954E] flex-shrink-0">{(c.name || "익")[0]}</div>
                <div className="min-w-0">
                  <span className="text-[11.5px] font-bold text-neutral-700 dark:text-neutral-200">{c.name || "익명"}</span>
                  <p className="text-[12.5px] text-neutral-600 dark:text-neutral-300 break-words line-clamp-2">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link href={href} className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85 transition-opacity">
          전체 보기 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
