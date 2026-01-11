import { put } from '@vercel/blob'; // Vercel 전용 업로드 도구
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    
    // 1. n8n 데이터 수집
    const title = data.get('title') as string;
    const content = data.get('content') as string;
    const fileName = data.get('fileName') as string;
    
    // 2. 썸네일(data)을 Vercel Blob으로 직접 업로드
    const thumbnailFile = data.get('data') as File;
    let thumbnailUrl = "";
    if (thumbnailFile) {
      const blob = await put(`thumbnails/trend/${fileName}.png`, thumbnailFile, {
        access: 'public',
        addRandomSuffix: false, // 파일명을 고정하고 싶을 때 사용
      });
      thumbnailUrl = blob.url; // 클라우드에 저장된 이미지 주소
    }

    // 3. 본문 이미지(data1) 업로드
    const bodyImageFile = data.get('data1') as File;
    let bodyImageUrl = "";
    if (bodyImageFile) {
      const blob = await put(`images/trend/${fileName}-1.png`, bodyImageFile, {
        access: 'public',
      });
      bodyImageUrl = blob.url;
    }

    // 4. [중요] 글 저장 방식 변경 안내
    // Vercel에서는 파일을 직접 생성(.md)할 수 없으므로, 
    // 여기서 Supabase나 Prisma를 사용하여 DB에 저장해야 합니다.
    console.log("업로드된 이미지 주소:", thumbnailUrl, bodyImageUrl);
    console.log("저장할 제목:", title);

    // 우선은 성공 응답을 보내 n8n 에러를 해결합니다.
    return NextResponse.json({ 
      success: true, 
      thumbnailUrl, 
      bodyImageUrl,
      message: "이미지가 클라우드에 안전하게 저장되었습니다!" 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}