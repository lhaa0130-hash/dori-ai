"use client";

import { useState, useEffect } from "react";
import { isApp } from "@/lib/utils";

/**
 * 현재 환경이 앱(WebView)인지 확인하는 React Hook
 */
export function useIsApp(): boolean {
  const [isAppEnv, setIsAppEnv] = useState(false);

  useEffect(() => {
    setIsAppEnv(isApp());
  }, []);

  return isAppEnv;
}




