// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers"; // ← 위에서 만든 named export 사용

export const metadata: Metadata = {
  title: "DORI-AI",
  description: "DESIGN OF REAL INTELLIGENCE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      {/* hydration 경고 무시 (body에 동적으로 style 붙는 경우 대비) */}
      <body suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
