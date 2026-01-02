// app/sitemap.ts
import type { MetadataRoute } from "next";
import fs from "fs/promises";
import path from "path";

const baseUrl = "https://dori-ai.com";
const CONTENTS_DIR = path.join(process.cwd(), "contents");

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = await Promise.all(
    entries.map(async (e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return walk(full);
      return [full];
    })
  );
  return out.flat();
}

function toUrlPath(filePath: string) {
  const rel = path.relative(CONTENTS_DIR, filePath);
  const noExt = rel.replace(/\.(md|mdx)$/i, "");
  return "/" + noExt.split(path.sep).join("/");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now },
    { url: `${baseUrl}/ai-tools`, lastModified: now },
    { url: `${baseUrl}/insight`, lastModified: now },
    { url: `${baseUrl}/academy`, lastModified: now },
    { url: `${baseUrl}/community`, lastModified: now },
    { url: `${baseUrl}/market`, lastModified: now },
    { url: `${baseUrl}/suggestions`, lastModified: now },
  ];

  let files: string[] = [];
  try {
    const all = await walk(CONTENTS_DIR);
    files = all.filter((f) => /\.(md|mdx)$/i.test(f));
  } catch {
    files = [];
  }

  const contentUrls: MetadataRoute.Sitemap = await Promise.all(
    files.map(async (fp) => {
      const stat = await fs.stat(fp);
      return {
        url: `${baseUrl}${toUrlPath(fp)}`,
        lastModified: stat.mtime,
      };
    })
  );

  return [...staticPages, ...contentUrls];
}
