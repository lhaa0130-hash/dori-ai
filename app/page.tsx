// app/page.tsx
import { IntroSection } from "@/components/home/IntroSection";
import { ProjectListSection } from "@/components/home/ProjectListSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <IntroSection />
      <ProjectListSection />
    </main>
  );
}
