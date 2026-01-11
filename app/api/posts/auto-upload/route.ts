// app/api/posts/auto-upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const data = await request.formData(); // n8n이 보낸 상자 열기
    
    // 1. 텍스트 정보 꺼내기
    const title = data.get('title') as string;
    const content = data.get('content') as string;
    const fileName = data.get('fileName') as string;
    const category = data.get('category') as string;

    // 2. 이미지 파일 저장 로직 (이전에 드린 것과 동일)
    const thumbPath = path.join(process.cwd(), 'public/thumbnails/trend', `${fileName}.png`);
    const bodyPath = path.join(process.cwd(), 'public/images/trend', `${fileName}-1.png`);

    const thumbnail = data.get('data') as File;
    const bodyImage = data.get('data1') as File;

    if (thumbnail) {
      const buffer = Buffer.from(await thumbnail.arrayBuffer());
      await writeFile(thumbPath, buffer);
    }
    if (bodyImage) {
      const buffer = Buffer.from(await bodyImage.arrayBuffer());
      await writeFile(bodyPath, buffer);
    }

    // 3. .md 파일 생성
    const today = new Date().toISOString().split('T')[0];
    const markdownContent = `---
title: "${title}"
date: "${today}"
description: "${title}"
category: "${category}"
thumbnail: "/thumbnails/trend/${fileName}.png"
---

${content}
`;
    const postsDirectory = path.join(process.cwd(), 'posts');
    if (!fs.existsSync(postsDirectory)) await mkdir(postsDirectory, { recursive: true });
    await writeFile(path.join(postsDirectory, `${fileName}.md`), markdownContent);

    return NextResponse.json({ success: true }); // n8n에게 성공 알림!
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}