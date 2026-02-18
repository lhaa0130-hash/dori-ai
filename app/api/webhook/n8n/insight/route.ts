import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseFirestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 보안 키 (환경 변수로 관리 권장)
const SECRET_KEY = process.env.N8N_WEBHOOK_SECRET || "dori_ai_n8n_secret_key_1234";

export async function POST(req: NextRequest) {
    try {
        // 1. 보안 검사 (Header 확인)
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${SECRET_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. 데이터 파싱
        const body = await req.json();
        const { title, content, summary, category, tags, thumbnail_url, slug } = body;

        // 필수 필드 검사
        if (!title || !content) {
            return NextResponse.json({ error: 'Missing required fields (title, content)' }, { status: 400 });
        }

        // 3. Firestore에 저장
        const db = getFirebaseFirestore();
        const postsRef = collection(db, 'posts');

        const newPost = {
            title,
            content, // HTML or Markdown
            summary: summary || content.substring(0, 100),
            category: category || '기타',
            tags: tags || [],
            thumbnail_url: thumbnail_url || '',
            slug: slug || '', // 선택적
            likes: 0,
            views: 0,
            created_at: new Date().toISOString(), // 클라이언트 정렬용 문자열
            timestamp: serverTimestamp(), // 서버용 타임스탬프
            source: 'n8n_automation'
        };

        const docRef = await addDoc(postsRef, newPost);

        return NextResponse.json({
            success: true,
            message: 'Post created successfully',
            id: docRef.id
        });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
