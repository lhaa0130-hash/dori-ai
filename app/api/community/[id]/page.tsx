import fs from 'fs';
import path from 'path';
import './post.css';

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CommunityPostPage({ params }: PostPageProps) {
  const { id } = await params;
  
  const COMMUNITY_FILE = path.join(process.cwd(), 'data', 'community.json');
  const data = fs.readFileSync(COMMUNITY_FILE, 'utf8');
  const posts = JSON.parse(data);
  const post = posts.find((p: any) => p.id === id);

  if (!post) {
    return (
      <main className="post-page">
        <div className="post-container">
          <p>글을 찾을 수 없습니다.</p>
          <a href="/community" className="back-link">← 목록으로</a>
        </div>
      </main>
    );
  }

  return (
    <main className="post-page">
      <div className="post-container">
        <a href="/community" className="back-link">← 목록으로</a>
        
        <article className="post-article">
          <header className="post-header">
            <h1 className="post-title">{post.title}</h1>
            <div className="post-meta">
              <span className="post-author">{post.author}</span>
              <span className="post-date">
                {new Date(post.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </header>

          <div className="post-content">
            {post.content.split('\n').map((line: string, i: number) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}