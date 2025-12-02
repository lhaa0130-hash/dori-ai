"use client";

import { useState } from "react";
import AcademySearch from "@/components/academy/AcademySearch";
import AcademyFilters from "@/components/academy/AcademyFilters";
import AcademyList from "@/components/academy/AcademyList";
import { TEXTS } from "@/constants/texts";

export default function AcademyPage() {
  const t = TEXTS.academy;

  // 📌 상태 관리 (State Lifting)
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    level: "All",
    category: "All",
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
          className="text-lg opacity-70 max-w-2xl mx-auto break-keep mb-8" 
          style={{ color: 'var(--text-main)' }}
        >
          {t.heroSubtitle.ko}
        </p>

        {/* 2. 검색바 (Hero 영역에 포함하여 강조) */}
        <AcademySearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </section>

      {/* 3. 메인 컨텐츠 */}
      <section className="container max-w-6xl mx-auto px-4 pb-24">
        
        {/* 필터 컴포넌트 */}
        <AcademyFilters filters={filters} setFilters={setFilters} />
        
        {/* 리스트 컴포넌트 (데이터 표시) */}
        <AcademyList searchTerm={searchTerm} filters={filters} />
        
      </section>

    </main>
  );
}