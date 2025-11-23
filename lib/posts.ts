import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'posts'); // 'posts' 폴더 경로

// 1. 목록 가져오기 (정렬 포함)
export function getSortedPostsData() {
  // posts 폴더가 없으면 빈 배열 반환
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    // 파일명에서 ".md" 제거해서 ID로 사용
    const id = fileName.replace(/\.md$/, '');

    // 파일 내용 읽기
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // gray-matter로 메타데이터(제목, 날짜 등) 파싱
    const matterResult = matter(fileContents);

    return {
      id,
      ...(matterResult.data as { date: string; title: string; category: string; thumbnail?: string }),
    };
  });

  // 날짜순 정렬
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

// 2. 특정 글 내용 가져오기 (HTML 변환)
export async function getPostData(id: string) {
  // 한글 파일명 등 디코딩 처리
  const fullPath = path.join(postsDirectory, `${decodeURIComponent(id)}.md`);
  
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // 메타데이터 파싱
  const matterResult = matter(fileContents);

  // 마크다운을 HTML로 변환
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...(matterResult.data as { date: string; title: string; category: string; thumbnail?: string }),
  };
}