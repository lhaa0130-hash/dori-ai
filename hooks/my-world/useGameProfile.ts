"use client";

// My World — 게임 프로필(레벨·티어·EXP·솜사탕) 조회.
//  page.tsx 안에 있던 상태·effect 를 그대로 옮긴 것이다. 표시용 계산(진행률·다음 레벨 누적)까지
//  여기서 끝내 화면 컴포넌트가 계산 로직을 갖지 않게 한다.
//
//  ⚠️ 보상을 지급하지 않는다 — 읽기 전용이다. 값의 권위는 서버(claim-reward)이며
//     이 훅은 `lib/cottonCandy` 의 캐시를 읽고 동기화 이벤트에 반응할 뿐이다.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedGameProfile, getCottonCandyBalance, hydrateGameData } from "@/lib/cottonCandy";
import {
  TIER_INFO,
  calculateLevelProgress,
  getCurrentLevelStartExp,
  getNextLevelExp,
  type UserTier,
} from "@/lib/userProfile";

export interface GameProfileView {
  nickname: string;
  level: number;
  tier: number;
  tierName: string;
  exp: number;
  candy: number;
  /** 현재 레벨 구간 상단의 누적 EXP */
  nextTotal: number;
  /** 레벨 진행률 0~100 */
  progress: number;
  loggedIn: boolean;
}

interface RawProfile {
  level: number;
  tier: number;
  exp: number;
  candy: number;
}

const EMPTY: RawProfile = { level: 1, tier: 1, exp: 0, candy: 0 };

export function useGameProfile(): GameProfileView {
  const { session, status } = useAuth();
  const [raw, setRaw] = useState<RawProfile>(EMPTY);
  const [nickname, setNickname] = useState("나");
  const email = session?.user?.email;
  const name = session?.user?.name;

  const refresh = useCallback((forEmail: string) => {
    const gp = getCachedGameProfile(forEmail);
    setRaw({
      level: gp?.level || 1,
      tier: gp?.tier || 1,
      exp: gp?.doriExp || 0,
      candy: getCottonCandyBalance(forEmail),
    });
  }, []);

  useEffect(() => {
    // 로그아웃·계정 전환 시 이전 사용자 수치가 화면에 남지 않도록 먼저 비운다.
    if (!email) {
      setRaw(EMPTY);
      setNickname("나");
      return;
    }
    setNickname(name || "나");
    refresh(email);
    let alive = true;
    hydrateGameData()
      .then(() => { if (alive) refresh(email); })
      .catch(() => { /* 캐시 값 유지 — 화면을 비우지 않는다 */ });
    return () => { alive = false; };
  }, [email, name, refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = () => { if (email) refresh(email); };
    window.addEventListener("dori-gamedata-synced", onSync);
    return () => window.removeEventListener("dori-gamedata-synced", onSync);
  }, [email, refresh]);

  return useMemo(() => {
    const tier = raw.tier >= 1 && raw.tier <= 10 ? raw.tier : 1;
    return {
      nickname,
      level: raw.level,
      tier,
      tierName: TIER_INFO[tier as UserTier].name,
      exp: raw.exp,
      candy: raw.candy,
      nextTotal: getCurrentLevelStartExp(raw.level) + getNextLevelExp(raw.level),
      progress: calculateLevelProgress(raw.exp, raw.level),
      loggedIn: status === "authenticated",
    };
  }, [nickname, raw, status]);
}
