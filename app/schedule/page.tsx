"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import {
  DEFAULT_SETTINGS,
  EVENT_COLORS,
  ScheduleEvent,
  ScheduleSettings,
  colorChip,
  colorDot,
  ensureNotifyPermission,
  isFired,
  loadEvents,
  loadSettings,
  markFired,
  minutesToTime,
  parseDateKey,
  pad2,
  playBeep,
  saveEvents,
  saveSettings,
  showNotification,
  speak,
  timeToMinutes,
  toDateKey,
  todayKey,
  uid,
} from "@/lib/schedule";

type ViewMode = "month" | "day" | "list";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// ─────────────────────────────────────────────────────────────
// 시간 입력 필드 (30분 단위 / 1분 단위 토글 지원)
// ─────────────────────────────────────────────────────────────
function TimeField({
  value,
  onChange,
  minuteMode,
}: {
  value: string;
  onChange: (v: string) => void;
  minuteMode: boolean;
}) {
  // 30분 단위 모드: 빠른 선택용 칩 + 자유 입력
  const half = useMemo(() => {
    const arr: string[] = [];
    for (let m = 0; m < 1440; m += 30) arr.push(minutesToTime(m));
    return arr;
  }, []);

  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        step={minuteMode ? 60 : 1800}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
      />
      {!minuteMode && (
        <select
          value={half.includes(value) ? value : ""}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-2 py-2 text-sm max-w-[110px]"
        >
          <option value="">빠른선택</option>
          {half.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 일정 추가/편집 모달
// ─────────────────────────────────────────────────────────────
function EventModal({
  initial,
  dateKey,
  minuteMode,
  onSave,
  onDelete,
  onClose,
}: {
  initial: ScheduleEvent | null;
  dateKey: string;
  minuteMode: boolean;
  onSave: (e: ScheduleEvent) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [start, setStart] = useState(initial?.start ?? "09:00");
  const [end, setEnd] = useState(initial?.end ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [color, setColor] = useState(initial?.color ?? "blue");
  const [alarm, setAlarm] = useState(initial?.alarm ?? true);
  const [alarmLeadMin, setAlarmLeadMin] = useState(initial?.alarmLeadMin ?? 10);
  const [voice, setVoice] = useState(initial?.voice ?? true);

  const submit = () => {
    if (!title.trim()) {
      alert("일정 제목을 입력해주세요.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      date: initial?.date ?? dateKey,
      start,
      end: end || undefined,
      title: title.trim(),
      memo: memo.trim() || undefined,
      color,
      alarm,
      alarmLeadMin,
      voice,
      done: initial?.done ?? false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-black/10 dark:border-white/10 shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10 sticky top-0 bg-white dark:bg-neutral-900">
          <h3 className="font-semibold text-lg">{initial ? "일정 편집" : "새 일정"}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500">제목</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="예: 회의, 운동, 약 먹기"
              className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <div>
              <label className="text-xs font-medium text-neutral-500">시작</label>
              <div className="mt-1">
                <TimeField value={start} onChange={setStart} minuteMode={minuteMode} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500">종료 (선택)</label>
              <div className="mt-1">
                <TimeField value={end || start} onChange={setEnd} minuteMode={minuteMode} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">색상</label>
            <div className="mt-1 flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setColor(c.key)}
                  className={`w-7 h-7 rounded-full ${c.dot} ${color === c.key ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 ring-black/40 dark:ring-white/60" : ""}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500">메모 (선택)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* 알람 설정 */}
          <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Bell className="w-4 h-4" /> 알람
              </span>
              <input type="checkbox" checked={alarm} onChange={(e) => setAlarm(e.target.checked)} className="w-4 h-4" />
            </label>
            {alarm && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">시작</span>
                  <select
                    value={alarmLeadMin}
                    onChange={(e) => setAlarmLeadMin(Number(e.target.value))}
                    className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-2 py-1.5"
                  >
                    {[0, 1, 3, 5, 10, 15, 30, 60].map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? "정각" : `${m}분 전`}
                      </option>
                    ))}
                  </select>
                  <span className="text-neutral-500">에 알림</span>
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2 text-sm">
                    <Volume2 className="w-4 h-4" /> 음성 안내
                  </span>
                  <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} className="w-4 h-4" />
                </label>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-black/5 dark:border-white/10 sticky bottom-0 bg-white dark:bg-neutral-900">
          {initial && (
            <button
              onClick={() => onDelete(initial.id)}
              className="p-2.5 rounded-lg text-rose-600 hover:bg-rose-500/10"
              title="삭제"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2.5 rounded-lg text-sm hover:bg-black/5 dark:hover:bg-white/10">
            취소
          </button>
          <button onClick={submit} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 설정 모달
// ─────────────────────────────────────────────────────────────
function SettingsModal({
  settings,
  onChange,
  onClose,
  onTest,
}: {
  settings: ScheduleSettings;
  onChange: (s: ScheduleSettings) => void;
  onClose: () => void;
  onTest: () => void;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices().filter((v) => v.lang?.startsWith("ko") || true));
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const koVoices = voices.filter((v) => v.lang?.startsWith("ko"));
  const listed = koVoices.length ? koVoices : voices;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-black/10 dark:border-white/10 shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" /> 설정
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 시간 단위 */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">
              <span className="font-medium">1분 단위 입력</span>
              <span className="block text-xs text-neutral-500">끄면 30분 단위로 입력합니다</span>
            </span>
            <input
              type="checkbox"
              checked={settings.minuteMode}
              onChange={(e) => onChange({ ...settings, minuteMode: e.target.checked })}
              className="w-5 h-5"
            />
          </label>

          {/* 비프음 */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium">알람 비프음</span>
            <input
              type="checkbox"
              checked={settings.beep}
              onChange={(e) => onChange({ ...settings, beep: e.target.checked })}
              className="w-5 h-5"
            />
          </label>

          {/* 음성 엔진 */}
          <div className="space-y-2">
            <span className="text-sm font-medium">음성 엔진</span>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...settings, voiceEngine: "webspeech" })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  settings.voiceEngine === "webspeech"
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                    : "border-black/10 dark:border-white/15"
                }`}
              >
                브라우저 음성 (무료)
              </button>
              <button
                onClick={() => onChange({ ...settings, voiceEngine: "elevenlabs" })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  settings.voiceEngine === "elevenlabs"
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                    : "border-black/10 dark:border-white/15"
                }`}
              >
                ElevenLabs
              </button>
            </div>
          </div>

          {settings.voiceEngine === "webspeech" && (
            <div>
              <label className="text-xs font-medium text-neutral-500">브라우저 음성 선택</label>
              <select
                value={settings.webSpeechVoiceURI}
                onChange={(e) => onChange({ ...settings, webSpeechVoiceURI: e.target.value })}
                className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              >
                <option value="">자동 (한국어 우선)</option>
                {listed.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.voiceEngine === "elevenlabs" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-500">API 키</label>
                <input
                  type="password"
                  value={settings.elevenApiKey}
                  onChange={(e) => onChange({ ...settings, elevenApiKey: e.target.value })}
                  placeholder="xi-api-key"
                  className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500">Voice ID</label>
                <input
                  value={settings.elevenVoiceId}
                  onChange={(e) => onChange({ ...settings, elevenVoiceId: e.target.value })}
                  placeholder="예: 21m00Tcm4TlvDq8ikWAM"
                  className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                키는 이 브라우저에만 저장됩니다. (정적 사이트라 외부 전송 없음) <br />
                실패 시 자동으로 브라우저 음성으로 대체됩니다.
              </p>
            </div>
          )}

          <button
            onClick={onTest}
            className="w-full rounded-lg border border-black/10 dark:border-white/15 px-3 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" /> 음성 테스트
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [settings, setSettings] = useState<ScheduleSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => new Date()); // 현재 보고있는 달 기준
  const [selectedDate, setSelectedDate] = useState(() => todayKey());
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifyOk, setNotifyOk] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // 초기 로드
  useEffect(() => {
    setMounted(true);
    setEvents(loadEvents());
    setSettings(loadSettings());
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifyOk(Notification.permission === "granted");
    }
  }, []);

  // 저장
  useEffect(() => {
    if (mounted) saveEvents(events);
  }, [events, mounted]);
  useEffect(() => {
    if (mounted) saveSettings(settings);
  }, [settings, mounted]);

  // ── 알람 엔진: 15초마다 검사 ──
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const fireAlarm = useCallback((ev: ScheduleEvent) => {
    const s = settingsRef.current;
    const msg = `${ev.title}, ${ev.alarmLeadMin > 0 ? `${ev.alarmLeadMin}분 후 시작입니다.` : "지금 시작입니다."}`;
    showNotification(`⏰ ${ev.title}`, `${ev.start} 시작${ev.alarmLeadMin > 0 ? ` · ${ev.alarmLeadMin}분 전 알림` : ""}`);
    if (s.beep) playBeep();
    if (ev.voice) {
      setTimeout(() => speak(msg, s), s.beep ? 700 : 0);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      const n = new Date();
      setNow(n);
      const todayK = toDateKey(n);
      const nowMin = n.getHours() * 60 + n.getMinutes();
      for (const ev of eventsRef.current) {
        if (!ev.alarm || ev.done || ev.date !== todayK) continue;
        const alarmMin = timeToMinutes(ev.start) - ev.alarmLeadMin;
        // 알람 시각 ~ +1분 윈도우 안, 아직 안울렸으면 발동
        if (nowMin >= alarmMin && nowMin <= alarmMin + 1 && !isFired(ev.id, ev.date)) {
          markFired(ev.id, ev.date);
          fireAlarm(ev);
        }
      }
    };
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, [mounted, fireAlarm]);

  // ── 파생 데이터 ──
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    return map;
  }, [events]);

  const monthMatrix = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  // ── 액션 ──
  const upsertEvent = (ev: ScheduleEvent) => {
    setEvents((prev) => {
      const idx = prev.findIndex((x) => x.id === ev.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = ev;
        return copy;
      }
      return [...prev, ev];
    });
    setShowEventModal(false);
    setEditing(null);
  };
  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((x) => x.id !== id));
    setShowEventModal(false);
    setEditing(null);
  };
  const toggleDone = (id: string) => {
    setEvents((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  };

  const openNew = (dateKey?: string) => {
    if (dateKey) setSelectedDate(dateKey);
    setEditing(null);
    setShowEventModal(true);
  };
  const openEdit = (ev: ScheduleEvent) => {
    setEditing(ev);
    setShowEventModal(true);
  };

  const requestNotify = async () => {
    const ok = await ensureNotifyPermission();
    setNotifyOk(ok);
    if (!ok) alert("브라우저 알림 권한이 거부되어 있습니다. 사이트 설정에서 알림을 허용해주세요.");
  };

  const moveMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };
  const moveYear = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear() + delta, c.getMonth(), 1));
  };

  const goToday = () => {
    const t = new Date();
    setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDate(todayKey());
  };

  // 1년 범위 안내 (오늘부터 +1년)
  const yearRange = useMemo(() => {
    const start = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    return { start: toDateKey(start), end: toDateKey(end) };
  }, []);

  const selDate = parseDateKey(selectedDate);
  const dayEvents = eventsByDate.get(selectedDate) ?? [];

  // 다가오는 일정 (리스트 뷰)
  const upcoming = useMemo(() => {
    const nowK = todayKey();
    return [...events]
      .filter((e) => e.date >= nowK)
      .sort((a, b) =>
        a.date === b.date ? timeToMinutes(a.start) - timeToMinutes(b.start) : a.date.localeCompare(b.date)
      )
      .slice(0, 100);
  }, [events]);

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-400">불러오는 중…</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 pb-28">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-blue-600" /> 내 일정
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {yearRange.start} ~ {yearRange.end} · 1년 일정 관리
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={requestNotify}
              title={notifyOk ? "알림 허용됨" : "알림 권한 요청"}
              className={`p-2.5 rounded-xl border ${
                notifyOk
                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                  : "border-black/10 dark:border-white/15 text-neutral-500"
              }`}
            >
              {notifyOk ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl border border-black/10 dark:border-white/15"
              title="설정"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 뷰 전환 */}
        <div className="flex items-center gap-1 mb-4 bg-black/5 dark:bg-white/10 rounded-xl p-1 w-fit">
          {([
            ["month", "달력", CalendarDays],
            ["day", "하루", Clock],
            ["list", "목록", ListChecks],
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                view === k ? "bg-white dark:bg-neutral-800 shadow-sm" : "text-neutral-500"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── 달력 뷰 ── */}
        {view === "month" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-black/5 dark:border-white/10 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <button onClick={() => moveYear(-1)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xs font-medium">
                  «년
                </button>
                <button onClick={() => moveMonth(-1)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <button onClick={goToday} className="text-lg font-bold hover:text-blue-600">
                {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => moveMonth(1)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => moveYear(1)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xs font-medium">
                  년»
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((w, i) => (
                <div key={w} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-rose-500" : i === 6 ? "text-blue-500" : "text-neutral-400"}`}>
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthMatrix.map((d, i) => {
                if (!d) return <div key={i} />;
                const key = toDateKey(d);
                const dayEvs = eventsByDate.get(key) ?? [];
                const isToday = key === todayKey();
                const isSel = key === selectedDate;
                const dow = d.getDay();
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDate(key);
                      setView("day");
                    }}
                    className={`aspect-square sm:aspect-[4/5] rounded-lg p-1 flex flex-col items-center text-left transition ${
                      isSel ? "bg-blue-500/10 ring-1 ring-blue-500/40" : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? "bg-blue-600 text-white font-bold" : dow === 0 ? "text-rose-500" : dow === 6 ? "text-blue-500" : ""
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <div className="mt-0.5 flex flex-wrap gap-0.5 justify-center">
                      {dayEvs.slice(0, 4).map((e) => (
                        <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${colorDot(e.color)} ${e.done ? "opacity-30" : ""}`} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 하루 뷰 ── */}
        {view === "day" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  const d = parseDateKey(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(toDateKey(d));
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="font-bold">
                  {selDate.getFullYear()}.{pad2(selDate.getMonth() + 1)}.{pad2(selDate.getDate())} ({WEEKDAYS[selDate.getDay()]})
                </div>
                {selectedDate === todayKey() && <div className="text-xs text-blue-600">오늘</div>}
              </div>
              <button
                onClick={() => {
                  const d = parseDateKey(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(toDateKey(d));
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-black/5 dark:border-white/10 p-10 text-center text-neutral-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
                일정이 없습니다. 아래 + 버튼으로 추가하세요.
              </div>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <EventRow
                    key={e.id}
                    ev={e}
                    onToggle={() => toggleDone(e.id)}
                    onClick={() => openEdit(e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 목록 뷰 ── */}
        {view === "list" && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-500 mb-2">다가오는 일정</h2>
            {upcoming.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-black/5 dark:border-white/10 p-10 text-center text-neutral-400">
                예정된 일정이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  upcoming.reduce<Record<string, ScheduleEvent[]>>((acc, e) => {
                    (acc[e.date] = acc[e.date] || []).push(e);
                    return acc;
                  }, {})
                ).map(([date, evs]) => {
                  const d = parseDateKey(date);
                  return (
                    <div key={date}>
                      <div className="text-xs font-medium text-neutral-500 mb-1 px-1">
                        {pad2(d.getMonth() + 1)}.{pad2(d.getDate())} ({WEEKDAYS[d.getDay()]}){date === todayKey() ? " · 오늘" : ""}
                      </div>
                      <div className="space-y-2">
                        {evs.map((e) => (
                          <EventRow key={e.id} ev={e} onToggle={() => toggleDone(e.id)} onClick={() => openEdit(e)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 플로팅 추가 버튼 */}
      <button
        onClick={() => openNew(view === "month" ? todayKey() : selectedDate)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition"
        title="일정 추가"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* 모달 */}
      {showEventModal && (
        <EventModal
          initial={editing}
          dateKey={selectedDate}
          minuteMode={settings.minuteMode}
          onSave={upsertEvent}
          onDelete={deleteEvent}
          onClose={() => {
            setShowEventModal(false);
            setEditing(null);
          }}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
          onTest={() => speak("음성 안내 테스트입니다. 일정 알람이 정상 작동합니다.", settings)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 일정 행
// ─────────────────────────────────────────────────────────────
function EventRow({ ev, onToggle, onClick }: { ev: ScheduleEvent; onToggle: () => void; onClick: () => void }) {
  return (
    <div className={`flex items-center gap-3 bg-white dark:bg-neutral-900 rounded-xl border border-black/5 dark:border-white/10 p-3 ${ev.done ? "opacity-60" : ""}`}>
      <button
        onClick={onToggle}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          ev.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-neutral-300 dark:border-neutral-600"
        }`}
        title="완료 표시"
      >
        {ev.done && <Check className="w-4 h-4" />}
      </button>
      <button onClick={onClick} className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${colorDot(ev.color)}`} />
          <span className={`font-medium truncate ${ev.done ? "line-through" : ""}`}>{ev.title}</span>
        </div>
        {ev.memo && <p className="text-xs text-neutral-500 truncate mt-0.5 ml-4">{ev.memo}</p>}
      </button>
      <div className="shrink-0 text-right">
        <div className={`text-sm font-semibold border px-2 py-0.5 rounded-md ${colorChip(ev.color)}`}>
          {ev.start}
          {ev.end ? `~${ev.end}` : ""}
        </div>
        <div className="flex items-center justify-end gap-1 mt-1 text-neutral-400">
          {ev.alarm && <Bell className="w-3.5 h-3.5" />}
          {ev.alarm && ev.voice && <Volume2 className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}
