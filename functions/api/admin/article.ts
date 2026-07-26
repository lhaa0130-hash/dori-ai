// Cloudflare Pages Function — 정적 사이트와 함께 배포되는 서버리스 함수
// /api/admin/article 경로로 자동 매핑됨

import { verifyArticleAdmin } from '../../_shared/adminAuth';

// git 커밋 작성자 표기용 이메일 — **권한 근거가 아니다**(인가는 ARTICLE_ADMIN_UIDS 만 사용).
const COMMITTER_EMAIL = 'lhaa0130@gmail.com';

const GITHUB_OWNER = 'lhaa0130-hash';
const GITHUB_REPO = 'dori-ai';

// ⚠️ 2026-07-26 장애: 여기에 Firebase Web API 키가 하드코딩돼 있었고, 그 키가 폐기되면서
//   verifyAdminToken 이 항상 실패해 **관리자 기사 발행이 조용히 깨져 있었다**(로그인 장애와 동일 원인).
//   → API 키 의존을 제거하고, 관리자 인증을 공통 모듈(_shared/adminAuth)로 일원화했다.
//   ⚠️ Firestore 접근 성공 = '로그인한 사용자'일 뿐이다. 관리자 판정은 adminAuth 가 따로 한다.

interface Env {
  GITHUB_TOKEN: string;
}

// slug → GitHub 파일 경로 매핑
function getFilePath(slug: string): string | null {
  if (slug.startsWith('trend-'))    return `content/trend/${slug}.md`;
  if (slug.startsWith('analysis-')) return `content/analysis/${slug}.md`;
  if (slug.startsWith('curation-')) return `content/curation/${slug}.md`;
  if (slug.startsWith('report-'))   return `content/reports/${slug}.md`;
  if (slug.startsWith('studio-'))   return `content/studio/${slug}.md`;
  return null;
}

// GitHub 파일 SHA 조회
async function getFileSha(filePath: string, token: string): Promise<{ sha: string; _status?: number; _error?: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'illo-Admin/1.0',
      },
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { sha: '', _status: res.status, _error: errText.substring(0, 200) };
  }
  const data: any = await res.json();
  return { sha: data.sha };
}

// JSON 응답 헬퍼
function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const GITHUB_TOKEN = env.GITHUB_TOKEN;

  try {
    const body: any = await request.json();
    const { action, slug, content, idToken } = body;

    // 필수 파라미터 검증
    if (!action || !slug || !idToken) {
      return json({ error: '필수 파라미터 누락 (action, slug, idToken)' }, 400);
    }
    if (!['delete', 'update'].includes(action)) {
      return json({ error: '잘못된 action (delete 또는 update만 허용)' }, 400);
    }
    if (action === 'update' && !content) {
      return json({ error: '수정 내용(content)이 없음' }, 400);
    }
    if (!GITHUB_TOKEN) {
      return json({ error: 'GITHUB_TOKEN 환경변수 미설정. Cloudflare Pages 변수 설정 필요.' }, 500);
    }

    // 관리자 인증 — 공통 계약(_shared/adminAuth): aud/iss/exp + Firestore 실검증 + 관리자 판정.
    //   401 = 토큰이 유효하지 않음 / 403 = 로그인은 했지만 관리자가 아님. 둘을 구분해 응답한다.
    //   ⚠️ 내부 오류·토큰·SA 정보를 응답에 담지 않는다(reason 은 고정 문자열 코드).
    const admin = await verifyArticleAdmin(idToken, env as unknown as Record<string, any>);
    if (!admin.ok) {
      const msg = admin.status === 401 ? '인증 실패'
        : admin.status === 503 ? '기사 관리자 기능이 아직 설정되지 않았습니다.'
        : '관리자 권한 없음';
      return json({ error: msg, code: admin.reason }, admin.status);
    }

    // slug → 파일 경로 변환
    const filePath = getFilePath(slug);
    if (!filePath) {
      return json({ error: `지원하지 않는 slug 형식: ${slug}` }, 400);
    }

    // GitHub 파일 SHA 조회
    const fileInfo = await getFileSha(filePath, GITHUB_TOKEN);
    if (!fileInfo || !fileInfo.sha) {
      const status = fileInfo?._status ?? 'fetch실패';
      const ghErr = fileInfo?._error ?? '';
      return json({
        error: `GitHub API ${status} | 경로: ${filePath} | 토큰길이: ${GITHUB_TOKEN.length} | ${ghErr}`,
      }, 404);
    }

    if (action === 'delete') {
      // ── 삭제 ──────────────────────────────────────────────────────────
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'illo-Admin/1.0',
          },
          body: JSON.stringify({
            message: `[admin] delete: ${slug}`,
            sha: fileInfo.sha,
            committer: { name: 'illo Admin', email: COMMITTER_EMAIL },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return json({ error: `GitHub 삭제 실패: ${err}` }, 500);
      }
      return json({ ok: true, action: 'delete', slug });

    } else {
      // ── 수정 ──────────────────────────────────────────────────────────
      // btoa: Cloudflare Workers 내장 함수 (한국어 포함 UTF-8 안전 인코딩)
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
            'User-Agent': 'illo-Admin/1.0',
          },
          body: JSON.stringify({
            message: `[admin] update: ${slug}`,
            content: contentBase64,
            sha: fileInfo.sha,
            committer: { name: 'illo Admin', email: COMMITTER_EMAIL },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return json({ error: `GitHub 수정 실패: ${err}` }, 500);
      }
      return json({ ok: true, action: 'update', slug });
    }

  } catch (err: any) {
    console.error('[admin/article] 오류:', err);
    return json({ error: err?.message || '서버 오류' }, 500);
  }
};

// CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
