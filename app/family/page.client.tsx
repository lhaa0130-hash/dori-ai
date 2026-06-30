"use client";

// 가족기록 — DORI-AI 2nd 프로젝트
// 디자인: /illo, /flat-form 등 DORI 전역 톤과 통일 (orange #F9954E + cream #FFF5EB)

import Link from "next/link";
import {
  Heart,
  Sparkles,
  Calendar,
  Camera,
  BookHeart,
  ClipboardList,
  Bell,
  Star,
  ArrowRight,
  ExternalLink,
  Check,
  Lightbulb,
  Users,
  ShieldCheck,
  MessageCircle,
  Lock,
  CalendarCheck,
} from "lucide-react";

// 지금 바로 쓸 수 있는 기능 (구현 완료)
const NOW = [
  {
    icon: Calendar,
    title: "가족 공유 캘린더",
    desc: "학교 행사·병원 예약·여행 일정까지 온 가족이 한 달력에서 확인해요. 2026 ~ 2040 범위 지원.",
    bullets: ["월/일별 보기", "Google·Naver·Apple 캘린더 호환", ".ics 내보내기"],
  },
  {
    icon: MessageCircle,
    title: "가족 단톡방",
    desc: "카카오톡 스타일의 가족 전용 채팅방. 사진·이모지 반응·핀 고정·검색까지.",
    bullets: ["실시간 메시지", "이미지 전송", "이모지 반응 + 핀 고정"],
  },
  {
    icon: BookHeart,
    title: "우리 가족 책장",
    desc: "아이가 읽은 책을 표지와 함께 기록해요. Google Books API로 표지 자동.",
    bullets: ["책 검색·표지 자동", "별점·한줄평", "가족 멤버별 통계"],
  },
  {
    icon: ClipboardList,
    title: "장보기·식단·복용약",
    desc: "장보기 리스트·오늘 식단·약 챙김까지 가족 모두가 함께 체크하는 살림 도구.",
    bullets: ["체크리스트", "오늘 식단", "복약 알림"],
  },
];

// 안드로이드 홈화면 같은 위젯 카탈로그
const WIDGETS = [
  { emoji: "🗓️", title: "통합 캘린더" },
  { emoji: "🎂", title: "생일 D-day" },
  { emoji: "🛒", title: "장보기" },
  { emoji: "🍱", title: "오늘 식단" },
  { emoji: "💊", title: "복용약 체크" },
  { emoji: "📝", title: "최근 게시글" },
  { emoji: "💕", title: "감사·칭찬" },
  { emoji: "🎁", title: "위시리스트" },
  { emoji: "🎯", title: "가족 목표" },
  { emoji: "👨‍👩‍👧", title: "가족 멤버" },
  { emoji: "💰", title: "가계부" },
  { emoji: "🏦", title: "총 자산" },
  { emoji: "🕐", title: "시계" },
  { emoji: "💬", title: "오늘의 한마디" },
  { emoji: "🌟", title: "오늘의 다짐" },
  { emoji: "✅", title: "오늘 체크" },
  { emoji: "📌", title: "메모지" },
  { emoji: "⏳", title: "D-day 카운터" },
  { emoji: "📋", title: "우리집 규칙" },
  { emoji: "🎵", title: "플레이리스트" },
  { emoji: "🎬", title: "함께 볼 거리" },
  { emoji: "✈️", title: "여행 버킷" },
  { emoji: "📞", title: "자주 거는 곳" },
  { emoji: "🚨", title: "긴급 연락" },
  { emoji: "📰", title: "최근 활동" },
  { emoji: "📚", title: "최근 읽은 책" },
];

// 가족 구성원별 활용
const ROLES = [
  { emoji: "👴", role: "할아버지·할머니", desc: "손주 사진을 매일 받아볼 수 있어요" },
  { emoji: "👨", role: "아빠·엄마", desc: "아이들 일정·건강·기록을 한눈에" },
  { emoji: "🧒", role: "자녀", desc: "학교 숙제·준비물을 가족과 공유" },
  { emoji: "👶", role: "영유아", desc: "예방접종·성장 기록을 부모가 관리" },
];

