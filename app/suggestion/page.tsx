"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { MessageSquarePlus, Send, Trash2, ChevronDown } from "lucide-react";

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

// localStorage 유틸
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

// 작성자 ID
const getAuthorId = (): string => {
    if (typeof window === "undefined") return "";
    let id = sessionStorage.getItem("dori_author_id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("dori_author_id", id); }
    return id;
};

export default function SuggestionPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [showForm, setShowForm] = useState(false);

    // 폼 상태
    const [name, setName] = useState("");
    const [type, setType] = useState<SuggestionType>("건의사항");
    const [priority, setPriority] = useState<SuggestionPriority>("보통");
    const [message, setMessage] = useState("");

    useEffect(() => {
        setMounted(true);
        setSuggestions(getSuggestions());
    }, []);

    const isDark = mounted && theme === "dark";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !message.trim()) {
            alert("이름과 내용을 입력해주세요.");
            return;
        }
        if (message.trim().length < 10) {
            alert("내용은 10자 이상 입력해주세요.");
            return;
        }

        const newItem: SuggestionItem = {
            id: crypto.randomUUID(),
            name: name.trim(),
            type,
            priority,
            message: message.trim(),
            createdAt: new Date().toISOString(),
        };

        const updated = [newItem, ...suggestions];
        setSuggestions(updated);
        saveSuggestions(updated);

        // 초기화
        setName("");
        setMessage("");
        setType("건의사항");
        setPriority("보통");
        setShowForm(false);
        alert("건의사항이 등록되었습니다. 감사합니다!");
    };

    const handleDelete = (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        const updated = suggestions.filter((s) => s.id !== id);
        setSuggestions(updated);
        saveSuggestions(updated);
    };

    const getTypeBadge = (t: SuggestionType) => {
        switch (t) {
            case "건의사항": return "bg-[#FFF5EB] text-[#E8832E] dark:bg-[#8F4B10]/20 dark:text-[#FCC07A]";
            case "버그 제보": return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300";
            case "기능 요청": return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300";
            default: return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
        }
    };

    const getPriorityDot = (p: SuggestionPriority) => {
        switch (p) {
            case "높음": return "bg-red-500";
            case "보통": return "bg-yellow-500";
            case "낮음": return "bg-green-500";
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl border outline-none transition-all bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-700 text-neutral-900 dark:text-white focus:border-[#FBAA60] dark:focus:border-[#F9954E] placeholder:text-neutral-400 text-sm";

    return (
        <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">

            {/* 배경 그라데이션 */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

            {/* 히어로 섹션 */}
            <section className="relative pt-32 pb-16 px-6 text-center z-10">
                <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
                        <MessageSquarePlus className="w-3 h-3" />
                        <span>Feedback</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            건의사항
                        </span>
                    </h1>
                    <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
                        더 나은 서비스를 위한 여러분의 소중한 의견을 들려주세요.
                    </p>
                </div>
            </section>

            {/* 글쓰기 버튼 / 폼 */}
            <section className="container max-w-2xl mx-auto px-6 relative z-10">

                {!showForm ? (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full p-5 rounded-[2rem] border border-dashed border-[#FCC07A] dark:border-[#B35E15] bg-[#FFF5EB]/50 dark:bg-orange-950/10 text-[#E8832E] dark:text-[#FBAA60] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#FEEBD0]/60 dark:hover:bg-orange-950/20 transition-all duration-200 mb-8"
                    >
                        <Send className="w-4 h-4" />
                        건의사항 작성하기
                    </button>
                ) : (
                    <div className="p-6 md:p-8 rounded-[2rem] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-neutral-200 dark:border-zinc-800 shadow-xl shadow-[#F9954E]/5 mb-8">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                            <Send className="w-4 h-4 text-[#F9954E]" />
                            건의사항 작성
                        </h3>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* 이름 */}
                            <div>
                                <label className="block text-xs font-bold mb-2 text-neutral-500 dark:text-neutral-400">이름 *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={inputClass}
                                    placeholder="닉네임 또는 이름"
                                />
                            </div>

                            {/* 유형 & 우선순위 */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold mb-2 text-neutral-500 dark:text-neutral-400">유형 *</label>
                                    <div className="relative">
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value as SuggestionType)}
                                            className={`${inputClass} cursor-pointer appearance-none pr-10`}
                                        >
                                            <option>건의사항</option>
                                            <option>버그 제보</option>
                                            <option>기능 요청</option>
                                            <option>기타</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold mb-2 text-neutral-500 dark:text-neutral-400">우선순위</label>
                                    <div className="relative">
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as SuggestionPriority)}
                                            className={`${inputClass} cursor-pointer appearance-none pr-10`}
                                        >
                                            <option>낮음</option>
                                            <option>보통</option>
                                            <option>높음</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* 내용 */}
                            <div>
                                <label className="block text-xs font-bold mb-2 text-neutral-500 dark:text-neutral-400">내용 * (10자 이상)</label>
                                <textarea
                                    rows={5}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className={`${inputClass} resize-none`}
                                    placeholder="자유롭게 의견을 남겨주세요."
                                />
                                <p className="text-xs text-neutral-400 mt-1 text-right">{message.length}자</p>
                            </div>

                            {/* 버튼 */}
                            <div className="flex gap-3 justify-end pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-500 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#F9954E] to-[#E8832E] hover:from-[#E8832E] hover:to-[#D4711A] shadow-lg shadow-[#F9954E]/20 transition-all duration-200 hover:shadow-[#F9954E]/30"
                                >
                                    등록하기
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </section>

            {/* 건의사항 목록 */}
            <section className="container max-w-2xl mx-auto px-6 pb-24 relative z-10">
                {suggestions.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center mb-5 text-[#F9954E]">
                            <MessageSquarePlus className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-neutral-900 dark:text-white">아직 건의사항이 없습니다</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                            첫 번째 건의사항을 작성해보세요!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-2">
                            총 {suggestions.length}건의 건의사항
                        </p>
                        {suggestions.map((item) => (
                            <div
                                key={item.id}
                                className="p-5 md:p-6 rounded-[1.5rem] border border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm hover:shadow-md hover:shadow-[#F9954E]/5 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                {/* 상단: 뱃지 + 삭제 */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${getTypeBadge(item.type)}`}>
                                            {item.type}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                                            <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(item.priority)}`} />
                                            {item.priority}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 rounded-lg text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* 내용 */}
                                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap mb-4">
                                    {item.message}
                                </p>

                                {/* 하단: 작성자 + 날짜 */}
                                <div className="flex items-center justify-between pt-3 border-t border-dashed border-neutral-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-[#FEEBD0] dark:bg-[#F9954E]/20 flex items-center justify-center text-[10px] font-bold text-[#E8832E] dark:text-[#FBAA60]">
                                            {item.name[0]}
                                        </div>
                                        <span className="text-xs text-neutral-500 font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-[11px] text-neutral-400">
                                        {new Date(item.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 스타일 */}
            <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
        </main>
    );
}
