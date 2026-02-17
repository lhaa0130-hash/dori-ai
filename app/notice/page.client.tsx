"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Megaphone, Pin, Clock } from "lucide-react";

type NoticeType = "공지" | "업데이트" | "이벤트" | "점검";

interface NoticeItem {
    id: number;
    type: NoticeType;
    title: string;
    content: string;
    date: string;
    pinned?: boolean;
}

const notices: NoticeItem[] = [
    {
        id: 1,
        type: "공지",
        title: "DORI-AI 서비스 오픈 안내",
        content: "안녕하세요! DORI-AI가 정식 오픈했습니다. 🎉\n\nDORI-AI는 최신 AI 도구 정보, 인사이트, 커뮤니티, 교육 콘텐츠를 한곳에서 제공하는 종합 AI 플랫폼입니다.\n\n현재 제공되는 서비스:\n• AI 도구 검색 및 비교\n• AI 인사이트 기사\n• 커뮤니티 게시판\n• 미니게임\n• 건의사항\n\n앞으로도 지속적으로 새로운 기능과 콘텐츠를 추가할 예정입니다. 많은 관심과 피드백 부탁드립니다!",
        date: "2026-02-16",
        pinned: true,
    },
    {
        id: 2,
        type: "업데이트",
        title: "건의사항 페이지 글쓰기 기능 추가",
        content: "건의사항 페이지에 글쓰기 기능이 추가되었습니다.\n\n주요 변경 사항:\n• 건의사항 작성 폼 (이름, 유형, 우선순위, 내용)\n• 작성한 건의사항 목록 표시\n• 삭제 기능\n\n여러분의 소중한 의견을 기다립니다. 자유롭게 건의사항을 남겨주세요!",
        date: "2026-02-16",
        pinned: false,
    },
    {
        id: 3,
        type: "업데이트",
        title: "개인정보처리방침 및 이용약관 업데이트",
        content: "개인정보처리방침과 이용약관이 업데이트되었습니다.\n\n• 개인정보처리방침: 12개 조항으로 한국 개인정보보호법 기준을 충족하도록 보강\n• 이용약관: 17개 조항으로 전자상거래법 등 관련법 기준 반영\n\n자세한 내용은 각 페이지에서 확인하실 수 있습니다.",
        date: "2026-02-16",
        pinned: false,
    },
    {
        id: 4,
        type: "공지",
        title: "FAQ 페이지 및 공지사항 페이지 오픈",
        content: "자주 묻는 질문(FAQ) 페이지와 공지사항 페이지가 새롭게 오픈되었습니다.\n\n• FAQ: 서비스 이용 관련 자주 묻는 질문과 답변\n• 공지사항: 서비스 업데이트, 이벤트, 점검 안내\n\n궁금한 점은 FAQ에서 먼저 확인해보시고, 찾지 못한 내용은 건의사항으로 문의해주세요!",
        date: "2026-02-16",
        pinned: false,
    },
];

export default function NoticeClient() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && theme === "dark";

    const getTypeBadge = (t: NoticeType) => {
        switch (t) {
            case "공지": return "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300";
            case "업데이트": return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300";
            case "이벤트": return "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300";
            case "점검": return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300";
        }
    };

    // 고정 공지 먼저, 그 다음 날짜 순
    const sortedNotices = [...notices].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return (
        <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">

            {/* 배경 그라데이션 */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:from-orange-900/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

            {/* 히어로 섹션 */}
            <section className="relative pt-32 pb-16 px-6 text-center z-10">
                <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
                        <Megaphone className="w-3 h-3" />
                        <span>Notice</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            공지사항
                        </span>
                    </h1>
                    <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
                        DORI-AI의 최신 소식과 업데이트를 확인하세요.
                    </p>
                </div>
            </section>

            {/* 공지사항 목록 */}
            <section className="container max-w-3xl mx-auto px-6 pb-24 relative z-10">
                <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 mb-4">
                    총 {notices.length}건의 공지사항
                </p>

                <div className="space-y-4">
                    {sortedNotices.map((item) => (
                        <details
                            key={item.id}
                            className={`group rounded-[1.5rem] border overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-xl shadow-sm ${item.pinned
                                    ? "border-orange-300 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10 hover:shadow-orange-500/10"
                                    : "border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 hover:shadow-orange-500/5"
                                }`}
                        >
                            <summary className="cursor-pointer list-none p-5 md:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2.5">
                                            {item.pinned && (
                                                <Pin className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                            )}
                                            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${getTypeBadge(item.type)}`}>
                                                {item.type}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-[15px] text-neutral-900 dark:text-white group-hover:text-orange-500 transition-colors duration-200 leading-snug">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-2 text-[12px] text-neutral-400">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(item.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</span>
                                        </div>
                                    </div>
                                    <span className="text-lg transition-all duration-300 group-open:rotate-45 flex-shrink-0 w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 text-sm font-light mt-1">
                                        +
                                    </span>
                                </div>
                            </summary>
                            <div className="px-5 md:px-6 pb-5 md:pb-6">
                                <div className="pt-4 border-t border-dashed border-neutral-200 dark:border-zinc-800">
                                    <p
                                        className="text-sm text-neutral-600 dark:text-neutral-400 leading-[1.85]"
                                        style={{ whiteSpace: "pre-line" }}
                                    >
                                        {item.content}
                                    </p>
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
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
        details summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
        </main>
    );
}
