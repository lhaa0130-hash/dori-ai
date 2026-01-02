import React from "react";
import { TEXTS } from "@/constants/texts";

interface AiToolsFiltersProps {
  filters: {
    category: string;
  };
  setFilters: (newFilters: any) => void;
}

const AiToolsFilters = React.memo(({ filters, setFilters }: AiToolsFiltersProps) => {
  const t = TEXTS.aiTools.filters;

  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const selectClass = "px-5 py-3 rounded-xl border outline-none text-sm font-semibold transition-all duration-200 cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:shadow-md hover:scale-105 w-full md:w-auto";

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-12 justify-between items-stretch md:items-center">
      {/* 1. 카테고리 필터 */}
      <select 
        value={filters.category} 
        onChange={(e) => handleChange("category", e.target.value)}
        className={selectClass}
      >
        <option value="All">{t.category.ko}: {t.all.ko}</option>
        <option value="llm">LLM (Chat)</option>
        <option value="image-generation">Image Generation</option>
        <option value="image-editing">Image Editing</option>
        <option value="video-generation">Video Generation</option>
        <option value="video-editing">Video Editing</option>
        <option value="voice-tts">Voice TTS</option>
        <option value="music">Music</option>
        <option value="automation">Automation</option>
        <option value="search">Search</option>
        <option value="agent">Agent (Autonomous)</option>
        <option value="coding">Coding Assistant</option>
        <option value="design">Design</option>
        <option value="3d">3D Generation</option>
        <option value="writing">Writing</option>
        <option value="translation">Translation</option>
        <option value="presentation">Presentation</option>
      </select>
    </div>
  );
});

export default AiToolsFilters;