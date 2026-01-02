"use client";

import { ReactNode } from "react";

interface AppLayoutWrapperProps {
  children: ReactNode;
}

/**
 * 앱 환경 전용 레이아웃 래퍼
 * 웹 Header/Footer 없이 컨텐츠만 표시
 */
export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  return (
    <div className="app-layout-wrapper">
      <main className="app-main-content">
        {children}
      </main>
      <style jsx>{`
        .app-layout-wrapper {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .app-main-content {
          flex: 1;
          width: 100%;
          padding-top: 0;
        }
      `}</style>
    </div>
  );
}




