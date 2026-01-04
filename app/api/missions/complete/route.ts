import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDb } from '@/lib/db';
import { getTodayDateKey } from '@/lib/missions';
import { DAILY_MISSIONS } from '@/constants/missions';

export async function POST(request: Request) {
  try {
    const session = await getServerSession({
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
    });

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { missionCode } = await request.json();

    if (!missionCode) {
      return NextResponse.json(
        { ok: false, error: '미션 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    const userId = session.user.email.toLowerCase();
    const db = getDb();
    const todayKey = getTodayDateKey();

    // 미션이 활성화되어 있는지 확인 (DB에 없으면 상수에서 찾아서 DB에 생성)
    let mission = db.prepare(`
      SELECT code, title, points
      FROM missions
      WHERE code = ? AND is_active = 1 AND reset_type = 'daily'
    `).get(missionCode) as {
      code: string;
      title: string;
      points: number;
    } | undefined;

    // DB에 없으면 상수에서 찾아서 DB에 생성
    if (!mission) {
      const missionDef = DAILY_MISSIONS.find(m => m.code === missionCode);
      if (missionDef) {
        db.prepare(`
          INSERT OR REPLACE INTO missions (code, title, points, reset_type, is_active, updated_at)
          VALUES (?, ?, ?, 'daily', 1, datetime('now'))
        `).run(missionDef.code, missionDef.title, missionDef.points);
        
        mission = {
          code: missionDef.code,
          title: missionDef.title,
          points: missionDef.points,
        };
      } else {
        return NextResponse.json(
          { ok: false, error: '존재하지 않거나 비활성화된 미션입니다.' },
          { status: 404 }
        );
      }
    }

    // 오늘의 미션 상태 확인/생성
    const userMission = db.prepare(`
      SELECT status
      FROM user_missions
      WHERE user_id = ? AND mission_code = ? AND date_yyyymmdd = ?
    `).get(userId, missionCode, todayKey) as { status: string } | undefined;

    if (userMission?.status === 'claimed') {
      return NextResponse.json(
        { ok: false, error: '이미 수령한 미션입니다.' },
        { status: 409 }
      );
    }

    // 완료 상태로 업데이트 (없으면 생성)
    const existing = db.prepare(`
      SELECT status
      FROM user_missions
      WHERE user_id = ? AND mission_code = ? AND date_yyyymmdd = ?
    `).get(userId, missionCode, todayKey);

    if (existing) {
      // 이미 존재하면 claimed가 아닐 때만 업데이트
      if ((existing as { status: string }).status !== 'claimed') {
        db.prepare(`
          UPDATE user_missions
          SET status = 'completed', completed_at = datetime('now')
          WHERE user_id = ? AND mission_code = ? AND date_yyyymmdd = ?
        `).run(userId, missionCode, todayKey);
      }
    } else {
      // 없으면 생성
      db.prepare(`
        INSERT INTO user_missions (user_id, mission_code, date_yyyymmdd, status, completed_at)
        VALUES (?, ?, ?, 'completed', datetime('now'))
      `).run(userId, missionCode, todayKey);
    }

    return NextResponse.json({
      ok: true,
      mission: {
        code: mission.code,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('미션 완료 오류:', error);
    return NextResponse.json(
      { ok: false, error: '미션 완료 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

