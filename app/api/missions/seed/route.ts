import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// 미션 데이터를 강제로 재생성하는 API
export async function POST() {
  return handleSeed();
}

export async function GET() {
  return handleSeed();
}

async function handleSeed() {
  try {
    const db = getDb();
    console.log('Seed API 호출됨 - 미션 생성 시작');
    
    const missions = [
      // 일일 미션
      {
        code: 'DAILY_CHECKIN',
        title: '출석 체크',
        points: 10,
        reset_type: 'daily',
      },
      {
        code: 'WRITE_POST_1',
        title: '글 쓰기 1회',
        points: 15,
        reset_type: 'daily',
      },
      {
        code: 'WRITE_POST_3',
        title: '글 쓰기 3회',
        points: 30,
        reset_type: 'daily',
      },
      {
        code: 'WRITE_COMMENT_3',
        title: '댓글 쓰기 3회',
        points: 15,
        reset_type: 'daily',
      },
      {
        code: 'WRITE_COMMENT_5',
        title: '댓글 쓰기 5회',
        points: 25,
        reset_type: 'daily',
      },
      {
        code: 'LIKE_5',
        title: '좋아요 5개',
        points: 10,
        reset_type: 'daily',
      },
      {
        code: 'LIKE_10',
        title: '좋아요 10개',
        points: 20,
        reset_type: 'daily',
      },
      {
        code: 'BOOKMARK_3',
        title: '북마크 3개',
        points: 15,
        reset_type: 'daily',
      },
      {
        code: 'VISIT_AI_TOOLS',
        title: 'AI 도구 페이지 방문',
        points: 10,
        reset_type: 'daily',
      },
      {
        code: 'VISIT_COMMUNITY',
        title: '커뮤니티 페이지 방문',
        points: 10,
        reset_type: 'daily',
      },
      {
        code: 'VISIT_STUDIO',
        title: '스튜디오 페이지 방문',
        points: 10,
        reset_type: 'daily',
      },
      {
        code: 'SHARE_POST',
        title: '게시글 공유하기',
        points: 20,
        reset_type: 'daily',
      },
      
      // 주간 미션
      {
        code: 'WEEKLY_POST_10',
        title: '주간 글 쓰기 10회',
        points: 100,
        reset_type: 'weekly',
      },
      {
        code: 'WEEKLY_COMMENT_20',
        title: '주간 댓글 쓰기 20회',
        points: 80,
        reset_type: 'weekly',
      },
      {
        code: 'WEEKLY_LIKE_50',
        title: '주간 좋아요 50개',
        points: 60,
        reset_type: 'weekly',
      },
      {
        code: 'WEEKLY_ACTIVE_DAYS',
        title: '주간 5일 이상 활동',
        points: 150,
        reset_type: 'weekly',
      },
      {
        code: 'WEEKLY_BONUS',
        title: '주간 보너스',
        points: 50,
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
    
    // 생성 확인
    const verify = db.prepare(`
      SELECT code, title, points, reset_type
      FROM missions
      WHERE is_active = 1 AND reset_type = 'daily'
      ORDER BY code
    `).all();
    
    console.log(`미션 생성 완료: ${verify.length}개의 일일 미션이 확인되었습니다.`);

    return NextResponse.json({ 
      ok: true, 
      message: `${missions.length}개의 미션이 생성/업데이트되었습니다.`,
      missions,
      verified: verify.length
    });
  } catch (error) {
    console.error('미션 생성 오류:', error);
    return NextResponse.json(
      { ok: false, error: '미션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

