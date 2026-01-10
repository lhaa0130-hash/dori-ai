import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDb } from '@/lib/db';
import { getPeriodKeyForMission } from '@/lib/missions';

export async function GET() {
  try {
    const session = await getServerSession({
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
    });

    const db = getDb();

    // 활성 미션 목록 가져오기
    let missions = db.prepare(`
      SELECT code, title, points, reset_type
      FROM missions
      WHERE is_active = 1
      ORDER BY reset_type DESC, code
    `).all() as Array<{
      code: string;
      title: string;
      points: number;
      reset_type: string;
    }>;

    // 미션이 없으면 자동으로 생성
    if (missions.length === 0) {
      const seedMissions = [
        // 일일 미션
        { code: 'DAILY_CHECKIN', title: '출석 체크', points: 10, reset_type: 'daily' },
        { code: 'WRITE_POST_1', title: '글 쓰기 1회', points: 15, reset_type: 'daily' },
        { code: 'WRITE_POST_3', title: '글 쓰기 3회', points: 30, reset_type: 'daily' },
        { code: 'WRITE_COMMENT_3', title: '댓글 쓰기 3회', points: 15, reset_type: 'daily' },
        { code: 'WRITE_COMMENT_5', title: '댓글 쓰기 5회', points: 25, reset_type: 'daily' },
        { code: 'LIKE_5', title: '좋아요 5개', points: 10, reset_type: 'daily' },
        { code: 'LIKE_10', title: '좋아요 10개', points: 20, reset_type: 'daily' },
        { code: 'BOOKMARK_3', title: '북마크 3개', points: 15, reset_type: 'daily' },
        { code: 'VISIT_AI_TOOLS', title: 'AI 도구 페이지 방문', points: 10, reset_type: 'daily' },
        { code: 'VISIT_COMMUNITY', title: '커뮤니티 페이지 방문', points: 10, reset_type: 'daily' },
        { code: 'VISIT_STUDIO', title: '스튜디오 페이지 방문', points: 10, reset_type: 'daily' },
        { code: 'SHARE_POST', title: '게시글 공유하기', points: 20, reset_type: 'daily' },
        
        // 주간 미션
        { code: 'WEEKLY_POST_10', title: '주간 글 쓰기 10회', points: 100, reset_type: 'weekly' },
        { code: 'WEEKLY_COMMENT_20', title: '주간 댓글 쓰기 20회', points: 80, reset_type: 'weekly' },
        { code: 'WEEKLY_LIKE_50', title: '주간 좋아요 50개', points: 60, reset_type: 'weekly' },
        { code: 'WEEKLY_ACTIVE_DAYS', title: '주간 5일 이상 활동', points: 150, reset_type: 'weekly' },
        { code: 'WEEKLY_BONUS', title: '주간 보너스', points: 50, reset_type: 'weekly' },
      ];

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO missions (code, title, points, reset_type, is_active, updated_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'))
      `);

      const insertMany = db.transaction((missions) => {
        for (const mission of missions) {
          stmt.run(mission.code, mission.title, mission.points, mission.reset_type);
        }
      });

      insertMany(seedMissions);

      // 다시 조회
      missions = db.prepare(`
        SELECT code, title, points, reset_type
        FROM missions
        WHERE is_active = 1
        ORDER BY reset_type DESC, code
      `).all() as Array<{
        code: string;
        title: string;
        points: number;
        reset_type: string;
      }>;
    }

    if (!session?.user?.email) {
      // 비로그인: locked 상태로 반환
      return NextResponse.json({
        points: null,
        missions: missions.map(m => ({
          code: m.code,
          title: m.title,
          points: m.points,
          reset_type: m.reset_type,
          status: 'locked',
        })),
      });
    }

    const userId = session.user.email.toLowerCase();

    // 사용자의 현재 포인트 잔액 계산
    const pointResult = db.prepare(`
      SELECT COALESCE(SUM(delta), 0) as balance
      FROM point_ledger
      WHERE user_id = ?
    `).get(userId) as { balance: number } | undefined;
    const points = pointResult?.balance || 0;

    // 사용자의 미션 수령 내역 조회
    const claims = db.prepare(`
      SELECT mission_code, period_key
      FROM user_mission_claims
      WHERE user_id = ?
    `).all(userId) as Array<{
      mission_code: string;
      period_key: string;
    }>;

    const claimsMap = new Map<string, boolean>();
    for (const claim of claims) {
      const key = `${claim.mission_code}_${claim.period_key}`;
      claimsMap.set(key, true);
    }

    // 미션 상태 결정
    const missionsWithStatus = missions.map(mission => {
      const periodKey = getPeriodKeyForMission(mission.reset_type as 'daily' | 'weekly');
      const claimKey = `${mission.code}_${periodKey}`;
      const isClaimed = claimsMap.has(claimKey);

      return {
        code: mission.code,
        title: mission.title,
        points: mission.points,
        reset_type: mission.reset_type,
        status: isClaimed ? 'claimed' : 'available',
      };
    });

    return NextResponse.json({
      points,
      missions: missionsWithStatus,
    });
  } catch (error) {
    console.error('미션 조회 오류:', error);
    return NextResponse.json(
      { error: '미션 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

