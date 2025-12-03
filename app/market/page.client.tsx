"use client";
import { useState } from "react";
import { TEXTS } from "@/constants/texts";
import MarketFilters from "@/components/market/MarketFilters";
import MarketList from "@/components/market/MarketList";
import MarketRequestForm from "@/components/market/MarketRequestForm";

export default function MarketClient() {
  const t = TEXTS.market;
  const [filters, setFilters] = useState({ category: "All", price: "All", sort: "newest" });
  return (
    <main className="w-full min-h-screen">
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>{t.heroTitle.ko}</h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto break-keep" style={{ color: 'var(--text-main)' }}>{t.heroSubtitle.ko}</p>
      </section>
      <section className="container max-w-6xl mx-auto px-4 pb-24 border-b border-dashed" style={{ borderColor: 'var(--card-border)' }}>
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>🛒 {t.section.productsTitle.ko}</h2>
        <MarketFilters filters={filters} setFilters={setFilters} />
        <MarketList filters={filters} />
      </section>
      <section className="container max-w-4xl mx-auto px-4 py-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color: 'var(--text-main)' }}>🤝 {t.section.requestTitle.ko}</h2>
          <p className="opacity-70" style={{ color: 'var(--text-sub)' }}>원하는 AI 자료가 없다면? 전문가에게 직접 의뢰해보세요.</p>
        </div>
        <MarketRequestForm />
      </section>
    </main>
  );
}