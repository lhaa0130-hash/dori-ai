import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com", // 👈 유튜브 썸네일 서버 허용
      },
    ],
  },
  /* 배포 시 ESLint/TypeCheck 오류 무시 (선택 사항) */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;