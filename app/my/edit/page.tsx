"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Header from "@/components/layout/Header";
import ProfileImageSelector from "@/components/my/ProfileImageSelector";
import { UserProfile, createDefaultProfile } from "@/lib/userProfile";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  // 프로필 데이터 로드
  useEffect(() => {
    if (!user?.email) return;

    const savedProfile = localStorage.getItem(`dori_profile_${user.email}`);
    const savedName = localStorage.getItem(`dori_user_name_${user.email}`);
    const savedBio = localStorage.getItem(`dori_user_bio_${user.email}`);
    const savedStatusMessage = localStorage.getItem(`dori_status_${user.email}`);
    const savedImageUrl = localStorage.getItem(`dori_image_${user.email}`);

    const defaultNickname = savedName || user.name || "사용자";
    const defaultBio = savedBio || "";
    const defaultStatusMessage = savedStatusMessage || "";
    const defaultImageUrl = savedImageUrl || undefined;

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setNickname(parsed.nickname || defaultNickname);
        setBio(parsed.bio || defaultBio);
        setStatusMessage(parsed.statusMessage || defaultStatusMessage);
        setProfileImageUrl(parsed.profileImageUrl || defaultImageUrl);
      } catch {
        setProfile(createDefaultProfile(user.email, user.email, defaultNickname));
        setNickname(defaultNickname);
        setBio(defaultBio);
        setStatusMessage(defaultStatusMessage);
        setProfileImageUrl(defaultImageUrl);
      }
    } else {
      const defaultProfile = createDefaultProfile(user.email, user.email, defaultNickname);
      setProfile(defaultProfile);
      setNickname(defaultNickname);
      setBio(defaultBio);
      setStatusMessage(defaultStatusMessage);
      setProfileImageUrl(defaultImageUrl);
    }
  }, [user?.email, user?.name]);

  const handleSave = () => {
    if (!user?.email || !profile) return;
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    if (bio.length > 80) {
      alert("한 줄 소개는 80자 이하여야 합니다.");
      return;
    }
    if (statusMessage.length > 20) {
      alert("상태 메시지는 20자 이하여야 합니다.");
      return;
    }

    setIsSaving(true);

    const updated: UserProfile = {
      ...profile,
      nickname: nickname.trim(),
      bio: bio.trim(),
      statusMessage: statusMessage.trim(),
      profileImageUrl,
    };

    // localStorage에 저장
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
    localStorage.setItem(`dori_user_name_${user.email}`, nickname.trim());
    localStorage.setItem(`dori_user_bio_${user.email}`, bio.trim());
    localStorage.setItem(`dori_status_${user.email}`, statusMessage.trim());
    if (profileImageUrl) {
      localStorage.setItem(`dori_image_${user.email}`, profileImageUrl);
    }

    // 모든 게시글과 댓글의 작성자 이름 업데이트
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const updatedPosts = savedPosts.map((p: any) => {
      if (p.author === profile.nickname || p.nickname === profile.nickname || p.author === user?.name) {
        p.author = nickname.trim();
        p.nickname = nickname.trim();
      }
      if (p.commentsList) {
        p.commentsList = p.commentsList.map((c: any) => {
          if (c.author === profile.nickname || c.author === user?.name) {
            c.author = nickname.trim();
          }
          return c;
        });
      }
      return p;
    });
    localStorage.setItem("dori_posts", JSON.stringify(updatedPosts));

    setTimeout(() => {
      setIsSaving(false);
      alert("프로필이 저장되었습니다.");
      router.push("/my");
    }, 500);
  };

  const isDark = mounted && theme === "dark";

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
        </div>
      </main>
    );
  }

  if (!profile) {
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

      <section className="relative z-10" style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '4rem 1.5rem',
        minHeight: 'calc(100vh - 70px)',
      }}>
        <div style={{
          background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.5)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: isDark ? '#ffffff' : '#1d1d1f',
            marginBottom: '2rem',
          }}>
            프로필 수정
          </h1>

          {/* 프로필 이미지 */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              marginBottom: '1rem',
            }}>
              프로필 이미지
            </label>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ProfileImageSelector
                currentImageUrl={profileImageUrl}
                onImageChange={setProfileImageUrl}
              />
            </div>
          </div>

          {/* 닉네임 */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              marginBottom: '0.5rem',
            }}>
              닉네임 *
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          {/* 한 줄 소개 */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              marginBottom: '0.5rem',
            }}>
              한 줄 소개 (최대 80자)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="자신을 소개하는 한 줄을 입력하세요"
              maxLength={80}
              rows={3}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{
              fontSize: '0.8125rem',
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              marginTop: '0.5rem',
              textAlign: 'right',
            }}>
              {bio.length}/80
            </div>
          </div>

          {/* 상태 메시지 */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              marginBottom: '0.5rem',
            }}>
              상태 메시지 (최대 20자)
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="예: AI 실무 적용 중"
              maxLength={20}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <div style={{
              fontSize: '0.8125rem',
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              marginTop: '0.5rem',
              textAlign: 'right',
            }}>
              {statusMessage.length}/20
            </div>
          </div>

          {/* 수정 불가 항목 */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            marginBottom: '2rem',
          }}>
            <h3 style={{
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
              marginBottom: '1rem',
            }}>
              수정 불가 항목
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '0.25rem',
                }}>
                  이메일
                </div>
                <div style={{
                  fontSize: '0.9375rem',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  fontWeight: '500',
                }}>
                  {user.email}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '0.25rem',
                }}>
                  가입일
                </div>
                <div style={{
                  fontSize: '0.9375rem',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  fontWeight: '500',
                }}>
                  {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '0.25rem',
                }}>
                  DORI Score
                </div>
                <div style={{
                  fontSize: '0.9375rem',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  fontWeight: '500',
                }}>
                  {profile.doriScore.toLocaleString()}점
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => router.back()}
              disabled={isSaving}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                color: isDark ? '#ffffff' : '#1d1d1f',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '0.9375rem',
                fontWeight: '600',
                fontFamily: 'inherit',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                background: isDark
                  ? 'linear-gradient(135deg, #60a5fa, #a78bfa)'
                  : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                border: 'none',
                color: '#ffffff',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '0.9375rem',
                fontWeight: '600',
                fontFamily: 'inherit',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

