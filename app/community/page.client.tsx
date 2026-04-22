"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { PlusCircle, Users, Eye, Heart, MessageCircle, TrendingUp, Clock, X, Share2, Bookmark, Send, Trash2 } from 'lucide-react';

// ── 타입 ──────────────────────────────────────────────────
interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
  likes: number;
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  commentsList?: Comment[];
  createdAt: string;
  date?: string;
  views?: number;
  sparks?: number;
}

interface CommunityClientProps {
  initialPosts?: Post[];
}

// ── 글 상세 모달 ──────────────────────────────────────────
function PostModal({
  post,
  onClose,
  onUpdatePost,
}: {
  post: Post;
  onClose: () => void;
  onUpdatePost: (updated: Post) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [comments, setComments] = useState<Comment[]>(post.commentsList || []);
  const [commentInput, setCommentInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  // ESC 닫기 + 스크롤 막기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount(prev => next ? prev + 1 : prev - 1);
  };

  const handleSubmitComment = () => {
    const text = commentInput.trim();
    const name = authorInput.trim() || '익명';
    if (!text) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newComment: Comment = {
        id: Date.now().toString(),
        author: name,
        avatar: ['😊', '🙂', '😄', '🤗', '😎', '🧐', '🤔', '😁'][Math.floor(Math.random() * 8)],
        content: text,
        createdAt: new Date().toISOString(),
        likes: 0,
      };
      const updated = [...comments, newComment];
      setComments(updated);
      setCommentInput('');

      // localStorage 업데이트
      const updatedPost: Post = {
        ...post,
        likes: likeCount,
        comments: updated.length,
        commentsList: updated,
      };
      onUpdatePost(updatedPost);

      setIsSubmitting(false);
      setTimeout(() => {
        commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 300);
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    const updatedPost: Post = {
      ...post,
      comments: updated.length,
      commentsList: updated,
    };
    onUpdatePost(updatedPost);
  };

  const handleCommentLike = (commentId: string) => {
    const updated = comments.map(c =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    );
    setComments(updated);
  };

  const paragraphs = post.content
    .replace(/<[^>]*>?/gm, '')
    .split('\n')
    .filter(line => line.trim() !== '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-8"
      onClick={onClose}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 모달 본체 */}
      <div
        className="relative w-full sm:max-w-2xl h-[95vh] sm:h-[90vh] flex flex-col bg-white dark:bg-zinc-950 sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden border border-neutral-200 dark:border-zinc-800"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FFF5EB] dark:bg-zinc-800 flex items-center justify-center text-lg">
              {post.avatar}
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">{post.author}</p>
              <p className="text-xs text-neutral-400">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 스크롤 본문 */}
        <div className="flex-1 overflow-y-auto">
          {/* 글 본문 */}
          <div className="px-5 py-5 border-b border-neutral-100 dark:border-zinc-800/60">
            {/* 태그 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 text-[#E8832E] dark:text-[#FBAA60] font-semibold border border-[#FDD5A5] dark:border-[#B35E15]">
                  #{tag}
                </span>
              ))}
            </div>
            {/* 제목 */}
            <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white mb-4 leading-tight">
              {post.title}
            </h2>
            {/* 본문 */}
            <div className="space-y-3">
              {paragraphs.map((para, i) => (
                <p key={i} className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* 반응 바 */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  liked
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'
                    : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-500 hover:text-rose-400'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-500' : ''}`} />
                {likeCount}
              </button>
              <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                <MessageCircle className="w-3.5 h-3.5" />
                {comments.length}개의 댓글
              </span>
              <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                <Eye className="w-3.5 h-3.5" />
                {(post.views || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-400 transition-colors">
                <Bookmark className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-400 transition-colors">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── 댓글 목록 ── */}
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
              댓글 {comments.length}
            </p>

            {comments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm text-neutral-400">첫 번째 댓글을 남겨보세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="group flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-base">
                      {comment.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-neutral-50 dark:bg-zinc-900 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">{comment.author}</span>
                          <span className="text-xs text-neutral-400">{formatRelative(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                      {/* 댓글 액션 */}
                      <div className="flex items-center gap-3 mt-1.5 ml-2">
                        <button
                          onClick={() => handleCommentLike(comment.id)}
                          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-rose-400 transition-colors font-medium"
                        >
                          <Heart className="w-3 h-3" />
                          {comment.likes > 0 && comment.likes}
                          좋아요
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-neutral-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 transition-all font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={commentEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* ── 댓글 입력창 (하단 고정) ── */}
        <div className="flex-shrink-0 border-t border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3">
          {/* 닉네임 입력 */}
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="닉네임 (선택)"
              value={authorInput}
              onChange={e => setAuthorInput(e.target.value)}
              className="w-28 text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-transparent focus:border-[#F9954E]/50 outline-none text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400"
            />
            <span className="text-xs text-neutral-300 dark:text-zinc-600">|</span>
            <span className="text-xs text-neutral-400">익명으로 남길 수 있어요</span>
          </div>
          {/* 댓글 입력 */}
          <div className="flex items-end gap-2">
            <textarea
              placeholder="댓글을 입력하세요..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              rows={2}
              className="flex-1 text-sm px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-zinc-800 border border-transparent focus:border-[#F9954E]/50 outline-none resize-none text-neutral-900 dark:text-white placeholder:text-neutral-400 leading-relaxed"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentInput.trim() || isSubmitting}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#F9954E] hover:bg-[#E8832E] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-95 shadow-md shadow-[#F9954E]/30"
            >
              {isSubmitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-xs text-neutral-300 dark:text-zinc-600 mt-1.5 ml-1">Enter로 전송 · Shift+Enter 줄바꿈</p>
        </div>
      </div>
    </div>
  );
}

// ── 메인 커뮤니티 컴포넌트 ─────────────────────────────────
export default function CommunityClient({ initialPosts = [] }: CommunityClientProps) {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'trending' | 'latest'>('trending');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    setMounted(true);
    const CURRENT_SEED_VERSION = "v2-2026-04-22";
    try {
      const savedVersion = localStorage.getItem('dori_community_version');
      const savedPosts = localStorage.getItem('dori_community_posts');
      if (savedPosts && savedVersion === CURRENT_SEED_VERSION) {
        const parsed: Post[] = JSON.parse(savedPosts);
        if (parsed.length > 0) { setPosts(parsed); return; }
      }
      fetch('/api/seed-community')
        .then(r => r.json())
        .then(data => {
          if (data.posts && Array.isArray(data.posts)) {
            localStorage.setItem('dori_community_posts', JSON.stringify(data.posts));
            localStorage.setItem('dori_community_version', CURRENT_SEED_VERSION);
            setPosts(data.posts);
          }
        })
        .catch(e => console.error('Failed to seed', e));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 댓글 달리면 posts 상태 + localStorage 동기화
  const handleUpdatePost = (updated: Post) => {
    setPosts(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      localStorage.setItem('dori_community_posts', JSON.stringify(next));
      return next;
    });
    setSelectedPost(updated);
  };

  const sortedPosts = [...posts].sort((a, b) =>
    activeTab === 'trending'
      ? (b.likes + (b.views || 0)) - (a.likes + (a.views || 0))
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const featuredPost = sortedPosts[0];
  const secondaryPosts = sortedPosts.slice(1, 3);
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
    <>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdatePost={handleUpdatePost}
        />
      )}

      <main className="flex flex-col w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

        <div className="flex-grow z-10">
          <section className="relative pt-32 pb-10 px-6 text-center">
            <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
                <Users className="w-3 h-3" /><span>Community Center</span>
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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-zinc-900 rounded-full">
                <button onClick={() => setActiveTab('trending')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'trending' ? 'bg-[#F9954E] text-white shadow-md' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  <TrendingUp className="w-3.5 h-3.5" />인기
                </button>
                <button onClick={() => setActiveTab('latest')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'latest' ? 'bg-[#F9954E] text-white shadow-md' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  <Clock className="w-3.5 h-3.5" />최신
                </button>
              </div>
              <Link href="/community/write" className="flex items-center gap-2 px-5 py-2.5 bg-[#F9954E] hover:bg-[#E8832E] text-white rounded-full font-bold text-sm transition-all shadow-lg active:scale-95">
                <PlusCircle size={16} /><span>새 글 작성</span>
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-[2rem]">
                <p className="text-neutral-500 font-medium">아직 게시물이 없습니다.</p>
                <p className="text-neutral-400 text-sm mt-2">첫 번째 글을 작성해보세요!</p>
              </div>
            ) : (
              <>
                {/* 피처드 카드 */}
                {featuredPost && (
                  <div onClick={() => setSelectedPost(featuredPost)} className="group relative w-full rounded-[2rem] overflow-hidden border border-[#F9954E]/30 bg-gradient-to-br from-[#FFF5EB] to-white dark:from-[#1a0d00] dark:to-black shadow-xl shadow-[#F9954E]/10 hover:shadow-[#F9954E]/20 transition-all duration-300 mb-6 cursor-pointer">
                    <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 px-3 py-1 bg-[#F9954E] rounded-full text-white text-xs font-black">🔥 HOT</div>
                    <div className="absolute top-5 right-5 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1 bg-black/60 rounded-full text-white text-xs">
                      댓글 {(featuredPost.commentsList?.length || 0)} · 전체보기 →
                    </div>
                    <div className="p-8 pt-14">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {featuredPost.tags.map(tag => <span key={tag} className={`text-xs px-3 py-1 rounded-full font-semibold ${getTagClass(tag)}`}>#{tag}</span>)}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white mb-3 leading-tight group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">{featuredPost.title}</h2>
                      <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed mb-6">{featuredPost.content.replace(/<[^>]*>?/gm, '')}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FFF5EB] dark:bg-zinc-800 flex items-center justify-center text-base">{featuredPost.avatar}</div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900 dark:text-white">{featuredPost.author}</p>
                            <p className="text-xs text-neutral-500">{formatDate(featuredPost.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium text-neutral-500">
                          <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{(featuredPost.views || 0).toLocaleString()}</span>
                          <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-400" />{featuredPost.likes}</span>
                          <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" />{featuredPost.commentsList?.length || featuredPost.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2·3위 그리드 */}
                {secondaryPosts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {secondaryPosts.map((post, idx) => (
                      <div key={post.id} onClick={() => setSelectedPost(post)} className="group relative rounded-[1.5rem] border border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 hover:border-[#F9954E]/40 hover:shadow-lg transition-all duration-300 cursor-pointer p-6">
                        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-neutral-500">{idx + 2}</div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.slice(0, 2).map(tag => <span key={tag} className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getTagClass(tag)}`}>#{tag}</span>)}
                        </div>
                        <h3 className="text-base font-black text-neutral-900 dark:text-white mb-2 group-hover:text-[#E8832E] transition-colors line-clamp-2">{post.title}</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4">{post.content.replace(/<[^>]*>?/gm, '')}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{post.avatar}</span>
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{post.author}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-400">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{post.likes}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.commentsList?.length || post.comments}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 리스트 */}
                {listPosts.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">전체 게시물</span>
                      <div className="flex-1 h-px bg-neutral-100 dark:bg-zinc-800" />
                    </div>
                    <div className="space-y-3">
                      {listPosts.map((post, idx) => (
                        <div key={post.id} onClick={() => setSelectedPost(post)} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/30 border border-neutral-100 dark:border-zinc-800/60 hover:border-[#F9954E]/30 hover:bg-[#FFF5EB]/40 dark:hover:bg-zinc-900/60 transition-all cursor-pointer">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-neutral-400">{idx + 4}</span>
                          <span className="flex-shrink-0 text-xl">{post.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-[#E8832E] transition-colors">{post.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-neutral-400">{post.author}</span>
                              <span className="text-neutral-200 dark:text-zinc-700">·</span>
                              <span className="text-xs text-neutral-400">{formatDate(post.createdAt)}</span>
                              {post.tags.slice(0, 1).map(tag => <span key={tag} className={`text-xs px-2 py-0.5 rounded-md font-medium ${getTagClass(tag)}`}>#{tag}</span>)}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-3 text-xs text-neutral-400">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{post.likes}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.commentsList?.length || post.comments}</span>
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
    </>
  );
}
