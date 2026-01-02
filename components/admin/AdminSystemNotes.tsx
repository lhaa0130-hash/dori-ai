"use client";

import { TEXTS } from "@/constants/texts";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function AdminSystemNotes() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = TEXTS.admin.sections;

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  const cardStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    color: isDark ? '#ffffff' : '#1d1d1f',
  };

  const notes = [
    {
      icon: "🚫",
      title: "욕설 필터링 시스템",
      content: "현재 클라이언트 단에서 1차적인 욕설 및 비방 단어를 필터링하고 있습니다. (시발, 병신 등)",
      bgColor: isDark ? "rgba(234, 179, 8, 0.1)" : "#fef3c7",
      borderColor: isDark ? "rgba(234, 179, 8, 0.3)" : "#fde68a",
      textColor: isDark ? "#fbbf24" : "#92400e",
    },
    {
      icon: "📊",
      title: "데이터 연동 계획",
      content: "현재 모든 데이터는 LocalStorage에 저장됩니다. 추후 Firebase/Supabase 연동 시 실시간 데이터베이스로 이관 예정입니다.",
      bgColor: isDark ? "rgba(59, 130, 246, 0.1)" : "#dbeafe",
      borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe",
      textColor: isDark ? "#60a5fa" : "#1e40af",
    },
    {
      icon: "🔒",
      title: "관리자 기능 (TODO)",
      content: [
        "게시글/건의사항 삭제 및 숨김 처리",
        "악성 유저 IP 차단 기능",
        "답변 완료 상태 변경 기능",
        "사용자 활동 로그 추적",
        "대량 데이터 내보내기/가져오기",
      ],
      bgColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb",
      textColor: isDark ? "#ffffff" : "#1d1d1f",
      isList: true,
    },
    {
      icon: "⚡",
      title: "성능 최적화",
      content: "이미지 최적화, 코드 스플리팅, 캐싱 전략 등을 통해 페이지 로딩 속도를 개선 중입니다.",
      bgColor: isDark ? "rgba(168, 85, 247, 0.1)" : "#f3e8ff",
      borderColor: isDark ? "rgba(168, 85, 247, 0.3)" : "#e9d5ff",
      textColor: isDark ? "#a78bfa" : "#6b21a8",
    },
    {
      icon: "🔐",
      title: "보안 강화",
      content: "서버 사이드 인증 검증, XSS 방지, CSRF 토큰 적용 등 보안 기능을 지속적으로 강화하고 있습니다.",
      bgColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#fee2e2",
      borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
      textColor: isDark ? "#f87171" : "#991b1b",
    },
    {
      icon: "📱",
      title: "모바일 최적화",
      content: "반응형 디자인을 적용하여 모바일, 태블릿, 데스크톱 모든 기기에서 최적의 사용자 경험을 제공합니다.",
      bgColor: isDark ? "rgba(34, 197, 94, 0.1)" : "#dcfce7",
      borderColor: isDark ? "rgba(34, 197, 94, 0.3)" : "#bbf7d0",
      textColor: isDark ? "#4ade80" : "#166534",
    },
    {
      icon: "🌐",
      title: "다국어 지원",
      content: "한국어와 영어를 지원하며, 추후 일본어, 중국어 등 추가 언어 지원을 계획 중입니다.",
      bgColor: isDark ? "rgba(14, 165, 233, 0.1)" : "#e0f2fe",
      borderColor: isDark ? "rgba(14, 165, 233, 0.3)" : "#bae6fd",
      textColor: isDark ? "#38bdf8" : "#0c4a6e",
    },
    {
      icon: "📈",
      title: "분석 및 통계",
      content: "Google Analytics, 사용자 행동 분석, A/B 테스트 등을 통해 서비스 개선을 위한 데이터를 수집하고 있습니다.",
      bgColor: isDark ? "rgba(245, 158, 11, 0.1)" : "#fef3c7",
      borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
      textColor: isDark ? "#fbbf24" : "#92400e",
    },
    {
      icon: "🔄",
      title: "실시간 업데이트",
      content: "WebSocket 또는 Server-Sent Events를 활용한 실시간 알림 및 데이터 동기화 기능을 개발 중입니다.",
      bgColor: isDark ? "rgba(139, 92, 246, 0.1)" : "#ede9fe",
      borderColor: isDark ? "rgba(139, 92, 246, 0.3)" : "#ddd6fe",
      textColor: isDark ? "#a78bfa" : "#5b21b6",
    },
    {
      icon: "🎨",
      title: "UI/UX 개선",
      content: "사용자 피드백을 바탕으로 인터페이스를 지속적으로 개선하고, 접근성(A11y) 기준을 준수합니다.",
      bgColor: isDark ? "rgba(236, 72, 153, 0.1)" : "#fce7f3",
      borderColor: isDark ? "rgba(236, 72, 153, 0.3)" : "#fbcfe8",
      textColor: isDark ? "#f472b6" : "#9f1239",
    },
  ];

  return (
    <div className="p-6 rounded-[1.5rem] border shadow-sm h-full" style={cardStyle}>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}>
        ⚙️ {t.systemNotes.ko}
      </h3>
      
      <div className="flex flex-col gap-4 text-sm max-h-[600px] overflow-y-auto pr-2">
        {notes.map((note, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: note.bgColor,
              borderColor: note.borderColor,
            }}
          >
            <strong className="block mb-1" style={{ color: note.textColor }}>
              {note.icon} {note.title}
            </strong>
            {note.isList ? (
              <ul className="list-disc pl-4 mt-1 space-y-1" style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }}>
                {(note.content as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }}>
                {note.content as string}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}