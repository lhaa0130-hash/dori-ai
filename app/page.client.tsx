"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { IntroSection } from "@/components/home/IntroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function PageClient() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main
      className="w-full min-h-screen relative overflow-x-hidden transition-colors duration-500 bg-white dark:bg-black"
    >
      {/* Main Content Sections */}
      <div className="relative z-10 pt-32 pb-40">
        <IntroSection />
        <CategoryGrid />
      </div>
    </main>
  );
}
