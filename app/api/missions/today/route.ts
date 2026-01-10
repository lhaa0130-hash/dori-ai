import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDb } from '@/lib/db';
import { getTodayDateKey } from '@/lib/missions';
import { DAILY_MISSIONS } from '@/constants/missions';

export async function GET() {
  try {
    const session = await getServerSession({
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
    });

    const db = getDb();
    const todayKey = getTodayDateKey();

    // 활성 매일 미션만 가져오기 (DB에서 가져오거나 상수에서 사용)
    let missions = db.prepare(`
      SELECT code, title, points
      FROM missions
      WHERE is_active = 1 AND reset_type = 'daily'
      ORDER BY code
    `).all() as Array<{
      code: string;
      title: string;
      points: number;
    }>;

    // DB에 미션이 없으면 상수에서 가져와서 DB에 생성
    if (missions.length === 0) {
      console.log('[미션 자동 생성] DB에 미션이 없어서 자동 생성합니다...');
      console.log(`[미션 자동 생성] DAILY_MISSIONS 개수: ${DAILY_MISSIONS.length}`);
      
      try {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO missions (code, title, points, reset_type, is_active, updated_at)
          VALUES (?, ?, ?, 'daily', 1, datetime('now'))
        `);
        
        const insertMany = db.transaction((missionList) => {
          for (const m of missionList) {
            try {
              stmt.run(m.code, m.title, m.points);
              console.log(`[미션 자동 생성] 미션 생성: ${m.code} - ${m.title}`);
            } catch (insertError) {
              console.error(`[미션 자동 생성] 미션 생성 실패 (${m.code}):`, insertError);
            }
          }
        });
        
        insertMany(DAILY_MISSIONS);
        console.log(`[미션 자동 생성] ${DAILY_MISSIONS.length}개의 미션 생성 시도 완료`);
        
        // 즉시 다시 조회
        missions = db.prepare(`
          SELECT code, title, points
          FROM missions
          WHERE is_active = 1 AND reset_type = 'daily'
          ORDER BY code
        `).all() as Array<{
          code: string;
          title: string;
          points: number;
        }>;
        console.log(`[미션 자동 생성] 재조회 결과: ${missions.length}개의 미션을 찾았습니다.`);
        
        // 여전히 미션이 없으면 에러 반환
        if (missions.length === 0) {
          console.error('[미션 자동 생성] 경고: 미션 생성 후에도 미션이 없습니다!');
          // 상수에서 직접 반환
          return NextResponse.json({
            missions: DAILY_MISSIONS.map(m => ({
              code: m.code,
              title: m.title,
              points: m.points,
              status: session?.user?.email ? 'pending' as const : 'locked' as const,
            })),
            progress: { completed: 0, total: DAILY_MISSIONS.length },
            _fallback: true, // 상수에서 가져온 것임을 표시
          });
        }
      } catch (seedError) {
        console.error('[미션 자동 생성] 오류:', seedError);
        // 에러 발생 시 상수에서 직접 반환
        return NextResponse.json({
          missions: DAILY_MISSIONS.map(m => ({
            code: m.code,
            title: m.title,
            points: m.points,
            status: session?.user?.email ? 'pending' as const : 'locked' as const,
          })),
          progress: { completed: 0, total: DAILY_MISSIONS.length },
          _fallback: true,
        });
      }
    }

    if (!session?.user?.email) {
      // 비로그인: locked 상태로 반환
      return NextResponse.json({
        missions: missions.map(m => ({
          code: m.code,
          title: m.title,
          points: m.points,
          status: 'locked' as const,
        })),
        progress: { completed: 0, total: missions.length },
      });
    }

    const userId = session.user.email.toLowerCase();

    // 오늘의 사용자 미션 상태 조회 (없으면 생성)
    const userMissions = db.prepare(`
      SELECT mission_code, status, completed_at, claimed_at
      FROM user_missions
      WHERE user_id = ? AND date_yyyymmdd = ?
    `).all(userId, todayKey) as Array<{
      mission_code: string;
      status: 'pending' | 'completed' | 'claimed';
      completed_at: string | null;
      claimed_at: string | null;
    }>;

    const userMissionsMap = new Map<string, { status: string; completed_at: string | null; claimed_at: string | null }>();
    for (const um of userMissions) {
      userMissionsMap.set(um.mission_code, {
        status: um.status,
        completed_at: um.completed_at,
        claimed_at: um.claimed_at,
      });
    }

    // 오늘의 미션 목록 생성 (없으면 pending 상태로 생성)
    const missionsWithStatus = missions.map(mission => {
      const userMission = userMissionsMap.get(mission.code);
      
      // 오늘의 미션이 없으면 생성
      if (!userMission) {
        db.prepare(`
          INSERT OR IGNORE INTO user_missions (user_id, mission_code, date_yyyymmdd, status)
          VALUES (?, ?, ?, 'pending')
        `).run(userId, mission.code, todayKey);
      }

      return {
        code: mission.code,
        title: mission.title,
        points: mission.points,
        status: (userMission?.status || 'pending') as 'pending' | 'completed' | 'claimed',
      };
    });

    // 진행도 계산
    const completed = missionsWithStatus.filter(m => m.status === 'claimed').length;
    const total = missionsWithStatus.length;

    return NextResponse.json({
      missions: missionsWithStatus,
      progress: { completed, total },
    });
  } catch (error) {
    console.error('오늘의 미션 조회 오류:', error);
    return NextResponse.json(
      { error: '미션 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

