"use client";

import { TEXTS } from "@/constants/texts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Hero() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <section className="relative pt-4 pb-2 px-6 text-center overflow-hidden">
      
      {mounted && theme === "dark" && (
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-screen h-[800px] -z-10 pointer-events-none" style={{ zIndex: -1 }}>
          <div className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse delay-1000" />
        </div>
      )}

      <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]" style={{ position: 'relative', zIndex: 1 }}>
        <h1 
          className="text-4xl md:text-6xl font-extrabold mb-2 tracking-tight leading-tight"
          style={{ color: 'var(--text-main)' }}
        >
          Creative Studio
        </h1>
        
        {/* 👇 .ko 사용 */}
        <h2 
          className="text-2xl md:text-3xl font-bold mb-1 opacity-90 break-keep"
          style={{ color: 'var(--text-main)' }}
        >
          작은 시작을 함께 만들어갑니다. <span className={`gradient-text ${mounted && theme === 'dark' ? 'gradient-dark' : 'gradient-light'}`}>DORI-AI</span>
        </h2>
        
        <p 
          className="text-lg md:text-xl font-medium opacity-70 break-keep"
          style={{ color: 'var(--text-main)' }}
        >
          {TEXTS.home.heroSubtitle.ko}
        </p>
      </div>
      
      <style jsx>{`
        .gradient-text {
          background-position: 0% 50%;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          display: inline-block;
          position: relative;
          z-index: 1;
          font-weight: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        .gradient-text.gradient-dark {
          background-image: linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%);
        }

        .gradient-text.gradient-light {
          background-image: linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%);
        }
      `}</style>
    </section>
  );
}