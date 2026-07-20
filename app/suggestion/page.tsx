"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, Send, Trash2, ChevronDown } from "lucide-react";
import { getFirebaseFirestore } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

type SuggestionType = "건의사항" | "버그 제보" | "기능 요청" | "기타";
type SuggestionPriority = "낮음" | "보통" | "높음";

interface SuggestionItem {
    id: string;
    name: string;
    type: SuggestionType;
    priority: SuggestionPriority;
    message: string;
    createdAt: string;
}

// 유형/우선순위는 Firestore·텔레그램 봇이 한글 값 그대로 읽으므로 저장값은 절대 바꾸지 않는다.
// 영어판에서는 '표시할 때만' 옮긴다.
const TYPE_LABEL_EN: Record<SuggestionType, string> = {
    "건의사항": "Suggestion",
    "버그 제보": "Bug report",
    "기능 요청": "Feature request",
    "기타": "Other",
};
const PRIORITY_LABEL_EN: Record<SuggestionPriority, string> = {
    "낮음": "Low",
    "보통": "Medium",
    "높음": "High",
};

const T = {
    ko: {
        eyebrow: "건의사항",
        heroTitleL1: "의견을",
        heroTitleL2: "들려주세요",
        heroSubtitle: "더 나은 서비스를 위한 여러분의 소중한 의견을 기다립니다.",
        writeButton: "건의사항 작성하기",
        formTitle: "건의사항 작성",
        nameLabel: "이름 *",
        namePlaceholder: "닉네임 또는 이름",
        typeFieldLabel: "유형 *",
        priorityFieldLabel: "우선순위",
        messageLabel: "내용 * (10자 이상)",
        messagePlaceholder: "자유롭게 의견을 남겨주세요.",
        charUnit: "자",
        cancel: "취소",
        submit: "등록하기",
        emptyTitle: "아직 건의사항이 없습니다",
        emptySubtitle: "첫 번째 건의사항을 작성해보세요!",
        totalCount: (n: number) => `총 ${n}건의 건의사항`,
        alertNameMessage: "이름과 내용을 입력해주세요.",
        alertMinLength: "내용은 10자 이상 입력해주세요.",
        alertSubmitted: "건의사항이 등록되었습니다. 감사합니다!",
        confirmDelete: "정말 삭제하시겠습니까?",
        dateLocale: "ko-KR",
    },
    en: {
        eyebrow: "Feedback",
        heroTitleL1: "Share your",
        heroTitleL2: "feedback",
        heroSubtitle: "We'd love to hear your thoughts on making the service better.",
        writeButton: "Send us a suggestion",
        formTitle: "New suggestion",
        nameLabel: "Name *",
        namePlaceholder: "Nickname or name",
        typeFieldLabel: "Type *",
        priorityFieldLabel: "Priority",
        messageLabel: "Message * (10+ characters)",
        messagePlaceholder: "Feel free to share your thoughts.",
        charUnit: " characters",
        cancel: "Cancel",
        submit: "Submit",
        emptyTitle: "No suggestions yet",
        emptySubtitle: "Be the first to leave one!",
        totalCount: (n: number) => `${n} suggestion${n === 1 ? "" : "s"} total`,
        alertNameMessage: "Please enter your name and message.",
        alertMinLength: "Message must be at least 10 characters.",
        alertSubmitted: "Thanks — we got it!",
        confirmDelete: "Delete this suggestion?",
        dateLocale: "en-US",
    },
} as const;

