// app/posts/[slug]/page.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import Link from 'next/link';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  // URL 디코딩 (한글 제목 지원)
  const decodedSlug = decodeURIComponent(slug);
  
  const postsDirectory = path.join(process.cwd(), 'posts');
  const fullPath = path.join(postsDirectory, `${decodedSlug}.md`);
  
  // 파일이 없을 경우 에러 처리 (404 페이지 대신 간단한 안내)
  if (!fs.existsSync(fullPath)) {
    return (
        <div className="error-container">
            <h1>글을 찾을 수 없습니다.</h1>
            <Link href="/blog" className="back-button">목록으로 돌아가기</Link>
        </div>
    )
  }

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

          {/* 🌟 AdSense 상단 (본문 시작 전) 🌟 */}
          <div className="ad-unit-in-post">
             <p className="ad-placeholder">-- 광고 영역 (AdSense 본문 상단) --</p>
          </div>

          {/* 본문 */}
          <div 
            className="post-content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* 🌟 AdSense 하단 (본문 끝난 후) 🌟 */}
          <div className="ad-unit-in-post">
             <p className="ad-placeholder">-- 광고 영역 (AdSense 본문 하단) --</p>
          </div>

          {/* 하단 버튼 */}
          <footer className="post-footer">
            <Link href="/" className="back-button">← 홈으로 돌아가기</Link>
          </footer>
        </article>
      </div>

      <style jsx global>{`
        :root {
          --post-bg: #ffffff;
          --post-text: #1a1a1a;
          --post-muted: #666666;
          --post-border: #e5e7eb;
          --post-code-bg: #f6f8fa;
          --post-link: #0066cc;
          --post-link-hover: #0052a3;
        }

        .post-page {
          min-height: 100vh;
          background: #f9f9f9;
          padding: 40px 20px;
        }

        .post-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .post-article {
          background: var(--post-bg);
          padding: 60px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .error-container {
            text-align: center;
            padding: 100px 20px;
        }

        /* 헤더 */
        .post-header {
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 2px solid var(--post-border);
        }

        .post-title {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 20px 0;
          color: var(--post-text);
        }

        .post-meta {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .post-date {
          font-size: 0.95rem;
          color: var(--post-muted);
        }

        .post-description {
          font-size: 1.1rem;
          color: var(--post-muted);
          margin: 10px 0 0 0;
        }

        /* 광고 영역 */
        .ad-unit-in-post {
            margin: 40px 0;
            padding: 20px;
            background: #f1f1f1;
            border-radius: 8px;
            text-align: center;
            color: #888;
            border: 1px dashed #ccc;
        }

        /* 본문 스타일링 */
        .post-content {
          font-size: 1.1rem;
          line-height: 1.8;
          color: var(--post-text);
        }

        .post-content h1 { font-size: 2rem; margin: 50px 0 20px 0; }
        .post-content h2 { 
            font-size: 1.6rem; 
            margin: 40px 0 16px 0; 
            padding-bottom: 8px; 
            border-bottom: 1px solid var(--post-border); 
        }
        .post-content h3 { font-size: 1.3rem; margin: 32px 0 12px 0; }
        .post-content p { margin: 16px 0; }
        .post-content ul, .post-content ol { margin: 20px 0; padding-left: 30px; }
        .post-content li { margin: 8px 0; }
        .post-content a { color: var(--post-link); text-decoration: none; border-bottom: 1px solid var(--post-link); }
        .post-content blockquote {
          margin: 24px 0;
          padding: 16px 20px;
          border-left: 4px solid #0066cc;
          background: #f6f8fa;
          border-radius: 4px;
        }
        .post-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 24px 0;
        }
        .post-content pre {
            background: #2d2d2d;
            color: #ccc;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
        }

        /* 푸터 */
        .post-footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid var(--post-border);
        }

        .back-button {
          display: inline-block;
          padding: 12px 24px;
          background: #0066cc;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .back-button:hover {
          background: #0052a3;
        }

        @media (max-width: 768px) {
          .post-page { padding: 20px 10px; }
          .post-article { padding: 30px 20px; }
          .post-title { font-size: 1.8rem; }
        }
      `}</style>
    </main>
  );
}