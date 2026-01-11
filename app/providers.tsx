"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0} // 자동 세션 갱신 비활성화
      refetchOnWindowFocus={false} // 윈도우 포커스 시 자동 갱신 비활성화
    >
      {/* attribute="class"가 있어야 tailwind의 darkMode: "class"와 연결됩니다 */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}