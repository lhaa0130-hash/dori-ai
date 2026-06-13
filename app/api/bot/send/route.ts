import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseFirestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// illo 봇 메시지 전송 — n8n 자동화·스크립트가 호출. insight 웹훅과 동일한 Bearer 보안.
const SECRET_KEY = process.env.N8N_WEBHOOK_SECRET || "dori_ai_n8n_secret_key_1234";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    // to: 받는 사람 uid 또는 "broadcast"(전체 공지) | kind: notice|dm|info
    const { to, kind, title, message, link } = body;
    if (!title && !message) {
      return NextResponse.json({ error: 'Missing required field (title or message)' }, { status: 400 });
    }
    const db = getFirebaseFirestore();
    const ref = await addDoc(collection(db, 'bot_messages'), {
      to: to || 'broadcast',
      from: 'illo-bot',
      kind: kind || 'notice',
      title: title || '',
      body: message || '',
      link: link || '',
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
      source: 'illo-bot',
    });
    return NextResponse.json({ success: true, id: ref.id });
  } catch (error) {
    console.error('bot/send Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
