// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllTrends } from "@/lib/trends";
import { getAllCurations } from "@/lib/curation";
import { getAllAnalyses } from "@/lib/analysis";
import { getAllReports } from "@/lib/reports";
import { getAllStudios } from "@/lib/studio";

export const dynamic = "force-static";

const baseUrl = "https://dori-ai.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 1) 고정 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/insight`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/ai-tools`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/academy`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/market`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/suggestions`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/legal/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/legal/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/legal/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/legal/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // 2) 모든 콘텐츠 글 → /insight/article/{slug}
  const collect = (posts: Array<{ slug: string; date?: string }>, priority: number) =>
    posts.map((p) => ({
      url: `${baseUrl}/insight/article/${p.slug}`,
      lastModified: p.date ? new Date(p.date) : now,
      changeFrequency: "weekly" as const,
      priority,
    }));

  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    articleUrls = [
      ...collect(getAllTrends(), 0.8),
      ...collect(getAllCurations(), 0.7),
      ...collect(getAllAnalyses(), 0.7),
      ...collect(getAllReports(), 0.7),
      ...collect(getAllStudios(), 0.8),
    ];
  } catch (e) {
    console.warn("[sitemap] failed to collect articles:", e);
  }

  return [...staticPages, ...articleUrls];
}
