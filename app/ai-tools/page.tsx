"use client";

import { useState } from "react";
import ToolFilters from "@/components/ai-tools/ToolFilters";
import ToolsList from "@/components/ai-tools/ToolsList";
import { TEXTS } from "@/constants/texts";

export default function AiToolsPage() {
  const t = TEXTS.aiTools;

  // 📌 필터 상태 관리 (State Lifting)
  const [filters, setFilters] = useState({
    category: "All",
    price: "All",
    sort: "rating",
  });

  return (
    <main className="w-full min-h-screen">
      
      {/* 1. 상단 Hero (심플 버전) */}
      <section className="pt-32 pb-10 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>
          {t.heroTitle.ko}
        </h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto break-keep" style={{ color: 'var(--text-main)' }}>
          {t.heroSubtitle.ko}
        </p>
      </section>

      {/* 2. 메인 컨텐츠 (필터 + 리스트) */}
      <section className="container max-w-6xl mx-auto px-4 pb-24">
        
        {/* 필터 컴포넌트 */}
        <ToolFilters filters={filters} setFilters={setFilters} />
        
        {/* 리스트 컴포넌트 (필터 상태 전달) */}
        <ToolsList filters={filters} />
        
      </section>

    </main>
  );
}