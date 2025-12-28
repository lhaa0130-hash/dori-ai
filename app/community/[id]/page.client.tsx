"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CommunityPost } from "@/components/community/CommunityCard";

export default function CommunityPostDetail() {
  const { theme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const postId = parseInt(params.id as string);
    if (isNaN(postId)) {
      router.push('/community');
      return;
    }

    // localStorage에서 글 가져오기
    if (typeof window !== 'undefined') {
      const savedPosts = localStorage.getItem("dori_community_posts");
      if (savedPosts) {
        const posts: CommunityPost[] = JSON.parse(savedPosts);
        const foundPost = posts.find(p => p.id === postId);
        if (foundPost) {
          setPost(foundPost);
        } else {
          router.push('/community');
        }
      } else {
        router.push('/community');
      }
      setLoading(false);
    }
  }, [mounted, params.id, router]);

  const isDark = mounted && theme === 'dark';

  if (!mounted || loading) {
    return (
      <main 
        className="w-full min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        <div 
          className="text-sm"
          style={{
            color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          }}
        >
          로딩 중...
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main 
        className="w-full min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        <div className="text-center">
          <p 
            className="text-lg mb-4"
            style={{
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            }}
          >
            글을 찾을 수 없습니다
          </p>
          <Link 
            href="/community"
            className="text-sm underline"
            style={{
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            커뮤니티로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 배경 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {mounted && theme === "dark" && (
          <>
            <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
            <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}
        {mounted && theme === "light" && (
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), #ffffff',
            }}
          />
        )}
      </div>

      {/* 콘텐츠 */}
      <section className="relative pt-20 pb-24 px-6 lg:pl-12">
        <div className="max-w-4xl mx-auto">
          {/* 뒤로가기 */}
          <div className="mb-8">
            <Link 
              href="/community"
              className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                textDecoration: 'none',
              }}
            >
              ← 커뮤니티로 돌아가기
            </Link>
          </div>

          {/* 글 상세 */}
          <article 
            className="p-8 rounded-2xl border"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b"
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span 
                    className="px-3 py-1 text-xs font-medium rounded-md"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: isDark ? '#ffffff' : '#000000',
                    }}
                  >
                    {post.tag}
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    {post.nickname || "익명"}
                  </span>
                  <span 
                    className="text-xs"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {new Date(post.createdAt).toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <h1 
                  className="text-2xl md:text-3xl font-bold"
                  style={{
                    color: isDark ? '#ffffff' : '#000000',
                  }}
                >
                  {post.title}
                </h1>
              </div>
            </div>

            {/* 본문 */}
            <div 
              className="prose prose-sm dark:prose-invert max-w-none mb-6"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* 푸터 */}
            <div 
              className="flex items-center justify-between pt-6 border-t"
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="flex items-center gap-4">
                <button 
                  className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  }}
                >
                  ❤️ {post.likes}
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

