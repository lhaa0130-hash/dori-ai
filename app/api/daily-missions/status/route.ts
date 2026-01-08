import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 클라이언트 측에서 처리하도록 간단한 응답만 반환
    // 실제 미션 상태는 클라이언트의 localStorage에서 관리
    return NextResponse.json({
      ok: true,
      message: "미션 상태는 클라이언트에서 관리됩니다.",
    });
  } catch (error) {
    console.error("미션 상태 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

