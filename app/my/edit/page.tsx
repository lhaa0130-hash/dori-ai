"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Header from "@/components/layout/Header";
import ProfileImageSelector from "@/components/my/ProfileImageSelector";
import { UserProfile, createDefaultProfile } from "@/lib/userProfile";
// 03단계: 프로필 편집이 /@handle 홈(Firestore)에 반영되도록 저장 함수·핸들 함수 재사용
import { saveMyProfile, getProfile, currentUid, checkHandle, setMyHandle } from "@/lib/social";

const T = {
  ko: {
    loginRequired: "로그인이 필요합니다.",
    loading: "로딩 중...",
    pageTitle: "프로필 수정",
    profileImageLabel: "프로필 이미지",
    nicknameLabel: "닉네임 *",
    nicknamePlaceholder: "닉네임을 입력하세요",
    bioLabel: "한 줄 소개 (최대 80자)",
    bioPlaceholder: "자신을 소개하는 한 줄을 입력하세요",
    statusLabel: "상태 메시지 (최대 20자)",
    statusPlaceholder: "예: AI 실무 적용 중",
    readonlyTitle: "수정 불가 항목",
    emailLabel: "이메일",
    joinedLabel: "가입일",
    expLabel: "DORI EXP",
    cancel: "취소",
    saving: "저장 중...",
    save: "저장하기",
    alertNicknameRequired: "닉네임을 입력해주세요.",
    alertBioTooLong: "한 줄 소개는 80자 이하여야 합니다.",
    alertStatusTooLong: "상태 메시지는 20자 이하여야 합니다.",
    alertSaved: "프로필이 저장되었습니다.",
    alertSaveErrorFallback: "프로필 저장 중 오류가 발생했습니다.",
    dateLocale: "ko-KR",
  },
  en: {
    loginRequired: "Please log in to continue.",
    loading: "Loading...",
    pageTitle: "Edit profile",
    profileImageLabel: "Profile photo",
    nicknameLabel: "Nickname *",
    nicknamePlaceholder: "Enter a nickname",
    bioLabel: "Bio (up to 80 characters)",
    bioPlaceholder: "Write a short bio about yourself",
    statusLabel: "Status message (up to 20 characters)",
    statusPlaceholder: "e.g. Applying AI at work",
    readonlyTitle: "Can't be changed",
    emailLabel: "Email",
    joinedLabel: "Joined",
    expLabel: "DORI EXP",
    cancel: "Cancel",
    saving: "Saving...",
    save: "Save",
    alertNicknameRequired: "Please enter a nickname.",
    alertBioTooLong: "Bio must be 80 characters or fewer.",
    alertStatusTooLong: "Status message must be 20 characters or fewer.",
    alertSaved: "Profile saved.",
    alertSaveErrorFallback: "Something went wrong while saving your profile.",
    dateLocale: "en-US",
  },
} as const;

