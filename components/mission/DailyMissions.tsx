"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

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

export default function DailyMissions({ isDark, onPointsUpdate }: DailyMissionsProps) {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted) {
      // 마운트 시 즉시 미션 로드
      loadMissions();
      
      // 추가로 seed API도 호출하여 미션 생성 보장
      fetch('/api/missions/seed', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          console.log('Seed API 응답:', data);
          if (data.ok) {
            // seed 후 미션 다시 로드
            setTimeout(() => loadMissions(), 300);
          }
        })
        .catch(err => console.error('Seed API 오류:', err));
    }
  }, [mounted, session]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/missions/today', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        console.error('미션 API HTTP 오류:', res.status, res.statusText);
        setMissions([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log('[DailyMissions] API 응답:', data);
      console.log('[DailyMissions] 미션 개수:', (data.missions || []).length);
      
      if (data.error) {
        console.error('[DailyMissions] API 오류:', data.error);
        setMissions([]);
      } else {
        const missionList = data.missions || [];
        console.log('[DailyMissions] 미션 목록:', missionList);
        setMissions(missionList);
        setProgress(data.progress || { completed: 0, total: missionList.length });
        
        // 미션이 없으면 seed API 호출
        if (missionList.length === 0) {
          console.log('[DailyMissions] 미션이 없어서 seed API를 호출합니다...');
          try {
            const seedRes = await fetch('/api/missions/seed', { 
              method: 'POST',
              cache: 'no-store',
            });
            const seedData = await seedRes.json();
            console.log('[DailyMissions] Seed API 응답:', seedData);
            
            // seed 후 다시 로드
            setTimeout(() => {
              console.log('[DailyMissions] Seed 후 미션 다시 로드...');
              loadMissions();
            }, 800);
          } catch (seedError) {
            console.error('[DailyMissions] Seed API 오류:', seedError);
          }
        }
      }
    } catch (error) {
      console.error('[DailyMissions] 미션 로드 오류:', error);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

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
        // 낙관적 UI 업데이트
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
        // 낙관적 UI 업데이트
        setMissions(prev => prev.map(m =>
          m.code === missionCode ? { ...m, status: 'claimed' as const } : m
        ));
        setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));

        // 포인트 업데이트 콜백
        if (onPointsUpdate && result.points !== undefined) {
          onPointsUpdate(result.points);
        }

        // 미션 상태 갱신
        await loadMissions();
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

  if (!mounted || loading) {
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

  // 미션이 없을 때도 표시
  if (missions.length === 0 && !loading) {
    return (
      <div className="py-2">
        <div
          className="text-xs text-center"
          style={{
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          }}
        >
          미션이 없습니다
        </div>
      </div>
    );
  }

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

      {/* 미션 목록 */}
      <div className="space-y-1.5">
        {missions.length > 0 ? missions.map((mission) => (
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
        )) : (
          <div
            className="text-xs text-center py-2"
            style={{
              color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            }}
          >
            미션이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

