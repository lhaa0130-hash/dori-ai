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
  // 로그인 필요·앱 셸 등 크롤러엔 빈 페이지로 보이는 화면 → 색인 제외(애드센스 '가치 없는 콘텐츠' 방지)
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  keywords,
  locale = "ko",
  hreflang,
  noIndex = false,
}: CreateMetadataProps & { keywords?: string[] }): Metadata {
  const robots = noIndex
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large" as const, "max-snippet": -1 },
      };
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

  // ⚠️ 2026-08-13 — 제목에 이미 브랜드명이 있으면 접미사를 붙이지 않는다.
  //   /en 홈이 "illo — All your AI in one place | illo" 로 illo 가 두 번 나오고 있었다.
  //   브랜드 검색("illo")에서 한글 홈(55위)보다 영문 홈이 먼저 잡히던 원인 중 하나다.
  //   ⚠️ 경계 문자에 여는 괄호도 넣어야 한다 — "illo(일로) — …" 처럼 브랜드 뒤에 바로 괄호가
  //      오는 경우를 놓치면 접미사가 또 붙어 "illo(일로) … | illo" 가 된다(실제로 겪음).
  const BOUND = "\\s(（)）\\[\\]|·—-";
  const hasBrand = new RegExp(`(^|[${BOUND}])${SITE_NAME}([${BOUND}]|$)`, "i").test(title);
  const fullTitle = hasBrand ? title : `${title} | ${SITE_NAME}`;

  return {
    // title은 이미 접미사 포함 완전한 문자열로 반환(객체 default+template이면 중복 '| illo | illo' 발생)
    title: fullTitle,
    description,
    keywords: keywords ? keywords.join(", ") : defaultKeywords.join(", "),
    applicationName: SITE_NAME,
    // ⚠️ 2026-08-13 — "DORI Team" 은 옛 브랜드 표기다. dori-ai.com 은 이제 무관한 별개 사이트라
    //    illo.im 의 저작자 메타에 남아 있으면 안 된다(구조화 데이터·검색 결과에 그대로 노출된다).
    authors: [{ name: "illo", url: SITE_URL }],
    creator: "illo",
    publisher: "illo",
    alternates: {
      canonical: fullUrl,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      title: fullTitle,
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
      title: fullTitle,
      description,
      images: [image],
      creator: "@illo",
    },
    robots,
  };
}