export default function EditProfilePage() {
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const t = T[isEn ? "en" : "ko"];
  const { session, update } = useAuth();
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
  // 03단계: 고유 아이디(handle) — Firestore에서 로드, 기존 checkHandle/setMyHandle 재사용
  const [handleInput, setHandleInput] = useState("");
  const [savedHandle, setSavedHandle] = useState("");
  const [handleMsg, setHandleMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [handleBusy, setHandleBusy] = useState(false);
  const handleInputRef = useRef(""); // 비동기 검증 스테일 응답 방지용

  useEffect(() => setMounted(true), []);

  // 03단계: Firestore에서 현재 handle 로드(공개 홈 주소). localStorage와 별개로 서버 기준.
  useEffect(() => {
    const uid = currentUid();
    if (!uid) return;
    let alive = true;
    getProfile(uid).then((p) => { if (alive) { setSavedHandle(p.handle || ""); setHandleInput(p.handle || ""); } }).catch(() => {});
    return () => { alive = false; };
  }, [user?.email]);

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

  const handleSave = async () => {
    if (!user?.email || !profile) return;
    if (!nickname.trim()) {
      alert(t.alertNicknameRequired);
      return;
    }
    if (bio.length > 80) {
      alert(t.alertBioTooLong);
      return;
    }
    if (statusMessage.length > 20) {
      alert(t.alertStatusTooLong);
      return;
    }

    setIsSaving(true);

    try {
      // 클라이언트 사이드 저장 (정적 사이트이므로 API 호출 없음)

      const updated: UserProfile = {
        ...profile,
        nickname: nickname.trim(),
        bio: bio.trim(),
        statusMessage: statusMessage.trim(),
        profileImageUrl,
      };

      // ⭐ 03단계: Firestore users/{uid} 에도 저장 → /@handle 개인 홈에 즉시 반영.
      //    (기존엔 localStorage만 저장돼 개인 홈에 반영되지 않던 문제 해결)
      //    photoURL은 여기서 다루지 않음 — 홈 대표 사진은 코지홈(/profile) 실제 업로드로 관리.
      await saveMyProfile({
        name: nickname.trim(),
        bio: bio.trim(),
        statusMsg: statusMessage.trim(),
      });

      // 2. localStorage에 저장 (클라이언트 캐시)
      localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
      localStorage.setItem(`dori_user_name_${user.email}`, nickname.trim());
      localStorage.setItem(`dori_user_bio_${user.email}`, bio.trim());
      localStorage.setItem(`dori_status_${user.email}`, statusMessage.trim());
      if (profileImageUrl) {
        localStorage.setItem(`dori_image_${user.email}`, profileImageUrl);
        // 프로필 이미지 변경 이벤트 발생 (헤더의 AccountMenu가 즉시 업데이트되도록)
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: { imageUrl: profileImageUrl, email: user.email }
        }));
      }

      // 3. 프로필 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent('profileUpdated'));

      // 4. 모든 게시글과 댓글의 작성자 이름 업데이트
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

      // NextAuth 대신 자체 인증 세션 업데이트
      update({
        name: nickname.trim(),
      });

      // 6. 페이지 리로드로 서버 캐시 갱신 확인
      router.refresh();

      setIsSaving(false);
      alert(t.alertSaved);
      router.push(isEn ? "/en/my" : "/my");
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      setIsSaving(false);
      alert(error instanceof Error ? error.message : t.alertSaveErrorFallback);
    }
  };

  // 03단계: 고유 아이디(handle) 실시간 검증 — 기존 checkHandle 재사용(@제거·예약어·중복·형식)
  const onHandleChange = (raw: string) => {
    const v = raw.replace(/^@+/, "").toLowerCase();
    setHandleInput(v);
    handleInputRef.current = v;
    setHandleMsg(null);
    if (!v.trim() || v === savedHandle) return;
    const reqId = v;
    checkHandle(v).then((res) => {
      // 입력이 그새 바뀌면 무시(스테일 응답 방지)
      if (reqId !== handleInputRef.current) return;
      setHandleMsg(res.ok ? { ok: true, text: "사용할 수 있는 아이디예요" } : { ok: false, text: res.reason || "사용할 수 없어요" });
    });
  };

  // 03단계: 아이디 저장 — 기존 setMyHandle 재사용(본인만·서버 재검증·중복 방지)
  const onSaveHandle = async () => {
    const v = handleInput.replace(/^@+/, "").toLowerCase().trim();
    if (!v || v === savedHandle || handleBusy) return;
    setHandleBusy(true);
    const res = await setMyHandle(v);
    setHandleBusy(false);
    if (res.ok && res.handle) {
      setSavedHandle(res.handle);
      setHandleInput(res.handle);
      setHandleMsg({ ok: true, text: res.warn || "아이디를 저장했어요" });
    } else {
      setHandleMsg({ ok: false, text: res.error || "저장에 실패했어요" });
    }
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
          <p>{t.loginRequired}</p>
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
        <div>{t.loading}</div>
      </main>
    );
  }

  return (
    <main style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      minHeight: '100vh',
      paddingTop: '70px',
      overflowY: 'auto',
      position: 'relative',
    }}>
      <Header />

      {/* 다크모드 배경 효과 */}
      {isDark && (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 bg-[#F9954E]" />
        </div>
      )}

      <section className="relative z-10" style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '4rem 1.5rem 6rem 1.5rem',
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
            {t.pageTitle}
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
              {t.profileImageLabel}
            </label>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ProfileImageSelector
                currentImageUrl={profileImageUrl}
                onImageChange={(imageUrl) => {
                  setProfileImageUrl(imageUrl);
                  // 프로필 이미지 변경 이벤트 발생 (헤더의 AccountMenu가 즉시 업데이트되도록)
                  if (user?.email) {
                    window.dispatchEvent(new CustomEvent('profileImageUpdated', {
                      detail: { imageUrl, email: user.email }
                    }));
                  }
                }}
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
              {t.nicknameLabel}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.nicknamePlaceholder}
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

          {/* 03단계: 고유 아이디(handle) — 개인 홈 주소. 기존 checkHandle/setMyHandle 재사용 */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.9375rem', fontWeight: '600', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)', marginBottom: '0.5rem' }}>
              내 아이디 (개인 홈 주소)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 0.6rem', borderRadius: '0.75rem', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: '#9ca3af', fontSize: '0.85rem', fontFamily: 'monospace', flexShrink: 0 }}>illo.im/@</span>
              <input
                type="text" value={handleInput} onChange={(e) => onHandleChange(e.target.value)} maxLength={20} placeholder="dori"
                aria-label="고유 아이디"
                style={{ flex: 1, minWidth: 0, padding: '0.875rem 1rem', borderRadius: '0.75rem', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`, color: isDark ? '#fff' : '#1d1d1f', fontSize: '1rem', fontFamily: 'monospace', outline: 'none', textTransform: 'lowercase' }}
              />
              <button
                onClick={onSaveHandle}
                disabled={handleBusy || !handleInput.trim() || handleInput === savedHandle || !(handleMsg && handleMsg.ok)}
                style={{ padding: '0 1rem', borderRadius: '0.75rem', background: '#F9954E', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: (handleBusy || handleInput === savedHandle) ? 'not-allowed' : 'pointer', opacity: (handleBusy || !handleInput.trim() || handleInput === savedHandle || !(handleMsg && handleMsg.ok)) ? 0.5 : 1, flexShrink: 0, fontFamily: 'inherit' }}
              >
                {handleBusy ? '...' : '저장'}
              </button>
            </div>
            {/* 실제 URL 미리보기 */}
            {handleInput.trim() && (
              <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                내 홈 주소: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#E8832E' }}>illo.im/@{handleInput.replace(/^@+/, '').toLowerCase()}</span>
              </p>
            )}
            {handleMsg && (
              <p style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: handleMsg.ok ? '#10b981' : '#ef4444' }}>{handleMsg.text}</p>
            )}
            {/* 변경 경고 */}
            {savedHandle && handleInput !== savedHandle && (
              <p style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#f59e0b' }}>⚠️ 아이디를 변경하면 기존 개인 홈 주소가 달라집니다.</p>
            )}
            {/* 내 홈 보기 (핸들 있을 때) */}
            {savedHandle && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                <Link href={`/@${savedHandle}`} style={{ color: '#F9954E', fontWeight: 700 }}>내 홈 보기 →</Link>
                <Link href="/profile" style={{ color: '#9ca3af', fontWeight: 600, marginLeft: '0.75rem' }}>홈 배경·색 꾸미기 →</Link>
              </p>
            )}
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
              {t.bioLabel}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.bioPlaceholder}
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
              {t.statusLabel}
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder={t.statusPlaceholder}
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
              {t.readonlyTitle}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '0.25rem',
                }}>
                  {t.emailLabel}
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
                  {t.joinedLabel}
                </div>
                <div style={{
                  fontSize: '0.9375rem',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  fontWeight: '500',
                }}>
                  {new Date(profile.createdAt).toLocaleDateString(t.dateLocale)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  marginBottom: '0.25rem',
                }}>
                  {t.expLabel}
                </div>
                <div style={{
                  fontSize: '0.9375rem',
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  fontWeight: '500',
                }}>
                  {profile.doriExp.toLocaleString()}EXP
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            position: 'sticky',
            bottom: '1rem',
            background: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 10,
          }}>
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
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = isSaving ? '0.5' : '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {t.cancel}
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
                transition: 'all 0.2s',
                boxShadow: isSaving ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = isSaving ? '0.7' : '1';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isSaving ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)';
              }}
            >
              {isSaving ? t.saving : t.save}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}



