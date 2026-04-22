"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { PlusCircle, Users, Eye, Heart, MessageCircle, TrendingUp, Clock } from 'lucide-react';

// Post interface
interface Post {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  commentsList?: any[];
  createdAt: string;
  date?: string;
  views?: number;
  sparks?: number;
}

interface CommunityClientProps {
  initialPosts?: Post[];
}

export default function CommunityClient({ initialPosts = [] }: CommunityClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'trending' | 'latest'>('trending');

  useEffect(() => {
    setMounted(true);
    const CURRENT_SEED_VERSION = "v2-2026-04-22";
    try {
      const savedVersion = localStorage.getItem('dori_community_version');
      const savedPosts = localStorage.getItem('dori_community_posts');
      if (savedPosts && savedVersion === CURRENT_SEED_VERSION) {
        const parsed: Post[] = JSON.parse(savedPosts);
        if (parsed.length > 0) {
          setPosts(parsed);
          return;
        }
      }
      fetch('/api/seed-community')
        .then((r) => r.json())
        .then((data) => {
          if (data.posts && Array.isArray(data.posts)) {
            localStorage.setItem('dori_community_posts', JSON.stringify(data.posts));
            localStorage.setItem('dori_community_version', CURRENT_SEED_VERSION);
            setPosts(data.posts);
          }
        })
        .catch((e) => console.error('Failed to seed community posts', e));
    } catch (e) {
      console.error("Failed to load community posts from localStorage", e);
    }
  }, []);

  // 탭에 따라 정렬
  const sortedPosts = [...posts].sort((a, b) =>
    activeTab === 'trending'
      ? (b.likes + (b.views || 0)) - (a.likes + (a.views || 0))
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 상단 피처드 카드: 1등
  const featuredPost = sortedPosts[0];
  // 2~3등: 작은 카드 2개
  const secondaryPosts = sortedPosts.slice(1, 3);
  // 나머지: 리스트
  const listPosts = sortedPosts.slice(3);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const tagColors: Record<string, string> = {
    '커리어': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'AI시대': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'ChatGPT': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    '꿀팁': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    '무료': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    '자동화': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    '공지': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    '이벤트': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  };
  const getTagClass = (tag: string) =>
    tagColors[tag] || 'bg-neutral-100 text-neutral-600 dark:bg-zinc-800 dark:text-neutral-400';

  return (
    <main className="flex flex-col w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="flex-grow z-10">
        {/* 히어로 섹션 */}
        <section className="relative pt-32 pb-10 px-6 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
              <Users className="w-3 h-3" />
              <span>Community Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                커뮤니티
              </span>
            </h1>
            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
              자유롭게 소통하고 정보를 공유하는 공간입니다.
            </p>
          </div>
        </section>

        <section className="container max-w-5xl mx-auto px-6 pb-20">
          {/* 상단 컨트롤: 탭 + 글쓰기 버튼 */}
          <div className="flex items-center justify-between mb-8">
            {/* 탭 */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-zinc-900 rounded-full">
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === 'trending'
                    ? 'bg-[#F9954E] text-white shadow-md shadow-[#F9954E]/30'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                인기
              </button>
              <button
                onClick={() => setActiveTab('latest')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === 'latest'
                    ? 'bg-[#F9954E] text-white shadow-md shadow-[#F9954E]/30'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                최신
              </button>
            </div>
            <Link
              href="/community/write"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F9954E] hover:bg-[#E8832E] text-white rounded-full font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#F9954E]/20 hover:shadow-[#F9954E]/40 active:scale-95"
            >
              <PlusCircle size={16} />
              <span>새 글 작성</span>
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-[2rem] bg-neutral-50/50 dark:bg-zinc-900/20">
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">아직 게시물이 없습니다.</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">첫 번째 글을 작성해보세요!</p>
            </div>
          ) : (
            <>
              {/* ── 피처드 카드 (1위) ── */}
              {featuredPost && (
                <div className="group relative w-full rounded-[2rem] overflow-hidden border border-[#F9954E]/30 bg-gradient-to-br from-[#FFF5EB] to-white dark:from-[#1a0d00] dark:to-black shadow-xl shadow-[#F9954E]/10 hover:shadow-[#F9954E]/20 transition-all duration-300 mb-6 cursor-pointer">
                  {/* HOT 배지 */}
                  <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 px-3 py-1 bg-[#F9954E] rounded-full text-white text-xs font-black shadow-lg">
                    🔥 HOT
                  </div>
                  <div className="p-8 pt-14">
                    {/* 태그 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredPost.tags.map(tag => (
                        <span key={tag} className={`text-xs px-3 py-1 rounded-full font-semibold ${getTagClass(tag)}`}>#{tag}</span>
                      ))}
                    </div>
                    {/* 제목 */}
                    <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white mb-3 leading-tight group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">
                      {featuredPost.title}
                    </h2>
                    {/* 본문 미리보기 */}
                    <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed mb-6">
                      {featuredPost.content.replace(/<[^>]*>?/gm, '')}
                    </p>
                    {/* 하단 메타 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#FFF5EB] dark:bg-zinc-800 border border-[#F9954E]/20 flex items-center justify-center text-base">
                          {featuredPost.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">{featuredPost.author}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(featuredPost.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{featuredPost.views?.toLocaleString() || 0}</span>
                        <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-400" />{featuredPost.likes}</span>
                        <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" />{featuredPost.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 2~3위 카드 그리드 ── */}
              {secondaryPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {secondaryPosts.map((post, idx) => (
                    <div key={post.id} className="group relative rounded-[1.5rem] overflow-hidden border border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl hover:border-[#F9954E]/40 dark:hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-300 cursor-pointer p-6">
                      {/* 순위 뱃지 */}
                      <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-neutral-500 dark:text-neutral-400">
                        {idx + 2}
                      </div>
                      {/* 태그 */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getTagClass(tag)}`}>#{tag}</span>
                        ))}
                      </div>
                      {/* 제목 */}
                      <h3 className="text-base font-black text-neutral-900 dark:text-white mb-2 leading-snug group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {/* 본문 미리보기 */}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                        {post.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                      {/* 메타 */}
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{post.avatar}</span>
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-400">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{post.likes}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 나머지 리스트 ── */}
              {listPosts.length > 0 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">전체 게시물</span>
                    <div className="flex-1 h-px bg-neutral-100 dark:bg-zinc-800" />
                  </div>
                  <div className="space-y-3">
                    {listPosts.map((post, idx) => (
                      <div key={post.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/30 border border-neutral-100 dark:border-zinc-800/60 hover:border-[#F9954E]/30 hover:bg-[#FFF5EB]/40 dark:hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer">
                        {/* 번호 */}
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-neutral-400">
                          {idx + 4}
                        </span>
                        {/* 아바타 */}
                        <span className="flex-shrink-0 text-xl">{post.avatar}</span>
                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-[#E8832E] transition-colors">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-neutral-400">{post.author}</span>
                            <span className="text-neutral-200 dark:text-zinc-700">·</span>
                            <span className="text-xs text-neutral-400">{formatDate(post.createdAt)}</span>
                            {post.tags.slice(0, 1).map(tag => (
                              <span key={tag} className={`text-xs px-2 py-0.5 rounded-md font-medium ${getTagClass(tag)}`}>#{tag}</span>
                            ))}
                          </div>
                        </div>
                        {/* 통계 */}
                        <div className="flex-shrink-0 flex items-center gap-3 text-xs text-neutral-400">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{post.likes}</span>
                          <span className="flex items-center gap-1 hidden sm:flex"><Eye className="w-3 h-3" />{post.views || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
