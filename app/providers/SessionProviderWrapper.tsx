// app/providers/SessionProviderWrapper.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

/**
 * NextAuth 세션 프로바이더를 클라이언트 컴포넌트에서 활성화하는 래퍼
 */
interface Props {
  children: React.ReactNode;
}

export default function SessionProviderWrapper({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}