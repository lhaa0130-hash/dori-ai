"use client";

import { motion } from "framer-motion";
import { Youtube, Instagram, ExternalLink } from "lucide-react";

export default function SNSBanner() {
  return (
    <section className="w-full px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#F9954E] via-[#FF7B54] to-[#F05E93] p-8 md:p-10"
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* 왼쪽: 텍스트 */}
            <div className="text-center md:text-left">
              <p className="text-white/80 text-xs font-bold tracking-widest uppercase mb-2">
                Follow Us
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                DORI-AI 채널 팔로우
              </h2>
              <p className="text-white/80 text-sm font-medium">
                구독하고 최신 AI 소식을 가장 먼저 받아보세요 ✨
              </p>
            </div>

            {/* 오른쪽: SNS 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {/* 유튜브 */}
              <a
                href="https://www.youtube.com/@lhaa0130"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-neutral-900 font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105 shadow-lg shadow-black/10"
              >
                <Youtube className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                <span>YouTube 구독</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </a>

              {/* 인스타그램 */}
              <a
                href="https://www.instagram.com/lhaa0130/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/20 text-white font-bold text-sm hover:bg-white hover:text-neutral-900 transition-all duration-200 hover:scale-105 shadow-lg shadow-black/10 border border-white/30"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>@lhaa0130</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