// 외부 앱 호환 (DORI 사이트와 동일한 강조)
const INTEGRATIONS = [
  { emoji: "💳", label: "토스", desc: "송금·정산·결제 딥링크" },
  { emoji: "💬", label: "카카오톡", desc: "Kakao Link 풍성 카드 공유" },
  { emoji: "📅", label: "Google 캘린더", desc: "일정 자동 추가" },
  { emoji: "🗺️", label: "카카오맵·네이버맵", desc: "위치 바로 열기" },
  { emoji: "📞", label: "전화·문자", desc: "긴급 연락망 원터치" },
  { emoji: "📤", label: ".ics 캘린더", desc: "Apple·Outlook 호환" },
];

// 시작 가이드 단계
const GUIDE = [
  { t: "앱 열기 — 설치 없음", d: "브라우저에서 family-94b12.web.app 열기. PWA로 홈화면에도 추가할 수 있어요." },
  { t: "가족 만들기 — 30초", d: "이름만 적으면 6자 가입 코드가 발급돼요. 다른 가족에게 코드 알려주거나 QR로 공유하면 끝." },
  { t: "위젯으로 내 홈 꾸미기", d: "10×10 그리드에 원하는 위젯만 드래그해서 배치. 안드로이드 홈화면처럼 자유롭게요." },
  { t: "권한·보안", d: "Firestore 규칙으로 가족 멤버만 데이터에 접근. 위젯별로 누가 볼지도 따로 설정할 수 있어요." },
];

