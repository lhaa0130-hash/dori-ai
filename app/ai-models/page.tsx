import { createMetadata } from "@/lib/seo";
import AiModelsClient from "./AiModelsClient";

const SITE = "https://dori-ai.com";

export const metadata = createMetadata({
  title: "AI 모델 가격 비교 · 실시간 비용 계산기",
  description: "ChatGPT, Claude, Gemini, DeepSeek 등 전 세계 인기 AI 모델의 사용량·지능·속도·가격을 한눈에 비교하고, 토큰 수만 넣으면 모델별 월 비용을 자동 계산합니다. 자동 갱신.",
  path: "/ai-models",
  keywords: [
    "AI 모델 가격", "AI 모델 비교", "LLM 가격 비교", "AI API 비용 계산기", "GPT 가격",
    "Claude 가격", "Gemini 가격", "DeepSeek 가격", "토큰 비용", "AI 모델 순위", "LLM 비교",
  ],
});

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "AI 모델 가격은 어떻게 계산되나요?", acceptedAnswer: { "@type": "Answer", text: "각 모델의 입력·출력 100만 토큰당 단가에 입력 토큰 수와 월 호출 횟수를 곱해 월 예상 비용을 계산합니다. OpenRouter 실시간 가격 기준입니다." } },
    { "@type": "Question", name: "데이터는 얼마나 최신인가요?", acceptedAnswer: { "@type": "Answer", text: "OpenRouter의 실제 사용량·가격 데이터를 자동으로 수시 갱신합니다. 원천 데이터가 갱신되는 즉시 반영됩니다." } },
    { "@type": "Question", name: "가장 많이 쓰는 AI 모델은 무엇인가요?", acceptedAnswer: { "@type": "Answer", text: "전 세계 개발자들이 OpenRouter를 통해 보낸 실제 요청량 기준으로 사용량 순위를 제공합니다. 페이지에서 실시간으로 확인할 수 있습니다." } },
  ],
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI 모델 가격 비교 · 비용 계산기 | DORI-AI",
  url: `${SITE}/ai-models`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "전 세계 인기 AI 모델의 가격·사용량·지능·속도를 비교하고 월 비용을 계산하는 무료 도구.",
  publisher: { "@type": "Organization", name: "DORI-AI", url: SITE },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <AiModelsClient />
    </>
  );
}
