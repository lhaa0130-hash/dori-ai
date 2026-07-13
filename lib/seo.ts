import { Metadata } from "next";

const SITE_NAME = "illo";
const SITE_URL = "https://illo.im";
const DEFAULT_OG_IMAGE = "https://illo.im/og-default.png";

interface CreateMetadataProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  locale?: "ko" | "en";
  // 다국어 대응 페이지면 ko/en 경로를 주면 hreflang 상호 링크를 생성
  hreflang?: { ko: string; en: string };
}

export function createMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  keywords,
  locale = "ko",
  hreflang,
}: CreateMetadataProps & { keywords?: string[] }): Metadata {
  const fullUrl = `${SITE_URL}${path}`;
  const languages = hreflang
    ? {
        "ko-KR": `${SITE_URL}${hreflang.ko}`,
        en: `${SITE_URL}${hreflang.en}`,
        "x-default": `${SITE_URL}${hreflang.ko}`,
      }
    : undefined;
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
    "illo",
    "AI 자동화",
    "AI 교육",
    "AI 도구 모음",
    "AI 뉴스",
    "AI 커뮤니티 플랫폼",
    "무료 AI 도구",
    "AI 활용 방법",
  ];

  return {
    // title은 이미 접미사 포함 완전한 문자열로 반환(객체 default+template이면 중복 '| illo | illo' 발생)
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords: keywords ? keywords.join(", ") : defaultKeywords.join(", "),
    applicationName: SITE_NAME,
    authors: [{ name: "DORI Team", url: SITE_URL }],
    creator: "DORI Team",
    publisher: "illo",
    alternates: {
      canonical: fullUrl,
      ...(languages ? { languages } : {}),
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
      locale: locale === "en" ? "en_US" : "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
      creator: "@illo",
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
  };
}