import Link from "next/link";
import { TEXTS } from "@/constants/texts";

export default function BentoSection() {
  const t = TEXTS.home.bento;

  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    boxShadow: 'var(--card-shadow)',
    color: 'var(--text-main)',
  };

  const cardClasses = `
    relative flex flex-col justify-between p-6 md:p-8 
    rounded-[2rem] border transition-all duration-300 
    hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl 
    group overflow-hidden cursor-pointer
  `;
  
  const iconClasses = `
    w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 
    bg-gray-50 dark:bg-white/10 text-gray-700 dark:text-white 
    transition-transform group-hover:scale-110 duration-300
    border border-gray-100 dark:border-white/5
  `;

  return (
    // 📌 반응형 간격: 모바일 gap-4 / PC gap-6
    <div className="max-w-[1200px] mx-auto px-6 mb-24 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards] opacity-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[minmax(240px,auto)]">
        
        {/* 1. AI Tools -> /ai-tools */}
        <Link href="/ai-tools" className={`md:col-span-2 md:row-span-2 ${cardClasses}`}
          style={{ 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
            borderColor: 'transparent',
            color: 'white',
            boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)' 
          }}>
          
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-center h-full">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 bg-white/20 backdrop-blur-md text-white shadow-inner border border-white/20">🏆</div>
            <h3 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">{t.tools.title}</h3>
            <p className="text-blue-100 text-lg leading-relaxed whitespace-pre-line opacity-90">{t.tools.detail}</p>
          </div>
          
          <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 px-5 py-2 md:px-6 md:py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-sm group-hover:bg-white group-hover:text-blue-600 transition-all flex items-center gap-2">
            {t.tools.linkText} <span>→</span>
          </div>
        </Link>

        {/* 2. Insight -> /insight */}
        <Link href="/insight" className={cardClasses} style={cardStyle}>
          <div>
            <div className={iconClasses}>🧠</div>
            <h3 className="text-xl font-bold mb-2">{t.insight.title}</h3>
            <p className="text-sm opacity-70 leading-relaxed">{t.insight.desc}</p>
          </div>
        </Link>

        {/* 3. Academy -> /academy */}
        <Link href="/academy" className={cardClasses} style={cardStyle}>
          <div>
            <div className={iconClasses}>🎓</div>
            <h3 className="text-xl font-bold mb-2">{t.academy.title}</h3>
            <p className="text-sm opacity-70 leading-relaxed">{t.academy.desc}</p>
          </div>
        </Link>

        {/* 4. Market -> /market */}
        <Link href="/market" className={cardClasses} style={cardStyle}>
          <div>
            <div className={iconClasses}>🛒</div>
            <h3 className="text-xl font-bold mb-2">{t.market.title}</h3>
            <p className="text-sm opacity-70 leading-relaxed">{t.market.desc}</p>
          </div>
        </Link>

        {/* 5. Community -> /community */}
        <Link href="/community" className={`md:col-span-2 ${cardClasses}`} style={cardStyle}>
          <div className="relative z-10">
            <div className={iconClasses}>💬</div>
            <h3 className="text-xl font-bold mb-2">{t.community.title}</h3>
            <p className="text-sm opacity-70 mb-1">{t.community.desc}</p>
            <p className="text-xs opacity-50 line-clamp-1 mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
              {t.community.detail}
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}