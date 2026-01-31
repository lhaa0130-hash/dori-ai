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
    <div className="flex w-full">
      {/* 
        USER-FACING NOTE: 
        The user mentioned a left sidebar. After inspecting app/layout.tsx, Header.tsx, and globals.css,
        I cannot find a persistent left sidebar component. The main navigation is in the header.
        This space is reserved for where a sidebar would go if I can find an example of it.
        For now, the main content will take the full width.
      */}
      <div className="flex-grow">
        <section className="relative z-10" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}>
              커뮤니티
            </h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <PlusCircle size={20} />
              <span>새 글 작성</span>
            </button>
          </div>

          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post.id} className="p-4 rounded-xl border" style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7',
                }}>
                  <div className="flex items-center gap-3 mb-2">
                    <img src={post.avatar} alt={post.author} className="w-8 h-8 rounded-full" />
                    <span className="font-semibold text-sm">{post.author}</span>
                    <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <h2 className="text-lg font-bold mb-2">{post.title}</h2>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">{post.content}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        }}>#{tag}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>좋아요 {post.likes}</span>
                      <span>댓글 {post.comments}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border border-dashed rounded-xl" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}>
                <p className="text-gray-500">아직 게시물이 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">첫 번째 글을 작성해보세요!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {isModalOpen && (
        <PostModal onClose={() => setIsModalOpen(false)} onSubmit={handleNewPost} isDark={isDark} />
      )}
    </div>
  );
}

// Modal Component
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-2xl" style={{
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">새 글 작성</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-lg"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`
            }}
          />
          <textarea
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full p-3 rounded-lg"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`
            }}
          />
          <input
            type="text"
            placeholder="태그 (쉼표로 구분)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-3 rounded-lg"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`
            }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Send size={18} />
              <span>게시</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
