import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDb } from '@/lib/db';
import { getPeriodKeyForMission, getTodayPointsTotal, getTodayDateKey } from '@/lib/missions';
import { DAILY_MISSIONS } from '@/constants/missions';

// Rate limiting을 위한 간단한 메모리 저장소
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1분
const USER_RATE_LIMIT = 5; // 사용자당 1분에 5회
const IP_RATE_LIMIT = 20; // IP당 1분에 20회

function checkRateLimit(userId: string, ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  
  // 사용자 기반 rate limit
  const userKey = `user:${userId}`;
  const userLimit = rateLimitMap.get(userKey);
  if (userLimit && userLimit.resetAt > now) {
    if (userLimit.count >= USER_RATE_LIMIT) {
      return { allowed: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };
    }
    userLimit.count++;
  } else {
    rateLimitMap.set(userKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }

  // IP 기반 rate limit
  const ipKey = `ip:${ip}`;
  const ipLimit = rateLimitMap.get(ipKey);
  if (ipLimit && ipLimit.resetAt > now) {
    if (ipLimit.count >= IP_RATE_LIMIT) {
      return { allowed: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };
    }
    ipLimit.count++;
  } else {
    rateLimitMap.set(ipKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }

  // 오래된 항목 정리
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }

  return { allowed: true };
}

// AI 팁 목록
const AI_TIPS = [
  "AI는 창의성을 대체하지 않고, 인간의 창의성을 증폭시킵니다.",
  "프롬프트 엔지니어링은 AI와의 효과적인 소통을 위한 핵심 기술입니다.",
  "AI 모델은 학습 데이터의 편향을 반영할 수 있으므로, 결과를 비판적으로 검토하세요.",
  "생성형 AI는 반복적인 작업을 자동화하여 더 중요한 일에 집중할 수 있게 해줍니다.",
  "AI 도구를 선택할 때는 정확도, 속도, 비용의 균형을 고려하세요.",
  "AI와 협업할 때는 명확한 목표와 제약 조건을 설정하는 것이 중요합니다.",
  "AI 생성 콘텐츠는 항상 인간의 검토와 편집이 필요합니다.",
  "프라이버시와 보안을 고려하여 AI 도구를 선택하고 사용하세요.",
];

function getRandomTip(): string {
  return AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession({
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
    });

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { missionCode } = await request.json();

    if (!missionCode) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_REQUEST', error: '미션 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    const userId = session.user.email.toLowerCase();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Rate limiting 체크
    const rateLimitCheck = checkRateLimit(userId, clientIp);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { ok: false, code: 'RATE_LIMIT_EXCEEDED', error: rateLimitCheck.message },
        { status: 429 }
      );
    }

    const db = getDb();

    // 트랜잭션으로 처리
    const result = db.transaction(() => {
      // 미션 정보 조회 (DB에 없으면 상수에서 찾아서 DB에 생성)
      let mission = db.prepare(`
        SELECT code, title, points, reset_type
        FROM missions
        WHERE code = ? AND is_active = 1
      `).get(missionCode) as {
        code: string;
        title: string;
        points: number;
        reset_type: string;
      } | undefined;

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
            reset_type: 'daily',
          };
        } else {
          throw new Error('존재하지 않거나 비활성화된 미션입니다.');
        }
      }

      const periodKey = getPeriodKeyForMission(mission.reset_type as 'daily' | 'weekly');
      const todayKey = getTodayDateKey();

      // 일일 미션의 경우 user_missions 테이블 확인
      if (mission.reset_type === 'daily') {
        const userMission = db.prepare(`
          SELECT status
          FROM user_missions
          WHERE user_id = ? AND mission_code = ? AND date_yyyymmdd = ?
        `).get(userId, missionCode, todayKey) as { status: string } | undefined;

        if (!userMission || userMission.status === 'pending') {
          throw new Error('MISSION_NOT_COMPLETED');
        }

        if (userMission.status === 'claimed') {
          throw new Error('ALREADY_CLAIMED');
        }

        // 일일 포인트 제한 확인 (50P)
        const todayTotal = getTodayPointsTotal(db, userId);
        if (todayTotal + mission.points > 50) {
          throw new Error('DAILY_CAP_REACHED');
        }

        // user_missions 테이블 업데이트
        db.prepare(`
          UPDATE user_missions
          SET status = 'claimed', claimed_at = datetime('now')
          WHERE user_id = ? AND mission_code = ? AND date_yyyymmdd = ?
        `).run(userId, missionCode, todayKey);
      } else {
        // 주간 미션은 기존 로직 사용
        const existingClaim = db.prepare(`
          SELECT id
          FROM user_mission_claims
          WHERE user_id = ? AND mission_code = ? AND period_key = ?
        `).get(userId, missionCode, periodKey);

        if (existingClaim) {
          throw new Error('ALREADY_CLAIMED');
        }

        db.prepare(`
          INSERT INTO user_mission_claims (user_id, mission_code, period_key)
          VALUES (?, ?, ?)
        `).run(userId, missionCode, periodKey);
      }

      // 포인트 지급 기록
      db.prepare(`
        INSERT INTO point_ledger (user_id, delta, reason, mission_code)
        VALUES (?, ?, 'mission_claim', ?)
      `).run(userId, mission.points, missionCode);

        // 새로운 포인트 잔액 계산
        const balanceResult = db.prepare(`
          SELECT COALESCE(SUM(delta), 0) as balance
          FROM point_ledger
          WHERE user_id = ?
        `).get(userId) as { balance: number } | undefined;
        const newBalance = balanceResult?.balance || 0;

      // DAILY_TIP의 경우 팁 반환
      let tip: string | undefined;
      if (missionCode === 'DAILY_TIP') {
        tip = getRandomTip();
      }

      return {
        ok: true,
        points: newBalance,
        mission: {
          code: mission.code,
          status: 'claimed',
        },
        tip,
      };
    })();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('보상 수령 오류:', error);
    
    if (error.message === 'ALREADY_CLAIMED') {
      return NextResponse.json(
        { ok: false, code: 'ALREADY_CLAIMED', error: '이미 수령한 미션입니다.' },
        { status: 409 }
      );
    }

    if (error.message === 'MISSION_NOT_COMPLETED') {
      return NextResponse.json(
        { ok: false, code: 'MISSION_NOT_COMPLETED', error: '미션을 먼저 완료해주세요.' },
        { status: 400 }
      );
    }
    
    if (error.message === 'DAILY_CAP_REACHED') {
      return NextResponse.json(
        { ok: false, code: 'DAILY_CAP_REACHED', error: '일일 포인트 한도(50P)를 초과했습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { ok: false, code: 'INTERNAL_ERROR', error: error.message || '보상 수령 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
