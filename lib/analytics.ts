// 방문자 전역 집계 — Firestore client increment (정적 export 호환, 솜사탕과 동일 패턴)
// ─────────────────────────────────────────────────────────────
// 기존 방식은 localStorage라 "그 브라우저 1대"만 셌음 → 전역으로 누적되지 않음.
// 여기서는 모든 방문자(비로그인 포함)가 Firestore 카운터를 increment 한다.
//   analytics/summary         { totalUV, totalPV }
//   analyticsDaily/{YYYY-MM-DD} { date, uv, pv }
// UV(순방문): 브라우저당 하루 1회 / PV(조회): 세션(탭)당 1회
//
// ⚠️ 비로그인 방문자도 쓰려면 Firestore 보안 규칙에서 analytics 경로 쓰기 허용 필요.
//    (firestore.analytics.rules.txt 참고 — 콘솔에 규칙 추가/배포)

import {
  doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit,
  increment, serverTimestamp,
} from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type DeviceType = "mobile" | "tablet" | "desktop";
export interface AnalyticsSummary {
  totalUV: number;
  totalPV: number;
  mobile: number;
  tablet: number;
  desktop: number;
}
export interface DailyAnalytics { date: string; uv: number; pv: number }

/** userAgent 기반 기기 종류 판별 (모바일/태블릿/PC) */
export function getDeviceType(): DeviceType {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const touch = (navigator.maxTouchPoints || 0) > 1;
  // 태블릿: iPad(신형은 Mac으로 위장 → 터치로 보정), Android 태블릿(Mobile 미포함)
  if (/iPad/i.test(ua) || (/(Macintosh)/i.test(ua) && touch) || /Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return "tablet";
  }
  if (/Mobi|iPhone|iPod|Android|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/** 방문 기록 (페이지 로드시 호출). UV 하루1회/브라우저, PV 세션1회. */
export function trackVisit(): void {
  if (typeof window === "undefined") return;
  const today = todayStr();

  // 브라우저 식별자(영구)
  try {
    if (!localStorage.getItem("dori_visitor_id")) {
      const id = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID() : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("dori_visitor_id", id);
    }
  } catch {}

  // ⚠️ 중복방지 키 v2 — 규칙 게시 전 실패로 찍힌 기존 플래그를 무시하고 한 번씩 다시 카운트
  const UV_KEY = "dori_uv_date_v2";
  const PV_KEY = "dori_pv_counted_v2";

  let newUV = false, newPV = false;
  try {
    newUV = localStorage.getItem(UV_KEY) !== today;
    newPV = !sessionStorage.getItem(PV_KEY);
  } catch {
    return;
  }
  if (!newUV && !newPV) return;

  // ✅ 자가복구: Firestore 쓰기가 "성공했을 때만" 카운트함 플래그를 남김
  //    → 규칙이 막혀 있으면 플래그 미저장 → 규칙 게시 후 다음 방문에 자동 재시도/집계
  const markCounted = () => {
    try {
      if (newUV) {
        localStorage.setItem(UV_KEY, today);
        const t = parseInt(localStorage.getItem("dori_total_visitors") || "0", 10) + 1;
        localStorage.setItem("dori_total_visitors", String(t));
      }
      if (newPV) sessionStorage.setItem(PV_KEY, "1");
    } catch {}
  };

  try {
    const db = getFirebaseFirestore();
    const sPatch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    const dPatch: Record<string, unknown> = { date: today, updatedAt: serverTimestamp() };
    if (newUV) {
      sPatch.totalUV = increment(1); dPatch.uv = increment(1);
      const devKey = `dev_${getDeviceType()}`;
      sPatch[devKey] = increment(1); dPatch[devKey] = increment(1);
    }
    if (newPV) { sPatch.totalPV = increment(1); dPatch.pv = increment(1); }

    Promise.all([
      setDoc(doc(db, "analytics", "summary"), sPatch, { merge: true }),
      setDoc(doc(db, "analyticsDaily", today), dPatch, { merge: true }),
    ])
      .then(markCounted)
      .catch(() => { /* 규칙/네트워크 실패 → 플래그 미저장, 다음 방문에 재시도 */ });
  } catch { /* 화면엔 영향 없음 */ }
}

/** 전체 누적 (관리자용) */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const db = getFirebaseFirestore();
    const s = await getDoc(doc(db, "analytics", "summary"));
    const d = (s.data() as Record<string, number>) || {};
    return {
      totalUV: d.totalUV || 0,
      totalPV: d.totalPV || 0,
      mobile: d.dev_mobile || 0,
      tablet: d.dev_tablet || 0,
      desktop: d.dev_desktop || 0,
    };
  } catch {
    return { totalUV: 0, totalPV: 0, mobile: 0, tablet: 0, desktop: 0 };
  }
}

/** 최근 N일 일별 통계 (오름차순) (관리자용) */
export async function getDailyAnalytics(days = 30): Promise<DailyAnalytics[]> {
  try {
    const db = getFirebaseFirestore();
    const q = query(collection(db, "analyticsDaily"), orderBy("date", "desc"), limit(days));
    const snap = await getDocs(q);
    const arr: DailyAnalytics[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, number | string>;
      arr.push({ date: String(d.date || docSnap.id), uv: Number(d.uv || 0), pv: Number(d.pv || 0) });
    });
    return arr.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export function getTodayStr(): string { return todayStr(); }

// ─── 구글 애드센스 수입 (Firestore analytics/adsense) ───────────────
// 정적 사이트라 수입은 직접 입력하거나 n8n(AdSense API)이 이 문서에 써넣음.
export interface AdsenseData {
  today: number;       // 오늘 현재까지
  yesterday: number;   // 어제
  last7: number;       // 지난 7일
  month: number;       // 이번 달
  balance: number;     // 잔고
  lastPayment: string; // 최종 지급액/일 메모 (예: "US$0.00")
  currency: string;    // 통화 표기 (예: "US$")
  updatedAt?: string;  // 마지막 갱신 시각(ISO)
}

const EMPTY_ADSENSE: AdsenseData = {
  today: 0, yesterday: 0, last7: 0, month: 0, balance: 0,
  lastPayment: "", currency: "US$",
};

export async function getAdsense(): Promise<AdsenseData> {
  try {
    const db = getFirebaseFirestore();
    const s = await getDoc(doc(db, "analytics", "adsense"));
    if (!s.exists()) return EMPTY_ADSENSE;
    const d = s.data() as Partial<AdsenseData>;
    return {
      today: Number(d.today || 0),
      yesterday: Number(d.yesterday || 0),
      last7: Number(d.last7 || 0),
      month: Number(d.month || 0),
      balance: Number(d.balance || 0),
      lastPayment: String(d.lastPayment || ""),
      currency: String(d.currency || "US$"),
      updatedAt: d.updatedAt ? String(d.updatedAt) : undefined,
    };
  } catch {
    return EMPTY_ADSENSE;
  }
}

export async function saveAdsense(data: Partial<AdsenseData>): Promise<boolean> {
  try {
    const db = getFirebaseFirestore();
    await setDoc(
      doc(db, "analytics", "adsense"),
      { ...data, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return true;
  } catch {
    return false;
  }
}
