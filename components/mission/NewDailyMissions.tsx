"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  getTodayMissionsStatus,
  completeClickMission,
  markMissionClaimed,
  isMissionClaimed,
  calculateMissionReward,
  getTimeUntilKoreaMidnight,
  getKoreaTodayKey,
} from "@/lib/dailyMissions";

interface MissionStatus {
  code: string;
  title: string;
  description: string;
  maxCount: number;
  pointsPerAction: number;
  maxPoints: number;
  type: 'click' | 'count';
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward: number;
  status: 'pending' | 'completed' | 'claimed';
  progressText: string;
}

export default function NewDailyMissions() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [missions, setMissions] = useState<MissionStatus[]>([]);
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadMissions = () => {
      const status = getTodayMissionsStatus();
      setMissions(status);
    };

    loadMissions();

    // 자정까지 남은 시간 업데이트
    const updateTime = () => {
      const ms = getTimeUntilKoreaMidnight();
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset(`${hours}시간 ${minutes}분`);
    };

    updateTime();
    const interval = setInterval(() => {
      updateTime();
      loadMissions();
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [mounted]);

  const handleComplete = async (missionCode: string) => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (missionCode === 'SHARE_SITE') {
      // 공유하기 기능
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'DORI-AI',
            text: 'AI 활용 방법을 함께 연구하는 커뮤니티 플랫폼',
            url: window.location.origin,
          });
          // 공유 성공 시 미션 완료
          const success = await completeClickMission(missionCode);
          if (success) {
            const status = getTodayMissionsStatus();
            setMissions(status);
          }
        } catch (err) {
          // 사용자가 공유를 취소한 경우
          if ((err as Error).name !== 'AbortError') {
            console.error('공유 오류:', err);
          }
        }
      } else {
        // 공유 API를 지원하지 않는 경우 클립보드에 복사
        try {
          await navigator.clipboard.writeText(window.location.origin);
          alert('링크가 클립보드에 복사되었습니다!');
          const success = await completeClickMission(missionCode);
          if (success) {
            const status = getTodayMissionsStatus();
            setMissions(status);
          }
        } catch (err) {
          console.error('클립보드 복사 오류:', err);
          alert('공유 기능을 사용할 수 없습니다.');
        }
      }
    } else {
      const success = await completeClickMission(missionCode);
      if (success) {
        const status = getTodayMissionsStatus();
        setMissions(status);
      } else {
        alert("이미 완료한 미션입니다.");
      }
    }
  };

  const handleClaim = async (missionCode: string) => {
    if (claiming || !session?.user) return;

    if (isMissionClaimed(missionCode)) {
      alert("이미 수령한 보상입니다.");
      return;
    }

    setClaiming(missionCode);
    
    try {
      const reward = calculateMissionReward(missionCode);
      markMissionClaimed(missionCode);
      
      // 포인트 업데이트 (로컬스토리지)
      const todayKey = getKoreaTodayKey();
      const pointsKey = `daily_points_${session.user.email}_${todayKey}`;
      const currentPoints = parseInt(localStorage.getItem(pointsKey) || '0', 10);
      localStorage.setItem(pointsKey, (currentPoints + reward).toString());
      
      // 총 포인트 업데이트
      const totalPointsKey = `total_points_${session.user.email}`;
      const totalPoints = parseInt(localStorage.getItem(totalPointsKey) || '0', 10);
      localStorage.setItem(totalPointsKey, (totalPoints + reward).toString());

      const status = getTodayMissionsStatus();
      setMissions(status);
      
      alert(`${reward}포인트를 받았습니다!`);
    } catch (error) {
      console.error("보상 수령 오류:", error);
      alert("보상 수령 중 오류가 발생했습니다.");
    } finally {
      setClaiming(null);
    }
  };

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  if (!session?.user) {
    return (
      <div className="p-4 rounded-lg" style={{
        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      }}>
        <div className="text-sm text-center" style={{
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
        }}>
          로그인하여 미션을 확인하세요
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{
          color: isDark ? '#ffffff' : '#1d1d1f',
        }}>
          일일 미션
        </h3>
        <div className="text-xs" style={{
          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
        }}>
          리셋까지: {timeUntilReset}
        </div>
      </div>

      {/* 미션 목록 */}
      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission.code}
            className="p-4 rounded-lg border"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold" style={{
                    color: isDark ? '#ffffff' : '#1d1d1f',
                  }}>
                    {mission.title}
                  </h4>
                  {mission.status === 'claimed' && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      background: isDark ? 'rgba(34, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.15)',
                      color: isDark ? '#34d399' : '#059669',
                    }}>
                      완료
                    </span>
                  )}
                </div>
                <div className="text-sm mb-2" style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                }}>
                  {mission.description}
                  {mission.type === 'count' && (
                    <span className="ml-2">({mission.progressText})</span>
                  )}
                </div>
                <div className="text-xs font-medium" style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }}>
                  보상: {mission.reward}P
                  {mission.type === 'count' && mission.progress < mission.maxCount && (
                    <span className="ml-2">
                      (현재: {mission.progress * mission.pointsPerAction}P)
                    </span>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex-shrink-0">
                {mission.status === 'claimed' ? (
                  <div className="px-4 py-2 rounded text-sm" style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  }}>
                    수령 완료
                  </div>
                ) : mission.status === 'completed' ? (
                  <button
                    onClick={() => handleClaim(mission.code)}
                    disabled={claiming === mission.code}
                    className="px-4 py-2 rounded text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg, #34d399, #10b981)'
                        : 'linear-gradient(135deg, #059669, #047857)',
                      color: '#ffffff',
                    }}
                  >
                    {claiming === mission.code ? '수령 중...' : '보상 수령'}
                  </button>
                ) : mission.type === 'click' ? (
                  <button
                    onClick={() => handleComplete(mission.code)}
                    className="px-4 py-2 rounded text-sm font-medium transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isDark
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(37, 99, 235, 0.1)',
                      color: isDark ? '#60a5fa' : '#2563eb',
                      border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
                    }}
                  >
                    완료하기
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded text-sm text-center" style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                  }}>
                    진행 중
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

