"use client";

import { useState } from "react";
import { TEXTS } from "@/constants/texts";
import { SuggestionItem, SuggestionType, SuggestionPriority } from "./SuggestionCard";

interface SuggestionFormProps {
  onAddSuggestion: (newItem: SuggestionItem) => void;
}

export default function SuggestionForm({ onAddSuggestion }: SuggestionFormProps) {
  const t = TEXTS.suggestions.form;

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "기능 요청" as SuggestionType,
    priority: "보통" as SuggestionPriority,
    message: "",
    needsReply: false,
  });

  const bannedWords = ["시발", "병신", "개새끼", "좆", "fuck", "shit"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 유효성 검사
    if (!formData.name || !formData.message) {
      alert(t.errorRequired.ko);
      return;
    }
    if (formData.message.length < 10) {
      alert(t.errorTooShort.ko);
      return;
    }
    // 이메일 형식 검사 (입력된 경우에만)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("이메일 형식이 올바르지 않습니다.");
      return;
    }

    // 2. 욕설 필터
    if (bannedWords.some(word => formData.message.includes(word) || formData.name.includes(word))) {
      alert(t.errorBanned.ko);
      return;
    }

    // 3. 데이터 생성
    const newItem: SuggestionItem = {
      id: crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      type: formData.type,
      priority: formData.priority,
      message: formData.message,
      needsReply: formData.needsReply,
      createdAt: new Date().toISOString(),
    };

    onAddSuggestion(newItem);
    alert(t.success.ko);

    // 초기화
    setFormData({
      name: "",
      email: "",
      type: "기능 요청",
      priority: "보통",
      message: "",
      needsReply: false,
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[var(--bg-main)] border-[var(--card-border)] text-[var(--text-main)] focus:border-blue-500 placeholder:text-gray-400";

  return (
    <div 
      className="p-8 rounded-[1.5rem] border shadow-sm max-w-3xl mx-auto mb-16"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--card-border)',
        color: 'var(--text-main)'
      }}
    >
      <h3 className="text-xl font-bold mb-6">📝 {t.submit.ko}</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* 이름 & 이메일 */}
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2 opacity-80">{t.name.ko} *</label>
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
              type="text" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={inputClass}
              placeholder="contact@example.com"
            />
          </div>
        </div>

        {/* 유형 & 우선순위 */}
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2 opacity-80">{t.type.ko} *</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as SuggestionType})}
              className={`${inputClass} cursor-pointer`}
            >
              <option>버그 제보</option>
              <option>기능 요청</option>
              <option>UI/디자인</option>
              <option>기타</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold mb-2 opacity-80">{t.priority.ko} *</label>
            <select 
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value as SuggestionPriority})}
              className={`${inputClass} cursor-pointer`}
            >
              <option>낮음</option>
              <option>보통</option>
              <option>높음</option>
            </select>
          </div>
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-bold mb-2 opacity-80">{t.message.ko} *</label>
          <textarea 
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            className={`${inputClass} resize-none`}
            placeholder="자유롭게 의견을 남겨주세요. (10자 이상)"
          />
        </div>

        {/* 체크박스 & 버튼 */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={formData.needsReply}
              onChange={(e) => setFormData({...formData, needsReply: e.target.checked})}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium opacity-80">{t.needsReply.ko}</span>
          </label>

          <button 
            type="submit" 
            className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
          >
            {t.submit.ko}
          </button>
        </div>

      </form>
    </div>
  );
}