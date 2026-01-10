"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";

interface ProfileImageSelectorProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
}

// 사이트 제공 아바타 목록
const AVATAR_OPTIONS = [
  // 미니멀
  { id: "minimal-1", emoji: "👤", category: "미니멀" },
  { id: "minimal-2", emoji: "👥", category: "미니멀" },
  { id: "minimal-3", emoji: "🧑", category: "미니멀" },
  { id: "minimal-4", emoji: "👨", category: "미니멀" },
  { id: "minimal-5", emoji: "👩", category: "미니멀" },
  { id: "minimal-6", emoji: "🧑‍💼", category: "미니멀" },
  { id: "minimal-7", emoji: "🧑‍🎓", category: "미니멀" },
  { id: "minimal-8", emoji: "🧑‍🔬", category: "미니멀" },
  { id: "minimal-9", emoji: "🧑‍🎨", category: "미니멀" },
  { id: "minimal-10", emoji: "🧑‍💻", category: "미니멀" },
  
  // 캐릭터
  { id: "char-1", emoji: "🤖", category: "캐릭터" },
  { id: "char-2", emoji: "🎭", category: "캐릭터" },
  { id: "char-3", emoji: "🦄", category: "캐릭터" },
  { id: "char-4", emoji: "🐱", category: "캐릭터" },
  { id: "char-5", emoji: "🐼", category: "캐릭터" },
  { id: "char-6", emoji: "🐻", category: "캐릭터" },
  { id: "char-7", emoji: "🐨", category: "캐릭터" },
  { id: "char-8", emoji: "🦊", category: "캐릭터" },
  { id: "char-9", emoji: "🐰", category: "캐릭터" },
  { id: "char-10", emoji: "🐯", category: "캐릭터" },
  { id: "char-11", emoji: "🦁", category: "캐릭터" },
  { id: "char-12", emoji: "🐸", category: "캐릭터" },
  { id: "char-13", emoji: "🐷", category: "캐릭터" },
  { id: "char-14", emoji: "🐶", category: "캐릭터" },
  { id: "char-15", emoji: "🦉", category: "캐릭터" },
  
  // 추상
  { id: "abstract-1", emoji: "✨", category: "추상" },
  { id: "abstract-2", emoji: "🌟", category: "추상" },
  { id: "abstract-3", emoji: "💫", category: "추상" },
  { id: "abstract-4", emoji: "🔮", category: "추상" },
  { id: "abstract-5", emoji: "🎨", category: "추상" },
  { id: "abstract-6", emoji: "🎭", category: "추상" },
  { id: "abstract-7", emoji: "🎪", category: "추상" },
  { id: "abstract-8", emoji: "🎬", category: "추상" },
  { id: "abstract-9", emoji: "🎯", category: "추상" },
  { id: "abstract-10", emoji: "🎲", category: "추상" },
  
  // 자연
  { id: "nature-1", emoji: "🌺", category: "자연" },
  { id: "nature-2", emoji: "🌻", category: "자연" },
  { id: "nature-3", emoji: "🌷", category: "자연" },
  { id: "nature-4", emoji: "🌹", category: "자연" },
  { id: "nature-5", emoji: "🌵", category: "자연" },
  { id: "nature-6", emoji: "🌴", category: "자연" },
  { id: "nature-7", emoji: "🌲", category: "자연" },
  { id: "nature-8", emoji: "🍀", category: "자연" },
  { id: "nature-9", emoji: "🌿", category: "자연" },
  { id: "nature-10", emoji: "🌾", category: "자연" },
  
  // 음식
  { id: "food-1", emoji: "🍎", category: "음식" },
  { id: "food-2", emoji: "🍊", category: "음식" },
  { id: "food-3", emoji: "🍋", category: "음식" },
  { id: "food-4", emoji: "🍌", category: "음식" },
  { id: "food-5", emoji: "🍉", category: "음식" },
  { id: "food-6", emoji: "🍇", category: "음식" },
  { id: "food-7", emoji: "🍓", category: "음식" },
  { id: "food-8", emoji: "🍑", category: "음식" },
  { id: "food-9", emoji: "🥝", category: "음식" },
  { id: "food-10", emoji: "🍒", category: "음식" },
  
  // 스포츠 & 활동
  { id: "sports-1", emoji: "⚽", category: "스포츠" },
  { id: "sports-2", emoji: "🏀", category: "스포츠" },
  { id: "sports-3", emoji: "🏈", category: "스포츠" },
  { id: "sports-4", emoji: "⚾", category: "스포츠" },
  { id: "sports-5", emoji: "🎾", category: "스포츠" },
  { id: "sports-6", emoji: "🏐", category: "스포츠" },
  { id: "sports-7", emoji: "🏓", category: "스포츠" },
  { id: "sports-8", emoji: "🏸", category: "스포츠" },
  { id: "sports-9", emoji: "🥊", category: "스포츠" },
  { id: "sports-10", emoji: "🎯", category: "스포츠" },
  
  // 음악 & 예술
  { id: "music-1", emoji: "🎵", category: "음악" },
  { id: "music-2", emoji: "🎶", category: "음악" },
  { id: "music-3", emoji: "🎤", category: "음악" },
  { id: "music-4", emoji: "🎧", category: "음악" },
  { id: "music-5", emoji: "🎸", category: "음악" },
  { id: "music-6", emoji: "🎹", category: "음악" },
  { id: "music-7", emoji: "🥁", category: "음악" },
  { id: "music-8", emoji: "🎺", category: "음악" },
  { id: "music-9", emoji: "🎻", category: "음악" },
  { id: "music-10", emoji: "🎼", category: "음악" },
  
  // 기술 & 과학
  { id: "tech-1", emoji: "💻", category: "기술" },
  { id: "tech-2", emoji: "📱", category: "기술" },
  { id: "tech-3", emoji: "⌚", category: "기술" },
  { id: "tech-4", emoji: "📷", category: "기술" },
  { id: "tech-5", emoji: "🎥", category: "기술" },
  { id: "tech-6", emoji: "🔬", category: "기술" },
  { id: "tech-7", emoji: "🔭", category: "기술" },
  { id: "tech-8", emoji: "⚗️", category: "기술" },
  { id: "tech-9", emoji: "🧪", category: "기술" },
  { id: "tech-10", emoji: "🔧", category: "기술" },
  
  // 여행 & 장소
  { id: "travel-1", emoji: "✈️", category: "여행" },
  { id: "travel-2", emoji: "🚀", category: "여행" },
  { id: "travel-3", emoji: "🚢", category: "여행" },
  { id: "travel-4", emoji: "🚗", category: "여행" },
  { id: "travel-5", emoji: "🚲", category: "여행" },
  { id: "travel-6", emoji: "🏖️", category: "여행" },
  { id: "travel-7", emoji: "🏔️", category: "여행" },
  { id: "travel-8", emoji: "🌋", category: "여행" },
  { id: "travel-9", emoji: "🗻", category: "여행" },
  { id: "travel-10", emoji: "🏕️", category: "여행" },
  
  // 감정 & 표현
  { id: "emotion-1", emoji: "😊", category: "감정" },
  { id: "emotion-2", emoji: "😎", category: "감정" },
  { id: "emotion-3", emoji: "🤩", category: "감정" },
  { id: "emotion-4", emoji: "😍", category: "감정" },
  { id: "emotion-5", emoji: "🥳", category: "감정" },
  { id: "emotion-6", emoji: "😇", category: "감정" },
  { id: "emotion-7", emoji: "🤗", category: "감정" },
  { id: "emotion-8", emoji: "😌", category: "감정" },
  { id: "emotion-9", emoji: "🤔", category: "감정" },
  { id: "emotion-10", emoji: "😏", category: "감정" },
];

