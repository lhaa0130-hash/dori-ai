"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import Header from "@/components/layout/Header";

export default function MyPage() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [sparkedPosts, setSparkedPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (user?.name && user?.email) {
      const savedName = localStorage.getItem(`dori_user_name_${user.email}`);
      if (savedName) {
        setDisplayName(savedName);
      } else {
        setDisplayName(user.name);
      }
      
      const savedBio = localStorage.getItem(`dori_user_bio_${user.email}`);
      if (savedBio) {
        setBio(savedBio);
      } else {
        setBio("");
      }
    } else {
      setDisplayName("");
      setBio("");
    }
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (!user || !user.email) return;
    
    const currentName = displayName || user?.name || "";
    
    // 데이터 불러오기
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const mySparksIds = JSON.parse(localStorage.getItem("dori_my_sparks") || "[]");

    // 1. 내가 쓴 글 필터링
    const mine = savedPosts.filter((p: any) => 
      p.author === currentName || p.nickname === currentName || 
      p.author === user?.name || p.nickname === user?.name
    );
    
    // 2. 내가 유레카(좋아요)한 글 필터링
    const sparked = savedPosts.filter((p: any) => mySparksIds.includes(String(p.id)));

    // 3. 내가 작성한 댓글 수집
    const comments: any[] = [];
    savedPosts.forEach((post: any) => {
      if (post.commentsList && Array.isArray(post.commentsList)) {
        post.commentsList.forEach((comment: any) => {
          if (comment.author === currentName || comment.author === user?.name) {
            comments.push({
              ...comment,
              postId: post.id,
              postTitle: post.title,
              postUrl: `/community/${post.id}`,
            });
          }
        });
      }
    });
    comments.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // 4. 북마크한 게시글
    const bookmarks = JSON.parse(localStorage.getItem(`dori_bookmarks_${user.email}`) || "[]");
    const bookmarked = savedPosts.filter((p: any) => bookmarks.includes(String(p.id)));

    // 5. 최근 본 게시글
    const recentViewIds = JSON.parse(localStorage.getItem(`dori_recent_views_${user.email}`) || "[]");
    const recent = savedPosts
      .filter((p: any) => recentViewIds.includes(String(p.id)))
      .slice(0, 10)
      .map((p: any) => ({ ...p, viewedAt: recentViewIds.indexOf(String(p.id)) }))
      .sort((a: any, b: any) => b.viewedAt - a.viewedAt);

    setMyPosts(mine);
    setSparkedPosts(sparked);
    setMyComments(comments);
    setBookmarkedPosts(bookmarked);
    setRecentViews(recent);
  }, [session, user?.name, user?.email, displayName]);

  const getDisplayList = () => {
    switch(activeTab) {
      case "posts": return myPosts;
      case "comments": return myComments;
      case "bookmarks": return bookmarkedPosts;
      case "recent": return recentViews;
      default: return sparkedPosts;
    }
  };
  const displayList = getDisplayList();
  const isDark = mounted && theme === 'dark';
  const totalSparks = myPosts.reduce((acc, p) => acc + (p.sparks || 0), 0);
  const totalComments = myComments.length;

  const handleNameSave = () => {
    if (!displayName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (user?.email) {
      localStorage.setItem(`dori_user_name_${user.email}`, displayName.trim());
      // 모든 게시글과 댓글의 작성자 이름 업데이트
      const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
      const updatedPosts = savedPosts.map((p: any) => {
        if (p.author === user?.name || p.nickname === user?.name) {
          p.author = displayName.trim();
          p.nickname = displayName.trim();
        }
        if (p.commentsList) {
          p.commentsList = p.commentsList.map((c: any) => {
            if (c.author === user?.name) {
              c.author = displayName.trim();
            }
            return c;
          });
        }
        return p;
      });
      localStorage.setItem("dori_posts", JSON.stringify(updatedPosts));
      setIsEditingName(false);
      alert("이름이 변경되었습니다.");
    }
  };

  const handleBioSave = () => {
    if (user?.email) {
      localStorage.setItem(`dori_user_bio_${user.email}`, bio.trim());
      setIsEditingBio(false);
      alert("소개글이 저장되었습니다.");
    }
  };

  return (
    <main style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      minHeight: '100vh',
      paddingTop: '70px',
    }}>
      <Header />

      {/* 다크모드 배경 효과 */}
      {isDark && (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
              )}

      {/* MY PAGE CONTENT */}
      <section className="relative z-10" style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 1.5rem',
        minHeight: 'calc(100vh - 70px)',
      }}>
        
        {/* 프로필 카드 */}
        <div style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          marginBottom: '3rem',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.5)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          textAlign: 'center',
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(168, 85, 247, 0.2))'
              : 'linear-gradient(135deg, #eef6ff, #f3e8ff)',
            color: isDark ? '#60a5fa' : '#2563eb',
            fontSize: '2.5rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${isDark ? 'rgba(96, 165, 250, 0.3)' : '#dbeafe'}`,
            boxShadow: isDark 
              ? '0 4px 20px rgba(96, 165, 250, 0.3)'
              : '0 4px 20px rgba(37, 99, 235, 0.2)',
            margin: '0 auto 1.5rem',
          }}>
            {user?.name?.[0]?.toUpperCase() || "G"}
          </div>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setIsEditingName(false);
                    setDisplayName(user?.name || "");
                  }
                }}
                autoFocus
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  letterSpacing: '-0.03em',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  outline: 'none',
                  maxWidth: '300px',
                }}
              />
              <button
                onClick={handleNameSave}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
              >
                저장
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setDisplayName(user?.name || "");
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
              >
                취소
              </button>
          </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: '700',
                letterSpacing: '-0.03em',
                color: isDark ? '#ffffff' : '#1d1d1f',
              }}>
                {displayName || user?.name || "게스트"}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                }}
                title="이름 수정"
              >
                ✏️
              </button>
            </div>
          )}
          {isEditingBio ? (
            <div style={{ marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="소개글을 입력하세요..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  fontFamily: 'inherit',
                  fontSize: '0.9375rem',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button
                  onClick={handleBioSave}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditingBio(false);
                    setBio(localStorage.getItem(`dori_user_bio_${user?.email}`) || "");
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#ffffff' : '#1d1d1f',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                >
                  취소
                </button>
                  </div>
                </div>
          ) : (
            <div style={{ marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem', position: 'relative' }}>
              <p style={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                margin: 0,
                fontSize: '1rem',
                fontWeight: '400',
                letterSpacing: '-0.01em',
                minHeight: '3rem',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              }}>
                {bio || "DORI AI 크리에이터"}
              </p>
              <button
                onClick={() => setIsEditingBio(true)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                }}
                title="소개글 수정"
              >
                ✏️
              </button>
                </div>
              )}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              borderRadius: '1rem',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              minWidth: '120px',
            }}>
              <div style={{ 
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)', 
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}>
                작성글
              </div>
              <div className={isDark ? 'gradient-text gradient-dark' : 'gradient-text gradient-light'} style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                letterSpacing: '-0.02em',
              }}>
                {myPosts.length}
              </div>
            </div>
            <div style={{
              padding: '1rem 1.5rem',
              borderRadius: '1rem',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              minWidth: '120px',
            }}>
              <div style={{ 
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)', 
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}>
                받은 유레카
              </div>
              <div className={isDark ? 'gradient-text gradient-dark' : 'gradient-text gradient-light'} style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                letterSpacing: '-0.02em',
              }}>
                {totalSparks}
              </div>
            </div>
            <div style={{
              padding: '1rem 1.5rem',
              borderRadius: '1rem',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              minWidth: '120px',
            }}>
              <div style={{ 
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)', 
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}>
                작성 댓글
              </div>
              <div className={isDark ? 'gradient-text gradient-dark' : 'gradient-text gradient-light'} style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                letterSpacing: '-0.02em',
              }}>
                {totalComments}
              </div>
            </div>
          </div>
          
          {/* 추가 정보 */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                marginBottom: '0.5rem',
                fontWeight: '500',
              }}>
                이메일
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontWeight: '500',
                wordBreak: 'break-all',
              }}>
                {user?.email || "로그인 필요"}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                marginBottom: '0.5rem',
                fontWeight: '500',
              }}>
                가입일
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontWeight: '500',
              }}>
                {user ? new Date().toLocaleDateString('ko-KR') : "-"}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                marginBottom: '0.5rem',
                fontWeight: '500',
              }}>
                활동 점수
              </div>
              <div className={isDark ? 'gradient-text gradient-dark' : 'gradient-text gradient-light'} style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                letterSpacing: '-0.02em',
              }}>
                {(myPosts.length * 10 + totalComments * 3 + totalSparks).toLocaleString()}
            </div>
          </div>
      </div>
          
          {/* 빠른 링크 */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              letterSpacing: '-0.01em',
              color: isDark ? '#ffffff' : '#1d1d1f',
              marginBottom: '1rem',
            }}>
              빠른 링크
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem',
            }}>
              {[
                { href: '/community/write', label: '✍️ 글쓰기', icon: '✍️' },
                { href: '/community', label: '💬 커뮤니티', icon: '💬' },
                { href: '/ai-tools', label: '🤖 AI 도구', icon: '🤖' },
                { href: '/insight', label: '💡 인사이트', icon: '💡' },
                { href: '/academy', label: '🎓 아카데미', icon: '🎓' },
                { href: '/suggestions', label: '📫 제안하기', icon: '📫' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                    textDecoration: 'none',
                    color: isDark ? '#ffffff' : '#1d1d1f',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                  }}
                >
                  <span>{link.icon}</span>
                  <span>{link.label.replace(link.icon + ' ', '')}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* 활동 통계 */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              letterSpacing: '-0.01em',
              color: isDark ? '#ffffff' : '#1d1d1f',
              marginBottom: '1rem',
            }}>
              활동 통계
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              <div style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                }}>
                  총 조회수
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                }}>
                  {myPosts.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                }}>
                  평균 유레카
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                }}>
                  {myPosts.length > 0 
                    ? (totalSparks / myPosts.length).toFixed(1)
                    : '0.0'}
                </div>
              </div>
              <div style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                }}>
                  북마크 수
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                }}>
                  {bookmarkedPosts.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
          marginBottom: '2rem',
        }}>
          <button 
            onClick={() => setActiveTab("posts")}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.875rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: '500',
              letterSpacing: '-0.01em',
              color: activeTab === "posts" 
                ? (isDark ? '#ffffff' : '#1d1d1f')
                : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
              borderBottom: `2px solid ${activeTab === "posts" ? (isDark ? '#ffffff' : '#1d1d1f') : 'transparent'}`,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            내가 쓴 글 ({myPosts.length})
          </button>
          <button 
            onClick={() => setActiveTab("comments")}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.875rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: '500',
              letterSpacing: '-0.01em',
              color: activeTab === "comments" 
                ? (isDark ? '#ffffff' : '#1d1d1f')
                : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
              borderBottom: `2px solid ${activeTab === "comments" ? (isDark ? '#ffffff' : '#1d1d1f') : 'transparent'}`,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            💬 내 댓글 ({myComments.length})
          </button>
          <button 
            onClick={() => setActiveTab("bookmarks")}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.875rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: '500',
              letterSpacing: '-0.01em',
              color: activeTab === "bookmarks" 
                ? (isDark ? '#ffffff' : '#1d1d1f')
                : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
              borderBottom: `2px solid ${activeTab === "bookmarks" ? (isDark ? '#ffffff' : '#1d1d1f') : 'transparent'}`,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            ⭐ 북마크 ({bookmarkedPosts.length})
          </button>
          <button 
            onClick={() => setActiveTab("recent")}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.875rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: '500',
              letterSpacing: '-0.01em',
              color: activeTab === "recent" 
                ? (isDark ? '#ffffff' : '#1d1d1f')
                : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
              borderBottom: `2px solid ${activeTab === "recent" ? (isDark ? '#ffffff' : '#1d1d1f') : 'transparent'}`,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            👁️ 최근 본 글 ({recentViews.length})
          </button>
          <button 
            onClick={() => setActiveTab("sparks")}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.875rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: '500',
              letterSpacing: '-0.01em',
              color: activeTab === "sparks" 
                ? (isDark ? '#ffffff' : '#1d1d1f')
                : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
              borderBottom: `2px solid ${activeTab === "sparks" ? (isDark ? '#ffffff' : '#1d1d1f') : 'transparent'}`,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            ⚡️ 유레카한 글 ({sparkedPosts.length})
          </button>
        </div>

        {/* 리스트 영역 */}
        <div className="post-list">
          {displayList.length === 0 ? (
            <div className="empty-state" style={{
              textAlign: 'center',
              padding: '4rem 0',
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            }}>
              {activeTab === "posts" ? "작성한 글이 없습니다." : 
               activeTab === "comments" ? "작성한 댓글이 없습니다." :
               activeTab === "bookmarks" ? "북마크한 글이 없습니다." :
               activeTab === "recent" ? "최근 본 글이 없습니다." :
               "아직 유레카를 누른 글이 없습니다."}
              <br />
              <Link href="/community" style={{ 
                color: isDark ? '#60a5fa' : '#2563eb', 
                marginTop: '1rem', 
                display: 'inline-block',
                fontWeight: '600',
                textDecoration: 'none',
              }}>
                커뮤니티 둘러보기 →
              </Link>
            </div>
          ) : activeTab === "comments" ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayList.map((comment: any) => (
                <Link 
                  href={comment.postUrl || `/community/${comment.postId}`} 
                  key={comment.id} 
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
                    boxShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isDark 
                      ? '0 8px 24px rgba(0, 0, 0, 0.5)' 
                      : '0 8px 24px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDark 
                      ? '0 2px 10px rgba(0, 0, 0, 0.3)' 
                      : '0 2px 10px rgba(0, 0, 0, 0.05)';
                  }}
                  >
                    <div style={{ 
                      fontSize: '0.8125rem',
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                      marginBottom: '0.5rem',
                      fontWeight: '400',
                      letterSpacing: '-0.01em',
                    }}>
                      {comment.date || new Date(comment.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                    <h3 style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      letterSpacing: '-0.01em',
                      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    }}>
                      {comment.postTitle || "게시글"}
                    </h3>
                    <p style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '0.9375rem',
                      fontWeight: '400',
                      letterSpacing: '-0.01em',
                      color: isDark ? '#ffffff' : '#1d1d1f',
                      lineHeight: '1.6',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    }}>
                      {comment.text || comment.content}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8125rem',
                      color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    }}>
                      <span>💬</span>
                      <span>댓글 보기 →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayList.slice(0).reverse().map((post) => (
                <Link 
                  href={`/community/${post.id}`} 
                  key={post.id} 
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="post-item" style={{
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
                    boxShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1.5rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isDark 
                      ? '0 8px 24px rgba(0, 0, 0, 0.5)' 
                      : '0 8px 24px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDark 
                      ? '0 2px 10px rgba(0, 0, 0, 0.3)' 
                      : '0 2px 10px rgba(0, 0, 0, 0.05)';
                  }}
                  >
                    <div className="post-info" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <span className="post-tag" style={{
                          fontSize: '0.75rem',
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(168, 85, 247, 0.2))'
                            : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(124, 58, 237, 0.1))',
                          padding: '0.375rem 0.875rem',
                          borderRadius: '0.75rem',
                          color: isDark ? '#60a5fa' : '#2563eb',
                          display: 'inline-block',
                          fontWeight: '600',
                          border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
                        }}>
                          {post.tag || "자유"}
                        </span>
                        {post.image && (
                          <span style={{
                            fontSize: '0.875rem',
                            opacity: 0.7,
                          }}>📷</span>
                        )}
                        <span style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                          marginLeft: 'auto',
                        }}>
                          {post.date || new Date(post.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.0625rem',
                        fontWeight: '600',
                        letterSpacing: '-0.01em',
                        color: isDark ? '#ffffff' : '#1d1d1f',
                        lineHeight: '1.5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                      {post.title}
                    </h3>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        flexWrap: 'wrap',
                        fontSize: '0.8125rem',
                        fontWeight: '400',
                        letterSpacing: '-0.01em',
                      }}>
                        <span style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        }}>
                          {post.author || post.nickname || "익명"}
                        </span>
                        <span style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                        }}>•</span>
                        <span style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        }}>
                          👁️ {post.views || 0}
                    </span>
                      </div>
                    </div>
                    <div className="post-stats" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      alignItems: 'flex-end',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                      }}>
                        <span>💬</span>
                        <span style={{ fontWeight: '600' }}>{post.comments || 0}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: post.sparks > 0 
                          ? (isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(212, 177, 6, 0.1)')
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                        color: post.sparks > 0 
                          ? (isDark ? '#fbbf24' : '#d4b106') 
                          : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                        border: post.sparks > 0 
                          ? `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(212, 177, 6, 0.2)'}`
                          : 'none',
                      }}>
                        <span>⚡️</span>
                        <span style={{ fontWeight: '600' }}>{post.sparks || 0}</span>
                      </div>
                  </div>
                </div>
              </Link>
              ))}
            </div>
          )}
        </div>

      </section>


      <style jsx global>{`
        .gradient-text {
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          display: inline-block;
          background-position: 0% 50%;
          background-size: 100% 100%;
          background-repeat: no-repeat;
        }
        .gradient-light {
          background-image: linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%);
        }
        .gradient-dark {
          background-image: linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%);
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        @media (max-width: 768px) {
          .profile-card {
            flex-direction: column;
            text-align: center;
          }
          .post-item {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </main>
  );
}