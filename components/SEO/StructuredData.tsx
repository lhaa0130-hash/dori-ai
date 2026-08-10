import { SOCIAL_SAMEAS } from "@/constants/socialLinks";

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "illo",
    url: "https://illo.im",
    logo: "https://illo.im/logo.png",
    // ⚠️ 2026-08-10 정정 — "캐릭터 제작 가이드·프레리독 애니메이션 교육·커뮤니티"는 사이트에
    //    실제로 없는 콘텐츠였다(오래된 문구). 구조화 데이터도 심사·검색이 읽는 사이트 설명이므로
    //    실제 제공하는 것만 남긴다.
    description: "AI 도구와 AI 모델을 카테고리별로 비교하고, 기술·시장 변화를 심층 분석해 정리하는 AI 정보 플랫폼입니다.",
    email: "illo@illo.im",
    sameAs: SOCIAL_SAMEAS,
    areaServed: "KR",
    knowsAbout: [
      "AI 도구",
      "AI 모델 비교",
      "LLM 가격",
      "AI 자동화",
      "AI 시장 분석",
      "생성형 AI"
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "illo",
    url: "https://illo.im",
    description: "AI 도구 디렉터리, AI 모델 비교, 심층 분석 인사이트를 한 곳에서 제공하는 AI 정보 플랫폼",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://illo.im/api/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

