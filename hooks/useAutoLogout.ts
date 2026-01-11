"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * 10분간 비활성 시 자동 로그아웃 훅
 */
export function useAutoLogout() {
  const { data: session } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // 활동 감지 이벤트
  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    
    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 로그인 상태일 때만 타이머 설정
    if (session) {
      // 10분(600초) 후 자동 로그아웃
      timeoutRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/" });
      }, 10 * 60 * 1000);
    }
  };

  useEffect(() => {
    // 세션이 없으면 타이머 클리어
    if (!session) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // 초기 타이머 설정
    resetTimer();

    // 사용자 활동 이벤트 리스너
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // 이벤트 리스너 등록
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // 정리 함수
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session]);
}

