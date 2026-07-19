// app/en/psychtest/page.tsx — English psychological self-check hub (/en/psychtest)
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import PsychTestEnClient from "./page.client";

const SITE_URL = "https://illo.im";

const base = createMetadata({
  title: "Free Psychological Tests — Depression, Anxiety, Stress & Burnout Self-Check",
  description:
    "Free online mental health self-checks built on validated scales: PHQ-9 depression, GAD-7 anxiety, PSS-10 stress, burnout, self-esteem, resilience, and social media, smartphone, gaming and alcohol habits. Instant results, no sign-up, nothing stored.",
  path: "/en/psychtest",
  locale: "en",
  hreflang: { ko: "/psychtest", en: "/en/psychtest" },
  keywords: [
    "free psychological test",
    "depression test",
    "PHQ-9 online",
    "anxiety test",
    "GAD-7 test",
    "stress test",
    "burnout test",
    "self-esteem test",
    "resilience test",
    "social media addiction test",
    "smartphone addiction test",
    "gaming addiction test",
    "AUDIT alcohol test",
    "mental health screening",
  ],
});

// x-default points at the English edition for this page (international audience).
export const metadata: Metadata = {
  ...base,
  alternates: {
    canonical: `${SITE_URL}/en/psychtest`,
    languages: {
      "ko-KR": `${SITE_URL}/psychtest`,
      en: `${SITE_URL}/en/psychtest`,
      "x-default": `${SITE_URL}/en/psychtest`,
    },
  },
};

export default function Page() {
  return <PsychTestEnClient />;
}
