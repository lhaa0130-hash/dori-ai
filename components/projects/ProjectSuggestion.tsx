"use client";

import { useState, useEffect } from "react";
import { Send, Trash2, MessageSquarePlus } from "lucide-react";

type SuggestType = "건의사항" | "버그 제보" | "기능 요청" | "기타";

interface Item {
  id: string;
  name: string;
  type: SuggestType;
  message: string;
  createdAt: string;
}

export default function ProjectSuggestion({ slug, projectName }: { slug: string; projectName: string }) {
  const KEY = `dori_project_suggest_${slug}`;
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<SuggestType>("건의사항");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch { setItems([]); }
  }, [KEY]);

  const persist = (next: Item[]) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) { alert("이름과 내용을 입력해주세요."); return; }
    if (message.trim().length < 5) { alert("내용은 5자 이상 입력해주세요."); return; }
    const item: Item = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `s_${Date.now()}`,
      name: name.trim(), type, message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    persist([item, ...items]);
    setName(""); setMessage(""); setType("건의사항"); setShowForm(false);
    alert("의견이 등록되었습니다. 감사합니다!");
  };

  const remove = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    persist(items.filter((x) => x.id !== id));
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border outline-none transition-all bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 text-neutral-900 dark:text-white focus:border-[#F9954E] placeholder:text-neutral-400 text-sm";

  if (!mounted) return null;

  return (
    <section className="pt-10 mt-8 border-t border-neutral-100 dark:border-zinc-900">
      <div className="mb-5">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-1.5">건의사항</p>
        <h2 className="text-[20px] font-extrabold text-neutral-950 dark:text-white">
          {projectName}에 바라는 점이 있나요?
        </h2>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 break-keep">
          이 프로젝트에 대한 의견·요청·버그를 남겨주세요. 개발에 적극 반영할게요.
        </p>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-4 rounded-2xl border border-dashed border-[#F9954E]/40 bg-[#FFF5EB]/50 dark:bg-[#F9954E]/5 text-[#F9954E] font-bold text-[14px] flex items-center justify-center gap-2 active:opacity-80 transition-opacity mb-6"
        >
          <Send className="w-4 h-4" /> 의견 남기기
        </button>
      ) : (
        <form onSubmit={submit} className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} sm:flex-1`} placeholder="닉네임" />
            <select value={type} onChange={(e) => setType(e.target.value as SuggestType)} className={`${inputClass} sm:w-40 cursor-pointer`}>
              <option>건의사항</option><option>버그 제보</option><option>기능 요청</option><option>기타</option>
            </select>
          </div>
          <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputClass} resize-none`} placeholder="자유롭게 의견을 남겨주세요." />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-zinc-800">취소</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-white bg-[#F9954E] active:opacity-85 shadow-sm">등록하기</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center mb-3">
            <MessageSquarePlus className="w-5 h-5 text-[#F9954E]" />
          </div>
          <p className="text-[13px] text-neutral-400">첫 번째 의견을 남겨보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] font-bold text-neutral-400">총 {items.length}건</p>
          {items.map((it) => (
            <div key={it.id} className="p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#FFF5EB] text-[#F9954E] dark:bg-[#F9954E]/15">{it.type}</span>
                <button onClick={() => remove(it.id)} className="p-1 text-neutral-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[13px] text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap mb-3">{it.message}</p>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-zinc-900">
                <span className="text-[11px] text-neutral-500 font-medium">{it.name}</span>
                <span className="text-[11px] text-neutral-400">{new Date(it.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
