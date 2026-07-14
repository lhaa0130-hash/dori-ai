import fs from 'fs';
import path from 'path';

const postsDirectory = path.join(process.cwd(), 'content/guides');

export interface GuidePost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  content: string;
  lang?: "ko" | "en";
  tags?: string[];
  subtitle?: string;
  thumbnail?: string;
}

// 📌 Frontmatter 파싱 함수 (가장 유연하게 설계)
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
    
    // 쉼표로 구분된 배열을 문자열로 처리 (여기서는 tags만 배열로 처리했으나, 이제 tags는 사용하지 않음)
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

export function getGuideSlugs() {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md'));
}

export function getGuideBySlug(slug: string): GuidePost | null {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { metadata, content } = parseFrontmatter(fileContents);

  return {
    slug: realSlug,
    // [보장] 제목이 없으면 파일명 사용
    title: metadata.title || realSlug,
    // [보장] description 또는 subtitle이 없으면 '내용 없음' 사용
    description: metadata.description || metadata.subtitle || '내용이 없습니다.',
    date: metadata.date || new Date().toISOString().slice(0, 10),
    // 모든 글을 '가이드' 카테고리로 강제 설정
    category: '가이드',
    author: metadata.author || 'AI Canvas Editor',
    content: content,
    lang: metadata.lang === "en" ? "en" : "ko",
    tags: metadata.tags || [],
    subtitle: metadata.subtitle,
    thumbnail: metadata.thumbnail,
  };
}

export function getAllGuides(): GuidePost[] {
  const slugs = getGuideSlugs();
  const posts = slugs
    .map((slug) => getGuideBySlug(slug))
    .filter((post): post is GuidePost => post !== null)
    .sort((post1, post2) => (post1.date < post2.date ? -1 : 1)); // 오래된 순으로 정렬
  return posts;
}