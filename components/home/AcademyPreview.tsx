import { TEXTS } from "@/constants/texts";

export default function AcademyPreview() {
  const courses = [
    { id: 1, title: "ChatGPT 고급 프롬프트 작성법", level: "중급", icon: "📝" },
    { id: 2, title: "Pika 영상 생성 마스터", level: "초급", icon: "🎬" },
    { id: 3, title: "n8n 자동화 입문", level: "초급", icon: "🤖" }
  ];

  return (
    <section className="w-full h-full flex flex-col">
      <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
        <span className="text-green-500">🎓</span> {TEXTS.home.sectionTitles.academy.ko}
      </h2>
      
      <div className="flex flex-col gap-4 h-full">
        {courses.map((course) => (
          <div key={course.id} 
            className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--card-border)', 
              color: 'var(--text-main)' 
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gray-100 dark:bg-white/10">
              {course.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{course.title}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                {course.level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}