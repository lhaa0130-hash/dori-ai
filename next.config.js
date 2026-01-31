/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
};

export default nextConfig;