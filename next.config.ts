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
        hostname: "logo.clearbit.com", // 👈 [추가] 로고 이미지 API
      },
    ],
  },
  /* 배포 시 에러 무시 설정 (선택 사항) */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;