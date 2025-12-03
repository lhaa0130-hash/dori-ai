import { TEXTS } from "@/constants/texts";

export default function ToolsPreview() {
  const tools = [
    { id: 1, name: "ChatGPT", category: "LLM", rating: 4.8 },
    { id: 2, name: "Gemini", category: "LLM", rating: 4.5 },
    { id: 3, name: "Claude", category: "LLM", rating: 4.4 },
    { id: 4, name: "Leonardo", category: "Image", rating: 4.6 }
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-6 mb-20">
      <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
        <span className="text-blue-500">🏆</span> {TEXTS.home.sectionTitles.tools.ko}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <div key={tool.id} 
            className="p-6 rounded-[2rem] border shadow-sm hover:-translate-y-1 transition-all cursor-pointer"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--card-border)', 
              color: 'var(--text-main)' 
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300">
                {tool.category}
              </span>
              <span className="text-yellow-500 text-sm font-bold flex items-center gap-1">
                ★ {tool.rating}
              </span>
            </div>
            <h3 className="font-bold text-xl">{tool.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}