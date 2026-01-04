import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// 미션 데이터를 강제로 재생성하는 API
export async function POST() {
  try {
    const db = getDb();
    
    const missions = [
      {
        code: 'DAILY_CHECKIN',
        title: '출석 체크',
        points: 10,
        reset_type: 'daily',
      },
      {
        code: 'WRITE_POST_1',
        title: '글 쓰기 1회',
        points: 10,
        reset_type: 'daily',
      },
      {
        code: 'WRITE_COMMENT_3',
        title: '댓글 쓰기 3회',
        points: 10,
        reset_type: 'daily',
      },
      {
        code: 'WEEKLY_BONUS',
        title: 'Weekly Bonus',
        points: 10,
        reset_type: 'weekly',
      },
    ];

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO missions (code, title, points, reset_type, is_active, updated_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `);

    const insertMany = db.transaction((missions) => {
      for (const mission of missions) {
        stmt.run(
          mission.code,
          mission.title,
          mission.points,
          mission.reset_type
        );
      }
    });

    insertMany(missions);

    return NextResponse.json({ 
      ok: true, 
      message: `${missions.length}개의 미션이 생성/업데이트되었습니다.`,
      missions 
    });
  } catch (error) {
    console.error('미션 생성 오류:', error);
    return NextResponse.json(
      { ok: false, error: '미션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

