// 일로(Illo) 결과 기록 — localStorage 기반 결과물 보관함
// page.client.tsx: listResults, saveResult, deleteResult, clearResults, downloadText, IlloResult

export type IlloResult = {
  id: string;
  toolId: string;
  toolLabel: string;
  input: string;
  output: string;
  createdAt: string; // ISO
  image?: string | null;
  video?: string | null;
  steps?: string[];
};

const KEY = "illo_results_v1";
const MAX = 50;

function read(): IlloResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as IlloResult[]) : [];
  } catch {
    return [];
  }
}

function write(items: IlloResult[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* 용량 초과 등 무시 */
  }
}

export function listResults(): IlloResult[] {
  return read();
}

type SaveInput = {
  toolId: string;
  toolLabel: string;
  input: string;
  output: string;
  image?: string | null;
  video?: string | null;
  steps?: string[];
};

export function saveResult(r: SaveInput): IlloResult {
  const item: IlloResult = {
    id: `r_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
    createdAt: new Date().toISOString(),
    ...r,
  };
  const next = [item, ...read()].slice(0, MAX);
  write(next);
  return item;
}

export function deleteResult(id: string): void {
  write(read().filter((x) => x.id !== id));
}

export function clearResults(): void {
  write([]);
}

export function downloadText(filename: string, text: string): void {
  if (typeof window === "undefined") return;
  try {
    const blob = new Blob([text ?? ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "result.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* 무시 */
  }
}
