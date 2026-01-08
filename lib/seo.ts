import { Metadata } from "next";

const SITE_NAME = "DORI-AI";
const SITE_URL = "https://dori-ai.com";
const DEFAULT_OG_IMAGE = "https://dori-ai.com/og-default.png";

interface CreateMetadataProps {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function createMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  keywords,
}: CreateMetadataProps & { keywords?: string[] }): Metadata {
  const fullUrl = `${SITE_URL}${path}`;
  const defaultKeywords = [
    "AI",
    "인공지능",
    "AI 도구",
    "AI 활용",
    "AI 커뮤니티",
    "AI 가이드",
    "AI 트렌드",
    "AI 튜토리얼",
    "생성형 AI",
    "ChatGPT",
    "DORI-AI",
    "AI 자동화",
    "캐릭터 제작 가이드",
    "프레리독 애니메이션",
    "AI 교육 도구",
  ];

  return {
    title: {
      default: `${title} | ${SITE_NAME}`,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    keywords: keywords ? keywords.join(", ") : defaultKeywords.join(", "),
    applicationName: SITE_NAME,
    authors: [{ name: "DORI Team", url: SITE_URL }],
    creator: "DORI Team",
    publisher: "DORI-AI",
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: fullUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
      creator: "@DORI-AI",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-verification-code", // Google Search Console에서 받은 코드로 교체
    },
  };
}