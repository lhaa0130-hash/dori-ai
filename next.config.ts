import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;