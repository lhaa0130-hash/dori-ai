"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { TEXTS } from "@/constants/texts";
import { CommunityPost, CommunityTag } from "./CommunityCard";
import { BANNED_WORDS } from "@/constants/bannedWords";
import { AiCreationType, AiMeta } from "@/types/content";
import RichTextEditor from "./RichTextEditor";
import { addUserScore } from "@/lib/userProfile";

const CATEGORIES = [
  { value: "잡담" as CommunityTag, label: "☕ 잡담", icon: "☕" },
  { value: "질문" as CommunityTag, label: "❓ 질문", icon: "❓" },
  { value: "정보" as CommunityTag, label: "💡 정보", icon: "💡" },
  { value: "자랑" as CommunityTag, label: "✨ 자랑", icon: "✨" },
];

interface CommunityFormProps {
  onAddPost: (newPost: CommunityPost) => void;
}

export default function CommunityForm({ onAddPost }: CommunityFormProps) {
  const { data: session } = useSession();
  const user = session?.user || null;
  const t = TEXTS.communityPage.form;
  const tErr = TEXTS.communityPage.errors;

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<CommunityTag>("잡담");

  // 👇 [추가] AI 메타데이터 상태
  const [creationType, setCreationType] = useState<AiCreationType>("human_only");
  const [aiTools, setAiTools] = useState(""); // 입력받을 텍스트

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // HTML 태그 제거한 순수 텍스트로 검증
    const textContent = content.replace(/<[^>]*>/g, '').trim();

    if (!title || title.trim().length < 1) { 
      alert("제목을 입력해주세요."); 
      return; 
    }
    
    const combinedText = title + textContent;
    if (BANNED_WORDS.some((word) => combinedText.includes(word))) { 
      alert(tErr.banned.ko); 
      return; 
    }

    const newPost: CommunityPost = {
      id: Date.now(),
      nickname: user?.name || user?.email?.split('@')[0] || "익명", // 사용자 프로필 아이디 사용
      title,
      content, // HTML 형식으로 저장
      tag,
      likes: 0,
      createdAt: new Date().toISOString(),
    };

    onAddPost(newPost);
    
    // 글 작성 시 점수 증가
    if (user?.email) {
      addUserScore(user.email, "post");
    }
    
    // 초기화
    setTitle(""); 
    setContent(""); 
    setTag("잡담");
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
            
            {/* 카테고리 선택 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>카테고리</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setTag(cat.value)}
                    className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                      tag === cat.value 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-[var(--bg-soft)] border-[var(--card-border)] text-[var(--text-main)] hover:border-blue-500'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 제목 */}
            <input 
              type="text" 
              placeholder={t.title.ko} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className={inputClass} 
              maxLength={100}
            />

            {/* 리치 텍스트 에디터 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>내용</label>
                <div className="text-xs" style={{ color: 'var(--text-sub)' }}>
                  💡 <strong>폰트 설정:</strong> 에디터 상단 툴바에서 폰트 크기, 색상, 굵기 등을 설정할 수 있습니다
                </div>
              </div>
              <RichTextEditor 
                value={content} 
                onChange={setContent}
                placeholder="내용을 입력하세요. 에디터 상단 툴바에서 폰트, 색상, 이미지 등을 추가할 수 있습니다."
              />
            </div>

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