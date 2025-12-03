"use client";

import { useState } from "react";
import { TEXTS } from "@/constants/texts";
import { CommunityPost, CommunityTag } from "./CommunityCard";
import { BANNED_WORDS } from "@/constants/bannedWords";
import { AiCreationType, AiMeta } from "@/types/content"; // 👈 추가

interface CommunityFormProps {
  onAddPost: (newPost: CommunityPost) => void;
}

export default function CommunityForm({ onAddPost }: CommunityFormProps) {
  const t = TEXTS.communityPage.form;
  const tErr = TEXTS.communityPage.errors;

  const [isOpen, setIsOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<CommunityTag>("잡담");

  // 👇 [추가] AI 메타데이터 상태
  const [creationType, setCreationType] = useState<AiCreationType>("human_only");
  const [aiTools, setAiTools] = useState(""); // 입력받을 텍스트

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (title.length < 2 || content.length < 5) { alert(tErr.short.ko); return; }
    const combinedText = title + content + nickname;
    if (BANNED_WORDS.some((word) => combinedText.includes(word))) { alert(tErr.banned.ko); return; }

    // AI 메타데이터 구성
    const aiMeta: AiMeta | undefined = creationType !== "human_only" ? {
      creationType,
      tools: aiTools ? aiTools.split(",").map(t => t.trim()) : undefined
    } : undefined;

    const newPost: CommunityPost = {
      id: Date.now(),
      nickname: nickname || "익명",
      title,
      content,
      tag,
      likes: 0,
      createdAt: new Date().toISOString(),
      aiMeta, // 👈 저장
    };

    onAddPost(newPost);
    
    // 초기화
    setNickname(""); setTitle(""); setContent(""); setTag("잡담");
    setCreationType("human_only"); setAiTools("");
    setIsOpen(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border outline-none transition-all bg-[var(--bg-soft)] border-[var(--card-border)] text-[var(--text-main)] focus:border-blue-500 placeholder:text-gray-400";

  return (
    <div className="mb-10 w-full max-w-2xl mx-auto">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full py-4 rounded-[2rem] border border-dashed text-lg font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          style={{ borderColor: 'var(--card-border)', color: 'var(--text-sub)', backgroundColor: 'var(--card-bg)' }}
        >
          ✏️ 새 글 작성하기
        </button>
      ) : (
        <div className="p-6 rounded-[2rem] border shadow-lg animate-[fadeInUp_0.3s_ease-out]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-main)' }}>📝 글쓰기</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="flex gap-4">
              <input type="text" placeholder={t.nickname.ko} value={nickname} onChange={(e) => setNickname(e.target.value)} className={`w-1/3 ${inputClass}`} maxLength={10} />
              <select value={tag} onChange={(e) => setTag(e.target.value as CommunityTag)} className={`w-1/3 ${inputClass} cursor-pointer`}>
                <option value="잡담">☕ 잡담</option>
                <option value="질문">❓ 질문</option>
                <option value="정보">💡 정보</option>
                <option value="자랑">✨ 자랑</option>
              </select>
            </div>

            {/* 👇 [추가] AI 사용 여부 선택 */}
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <span className="text-sm font-bold opacity-80">🤖 AI 사용 여부 (투명성 표시)</span>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="creationType" value="human_only" checked={creationType === "human_only"} onChange={() => setCreationType("human_only")} /> 사람만 작성
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="creationType" value="ai_assisted" checked={creationType === "ai_assisted"} onChange={() => setCreationType("ai_assisted")} /> AI 보조 사용
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="creationType" value="ai_generated" checked={creationType === "ai_generated"} onChange={() => setCreationType("ai_generated")} /> AI가 생성
                </label>
              </div>
              {creationType !== "human_only" && (
                <input 
                  type="text" 
                  placeholder="사용 도구 (예: ChatGPT, Gemini)" 
                  value={aiTools} 
                  onChange={(e) => setAiTools(e.target.value)} 
                  className={`mt-2 ${inputClass} py-2 text-sm`} 
                />
              )}
            </div>

            <input type="text" placeholder={t.title.ko} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} maxLength={50} />
            <textarea rows={5} placeholder={t.content.ko} value={content} onChange={(e) => setContent(e.target.value)} className={`${inputClass} resize-none`} />

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3 rounded-xl font-bold border transition-colors hover:bg-gray-100 dark:hover:bg-white/10" style={{ borderColor: 'var(--card-border)', color: 'var(--text-sub)' }}>취소</button>
              <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md">{t.submit.ko}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}