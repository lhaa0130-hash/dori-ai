import { sql } from "@vercel/postgres";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 본문 정제 함수: 메타데이터와 AI 말투 제거
function cleanContent(content: string): string {
  if (!content) return '';
  
  let cleaned = content;
  
  // 1. HTML 태그 제거 (마크다운만 남기기)
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // 2. Front-matter 블록 제거 (---로 둘러싸인 모든 메타데이터)
  // 여러 패턴으로 시도하여 확실히 제거
  const frontMatterPatterns = [
    /^---\s*\n[\s\S]*?\n---\s*\n?/m,  // 표준 front-matter
    /^---\s*[\s\S]*?---\s*\n?/m,      // 공백 없는 front-matter
    /^---\s*[\s\S]*?---\s*/m,         // 줄바꿈 없는 front-matter
  ];
  
  frontMatterPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // 3. 개별 메타데이터 라인 제거 (front-matter 밖에 있는 경우)
  const metaPatterns = [
    /^title:\s*.*$/gmi,
    /^category:\s*.*$/gmi,
    /^date:\s*.*$/gmi,
    /^tags:\s*.*$/gmi,
    /^author:\s*.*$/gmi,
    /^description:\s*.*$/gmi,
    /^thumbnail:\s*.*$/gmi,
    /^#+\s*title:.*?\n/gmi,
  ];
  
  metaPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // 4. AI 인트로 문구 제거
  const aiPatterns = [
    /^물론입니다\.\s*/i,
    /^물론입니다,\s*/i,
    /^AI 전문 블로그.*?\n/i,
    /^포스팅을 작성하겠습니다\.\s*/i,
    /^다음과 같은 포스팅을 작성하겠습니다\.\s*/i,
    /^안녕하세요\.\s*AI 전문 블로그/i,
    /^네,.*?작성해드리겠습니다\.\s*/i,
    /^좋은 질문입니다\.\s*/i,
    /^파헤칩니다\.\s*단순해 보이는.*?\n/i,
    /^.*?파헤칩니다\.\s*단순해 보이는.*?\n/i,
    /^.*?단순해 보이는.*?파헤칩니다\.\s*/i,
    /^이번 글에서는.*?\n/i,
    /^오늘은.*?에 대해.*?\n/i,
    /^이번 포스팅에서는.*?\n/i,
  ];
  
  aiPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // 5. "## 핵심 요약" 이전의 모든 내용 제거
  const summaryIndex = cleaned.search(/##\s*핵심 요약/i);
  if (summaryIndex > 0) {
    cleaned = cleaned.substring(summaryIndex);
  }
  
  // 6. 불필요한 공백 정리
  cleaned = cleaned.trim().replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
}

// 섹션 추출 함수: 핵심 요약, 에디터 인사이트, 핵심 용어 추출
function extractSections(content: string): {
  summary: string;
  editorInsight: string;
  keyTerms: string;
  mainContent: string;
} {
  const summaryMatch = content.match(/##\s*핵심 요약\s*\n([\s\S]*?)(?=\n---|\n##|💡|🔍|$)/i);
  const editorMatch = content.match(/💡\s*에디터 인사이트\s*\n([\s\S]*?)(?=\n🔍|\n##|$)/i);
  const termsMatch = content.match(/🔍\s*핵심 용어\s*\n([\s\S]*?)(?=\n💡|\n##|$)/i);
  
  let mainContent = content;
  
  // 섹션 제거하여 본문만 남기기
  if (summaryMatch) {
    mainContent = mainContent.replace(summaryMatch[0], '');
  }
  if (editorMatch) {
    mainContent = mainContent.replace(editorMatch[0], '');
  }
  if (termsMatch) {
    mainContent = mainContent.replace(termsMatch[0], '');
  }
  
  return {
    summary: summaryMatch ? summaryMatch[1].trim() : '',
    editorInsight: editorMatch ? editorMatch[1].trim() : '',
    keyTerms: termsMatch ? termsMatch[1].trim() : '',
    mainContent: mainContent.trim(),
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Next.js 15+에서는 params가 Promise일 수 있음
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.id;

    if (!postId) {
      notFound();
    }

    // id를 텍스트로 변환하여 비교 (UUID 또는 INTEGER 모두 처리)
    const { rows } = await sql`
      SELECT * FROM posts 
      WHERE id::text = ${postId}
      LIMIT 1
    `;
    
    const post = rows[0];

    if (!post) {
      notFound();
    }

    // 카테고리 정규화
    let category = post.category || '기타';
    if (category.toLowerCase() === 'trend') {
      category = '트렌드';
    }

    // 본문 정제
    const cleanedContent = cleanContent(post.content || '');
    const sections = extractSections(cleanedContent);

    return (
      <article className="min-h-screen bg-white dark:bg-black py-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 뒤로가기 링크 */}
          <Link 
            href="/insight" 
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 mb-8 inline-block transition-colors"
          >
            ← 목록으로 돌아가기
          </Link>

          {/* 상단: 카테고리 배지, 날짜, 제목 */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <span 
                className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: category === '트렌드' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  color: category === '트렌드' ? '#3b82f6' : '#8b5cf6',
                }}
              >
                {category}
              </span>
              <span className="text-sm text-zinc-400 dark:text-zinc-500">
                {new Date(post.created_at).toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black leading-tight text-zinc-900 dark:text-white mb-8">
              {post.title}
            </h1>
          </header>

          {/* 썸네일 이미지 */}
          {post.body_image_url && (
            <div className="rounded-2xl overflow-hidden mb-12 shadow-2xl">
              <img 
                src={post.body_image_url} 
                alt={post.title} 
                className="w-full h-auto object-cover" 
              />
            </div>
          )}

          {/* 핵심 요약 섹션 - 어두운 박스 형태 (zinc-900 배경) */}
          {sections.summary && (
            <div className="mb-12 p-8 rounded-2xl border bg-zinc-900 dark:bg-zinc-900 border-zinc-800 dark:border-zinc-700">
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                <span className="text-3xl">📋</span>
                핵심 요약
              </h2>
              <div className="prose prose-lg prose-invert prose-zinc max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: (props) => <p className="text-lg leading-relaxed text-zinc-300 mb-4" {...props} />,
                    strong: (props) => <strong className="font-bold text-white" {...props} />,
                    ul: (props) => <ul className="list-disc list-outside ml-6 space-y-2 text-zinc-300 mb-4" {...props} />,
                    ol: (props) => <ol className="list-decimal list-outside ml-6 space-y-2 text-zinc-300 mb-4" {...props} />,
                    li: (props) => <li className="pl-2 leading-relaxed" {...props} />,
                    h2: (props) => <h2 className="text-2xl font-bold text-white mt-6 mb-4" {...props} />,
                    h3: (props) => <h3 className="text-xl font-bold text-white mt-4 mb-3" {...props} />,
                  }}
                >
                  {sections.summary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* 본문 영역 - K-AI GPT 스타일 리포트 레이아웃 */}
          <div className="prose prose-lg prose-invert prose-zinc max-w-none mb-12">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // 제목 - 더 크고 굵게, 줄 간격 넓게
                h1: (props) => (
                  <h1 className="mt-12 mb-8 text-4xl font-black leading-tight text-zinc-900 dark:text-zinc-100" {...props} />
                ),
                h2: (props) => (
                  <h2 className="mt-12 mb-6 text-3xl font-bold leading-relaxed border-b-2 border-zinc-200 dark:border-zinc-800 pb-3 text-zinc-900 dark:text-zinc-100" {...props} />
                ),
                h3: (props) => (
                  <h3 className="mt-10 mb-5 text-2xl font-bold leading-relaxed text-zinc-900 dark:text-zinc-100" {...props} />
                ),
                h4: (props) => (
                  <h4 className="mt-8 mb-4 text-xl font-bold leading-relaxed text-zinc-900 dark:text-zinc-100" {...props} />
                ),
                
                // 본문 - 줄 간격 넓게 (leading-relaxed)
                p: (props) => (
                  <p className="mb-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400" {...props} />
                ),
                
                // 강조 - 눈에 띄게
                strong: (props) => (
                  <strong className="font-bold text-zinc-900 dark:text-zinc-200 text-lg" {...props} />
                ),
                em: (props) => (
                  <em className="italic text-zinc-600 dark:text-zinc-400" {...props} />
                ),
                
                // 리스트 - 불렛포인트 확실히 보이게
                ul: (props) => (
                  <ul className="mb-6 space-y-3 list-disc list-outside ml-6 text-zinc-600 dark:text-zinc-400 leading-relaxed" {...props} />
                ),
                ol: (props) => (
                  <ol className="mb-6 space-y-3 list-decimal list-outside ml-6 text-zinc-600 dark:text-zinc-400 leading-relaxed" {...props} />
                ),
                li: (props) => (
                  <li className="pl-2 leading-relaxed" {...props} />
                ),
                
                // 이미지 - 가로 100%, 라운드 처리
                img: (props) => (
                  <figure className="my-8">
                    <img 
                      className="w-full rounded-2xl shadow-xl" 
                      alt={props.alt || ''}
                      {...props} 
                    />
                    {props.alt && (
                      <figcaption className="mt-3 text-sm text-center text-zinc-500 dark:text-zinc-500 italic">
                        {props.alt}
                      </figcaption>
                    )}
                  </figure>
                ),
                
                // 링크
                a: (props) => (
                  <a 
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium" 
                    {...props} 
                  />
                ),
                
                // 구분선 - border-zinc-800으로 부드럽게
                hr: (props) => (
                  <hr className="my-12 border-zinc-800 dark:border-zinc-800" {...props} />
                ),
                
                // 코드
                code: (props) => (
                  <code 
                    className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-sm font-mono text-zinc-900 dark:text-zinc-200" 
                    {...props} 
                  />
                ),
                pre: (props) => (
                  <pre className="p-4 rounded-lg overflow-x-auto mb-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" {...props} />
                ),
                
                // 인용
                blockquote: (props) => (
                  <blockquote 
                    className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic my-6 text-zinc-700 dark:text-zinc-300 leading-relaxed" 
                    {...props} 
                  />
                ),
              }}
            >
              {sections.mainContent}
            </ReactMarkdown>
          </div>

          {/* 에디터 인사이트 섹션 - 은은한 테두리와 배경색 */}
          {sections.editorInsight && (
            <div className="mb-8 p-6 rounded-2xl border bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">💡</span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  에디터 인사이트
                </h3>
              </div>
              <div className="prose prose-lg prose-invert prose-zinc max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: (props) => <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400 mb-3" {...props} />,
                    strong: (props) => <strong className="font-bold text-zinc-900 dark:text-zinc-200" {...props} />,
                    ul: (props) => <ul className="list-disc list-outside ml-6 space-y-2 text-zinc-600 dark:text-zinc-400 leading-relaxed" {...props} />,
                    li: (props) => <li className="pl-2 leading-relaxed" {...props} />,
                  }}
                >
                  {sections.editorInsight}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* 핵심 용어 섹션 - 은은한 테두리와 배경색 */}
          {sections.keyTerms && (
            <div className="mb-8 p-6 rounded-2xl border bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🔍</span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  핵심 용어
                </h3>
              </div>
              <div className="prose prose-lg prose-invert prose-zinc max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: (props) => <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400 mb-3" {...props} />,
                    strong: (props) => <strong className="font-bold text-zinc-900 dark:text-zinc-200" {...props} />,
                    ul: (props) => <ul className="list-disc list-outside ml-6 space-y-2 text-zinc-600 dark:text-zinc-400 leading-relaxed" {...props} />,
                    li: (props) => <li className="pl-2 leading-relaxed" {...props} />,
                  }}
                >
                  {sections.keyTerms}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* 하단 여백 */}
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <Link 
              href="/insight"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              ← 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </article>
    );
  } catch (error) {
    console.error('Error loading post:', error);
    notFound();
  }
}
