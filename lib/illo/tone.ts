// 일로(Illo) 도구별 말투/톤 메모 — localStorage 기반
// page.client.tsx: getTone(toolId), saveTone(toolId, text)

const KEY = "illo_tone_v1";

function read(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? (obj as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function write(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* 무시 */
  }
}

export function getTone(toolId: string): string {
  return read()[toolId] || "";
}

export function saveTone(toolId: string, text: string): void {
  const map = read();
  if (text && text.trim()) {
    map[toolId] = text;
  } else {
    delete map[toolId];
  }
  write(map);
}
