import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const COMMUNITY_FILE = path.join(process.cwd(), 'data', 'community.json');

// 데이터 폴더 생성
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(COMMUNITY_FILE)) {
    fs.writeFileSync(COMMUNITY_FILE, JSON.stringify([]), 'utf8');
  }
}

// GET: 글 목록 조회
export async function GET() {
  try {
    ensureDataDir();
    const data = fs.readFileSync(COMMUNITY_FILE, 'utf8');
    const posts = JSON.parse(data);
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json([]);
  }
}

// POST: 글 작성
export async function POST(request: Request) {
  try {
    ensureDataDir();
    const body = await request.json();
    const { title, content, author } = body;

    const data = fs.readFileSync(COMMUNITY_FILE, 'utf8');
    const posts = JSON.parse(data);

    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      author,
      createdAt: new Date().toISOString(),
    };

    posts.unshift(newPost);
    fs.writeFileSync(COMMUNITY_FILE, JSON.stringify(posts, null, 2), 'utf8');

    return NextResponse.json(newPost);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}