"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { listMyCreations, deleteCreation, type Creation } from "@/lib/userAnimals";

const T = {
  ko: {
    title: "🐣 내가 만든 동물",
    create: "+ 만들기",
    empty: "아직 만든 동물이 없어요. ",
    emptyCta: "상상한 동물을 만들어보세요 →",
    remove: "삭제",
    confirmRemove: (name: string) => `"${name}"을(를) 삭제할까요?`,
  },
  en: {
    title: "🐣 Animals I made",
    create: "+ Create",
    empty: "You haven't made any animals yet. ",
    emptyCta: "Make one from your imagination →",
    remove: "Delete",
    confirmRemove: (name: string) => `Delete "${name}"?`,
  },
} as const;

/** 프로필 '내가 만든 동물' 섹션 — 해당 유저가 등록한 창작 동물 그리드 */
export default function MyAnimalsSection({ uid, isOwner }: { uid: string; isOwner: boolean }) {
  // ⚠️ 훅은 아래 조기 return(items === null 등)보다 앞에 있어야 한다.
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const t = T[isEn ? "en" : "ko"];
  // ⚠️ 만들기 화면은 아직 영어판이 없다. 생성 API(functions/api/create-animal.ts)가
  //    "한국어로" 생성하도록 고정돼 있어 영어 UI만 만들면 결과가 한글로 나온다.
  //    API를 로케일 대응할 때 /en/animal/create 를 함께 만든다.
  const createHref = "/animal/create";
  const [items, setItems] = useState<Creation[] | null>(null);
  const [open, setOpen] = useState<Creation | null>(null);

  useEffect(() => { if (uid) listMyCreations(uid, 60).then(setItems); }, [uid]);

  if (items === null) return null;
  if (items.length === 0 && !isOwner) return null;

  async function remove(c: Creation) {
    if (!confirm(t.confirmRemove(c.animal_name))) return;
    await deleteCreation(c.id);
    setItems((arr) => arr?.filter((x) => x.id !== c.id) || arr);
    setOpen(null);
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#F9954E]/30 dark:border-[#F9954E]/20 bg-white dark:bg-zinc-950 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-extrabold text-stone-900 dark:text-white">{t.title} {items.length > 0 && <span className="text-[#F9954E]">{items.length}</span>}</p>
        {isOwner && <a href={createHref} className="text-[11px] font-bold text-white bg-[#F9954E] rounded-full px-3 py-1 active:opacity-85">{t.create}</a>}
      </div>

      {items.length === 0 ? (
        <p className="text-[12px] text-stone-400 py-3 text-center">{t.empty}<a href={createHref} className="font-bold text-[#F9954E]">{t.emptyCta}</a></p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {items.map((c) => (
            <button key={c.id} onClick={() => setOpen(c)} className="group text-left rounded-xl overflow-hidden border border-stone-100 dark:border-zinc-800">
              <div className="relative aspect-square overflow-hidden bg-stone-100 dark:bg-zinc-900">
                <img src={c.imageUrl} alt={c.animal_name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="px-1.5 py-1 text-[11px] font-bold text-stone-800 dark:text-stone-200 truncate">{c.animal_name}</div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="relative w-full max-w-sm max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 text-white text-lg leading-none backdrop-blur">×</button>
            <div className="relative aspect-[4/5] bg-stone-100 dark:bg-zinc-900">
              <img src={open.imageUrl} alt={open.animal_name} className="w-full h-full object-cover" />
              {open.status?.label && <span className="absolute top-3 left-3 rounded-full text-white text-[11px] font-bold px-2.5 py-1" style={{ background: open.status.color }}>{open.status.label}</span>}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-extrabold text-stone-900 dark:text-white break-keep">{open.animal_name}</h3>
              {open.search_nickname && <p className="text-[13px] text-[#E8832E] dark:text-[#FBAA60] font-bold mt-0.5">&ldquo;{open.search_nickname}&rdquo;</p>}
              {open.kid_friendly_desc && <p className="text-[13px] text-stone-600 dark:text-stone-300 mt-2 leading-relaxed break-keep">{open.kid_friendly_desc}</p>}
              <div className="mt-3 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 p-3 space-y-1.5">
                {open.info?.map(([ic, k, v], i) => (
                  <div key={i} className="flex items-start gap-2 text-[12.5px]">
                    <span className="w-5 text-center flex-shrink-0">{ic}</span>
                    <span className="font-bold text-stone-500 dark:text-stone-400 w-12 flex-shrink-0">{k}</span>
                    <span className="text-stone-700 dark:text-stone-300 break-keep">{v}</span>
                  </div>
                ))}
              </div>
              {isOwner && <button onClick={() => remove(open)} className="mt-4 w-full rounded-2xl border border-red-200 dark:border-red-900/50 text-red-500 py-2.5 text-[13px] font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition">{t.remove}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
