"use client";

import Link from "next/link";

export default function InsightDetail({ postData }: { postData: any }) {
  return (
    <div className="page-wrapper">
      <div className="scroll-spacer" />

      <article className="article-container">
        {/* 네비게이션 */}
        <Link href="/insight" className="back-btn">← 목록으로 돌아가기</Link>

        <div className="article-content">
          <div className="article-header">
            <span className="article-cat">{postData.category}</span>
            <h1 className="article-title">{postData.title}</h1>
            <div className="article-meta">
              <span>{postData.date}</span>
              <span className="sep">·</span>
              <span>By DoriMaster</span>
            </div>
          </div>
          
          {/* 썸네일 이미지 표시 (있을 경우에만) */}
          {postData.thumbnail && (
            <div className="article-thumb">
              <img src={postData.thumbnail} alt="Thumbnail" />
            </div>
          )}

          {/* 마크다운 본문 */}
          <div 
            className="article-body" 
            dangerouslySetInnerHTML={{ __html: postData.contentHtml }} 
          />
        </div>
      </article>

      <style jsx>{`
        .page-wrapper { width: 100%; }
        .article-container { max-width: 800px; margin: 0 auto; padding: 60px 24px 100px; }
        
        .back-btn { text-decoration: none; color: #666; font-size: 14px; cursor: pointer; margin-bottom: 40px; display: inline-block; transition: 0.2s; }
        .back-btn:hover { color: #007AFF; transform: translateX(-4px); }

        .article-header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 40px; }
        .article-cat { font-size: 13px; font-weight: 700; color: #007AFF; background: #f0f7ff; padding: 6px 12px; border-radius: 20px; display: inline-block; margin-bottom: 16px; }
        .article-title { font-size: 42px; font-weight: 800; line-height: 1.3; color: #111; margin-bottom: 20px; word-break: keep-all; }
        .article-meta { color: #888; font-size: 14px; }
        .article-meta .sep { margin: 0 8px; }

        .article-thumb { margin-bottom: 60px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .article-thumb img { width: 100%; height: auto; display: block; }

        /* 마크다운 스타일링 */
        .article-body { font-size: 17px; line-height: 1.8; color: #333; }
        /* global 대신 className 하위 선택자로 적용하여 전역 오염 방지 */
        .article-body :global(h1) { font-size: 32px; margin: 60px 0 24px; font-weight: 800; color: #111; }
        .article-body :global(h2) { font-size: 26px; margin: 50px 0 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; font-weight: 700; color: #111; }
        .article-body :global(h3) { font-size: 22px; margin: 30px 0 15px; font-weight: 700; color: #333; }
        .article-body :global(p) { margin-bottom: 24px; word-break: keep-all; }
        .article-body :global(ul), .article-body :global(ol) { margin-bottom: 30px; padding-left: 24px; }
        .article-body :global(li) { margin-bottom: 8px; }
        .article-body :global(strong) { color: #111; font-weight: 700; }
        .article-body :global(blockquote) { background: #f8f9fa; border-left: 4px solid #007AFF; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #555; }
        .article-body :global(img) { max-width: 100%; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .article-body :global(hr) { border: 0; height: 1px; background: #eee; margin: 40px 0; }
        .article-body :global(code) { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: monospace; }

        @media (max-width: 768px) {
          .article-title { font-size: 32px; }
          .article-body { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}