export default function ProfileImageSelector({ currentImageUrl, onImageChange }: ProfileImageSelectorProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    // 파일 타입 체크
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      alert("jpg, png, webp 형식만 지원합니다.");
      return;
    }

    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageChange(result);
      setIsOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSelect = (avatarId: string) => {
    const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
    if (avatar) {
      // 이모지를 데이터 URL로 변환 (간단한 방법)
      onImageChange(`avatar:${avatarId}`);
      setIsOpen(false);
    }
  };

  const categories = Array.from(new Set(AVATAR_OPTIONS.map(a => a.category)));

  const modalContent = isOpen && mounted ? (
    <>
      {/* 모달 외부 클릭 시 닫기 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => setIsOpen(false)}
      />
      
      {/* 모달 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "520px",
          maxWidth: "calc(100vw - 40px)",
          maxHeight: "calc(100vh - 60px)",
          background: isDark ? "rgba(0, 0, 0, 0.95)" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "#e5e5e7"}`,
          borderRadius: "1.25rem",
          padding: "1.5rem",
          boxShadow: isDark
            ? "0 20px 60px rgba(0, 0, 0, 0.8)"
            : "0 20px 60px rgba(0, 0, 0, 0.2)",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: "1rem", flexShrink: 0 }}>
          <h3 style={{
            fontSize: "1.125rem",
            fontWeight: "700",
            color: isDark ? "#ffffff" : "#1d1d1f",
            marginBottom: "0.375rem",
          }}>
            프로필 이미지 선택
          </h3>
          <p style={{
            fontSize: "0.8125rem",
            color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
          }}>
            업로드하거나 아바타를 선택하세요
          </p>
        </div>

        {/* 파일 업로드 버튼 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "0.5rem",
            background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"}`,
            color: isDark ? "#ffffff" : "#1d1d1f",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: "600",
            marginBottom: "0.875rem",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
          }}
        >
          📷 이미지 업로드 (최대 2MB)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        {/* 카테고리 필터 */}
        <div style={{ 
          display: "flex", 
          gap: "0.5rem", 
          marginBottom: "1rem", 
          flexWrap: "wrap",
          flexShrink: 0,
          overflowX: "hidden",
          overflowY: "hidden",
          width: "100%",
          boxSizing: "border-box",
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: "0.375rem 0.625rem",
              borderRadius: "0.5rem",
              background: selectedCategory === null
                ? (isDark ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.1)")
                : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"),
              border: `1px solid ${selectedCategory === null
                ? (isDark ? "rgba(96, 165, 250, 0.4)" : "rgba(37, 99, 235, 0.3)")
                : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)")}`,
              color: isDark ? "#ffffff" : "#1d1d1f",
              cursor: "pointer",
              fontSize: "0.6875rem",
              fontWeight: "600",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (selectedCategory !== null) {
                e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCategory !== null) {
                e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";
              }
            }}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "0.375rem 0.625rem",
                borderRadius: "0.5rem",
                background: selectedCategory === cat
                  ? (isDark ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.1)")
                  : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"),
                border: `1px solid ${selectedCategory === cat
                  ? (isDark ? "rgba(96, 165, 250, 0.4)" : "rgba(37, 99, 235, 0.3)")
                  : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)")}`,
                color: isDark ? "#ffffff" : "#1d1d1f",
                cursor: "pointer",
                fontSize: "0.6875rem",
                fontWeight: "600",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 아바타 그리드 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem",
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "0.5rem",
          minHeight: "300px",
          maxHeight: "450px",
          width: "100%",
          boxSizing: "border-box",
          // 스크롤바 스타일링 (웹킷 브라우저)
          scrollbarWidth: "thin",
          scrollbarColor: isDark ? "rgba(255, 255, 255, 0.2) transparent" : "rgba(0, 0, 0, 0.2) transparent",
        }}
        className="custom-scrollbar"
        >
          {AVATAR_OPTIONS
            .filter(avatar => !selectedCategory || avatar.category === selectedCategory)
            .map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.id)}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: "0.75rem",
                  background: currentImageUrl === `avatar:${avatar.id}`
                    ? (isDark ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.2)")
                    : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"),
                  border: `2px solid ${currentImageUrl === `avatar:${avatar.id}`
                    ? (isDark ? "#60a5fa" : "#2563eb")
                    : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)")}`,
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  padding: "0.375rem",
                  boxSizing: "border-box",
                  minWidth: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.background = isDark
                    ? "rgba(96, 165, 250, 0.2)"
                    : "rgba(37, 99, 235, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background = currentImageUrl === `avatar:${avatar.id}`
                    ? (isDark ? "rgba(96, 165, 250, 0.3)" : "rgba(37, 99, 235, 0.2)")
                    : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)");
                }}
              >
                {avatar.emoji}
              </button>
            ))}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={() => setIsOpen(false)}
          style={{
            width: "100%",
            marginTop: "1rem",
            padding: "0.5rem",
            borderRadius: "0.5rem",
            background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"}`,
            color: isDark ? "#ffffff" : "#1d1d1f",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: "600",
            fontFamily: "inherit",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
          }}
        >
          닫기
        </button>
      </div>
    </>
  ) : null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          border: `3px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"}`,
          background: currentImageUrl?.startsWith("avatar:")
            ? isDark
              ? "linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(168, 85, 247, 0.2))"
              : "linear-gradient(135deg, #eef6ff, #f3e8ff)"
            : currentImageUrl
            ? `url(${currentImageUrl}) center/cover`
            : isDark
            ? "linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(168, 85, 247, 0.2))"
            : "linear-gradient(135deg, #eef6ff, #f3e8ff)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: currentImageUrl?.startsWith("avatar:") ? "3rem" : "2.5rem",
          fontWeight: "700",
          color: isDark ? "#60a5fa" : "#2563eb",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = isDark
            ? "0 8px 24px rgba(96, 165, 250, 0.4)"
            : "0 8px 24px rgba(37, 99, 235, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {currentImageUrl?.startsWith("avatar:") ? (
          AVATAR_OPTIONS.find(a => a.id === currentImageUrl.replace("avatar:", ""))?.emoji || "👤"
        ) : currentImageUrl ? null : "👤"}
      </button>
      
      {/* 편집 아이콘 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)",
          border: `2px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "14px",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        ✏️
      </div>

      {/* 모달을 Portal로 렌더링 */}
      {mounted && createPortal(modalContent, document.body)}
    </div>
  );
}



