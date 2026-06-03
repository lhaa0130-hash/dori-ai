import fs from 'fs';
import path from 'path';

const studioDirectory = path.join(process.cwd(), 'content/studio');

export interface StudioPost {
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

// 📌 Frontmatter 파싱 (trends.ts와 동일 방식)
function parseFrontmatter(fileContent: string) {
  const contentStr = fileContent.replace(/^﻿/, '');

  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---\s*/;
  const match = frontmatterRegex.exec(contentStr);

  let frontMatterBlock = '';
  let bodyContent = contentStr;

  if (match) {
    frontMatterBlock = match[1];
    bodyContent = contentStr.replace(frontmatterRegex, '').trim();
  } else {
    const lines = contentStr.split('\n');
    const metaLines: string[] = [];
    let contentStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') {
        contentStartIndex = i + 1;
        break;
      }
      metaLines.push(line);
    }

    const hasKeyValue = metaLines.some((line) => line.includes(':'));
    if (hasKeyValue) {
      frontMatterBlock = metaLines.join('\n');
      bodyContent = lines.slice(contentStartIndex).join('\n').trim();
    }
  }

  if (!frontMatterBlock) {
    return { metadata: {} as any, content: bodyContent };
  }

  const frontMatterLines = frontMatterBlock.trim().split('\n');
  const metadata: any = {};

  frontMatterLines.forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    value = value.replace(/^['"](.*)['"]$/, '$1');

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

export function getStudioSlugs() {
  if (!fs.existsSync(studioDirectory)) return [];
  return fs.readdirSync(studioDirectory).filter((file) => file.endsWith('.md'));
}

export function getStudioBySlug(slug: string): StudioPost | null {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(studioDirectory, `${realSlug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { metadata, content } = parseFrontmatter(fileContents);

  return {
    slug: realSlug,
    title: metadata.title || realSlug,
    description: metadata.description || metadata.summary || '내용이 없습니다.',
    date: metadata.date || new Date().toISOString().slice(0, 10),
    category: metadata.category || '스튜디오',
    author: metadata.author || 'DORI-AI',
    content: content,
    tags: Array.isArray(metadata.tags) ? metadata.tags : metadata.tags ? [metadata.tags] : [],
    thumbnail: metadata.thumbnail || metadata.image,
  };
}

export function getAllStudios(): StudioPost[] {
  const slugs = getStudioSlugs();
  const studios = slugs
    .map((slug) => getStudioBySlug(slug))
    .filter((s): s is StudioPost => s !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return studios;
}
