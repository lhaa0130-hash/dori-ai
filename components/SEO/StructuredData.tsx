export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DORI-AI",
    url: "https://dori-ai.com",
    logo: "https://dori-ai.com/logo.png",
    description: "AI 활용 방법을 함께 연구하고 실전으로 적용해보는 커뮤니티 플랫폼",
    sameAs: [
      // 소셜 미디어 링크 추가 가능
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DORI-AI",
    url: "https://dori-ai.com",
    description: "AI 도구, 인사이트, 아카데미, 커뮤니티를 한 곳에서 제공하는 AI 플랫폼",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://dori-ai.com/api/search?q={search_term_string}",
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

