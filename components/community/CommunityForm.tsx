"use client";

import { useState } from "react";
import { TEXTS } from "@/constants/texts";
import { CommunityPost, CommunityTag } from "./CommunityCard";

interface CommunityFormProps {
  onAddPost: (newPost: CommunityPost) => void;
}

export default function CommunityForm({ onAddPost }: CommunityFormProps) {
  const t = TEXTS.communityPage.form;
  const tErr = TEXTS.communityPage.errors;

  // 폼 상태
  const [isOpen, setIsOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<CommunityTag>("잡담");

  // 금칙어 리스트
  const bannedWords = ["시발", "병신", "개새끼", "좆", "fuck", "shit"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 길이 검사
    if (title.length < 2 || content.length < 5) {
      alert(tErr.short.ko);
      return;
    }

    // 2. 욕설 필터
    const combinedText = title + content + nickname;
    if (bannedWords.some((word) => combinedText.includes(word))) {
      alert(tErr.banned.ko);
      return;
    }

    // 3. 등록
    const newPost: CommunityPost = {
      id: Date.now(),
      nickname: nickname || "익명",
      title,
      content,
      tag,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    onAddPost(newPost);
    
    // 초기화 및 닫기
    setNickname("");
    setTitle("");
    setContent("");
    setTag("잡담");
    setIsOpen(false);
  };

  // 공통 인풋 스타일
  const inputClass = "w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[var(--bg-soft)] border-[var(--card-border)] text-[var(--text-main)] focus:border-blue-500 placeholder:text-gray-400";

  return (
    <div className="mb-10 w-full max-w-2xl mx-auto">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full py-4 rounded-[2rem] border border-dashed text-lg font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          style={{ 
            borderColor: 'var(--card-border)', 
            color: 'var(--text-sub)',
            backgroundColor: 'var(--card-bg)'
          }}
        >
          ✏️ 새 글 작성하기
        </button>
      ) : (
        <div 
          className="p-6 rounded-[2rem] border shadow-lg animate-[fadeInUp_0.3s_ease-out]"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-main)' }}>📝 글쓰기</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder={t.nickname.ko} 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={`w-1/3 ${inputClass}`}
                maxLength={10}
              />
              <select 
                value={tag}
                onChange={(e) => setTag(e.target.value as CommunityTag)}
                className={`w-1/3 ${inputClass} cursor-pointer`}
              >
                <option value="잡담">☕ 잡담</option>
                <option value="질문">❓ 질문</option>
                <option value="정보">💡 정보</option>
                <option value="자랑">✨ 자랑</option>
              </select>
            </div>

            <input 
              type="text" 
              placeholder={t.title.ko}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              maxLength={50}
            />

            <textarea 
              rows={5}
              placeholder={t.content.ko}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${inputClass} resize-none`}
            />

            <div className="flex gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold border transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                style={{ borderColor: 'var(--card-border)', color: 'var(--text-sub)' }}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
              >
                {t.submit.ko}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}