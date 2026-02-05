import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { InsightItem } from '@/types/content';

const postsDirectory = path.join(process.cwd(), 'posts');

// 🔍 [핵심] 폴더 속의 폴더까지 뒤져서 모든 .md 파일 경로를 찾아내는 함수 (재귀)
function getAllMdFiles(dirPath: string, arrayOfFiles: string[] = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // 폴더면 안으로 더 들어감
      arrayOfFiles = getAllMdFiles(fullPath, arrayOfFiles);
    } else {
      // 파일이고 확장자가 .md면 목록에 추가
      if (file.endsWith(".md")) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// 1. 모든 글 목록 가져오기 (리스트용)
export function getSortedPostsData(): InsightItem[] {
  try {
    // posts 디렉토리가 없으면 빈 배열 반환
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }

    // 전체 파일 탐색
    const allFiles = getAllMdFiles(postsDirectory);

    if (allFiles.length === 0) {
      return [];
    }

    const allPostsData = allFiles
      .map((fullPath) => {
        try {
          // 파일명(101.md)에서 확장자 제거 -> ID(101)
          const id = path.basename(fullPath).replace(/\.md$/, '');
          const fileContents = fs.readFileSync(fullPath, 'utf8');
          const matterResult = matter(fileContents);

          // 필수 필드 확인
          const postData = {
            id: parseInt(id) || 0,
            title: matterResult.data.title || '제목 없음',
            summary: matterResult.data.summary || matterResult.data.description || '',
            category: matterResult.data.category || '기타',
            tags: Array.isArray(matterResult.data.tags) ? matterResult.data.tags : [],
            likes: matterResult.data.likes || 0,
            date: matterResult.data.date || new Date().toISOString().split('T')[0],
            content: "", // 리스트엔 본문 불필요
            ...(matterResult.data.image && { image: matterResult.data.image }),
            ...(matterResult.data.aiMeta && { aiMeta: matterResult.data.aiMeta }),
          } as InsightItem;

          return postData;
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error);
          return null;
        }
      })
      .filter((post): post is InsightItem => post !== null);

    // 날짜 최신순 정렬
    return allPostsData.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error in getSortedPostsData:', error);
    return [];
  }
}

// 2. 특정 글 내용 가져오기 (상세 페이지용)
export async function getPostData(id: string) {
  // 1. 일반 포스트에서 찾기
  const allFiles = getAllMdFiles(postsDirectory);
  const targetFile = allFiles.find(file => path.basename(file) === `${id}.md`);

  if (targetFile) {
    const fileContents = fs.readFileSync(targetFile, 'utf8');
    const matterResult = matter(fileContents);
    // MDX 사용을 위해 raw content 반환
    return {
      id: parseInt(id) || 0,
      content: matterResult.content, // Raw Markdown
      contentHtml: '', // Legacy support
      ...matterResult.data,
      thumbnail_url: matterResult.data.image, // Map image to thumbnail_url
      author: matterResult.data.author || 'DORI-AI', // Default author
      date: matterResult.data.date || new Date().toISOString(),
    } as any;
  }

  // 2. 트렌드에서 찾기
  const { getTrendBySlug } = await import('@/lib/trends');
  const trend = getTrendBySlug(id);
  if (trend) {
    return {
      id: id,
      content: trend.content, // Raw Markdown
      contentHtml: '',
      title: trend.title,
      date: trend.date,
      category: trend.category,
      author: trend.author,
      thumbnail_url: trend.thumbnail,
      tags: trend.tags,
    } as any;
  }

  // 3. 가이드에서 찾기
  const { getGuideBySlug } = await import('@/lib/guides');
  const guide = getGuideBySlug(id);
  if (guide) {
    return {
      id: id,
      content: guide.content, // Raw Markdown
      contentHtml: '',
      title: guide.title,
      date: guide.date,
      category: guide.category,
      author: guide.author,
      thumbnail_url: guide.thumbnail,
      tags: guide.tags,
    } as any;
  }

  throw new Error(`Post not found: ${id}`);
}