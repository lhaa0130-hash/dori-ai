"use client";

// 임베드 미니게임 공용 셸 — public/games/<id> 의 자체 완결형 게임을 iframe으로 띄우고
// 게임이 보내는 postMessage(gameover, score)를 받아 "우리 스타일"로 처리:
//   · 로그인: 사이트 Firebase 로그인(useAuth) 사용
//   · 랭킹: Firestore 명예의전당(leaderboards/{id})에 개인 최고기록 등록
//   · 보상: 솜사탕(하루 1회 +50, 기존 grantPlaytimeReward 재사용)
// 게임 쪽은 점수만 쏘면 되고, 자체 로그인/랭킹 UI는 제거돼 있다.
// theme="neon": The Tower 풍 다크 네온 크롬(동물 합치기 등 재구축 게임용). 기본 light.

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore, getTopScores, type ScoreEntry, type RankOrder } from "@/lib/leaderboard";
import { grantPlaytimeReward } from "@/lib/cottonCandy";

type Theme = "light" | "neon";

const PALETTE = {
  light: {
    page: "#FFF8EE", barBg: "rgba(255,255,255,0.92)", barBorder: "1px solid #F0D6B0",
    title: "#6B4E32", chipBg: "rgba(255,255,255,0.9)", chipColor: "#6B4E32", chipBorder: "1px solid #F0D6B0",
    userChip: "#FFF1DC", accent: "#F9954E", accentText: "#fff",
    toastBg: "#6B4E32", toastColor: "#fff", toastShadow: "0 10px 30px -8px rgba(0,0,0,.4)",
    modalBg: "#fff", modalBorder: "1px solid #F0D6B0", headBorder: "1px solid #F4ECE0",
    subtle: "#A8845C", rowHi: "#FFF1DC", rankTop: "#F9954E", rankRest: "#B0895E", name: "#5A3E2B", score: "#6B4E32",
  },
  neon: {
    page: "#06060d", barBg: "rgba(9,11,20,0.85)", barBorder: "1px solid rgba(0,229,255,.25)",
    title: "#bdefff", chipBg: "rgba(0,229,255,0.07)", chipColor: "#bdefff", chipBorder: "1px solid rgba(0,229,255,.30)",
    userChip: "rgba(0,229,255,0.14)", accent: "#00e5ff", accentText: "#06060d",
    toastBg: "rgba(11,14,26,0.96)", toastColor: "#eaf6ff", toastShadow: "0 0 28px rgba(0,229,255,.35)",
    modalBg: "#0b0e1a", modalBorder: "1px solid rgba(0,229,255,.3)", headBorder: "1px solid rgba(255,255,255,.08)",
    subtle: "#7fa9c0", rowHi: "rgba(0,229,255,.12)", rankTop: "#00e5ff", rankRest: "#6f93a8", name: "#dcefff", score: "#bdefff",
  },
} as const;

