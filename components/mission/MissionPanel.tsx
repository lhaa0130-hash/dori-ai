"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { signIn } from "next-auth/react";

interface Mission {
  code: string;
  title: string;
  points: number;
  reset_type: string;
  status: 'locked' | 'available' | 'claimed';
}

interface MissionsResponse {
  points: number | null;
  missions: Mission[];
}

export default function MissionPanel() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<MissionsResponse>({ points: null, missions: [] });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [showTipModal, setShowTipModal] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    loadMissions();
    
    // 10초마다 미션 상태 갱신
    const interval = setInterval(loadMissions, 10000);
    return () => clearInterval(interval);
  }, [mounted, session]);

  const loadMissions = async () => {
    try {
      const res = await fetch('/api/missions');
      const data = await res.json();
      setData({
        points: data.points ?? null,
        missions: data.missions ?? [],
      });
    } catch (error) {
      console.error('미션 로드 오류:', error);
      setData({ points: null, missions: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (missionCode: string) => {
    if (claiming || !session?.user) return;
    
    setClaiming(missionCode);
    try {
      const res = await fetch('/api/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionCode }),
      });

      const result = await res.json();
      
      if (result.ok) {
        // 미션 상태 갱신
        await loadMissions();
        
        // 프로필 포인트 업데이트 (클라이언트 사이드)
        if (session?.user?.email) {
          const profileKey = `dori_profile_${session.user.email}`;
          const savedProfile = localStorage.getItem(profileKey);
          if (savedProfile) {
            try {
              const profile = JSON.parse(savedProfile);
              const updatedProfile = {
                ...profile,
                point: result.points || (profile.point || 0),
              };
              localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
            } catch (e) {
              console.error('프로필 업데이트 오류:', e);
            }
          }
        }

        // DAILY_TIP의 경우 팁 표시
        if (result.tip) {
          setTip(result.tip);
          setShowTipModal(true);
        }
      } else {
        alert(result.error || '보상 수령에 실패했습니다.');
      }
    } catch (error) {
      console.error('보상 수령 오류:', error);
      alert('보상 수령 중 오류가 발생했습니다.');
    } finally {
      setClaiming(null);
    }
  };

  const isDark = mounted && theme === 'dark';

  if (!mounted || loading) {
    return (
      <div
        className="rounded-xl p-6 backdrop-blur-xl border"
        style={{
          background: isDark
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="text-center text-sm opacity-60">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-xl p-6 backdrop-blur-xl border"
        style={{
          background: isDark
            ? 'rgba(0, 0, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 4px 24px rgba(0, 0, 0, 0.3)'
            : '0 4px 24px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-lg font-semibold"
            style={{
              color: isDark ? '#ffffff' : '#1d1d1f',
            }}
          >
            Today's Missions
          </h3>
          {data.points !== null && (
            <div
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{
                background: isDark
                  ? 'rgba(34, 211, 153, 0.15)'
                  : 'rgba(5, 150, 105, 0.1)',
                color: isDark ? '#34d399' : '#059669',
              }}
            >
              {data.points}P
            </div>
          )}
        </div>

        {!session?.user ? (
          /* 비로그인 상태 */
          <div className="space-y-3">
            {data.missions && data.missions.length > 0 ? data.missions.map((mission) => (
              <div
                key={mission.code}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="flex-1">
                  <div
                    className="text-sm font-medium mb-1"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {mission.title}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    +{mission.points}P
                  </div>
                </div>
                <div
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                  }}
                >
                  🔒
                </div>
              </div>
            )) : (
              <div
                className="text-center py-4 text-sm"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }}
              >
                미션이 없습니다.
              </div>
            )}
            <button
              onClick={() => signIn()}
              className="w-full mt-4 py-3 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#ffffff',
              }}
            >
              Log in to start missions
            </button>
          </div>
        ) : (
          /* 로그인 상태 */
          <div className="space-y-3">
            {data.missions && data.missions.length > 0 ? data.missions.map((mission) => (
              <div
                key={mission.code}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium mb-1"
                    style={{
                      color: isDark ? '#ffffff' : '#1d1d1f',
                    }}
                  >
                    {mission.title}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    +{mission.points}P
                  </div>
                </div>
                <button
                  onClick={() => handleClaim(mission.code)}
                  disabled={mission.status === 'claimed' || claiming === mission.code}
                  className="px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  style={{
                    background:
                      mission.status === 'claimed'
                        ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
                        : (isDark
                            ? 'linear-gradient(135deg, #34d399, #10b981)'
                            : 'linear-gradient(135deg, #059669, #047857)'),
                    color: mission.status === 'claimed'
                      ? (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')
                      : '#ffffff',
                  }}
                >
                  {claiming === mission.code
                    ? '...'
                    : mission.status === 'claimed'
                    ? 'Completed'
                    : 'Claim'}
                </button>
              </div>
            )) : (
              <div
                className="text-center py-4 text-sm"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }}
              >
                미션이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 팁 모달 */}
      {showTipModal && tip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowTipModal(false)}
        >
          <div
            className="rounded-xl p-6 max-w-md w-full border"
            style={{
              background: isDark
                ? 'rgba(0, 0, 0, 0.9)'
                : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4
                className="text-lg font-semibold"
                style={{
                  color: isDark ? '#ffffff' : '#1d1d1f',
                }}
              >
                💡 Today's AI Tip
              </h4>
              <button
                onClick={() => setShowTipModal(false)}
                className="text-xl opacity-60 hover:opacity-100 transition-opacity"
                style={{
                  color: isDark ? '#ffffff' : '#1d1d1f',
                }}
              >
                ×
              </button>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              }}
            >
              {tip}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
