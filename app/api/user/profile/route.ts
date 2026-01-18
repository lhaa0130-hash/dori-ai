import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 프로필 업데이트 API
export async function PUT(request: Request) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, bio, statusMessage, profileImageUrl } = body;

    // 닉네임 필수 검증
    if (!nickname || !nickname.trim()) {
      return NextResponse.json(
        { error: "닉네임은 필수입니다." },
        { status: 400 }
      );
    }

    // 길이 제한 검증
    if (nickname.trim().length > 20) {
      return NextResponse.json(
        { error: "닉네임은 20자 이하여야 합니다." },
        { status: 400 }
      );
    }

    if (bio && bio.length > 80) {
      return NextResponse.json(
        { error: "한 줄 소개는 80자 이하여야 합니다." },
        { status: 400 }
      );
    }

    if (statusMessage && statusMessage.length > 20) {
      return NextResponse.json(
        { error: "상태 메시지는 20자 이하여야 합니다." },
        { status: 400 }
      );
    }

    // TODO: 실제 DB 업데이트 로직 추가
    // 예시:
    // await db.user.update({
    //   where: { email: session.user.email },
    //   data: {
    //     name: nickname.trim(),
    //     bio: bio?.trim(),
    //     statusMessage: statusMessage?.trim(),
    //     profileImageUrl,
    //   }
    // });

    // 현재는 localStorage만 사용하므로 여기서는 검증만 수행
    // 실제 DB 업데이트가 있다면 위 주석을 해제하고 구현

    // 서버 캐시 무효화 - 프로필 관련 페이지들
    revalidatePath("/my");
    revalidatePath("/my/edit");
    revalidatePath("/profile");
    
    // 특정 태그로 캐시 무효화 (필요한 경우)
    revalidateTag(`user-profile-${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "프로필이 업데이트되었습니다.",
      data: {
        nickname: nickname.trim(),
        bio: bio?.trim(),
        statusMessage: statusMessage?.trim(),
        profileImageUrl,
      }
    });
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return NextResponse.json(
      { error: "프로필 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

