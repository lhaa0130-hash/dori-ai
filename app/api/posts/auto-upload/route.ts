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
    const thumbFile = data.get('data') as File; // 썸네일
    const bodyFile = data.get('data1') as File; // 본문 이미지
    
    let thumbUrl = "";
    if (thumbFile) {
      const blob = await put(`thumbnails/${fileName}.png`, thumbFile, { access: 'public', addRandomSuffix: false });
      thumbUrl = blob.url;
    }

    let bodyUrl = "";
    if (bodyFile) {
      const blob = await put(`images/${fileName}-1.png`, bodyFile, { access: 'public', addRandomSuffix: false });
      bodyUrl = blob.url;
    }

    // 2. 방금 만든 'posts' 테이블에 정보 저장
    await sql`
      INSERT INTO posts (title, content, category, thumbnail_url, body_image_url, file_name)
      VALUES (${title}, ${content}, ${category}, ${thumbUrl}, ${bodyUrl}, ${fileName})
    `;

    return NextResponse.json({ success: true, message: "DB에 안전하게 저장되었습니다!" });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}