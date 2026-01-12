import { sql } from "@vercel/postgres";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const { rows } = await sql`SELECT * FROM posts WHERE id = ${params.id}`;
  const post = rows[0];

  if (!post) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-white dark:bg-black py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-gray-500 hover:text-black dark:hover:text-white mb-8 inline-block">
          ← 목록으로 돌아가기
        </Link>
        <div className="mb-10">
          <span className="text-blue-600 font-bold uppercase tracking-wider text-xs">
            {post.category || "AI NEWS"}
          </span>
          <h1 className="text-4xl md:text-5xl font-black mt-4 leading-tight dark:text-white">
            {post.title}
          </h1>
          <p className="text-gray-400 mt-4 text-sm">
            작성일: {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
        {post.body_image_url && (
          <div className="rounded-2xl overflow-hidden mb-12 shadow-2xl">
            <img src={post.body_image_url} alt={post.title} className="w-full h-auto object-cover" />
          </div>
        )}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
            {post.content}
          </p>
        </div>
      </div>
    </article>
  );
}

