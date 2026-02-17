"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";

export { AuthProvider };

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        storageKey="dori-ai-theme"
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}