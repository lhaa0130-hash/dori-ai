import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  // This is a very basic check. You might need a more sophisticated one based on your app.
  return /dori-ai-webview/i.test(userAgent);
}