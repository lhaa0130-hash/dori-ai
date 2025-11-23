import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // 검증: 이메일, 비번, 이름이 다 있는지
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // (실제라면 여기서 DB에 저장하고, 이메일 중복 체크를 합니다)
    console.log("새로운 회원가입:", { email, name });

    return NextResponse.json({ message: "회원가입 성공" });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}