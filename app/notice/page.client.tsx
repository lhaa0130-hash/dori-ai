"use client";

import { Pin, Clock, Tag } from "lucide-react";

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
        id: 7,
        type: "업데이트",
        version: "v4.0.0",
        title: "소셜 기능 출시 · 미니게임 대개편 · 브랜드 정리",
        content: "안녕하세요, dori-ai.com을 만드는 illo입니다.\n친구와 함께 즐기는 소셜 기능과 미니게임 대개편이 적용된 v4.0 업데이트를 안내드립니다.\n\n🪐 1. 소셜 / 나만의 공간\n• 코지홈 — 프로필을 꾸미고(상태·소개·대표색·배경·프로필 사진), 전적·뱃지·방문자수(투데이/투탈)·방명록을 한곳에.\n• 친구 — 친구 추가/수락, 친구를 '범위(그룹)'로 묶고 그룹별로 피드 공개 여부 설정.\n• 메시지 — 회원끼리 1:1 실시간 DM.\n• 피드 — 글·이미지·영상을 올리고, 공개 범위(전체/친구/그룹)를 골라 공유 + 좋아요·댓글.\n• 알림 — 친구요청·좋아요·댓글·방명록·메시지를 마이페이지에서 모아보기.\n\n🎮 2. 미니게임 대개편\n• 전 게임을 통일된 프리미엄 디자인으로 다듬고, 점수 연출·효과를 더했어요.\n• 명예의 전당(TOP 5) 랭킹 도입 — 로그인하면 게임마다 기록이 남아요.\n• 신규 게임 추가: 반응속도·두더지 잡기·순서 기억·빠른 계산·과녁 클릭·플래피 도리.\n• 동물 합치기 조작·판정 개선, 플래피 난이도 완화, 각 게임에 건의/버그 제보 버튼 추가.\n\n🏷️ 3. 브랜드 · 회원\n• 제작사 브랜드를 'illo'로 정리했어요. 프로젝트 '일로'는 '워키(Worki)'로 이름이 바뀌었습니다.\n• 회원 정보에 등급(티어)과 레벨을 함께 표시합니다.\n\n🔧 4. 편의 개선\n• 로그인 유지 시간 연장, 헤더·푸터 정리, 인사이트 좋아요 오류 수정 등.\n\n더 재미있고 편한 dori-ai.com이 되도록 계속 다듬겠습니다. 감사합니다!",
        date: "2026-06-12",
        pinned: true,
    },
    {
        id: 6,
        type: "업데이트",
        version: "v3.0.0",
        title: "대규모 리뉴얼: 커뮤니티·프로젝트·미니게임 보상 업데이트",
        content: "안녕하세요, DORI-AI 팀입니다.\n사이트 전반을 다듬은 대규모 리뉴얼(v3.0)이 적용되었습니다.\n\n💬 1. 커뮤니티 새단장\n• 피드형 레이아웃으로 전면 개편해 글을 더 편하게 둘러볼 수 있어요.\n• 좋아요·응원·인사이트·웃음 등 다양한 감정 반응을 남길 수 있습니다.\n• 토픽(주제) 태그로 관심 있는 글만 골라보세요.\n\n🚀 2. 프로젝트 상세 페이지 신설\n• 개발 중인 3가지 프로그램(워키·동물도감·가족기록)을 한눈에 볼 수 있어요.\n• 각 프로그램을 누르면 상세 소개와 함께 건의사항을 바로 남길 수 있습니다.\n\n🍭 3. 미니게임 플레이 보상 추가\n• 동물 합치기·2048·보스 클리커를 1분 이상 플레이하면 솜사탕 50개를 드려요. (하루 1회)\n• 동물 합치기 게임의 조작감과 그래픽을 더 부드럽게 다듬었습니다.\n\n🤖 4. AI 도구 페이지 프리미엄 개편\n• 카테고리별 TOP5 카드를 더 깔끔하게 정리하고, 'API 연결'과 '사이트 방문' 버튼을 분리했습니다.\n\n⚡ 5. 메인 페이지 & 속도 개선\n• 첫 화면 문구와 디자인을 새로 다듬고, 간헐적으로 화면이 늦게 뜨던 문제를 해결했습니다.\n\n🔎 6. 검색 최적화(SEO)\n• 중복 콘텐츠를 정리하고 검색엔진 노출 구조를 개선했습니다.\n\n언제나 더 나은 서비스로 보답하겠습니다. 감사합니다!",
        date: "2026-06-09",
        pinned: false,
    },
    {
        id: 5,
        type: "업데이트",
        version: "v2.0.0",
        title: "대규모 업데이트: 오렌지 테마 및 자동화 시스템 도입",
        content: "안녕하세요, DORI-AI 팀입니다.\n사용자 경험 향상을 위한 대규모 업데이트(v2.0)가 적용되었습니다.\n\n🍊 1. 디자인 리뉴얼 (Orange Theme)\n• 사이트 전반의 메인 컬러가 따뜻하고 활기찬 오렌지(#F9954E)로 변경되었습니다.\n• Hero 섹션, 프로필, 미니게임 등 모든 페이지에 일관된 디자인 시스템이 적용되었습니다.\n• 다크 모드에서도 눈이 편안하도록 최적화되었습니다.\n\n🤖 2. 자동화 시스템 (n8n & AI)\n• 글로벌 IT 뉴스를 수집하고 분석하여 자동으로 포스팅하는 시스템이 구축되었습니다.\n• 전문 블로거 페르소나를 가진 AI가 양질의 콘텐츠를 제공합니다.\n\n🃏 3. 미니게임 UI 개선\n• HighLow 및 Blackjack 게임의 인터페이스가 더욱 직관적이고 세련되게 변경되었습니다.\n\n앞으로도 더 나은 서비스를 위해 노력하겠습니다.\n감사합니다.",
        date: "2026-02-18",
        pinned: false,
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
    const getTypeBadge = (t: NoticeType) => {
        switch (t) {
            case "공지":    return "bg-[#FFF5EB] text-[#F9954E] dark:bg-[#F9954E]/10 dark:text-[#F9954E]";
            case "업데이트": return "bg-neutral-100 text-neutral-500 dark:bg-zinc-800 dark:text-neutral-400";
            case "이벤트":  return "bg-neutral-100 text-neutral-500 dark:bg-zinc-800 dark:text-neutral-400";
            case "점검":    return "bg-neutral-100 text-neutral-500 dark:bg-zinc-800 dark:text-neutral-400";
        }
    };

    const sortedNotices = [...notices].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return (
        <main className="w-full min-h-screen">

            {/* 히어로 */}
            <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
                <p className="text-[12px] font-semibold text-[#F9954E] mb-3">공지사항</p>
                <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
                    공지사항
                </h1>
                <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
                    DORI-AI의 최신 소식과 버전 업데이트를 확인하세요.
                </p>
            </section>

            {/* 공지사항 목록 */}
            <section className="py-6 pb-20">
                <p className="text-[12px] font-medium text-neutral-400 mb-4">
                    총 {notices.length}건의 공지사항
                </p>

                <div className="space-y-3">
                    {sortedNotices.map((item) => (
                        <details
                            key={item.id}
                            className={`group rounded-2xl border overflow-hidden transition-colors ${
                                item.pinned
                                    ? "border-[#F9954E]/30 bg-[#FFF5EB]/40 dark:bg-[#F9954E]/5 dark:border-[#F9954E]/20"
                                    : "border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950"
                            }`}
                        >
                            <summary className="cursor-pointer list-none p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {item.pinned && (
                                                <Pin className="w-3 h-3 text-[#F9954E] flex-shrink-0" />
                                            )}
                                            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${getTypeBadge(item.type)}`}>
                                                {item.type}
                                            </span>
                                            {item.version && (
                                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 flex items-center gap-1">
                                                    <Tag className="w-2.5 h-2.5" />
                                                    {item.version}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-[15px] text-neutral-900 dark:text-white leading-snug">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-2 text-[12px] text-neutral-400">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(item.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</span>
                                        </div>
                                    </div>
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-[#F9954E] text-sm font-semibold mt-1 transition-transform duration-200 group-open:rotate-45">
                                        +
                                    </span>
                                </div>
                            </summary>
                            <div className="px-5 pb-5">
                                <div className="pt-4 border-t border-neutral-100 dark:border-zinc-800">
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

            <style jsx global>{`
                details summary::-webkit-details-marker { display: none; }
            `}</style>
        </main>
    );
}
