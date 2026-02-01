"use client";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { motion } from "framer-motion";
import { Globe, Book, Rocket, Newspaper, Smartphone, Youtube, Play } from "lucide-react";

export const BentoGridDemo = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-20 px-4 text-white" id="features">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500 mb-4 tracking-tight">
          Curated Projects
        </h2>
        <p className="text-neutral-400 max-w-lg mx-auto text-lg">
          AI와 크리에이티브가 만나는 다양한 프로젝트를 경험해보세요.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <BentoGrid className="max-w-6xl mx-auto">
          {items.map((card, i) => (
            <motion.div key={i} variants={item} className={card.className}>
              <BentoGridItem
                title={card.title}
                description={card.description}
                header={card.header}
                icon={card.icon}
                className="h-full"
              />
            </motion.div>
          ))}
        </BentoGrid>
      </motion.div>
    </section>
  );
};

const HeaderPlaceholder = ({ color, children }: { color: string, children?: React.ReactNode }) => (
  <div className={`flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 items-center justify-center overflow-hidden relative group`}>
    <div className={`absolute inset-0 bg-${color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    <motion.div
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="relative z-10"
    >
      {children}
    </motion.div>
  </div>
);

const items = [
  {
    title: "동물도감",
    description: "생생한 3D 캐릭터와 함께하는 인터랙티브 가이드.",
    header: (
      <HeaderPlaceholder color="blue">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center glassmorphism">
          <span className="text-3xl">🐾</span>
        </div>
      </HeaderPlaceholder>
    ),
    icon: <Globe className="h-4 w-4 text-neutral-400" />,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "IT NEWS (n8n)",
    description: "실시간으로 흐르는 최신 글로벌 테크 뉴스.",
    header: (
      <HeaderPlaceholder color="emerald">
        <div className="flex flex-col gap-2 opacity-50">
          <div className="h-2 w-20 bg-emerald-500/30 rounded-full animate-pulse" />
          <div className="h-2 w-16 bg-emerald-500/30 rounded-full animate-pulse delay-75" />
          <div className="h-2 w-24 bg-emerald-500/30 rounded-full animate-pulse delay-150" />
        </div>
      </HeaderPlaceholder>
    ),
    icon: <Newspaper className="h-4 w-4 text-neutral-400" />,
    className: "md:col-span-1",
  },
  {
    title: "YouTube Shorts",
    description: "AI가 생성하는 숏폼 컨텐츠 자동화.",
    header: (
      <HeaderPlaceholder color="red">
        <Play className="w-10 h-10 text-red-500/50 fill-red-500/20" />
      </HeaderPlaceholder>
    ),
    icon: <Youtube className="h-4 w-4 text-neutral-400" />,
    className: "md:col-span-1",
  },
  {
    title: "YouTube Animation",
    description: "도리와 라라의 재미있는 일상 에피소드.",
    header: (
      <HeaderPlaceholder color="purple">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 opacity-60 rotate-3 group-hover:rotate-6 transition-transform" />
      </HeaderPlaceholder>
    ),
    icon: <Youtube className="h-4 w-4 text-neutral-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Android App",
    description: "언제 어디서나 함께하는 DORI.",
    header: (
      <HeaderPlaceholder color="sky">
        <Smartphone className="w-10 h-10 text-sky-500/50" />
      </HeaderPlaceholder>
    ),
    icon: <Smartphone className="h-4 w-4 text-neutral-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Education",
    description: "쉽고 재미있게 배우는 AI 튜토리얼.",
    header: (
      <HeaderPlaceholder color="yellow">
        <Book className="w-10 h-10 text-yellow-500/50" />
      </HeaderPlaceholder>
    ),
    icon: <Book className="h-4 w-4 text-neutral-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Vision",
    description: "우리가 만들어가는 미래.",
    header: (
      <HeaderPlaceholder color="white">
        <Rocket className="w-10 h-10 text-neutral-400" />
      </HeaderPlaceholder>
    ),
    icon: <Rocket className="h-4 w-4 text-neutral-400" />,
    className: "md:col-span-1",
  },
];