// app/api/posts/auto-upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const fileName = data.get('fileName') as string;
    const title = data.get('title') as string;
    const content = data.get('content') as string;
    const category = data.get('category') as string;

    // 1. 사용자님이 지정하신 정확한 경로 설정
    const mdDir = path.join(process.cwd(), 'content', 'trend');
    const thumbDir = path.join(process.cwd(), 'public', 'thumbnails', 'trend');
    const imageDir = path.join(process.cwd(), 'public', 'images', 'trend');

    // 2. 서버에 폴더가 없으면 자동으로 생성 (Vercel 에러 방지)
    for (const dir of [mdDir, thumbDir, imageDir]) {
      if (!fs.existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
    }

    // 3. 썸네일 이미지(data) 저장
    const thumbnail = data.get('data') as File;
    if (thumbnail) {
      const bytes = await thumbnail.arrayBuffer();
      await writeFile(path.join(thumbDir, `${fileName}.png`), Buffer.from(bytes));
    }

    // 4. 본문 이미지(data1) 저장
    const bodyImage = data.get('data1') as File;
    if (bodyImage) {
      const bytes = await bodyImage.arrayBuffer();
      await writeFile(path.join(imageDir, `${fileName}-1.png`), Buffer.from(bytes));
    }

    // 5. 마크다운(.md) 파일 생성 및 content/trend 폴더에 저장
    const today = new Date().toISOString().split('T')[0];
    const markdownContent = `---
title: "${title}"
date: "${today}"
description: "${title}"
category: "${category}"
thumbnail: "/thumbnails/trend/${fileName}.png"
---

${content}`;

    await writeFile(path.join(mdDir, `${fileName}.md`), markdownContent);

    return NextResponse.json({ success: true, message: "모든 파일이 지정된 위치에 저장되었습니다." });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}