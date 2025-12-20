import { getGuideBySlug, getGuideSlugs } from '@/lib/guides';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown'; 

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = getGuideSlugs();
  return posts.map((post) => ({
    slug: post.replace(/\.md$/, ''),
  }));
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = getGuideBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main
      className="w-full min-h-screen pt-32 pb-20 transition-colors duration-300"
      style={{
        backgroundColor: "var(--bg-main)",
        color: "var(--text-main)",
      }}
    >
      <article className="max-w-[800px] mx-auto px-6">
        
        {/* 헤더 영역 */}
        <div className="mb-12 animate-fade-in-up">
           <a href="/insight" className="inline-block mb-8 font-medium transition-colors text-gray-500 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400">
             ← 목록으로 돌아가기
           </a>
           
           <div className="flex flex-wrap items-center gap-2 mb-6">
             {post.tags && post.tags.length > 0 && post.tags.map(tag => (
               <span key={tag} className="px-3 py-1 text-sm font-bold rounded-full bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-300">
                 {tag}
               </span>
             ))}
             <span className={`text-sm text-gray-400 dark:text-gray-300 ${post.tags && post.tags.length > 0 ? 'pl-3 ml-1 border-l border-gray-300 dark:border-gray-600' : ''}`}>
               {post.date}
             </span>
           </div>
           
           <h1 className="mb-4 text-4xl font-extrabold leading-tight break-keep md:text-5xl text-gray-900 dark:text-white">
             {post.title}
           </h1>
           
           <p className="text-xl font-medium leading-relaxed break-keep text-gray-600 dark:text-gray-200">
             {post.subtitle}
           </p>
        </div>

        {/* 📝 본문 영역 */}
        <div className="animate-fade-in-up delay-100">
           <ReactMarkdown
             components={{
               // 제목
               h1: (props) => <h1 className="mt-12 mb-6 text-3xl font-bold text-gray-900 dark:text-white" {...props} />,
               h2: (props) => <h2 className="mt-10 mb-5 pb-2 text-2xl font-bold border-b border-gray-200 text-gray-900 dark:border-gray-600 dark:text-white" {...props} />,
               h3: (props) => <h3 className="mt-8 mb-4 text-xl font-bold text-gray-900 dark:text-gray-100" {...props} />,
               
               // 본문
               p: (props) => <p className="mb-6 text-lg leading-8 text-gray-800 dark:text-gray-100" {...props} />,
               
               // 강조
               strong: (props) => <strong className="font-bold px-1 rounded bg-yellow-100 text-gray-900 dark:bg-yellow-900/40 dark:text-yellow-200" {...props} />,
               
               // 리스트
               ul: (props) => <ul className="mb-6 pl-6 space-y-2 list-disc text-gray-800 dark:text-gray-100" {...props} />,
               ol: (props) => <ol className="mb-6 pl-6 space-y-2 list-decimal text-gray-800 dark:text-gray-100" {...props} />,
               li: (props) => <li className="pl-1 dark:text-gray-100" {...props} />,
               
               // 인용문
               blockquote: (props) => (
                 <blockquote className="my-8 py-2 pl-6 border-l-4 rounded-r-lg italic border-blue-500 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:border-blue-400 dark:text-gray-100" {...props} />
               ),
               
               // 링크
               a: (props) => <a className="text-blue-600 underline hover:no-underline dark:text-blue-300" {...props} />,

               // 코드
               code: ({className, children, ...props}: any) => {
                 const match = /language-(\w+)/.exec(className || '');
                 const isInline = !match && !String(children).includes('\n');
                 return isInline ? (
                   <code className="px-1.5 py-0.5 rounded font-mono text-sm bg-gray-100 text-red-600 dark:bg-gray-800 dark:text-red-300" {...props}>{children}</code>
                 ) : (
                   <div className="my-6 p-6 overflow-x-auto rounded-xl shadow-lg border border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-[#1e1e1e] dark:text-gray-100">
                     <code className="font-mono text-sm leading-relaxed" {...props}>{children}</code>
                   </div>
                 );
               },
               
               // 이미지
               img: (props) => (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img className="max-w-full h-auto rounded-xl my-8 shadow-md" alt={props.alt as string || ''} {...props} />
               ),
               
               // 구분선
               hr: (props) => <hr className="my-10 border-gray-200 dark:border-gray-600" {...props} />
             }}
           >
             {post.content}
           </ReactMarkdown>
        </div>

        {/* 하단 작성자 프로필 */}
        <div className="flex items-center gap-4 mt-20 pt-10 border-t border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-200">
           <div className="flex items-center justify-center text-3xl rounded-full w-14 h-14 bg-gray-100 dark:bg-gray-800">
             ✍️
           </div>
           <div>
             <p className="text-lg font-bold text-gray-900 dark:text-white">{post.author}</p>
             <p className="text-sm text-gray-500 dark:text-gray-300">AI Canvas 에디터</p>
           </div>
        </div>

      </article>
    </main>
  );
}