const getSuggestions = (): SuggestionItem[] => {
    if (typeof window === "undefined") return [];
    try {
        const saved = localStorage.getItem("dori_suggestions_v2");
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
};
const saveSuggestions = (items: SuggestionItem[]) => {
    localStorage.setItem("dori_suggestions_v2", JSON.stringify(items));
};

export default function SuggestionPage() {
    const pathname = usePathname();
    const isEn = (pathname || "").startsWith("/en");
    const t = T[isEn ? "en" : "ko"];
    const typeDisplay = (v: SuggestionType) => (isEn ? TYPE_LABEL_EN[v] : v);
    const priorityDisplay = (v: SuggestionPriority) => (isEn ? PRIORITY_LABEL_EN[v] : v);

    const [mounted, setMounted] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState("");
    const [type, setType] = useState<SuggestionType>("건의사항");
    const [priority, setPriority] = useState<SuggestionPriority>("보통");
    const [message, setMessage] = useState("");

    useEffect(() => {
        setMounted(true);
        setSuggestions(getSuggestions());
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !message.trim()) { alert(t.alertNameMessage); return; }
        if (message.trim().length < 10) { alert(t.alertMinLength); return; }

        const newItem: SuggestionItem = {
            id: crypto.randomUUID(),
            name: name.trim(), type, priority,
            message: message.trim(),
            createdAt: new Date().toISOString(),
        };
        // 서버(Firestore)에도 저장 — 운영자에게 매일 요약 전달용(실패해도 UX는 진행)
        try {
            await addDoc(collection(getFirebaseFirestore(), "suggestions"), {
                name: newItem.name, type, priority, message: newItem.message, createdAt: newItem.createdAt,
            });
        } catch (err) { console.error("suggestion firestore write failed", err); }

        const updated = [newItem, ...suggestions];
        setSuggestions(updated);
        saveSuggestions(updated);
        setName(""); setMessage(""); setType("건의사항"); setPriority("보통");
        setShowForm(false);
        alert(t.alertSubmitted);
    };

    const handleDelete = (id: string) => {
        if (!confirm(t.confirmDelete)) return;
        const updated = suggestions.filter((s) => s.id !== id);
        setSuggestions(updated); saveSuggestions(updated);
    };

    const getTypeBadge = (t: SuggestionType) => {
        switch (t) {
            case "건의사항": return "bg-[#FBEEE7] text-[#F9954E] dark:bg-[#F9954E]/15 dark:text-[#FBAA60]";
            case "버그 제보": return "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-stone-300";
            case "기능 요청": return "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-stone-300";
            default:          return "bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-stone-400";
        }
    };

    const getPriorityDot = (p: SuggestionPriority) => {
        switch (p) {
            case "높음": return "bg-[#F9954E]";
            case "보통": return "bg-stone-400";
            case "낮음": return "bg-stone-300 dark:bg-zinc-600";
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl border outline-none transition-all bg-white dark:bg-zinc-950 border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-white focus:border-[#F9954E] dark:focus:border-[#F9954E] placeholder:text-stone-400 text-sm";

    if (!mounted) return null;

    return (
        <main className="w-full min-h-screen bg-white dark:bg-black">

            {/* ── Toss 히어로 ── */}
            <section className="pt-8 pb-10 border-b border-stone-100 dark:border-zinc-900">
                <p className="text-[12px] font-semibold text-[#F9954E] mb-3">{t.eyebrow}</p>
                <h1 className="text-[36px] sm:text-[48px] font-extrabold text-stone-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
                    {t.heroTitleL1}<br />{t.heroTitleL2}
                </h1>
                <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep">
                    {t.heroSubtitle}
                </p>
            </section>

            {/* ── 글쓰기 버튼 / 폼 ── */}
            <section className="py-6">

                {!showForm ? (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full p-5 rounded-2xl border border-dashed border-[#F9954E]/40 dark:border-[#F9954E]/30 bg-[#FBEEE7]/50 dark:bg-[#F9954E]/5 text-[#F9954E] font-bold text-[14px] flex items-center justify-center gap-2 active:opacity-80 transition-opacity mb-6"
                    >
                        <Send className="w-4 h-4" />
                        {t.writeButton}
                    </button>
                ) : (
                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-stone-100 dark:border-zinc-900 mb-6">
                        <h3 className="text-[16px] font-extrabold text-stone-900 dark:text-white mb-5 flex items-center gap-2">
                            <Send className="w-4 h-4 text-[#F9954E]" />
                            {t.formTitle}
                        </h3>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* 이름 */}
                            <div>
                                <label className="block text-[11px] font-bold mb-2 text-stone-500 dark:text-stone-400">{t.nameLabel}</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder={t.namePlaceholder} />
                            </div>

                            {/* 유형 & 우선순위 */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-bold mb-2 text-stone-500 dark:text-stone-400">{t.typeFieldLabel}</label>
                                    <div className="relative">
                                        <select value={type} onChange={(e) => setType(e.target.value as SuggestionType)} className={`${inputClass} cursor-pointer appearance-none pr-10`}>
                                            <option value="건의사항">{typeDisplay("건의사항")}</option>
                                            <option value="버그 제보">{typeDisplay("버그 제보")}</option>
                                            <option value="기능 요청">{typeDisplay("기능 요청")}</option>
                                            <option value="기타">{typeDisplay("기타")}</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[11px] font-bold mb-2 text-stone-500 dark:text-stone-400">{t.priorityFieldLabel}</label>
                                    <div className="relative">
                                        <select value={priority} onChange={(e) => setPriority(e.target.value as SuggestionPriority)} className={`${inputClass} cursor-pointer appearance-none pr-10`}>
                                            <option value="낮음">{priorityDisplay("낮음")}</option>
                                            <option value="보통">{priorityDisplay("보통")}</option>
                                            <option value="높음">{priorityDisplay("높음")}</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* 내용 */}
                            <div>
                                <label className="block text-[11px] font-bold mb-2 text-stone-500 dark:text-stone-400">{t.messageLabel}</label>
                                <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputClass} resize-none`} placeholder={t.messagePlaceholder} />
                                <p className="text-[11px] text-stone-400 mt-1 text-right">{message.length}{t.charUnit}</p>
                            </div>

                            {/* 버튼 */}
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-stone-500 bg-stone-100 dark:bg-zinc-800 active:opacity-80 transition-opacity">
                                    {t.cancel}
                                </button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-white bg-[#F9954E] active:opacity-85 transition-opacity shadow-sm">
                                    {t.submit}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </section>

            {/* ── 건의사항 목록 ── */}
            <section className="pb-12">
                {suggestions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FBEEE7] dark:bg-[#F9954E]/10 flex items-center justify-center mb-4">
                            <MessageSquarePlus className="w-6 h-6 text-[#F9954E]" />
                        </div>
                        <h3 className="text-[15px] font-extrabold mb-2 text-stone-900 dark:text-white">{t.emptyTitle}</h3>
                        <p className="text-stone-500 dark:text-stone-400 text-[13px]">{t.emptySubtitle}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 mb-1">
                            {t.totalCount(suggestions.length)}
                        </p>
                        {suggestions.map((item) => (
                            <div key={item.id} className="p-5 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                                {/* 상단: 배지 + 삭제 */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${getTypeBadge(item.type)}`}>
                                            {typeDisplay(item.type)}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-stone-400">
                                            <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(item.priority)}`} />
                                            {priorityDisplay(item.priority)}
                                        </span>
                                    </div>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* 내용 */}
                                <p className="text-[13px] text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap mb-4">
                                    {item.message}
                                </p>

                                {/* 하단: 작성자 + 날짜 */}
                                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-zinc-900">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-[#FBEEE7] dark:bg-[#F9954E]/15 flex items-center justify-center text-[10px] font-bold text-[#F9954E]">
                                            {item.name[0]}
                                        </div>
                                        <span className="text-[11px] text-stone-500 font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-[11px] text-stone-400">
                                        {new Date(item.createdAt).toLocaleDateString(t.dateLocale, { year: "numeric", month: "short", day: "numeric" })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

        </main>
    );
}
