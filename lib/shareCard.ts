// 심리테스트 결과 공유 카드 — 캔버스로 브랜드 카드(1080×1350)를 그려
// Web Share(이미지 첨부) 지원 시 공유, 아니면 PNG 다운로드. 클라이언트 전용.

export type CardData = {
  kicker: string; // 상단 작은 라벨(예: "성격 5요인 검사")
  emoji: string;
  headline: string; // 결과 제목(예: "건강한 범위")
  sub?: string; // 점수/부가(예: "22 / 30점")
  lines: string[]; // 본문 줄(최대 6)
  accent?: string;
};

const ORANGE = "#F9954E";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 텍스트 줄바꿈(폭 기준) → 줄 배열
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const ch of text) {
    const t = line + ch;
    if (ctx.measureText(t).width > maxW && line) {
      out.push(line);
      line = ch;
    } else {
      line = t;
    }
  }
  if (line) out.push(line);
  return out;
}

export function drawCard(data: CardData): HTMLCanvasElement {
  const W = 1080, H = 1350;
  const accent = data.accent || ORANGE;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const SANS = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif';

  // 배경
  ctx.fillStyle = "#0c0c0e";
  ctx.fillRect(0, 0, W, H);
  // 상단 오렌지 글로우
  const g = ctx.createRadialGradient(W / 2, 120, 40, W / 2, 120, 760);
  g.addColorStop(0, accent + "33");
  g.addColorStop(1, "#0c0c0e00");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 700);

  // 카드 테두리
  ctx.strokeStyle = "#26262b";
  ctx.lineWidth = 2;
  roundRect(ctx, 56, 56, W - 112, H - 112, 48);
  ctx.stroke();

  const cx = W / 2;
  ctx.textAlign = "center";

  // 워드마크
  ctx.fillStyle = accent;
  ctx.font = `800 40px ${SANS}`;
  ctx.fillText("DORI-AI", cx, 168);
  // kicker
  ctx.fillStyle = "#8a8a93";
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText(data.kicker, cx, 222);

  // 이모지
  ctx.font = `160px ${SANS}`;
  ctx.fillText(data.emoji, cx, 470);

  // 헤드라인
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 84px ${SANS}`;
  const hl = wrap(ctx, data.headline, W - 220);
  let y = 560;
  hl.forEach((l) => { ctx.fillText(l, cx, y); y += 96; });

  // sub
  if (data.sub) {
    ctx.fillStyle = accent;
    ctx.font = `700 40px ${SANS}`;
    ctx.fillText(data.sub, cx, y + 6);
    y += 64;
  }

  // 구분선
  y += 28;
  ctx.strokeStyle = "#26262b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, y); ctx.lineTo(W - 180, y); ctx.stroke();
  y += 60;

  // 본문 줄(왼쪽 정렬)
  ctx.textAlign = "left";
  ctx.font = `500 38px ${SANS}`;
  const maxW = W - 260;
  const lines = data.lines.slice(0, 6);
  for (const raw of lines) {
    const wrapped = wrap(ctx, raw, maxW);
    for (const l of wrapped) {
      if (y > H - 180) break;
      ctx.fillStyle = "#d4d4d8";
      ctx.fillText(l, 130, y);
      y += 54;
    }
    y += 14;
  }

  // 푸터
  ctx.textAlign = "center";
  ctx.fillStyle = "#6b6b73";
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText("dori-ai.com · 심리테스트", cx, H - 110);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob fail"))), "image/png");
  });
}

/** 카드를 canvas로 그려 data URL 반환 (미리보기용) */
export async function getCardDataUrl(data: CardData): Promise<string> {
  const canvas = drawCard(data);
  return canvas.toDataURL("image/png");
}

/** 카드 PNG를 다운로드 */
export async function downloadCard(data: CardData, filename = "dori-psychtest"): Promise<void> {
  const canvas = drawCard(data);
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 결과 카드를 만들어 공유(가능 시) 또는 다운로드. 반환: "shared" | "downloaded" */
export async function shareResultCard(data: CardData, filename = "dori-psychtest"): Promise<"shared" | "downloaded"> {
  const canvas = drawCard(data);
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], `${filename}.png`, { type: "image/png" });

  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "내 심리테스트 결과", text: data.headline });
      return "shared";
    } catch {
      // 사용자가 취소했거나 실패 → 다운로드로 폴백
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
