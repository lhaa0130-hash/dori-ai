"use client";

import { useState } from "react";
import InsightFilters from "@/components/insight/InsightFilters";
import InsightList from "@/components/insight/InsightList";
import { TEXTS } from "@/constants/texts";

export default function InsightPage() {
  const t = TEXTS.insight;

  // 📌 State Lifting: 필터 상태 관리
  const [filters, setFilters] = useState<{ category: string; tag: string | null; sort: string }>({
    category: "All",
    tag: null,
    sort: "newest",
  });

  return (
    <main className="w-full min-h-screen">
      
      {/* 1. 상단 Hero */}
      <section className="pt-32 pb-10 px-6 text-center">
        <h1 
          className="text-3xl md:text-5xl font-extrabold mb-4" 
          style={{ color: 'var(--text-main)' }}
        >
          {t.heroTitle.ko}
        </h1>
        <p 
          className="text-lg opacity-70 max-w-2xl mx-auto break-keep" 
          style={{ color: 'var(--text-main)' }}
        >
          {t.heroSubtitle.ko}
        </p>
      </section>

      {/* 2. 메인 컨텐츠 */}
      <section className="container max-w-6xl mx-auto px-4 pb-24">
        
        {/* 필터 컴포넌트 */}
        <InsightFilters filters={filters} setFilters={setFilters} />
        
        {/* 리스트 컴포넌트 (데이터 표시) */}
        <InsightList filters={filters} setFilters={setFilters} />
        
      </section>

    </main>
  );
}