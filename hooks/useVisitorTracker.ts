"use client";

import { useEffect } from "react";
import { trackVisit } from "@/lib/analytics";

/**
 * 방문자 추적 — Firestore 전역 누적(lib/analytics).
 * 기존 localStorage-온리 방식(브라우저 1대만 집계)을 대체.
 */
export default function useVisitorTracker() {
  useEffect(() => {
    trackVisit();
  }, []);
}
