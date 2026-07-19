// app/en/enMetadata.ts
// 영어 페이지 공용 metadata 헬퍼.
// createMetadata(locale:"en")를 그대로 쓰되, alternates만 덮어써서
// x-default를 영어 URL로 지정한다(공용 lib/seo.ts는 건드리지 않음 = 한글 페이지 무영향).

import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

const SITE_URL = "https://illo.im";

interface EnMetadataProps {
  title: string;
  description: string;
  /** 대응하는 한글 페이지 경로 (예: "/legal/about") */
  koPath: string;
  /** 영어 페이지 경로 (예: "/en/legal/about") */
  enPath: string;
  keywords?: string[];
}

export function enMetadata({ title, description, koPath, enPath, keywords }: EnMetadataProps): Metadata {
  const base = createMetadata({
    title,
    description,
    path: enPath,
    locale: "en",
    hreflang: { ko: koPath, en: enPath },
    keywords,
  });

  return {
    ...base,
    alternates: {
      canonical: `${SITE_URL}${enPath}`,
      languages: {
        "ko-KR": `${SITE_URL}${koPath}`,
        en: `${SITE_URL}${enPath}`,
        "x-default": `${SITE_URL}${enPath}`,
      },
    },
  };
}