export default function EmbeddedGame({
  gameId,
  src,
  title,
  order = "desc",
  theme = "light",
}: {
  gameId: string;
  src: string;
  title: string;
  order?: RankOrder;
  theme?: Theme;
}) {
  const { session } = useAuth();
  const user = session?.user;
  const name = user?.name || user?.email?.split("@")[0] || "나";
  const T = PALETTE[theme];

  const [lbOpen, setLbOpen] = useState(false);
  const [scores, setScores] = useState<ScoreEntry[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [adBusy, setAdBusy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const adInProgress = useRef(false);

  const loadScores = useCallback(async () => {
    setScores(await getTopScores(gameId, 20, order));
  }, [gameId, order]);

  // 게임 요청 → H5 리워드 광고(adBreak). 광고 미적용/미필이면 16초 후 보상(폴백) → 기능은 항상 동작.
  const playRewardedAd = useCallback((reason: string) => {
    if (adInProgress.current) return;
    adInProgress.current = true;
    setAdBusy(true);
    let viewed = false, done = false, adShowing = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (granted: boolean) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      adInProgress.current = false;
      setAdBusy(false);
      iframeRef.current?.contentWindow?.postMessage({ type: "dori-host", event: "ad-result", reason, granted }, "*");
    };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({
        type: "reward",
        name: reason,
        beforeReward: (showAdFn: () => void) => { adShowing = true; if (timer) clearTimeout(timer); showAdFn(); },
        adViewed: () => { viewed = true; },
        adDismissed: () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        adBreakDone: (info: any) => { finish(viewed || (info?.breakStatus !== "dismissed")); },
      });
    } catch { finish(true); return; }
    // 광고가 안 채워지면(H5 미신청/미필) beforeReward가 안 와서 3초 후 바로 보상(무의미한 대기 제거)
    timer = setTimeout(() => { if (!adShowing) finish(true); }, 3000);
  }, []);

  // 게임 → 셸: gameover 점수 수신 → 랭킹/솜사탕 처리
  useEffect(() => {
    const onMsg = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return; // 동일 출처(우리 iframe)만 신뢰
      const d = e.data as { type?: string; event?: string; score?: number } | null;
      if (!d || d.type !== "dori-game") return;
      if (d.event === "open-leaderboard") { setLbOpen(true); void loadScores(); return; }
      if (d.event === "request-ad") { playRewardedAd((d as { reason?: string }).reason || "shuffle"); return; }
      if (d.event === "request-login") { window.location.href = "/login"; return; }
      if (d.event !== "gameover") return;
      const score = Math.max(0, Math.floor(Number(d.score) || 0));
      if (score <= 0) return;
      if (!user) {
        setToast("로그인하면 점수가 명예의전당에 등록되고 솜사탕도 받아요 🍬");
        return;
      }
      const res = await submitScore(gameId, name, score, order);
      let msg = res.isNewBest
        ? `🏆 신기록 ${score.toLocaleString()}점${res.rank ? ` · ${res.rank}위` : ""} 등록!`
        : `점수 ${score.toLocaleString()} 기록 완료`;
      try {
        if (user.email) {
          const r = grantPlaytimeReward(user.email, 50);
          if (r.granted) msg += ` · +${r.amount}🍬`;
        }
      } catch { /* noop */ }
      setToast(msg);
      if (lbOpen) void loadScores();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [user, name, gameId, order, lbOpen, loadScores, playRewardedAd]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  const openLb = () => { setLbOpen(true); void loadScores(); };
  const chip = (override?: React.CSSProperties): React.CSSProperties => ({
    background: T.chipBg, color: T.chipColor, fontWeight: 800, fontSize: 12,
    padding: "7px 12px", borderRadius: 999, textDecoration: "none", border: T.chipBorder,
    cursor: "pointer", whiteSpace: "nowrap", ...override,
  });

  const BAR = 46;

  return (
    <div style={{ position: "fixed", inset: 0, background: T.page }}>
      {/* 상단 바 (우리 사이트 크롬) */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: BAR, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px", background: T.barBg, backdropFilter: "blur(8px)",
          borderBottom: T.barBorder,
        }}
      >
        <Link href="/minigame" style={chip()}>← 미니게임</Link>
        <span style={{ fontWeight: 800, fontSize: 14, color: T.title }}>{title}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={openLb} style={chip()}>🏆 명예의전당</button>
          {user ? (
            <span style={chip({ background: T.userChip })}>{name}</span>
          ) : (
            <Link href="/login" style={chip({ background: T.accent, color: T.accentText, borderColor: T.accent })}>로그인</Link>
          )}
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        style={{ position: "fixed", top: BAR, left: 0, right: 0, bottom: 0, width: "100%", height: `calc(100% - ${BAR}px)`, border: "none" }}
      />

      {/* 토스트 */}
      {toast && (
        <div
          style={{
            position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 20,
            background: T.toastBg, color: T.toastColor, fontWeight: 700, fontSize: 13,
            padding: "10px 18px", borderRadius: 999, boxShadow: T.toastShadow, maxWidth: "90vw", textAlign: "center",
            border: theme === "neon" ? "1px solid rgba(0,229,255,.4)" : undefined,
          }}
        >
          {toast}
        </div>
      )}

      {/* 광고 대기 오버레이 (실제 광고가 뜨면 그 위에 표시됨 / 미필 시 폴백 대기) */}
      {adBusy && (
        <div style={{ position: "fixed", inset: 0, zIndex: 25, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(2,2,8,0.9)", color: "#eaf6ff" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(157,109,255,.3)", borderTopColor: "#9D6DFF", animation: "doriSpin .9s linear infinite" }} />
          <span style={{ fontWeight: 800, fontSize: 14 }}>광고 시청 중…</span>
          <style>{`@keyframes doriSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* 명예의전당 모달 */}
      {lbOpen && (
        <div
          onClick={() => setLbOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, maxHeight: "75vh", overflow: "hidden", display: "flex", flexDirection: "column", background: T.modalBg, borderRadius: 20, border: T.modalBorder }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: T.headBorder }}>
              <span style={{ fontWeight: 800, color: T.title }}>🏆 {title} 명예의전당</span>
              <button onClick={() => setLbOpen(false)} style={{ border: "none", background: "none", fontSize: 20, color: T.subtle, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 8 }}>
              {scores === null ? (
                <p style={{ textAlign: "center", color: T.subtle, padding: "24px 0", fontSize: 13 }}>불러오는 중…</p>
              ) : scores.length === 0 ? (
                <p style={{ textAlign: "center", color: T.subtle, padding: "24px 0", fontSize: 13 }}>아직 기록이 없어요. 첫 주인공이 되어보세요!</p>
              ) : (
                scores.map((s, i) => (
                  <div key={s.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, background: s.uid === (user as { id?: string } | undefined)?.id ? T.rowHi : "transparent" }}>
                    <span style={{ width: 26, textAlign: "center", fontWeight: 800, color: i < 3 ? T.rankTop : T.rankRest }}>{i + 1}</span>
                    <span style={{ flex: 1, fontWeight: 700, color: T.name, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <span style={{ fontWeight: 800, color: T.score, fontVariantNumeric: "tabular-nums" }}>{s.score.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
            {!user && (
              <div style={{ padding: 12, borderTop: T.headBorder, textAlign: "center" }}>
                <Link href="/login" style={chip({ background: T.accent, color: T.accentText, borderColor: T.accent, display: "inline-block" })}>로그인하고 랭킹 등록</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
