import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 1. posts 디렉토리 경로 설정 (프로젝트 루트의 'posts' 폴더를 바라봄)
// 만약 폴더명이 다르다면 'posts' 부분을 수정해주세요.
const postsDirectory = path.join(process.cwd(), 'posts');

// 2. 게시물 데이터 타입 정의 (오류 해결의 핵심!)
export interface PostData {
  id: string;
  date: string;
  title: string;
  category: string;
  [key: string]: any; // 그 외 다른 필드 허용
}

export function getSortedPostsData(): PostData[] {
  // posts 폴더가 없는 경우 빈 배열 반환 (에러 방지)
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  // /posts 디렉토리 내의 파일 이름들을 가져옴
  const fileNames = fs.readdirSync(postsDirectory);
  
  const allPostsData = fileNames.map((fileName) => {
    // id를 가져오기 위해 파일 이름에서 ".md" 제거
    const id = fileName.replace(/\.md$/, '');

    // 마크다운 파일을 문자열로 읽기
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // gray-matter를 사용하여 포스트의 메타데이터 파싱
    const matterResult = matter(fileContents);

    // 데이터를 PostData 타입으로 반환
    return {
      id,
      ...matterResult.data,
    } as PostData;
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

// (선택 사항) 특정 ID의 게시물 데이터를 가져오는 함수
export function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // gray-matter를 사용하여 포스트의 메타데이터 파싱
  const matterResult = matter(fileContents);

  // 컨텐츠와 데이터를 결합하여 반환
  return {
    id,
    ...matterResult.data,
    content: matterResult.content,
  };
}

// (선택 사항) 동적 라우팅을 위한 경로 목록 반환 함수
export function getAllPostIds() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.md$/, ''),
      },
    };
  });
}