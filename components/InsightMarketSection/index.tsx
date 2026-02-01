import { ArrowRight, BarChart, Users } from "lucide-react";
import { motion } from "framer-motion";

export const InsightMarketSection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, margin: "-100px" }}
      className="p-8 mt-12"
    >
      <h2 className="text-4xl font-bold text-neutral-900 dark:text-white text-center mb-8">
        Insight & Market
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Insight Section */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-neutral-200 dark:border-white/10 shadow-lg flex flex-col hover:border-orange-500/50 transition-colors duration-300">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart className="h-6 w-6 text-orange-500" /> Insight
          </h3>
          <ul className="space-y-3 text-neutral-600 dark:text-white/80">
            {[...Array(3)].map((_, i) => (
              <li key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group">
                <span className="group-hover:text-orange-500 transition-colors">최신 인사이트 글 제목 {i + 1}</span>
                <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <button className="px-6 py-2 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors hover:shadow-lg hover:shadow-orange-500/30">
              모든 인사이트 보기
            </button>
          </div>
        </div>

        {/* Market Section */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-neutral-200 dark:border-white/10 shadow-lg flex flex-col hover:border-orange-500/50 transition-colors duration-300">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-500" /> Market
          </h3>
          <ul className="space-y-3 text-neutral-600 dark:text-white/80">
            {[...Array(3)].map((_, i) => (
              <li key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group">
                <span className="group-hover:text-orange-500 transition-colors">인기 마켓 아이템 {i + 1}</span>
                <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <button className="px-6 py-2 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors hover:shadow-lg hover:shadow-orange-500/30">
              모든 마켓 상품 보기
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};