"use client";
import { useState } from "react";
import AiToolsFilters from "@/components/ai-tools/AiToolsFilters";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import { TEXTS } from "@/constants/texts";

export default function AiToolsClient() {
  const t = TEXTS.aiTools;
  const [filters, setFilters] = useState({ category: "All", price: "All", sort: "rating" });
  return (
    <main className="w-full min-h-screen">
      <section className="pt-32 pb-10 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>{t.heroTitle.ko}</h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto break-keep" style={{ color: 'var(--text-main)' }}>{t.heroSubtitle.ko}</p>
      </section>
      <section className="container max-w-6xl mx-auto px-4 pb-24">
        <AiToolsFilters filters={filters} setFilters={setFilters} />
        <AiToolsList filters={filters} />
      </section>
    </main>
  );
}