// lib/posts.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'posts');

// 파일 경로와 내용을 재귀적으로 읽어오는 헬퍼 함수
function getAllMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 디렉토리인 경우 재귀 호출
      getAllMarkdownFiles(filePath, fileList);
    } else if (filePath.endsWith('.md')) {
      // 마크다운 파일만 추가
      fileList.push(filePath);
    }
  });

  return fileList;
}

export function getSortedPostsData() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  // posts 폴더 내 모든 마크다운 파일 경로 가져오기
  const allFilePaths = getAllMarkdownFiles(postsDirectory);

  const allPostsData = allFilePaths.map((fullPath) => {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    // posts/를 기준으로 상대 경로 계산하여 ID로 사용
    const relativePath = path.relative(postsDirectory, fullPath);
    const id = relativePath.replace(/\.md$/, '');

    // ★ 카테고리 명칭 통일 로직 시작
    let categoryFromFrontmatter = (matterResult.data.category || "") as string;
    
    // 1. "생성형 AI 정보 공유" -> "AI 정보 공유"로 통합 (요청 반영)
    if (categoryFromFrontmatter === "생성형 AI 정보 공유") {
        categoryFromFrontmatter = "AI 정보 공유";
    }

    // 2. 카테고리가 없거나 비어있는 경우 기본값 설정
    //    ID에 'news/' 경로가 포함되어 있으면 'AI 뉴스'로, 아니면 'AI 정보 공유'로 설정
    if (!categoryFromFrontmatter) {
        categoryFromFrontmatter = id.includes('news/') ? "AI 뉴스" : "AI 정보 공유";
    }
    // ★ 카테고리 명칭 통일 로직 끝

    // 파일명에서 읽어온 모든 데이터 반환
    return {
      id,
      ...matterResult.data,
      category: categoryFromFrontmatter,
    };
  });

  // 날짜순 정렬 (최신순)
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

// 특정 ID의 포스트 데이터 가져오기 (HTML 변환 포함)
export async function getPostData(id: string) {
  // ID를 경로로 변환
  const fullPath = path.join(postsDirectory, `${decodeURIComponent(id)}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  // 마크다운을 HTML로 변환
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();
    
  // 카테고리 데이터에도 통일된 명칭 적용 (읽는 순간 통일)
  let category = (matterResult.data.category || "") as string;
  if (category === "생성형 AI 정보 공유") {
      category = "AI 정보 공유";
  }
  if (!category) {
      category = id.includes('news/') ? "AI 뉴스" : "AI 정보 공유";
  }

  return {
    id,
    contentHtml,
    ...matterResult.data,
    category: category,
  };
}