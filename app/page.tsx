"use client";

// Components
import Hero from "@/components/home/Hero";
import BentoSection from "@/components/home/BentoSection";
import ToolsPreview from "@/components/home/ToolsPreview";
import InsightPreview from "@/components/home/InsightPreview";
import AcademyPreview from "@/components/home/AcademyPreview";
import CommunityPreview from "@/components/home/CommunityPreview";

export default function Home() {
  return (
    <main className="w-full overflow-x-hidden">
      <Hero />
      <BentoSection />
      <ToolsPreview />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1200px] mx-auto px-6 mb-20">
        <InsightPreview />
        <AcademyPreview />
      </div>

      <CommunityPreview />
      
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </main>
  );
}