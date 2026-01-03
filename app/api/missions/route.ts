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
    const missions = db.prepare(`
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

