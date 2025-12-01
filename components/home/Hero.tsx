"use client";

import { TEXTS } from "@/constants/texts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Hero() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const tTitle = TEXTS.home.heroTitle.ko;
  const tSubtitle = TEXTS.home.heroSubtitle.ko;

  return (
    <section className="relative pt-40 pb-20 px-6 text-center overflow-hidden">
      
      {/* 📌 오로라 효과: 다크모드에서만 보임 */}
      {mounted && theme === "dark" && (
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-screen h-[800px] -z-10 pointer-events-none">
          <div className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40
            bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40
            bg-purple-900 mix-blend-screen animate-pulse delay-1000" />
        </div>
      )}

      <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
        
        {/* 🔴 [핵심 수정] 
           style={{ color: 'var(--text-main)' }} 
           이 코드를 넣어 globals.css의 설정(라이트=검정 / 다크=흰색)을 강제로 따르게 함 
        */}
        
        <h1 
          className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight"
          style={{ color: 'var(--text-main)' }}
        >
          Creative Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">DORI-AI</span>
        </h1>
        
        <h2 
          className="text-2xl md:text-3xl font-bold mb-4 opacity-90 break-keep"
          style={{ color: 'var(--text-main)' }}
        >
          {tTitle}
        </h2>
        
        <p 
          className="text-lg md:text-xl font-medium opacity-70 break-keep"
          style={{ color: 'var(--text-main)' }}
        >
          {tSubtitle}
        </p>
      </div>
    </section>
  );
}