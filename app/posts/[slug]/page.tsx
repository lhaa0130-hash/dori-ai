import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import './post.css';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  // URL 디코딩 추가
  const decodedSlug = decodeURIComponent(slug);
  
  const postsDirectory = path.join(process.cwd(), 'posts');
  const fullPath = path.join(postsDirectory, `${decodedSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // Markdown을 HTML로 변환
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return (
    <main className="post-page">
      <div className="post-container">
        <article className="post-article">
          {/* 헤더 */}
          <header className="post-header">
            <h1 className="post-title">{data.title}</h1>
            <div className="post-meta">
              <time className="post-date">{data.date}</time>
              {data.description && (
                <p className="post-description">{data.description}</p>
              )}
            </div>
          </header>

          {/* 본문 */}
          <div 
            className="post-content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* 하단 버튼 */}
          <footer className="post-footer">
            <a href="/" className="back-button">← 홈으로 돌아가기</a>
          </footer>
        </article>
      </div>
    </main>
  );
}