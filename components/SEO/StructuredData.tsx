import { SOCIAL_SAMEAS } from "@/constants/socialLinks";

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "illo",
    url: "https://illo.im",
    logo: "https://illo.im/logo.png",
    description: "AI 활용 방법을 함께 연구하고 실전으로 적용해보는 커뮤니티 플랫폼. AI 자동화, 캐릭터 제작 가이드, 프레리독 애니메이션 교육을 제공합니다.",
    email: "illo@illo.im",
    sameAs: SOCIAL_SAMEAS,
    areaServed: "KR",
    knowsAbout: [
      "AI 자동화",
      "캐릭터 제작",
      "프레리독 애니메이션",
      "AI 교육",
      "AI 도구",
      "AI 커뮤니티"
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "illo",
    url: "https://illo.im",
    description: "AI 도구, 인사이트, 아카데미, 커뮤니티를 한 곳에서 제공하는 AI 플랫폼",
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

