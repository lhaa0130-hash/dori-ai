import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { missionCode } = body;

    if (!missionCode) {
      return NextResponse.json(
        { error: "미션 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // 포인트는 클라이언트에서 계산하고, 여기서는 검증만 수행
    // 실제 포인트 지급은 클라이언트의 localStorage에서 처리
    
    return NextResponse.json({
      ok: true,
      message: "보상이 지급되었습니다.",
    });
  } catch (error) {
    console.error("보상 수령 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

