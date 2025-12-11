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
  // 전체 파일 탐색
  const allFiles = getAllMdFiles(postsDirectory);
  
  const allPostsData = allFiles.map((fullPath) => {
    // 파일명(101.md)에서 확장자 제거 -> ID(101)
    const id = path.basename(fullPath).replace(/\.md$/, ''); 
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    return {
      id: parseInt(id),
      ...matterResult.data,
      content: "", // 리스트엔 본문 불필요
    } as InsightItem;
  });

  // 날짜 최신순 정렬
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
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