export default function FamilyPageClient() {
  return (
    <main className="w-full min-h-screen">
      <div className="max-w-5xl mx-auto pt-8 pb-12 sm:pb-24">

        {/* ── 히어로 ── */}
        <section className="pb-8 border-b border-neutral-100 dark:border-zinc-900 mb-8 px-4 sm:px-0">
          <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">2nd Project · 가족 플랫폼</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F9954E] to-[#FE6E00] flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-[#F9954E]/20">
              💝
            </div>
            <h1 className="text-[30px] sm:text-[40px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight break-keep">
              가족기록
            </h1>
          </div>
          <p className="text-[14px] text-neutral-400 dark:text-neutral-500 leading-relaxed break-keep mb-5">
            일정·사진·건강·살림·채팅까지 — 가족 모두가 함께 쓰는 디지털 가족 공간이에요.<br />
            안드로이드 홈화면처럼 원하는 위젯만 직접 배치하고, 가족별 권한도 세팅할 수 있어요.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="https://family-94b12.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F9954E]/10 text-[#F9954E] text-[13px] font-extrabold transition-colors hover:bg-[#F9954E]/20"
            >
              앱 바로 열기 <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">서비스 운영 중</span>
            </div>
          </div>
        </section>

        {/* ── 지금 사용 가능한 기능 ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="mb-9">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-4">
              <Sparkles className="w-3 h-3" /> 지금 바로 사용 가능
            </div>
            <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 dark:text-white mb-2 break-keep leading-snug">
              현재 구현된 기능
            </h2>
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400 break-keep">
              가족기록 앱에서 지금 바로 써볼 수 있는 기능들이에요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {NOW.map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-7 hover:border-[#F9954E] dark:hover:border-[#F9954E] transition-colors"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 flex items-center justify-center shrink-0">
                    <f.icon className="w-6 h-6 text-[#F9954E]" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-snug break-keep">
                    {f.title}
                  </h3>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep mb-4">
                  {f.desc}
                </p>
                <ul className="space-y-2">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <Check className="w-3.5 h-3.5 text-[#F9954E] flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── 왜 만들었나 ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="rounded-[28px] border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
              <Lightbulb className="w-3 h-3" /> 왜 만들었나
            </div>
            <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 dark:text-white mb-6 break-keep leading-snug">
              “가족 정보가 카카오·네이버·메모장에 다 흩어져 있어요.”
            </h2>
            <div className="space-y-4 text-[15px] md:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep max-w-2xl">
              <p>
                가족 사진은 카톡에, 일정은 <b className="text-neutral-900 dark:text-white">네이버 캘린더</b>에, 약 챙김은 메모장에, 살림 비밀번호는 누가 어디 적었는지 모르고…
                정작 가족이 함께 보고 싶은 건 한 곳에 모이지 않아요.
              </p>
              <p>
                <b className="text-neutral-900 dark:text-white">가족기록</b>은 이 모든 것을 가족 단위로 묶어요. 일정·사진·메시지·살림·기록까지 한 앱 안에서 공유하고,
                필요하면 토스·카카오톡·구글 캘린더와도 자연스럽게 연결됩니다.
              </p>
              <p>
                중요한 건 <b className="text-[#E8832E] dark:text-[#FBAA60]">강제하지 않는 것</b>이에요. 안드로이드 홈화면처럼 위젯만 원하는 만큼 골라서 쓰고,
                할머니부터 영유아 부모까지 각자 다른 모습으로 같은 가족을 기록합니다.
              </p>
            </div>
          </div>
        </section>

        {/* ── 위젯 카탈로그 ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-4">
              <Sparkles className="w-3 h-3" /> 26종 위젯
            </div>
            <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 dark:text-white mb-3 break-keep leading-snug">
              안드로이드 홈화면처럼,<br className="hidden md:block" />
              내가 원하는 것만 골라서
            </h2>
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400 break-keep">
              10×10 그리드에 위젯을 끌어다 놓으면 끝. 좌→우 스와이프로 페이지 추가.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {WIDGETS.map((w) => (
              <div
                key={w.title}
                className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-3 text-center hover:border-[#F9954E] hover:-translate-y-0.5 transition-all"
              >
                <div className="text-2xl mb-1.5">{w.emoji}</div>
                <p className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight break-keep">
                  {w.title}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 외부 앱 호환 ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="rounded-[28px] bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 p-8 md:p-10">
            <div className="text-center mb-9">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-4">
                <ExternalLink className="w-3 h-3" /> 외부 앱 호환
              </div>
              <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 dark:text-white mb-3 break-keep leading-snug">
                다른 앱이랑 자연스럽게 연결돼요
              </h2>
              <p className="text-[14px] text-neutral-500 dark:text-neutral-400 break-keep">
                토스로 가족 정산, 카톡으로 일정 공유, 구글·Apple 캘린더로 동기화까지.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {INTEGRATIONS.map((i) => (
                <div
                  key={i.label}
                  className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-3 hover:border-[#F9954E] transition-colors"
                >
                  <div className="text-2xl shrink-0">{i.emoji}</div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-0.5 break-keep">
                      {i.label}
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug break-keep">
                      {i.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 누가 사용하나요 ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="mb-9 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-4">
              <Users className="w-3 h-3" /> 3세대 가족 모두
            </div>
            <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 dark:text-white mb-3 break-keep leading-snug">
              누가 사용하나요?
            </h2>
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400 break-keep">
              할아버지·할머니부터 영유아 부모까지, 한 가족 안의 모두를 위해 설계해요.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ROLES.map((r) => (
              <div
                key={r.role}
                className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-5 text-center hover:border-[#F9954E] transition-colors"
              >
                <div className="text-4xl mb-3">{r.emoji}</div>
                <div className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] mb-2 inline-block">
                  {r.role}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug break-keep">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 시작 가이드 ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="rounded-[28px] bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 p-8 md:p-10">
            <div className="text-center mb-9">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-4">
                <Sparkles className="w-3 h-3" /> 처음이세요?
              </div>
              <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 dark:text-white mb-3 break-keep leading-snug">
                30초면 가족 만들기 끝
              </h2>
              <p className="text-[14px] text-neutral-500 dark:text-neutral-400 break-keep">
                설치도 회원가입도 없어요. 순서대로 따라 하면 됩니다.
              </p>
            </div>
            <ol className="max-w-2xl mx-auto space-y-5">
              {GUIDE.map((g, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-none w-8 h-8 rounded-full bg-[#F9954E] text-white text-sm font-extrabold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1 break-keep">
                      {g.t}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed break-keep">
                      {g.d}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="text-center mt-9">
              <Link
                href="https://family-94b12.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-sm shadow-lg shadow-[#F9954E]/25 transition-all hover:-translate-y-0.5"
              >
                <ExternalLink className="w-4 h-4" /> 지금 바로 따라 해보기
              </Link>
            </div>
          </div>
        </section>

        {/* ── 보안 ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="flex flex-col md:flex-row items-center gap-8 rounded-[28px] bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-8 md:p-10">
            <div className="flex-none w-16 h-16 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-[#F9954E]" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">가족 데이터는 그 가족만</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
                Firestore 보안 규칙으로 인증된 가족 멤버만 read/write 가능합니다. 위젯별로 누가 볼 수 있을지도 따로 설정할 수 있고,
                가입 코드는 brute-force 시도 시 자동으로 잠겨요. 사진·채팅·비밀번호 모두 가족 안에서만 흐릅니다.
              </p>
            </div>
          </div>
        </section>

        {/* ── AI 기능 (다크 카드) ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="rounded-[28px] bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-zinc-800 dark:to-zinc-900 p-8 md:p-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-[#F9954E] fill-[#F9954E]" />
              <span className="text-xs font-bold text-[#FBAA60] uppercase tracking-wider">AI Features · 업데이트 예정</span>
            </div>
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white mb-3 break-keep leading-snug">
              AI가 도와주는 가족 기록
            </h2>
            <p className="text-sm text-neutral-400 mb-8 break-keep">
              DORI-AI 본진 기술을 가족 단위로 가져와요. 빠르게 추가되고 있어요.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { emoji: "🤖", title: "이번 달 우리 가족", desc: "사진·기록·일정을 모아 한 달 리포트를 자동 생성합니다." },
                { emoji: "💊", title: "복약 스마트 알림", desc: "구성원별 복약 패턴 학습 → 잊을 만한 시점에 자동 알림." },
                { emoji: "📊", title: "아이 성장 차트", desc: "키·몸무게·발달을 시각화하고 또래 평균과 비교해 보여드려요." },
              ].map((a) => (
                <div key={a.title} className="bg-white/10 rounded-2xl p-5">
                  <div className="text-3xl mb-3">{a.emoji}</div>
                  <h3 className="text-sm font-bold text-white mb-2 break-keep">{a.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed break-keep">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 곧 추가될 기능 ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="mb-9">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-4">
              <CalendarCheck className="w-3 h-3" /> 다음 업데이트
            </div>
            <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 dark:text-white mb-2 break-keep leading-snug">
              곧 추가될 기능
            </h2>
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400 break-keep">
              빠르게 만들어가는 중이에요. 매주 새로운 기능이 추가됩니다.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Camera, title: "추억 앨범", desc: "여행·생일·일상 사진을 가족 앨범으로 묶어 함께 공유" },
              { icon: Bell, title: "푸시 알림", desc: "FCM 기반 — 새 메시지·일정·기념일을 OS 알림으로" },
              { icon: ClipboardList, title: "건강 기록 공유", desc: "복약 일정·병원 기록·알레르기 정보를 가족 멤버별로" },
              { icon: Heart, title: "추억 타임라인", desc: "가족 멤버별로 사진·일기·이벤트를 시간순 타임라인으로" },
              { icon: Lock, title: "카카오·구글 로그인", desc: "익명 → 영구 계정 전환, 기기 바뀌어도 가족 그대로" },
              { icon: Sparkles, title: "DORI-AI 도구 연동", desc: "워크일로·인사이트와 연결해 가족 콘텐츠 자동 생성" },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-[#F9954E] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF5EB] dark:bg-orange-950/30 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-[#F9954E]" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 leading-snug break-keep">
                  {f.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 최종 CTA ── */}
        <section className="mt-16 sm:mt-24 px-4 sm:px-0">
          <div className="rounded-[28px] bg-gradient-to-br from-[#FFF5EB] to-[#FEEBD0] dark:from-zinc-900 dark:to-zinc-900/40 border border-[#FDD5A5] dark:border-zinc-800 p-10 text-center">
            <div className="text-5xl mb-4">💝</div>
            <h2 className="text-2xl md:text-[28px] font-extrabold text-neutral-900 dark:text-white mb-3 break-keep leading-snug">
              지금 바로 시작해보세요
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 break-keep text-[15px]">
              설치도, 결제도, 회원가입도 필요 없어요.<br className="hidden md:block" />
              브라우저만 있으면 30초 뒤에 우리 가족 첫 기록을 남길 수 있습니다.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="https://family-94b12.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-base shadow-lg shadow-[#F9954E]/25 transition-all hover:-translate-y-0.5"
              >
                <ExternalLink className="w-5 h-5" /> 가족기록 앱 열기
              </Link>
              <Link
                href="/illo"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E8832E] dark:text-[#FBAA60] hover:gap-3 transition-all"
              >
                다른 DORI-AI 프로젝트 보기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
