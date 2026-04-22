import fs from 'fs';
import path from 'path';

const reportsDirectory = path.join(process.cwd(), 'content/reports');

export interface ReportPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  content: string;
  tags?: string[];
  thumbnail?: string;
}

// 📌 Frontmatter 파싱 함수 (가이드와 동일한 방식)
function parseFrontmatter(fileContent: string) {
  const contentStr = fileContent.replace(/^\uFEFF/, '');

  // 1) 우선, 일반적인 YAML 블럭(`--- ... ---`) 형식을 우선 시도
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---\s*/;
  const match = frontmatterRegex.exec(contentStr);

  let frontMatterBlock = "";
  let bodyContent = contentStr;

  if (match) {
    // --- ... --- 블럭이 있는 경우
    frontMatterBlock = match[1];
    bodyContent = contentStr.replace(frontmatterRegex, "").trim();
  } else {
    // 2) `---` 블럭이 없는 경우:
    //    파일 상단의 "key: value" 라인들을 메타데이터로 간주하고,
    //    첫 빈 줄 이후를 본문으로 처리
    const lines = contentStr.split("\n");
    const metaLines: string[] = [];
    let contentStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 완전히 비어 있는 줄을 만나면 거기서 메타데이터 종료
      if (line.trim() === "") {
        contentStartIndex = i + 1;
        break;
      }
      metaLines.push(line);
    }

    // "key: value" 패턴이 하나라도 있으면 메타데이터로 인식
    const hasKeyValue = metaLines.some((line) => line.includes(":"));
    if (hasKeyValue) {
      frontMatterBlock = metaLines.join("\n");
      bodyContent = lines.slice(contentStartIndex).join("\n").trim();
    }
  }

  if (!frontMatterBlock) {
    // 파싱할 메타데이터가 없으면 전체를 본문으로 간주
    return { metadata: {}, content: bodyContent };
  }

  const frontMatterLines = frontMatterBlock.trim().split('\n');
  const metadata: any = {};

  frontMatterLines.forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    
    // 따옴표 제거 (예: "AI 가이드" -> AI 가이드)
    value = value.replace(/^['"](.*)['"]$/, '$1');
    
    // 쉼표로 구분된 배열을 문자열로 처리 (tags 배열 처리)
    if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
       metadata[key] = value
          .slice(1, -1)
          .split(',')
          .map((item: string) => item.trim().replace(/^['"](.*)['"]$/, '$1'));
    } else {
       metadata[key] = value;
    }
  });

  return { metadata, content: bodyContent };
}

export function getReportSlugs() {
  if (!fs.existsSync(reportsDirectory)) return [];
  return fs.readdirSync(reportsDirectory).filter(file => file.endsWith('.md'));
}

export function getReportBySlug(slug: string): ReportPost | null {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(reportsDirectory, `${realSlug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { metadata, content } = parseFrontmatter(fileContents);

  return {
    slug: realSlug,
    title: metadata.title || realSlug,
    description: metadata.description || metadata.summary || '내용이 없습니다.',
    date: metadata.date || new Date().toISOString().slice(0, 10),
    category: metadata.category || '트렌드',
    author: metadata.author || 'DORI-AI',
    content: content,
    tags: Array.isArray(metadata.tags) ? metadata.tags : (metadata.tags ? [metadata.tags] : []),
    thumbnail: metadata.thumbnail || metadata.image,
  };
}

export function getAllReports(): ReportPost[] {
  const slugs = getReportSlugs();
  const trends = slugs
    .map((slug) => getReportBySlug(slug))
    .filter((trend): trend is ReportPost => trend !== null)
    .sort((trend1, trend2) => {
      // 최신순으로 정렬 (날짜 내림차순)
      const date1 = new Date(trend1.date).getTime();
      const date2 = new Date(trend2.date).getTime();
      return date2 - date1;
    });
  return trends;
}




