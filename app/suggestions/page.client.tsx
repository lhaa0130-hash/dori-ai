"use client";
import { useState, useEffect } from "react";
import { TEXTS } from "@/constants/texts";
import SuggestionForm from "@/components/suggestions/SuggestionForm";
import SuggestionFilters from "@/components/suggestions/SuggestionFilters";
import SuggestionList from "@/components/suggestions/SuggestionList";
import { SuggestionItem } from "@/components/suggestions/SuggestionCard";

export default function SuggestionsClient() {
  const t = TEXTS.suggestions;
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [filters, setFilters] = useState({ type: "All", priority: "All", sort: "newest" });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dori_suggestions");
    if (saved) setSuggestions(JSON.parse(saved));
    else {
        const dummy: SuggestionItem[] = [
            { id: "1", name: "DORI", type: "기능 요청", priority: "높음", message: "다크모드 버튼 디자인을 더 예쁘게 바꿔주세요!", needsReply: true, createdAt: new Date().toISOString() },
            { id: "2", name: "Tester", type: "버그 제보", priority: "보통", message: "모바일에서 메뉴가 가끔 안 열립니다.", needsReply: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
        ];
        setSuggestions(dummy);
        localStorage.setItem("dori_suggestions", JSON.stringify(dummy));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => { if (isLoaded) localStorage.setItem("dori_suggestions", JSON.stringify(suggestions)); }, [suggestions, isLoaded]);

  const handleAddSuggestion = (newItem: SuggestionItem) => setSuggestions([newItem, ...suggestions]);

  const filteredSuggestions = suggestions
    .filter(item => (filters.type === "All" || item.type === filters.type) && (filters.priority === "All" || item.priority === filters.priority))
    .sort((a, b) => {
      if (filters.sort === "priority") {
        const priorityScore = { "높음": 3, "보통": 2, "낮음": 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <main className="w-full min-h-screen" style={{ paddingTop: 0 }}>
      <section className="pt-20 pb-16 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>{t.heroTitle.ko}</h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto break-keep" style={{ color: 'var(--text-main)' }}>{t.heroSubtitle.ko}</p>
      </section>
      <section className="container max-w-5xl mx-auto px-4 pb-24">
        <SuggestionForm onAddSuggestion={handleAddSuggestion} />
        <div className="border-t border-dashed pt-12" style={{ borderColor: 'var(--card-border)' }}>
          <SuggestionFilters filters={filters} setFilters={setFilters} />
          <SuggestionList suggestions={filteredSuggestions} />
        </div>
      </section>
    </main>
  );
}