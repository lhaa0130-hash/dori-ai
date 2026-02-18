"use client";

import { useState } from "react";
import { TEXTS } from "@/constants/texts";
import { BANNED_WORDS } from "@/constants/bannedWords";
import { Send, User, Mail, PenTool } from "lucide-react";

export default function MarketRequestForm() {
  const t = TEXTS.market.requestForm;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "이미지 제작",
    budget: "10만 원 이하",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.description) {
      alert(t.errorRequired.ko);
      return;
    }

    if (BANNED_WORDS.some(word => formData.description.includes(word))) {
      alert(t.errorBanned.ko);
      return;
    }

    console.log("New Request:", formData);
    alert(t.success.ko);

    setFormData({
      name: "",
      email: "",
      type: "이미지 제작",
      budget: "10만 원 이하",
      description: "",
    });
  };

  const labelClass = "block text-xs font-bold mb-2 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ml-1";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#F9954E] transition-colors pointer-events-none";
  const inputClass = "w-full pl-12 pr-4 py-4 rounded-xl border outline-none transition-all bg-white dark:bg-zinc-900/50 border-neutral-200 dark:border-zinc-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[#F9954E] focus:ring-4 focus:ring-[#F9954E]/10";
  const selectClass = "w-full pl-12 pr-10 py-4 rounded-xl border outline-none transition-all bg-white dark:bg-zinc-900/50 border-neutral-200 dark:border-zinc-800 text-neutral-900 dark:text-white cursor-pointer appearance-none focus:border-[#F9954E] focus:ring-4 focus:ring-[#F9954E]/10";

  return (
    <div className="p-8 md:p-10 rounded-[2.5rem] border border-neutral-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl shadow-xl dark:shadow-none max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="group">
            <label className={labelClass}>{t.name.ko}</label>
            <div className="relative">
              <User className={iconClass} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                placeholder="홍길동"
              />
            </div>
          </div>
          <div className="group">
            <label className={labelClass}>{t.email.ko}</label>
            <div className="relative">
              <Mail className={iconClass} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="group">
            <label className={labelClass}>{t.type.ko}</label>
            <div className="relative">
              <PenTool className={iconClass} />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={selectClass}
              >
                <option>이미지 제작</option>
                <option>영상 제작</option>
                <option>프롬프트 설계</option>
                <option>자동화 구축</option>
                <option>기타</option>
              </select>
            </div>
          </div>
          <div className="group">
            <label className={labelClass}>{t.budget.ko}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-400 group-focus-within:text-[#F9954E] transition-colors pointer-events-none">
                ₩
              </div>
              <select
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className={selectClass}
              >
                <option>10만 원 이하</option>
                <option>10만 ~ 30만 원</option>
                <option>30만 ~ 50만 원</option>
                <option>50만 원 이상</option>
              </select>
            </div>
          </div>
        </div>

        <div className="group">
          <label className={labelClass}>{t.description.ko}</label>
          <textarea
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full p-6 rounded-xl border outline-none transition-all bg-white dark:bg-zinc-900/50 border-neutral-200 dark:border-zinc-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[#F9954E] focus:ring-4 focus:ring-[#F9954E]/10 resize-none`}
            placeholder="작업 내용, 일정, 참고 자료 등을 자유롭게 적어주세요."
          />
        </div>

        <button
          type="submit"
          className="w-full py-5 rounded-xl font-bold text-white bg-gradient-to-r from-[#F9954E] to-[#FBAA60] hover:shadow-lg hover:shadow-[#F9954E]/30 transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 group"
        >
          <span>{t.submit.ko}</span>
          <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>

      </form>
    </div>
  );
}