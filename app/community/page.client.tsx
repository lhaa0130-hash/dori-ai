"use client";

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { PlusCircle, Send, X } from 'lucide-react';

// Post-interface. I a todolist kan have en mere detaljeret beskrivelse.
interface Post {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

interface CommunityClientProps {
  initialPosts?: Post[];
}

export default function CommunityClient({ initialPosts = [] }: CommunityClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load posts from localStorage if available
    try {
      const savedPosts = localStorage.getItem('dori_community_posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
    } catch (e) {
      console.error("Failed to load community posts from localStorage", e);
    }
  }, []);

  const handleNewPost = (newPost: { title: string, content: string, tags: string[] }) => {
    const post: Post = {
      id: new Date().toISOString(),
      author: 'Current User', // Placeholder
      avatar: `https://i.pravatar.cc/40?u=${new Date().toISOString()}`, // Placeholder
      title: newPost.title,
      content: newPost.content,
      tags: newPost.tags,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    };
    const updatedPosts = [post, ...posts];
    setPosts(updatedPosts);
    try {
      localStorage.setItem('dori_community_posts', JSON.stringify(updatedPosts));
    } catch (e) {
      console.error("Failed to save community posts to localStorage", e);
    }
    setIsModalOpen(false);
  };

  const isDark = mounted && theme === 'dark';

  return (
    <main className="flex flex-col w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">

      {/* 배경 그라데이션 (Standard) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:from-orange-900/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="flex-grow z-10">
        {/* 히어로 섹션 (Standard) */}
        <section className="relative pt-32 pb-16 px-6 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span>Community</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                커뮤니티
              </span>
            </h1>
            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
              자유롭게 소통하고 정보를 공유하는 공간입니다.
            </p>
          </div>
        </section>

        <section className="container max-w-5xl mx-auto px-6 pb-20">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-sm tracking-wide hover:opacity-80 transition-all shadow-lg hover:shadow-orange-500/20"
            >
              <PlusCircle size={18} />
              <span>새 글 작성</span>
            </button>
          </div>

          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post.id} className="p-6 rounded-[2rem] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-neutral-200 dark:border-zinc-800 transition-all duration-300 hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full border border-neutral-100 dark:border-zinc-700" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">{post.author}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-3 text-neutral-900 dark:text-white">{post.title}</h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mb-4 leading-relaxed">{post.content}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-neutral-100 dark:border-white/5">
                    <div className="flex gap-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 font-medium">#{tag}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">❤️ {post.likes}</span>
                      <span className="flex items-center gap-1">💬 {post.comments}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-[2rem] bg-neutral-50/50 dark:bg-zinc-900/20">
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">아직 게시물이 없습니다.</p>
                <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">첫 번째 글을 작성해보세요!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {isModalOpen && (
        <PostModal onClose={() => setIsModalOpen(false)} onSubmit={handleNewPost} isDark={isDark} />
      )}
    </main>
  );
}

// Modal Component (Standardized)
function PostModal({ onClose, onSubmit, isDark }: { onClose: () => void; onSubmit: (post: any) => void, isDark: boolean }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title, content, tags: tags.split(',').map(t => t.trim()).filter(Boolean) });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-2xl bg-white dark:bg-black border border-neutral-200 dark:border-zinc-800 shadow-2xl animate-pop-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">새 글 작성</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
          />
          <textarea
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full p-4 rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors resize-none"
          />
          <input
            type="text"
            placeholder="태그 (쉼표로 구분)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-4 rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
          />
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              <Send size={18} />
              <span>게시하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
