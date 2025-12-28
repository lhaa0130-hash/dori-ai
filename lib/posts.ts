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

  files.forEach(function(file) {
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
  const allFiles = getAllMdFiles(postsDirectory);
  
  // ID와 일치하는 파일명을 가진 파일 찾기 (폴더가 어디든 상관없음)
  const targetFile = allFiles.find(file => path.basename(file) === `${id}.md`);

  if (!targetFile) {
    throw new Error(`Post not found: ${id}`);
  }

  const fileContents = fs.readFileSync(targetFile, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    id: parseInt(id),
    contentHtml,
    ...matterResult.data,
  } as InsightItem & { contentHtml: string };
}