"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import CommunityForm from "@/components/community/CommunityForm";
import { CommunityPost } from "@/components/community/CommunityCard";

export default function CommunityClient() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // localStorage에서 글 불러오기
    if (typeof window !== 'undefined') {
      const savedPosts = localStorage.getItem("dori_community_posts");
      if (savedPosts) {
        try {
          const parsedPosts: CommunityPost[] = JSON.parse(savedPosts);
          // 첫 번째 글 제거 (한 번만 실행)
          const hasRemovedFirst = sessionStorage.getItem("dori_removed_first_community_post");
          if (!hasRemovedFirst && parsedPosts.length > 0) {
            parsedPosts.shift();
            localStorage.setItem("dori_community_posts", JSON.stringify(parsedPosts));
            sessionStorage.setItem("dori_removed_first_community_post", "true");
          }
          setPosts(parsedPosts);
          
          // 수정 모드 확인 (posts가 로드된 후)
          const editPostId = sessionStorage.getItem('dori_edit_community_post');
          if (editPostId) {
            const postId = parseInt(editPostId);
            const postToEdit = parsedPosts.find(p => p.id === postId);
            if (postToEdit) {
              setEditingPost(postToEdit);
              sessionStorage.removeItem('dori_edit_community_post');
              // 폼으로 스크롤
              setTimeout(() => {
                const formElement = document.querySelector('[data-community-form]');
                if (formElement) {
                  formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }
          }
        } catch (e) {
          console.error('Failed to parse posts:', e);
        }
      }
    }
  }, []);

  const isDark = mounted && theme === 'dark';

  const categories = [
    { id: '전체', label: '전체' },
    { id: '질문', label: '질문' },
    { id: '정보', label: '정보' },
    { id: '자랑', label: '자랑' },
    { id: '잡담', label: '잡담' },
  ];

  // 작성자 ID 생성 및 관리 유틸리티
  const getAuthorId = (): string => {
    if (typeof window === 'undefined') return '';
    
    let authorId = sessionStorage.getItem('dori_community_author_id');
    if (!authorId) {
      authorId = crypto.randomUUID();
      sessionStorage.setItem('dori_community_author_id', authorId);
    }
    return authorId;
  };

  // 본인이 작성한 커뮤니티 글 ID 목록 가져오기
  const getMyPostIds = (): Set<number> => {
    if (typeof window === 'undefined') return new Set();
    
    const saved = localStorage.getItem('dori_my_community_posts');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  };

  // 본인이 작성한 커뮤니티 글 ID 목록에 추가
  const addMyPostId = (id: number) => {
    if (typeof window === 'undefined') return;
    
    const myIds = getMyPostIds();
    myIds.add(id);
    localStorage.setItem('dori_my_community_posts', JSON.stringify(Array.from(myIds)));
  };

  // 본인이 작성한 커뮤니티 글 ID 목록에서 제거
  const removeMyPostId = (id: number) => {
    if (typeof window === 'undefined') return;
    
    const myIds = getMyPostIds();
    myIds.delete(id);
    localStorage.setItem('dori_my_community_posts', JSON.stringify(Array.from(myIds)));
  };

  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  // 작성자 ID 가져오기
  const authorId = mounted ? getAuthorId() : '';
  const myPostIds = mounted ? getMyPostIds() : new Set<number>();

  // 본인 글인지 확인
  const isOwner = (post: CommunityPost): boolean => {
    if (!mounted) return false;
    
    const currentAuthorId = authorId || getAuthorId();
    const currentMyPostIds = myPostIds.size > 0 ? myPostIds : getMyPostIds();
    
    // authorId가 있으면 authorId로 확인, 없으면 myPostIds로 확인 (기존 데이터 호환성)
    if (post.authorId) {
      return post.authorId === currentAuthorId;
    }
    return currentMyPostIds.has(post.id);
  };

  const handleAddPost = (newPost: CommunityPost) => {
    // 작성자 ID 추가 (mounted가 false일 때를 대비)
    const currentAuthorId = mounted ? authorId : getAuthorId();
    const postWithAuthor: CommunityPost = {
      ...newPost,
      authorId: currentAuthorId,
    };
    
    const updated = [postWithAuthor, ...posts];
    setPosts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem("dori_community_posts", JSON.stringify(updated));
      // 본인 작성 목록에 추가
      addMyPostId(newPost.id);
    }
  };

  const handleUpdatePost = (updatedPost: CommunityPost) => {
    // authorId 유지 (수정 시에도 작성자 정보 보존)
    const currentAuthorId = mounted ? authorId : getAuthorId();
    const postToUpdate = posts.find(p => p.id === updatedPost.id);
    const updated = posts.map(post => 
      post.id === updatedPost.id 
        ? { ...updatedPost, authorId: postToUpdate?.authorId || currentAuthorId }
        : post
    );
    setPosts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem("dori_community_posts", JSON.stringify(updated));
    }
    setEditingPost(null);
  };

  const handleDeletePost = (id: number) => {
    const updated = posts.filter(post => post.id !== id);
    setPosts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem("dori_community_posts", JSON.stringify(updated));
      removeMyPostId(id);
    }
  };

  const handleEditPost = (post: CommunityPost) => {
    setEditingPost(post);
    // 폼으로 스크롤
    setTimeout(() => {
      const formElement = document.querySelector('[data-community-form]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // 좋아요 핸들러 - 작성자 포인트 증가 포함
  const handleLike = (postId: number) => {
    if (typeof window === 'undefined') return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // 좋아요 상태 확인
    const likedPosts = JSON.parse(localStorage.getItem('dori_liked_community_posts') || '[]');
    const isLiked = likedPosts.includes(postId);
    const newIsLiked = !isLiked;

    // 좋아요 상태 업데이트
    if (newIsLiked) {
      if (!likedPosts.includes(postId)) {
        likedPosts.push(postId);
      }
    } else {
      const index = likedPosts.indexOf(postId);
      if (index > -1) {
        likedPosts.splice(index, 1);
      }
    }
    localStorage.setItem('dori_liked_community_posts', JSON.stringify(likedPosts));

    // 좋아요 수 업데이트
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        const newLikes = newIsLiked ? p.likes + 1 : Math.max(0, p.likes - 1);
        
        // 좋아요를 누를 때만 작성자 포인트 증가
        if (newIsLiked && post.nickname) {
          // 모든 사용자 프로필에서 작성자 찾기
          const allKeys = Object.keys(localStorage);
          for (const key of allKeys) {
            if (key.startsWith('dori_profile_')) {
              try {
                const profile = JSON.parse(localStorage.getItem(key) || '{}');
                if (profile.nickname === post.nickname) {
                  // 포인트 증가
                  const updatedProfile = {
                    ...profile,
                    point: (profile.point || 0) + 1,
                  };
                  localStorage.setItem(key, JSON.stringify(updatedProfile));
                  break;
                }
              } catch (e) {
                console.error('Failed to parse profile:', e);
              }
            }
          }
        }
        
        return { ...p, likes: newLikes };
      }
      return p;
    });
    
    setPosts(updatedPosts);
    localStorage.setItem("dori_community_posts", JSON.stringify(updatedPosts));
    
    // 좋아요 미션 진행도 업데이트 (좋아요를 누를 때만)
    if (newIsLiked && session?.user?.email) {
      import('@/lib/dailyMissions').then(({ updateCountMission }) => {
        updateCountMission('LIKE_POST');
      });
    }
  };

  const filteredPosts = activeCategory === "전체" 
    ? posts 
    : posts.filter(post => post.tag === activeCategory);

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 좌측 사이드바 카테고리 필터 */}
      <aside 
        className="fixed left-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <nav className="ml-4 lg:ml-8">
          <div 
            className="flex flex-col gap-2 lg:gap-3 p-3 lg:p-4 rounded-2xl backdrop-blur-xl transition-all duration-500"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              maxHeight: 'calc(90vh - 20px)',
            }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className="group relative flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl transition-all duration-300 text-left whitespace-nowrap"
                style={{
                  backgroundColor: activeCategory === category.id
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
              >
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                    activeCategory === category.id ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: activeCategory === category.id
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                  }}
                />
                <span 
                  className="text-[10px] lg:text-xs font-medium transition-all duration-300"
                  style={{
                    color: activeCategory === category.id
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    transform: activeCategory === category.id ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  {category.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* 배경 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {mounted && theme === "dark" && (
          <>
            <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
            <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}
        {mounted && theme === "light" && (
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), #ffffff',
            }}
          />
        )}
      </div>

      {/* 히어로 섹션 */}
      <section className="relative pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 xl:pl-12 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight leading-tight px-2"
            style={{ 
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Community
          </h1>
          
          {/* 그라데이션 바 */}
          <div 
            className="w-full max-w-2xl mx-auto h-1 sm:h-1.5 mb-4 sm:mb-6 rounded-full overflow-hidden"
            style={{
              boxShadow: isDark 
                ? '0 0 30px rgba(96, 165, 250, 0.4), 0 4px 20px rgba(96, 165, 250, 0.2)'
                : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 15px rgba(37, 99, 235, 0.2)',
            }}
          >
            <div 
              className="gradient-flow h-full rounded-full"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%, #60a5fa 100%)'
                  : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%, #2563eb 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradientFlow 4s linear infinite',
              }}
            />
          </div>

          <p 
            className="text-base sm:text-lg md:text-xl font-medium opacity-70 break-keep leading-relaxed px-4"
            style={{ 
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            자유롭게 질문하고 정보를 공유하는 공간입니다
          </p>
        </div>
      </section>
      
      {/* 모바일/태블릿 카테고리 필터 (상단) */}
      <div 
        className="lg:hidden sticky top-[70px] z-[99] mb-4"
        style={{ 
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="relative overflow-x-auto scrollbar-hide">
          {/* 좌측 그라데이션 인디케이터 */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.98)'}, transparent)`,
            }}
          />
          {/* 우측 그라데이션 인디케이터 */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to left, ${isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.98)'}, transparent)`,
            }}
          />
          <div className="flex gap-2.5 min-w-max px-4 py-3.5">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] flex items-center ${
                  activeCategory === category.id ? 'opacity-100 scale-105' : 'opacity-70'
                }`}
                style={{
                  backgroundColor: activeCategory === category.id 
                    ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)')
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                  color: isDark ? '#ffffff' : '#000000',
                  border: `1px solid ${activeCategory === category.id 
                    ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')
                    : 'transparent'}`,
                  boxShadow: activeCategory === category.id 
                    ? (isDark ? '0 2px 8px rgba(255, 255, 255, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)')
                    : 'none',
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <section 
        id="list"
        className="container max-w-7xl mx-auto px-4 sm:px-6 lg:pl-12 pb-16 sm:pb-24 border-b border-dashed relative" 
        style={{ 
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* 글 쓰기 폼 */}
        <div className="mb-8 sm:mb-12" data-community-form>
          <CommunityForm 
            onAddPost={handleAddPost}
            initialData={editingPost}
            onCancel={() => setEditingPost(null)}
            onUpdate={handleUpdatePost}
          />
        </div>
        
        {/* 글 목록 또는 빈 상태 메시지 */}
        {filteredPosts.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredPosts.map((post) => {
              // HTML 태그 제거하고 텍스트만 추출
              const textContent = post.content.replace(/<[^>]*>/g, '').trim();
              const preview = textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
              
              return (
                <div
                  key={post.id}
                  className="relative p-5 rounded-xl border transition-all hover:shadow-md hover:opacity-90"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <Link
                    href={`/community/${post.id}`}
                    className="block"
                    onClick={(e) => {
                      // 수정/삭제 버튼 영역 클릭 시 링크 동작 방지
                      const target = e.target as HTMLElement;
                      if (target.closest('.edit-delete-buttons')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="px-2.5 py-0.5 text-xs font-medium rounded-md"
                          style={{
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                          }}
                        >
                          {post.tag}
                        </span>
                        <span 
                          className="text-xs font-medium"
                          style={{
                            color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                          }}
                        >
                          {post.nickname || "익명"}
                        </span>
                      </div>
                      <span 
                        className="text-xs"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        {new Date(post.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 
                      className="text-base font-semibold mb-1.5 line-clamp-1"
                      style={{
                        color: isDark ? '#ffffff' : '#000000',
                      }}
                    >
                      {post.title}
                    </h3>
                    <p 
                      className="text-sm leading-relaxed line-clamp-2 mb-2"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      {preview}
                    </p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        ❤️ {post.likes}
                      </button>
                    </div>
                  </Link>
                  
                  {/* 본인 글인 경우 수정/삭제 버튼 (Link 밖에 배치) */}
                  {isOwner(post) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-dashed edit-delete-buttons" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditPost(post);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                        style={{
                          backgroundColor: 'var(--card-border)',
                          color: 'var(--text-main)',
                        }}
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm('정말 삭제하시겠습니까?')) {
                            handleDeletePost(post.id);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                        }}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div 
              className="text-6xl mb-6 opacity-40"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              }}
            >
              💬
            </div>
            <p 
              className="text-lg mb-2"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 500,
              }}
            >
              아직 작성된 글이 없습니다
            </p>
            <p 
              className="text-sm"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 400,
              }}
            >
              첫 번째 글을 작성해보세요
            </p>
          </div>
        )}
      </section>

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </main>
  );
}
