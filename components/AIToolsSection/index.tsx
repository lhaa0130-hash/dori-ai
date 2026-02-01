import { Lightbulb, Settings, Code, Image, Video, Mic, Bot, Brain, Database, Cloud, Zap, Brush } from "lucide-react";

const aiToolsCategories = [
  { name: "LLM", icon: <Brain className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Image Gen", icon: <Image className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Video Gen", icon: <Video className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Coding", icon: <Code className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Audio", icon: <Mic className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Automation", icon: <Bot className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Data Analysis", icon: <Database className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Cloud AI", icon: <Cloud className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Productivity", icon: <Zap className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Design", icon: <Brush className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Marketing", icon: <Lightbulb className="h-6 w-6 text-[#3b82f6]" /> },
  { name: "Settings", icon: <Settings className="h-6 w-6 text-[#3b82f6]" /> },
];

export const AIToolsSection = () => {
  return (
    <section className="p-8 mt-12">
      <h2 className="text-4xl font-bold text-white text-center mb-8">
        AI Tools Category
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
        {aiToolsCategories.map((category) => (
          <div
            key={category.name}
            className="flex flex-col items-center justify-center p-4 rounded-xl backdrop-filter backdrop-blur-lg bg-white bg-opacity-5 border border-white border-opacity-10 shadow-lg text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            {category.icon}
            <span className="mt-2 text-sm font-medium">{category.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};