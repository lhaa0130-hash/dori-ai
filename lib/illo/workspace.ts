// 회원별 자료함 — HTML 문서 저장/보기 + 커스텀 부서(폴더).
// localStorage에 "사용자별 키"로 저장 → 계정마다 분리(같은 브라우저에서도 회원별로 다름).
// ⚠️ 현재는 브라우저 저장. 기기 간 동기화가 필요하면 이후 클라우드(Firestore)로 확장.

export type SavedDoc = {
  id: string;
  name: string;
  dept: string;       // 부서 id ("" = 미분류)
  html: string;
  updatedAt: string;
};
export type Dept = { id: string; emoji: string; name: string };

function gid(p: string): string {
  return `${p}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}
function docKey(userKey: string): string { return `illo_docs_v1__${userKey || "local"}`; }
function deptKey(userKey: string): string { return `illo_depts_v1__${userKey || "local"}`; }

function readArr<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as T[]) : [];
  } catch { return []; }
}
function writeArr<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* 용량 초과 등 무시 */ }
}

// ── HTML 문서 ──
export function listDocs(userKey: string): SavedDoc[] {
  return readArr<SavedDoc>(docKey(userKey)).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}
export function saveDoc(userKey: string, doc: Omit<SavedDoc, "updatedAt"> & { updatedAt?: string }): SavedDoc {
  const stamped: SavedDoc = { ...doc, id: doc.id || gid("doc"), updatedAt: new Date().toISOString() };
  const list = readArr<SavedDoc>(docKey(userKey));
  const i = list.findIndex((d) => d.id === stamped.id);
  if (i >= 0) list[i] = stamped; else list.unshift(stamped);
  writeArr(docKey(userKey), list);
  return stamped;
}
export function deleteDoc(userKey: string, id: string): void {
  writeArr(docKey(userKey), readArr<SavedDoc>(docKey(userKey)).filter((d) => d.id !== id));
}

// ── 부서(폴더) ──
export function listDepts(userKey: string): Dept[] {
  return readArr<Dept>(deptKey(userKey));
}
export function saveDept(userKey: string, dept: { id?: string; emoji: string; name: string }): Dept {
  const d: Dept = { id: dept.id || gid("dept"), emoji: dept.emoji || "🏢", name: dept.name.trim() || "새 부서" };
  const list = readArr<Dept>(deptKey(userKey));
  const i = list.findIndex((x) => x.id === d.id);
  if (i >= 0) list[i] = d; else list.push(d);
  writeArr(deptKey(userKey), list);
  return d;
}
export function deleteDept(userKey: string, id: string): void {
  writeArr(deptKey(userKey), readArr<Dept>(deptKey(userKey)).filter((d) => d.id !== id));
  // 이 부서에 속한 문서는 '미분류'로 이동
  const docs = readArr<SavedDoc>(docKey(userKey)).map((d) => (d.dept === id ? { ...d, dept: "" } : d));
  writeArr(docKey(userKey), docs);
}

// 부서 만들 때 고를 수 있는 이모지 후보.
export const DEPT_EMOJIS = ["🏢", "📈", "✍️", "🎨", "🛍️", "🤝", "💰", "📣", "🧪", "📦", "🗂️", "⭐"];
