// 서비스 계정 OAuth — WebCrypto RS256 JWT → Google access token. (04-18)
// ⚠️ private key/token 을 절대 로그·응답에 노출하지 않는다. 실패는 일반 오류 코드로만.

const OAUTH_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore"; // Firestore REST 최소 scope

/** private key 정규화 — `\n` 문자열/실제 개행 모두 처리 + PKCS#8 헤더/푸터 검증. 키 내용 로그 금지. */
export function normalizePrivateKey(raw: string): { ok: true; pem: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.length === 0) return { ok: false, error: "missing_private_key" };
  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  if (!pem.includes("-----BEGIN PRIVATE KEY-----")) return { ok: false, error: "invalid_private_key_header" };
  if (!pem.includes("-----END PRIVATE KEY-----")) return { ok: false, error: "invalid_private_key_footer" };
  return { ok: true, pem: pem.trim() };
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlJson(obj: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)));
}

async function importPkcs8(pem: string): Promise<CryptoKey> {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

/** RS256 JWT assertion 생성(순수 입력 → 문자열). now(ms) 주입으로 테스트 가능. */
export async function createJwtAssertion(clientEmail: string, pem: string, nowMs: number): Promise<string> {
  const now = Math.floor(nowMs / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = { iss: clientEmail, scope: SCOPE, aud: OAUTH_ENDPOINT, iat: now, exp: now + 3600 };
  const unsigned = `${b64urlJson(header)}.${b64urlJson(claim)}`;
  const key = await importPkcs8(pem);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${b64url(new Uint8Array(sig))}`;
}

// isolate 로컬 캐시(공유 가정 안 함). 만료 60s 전 갱신.
let cached: { token: string; expMs: number } | null = null;

/**
 * SA access token 발급. 성공: {ok, token}. 실패: {ok:false, error}(전문 미노출).
 *  nowMs·fetchImpl 주입으로 테스트 가능. 재시도는 1회만.
 */
export async function getAccessToken(
  clientEmail: string, privateKeyPem: string, nowMs: number,
  fetchImpl: typeof fetch = fetch
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (cached && cached.expMs - 60_000 > nowMs) return { ok: true, token: cached.token };
  const norm = normalizePrivateKey(privateKeyPem);
  if (!norm.ok) return { ok: false, error: norm.error };
  if (!clientEmail) return { ok: false, error: "missing_client_email" };

  let assertion: string;
  try { assertion = await createJwtAssertion(clientEmail, norm.pem, nowMs); }
  catch { return { ok: false, error: "jwt_sign_failed" }; }

  const body = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(assertion)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetchImpl(OAUTH_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      if (r.ok) {
        const j = (await r.json()) as { access_token?: string; expires_in?: number };
        if (!j.access_token) return { ok: false, error: "oauth_no_token" };
        cached = { token: j.access_token, expMs: nowMs + (j.expires_in || 3600) * 1000 };
        return { ok: true, token: j.access_token };
      }
      if (r.status >= 400 && r.status < 500) return { ok: false, error: "oauth_rejected" }; // 재시도 무의미
    } catch { /* 네트워크 → 1회 재시도 */ }
  }
  return { ok: false, error: "oauth_unavailable" };
}

/** 테스트/디버그용: 캐시 초기화. */
export function _resetTokenCache() { cached = null; }
