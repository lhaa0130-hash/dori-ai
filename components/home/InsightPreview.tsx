import { TEXTS } from "@/constants/texts";

export default function InsightPreview() {
  const insights = [
    { id: 1, title: "AI 시대에 반드시 알아야 할 개념 10가지", summary: "초보자도 이해하는 핵심 AI 개념." },
    { id: 2, title: "AI로 돈 버는 7가지 방법", summary: "수익 구조 명확히 정의." },
    { id: 3, title: "업무 자동화 기초", summary: "n8n, Make, GPT로 자동화." }
  ];

  return (
    <section className="w-full h-full flex flex-col">
      <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
        <span className="text-[#F9954E]">🧠</span> {TEXTS.home.sectionTitles.insight.ko}
      </h2>

      <div className="flex flex-col gap-3 h-full">
        {insights.map((item) => (
          <div key={item.id}
            className="flex flex-col justify-center p-5 rounded-2xl border transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              color: 'var(--text-main)'
            }}
          >
            <h3 className="font-bold text-lg mb-1 truncate">{item.title}</h3>
            <p className="text-sm opacity-60 line-clamp-1">{item.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}