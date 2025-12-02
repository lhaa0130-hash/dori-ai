"use client";

import { useState } from "react";
import { TEXTS } from "@/constants/texts";

export default function RequestForm() {
  const t = TEXTS.market.requestForm;

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "이미지 제작",
    budget: "10만 원 이하",
    description: "",
  });

  const bannedWords = ["시발", "병신", "개새끼", "좆", "fuck", "shit"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 필수값 검사
    if (!formData.name || !formData.email || !formData.description) {
      alert(t.errorRequired.ko);
      return;
    }

    // 2. 욕설 필터
    if (bannedWords.some(word => formData.description.includes(word))) {
      alert(t.errorBanned.ko);
      return;
    }

    // 3. 제출 성공 처리
    console.log("New Request:", formData);
    alert(t.success.ko);
    
    // 초기화
    setFormData({
      name: "",
      email: "",
      type: "이미지 제작",
      budget: "10만 원 이하",
      description: "",
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[var(--bg-main)] border-[var(--card-border)] text-[var(--text-main)] focus:border-blue-500 placeholder:text-gray-400";

  return (
    <div 
      className="p-8 rounded-[1.5rem] border shadow-sm max-w-3xl mx-auto"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--card-border)',
        color: 'var(--text-main)'
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* 이름 & 이메일 */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2 opacity-80">{t.name.ko}</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={inputClass}
              placeholder="홍길동"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2 opacity-80">{t.email.ko}</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={inputClass}
              placeholder="contact@example.com"
            />
          </div>
        </div>

        {/* 의뢰 종류 & 예산 */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2 opacity-80">{t.type.ko}</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className={`${inputClass} cursor-pointer`}
            >
              <option>이미지 제작</option>
              <option>영상 제작</option>
              <option>프롬프트 설계</option>
              <option>자동화 구축</option>
              <option>기타</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2 opacity-80">{t.budget.ko}</label>
            <select 
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              className={`${inputClass} cursor-pointer`}
            >
              <option>10만 원 이하</option>
              <option>10만 ~ 30만 원</option>
              <option>30만 ~ 50만 원</option>
              <option>50만 원 이상</option>
            </select>
          </div>
        </div>

        {/* 상세 내용 */}
        <div>
          <label className="block text-sm font-bold mb-2 opacity-80">{t.description.ko}</label>
          <textarea 
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className={`${inputClass} resize-none`}
            placeholder="작업 내용, 일정, 참고 자료 등을 자유롭게 적어주세요."
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md mt-2"
        >
          {t.submit.ko}
        </button>

      </form>
    </div>
  );
}