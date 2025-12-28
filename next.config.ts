import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com", // 유튜브 썸네일
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com", // AI 툴 로고
      },
      {
        protocol: "https",
        hostname: "www.google.com", // Google Favicon
      },
      {
        protocol: "https",
        hostname: "**.google.com", // Google 서브도메인
      },
    ],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // 타입스크립트 설정
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 성능 최적화
  compress: true,
  poweredByHeader: false,
  
  // 실험적 기능 (성능 향상)
  experimental: {
    optimizePackageImports: ['recharts', 'react-markdown', 'quill'],
  },
  
  // 서버리스 함수에서 제외할 파일 (이미지는 정적 파일로 제공)
  outputFileTracingExcludes: {
    '*': [
      'public/images/**/*',
      'public/thumbnails/**/*',
      'public/hero-logo.png',
    ],
  },
  
  // Turbopack 설정 (Next.js 16 기본값)
  // webpack 설정 제거 - Turbopack과 충돌 방지
};

export default nextConfig;