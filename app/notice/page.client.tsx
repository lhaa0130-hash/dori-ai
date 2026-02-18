"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Megaphone, Pin, Clock, Tag } from "lucide-react";

type NoticeType = "공지" | "업데이트" | "이벤트" | "점검";

interface NoticeItem {
    id: number;
    type: NoticeType;
    version?: string;
    title: string;
    content: string;
    date: string;
    pinned?: boolean;
}

const notices: NoticeItem[] = [
    {
        id: 5,
        type: "업데이트",
        version: "v2.0.0",
        title: "대규모 업데이트: 오렌지 테마 및 자동화 시스템 도입",
        content: "안녕하세요, DORI-AI 팀입니다.\n사용자 경험 향상을 위한 대규모 업데이트(v2.0)가 적용되었습니다.\n\n🍊 1. 디자인 리뉴얼 (Orange Theme)\n• 사이트 전반의 메인 컬러가 따뜻하고 활기찬 오렌지(#F9954E)로 변경되었습니다.\n• Hero 섹션, 프로필, 미니게임 등 모든 페이지에 일관된 디자인 시스템이 적용되었습니다.\n• 다크 모드에서도 눈이 편안하도록 최적화되었습니다.\n\n🤖 2. 자동화 시스템 (n8n & AI)\n• 글로벌 IT 뉴스를 수집하고 분석하여 자동으로 포스팅하는 시스템이 구축되었습니다.\n• 전문 블로거 페르소나를 가진 AI가 양질의 콘텐츠를 제공합니다.\n\n🃏 3. 미니게임 UI 개선\n• HighLow 및 Blackjack 게임의 인터페이스가 더욱 직관적이고 세련되게 변경되었습니다.\n\n앞으로도 더 나은 서비스를 위해 노력하겠습니다.\n감사합니다.",
        date: "2026-02-18",
        pinned: true,
    },
    {
        id: 4,
        type: "업데이트",
        version: "v1.1.0",
        title: "기능 추가: 건의사항 글쓰기 및 FAQ 오픈",
        content: "서비스 안정화 및 기능 추가 업데이트가 진행되었습니다.\n\n• 건의사항: 글쓰기 기능 추가 (사용자 피드백 수렴 강화)\n• FAQ & 공지사항: 신규 페이지 오픈\n• 이용약관: 개인정보처리방침 및 서비스 약관 개정\n\n지속적인 사용성 개선을 위해 노력하겠습니다.",
        date: "2026-02-16",
        pinned: false,
    },
    {
        id: 1,
        type: "공지",
        version: "v1.0.0",
        title: "DORI-AI 서비스 정식 오픈 안내",
        content: "안녕하세요! DORI-AI가 정식 오픈했습니다. 🎉\n\nDORI-AI는 최신 AI 도구 정보, 인사이트, 커뮤니티, 교육 콘텐츠를 한곳에서 제공하는 종합 AI 플랫폼입니다.\n\n현재 제공되는 서비스 (v1.0):\n• AI 도구 검색 및 비교\n• AI 인사이트 기사\n• 커뮤니티 게시판\n• 미니게임 (베타)\n\n앞으로도 지속적으로 새로운 기능과 콘텐츠를 추가할 예정입니다. 많은 관심과 피드백 부탁드립니다!",
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
            case "공지": return "bg-[#FFF5EB] text-[#E8832E] dark:bg-[#8F4B10]/20 dark:text-[#FCC07A]";
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
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

            {/* 히어로 섹션 */}
            <section className="relative pt-32 pb-16 px-6 text-center z-10">
                <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
                        <Megaphone className="w-3 h-3" />
                        <span>Notice</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            공지사항
                        </span>
                    </h1>
                    <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
                        DORI-AI의 최신 소식과 버전 업데이트를 확인하세요.
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
                                ? "border-[#FCC07A] dark:border-[#B35E15] bg-[#FFF5EB]/30 dark:bg-orange-950/10 hover:shadow-[#F9954E]/10"
                                : "border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 hover:shadow-[#F9954E]/5"
                                }`}
                        >
                            <summary className="cursor-pointer list-none p-5 md:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2.5">
                                            {item.pinned && (
                                                <Pin className="w-3 h-3 text-[#F9954E] flex-shrink-0" />
                                            )}
                                            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${getTypeBadge(item.type)}`}>
                                                {item.type}
                                            </span>
                                            {item.version && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center gap-1">
                                                    <Tag className="w-2.5 h-2.5" />
                                                    {item.version}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-[15px] text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors duration-200 leading-snug">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-2 text-[12px] text-neutral-400">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(item.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</span>
                                        </div>
                                    </div>
                                    <span className="text-lg transition-all duration-300 group-open:rotate-45 flex-shrink-0 w-6 h-6 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-[#F9954E] text-sm font-light mt-1">
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
