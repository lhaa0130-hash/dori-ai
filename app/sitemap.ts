// app/sitemap.ts
import type { MetadataRoute } from "next";
import fs from "fs/promises";
import path from "path";

// ✅ Vercel/Next 환경에서 파일 시스템 접근 안정화
export const runtime = "nodejs";
export const dynamic = "force-static";

const baseUrl = "https://dori-ai.com";

// ✅ contents 위치가 프로젝트마다 달라서 2군데를 자동 탐색:
// 1) /contents
// 2) /src/contents
const CONTENTS_CANDIDATES = [
  path.join(process.cwd(), "contents"),
  path.join(process.cwd(), "src", "contents"),
];

async function existsDir(p: string) {
  try {
    const st = await fs.stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

async function resolveContentsDir(): Promise<string | null> {
  for (const p of CONTENTS_CANDIDATES) {
    if (await existsDir(p)) return p;
  }
  // 못 찾으면 null 반환
  return null;
}

async function walk(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const out = await Promise.all(
      entries.map(async (e) => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return walk(full);
        return [full];
      })
    );
    return out.flat();
  } catch (error) {
    // 디렉토리가 없거나 접근할 수 없는 경우 빈 배열 반환
    console.warn(`[sitemap] Failed to read directory ${dir}:`, error);
    return [];
  }
}

function toUrlPath(filePath: string, contentsDir: string) {
  const rel = path.relative(contentsDir, filePath);
  const noExt = rel.replace(/\.(md|mdx)$/i, "");
  // windows 경로 구분자 대응
  return "/" + noExt.split(path.sep).join("/");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ✅ 1) 고정 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/ai-tools`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/insight`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/academy`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/market`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/suggestions`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];

  // ✅ 2) contents 폴더 자동 탐지
  const contentsDir = await resolveContentsDir();

  let contentUrls: MetadataRoute.Sitemap = [];

  if (contentsDir) {
    // ✅ 3) md/mdx 파일 수집
    const allFiles = await walk(contentsDir);
    const mdFiles = allFiles.filter((f) => /\.(md|mdx)$/i.test(f));

    // ✅ 로그(베르셀 Logs에서 확인 가능)
    console.log("[sitemap] contentsDir:", contentsDir);
    console.log("[sitemap] mdFiles:", mdFiles.length);
    console.log("[sitemap] sample:", mdFiles.slice(0, 5));

    // ✅ 4) 글 URL 생성
    const urlPromises = await Promise.all(
      mdFiles.map(async (fp) => {
        try {
          const stat = await fs.stat(fp);
          const urlPath = toUrlPath(fp, contentsDir);

          return {
            url: `${baseUrl}${urlPath}`,
            lastModified: stat.mtime,
            changeFrequency: "weekly" as const,
            priority: 0.7,
          };
        } catch (error) {
          console.warn(`[sitemap] Failed to process file ${fp}:`, error);
          return null;
        }
      })
    );
    
    // null 값 제거 및 타입 안전성 확보
    contentUrls = urlPromises.filter(
      (item): item is { url: string; lastModified: Date; changeFrequency: "weekly"; priority: number } => 
        item !== null
    );
  } else {
    console.warn("[sitemap] contents directory not found, skipping content URLs");
  }

  return [...staticPages, ...contentUrls];
}
