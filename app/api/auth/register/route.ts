import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, gender, ageGroup } = body;

    // 검증: 이메일, 비번, 이름, 성별, 연령층이 다 있는지
    if (!email || !password || !name || !gender || !ageGroup) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 성별과 연령층 유효성 검사
    if (gender !== "male" && gender !== "female") {
      return NextResponse.json(
        { error: "올바른 성별을 선택해주세요." },
        { status: 400 }
      );
    }

    if (!["10s", "20s", "30s", "40s"].includes(ageGroup)) {
      return NextResponse.json(
        { error: "올바른 연령층을 선택해주세요." },
        { status: 400 }
      );
    }

    // (실제라면 여기서 DB에 저장하고, 이메일 중복 체크를 합니다)
    console.log("새로운 회원가입:", { email, name, gender, ageGroup });

    // localStorage에 프로필 생성 (클라이언트에서 처리하도록 하거나, 여기서 처리)
    // 클라이언트에서 처리하는 것이 더 안전하므로 여기서는 검증만 수행

    return NextResponse.json({ message: "회원가입 성공" });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}