import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent('Say hello in Korean');
    const text = result.response.text();
    
    return NextResponse.json({
      success: true,
      model: 'gemini-1.5-flash',
      response: text
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      status: error.status,
      details: error
    }, { status: 500 });
  }
}