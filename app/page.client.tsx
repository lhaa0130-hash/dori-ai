"use client";

import { IntroSection } from "@/components/home/IntroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function HomeClient() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <IntroSection />
      <CategoryGrid />
    </main>
  );
}
