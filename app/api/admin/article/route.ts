import { NextRequest, NextResponse } from 'next/server';
// ⚠️ Edge Function(functions/api/admin/article.ts)과 **동일한** 관리자 인증 계약을 쓴다.
//   인증 로직을 복제하면 한 쪽만 약해도 전체가 뚫린다 → 서버 전용 공통 모듈을 재사용한다.
import { verifyAdmin } from '@/functions/_shared/adminAuth';

const ADMIN_EMAIL = 'lhaa0130@gmail.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_OWNER = 'lhaa0130-hash';
const GITHUB_REPO = 'dori-ai';

// slug → GitHub 파일 경로 매핑
function getFilePath(slug: string): string | null {
  if (slug.startsWith('trend-'))    return `content/trend/${slug}.md`;
  if (slug.startsWith('analysis-')) return `content/analysis/${slug}.md`;
  if (slug.startsWith('curation-')) return `content/curation/${slug}.md`;
  if (slug.startsWith('report-'))   return `content/reports/${slug}.md`;
  return null;
}

async function getFileSha(filePath: string): Promise<{ sha: string; content?: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return { sha: data.sha, content: data.content };
}

export async function POST(req: NextRequest) {
  try {
    const { action, slug, content, idToken } = await req.json();

    // 필수 파라미터 검증
    if (!action || !slug || !idToken) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }
    if (!['delete', 'update'].includes(action)) {
      return NextResponse.json({ error: '잘못된 action' }, { status: 400 });
    }
    if (action === 'update' && !content) {
      return NextResponse.json({ error: '수정 내용 없음' }, { status: 400 });
    }

    // 관리자 인증 — Edge Function 과 동일한 공통 계약.
    //   401 = 토큰 무효 / 403 = 로그인은 했으나 관리자 아님.
    const admin = await verifyAdmin(idToken, process.env as unknown as Record<string, any>);
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? '인증 실패' : '관리자 권한 없음', code: admin.reason },
        { status: admin.status },
      );
    }

    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'GITHUB_TOKEN 환경변수 미설정' }, { status: 500 });
    }

    // slug → 파일 경로
    const filePath = getFilePath(slug);
    if (!filePath) {
      return NextResponse.json({ error: `지원하지 않는 slug 형식: ${slug}` }, { status: 400 });
    }

    // 파일 SHA 조회
    const fileInfo = await getFileSha(filePath);
    if (!fileInfo) {
      return NextResponse.json({ error: `파일을 찾을 수 없음: ${filePath}` }, { status: 404 });
    }

    if (action === 'delete') {
      // ── 삭제 ───────────────────────────────────────────────────────
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            message: `[admin] delete: ${slug}`,
            sha: fileInfo.sha,
            committer: { name: 'illo Admin', email: ADMIN_EMAIL },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `GitHub 삭제 실패: ${err}` }, { status: 500 });
      }
      return NextResponse.json({ ok: true, action: 'delete', slug });

    } else {
      // ── 수정 ───────────────────────────────────────────────────────
      // Buffer는 Node.js 전용 → Cloudflare Workers 호환 btoa 사용 (한국어 포함)
      const contentBase64 = btoa(unescape(encodeURIComponent(content)));
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            message: `[admin] update: ${slug}`,
            content: contentBase64,
            sha: fileInfo.sha,
            committer: { name: 'illo Admin', email: ADMIN_EMAIL },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `GitHub 수정 실패: ${err}` }, { status: 500 });
      }
      return NextResponse.json({ ok: true, action: 'update', slug });
    }
  } catch (err: any) {
    console.error('[admin/article] 오류:', err);
    return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
  }
}
