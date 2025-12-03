"use client";
import { useState } from "react";
import AcademySearch from "@/components/academy/AcademySearch";
import AcademyFilters from "@/components/academy/AcademyFilters";
import AcademyList from "@/components/academy/AcademyList";
import { TEXTS } from "@/constants/texts";

export default function AcademyClient() {
  const t = TEXTS.academy;
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ level: "All", category: "All" });
  return (
    <main className="w-full min-h-screen">
      <section className="pt-32 pb-10 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>{t.heroTitle.ko}</h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto break-keep mb-8" style={{ color: 'var(--text-main)' }}>{t.heroSubtitle.ko}</p>
        <AcademySearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </section>
      <section className="container max-w-6xl mx-auto px-4 pb-24">
        <AcademyFilters filters={filters} setFilters={setFilters} />
        <AcademyList searchTerm={searchTerm} filters={filters} />
      </section>
    </main>
  );
}