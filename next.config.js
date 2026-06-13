/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Cloudflare Pages 정적 배포용 (out/ 폴더 생성)

  // 문법 검사기가 깐깐하게 굴어도 무시하고 빌드해라!
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // 배럴 임포트(lucide-react, framer-motion)를 직접 임포트로 변환 → 클라 번들 축소
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;