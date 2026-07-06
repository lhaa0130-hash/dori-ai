// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllTrends } from "@/lib/trends";
import { getAllCurations } from "@/lib/curation";
import { getAllAnalyses } from "@/lib/analysis";
import { getAllReports } from "@/lib/reports";
import { getAllStudios } from "@/lib/studio";
import { getAllMarketPosts } from "@/lib/market-posts";
import { getAllGuides } from "@/lib/guides";
import fs from "fs";
import path from "path";

export const dynamic = "force-static";

const baseUrl = "https://illo.im";

function getAnimalNos(): string[] {
  try {
    const p = path.join(process.cwd(), "data", "animal-cards.json");
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return (Array.isArray(data) ? data : []).map((c: any) => c?.no).filter(Boolean);
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 1) 핵심 정적 페이지 (크롤 가치 높은 페이지만)
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,          lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/insight`,   lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/ai-tools`,  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${baseUrl}/ai-models`, lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/ai-news`,   lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/video`,     lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${baseUrl}/psychtest`, lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/community`, lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${baseUrl}/market`,    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/animal`,    lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${baseUrl}/minigame`,                     changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/projects`,                      changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/faq`,                          changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/help`,                         changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/legal/about`,                  changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/legal/contact`,                changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/legal/privacy`,                changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/legal/terms`,                  changeFrequency: "monthly", priority: 0.2 },
  ];

  // 2) 아티클 페이지 수집 헬퍼
  const collect = (
    posts: Array<{ slug: string; date?: string }>,
    priority: number
  ): MetadataRoute.Sitemap =>
    posts.map((p) => ({
      url: `${baseUrl}/insight/article/${p.slug}`,
      lastModified: p.date ? new Date(p.date) : now,
      changeFrequency: "monthly" as const, // 발행 후 자주 바뀌지 않음
      priority,
    }));

  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    articleUrls = [
      ...collect(getAllTrends(),    0.8),
      ...collect(getAllCurations(), 0.7),
      ...collect(getAllAnalyses(),  0.7),
      ...collect(getAllReports(),   0.7),
      ...collect(getAllStudios(),   0.8),
      ...collect(getAllMarketPosts(), 0.8),
      ...collect(getAllGuides(),    0.8),
    ];
  } catch (e) {
    console.warn("[sitemap] failed to collect articles:", e);
  }

  // 3) 동물 상세 페이지 (몽글로 동물도감 — 사이트 최대 고유 콘텐츠)
  const animalUrls: MetadataRoute.Sitemap = getAnimalNos().map((no) => ({
    url: `${baseUrl}/animal/${no}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...articleUrls, ...animalUrls];
}
