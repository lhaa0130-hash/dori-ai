"use client";

// 범위(그룹) 벤다이어그램 — 각 범위를 원으로, 친구는 소속 범위들의 중심에 모이게 배치.
// 여러 범위에 속한 친구일수록 가운데(교집합)로, 한 범위면 그 원 안에 표시 → 교집합/합집합이 직관적으로 보인다.

export type VennGroup = { id: string; name: string; memberUids: string[]; color: string };
export type VennFriend = { uid: string; name: string };

type Circle = { x: number; y: number; r: number };

// 0~100 좌표계, 중심(50,50). 범위 개수별 배치(최대 5).
function circlesFor(n: number): Circle[] {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 50, y: 50, r: 34 }];
  if (n === 2) return [{ x: 35, y: 50, r: 30 }, { x: 65, y: 50, r: 30 }];
  if (n === 3) return [{ x: 50, y: 35, r: 27 }, { x: 34, y: 64, r: 27 }, { x: 66, y: 64, r: 27 }];
  const RR = n === 4 ? 24 : 26;
  const r = n === 4 ? 25 : 22;
  return Array.from({ length: n }, (_, i) => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    return { x: 50 + RR * Math.cos(a), y: 50 + RR * Math.sin(a), r };
  });
}

// uid 기반 결정적 지터(친구들이 같은 지점에 겹치지 않도록)
function jitter(uid: string): { dx: number; dy: number } {
  let h = 0;
  for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = ((h % 360) * Math.PI) / 180;
  const d = 3 + ((h >> 3) % 6);
  return { dx: Math.cos(a) * d, dy: Math.sin(a) * d };
}

const clamp = (v: number) => Math.max(7, Math.min(93, v));

export default function RangeVenn({ groups, friends }: { groups: VennGroup[]; friends: VennFriend[] }) {
  const gs = groups.slice(0, 5);
  const circles = circlesFor(gs.length);

  // 각 친구의 소속 범위 인덱스
  const memberOf = (uid: string) => gs.map((g, i) => (g.memberUids.includes(uid) ? i : -1)).filter((i) => i >= 0);

  const placed = friends
    .map((f) => ({ f, idx: memberOf(f.uid) }))
    .filter((x) => x.idx.length > 0)
    .map(({ f, idx }) => {
      const cx = idx.reduce((s, i) => s + circles[i].x, 0) / idx.length;
      const cy = idx.reduce((s, i) => s + circles[i].y, 0) / idx.length;
      const j = jitter(f.uid);
      return { f, idx, x: clamp(cx + j.dx), y: clamp(cy + j.dy) };
    });

  const unassigned = friends.filter((f) => memberOf(f.uid).length === 0);

  if (gs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 px-4 py-10 text-center">
        <div className="text-3xl mb-2 opacity-30">⭕</div>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400">범위를 만들면 여기에 다이어그램이 나타나요.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 다이어그램 */}
      <div className="relative w-full max-w-[360px] mx-auto aspect-square select-none">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden>
          {circles.map((c, i) => (
            <circle
              key={gs[i].id}
              cx={c.x}
              cy={c.y}
              r={c.r}
              fill={gs[i].color}
              fillOpacity={0.28}
              stroke={gs[i].color}
              strokeOpacity={0.55}
              strokeWidth={0.6}
            />
          ))}
        </svg>

        {/* 범위 이름 라벨(원 바깥쪽으로) */}
        {circles.map((c, i) => {
          const ux = gs.length === 1 ? 0 : (c.x - 50);
          const uy = gs.length === 1 ? -1 : (c.y - 50);
          const len = Math.hypot(ux, uy) || 1;
          const lx = clamp(c.x + (ux / len) * (c.r * 0.62));
          const ly = clamp(c.y + (uy / len) * (c.r * 0.62));
          return (
            <span
              key={gs[i].id}
              className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-sm whitespace-nowrap pointer-events-none"
              style={{ left: `${lx}%`, top: `${ly}%`, backgroundColor: gs[i].color }}
            >
              {gs[i].name}
            </span>
          );
        })}

        {/* 친구 칩 */}
        {placed.map(({ f, x, y }) => (
          <span
            key={f.uid}
            title={f.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white dark:bg-zinc-800 ring-2 ring-white dark:ring-zinc-900 shadow flex items-center justify-center text-[11px] font-extrabold text-neutral-700 dark:text-neutral-100"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {(f.name || "?").trim().charAt(0) || "?"}
          </span>
        ))}
      </div>

      {/* 범례(색·이름·인원) */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {gs.map((g) => (
          <span key={g.id} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-neutral-600 dark:text-neutral-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
            {g.name} <span className="text-neutral-400 font-semibold">{g.memberUids.length}</span>
          </span>
        ))}
      </div>

      {/* 범위 미지정 */}
      {unassigned.length > 0 && (
        <p className="mt-2 text-center text-[11px] text-neutral-400">
          범위 미지정 친구 {unassigned.length}명 — 아래에서 범위에 넣어보세요
        </p>
      )}
    </div>
  );
}
