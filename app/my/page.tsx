"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import ProfileHero from "@/components/my/ProfileHero";
import { UserProfile, createDefaultProfile, calculateTier, calculateLevel, ACTIVITY_SCORES } from "@/lib/userProfile";

export default function MyPage() {
  const { session, status, update } = useAuth();
  const user = session?.user || null;
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [sparkedPosts, setSparkedPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const ADMIN_EMAILS = ["admin@dori.ai", "lhaa0130@gmail.com"];
  const isAdmin = !!(user && user.email && (ADMIN_EMAILS.some(email => email.toLowerCase() === user.email.toLowerCase()) || (user as any)?.isAdmin === true));

  useEffect(() => setMounted(true), []);


  // 프로필 데이터 로드 및 초기화
  useEffect(() => {
    if (!mounted || status === 'loading') return;
    if (!user || !user.email) return;
    if (typeof window === 'undefined') return;

    try {
      const savedProfile = localStorage.getItem(`dori_profile_${user.email}`);
      const savedName = localStorage.getItem(`dori_user_name_${user.email}`);
      const savedBio = localStorage.getItem(`dori_user_bio_${user.email}`);
      const savedStatusMessage = localStorage.getItem(`dori_status_${user.email}`);
      const savedImageUrl = localStorage.getItem(`dori_image_${user.email}`);

      const nickname = savedName || user.name || "사용자";
      const bio = savedBio || "";
      const statusMessage = savedStatusMessage || "";
      const profileImageUrl = savedImageUrl || undefined;

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setProfile({
            ...parsed,
            nickname,
            bio,
            statusMessage,
            profileImageUrl,
            point: parsed.point || 0, // point 필드가 없으면 0으로 초기화
          });
        } catch {
          // 파싱 실패 시 기본값 사용
          const defaultProfile = createDefaultProfile(user.email, user.email, nickname);
          setProfile({
            ...defaultProfile,
            bio,
            statusMessage,
            profileImageUrl,
          });
        }
      } else {
        const defaultProfile = createDefaultProfile(user.email, user.email, nickname);
        setProfile({
          ...defaultProfile,
          bio,
          statusMessage,
          profileImageUrl,
        });
        // 프로필이 없으면 localStorage에 저장 (구글 로그인 등으로 자동 회원 등록)
        localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify({
          ...defaultProfile,
          bio,
          statusMessage,
          profileImageUrl,
        }));
        if (!savedName) {
          localStorage.setItem(`dori_user_name_${user.email}`, nickname);
        }
      }
    } catch (error) {
      console.error('프로필 로드 중 오류:', error);
    }
  }, [mounted, status, user?.email, user?.name]);

  // 활동 데이터 로드 및 점수 계산
  useEffect(() => {
    if (!mounted || status === 'loading') return;
    if (!user || !user.email || !profile) return;
    if (typeof window === 'undefined') return;

    try {
      const currentName = profile.nickname || (user && user.name) || "";

      // 데이터 불러오기
      const savedPostsStr = localStorage.getItem("dori_community_posts") || "[]";
      const mySparksIdsStr = localStorage.getItem("dori_liked_community_posts") || "[]";

      const savedPosts = JSON.parse(savedPostsStr);
      const mySparksIds = JSON.parse(mySparksIdsStr);

      if (!Array.isArray(savedPosts) || !Array.isArray(mySparksIds)) {
        console.error('Invalid data format');
        return;
      }

      // 1. 내가 쓴 글 필터링
      const mine = savedPosts.filter((p: any) =>
        p.author === currentName || p.nickname === currentName ||
        p.author === (user && user.name) || p.nickname === (user && user.name)
      );

      // 2. 내가 유레카(좋아요)한 글 필터링
      const sparked = savedPosts.filter((p: any) => mySparksIds.includes(String(p.id)));

      // 3. 내가 작성한 댓글 수집
      const comments: any[] = [];
      savedPosts.forEach((post: any) => {
        if (post.commentsList && Array.isArray(post.commentsList)) {
          post.commentsList.forEach((comment: any) => {
            if (comment.author === currentName || comment.author === (user && user.name)) {
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

      // 경험치 계산 및 업데이트
      const totalSparks = mine.reduce((acc, p) => acc + (p.sparks || 0), 0);
      const activityExp =
        mine.length * ACTIVITY_SCORES.post +
        comments.length * ACTIVITY_SCORES.comment +
        totalSparks * ACTIVITY_SCORES.receivedLike;

      // 미션 완료 경험치 추가 (프로필에 이미 반영되어 있을 수 있지만, 혹시 모를 경우를 대비)
      const missionExpKey = `dori_mission_exp_${user.email}`;
      const missionExp = parseInt(localStorage.getItem(missionExpKey) || '0', 10);
      const doriExp = activityExp + missionExp;

      // 프로필의 doriExp가 더 크면 프로필 값을 우선 사용 (이미 미션 경험치가 반영된 경우)
      const finalDoriExp = Math.max(profile.doriExp || 0, doriExp);

      // 레벨 및 등급 자동 계산 (경험치 기반)
      const newTier = calculateTier(finalDoriExp);
      const newLevel = calculateLevel(finalDoriExp * 10); // 경험치 = EXP * 10

      // 레벨업이 발생한 경우 프로필 업데이트
      if (profile.doriExp !== finalDoriExp || profile.tier !== newTier || profile.level !== newLevel) {
        const updatedProfile: UserProfile = {
          ...profile,
          doriExp: finalDoriExp,
          tier: newTier,
          level: newLevel, // 자동 레벨업 반영
          point: profile.point || 0, // point 필드 유지
        };
        setProfile(updatedProfile);
        localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error('활동 데이터 로드 중 오류:', error);
    }
  }, [mounted, status, user?.email, user?.name, profile?.nickname, profile?.doriExp, profile?.tier, profile?.level]);

  const getDisplayList = () => {
    switch (activeTab) {
      case "posts": return myPosts;
      case "comments": return myComments;
      default: return myPosts;
    }
  };
  const displayList = getDisplayList();
  const isDark = mounted && theme === 'dark';
  const totalSparks = Array.isArray(myPosts) ? myPosts.reduce((acc, p) => acc + (p.sparks || p.likes || 0), 0) : 0;

  const handleImageChange = (imageUrl: string) => {
    if (!user || !user.email || !profile) return;
    const updated = { ...profile, profileImageUrl: imageUrl };
    setProfile(updated);
    localStorage.setItem(`dori_image_${user.email}`, imageUrl);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));

    // 프로필 이미지 변경 이벤트 발생 (헤더의 AccountMenu가 업데이트되도록)
    window.dispatchEvent(new CustomEvent('profileImageUpdated', {
      detail: { imageUrl, email: user.email }
    }));
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  };

  const handleNicknameChange = async (nickname: string) => {
    if (!user || !user.email || !profile) return;
    const updated = { ...profile, nickname };
    setProfile(updated);
    localStorage.setItem(`dori_user_name_${user.email}`, nickname);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));

    // NextAuth 세션 업데이트 - 모든 기기에서 동기화되도록
    try {
      await update({
        name: nickname,
      });
    } catch (error) {
      console.error("세션 업데이트 실패:", error);
    }
  };

  const handleBioChange = (bio: string) => {
    if (!user || !user.email || !profile) return;
    const updated = { ...profile, bio };
    setProfile(updated);
    localStorage.setItem(`dori_user_bio_${user.email}`, bio);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
  };

  const handleStatusMessageChange = (statusMessage: string) => {
    if (!user || !user.email || !profile) return;
    const updated = { ...profile, statusMessage };
    setProfile(updated);
    localStorage.setItem(`dori_status_${user.email}`, statusMessage);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
  };

  // 세션 로딩 중일 때 처리
  if (status === 'loading' || !mounted) {
    const loadingBgColor = mounted && theme === 'dark' ? '#000000' : '#ffffff';
    const loadingTextColor = mounted && theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#666';
    const loadingBorderColor = mounted && theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f3f3f3';
    const loadingBorderTopColor = mounted && theme === 'dark' ? '#3b82f6' : '#2563eb';

    return (
      <main style={{
        backgroundColor: loadingBgColor,
        minHeight: '100vh',
        paddingTop: '70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Header />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {/* 스켈레톤 로딩 */}
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid',
            borderColor: loadingBorderColor,
            borderTopColor: loadingBorderTopColor,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{
            marginTop: '1rem',
            color: loadingTextColor,
            fontSize: '14px',
          }}>사용자 정보를 불러오는 중입니다...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  // 로그인이 필요한 경우 (세션이 없고 로딩이 완료된 경우)
  if (status === 'unauthenticated' || !session || !session.user || !user || !user.email) {
    const unAuthBgColor = mounted && theme === 'dark' ? '#000000' : '#ffffff';
    const unAuthTextColor = mounted && theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#1d1d1f';
    const unAuthLinkColor = mounted && theme === 'dark' ? '#60a5fa' : '#2563eb';

    return (
      <main style={{
        backgroundColor: unAuthBgColor,
        minHeight: '100vh',
        paddingTop: '70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Header />
        <div style={{
          textAlign: 'center',
          padding: '2rem',
        }}>
          <p style={{
            color: unAuthTextColor,
            fontSize: '16px',
            marginBottom: '1.5rem',
          }}>
            로그인이 필요합니다.
          </p>
          <Link
            href="/login"
            style={{
              color: unAuthLinkColor,
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: `1px solid ${unAuthLinkColor}`,
              display: 'inline-block',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = mounted && theme === 'dark'
                ? 'rgba(96, 165, 250, 0.1)'
                : 'rgba(37, 99, 235, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            로그인하기
          </Link>
        </div>
      </main>
    );
  }

  // 관리자인 경우 프로필 없이도 진행
  if (!isAdmin && !profile) {
    return (
      <main style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        minHeight: '100vh',
        paddingTop: '70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Header />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f3f3',
            borderTopColor: isDark ? '#3b82f6' : '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{
            marginTop: '1rem',
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#666',
            fontSize: '14px',
          }}>프로필을 불러오는 중입니다...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  // 안전한 activityStats 계산
  const activityStats = {
    posts: Array.isArray(myPosts) ? myPosts.length : 0,
    comments: Array.isArray(myComments) ? myComments.length : 0,
    receivedLikes: totalSparks,
    guides: 0, // 가이드 기능이 추가되면 업데이트
  };

  // 최종 안전성 체크: user와 profile이 반드시 존재해야 함
  if (!user || !user.email) {
    return (
      <main style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        minHeight: '100vh',
        paddingTop: '70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Header />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#666',
            fontSize: '14px',
          }}>
            사용자 정보를 불러올 수 없습니다.
          </p>
          <Link
            href="/login"
            style={{
              color: isDark ? '#60a5fa' : '#2563eb',
              marginTop: '1rem',
              display: 'inline-block',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            다시 로그인하기
          </Link>
        </div>
      </main>
    );
  }

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

        {/* 프로필 Hero 영역 */}
        {profile && user && user.email && (
          <ProfileHero
            profile={profile}
            onImageChange={handleImageChange}
            onNicknameChange={handleNicknameChange}
            onBioChange={handleBioChange}
            onStatusMessageChange={handleStatusMessageChange}
            isAdmin={isAdmin}
            activityStats={activityStats}
          />
        )}


        {/* 활동 히스토리 섹션 */}
        {profile && user && user.email && (
          <div style={{
            marginTop: '3rem',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
            borderRadius: '1.5rem',
            padding: '2rem',
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: isDark ? '#ffffff' : '#1d1d1f',
              marginBottom: '1.5rem',
            }}>
              활동 히스토리
            </h3>

            {/* 탭 메뉴 */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
              marginBottom: '2rem',
              flexWrap: 'wrap',
            }}>
              {[
                { id: "posts", label: `내가 쓴 글 (${myPosts.length})` },
                { id: "comments", label: `💬 내 댓글 (${myComments.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.875rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    fontWeight: '500',
                    letterSpacing: '-0.01em',
                    color: activeTab === tab.id
                      ? (isDark ? '#ffffff' : '#1d1d1f')
                      : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    borderBottom: `2px solid ${activeTab === tab.id ? (isDark ? '#ffffff' : '#1d1d1f') : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 리스트 영역 */}
            <div className="post-list">
              {displayList.length === 0 ? (
                <div className="empty-state" style={{
                  textAlign: 'center',
                  padding: '4rem 0',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }}>
                  아직 활동이 없습니다.
                  <br />
                  <Link href="/community" style={{
                    color: isDark ? '#60a5fa' : '#2563eb',
                    marginTop: '1rem',
                    display: 'inline-block',
                    fontWeight: '600',
                    textDecoration: 'none',
                  }}>
                    커뮤니티 글 쓰러 가기 →
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
                        background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
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
                          background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
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
                        background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
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
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
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
                            background: (post.sparks || post.likes || 0) > 0
                              ? (isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(212, 177, 6, 0.1)')
                              : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                            color: (post.sparks || post.likes || 0) > 0
                              ? (isDark ? '#fbbf24' : '#d4b106')
                              : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                            border: (post.sparks || post.likes || 0) > 0
                              ? `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(212, 177, 6, 0.2)'}`
                              : 'none',
                          }}>
                            <span>⚡️</span>
                            <span style={{ fontWeight: '600' }}>{post.sparks || post.likes || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </section>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 768px) {
          .post-item {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
