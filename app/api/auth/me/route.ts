import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = jwt.verify(token.value, JWT_SECRET) as any;

    return NextResponse.json({
      user: {
        id: decoded.id,
        username: decoded.username,
        name: decoded.name,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}