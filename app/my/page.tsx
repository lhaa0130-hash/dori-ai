"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import ProfileHero from "@/components/my/ProfileHero";
import GrowthGuide from "@/components/my/GrowthGuide";
import { UserProfile, createDefaultProfile, calculateTier, calculateLevel, ACTIVITY_SCORES } from "@/lib/userProfile";

export default function MyPage() {
  const { data: session } = useSession();
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
  const [memberList, setMemberList] = useState<any[]>([]);
  const isAdmin = user?.email?.toLowerCase() === "lhaa0130@gmail.com";

  useEffect(() => setMounted(true), []);

  // 관리자 회원정보 로드
  useEffect(() => {
    if (!isAdmin || !mounted) return;
    
    const membersMap = new Map<string, any>();
    
    // 1. localStorage에서 모든 프로필 데이터 수집 (dori_profile_)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("dori_profile_")) {
        try {
          const email = key.replace("dori_profile_", "");
          const profileData = JSON.parse(localStorage.getItem(key) || "{}");
          const userName = localStorage.getItem(`dori_user_name_${email}`) || email.split("@")[0];
          
          membersMap.set(email, {
            email,
            id: email, // 이메일을 ID로 사용하여 일관성 유지
            nickname: profileData.nickname || userName,
            tier: profileData.tier || "Explorer",
            level: profileData.level || 1,
            gender: profileData.gender || "알 수 없음",
            ageGroup: profileData.ageGroup || "알 수 없음",
            doriScore: profileData.doriScore || 0,
            createdAt: profileData.createdAt || "알 수 없음",
          });
        } catch (e) {
          console.error("프로필 파싱 오류:", key, e);
        }
      }
    }
    
    // 2. localStorage에서 사용자 이름 데이터 수집 (dori_user_name_) - 프로필이 없어도 이름이 있으면 회원으로 간주
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("dori_user_name_")) {
        try {
          const email = key.replace("dori_user_name_", "");
          
          // 이미 프로필로 추가된 경우 스킵
          if (membersMap.has(email)) continue;
          
          const userName = localStorage.getItem(key) || email.split("@")[0];
          const profileData = JSON.parse(localStorage.getItem(`dori_profile_${email}`) || "{}");
          
          membersMap.set(email, {
            email,
            id: email,
            nickname: userName,
            tier: profileData.tier || "Explorer",
            level: profileData.level || 1,
            gender: profileData.gender || "알 수 없음",
            ageGroup: profileData.ageGroup || "알 수 없음",
            doriScore: profileData.doriScore || 0,
            createdAt: profileData.createdAt || "알 수 없음",
          });
        } catch (e) {
          console.error("사용자 이름 파싱 오류:", key, e);
        }
      }
    }
    
    // 3. 커뮤니티 글에서 작성자 이메일 수집
    try {
      const savedPosts = JSON.parse(localStorage.getItem("dori_community_posts") || "[]");
      savedPosts.forEach((post: any) => {
        if (post.authorEmail && !membersMap.has(post.authorEmail)) {
          membersMap.set(post.authorEmail, {
            email: post.authorEmail,
            id: post.authorEmail,
            nickname: post.author || post.nickname || post.authorEmail.split("@")[0],
            tier: "Explorer",
            level: 1,
            gender: "알 수 없음",
            ageGroup: "알 수 없음",
            doriScore: 0,
            createdAt: "알 수 없음",
          });
        }
      });
    } catch (e) {
      console.error("커뮤니티 글 파싱 오류:", e);
    }
    
    // 4. AI 도구 댓글에서 사용자 이메일 수집
    try {
      const toolComments = JSON.parse(localStorage.getItem("dori_tool_comments") || "{}");
      Object.values(toolComments).forEach((comments: any) => {
        if (Array.isArray(comments)) {
          comments.forEach((comment: any) => {
            if (comment.userId && comment.userId !== "anonymous" && !membersMap.has(comment.userId)) {
              membersMap.set(comment.userId, {
                email: comment.userId,
                id: comment.userId,
                nickname: comment.userName || comment.userId.split("@")[0],
                tier: "Explorer",
                level: 1,
                gender: "알 수 없음",
                ageGroup: "알 수 없음",
                doriScore: 0,
                createdAt: "알 수 없음",
              });
            }
          });
        }
      });
    } catch (e) {
      console.error("AI 도구 댓글 파싱 오류:", e);
    }
    
    // 배열로 변환하고 이메일 순으로 정렬
    const members = Array.from(membersMap.values());
    members.sort((a, b) => a.email.localeCompare(b.email));
    setMemberList(members);
  }, [isAdmin, mounted]);

  // 프로필 데이터 로드 및 초기화
  useEffect(() => {
    if (!user?.email) return;

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
  }, [user?.email, user?.name]);

  // 활동 데이터 로드 및 점수 계산
  useEffect(() => {
    if (!user?.email || !profile) return;

    const currentName = profile.nickname || user?.name || "";

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

    // 점수 계산 및 업데이트
    const totalSparks = mine.reduce((acc, p) => acc + (p.sparks || 0), 0);
    const doriScore =
      mine.length * ACTIVITY_SCORES.post +
      comments.length * ACTIVITY_SCORES.comment +
      totalSparks * ACTIVITY_SCORES.receivedLike;

    const newTier = calculateTier(doriScore);
    const newLevel = calculateLevel(doriScore * 10);

    if (profile.doriScore !== doriScore || profile.tier !== newTier || profile.level !== newLevel) {
      const updatedProfile: UserProfile = {
        ...profile,
        doriScore,
        tier: newTier,
        level: newLevel,
        point: profile.point || 0, // point 필드 유지
      };
      setProfile(updatedProfile);
      localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updatedProfile));
    }
  }, [user?.email, user?.name, profile?.nickname, profile?.doriScore, profile?.tier, profile?.level]);

  const getDisplayList = () => {
    switch (activeTab) {
      case "posts": return myPosts;
      case "comments": return myComments;
      default: return myPosts;
    }
  };
  const displayList = getDisplayList();
  const isDark = mounted && theme === 'dark';
  const totalSparks = myPosts.reduce((acc, p) => acc + (p.sparks || 0), 0);

  const handleImageChange = (imageUrl: string) => {
    if (!user?.email || !profile) return;
    const updated = { ...profile, profileImageUrl: imageUrl };
    setProfile(updated);
    localStorage.setItem(`dori_image_${user.email}`, imageUrl);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
  };

  const handleNicknameChange = (nickname: string) => {
    if (!user?.email || !profile) return;
    const updated = { ...profile, nickname };
    setProfile(updated);
    localStorage.setItem(`dori_user_name_${user.email}`, nickname);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
  };

  const handleBioChange = (bio: string) => {
    if (!user?.email || !profile) return;
    const updated = { ...profile, bio };
    setProfile(updated);
    localStorage.setItem(`dori_user_bio_${user.email}`, bio);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
  };

  const handleStatusMessageChange = (statusMessage: string) => {
    if (!user?.email || !profile) return;
    const updated = { ...profile, statusMessage };
    setProfile(updated);
    localStorage.setItem(`dori_status_${user.email}`, statusMessage);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
  };

  if (!mounted || !user) {
    return (
      <main style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        minHeight: '100vh',
        paddingTop: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Header />
        <div style={{ textAlign: 'center' }}>
          <p>로그인이 필요합니다.</p>
          <Link href="/login" style={{ color: '#2563eb' }}>로그인하기</Link>
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
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Header />
        <div>로딩 중...</div>
      </main>
    );
  }

  const activityStats = {
    posts: myPosts.length,
    comments: myComments.length,
    receivedLikes: totalSparks,
    guides: 0, // 가이드 기능이 추가되면 업데이트
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

        {/* 프로필 Hero 영역 */}
        {profile && (
          <>
            <ProfileHero
              profile={profile}
              onImageChange={handleImageChange}
              onNicknameChange={handleNicknameChange}
              onBioChange={handleBioChange}
              onStatusMessageChange={handleStatusMessageChange}
            />

            {/* 성장 가이드 */}
            <GrowthGuide profile={profile} activityStats={activityStats} />
          </>
        )}

        {/* 관리자 회원정보 섹션 */}
        {isAdmin && (
          <div style={{ marginTop: profile ? '3rem' : '0' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: isDark ? '#ffffff' : '#1d1d1f',
              marginBottom: '2rem',
            }}>
              회원 관리
            </h1>

            {/* 회원 통계 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  marginBottom: '0.5rem',
                }}>
                  총 회원수
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                }}>
                  {memberList.length}명
                </div>
              </div>
            </div>

            {/* 회원 목록 */}
            <div style={{
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
              borderRadius: '1.5rem',
              padding: '2rem',
              marginBottom: '3rem',
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: isDark ? '#ffffff' : '#1d1d1f',
                marginBottom: '1.5rem',
              }}>
                회원 목록
              </h2>

              {memberList.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 0',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }}>
                  등록된 회원이 없습니다.
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  {memberList.map((member) => (
                    <div
                      key={member.email}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          marginBottom: '0.25rem',
                        }}>
                          이메일
                        </div>
                        <div style={{
                          fontSize: '0.9375rem',
                          fontWeight: '600',
                          color: isDark ? '#ffffff' : '#1d1d1f',
                          wordBreak: 'break-all',
                        }}>
                          {member.email}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          marginBottom: '0.25rem',
                        }}>
                          닉네임
                        </div>
                        <div style={{
                          fontSize: '0.9375rem',
                          fontWeight: '500',
                          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        }}>
                          {member.nickname}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          marginBottom: '0.25rem',
                        }}>
                          티어
                        </div>
                        <div style={{
                          fontSize: '0.9375rem',
                          fontWeight: '500',
                          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        }}>
                          {member.tier}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          marginBottom: '0.25rem',
                        }}>
                          레벨
                        </div>
                        <div style={{
                          fontSize: '0.9375rem',
                          fontWeight: '500',
                          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        }}>
                          Lv.{member.level}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          marginBottom: '0.25rem',
                        }}>
                          성별
                        </div>
                        <div style={{
                          fontSize: '0.9375rem',
                          fontWeight: '500',
                          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        }}>
                          {member.gender === "male" ? "남성" : member.gender === "female" ? "여성" : member.gender || "알 수 없음"}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          marginBottom: '0.25rem',
                        }}>
                          연령층
                        </div>
                        <div style={{
                          fontSize: '0.9375rem',
                          fontWeight: '500',
                          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        }}>
                          {member.ageGroup === "10s" ? "10대" : member.ageGroup === "20s" ? "20대" : member.ageGroup === "30s" ? "30대" : member.ageGroup === "40s" ? "40대" : member.ageGroup || "알 수 없음"}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          marginBottom: '0.25rem',
                        }}>
                          DORI 점수
                        </div>
                        <div style={{
                          fontSize: '0.9375rem',
                          fontWeight: '500',
                          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        }}>
                          {member.doriScore.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 활동 히스토리 섹션 */}
        {profile && (
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
                          background: post.sparks > 0
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
        </div>
        )}

      </section>

      <style jsx global>{`
        @media (max-width: 768px) {
          .post-item {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </main>
  );
}
