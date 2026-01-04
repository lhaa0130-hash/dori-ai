"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import { TEXTS } from "@/constants/texts";
import { completeMission, isMissionCompletedToday, markMissionCompletedToday } from "@/lib/missionHelpers";

const DISPLAY_CATEGORIES = [
  "llm", 
  "image-generation",
  "image-editing",
  "video-generation",
  "video-editing",
  "voice-tts",
  "music",
  "automation", 
  "search", 
  "agent",
  "coding",
  "design",
  "3d",
  "writing",
  "translation",
  "presentation"
];

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM",
  "image-generation": "Image Gen",
  "image-editing": "Image Edit",
  "video-generation": "Video Gen",
  "video-editing": "Video Edit",
  "voice-tts": "Voice TTS",
  music: "Music",
  automation: "Automation",
  search: "Search",
  agent: "Agent",
  coding: "Coding",
  design: "Design",
  "3d": "3D",
  writing: "Writing",
  translation: "Translation",
  presentation: "Presentation",
};

export default function AiToolsClient() {
  const t = TEXTS.aiTools;
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: "All",
    priceType: "all",
    sortBy: "rating",
  });
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => setMounted(true), []);

  // AI Tools 페이지 방문 미션 자동 완료
  useEffect(() => {
    if (mounted && session?.user) {
      const missionCode = "VISIT_AI_TOOLS";
      if (!isMissionCompletedToday(missionCode)) {
        completeMission(missionCode).then((success) => {
          if (success) {
            markMissionCompletedToday(missionCode);
          }
        });
      }
    }
  }, [mounted, session]);

  const isDark = mounted && theme === 'dark';

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category === activeCategory ? null : category);
    const element = sectionRefs.current[category];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full min-h-screen" style={{ paddingTop: '70px' }}>
      {/* Hero Section */}
      <section className="w-full py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}>
          {t.heroTitle.ko}
        </h1>
        <p className="text-lg opacity-80 max-w-2xl mx-auto" style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
          {t.heroSubtitle.ko}
        </p>
      </section>

      {/* Filters */}
      <section className="w-full max-w-7xl mx-auto px-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <button
            onClick={() => handleCategoryClick("all")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeCategory === null
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'bg-white/10 text-white/70 hover:bg-white/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {DISPLAY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-white/10 text-white/70 hover:bg-white/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </section>

      {/* Tools List */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-16">
        <AiToolsList filters={filters} sectionRefs={sectionRefs} />
      </section>
    </div>
  );
}
