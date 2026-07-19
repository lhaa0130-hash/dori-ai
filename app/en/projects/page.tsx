// app/en/projects/page.tsx — English projects page (/en/projects)
import { createMetadata } from "@/lib/seo";
import ProjectsEnClient from "./page.client";

const SITE_URL = "https://illo.im";

const base = createMetadata({
  title: "Projects by illo — practical AI services we design, build and run",
  description:
    "AI services designed, built and operated by illo: an AI assistant office for solo businesses, an architecture drafting assistant, and a family hub. Custom builds welcome.",
  path: "/en/projects",
  locale: "en",
  hreflang: { ko: "/projects", en: "/en/projects" },
  keywords: [
    "AI projects", "AI services", "custom AI development", "AI assistant for business",
    "AI tools built in-house", "illo projects",
  ],
});

export const metadata = {
  ...base,
  alternates: {
    canonical: `${SITE_URL}/en/projects`,
    languages: {
      "ko-KR": `${SITE_URL}/projects`,
      en: `${SITE_URL}/en/projects`,
      "x-default": `${SITE_URL}/en/projects`,
    },
  },
};

export default function Page() {
  return <ProjectsEnClient />;
}
