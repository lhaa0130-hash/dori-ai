// app/page.tsx
import { IntroSection } from "@/components/home/IntroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <IntroSection />
      <CategoryGrid />
    </main>
  );
}
