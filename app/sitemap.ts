import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dori-ai.com";
  const lastModified = new Date();

  const routes = [
    "",
    "/ai-tools",
    "/insight",
    "/academy",
    "/community",
    "/market",
    "/suggestions",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.8,
  }));
}