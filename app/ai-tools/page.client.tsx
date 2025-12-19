"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import AiToolsFilters from "@/components/ai-tools/AiToolsFilters";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import { TEXTS } from "@/constants/texts";

export default function AiToolsClient() {
  const t = TEXTS.aiTools;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({
    category: "All",
    sort: "rating",
  });

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  return (
    <main className="w-full min-h-screen relative" style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
    }}>
      {/* 다크모드 배경 효과 */}
      {mounted && theme === "dark" && (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <section className="relative pt-4 pb-2 px-6 text-center overflow-hidden" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-2 tracking-tight leading-tight"
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            {t.heroTitle.ko}
          </h1>
          <p 
            className="text-lg md:text-xl font-medium opacity-70 break-keep"
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>

      <section className="container max-w-6xl mx-auto px-4 pb-24 relative" style={{ zIndex: 1 }}>
        <AiToolsFilters filters={filters} setFilters={setFilters} />
        <AiToolsList filters={filters} />
      </section>
    </main>
  );
}