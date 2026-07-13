import { createMetadata } from "@/lib/seo";
import AiModelsClient from "../../ai-models/AiModelsClient";

const SITE = "https://illo.im";

export const metadata = createMetadata({
  title: "AI Model Price Comparison · Live Cost Calculator",
  description: "Compare usage, intelligence, speed and price of the world's most popular AI models — ChatGPT, Claude, Gemini, DeepSeek and more — and auto-calculate each model's monthly cost from your token counts. Auto-updated.",
  path: "/en/ai-models",
  locale: "en",
  hreflang: { ko: "/ai-models", en: "/en/ai-models" },
  keywords: [
    "AI model pricing", "AI model comparison", "LLM price comparison", "AI API cost calculator", "GPT price",
    "Claude price", "Gemini price", "DeepSeek price", "token cost", "AI model ranking", "LLM comparison", "cheapest LLM",
  ],
});

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How is the AI model price calculated?", acceptedAnswer: { "@type": "Answer", text: "We multiply each model's per-1M-token input and output price by your input token count and monthly call volume to estimate the monthly cost. Prices are based on OpenRouter live data." } },
    { "@type": "Question", name: "How fresh is the data?", acceptedAnswer: { "@type": "Answer", text: "We continuously auto-update OpenRouter's real usage and pricing data. Changes are reflected as soon as the source data updates." } },
    { "@type": "Question", name: "Which AI model is used the most?", acceptedAnswer: { "@type": "Answer", text: "The usage ranking is based on the real request volume that developers worldwide send through OpenRouter. You can check it live on the page." } },
  ],
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Model Price Comparison · Cost Calculator | illo",
  url: `${SITE}/en/ai-models`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "A free tool to compare the price, usage, intelligence and speed of the world's popular AI models and calculate monthly cost.",
  publisher: { "@type": "Organization", name: "illo", url: SITE },
  inLanguage: "en",
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <AiModelsClient locale="en" />
    </>
  );
}
