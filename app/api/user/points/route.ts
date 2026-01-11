import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession({
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
    });

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { points, reason } = await request.json();

    if (!points || typeof points !== 'number') {
      return NextResponse.json(
        { error: '포인트 값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // 포인트는 클라이언트에서 localStorage로 관리하므로
    // 여기서는 성공 응답만 반환
    // 실제 포인트 관리는 클라이언트에서 처리

    return NextResponse.json({
      ok: true,
      points: points, // 클라이언트에서 계산된 포인트
      message: `${points}포인트가 적립되었습니다. (${reason})`,
    });
  } catch (error) {
    console.error('포인트 적립 오류:', error);
    return NextResponse.json(
      { error: '포인트 적립 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}



