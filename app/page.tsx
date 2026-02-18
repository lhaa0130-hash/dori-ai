// app/page.tsx
import Hero from "@/components/home/Hero";
import { ProjectListSection } from "@/components/home/ProjectListSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <ProjectListSection />
    </main>
  );
}
