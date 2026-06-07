// 개인용 일정관리 앱 - 데이터 모델 / 저장소 / 음성·알람 유틸
// 서버 없이 브라우저(localStorage)에서만 동작합니다.

export type ScheduleEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM (분 단위 가능)
  end?: string; // HH:MM
  title: string;
  memo?: string;
  color: string; // tailwind 색상 키
  alarm: boolean; // 알람 사용 여부
  alarmLeadMin: number; // 시작 몇 분 전 알람
  voice: boolean; // 음성 안내 사용 여부
  done: boolean;
};

export type VoiceEngine = "webspeech" | "elevenlabs";

export type ScheduleSettings = {
  minuteMode: boolean; // true면 1분 단위 입력, false면 30분 단위
  voiceEngine: VoiceEngine;
  webSpeechVoiceURI: string; // 선택된 브라우저 음성
  elevenApiKey: string;
  elevenVoiceId: string;
  beep: boolean; // 알람 비프음
};

export const EVENT_COLORS: { key: string; label: string; dot: string; chip: string }[] = [
  { key: "blue", label: "파랑", dot: "bg-blue-500", chip: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30" },
  { key: "emerald", label: "초록", dot: "bg-emerald-500", chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" },
  { key: "amber", label: "노랑", dot: "bg-amber-500", chip: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30" },
  { key: "rose", label: "빨강", dot: "bg-rose-500", chip: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30" },
  { key: "violet", label: "보라", dot: "bg-violet-500", chip: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30" },
  { key: "slate", label: "회색", dot: "bg-slate-500", chip: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
];

export function colorChip(key: string) {
  return (EVENT_COLORS.find((c) => c.key === key) ?? EVENT_COLORS[0]).chip;
}
export function colorDot(key: string) {
  return (EVENT_COLORS.find((c) => c.key === key) ?? EVENT_COLORS[0]).dot;
}

const EVENTS_KEY = "dori-schedule-events-v1";
const SETTINGS_KEY = "dori-schedule-settings-v1";
const FIRED_KEY = "dori-schedule-fired-v1"; // 중복 알람 방지

export const DEFAULT_SETTINGS: ScheduleSettings = {
  minuteMode: false,
  voiceEngine: "webspeech",
  webSpeechVoiceURI: "",
  elevenApiKey: "",
  elevenVoiceId: "",
  beep: true,
};

// ---------- 날짜 유틸 ----------
export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function todayKey() {
  return toDateKey(new Date());
}
export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
export function minutesToTime(min: number) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

// ---------- 저장소 ----------
export function loadEvents(): ScheduleEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScheduleEvent[];
  } catch {
    return [];
  }
}
export function saveEvents(events: ScheduleEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}
export function loadSettings(): ScheduleSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ScheduleSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
export function saveSettings(s: ScheduleSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function loadFired(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveFired(map: Record<string, number>) {
  localStorage.setItem(FIRED_KEY, JSON.stringify(map));
}
export function markFired(eventId: string, dateKey: string) {
  const map = loadFired();
  // 7일 지난 기록 정리
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const k of Object.keys(map)) if (map[k] < weekAgo) delete map[k];
  map[`${eventId}@${dateKey}`] = Date.now();
  saveFired(map);
}
export function isFired(eventId: string, dateKey: string) {
  return Boolean(loadFired()[`${eventId}@${dateKey}`]);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---------- 음성 (TTS) ----------
export function speakWebSpeech(text: string, voiceURI: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find((x) => x.voiceURI === voiceURI) || voices.find((x) => x.lang?.startsWith("ko"));
  if (v) u.voice = v;
  u.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

let elevenAudio: HTMLAudioElement | null = null;
export async function speakElevenLabs(text: string, apiKey: string, voiceId: string) {
  if (!apiKey || !voiceId) throw new Error("ElevenLabs API 키 또는 Voice ID가 없습니다.");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs 오류 (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  elevenAudio?.pause();
  elevenAudio = new Audio(url);
  elevenAudio.onended = () => URL.revokeObjectURL(url);
  await elevenAudio.play();
}

export async function speak(text: string, settings: ScheduleSettings) {
  if (settings.voiceEngine === "elevenlabs" && settings.elevenApiKey && settings.elevenVoiceId) {
    try {
      await speakElevenLabs(text, settings.elevenApiKey, settings.elevenVoiceId);
      return;
    } catch (e) {
      // 실패 시 브라우저 음성으로 폴백
      console.warn("ElevenLabs 실패, 브라우저 음성으로 대체:", e);
    }
  }
  speakWebSpeech(text, settings.webSpeechVoiceURI);
}

// ---------- 비프음 (Web Audio) ----------
let audioCtx: AudioContext | null = null;
export function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    [0, 0.18, 0.36].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  } catch {
    /* ignore */
  }
}

// ---------- 알림 권한 ----------
export async function ensureNotifyPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}

export function showNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/icon.svg" });
    } catch {
      /* ignore */
    }
  }
}
