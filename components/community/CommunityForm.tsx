"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TEXTS } from "@/constants/texts";
import { CommunityPost, CommunityTag } from "./CommunityCard";
import { BANNED_WORDS } from "@/constants/bannedWords";
import { AiCreationType, AiMeta } from "@/types/content";

interface CommunityFormProps {
  onAddPost: (newPost: CommunityPost) => void;
  initialData?: CommunityPost | null; // 수정 모드용 초기 데이터
  onCancel?: () => void; // 수정 취소
  onUpdate?: (updatedPost: CommunityPost) => void; // 수정 핸들러
}

export default function CommunityForm({ onAddPost, initialData, onCancel, onUpdate }: CommunityFormProps) {
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = TEXTS.communityPage.form;
  const tErr = TEXTS.communityPage.errors;

  const [mounted, setMounted] = useState(false);
  const isEditMode = !!initialData;
  const [isOpen, setIsOpen] = useState(isEditMode); // 수정 모드면 자동으로 열림
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<CommunityTag>("잡담");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI 메타데이터 상태
  const [creationType, setCreationType] = useState<AiCreationType>("human_only");
  const [aiTools, setAiTools] = useState("");

  // 텍스트 포맷팅 상태
  const [fontSize, setFontSize] = useState("16");
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  // 로그인한 사용자의 아이디 (localStorage에서 설정된 닉네임 우선 사용)
  const [nickname, setNickname] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // localStorage에서 설정된 닉네임 가져오기
  useEffect(() => {
    if (session?.user?.email) {
      const savedName = localStorage.getItem(`dori_user_name_${session.user.email}`);
      if (savedName) {
        setNickname(savedName);
      } else {
        setNickname(session.user?.name || session.user?.email?.split('@')[0] || "");
      }
    } else {
      setNickname("");
    }
  }, [session?.user?.email, session?.user?.name]);

  // 수정 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setTag(initialData.tag);
      setCreationType(initialData.aiMeta?.creationType || "human_only");
      setAiTools(initialData.aiMeta?.tools?.join(", ") || "");
      // 이미지는 수정 시에는 초기화 (필요시 추가 구현)
      setImages([]);
    }
  }, [initialData]);

  // 로그인하지 않았으면 로그인 페이지로 리디렉션
  const handleOpenForm = () => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    setIsOpen(true);
  };

  const isDark = mounted && theme === 'dark';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setImages((prev) => [...prev, base64String]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + after;
    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    
    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const applyFormatting = (command: string, value?: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    switch (command) {
      case 'bold':
        insertText('<strong>', '</strong>');
        break;
      case 'italic':
        insertText('<em>', '</em>');
        break;
      case 'underline':
        insertText('<u>', '</u>');
        break;
      case 'strike':
        insertText('<s>', '</s>');
        break;
      case 'code':
        insertText('<code>', '</code>');
        break;
      case 'link':
        const url = prompt('링크 URL을 입력하세요:');
        if (url) {
          const linkText = selectedText || '링크 텍스트';
          insertText(`<a href="${url}" target="_blank">`, '</a>');
          if (!selectedText) {
            setTimeout(() => {
              const newStart = textarea.selectionStart - linkText.length;
              textarea.setSelectionRange(newStart, textarea.selectionStart);
            }, 0);
          }
        }
        break;
      case 'quote':
        insertText('<blockquote>', '</blockquote>');
        break;
      case 'list':
        const listItems = selectedText.split('\n').filter(item => item.trim());
        if (listItems.length > 0) {
          const listHtml = '<ul>\n' + listItems.map(item => `  <li>${item}</li>`).join('\n') + '\n</ul>';
          const newContent = content.substring(0, start) + listHtml + content.substring(end);
          setContent(newContent);
        } else {
          insertText('<ul>\n  <li>', '</li>\n</ul>');
        }
        break;
      case 'orderedList':
        const orderedItems = selectedText.split('\n').filter(item => item.trim());
        if (orderedItems.length > 0) {
          const listHtml = '<ol>\n' + orderedItems.map(item => `  <li>${item}</li>`).join('\n') + '\n</ol>';
          const newContent = content.substring(0, start) + listHtml + content.substring(end);
          setContent(newContent);
        } else {
          insertText('<ol>\n  <li>', '</li>\n</ol>');
        }
        break;
      case 'heading':
        const level = value || '2';
        insertText(`<h${level}>`, `</h${level}>`);
        break;
      case 'fontSize':
        if (selectedText) {
          insertText(`<span style="font-size: ${value}">`, '</span>');
        }
        break;
      case 'color':
        insertText(`<span style="color: ${value}">`, '</span>');
        break;
      case 'backgroundColor':
        insertText(`<span style="background-color: ${value}">`, '</span>');
        break;
      case 'align':
        insertText(`<div style="text-align: ${value}">`, '</div>');
        break;
      default:
        return;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (title.length < 1 || content.length < 5) { 
      alert(tErr.short.ko); 
      return; 
    }
    const combinedText = title + content + nickname;
    if (BANNED_WORDS.some((word) => combinedText.includes(word))) { 
      alert(tErr.banned.ko); 
      return; 
    }

    // 이미지를 content에 포함
    let finalContent = content;
    if (images.length > 0) {
      const imageHtml = images.map(img => `<img src="${img}" alt="업로드된 이미지" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`).join('\n');
      finalContent = content + '\n\n' + imageHtml;
    }

    // AI 메타데이터 구성
    const aiMeta: AiMeta | undefined = creationType !== "human_only" ? {
      creationType,
      tools: aiTools ? aiTools.split(",").map(t => t.trim()) : undefined
    } : undefined;

    if (isEditMode && initialData && onUpdate) {
      // 수정 모드
      const updatedPost: CommunityPost = {
        ...initialData,
        title,
        content: finalContent,
        tag,
        aiMeta,
        // authorId와 createdAt은 유지
      };
      onUpdate(updatedPost);
      if (onCancel) onCancel();
    } else {
      // 새로 작성 모드
      const newPost: CommunityPost = {
        id: Date.now(),
        nickname: nickname || "익명",
        title,
        content: finalContent,
        tag,
        likes: 0,
        createdAt: new Date().toISOString(),
        aiMeta,
      };

      onAddPost(newPost);

      // 게시글 작성 미션 진행도 업데이트
      if (session?.user?.email) {
        import('@/lib/dailyMissions').then(({ updateCountMission }) => {
          updateCountMission('WRITE_POST');
        });
      }
    }
    
    // 초기화
    setTitle(""); 
    setContent(""); 
    setTag("잡담");
    setCreationType("human_only"); 
    setAiTools("");
    setImages([]);
    setIsOpen(false);
  };

  const baseInputClass = "w-full px-3 py-2 rounded-md border outline-none transition-all focus:ring-1 focus:ring-blue-500/20";
  const inputClass = `${baseInputClass} ${
    isDark 
      ? 'bg-white/2 border-white/6 text-white placeholder:text-white/30' 
      : 'bg-white border-gray-200/60 text-gray-900 placeholder:text-gray-400'
  }`;

  // 로그인하지 않았으면 글 작성 버튼 비활성화
  if (status === "unauthenticated") {
    return (
      <div className="mb-10 w-full max-w-4xl mx-auto">
        <button 
          onClick={() => router.push("/login")}
          className="w-full py-4 rounded-xl border border-dashed text-base font-medium hover:opacity-80 transition-all flex items-center justify-center gap-2"
          style={{ 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          }}
        >
          <span>로그인 후 글을 작성할 수 있습니다</span>
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mb-10 w-full max-w-4xl mx-auto">
        <div 
          className="w-full py-4 rounded-xl border border-dashed text-base font-medium text-center"
          style={{ 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          }}
        >
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 w-full max-w-4xl mx-auto">
      {!isOpen ? (
        <button 
          onClick={handleOpenForm}
          className="w-full py-4 rounded-xl border border-dashed text-base font-medium hover:opacity-80 transition-all flex items-center justify-center gap-2"
          style={{ 
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          }}
        >
          <span>새 글 작성하기</span>
        </button>
      ) : (
        <div className="animate-[fadeInUp_0.3s_ease-out]">
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-base font-medium"
              style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }}
            >
              {isEditMode ? "✏️ 글 수정" : "글쓰기"}
            </h3>
            <button
              onClick={() => {
                setIsOpen(false);
                if (isEditMode && onCancel) onCancel();
              }}
              className="text-lg hover:opacity-50 transition-opacity"
              style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* 카테고리 */}
            <select 
              value={tag} 
              onChange={(e) => setTag(e.target.value as CommunityTag)} 
              className={`${inputClass} cursor-pointer`}
            >
              <option value="잡담">카테고리(선택)</option>
              <option value="질문">질문</option>
              <option value="정보">정보</option>
              <option value="자랑">자랑</option>
              <option value="잡담">잡담</option>
            </select>

            {/* 제목 */}
            <input 
              type="text" 
              placeholder="제목" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className={`${inputClass}`} 
              maxLength={50} 
            />

            {/* 텍스트 포맷팅 툴바 */}
            <div 
              className="flex items-center gap-1 p-2 rounded-md border flex-wrap"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* 기본 포맷팅 */}
              <button
                type="button"
                onClick={() => applyFormatting('bold')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs font-bold"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="굵게 (Bold) - 텍스트를 굵게 표시합니다"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('italic')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs italic"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="기울임 (Italic) - 텍스트를 기울여 표시합니다"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('underline')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs underline"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="밑줄 (Underline) - 텍스트에 밑줄을 그립니다"
              >
                U
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('strike')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  textDecoration: 'line-through',
                }}
                title="취소선 (Strikethrough) - 텍스트에 취소선을 그립니다"
              >
                S
              </button>

              <div className="w-px h-4 mx-0.5" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

              {/* 글씨 크기 */}
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={fontSize.replace('px', '')}
                  onChange={(e) => {
                    const size = e.target.value ? `${e.target.value}px` : '16px';
                    setFontSize(size);
                    if (textareaRef.current && textareaRef.current.selectionStart !== textareaRef.current.selectionEnd) {
                      applyFormatting('fontSize', size);
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseInt(e.target.value) < 8) {
                      setFontSize('16');
                    } else if (parseInt(e.target.value) > 72) {
                      setFontSize('72');
                    }
                  }}
                  className={`w-14 px-2 py-1 pr-6 rounded border text-xs ${inputClass}`}
                  placeholder="16"
                  title="글씨 크기 (px)"
                />
                <span 
                  className="absolute right-2 text-xs pointer-events-none"
                  style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}
                >
                  px
                </span>
              </div>

              <div className="w-px h-4 mx-0.5" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

              {/* 리스트 */}
              <button
                type="button"
                onClick={() => applyFormatting('list')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="순서 없는 목록 (Bullet List) - 불릿 포인트 목록을 만듭니다"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('orderedList')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="순서 있는 목록 (Numbered List) - 번호가 있는 목록을 만듭니다"
              >
                1.
              </button>

              <div className="w-px h-4 mx-0.5" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

              {/* 정렬 */}
              <button
                type="button"
                onClick={() => applyFormatting('align', 'left')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="왼쪽 정렬 - 텍스트를 왼쪽으로 정렬합니다"
              >
                ⬅
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('align', 'center')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="가운데 정렬 - 텍스트를 가운데로 정렬합니다"
              >
                ⬌
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('align', 'right')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="오른쪽 정렬 - 텍스트를 오른쪽으로 정렬합니다"
              >
                ➡
              </button>

              <div className="w-px h-4 mx-0.5" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

              {/* 링크 & 인용 */}
              <button
                type="button"
                onClick={() => applyFormatting('link')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="링크 (Link) - 선택한 텍스트에 링크를 추가합니다"
              >
                링크
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('quote')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="인용구 (Quote) - 텍스트를 인용구로 표시합니다"
              >
                "
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('code')}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="코드 (Code) - 텍스트를 코드로 표시합니다"
              >
                {'</>'}
              </button>

              <div className="w-px h-4 mx-0.5" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

              {/* 색상 */}
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  if (textareaRef.current && textareaRef.current.selectionStart !== textareaRef.current.selectionEnd) {
                    applyFormatting('color', e.target.value);
                  }
                }}
                className="w-8 h-7 rounded border cursor-pointer"
                style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }}
                title="글자 색상 - 텍스트 색상을 변경합니다"
              />
              <input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  setBgColor(e.target.value);
                  if (textareaRef.current && textareaRef.current.selectionStart !== textareaRef.current.selectionEnd) {
                    applyFormatting('backgroundColor', e.target.value);
                  }
                }}
                className="w-8 h-7 rounded border cursor-pointer"
                style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }}
                title="배경 색상 - 텍스트 배경 색상을 변경합니다"
              />

              <div className="w-px h-4 mx-0.5" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

              {/* 이미지 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded transition-all hover:opacity-60 text-xs"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}
                title="이미지 추가 - 이미지를 업로드합니다"
              >
                이미지
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* 내용 입력 */}
            <textarea 
              ref={textareaRef}
              rows={14} 
              name="content"
              placeholder={t.content.ko} 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              className={`${inputClass} resize-none text-sm leading-relaxed`}
            />

            {/* 업로드된 이미지 미리보기 */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img} 
                      alt={`업로드 ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border"
                      style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* AI 사용 여부 선택 */}
            <div 
              className="flex flex-col gap-2 p-2.5 rounded-md border"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
              }}
            >
              <span 
                className="text-xs font-medium"
                style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
              >
                AI 사용 여부
              </span>
              <div className="flex gap-2.5 text-xs flex-wrap">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="creationType" 
                    value="human_only" 
                    checked={creationType === "human_only"} 
                    onChange={() => setCreationType("human_only")}
                    className="cursor-pointer"
                  />
                  <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>사람만</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="creationType" 
                    value="ai_assisted" 
                    checked={creationType === "ai_assisted"} 
                    onChange={() => setCreationType("ai_assisted")}
                    className="cursor-pointer"
                  />
                  <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>AI 보조</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="creationType" 
                    value="ai_generated" 
                    checked={creationType === "ai_generated"} 
                    onChange={() => setCreationType("ai_generated")}
                    className="cursor-pointer"
                  />
                  <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>AI 생성</span>
                </label>
              </div>
              {creationType !== "human_only" && (
                <input 
                  type="text" 
                  placeholder="사용 도구 (예: ChatGPT, Gemini)" 
                  value={aiTools} 
                  onChange={(e) => setAiTools(e.target.value)} 
                  className={`${inputClass} py-2 text-xs`} 
                />
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 mt-0.5">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="flex-1 py-2 rounded-md font-medium border transition-all hover:opacity-70"
                style={{ 
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2 rounded-md font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-85 transition-all"
              >
                {isEditMode ? "수정하기" : t.submit.ko}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
