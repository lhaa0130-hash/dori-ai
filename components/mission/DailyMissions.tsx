"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { DAILY_MISSIONS } from "@/constants/missions";

interface Mission {
  code: string;
  title: string;
  points: number;
  status: 'pending' | 'completed' | 'claimed' | 'locked';
}

interface DailyMissionsProps {
  isDark: boolean;
  onPointsUpdate?: (newPoints: number) => void;
}

// 하드코딩된 미션 목록 (무조건 표시)
const HARDCODED_MISSIONS = [
  { code: "DAILY_CHECKIN", title: "출석 체크", points: 10, status: "pending" as const },
  { code: "WRITE_POST_1", title: "글 쓰기 1회", points: 15, status: "pending" as const },
  { code: "WRITE_POST_3", title: "글 쓰기 3회", points: 30, status: "pending" as const },
  { code: "WRITE_COMMENT_3", title: "댓글 쓰기 3회", points: 15, status: "pending" as const },
  { code: "WRITE_COMMENT_5", title: "댓글 쓰기 5회", points: 25, status: "pending" as const },
  { code: "LIKE_5", title: "좋아요 5개", points: 10, status: "pending" as const },
  { code: "LIKE_10", title: "좋아요 10개", points: 20, status: "pending" as const },
  { code: "BOOKMARK_3", title: "북마크 3개", points: 15, status: "pending" as const },
  { code: "VISIT_AI_TOOLS", title: "AI 도구 페이지 방문", points: 10, status: "pending" as const },
  { code: "VISIT_COMMUNITY", title: "커뮤니티 페이지 방문", points: 10, status: "pending" as const },
  { code: "VISIT_STUDIO", title: "스튜디오 페이지 방문", points: 10, status: "pending" as const },
  { code: "SHARE_POST", title: "게시글 공유하기", points: 20, status: "pending" as const },
];

export default function DailyMissions({ isDark, onPointsUpdate }: DailyMissionsProps) {
  const { session } = useAuth();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [missions, setMissions] = useState<Mission[]>(HARDCODED_MISSIONS);
  const [progress, setProgress] = useState({ completed: 0, total: HARDCODED_MISSIONS.length });
  const [completing, setCompleting] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && session?.user) {
      // 백그라운드에서 API 호출 (선택적)
      fetch('/api/missions/today', {
        cache: 'no-store',
      })
        .then(res => res.json())
        .then(data => {
          if (data.missions && data.missions.length > 0) {
            setMissions(data.missions);
            setProgress(data.progress || { completed: 0, total: data.missions.length });
          }
        })
        .catch(err => {
          console.error('미션 API 오류:', err);
          // 에러가 발생해도 하드코딩된 미션은 유지
        });
    }
  }, [mounted, session]);

  const handleComplete = async (missionCode: string) => {
    if (completing || !session?.user) return;

    setCompleting(missionCode);
    try {
      const res = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionCode }),
      });

      const result = await res.json();

      if (result.ok) {
        setMissions(prev => prev.map(m =>
          m.code === missionCode ? { ...m, status: 'completed' as const } : m
        ));
      } else {
        alert(result.error || '미션 완료에 실패했습니다.');
      }
    } catch (error) {
      console.error('미션 완료 오류:', error);
      alert('미션 완료 중 오류가 발생했습니다.');
    } finally {
      setCompleting(null);
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
        setMissions(prev => prev.map(m =>
          m.code === missionCode ? { ...m, status: 'claimed' as const } : m
        ));
        setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));

        if (onPointsUpdate && result.points !== undefined) {
          onPointsUpdate(result.points);
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

  if (!mounted) {
    return (
      <div className="py-2">
        <div
          className="text-xs text-center"
          style={{
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          }}
        >
          로딩 중...
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="py-2">
        <div
          className="text-xs text-center"
          style={{
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          }}
        >
          로그인하여 미션을 확인하세요
        </div>
      </div>
    );
  }

  // 무조건 하드코딩된 미션 표시
  const displayMissions = missions.length > 0 ? missions : HARDCODED_MISSIONS;

  return (
    <div className="space-y-2">
      {/* 진행도 표시 */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          }}
        >
          일일 미션
        </div>
        <div
          className="text-[10px] font-medium"
          style={{
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          }}
        >
          {progress.completed}/{progress.total} 완료
        </div>
      </div>

      {/* 미션 목록 - 무조건 표시 */}
      <div className="space-y-1.5">
        {displayMissions.map((mission) => (
          <div
            key={mission.code}
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{
              background: isDark
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* 상태 아이콘/체크박스 */}
            <div className="flex-shrink-0">
              {mission.status === 'claimed' ? (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    background: isDark
                      ? 'rgba(34, 211, 153, 0.2)'
                      : 'rgba(5, 150, 105, 0.15)',
                  }}
                >
                  <span className="text-[10px]">✓</span>
                </div>
              ) : mission.status === 'completed' ? (
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{
                    borderColor: isDark
                      ? 'rgba(34, 211, 153, 0.5)'
                      : 'rgba(5, 150, 105, 0.5)',
                  }}
                />
              ) : (
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.2)',
                  }}
                />
              )}
            </div>

            {/* 미션 정보 */}
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-medium truncate"
                style={{
                  color: isDark ? '#ffffff' : '#1d1d1f',
                }}
              >
                {mission.title}
              </div>
              <div
                className="text-[10px]"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }}
              >
                +{mission.points}P
              </div>
            </div>

            {/* 액션 버튼 */}
            {mission.status === 'claimed' ? (
              <div
                className="text-[10px] px-2 py-1 rounded"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }}
              >
                완료
              </div>
            ) : mission.status === 'completed' ? (
              <button
                onClick={() => handleClaim(mission.code)}
                disabled={claiming === mission.code}
                className="px-2 py-1 rounded text-[10px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #34d399, #10b981)'
                    : 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                }}
              >
                {claiming === mission.code ? '...' : '수령'}
              </button>
            ) : mission.status === 'locked' ? (
              <div
                className="text-[10px] px-2 py-1 rounded opacity-50"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                }}
              >
                🔒
              </div>
            ) : (
              <button
                onClick={() => handleComplete(mission.code)}
                disabled={completing === mission.code}
                className="px-2 py-1 rounded text-[10px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                }}
              >
                {completing === mission.code
                  ? '...'
                  : mission.code === 'DAILY_CHECKIN'
                    ? '체크'
                    : '완료'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
