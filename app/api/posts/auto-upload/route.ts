import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const title = data.get('title') as string;
    const content = data.get('content') as string;
    const fileName = data.get('fileName') as string;
    const category = data.get('category') as string;

    // 1. 이미지를 클라우드(Vercel Blob)에 업로드
    const thumbFile = data.get('data') as File;
    const bodyFile = data.get('data1') as File;
    
    let thumbUrl = "";
    if (thumbFile) {
      // addRandomSuffix: true를 설정하여 중복 파일 에러를 방지합니다.
      const blob = await put(`thumbnails/${fileName}.png`, thumbFile, { 
        access: 'public', 
        addRandomSuffix: true 
      });
      thumbUrl = blob.url;
    }

    let bodyUrl = "";
    if (bodyFile) {
      // 본문 이미지도 마찬가지로 중복 방지 옵션을 적용합니다.
      const blob = await put(`images/${fileName}-1.png`, bodyFile, { 
        access: 'public', 
        addRandomSuffix: true 
      });
      bodyUrl = blob.url;
    }

    // 2. Postgres DB(neon-orange-yacht)에 데이터 저장
    await sql`
      INSERT INTO posts (title, content, category, thumbnail_url, body_image_url, file_name)
      VALUES (${title}, ${content}, ${category}, ${thumbUrl}, ${bodyUrl}, ${fileName})
    `;

    return NextResponse.json({ 
      success: true, 
      message: "중복 없이 안전하게 저장되었습니다!",
      url: thumbUrl 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}