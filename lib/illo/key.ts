// 일로 웹 — Claude API 키 관리.
// 우선순위: 브라우저 로컬 저장 → (없으면) 데스크톱 일로가 클라우드(RTDB)에 동기화해 둔 키.
// 키는 회원 본인 브라우저/계정에만 존재. (RTDB 규칙: 본인 uid만 읽기)
import { getFirebaseAuth } from '@/lib/firebase';

const LS_KEY = 'illo.web.claudeKey';
const LS_MODEL = 'illo.web.model';
const RTDB_URL = 'https://dori-ai-0130-default-rtdb.firebaseio.com';

export function getLocalKey(): string {
  try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; }
}
export function setLocalKey(k: string): void {
  try {
    if (k) localStorage.setItem(LS_KEY, k.trim());
    else localStorage.removeItem(LS_KEY);
  } catch { /* */ }
}
export function getModel(): string {
  try { return localStorage.getItem(LS_MODEL) || ''; } catch { return ''; }
}
export function setModel(m: string): void {
  try { localStorage.setItem(LS_MODEL, m); } catch { /* */ }
}

/** 데스크톱 일로가 클라우드에 동기화해 둔 Claude 키를 불러온다(있으면). 로그인 상태 필요. */
export async function pullCloudKey(): Promise<string> {
  const u = getFirebaseAuth().currentUser;
  if (!u) return '';
  try {
    const idToken = await u.getIdToken();
    const res = await fetch(`${RTDB_URL}/secrets/${u.uid}.json?auth=${encodeURIComponent(idToken)}`);
    if (!res.ok) return '';
    const data = (await res.json()) as { v?: number; anthropic?: { apiKey?: string } } | null;
    if (!data || data.v !== 1) return '';
    return data.anthropic?.apiKey || '';
  } catch {
    return '';
  }
}
