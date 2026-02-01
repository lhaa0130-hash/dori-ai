"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IntroSection } from "@/components/home/IntroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function HomeClient() {
  const { systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <IntroSection />
      <CategoryGrid />
    </div>
  );
}
