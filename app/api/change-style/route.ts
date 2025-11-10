import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: '프롬프트를 입력해주세요' }, { status: 400 });
    }

    // 현재 CSS 읽기
    const cssPath = path.join(process.cwd(), 'app', 'globals.css');
    const currentCSS = fs.readFileSync(cssPath, 'utf8');

    // GPT에게 CSS 생성 요청
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 CSS 전문가입니다. 사용자의 요청에 따라 웹사이트의 globals.css 파일을 수정해주세요.

현재 CSS:
\`\`\`css
${currentCSS}
\`\`\`

새로운 CSS를 생성할 때 규칙:
1. 반드시 @tailwind 지시문으로 시작
2. 기존 구조 유지
3. 색상, 폰트, 간격만 변경
4. 코드만 출력하고 설명 없이
5. \`\`\`css 같은 마크다운 없이 순수 CSS만`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const cssCode = completion.choices[0].message.content?.trim() || '';

    // globals.css 파일 수정
    fs.writeFileSync(cssPath, cssCode, 'utf8');

    return NextResponse.json({ 
      success: true, 
      message: '스타일이 변경되었습니다!',
      css: cssCode.substring(0, 500) + '...' // 일부만 반환
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error.message || '스타일 변경 중 오류가 발생했습니다' 
    }, { status: 500 });
  }
}