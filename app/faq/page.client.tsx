"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";

export default function FAQClient() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && theme === "dark";

    const faqSections = [
        {
            category: "서비스 소개",
            items: [
                {
                    q: "DORI-AI는 무엇인가요?",
                    a: "DORI-AI는 AI 도구 정보, 인사이트, 커뮤니티, 교육 콘텐츠 등을 한곳에서 제공하는 종합 AI 플랫폼입니다. 최신 AI 트렌드를 쉽게 파악하고, 다양한 AI 도구를 비교·검색할 수 있습니다."
                },
                {
                    q: "DORI-AI는 무료인가요?",
                    a: "네, DORI-AI의 모든 기본 서비스는 무료로 제공됩니다. AI 도구 검색, 인사이트 기사 열람, 커뮤니티 참여, 미니게임 등을 자유롭게 이용하실 수 있습니다."
                },
                {
                    q: "어떤 서비스들을 제공하나요?",
                    a: "현재 다음 서비스를 제공하고 있습니다.\n\n• AI 도구 — 다양한 AI 서비스 검색, 비교, 리뷰\n• 인사이트 — AI 관련 최신 뉴스, 가이드, 분석 기사\n• 커뮤니티 — 자유 게시판, 정보 공유, 토론\n• 미니게임 — 재미있는 브라우저 기반 게임\n• 마켓 — 프롬프트, 템플릿, 워크플로우 거래 (준비 중)\n• 건의사항 — 서비스 개선을 위한 피드백 접수"
                },
            ],
        },
        {
            category: "계정 & 회원",
            items: [
                {
                    q: "회원가입은 어떻게 하나요?",
                    a: "사이트 우측 상단의 '로그인' 버튼을 클릭하여 이메일로 간편하게 가입할 수 있습니다. 소셜 로그인(Google, GitHub)도 지원 예정입니다."
                },
                {
                    q: "비회원도 서비스를 이용할 수 있나요?",
                    a: "네, 대부분의 콘텐츠(AI 도구 검색, 인사이트 기사, 미니게임)는 비회원도 이용 가능합니다. 다만, 글쓰기, 댓글, 건의사항 등 일부 기능은 로그인이 필요할 수 있습니다."
                },
                {
                    q: "회원 탈퇴는 어떻게 하나요?",
                    a: "마이페이지에서 회원 탈퇴를 진행하실 수 있습니다. 탈퇴 시 모든 개인정보는 즉시 삭제되며, 작성한 게시물은 별도 요청 시 삭제 처리됩니다."
                },
            ],
        },
        {
            category: "커뮤니티",
            items: [
                {
                    q: "커뮤니티에 글을 쓸 수 있나요?",
                    a: "네! 커뮤니티 게시판에서 자유롭게 글을 작성하실 수 있습니다. AI 관련 정보 공유, 질문, 토론 등 다양한 주제로 소통해보세요."
                },
                {
                    q: "부적절한 게시물을 발견하면 어떻게 하나요?",
                    a: "부적절한 게시물을 발견하시면 건의사항 페이지를 통해 신고해주세요. '버그 제보' 또는 '기타' 유형으로 작성하시면 빠르게 검토 후 조치하겠습니다."
                },
            ],
        },
        {
            category: "AI 도구",
            items: [
                {
                    q: "AI 도구 정보는 어떻게 수집되나요?",
                    a: "저희 팀이 직접 조사하고, 사용자 제보 및 공식 소스를 통해 최신 AI 도구 정보를 수집·업데이트하고 있습니다. 잘못된 정보가 있다면 건의사항으로 알려주세요."
                },
                {
                    q: "새로운 AI 도구를 추천하고 싶어요.",
                    a: "건의사항 페이지에서 '기능 요청' 유형으로 추천하고 싶은 AI 도구 정보를 알려주세요. 검토 후 추가하겠습니다."
                },
            ],
        },
        {
            category: "기술 & 기타",
            items: [
                {
                    q: "데이터는 어디에 저장되나요?",
                    a: "건의사항, 미니게임 점수 등 일부 데이터는 브라우저의 localStorage에 저장됩니다. 이는 사용자의 기기에만 저장되며, 서버로 전송되지 않습니다. 브라우저 데이터를 삭제하면 함께 삭제될 수 있습니다."
                },
                {
                    q: "사이트가 잘 안 보여요. (버그)",
                    a: "먼저 브라우저를 최신 버전으로 업데이트하고, 캐시를 삭제(Ctrl+Shift+R)해보세요. 문제가 지속되면 건의사항 페이지에서 '버그 제보'로 브라우저 종류, 운영체제, 화면 캡처와 함께 알려주세요."
                },
                {
                    q: "오픈소스인가요?",
                    a: "현재 DORI-AI는 오픈소스 프로젝트는 아니지만, 향후 일부 컴포넌트나 도구를 오픈소스로 공개할 계획이 있습니다."
                },
                {
                    q: "문의는 어디로 하면 되나요?",
                    a: "건의사항 페이지를 이용하시거나, lhaa0130@gmail.com으로 이메일을 보내주세요. 빠른 시일 내에 답변드리겠습니다."
                },
            ],
        },
    ];

    return (
        <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">

            {/* 배경 그라데이션 */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

            {/* 히어로 섹션 */}
            <section className="relative pt-32 pb-16 px-6 text-center z-10">
                <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
                        <HelpCircle className="w-3 h-3" />
                        <span>FAQ</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-[#F9954E] via-pink-500 to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            자주 묻는 질문
                        </span>
                    </h1>
                    <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
                        궁금한 점이 있으신가요? 아래에서 답변을 찾아보세요.
                    </p>
                </div>
            </section>

            {/* FAQ 목록 */}
            <section className="container max-w-3xl mx-auto px-6 pb-24 relative z-10">
                <div className="space-y-10">
                    {faqSections.map((section, sIdx) => (
                        <div key={sIdx}>
                            {/* 카테고리 타이틀 */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold">
                                    {section.category}
                                </span>
                                <div className="flex-1 h-px bg-neutral-200 dark:bg-zinc-800" />
                            </div>

                            {/* 질문 아코디언 */}
                            <div className="space-y-3">
                                {section.items.map((item, qIdx) => (
                                    <details
                                        key={qIdx}
                                        className="group rounded-[1.5rem] border border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-[#F9954E]/5"
                                    >
                                        <summary className="cursor-pointer list-none flex items-center justify-between gap-4 p-5 md:p-6">
                                            <span className="font-bold text-[15px] text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors duration-200">
                                                {item.q}
                                            </span>
                                            <span className="text-lg transition-all duration-300 group-open:rotate-45 flex-shrink-0 w-6 h-6 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-[#F9954E] text-sm font-light">
                                                +
                                            </span>
                                        </summary>
                                        <div
                                            className="px-5 md:px-6 pb-5 md:pb-6 text-sm text-neutral-600 dark:text-neutral-400 leading-[1.85]"
                                            style={{ whiteSpace: "pre-line" }}
                                        >
                                            {item.a}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 하단 안내 */}
                <div className="mt-16 text-center">
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-5">
                        원하는 답변을 찾지 못하셨나요?
                    </p>
                    <a
                        href="/suggestion"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#F9954E] to-pink-500 text-white text-sm font-bold shadow-lg shadow-[#F9954E]/20 hover:shadow-[#F9954E]/30 transition-all duration-200 hover:scale-[1.02]"
                    >
                        건의사항 남기기 →
                    </a>
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
