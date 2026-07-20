// AI 일기 자동 생성 — illo My World 기획서 8번 "AI가 하루를 기억해준다".
// ──────────────────────────────────────────────────────────────────
// ⚠️ 비용 0 원칙: LLM을 호출하지 않는다. 이미 쌓이는 솜사탕 활동 내역
//    (getCottonCandyHistory: {date, amount, reason})에는 오늘 한 일이
//    타임스탬프와 함께 전부 기록돼 있다 — 출석·미션·게임·업적·레벨업·구매.
//    그 reason 문자열을 규칙으로 집계해 자연스러운 '오늘의 하루'로 엮는다.
//    (사용자가 확인 후 저장하면 기존 addDiaryEntry 로 diary 배열에 들어간다)
import { getCottonCandyHistory } from "@/lib/cottonCandy";

export interface DaySummary {
  text: string;    // 다이어리에 넣을 완성 문장(여러 줄)
  mood: string;    // 대표 무드 이모지
  isEmpty: boolean; // 오늘 활동이 없으면 true
  totalCandy: number;
}

// reason 접두어 → 활동 분류. 저장값은 한글 고정이라 한글 기준으로 매칭한다.
type Bucket = {
  attendance: number; streakBonus: number;
  missions: string[]; achievements: string[];
  levelUps: number[]; games: number; purchases: number; other: number;
};

function classify(email: string): { bucket: Bucket; totalCandy: number; count: number } {
  const hist = getCottonCandyHistory(email);
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
  const isToday = (iso: string) => {
    const dt = new Date(iso);
    return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
  };

  const b: Bucket = { attendance: 0, streakBonus: 0, missions: [], achievements: [], levelUps: [], games: 0, purchases: 0, other: 0 };
  let totalCandy = 0, count = 0;

  for (const e of hist) {
    if (!e?.date || !isToday(e.date)) continue;
    count++;
    if (typeof e.amount === "number" && e.amount > 0) totalCandy += e.amount;
    const r = String(e.reason || "");
    let mm: RegExpMatchArray | null;
    if (/^출석 체크/.test(r)) { b.attendance++; if (/연속 보너스/.test(r)) b.streakBonus++; }
    else if ((mm = r.match(/^미션 완료: (.+)$/))) b.missions.push(mm[1]);
    else if ((mm = r.match(/^업적 달성: (.+)$/))) b.achievements.push(mm[1]);
    else if ((mm = r.match(/^레벨 (\d+) 달성 보상$/))) b.levelUps.push(Number(mm[1]));
    else if (/플레이 보상|미니게임/.test(r)) b.games++;
    else if (/^상점 구매:/.test(r)) b.purchases++;
    else b.other++;
  }
  return { bucket: b, totalCandy, count };
}

// 미션·업적 이름의 영어 표기(표시 전용 — 저장값은 한글 그대로).
const MISSION_EN: Record<string, string> = {
  "출석 체크": "checked in", "트렌드 기사 읽기": "read a trend article",
  "커뮤니티 글쓰기": "wrote a community post", "댓글 달기": "left a comment",
  "미니게임 1판": "played a mini-game", "AI 퀴즈 풀기": "solved an AI quiz",
};
const ACHIEVEMENT_EN: Record<string, string> = {
  "첫 방문": "First visit", "첫 글쓰기": "First post", "댓글왕": "Comment king",
  "3일 연속 출석": "3-day streak", "7일 연속 출석": "7-day streak", "한 달 개근": "Perfect month",
  "인기쟁이": "Crowd pleaser", "게임왕": "Game king", "퀴즈마스터": "Quiz master", "레벨 10 달성": "Level 10",
};

// 오늘의 무드 이모지 — 활동 성격에 맞게 하나 고른다.
function pickMood(b: Bucket, extra: Extra): string {
  if (b.achievements.length || b.levelUps.length) return "🎉";
  if ((extra.creations || 0) > 0) return "🎨";
  if ((extra.posts || 0) > 0) return "✍️";
  if (b.games >= 1) return "🎮";
  if (b.attendance) return "☀️";
  return "🌱";
}

export interface Extra { posts?: number; creations?: number }

export function summarizeToday(email: string, locale: "ko" | "en" = "ko", extra: Extra = {}): DaySummary {
  const { bucket: b, totalCandy, count } = classify(email);
  const posts = extra.posts || 0, creations = extra.creations || 0;
  const hasAny = count > 0 || posts > 0 || creations > 0;
  const mood = pickMood(b, extra);

  if (!hasAny) {
    return {
      isEmpty: true, mood, totalCandy: 0,
      text: locale === "en"
        ? "Nothing logged yet today. Use some AI or play a game, and your day will start filling in here."
        : "아직 오늘 기록이 없어요. AI를 써보거나 게임을 한 판 하면, 여기에 하루가 채워져요.",
    };
  }

  const ymd = `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
  const lines: string[] = [];

  if (locale === "en") {
    lines.push(`${ymd} — today's log`);
    if (b.attendance) lines.push(`• Checked in${b.streakBonus ? " (streak bonus!)" : ""}.`);
    if (creations) lines.push(`• Created ${creations} new animal${creations > 1 ? "s" : ""} in the dex.`);
    if (posts) lines.push(`• Shared ${posts} post${posts > 1 ? "s" : ""} to the feed.`);
    if (b.games) lines.push(`• Played ${b.games} mini-game session${b.games > 1 ? "s" : ""}.`);
    const missions = b.missions.map((mm) => MISSION_EN[mm] || mm);
    if (missions.length) lines.push(`• Missions: ${missions.join(", ")}.`);
    if (b.purchases) lines.push(`• Picked up ${b.purchases} item${b.purchases > 1 ? "s" : ""} from the shop.`);
    if (b.levelUps.length) lines.push(`• Leveled up to ${b.levelUps.map((l) => `Lv.${l}`).join(", ")}! 🎉`);
    if (b.achievements.length) lines.push(`• Unlocked: ${b.achievements.map((a) => ACHIEVEMENT_EN[a] || a).join(", ")}.`);
    if (totalCandy > 0) lines.push(`Earned ${totalCandy} cotton candy today.`);
  } else {
    lines.push(`${ymd} — 오늘의 기록`);
    if (b.attendance) lines.push(`• 오늘도 출석했어요${b.streakBonus ? " (연속 출석 보너스!)" : ""}.`);
    if (creations) lines.push(`• 동물도감에 새 동물을 ${creations}마리 만들었어요.`);
    if (posts) lines.push(`• 피드에 글을 ${posts}개 남겼어요.`);
    if (b.games) lines.push(`• 미니게임을 ${b.games}번 즐겼어요.`);
    if (b.missions.length) lines.push(`• 미션: ${b.missions.join(", ")}.`);
    if (b.purchases) lines.push(`• 상점에서 아이템을 ${b.purchases}개 챙겼어요.`);
    if (b.levelUps.length) lines.push(`• 레벨업! ${b.levelUps.map((l) => `Lv.${l}`).join(", ")} 달성 🎉`);
    if (b.achievements.length) lines.push(`• 업적 달성: ${b.achievements.join(", ")}.`);
    if (totalCandy > 0) lines.push(`오늘 솜사탕 ${totalCandy}개를 모았어요.`);
  }

  // 다이어리 1칸 한도 500자에 맞춘다.
  return { isEmpty: false, mood, totalCandy, text: lines.join("\n").slice(0, 500) };
}
