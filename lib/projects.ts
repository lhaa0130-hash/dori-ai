import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// 프로젝트 디렉토리 경로 - 여러 가능한 경로 시도
function getProjectsDirectory() {
  const possiblePaths = [
    path.join(process.cwd(), 'content', 'projects'),
    path.join(process.cwd(), 'content/projects'),
    path.resolve(process.cwd(), 'content', 'projects'),
  ];
  
  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      return dirPath;
    }
  }
  
  // 기본값 반환
  return path.join(process.cwd(), 'content', 'projects');
}

const projectsDirectory = getProjectsDirectory();

// 프로젝트 파일 목록 가져오기
export function getProjectFiles() {
  try {
    if (!fs.existsSync(projectsDirectory)) return [];
    
    const files = fs.readdirSync(projectsDirectory);
    const projectFiles = files
      .filter(file => file.endsWith('.md') && file.startsWith('project'))
      .map(file => {
        const filePath = path.join(projectsDirectory, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const matterResult = matter(fileContents);
        
        // 파일명에서 ID 추출 (project01-1.md -> project01-1)
        const id = file.replace('.md', '');
        
        return {
          id,
          title: matterResult.data.title || id,
          date: matterResult.data.date || '',
          description: matterResult.data.description || '',
          ...matterResult.data,
        };
      })
      .sort((a, b) => {
        // 파일명 순서로 정렬
        return a.id.localeCompare(b.id);
      });
    
    return projectFiles;
  } catch (error) {
    console.error('Error reading project files:', error);
    return [];
  }
}

// 특정 프로젝트 내용 가져오기
export async function getProjectData(id: string) {
  try {
    const filePath = path.join(projectsDirectory, `${id}.md`);
    
    // 디렉토리 존재 확인
    if (!fs.existsSync(projectsDirectory)) {
      console.error(`Projects directory not found: ${projectsDirectory}`);
      throw new Error(`Projects directory not found`);
    }
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      console.error(`Project file not found: ${filePath} (id: ${id})`);
      throw new Error(`Project not found: ${id}`);
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    if (!fileContents || fileContents.trim().length === 0) {
      console.error(`Project file is empty: ${filePath}`);
      throw new Error(`Project file is empty: ${id}`);
    }
    
    // contentReference 같은 특수 문법 제거 (remark에서 처리되지 않는 문법)
    const cleanedContent = fileContents
      .replace(/::contentReference\[.*?\]\{.*?\}/g, '')
      .replace(/::/g, '') // 다른 특수 문법도 제거
      .trim();
    
    let matterResult;
    try {
      matterResult = matter(cleanedContent);
    } catch (error) {
      console.error('Error parsing frontmatter:', error);
      // frontmatter가 없어도 처리 가능하도록
      matterResult = {
        data: {},
        content: cleanedContent,
      };
    }

    let contentHtml = '';
    try {
      const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
      contentHtml = processedContent.toString();
    } catch (error) {
      console.error('Error processing markdown:', error);
      // 에러 발생 시 원본 텍스트를 HTML로 이스케이프
      contentHtml = `<pre>${matterResult.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }

    return {
      id,
      contentHtml,
      contentMarkdown: matterResult.content, // 마크다운 원본 추가
      title: matterResult.data.title || id,
      date: matterResult.data.date || '',
      description: matterResult.data.description || '',
      ...matterResult.data,
    };
  } catch (error) {
    console.error('Error reading project:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

