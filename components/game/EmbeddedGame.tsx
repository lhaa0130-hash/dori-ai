"use client";

// 임베드 미니게임 공용 셸 — public/games/<id> 의 자체 완결형 게임을 iframe으로 띄우고
// 게임이 보내는 postMessage(gameover, score)를 받아 "우리 스타일"로 처리:
//   · 로그인: 사이트 Firebase 로그인(useAuth) 사용
//   · 랭킹: Firestore 명예의전당(leaderboards/{id})에 개인 최고기록 등록
//   · 보상: 솜사탕(하루 1회 +50, 기존 grantPlaytimeReward 재사용)
// 게임 쪽은 점수만 쏘면 되고, 자체 로그인/랭킹 UI는 제거돼 있다.

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore, getTopScores, type ScoreEntry, type RankOrder } from "@/lib/leaderboard";
import { grantPlaytimeReward } from "@/lib/cottonCandy";

export default function EmbeddedGame({
  gameId,
  src,
  title,
  order = "desc",
}: {
  gameId: string;
  src: string;
  title: string;
  order?: RankOrder;
}) {
  const { session } = useAuth();
  const user = session?.user;
  const name = user?.name || user?.email?.split("@")[0] || "나";

  const [lbOpen, setLbOpen] = useState(false);
  const [scores, setScores] = useState<ScoreEntry[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadScores = useCallback(async () => {
    setScores(await getTopScores(gameId, 20, order));
  }, [gameId, order]);

  // 게임 → 셸: gameover 점수 수신 → 랭킹/솜사탕 처리
  useEffect(() => {
    const onMsg = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return; // 동일 출처(우리 iframe)만 신뢰
      const d = e.data as { type?: string; event?: string; score?: number } | null;
      if (!d || d.type !== "dori-game") return;
      // 게임 내부 버튼 → 우리 셸 기능으로 위임
      if (d.event === "open-leaderboard") { setLbOpen(true); void loadScores(); return; }
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
  }, [user, name, gameId, order, lbOpen, loadScores]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  const openLb = () => { setLbOpen(true); void loadScores(); };

  const BAR = 46;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FFF8EE" }}>
      {/* 상단 바 (우리 사이트 크롬) */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: BAR, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid #F0D6B0",
        }}
      >
        <Link href="/minigame" style={chip()}>← 미니게임</Link>
        <span style={{ fontWeight: 800, fontSize: 14, color: "#6B4E32" }}>{title}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={openLb} style={chip()}>🏆 명예의전당</button>
          {user ? (
            <span style={{ ...chip(), background: "#FFF1DC" }}>{name}</span>
          ) : (
            <Link href="/login" style={{ ...chip(), background: "#F9954E", color: "#fff", borderColor: "#F9954E" }}>로그인</Link>
          )}
        </div>
      </div>

      <iframe
        src={src}
        title={title}
        style={{ position: "fixed", top: BAR, left: 0, right: 0, bottom: 0, width: "100%", height: `calc(100% - ${BAR}px)`, border: "none" }}
      />

      {/* 토스트 */}
      {toast && (
        <div
          style={{
            position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 20,
            background: "#6B4E32", color: "#fff", fontWeight: 700, fontSize: 13,
            padding: "10px 18px", borderRadius: 999, boxShadow: "0 10px 30px -8px rgba(0,0,0,.4)", maxWidth: "90vw", textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}

      {/* 명예의전당 모달 */}
      {lbOpen && (
        <div
          onClick={() => setLbOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, maxHeight: "75vh", overflow: "hidden", display: "flex", flexDirection: "column", background: "#fff", borderRadius: 20, border: "1px solid #F0D6B0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #F4ECE0" }}>
              <span style={{ fontWeight: 800, color: "#6B4E32" }}>🏆 {title} 명예의전당</span>
              <button onClick={() => setLbOpen(false)} style={{ border: "none", background: "none", fontSize: 20, color: "#A8845C", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", padding: 8 }}>
              {scores === null ? (
                <p style={{ textAlign: "center", color: "#A8845C", padding: "24px 0", fontSize: 13 }}>불러오는 중…</p>
              ) : scores.length === 0 ? (
                <p style={{ textAlign: "center", color: "#A8845C", padding: "24px 0", fontSize: 13 }}>아직 기록이 없어요. 첫 주인공이 되어보세요!</p>
              ) : (
                scores.map((s, i) => (
                  <div key={s.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12, background: s.uid === (user as { id?: string } | undefined)?.id ? "#FFF1DC" : "transparent" }}>
                    <span style={{ width: 26, textAlign: "center", fontWeight: 800, color: i < 3 ? "#F9954E" : "#B0895E" }}>{i + 1}</span>
                    <span style={{ flex: 1, fontWeight: 700, color: "#5A3E2B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <span style={{ fontWeight: 800, color: "#6B4E32", fontVariantNumeric: "tabular-nums" }}>{s.score.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
            {!user && (
              <div style={{ padding: 12, borderTop: "1px solid #F4ECE0", textAlign: "center" }}>
                <Link href="/login" style={{ ...chip(), background: "#F9954E", color: "#fff", borderColor: "#F9954E", display: "inline-block" }}>로그인하고 랭킹 등록</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function chip(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.9)", color: "#6B4E32", fontWeight: 800, fontSize: 12,
    padding: "7px 12px", borderRadius: 999, textDecoration: "none", border: "1px solid #F0D6B0",
    cursor: "pointer", whiteSpace: "nowrap",
  };
}
