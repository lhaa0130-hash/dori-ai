import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8');
  }
}

export async function POST(request: Request) {
  try {
    ensureDataDir();
    const { username, password, name } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 아이디 유효성 검사 (영문, 숫자만 허용, 4-20자)
    const usernameRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: '아이디는 영문, 숫자 4-20자로 입력해주세요.' },
        { status: 400 }
      );
    }

    // 비밀번호 유효성 검사 (최소 6자)
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);

    // 아이디 중복 확인
    if (users.find((u: any) => u.username === username)) {
      return NextResponse.json(
        { error: '이미 사용 중인 아이디입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

    return NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      user: { id: newUser.id, username: newUser.username, name: newUser.name },
    });
  } catch (error) {
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}