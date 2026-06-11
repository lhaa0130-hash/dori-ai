"use client";

import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addExp, getCachedGameProfile } from '@/lib/cottonCandy';
import { TIER_INFO, type UserTier } from '@/lib/userProfile';
import { PlusCircle, MessageCircle, TrendingUp, Clock, X, Share2, Send, Trash2 } from 'lucide-react';

// 등급 뱃지 (커뮤니티 작성자/댓글)
function GradeBadge({ tier }: { tier?: number }) {
  const t = (tier && tier >= 1 && tier <= 10 ? tier : 1) as UserTier;
  const info = TIER_INFO[t];
  if (!info) return null;
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{ color: info.color, backgroundColor: info.color + "1a" }}
      title={info.description}
    >
      {info.name}
    </span>
  );
}

// ── 타입 ──────────────────────────────────────────────────
interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
  likes: number;
  authorTier?: number;
}

type ReactionKey = 'like' | 'cheer' | 'insight' | 'haha';
type ReactionCounts = Record<ReactionKey, number>;

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
  reactions?: ReactionCounts;
  authorTier?: number;
}

interface CommunityClientProps {
  initialPosts?: Post[];
}

// ── 감정 반응 정의 (토스 증권 커뮤니티 스타일) ─────────────
const REACTIONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: 'like', emoji: '❤️', label: '좋아요' },
  { key: 'cheer', emoji: '👏', label: '응원' },
  { key: 'insight', emoji: '💡', label: '도움' },
  { key: 'haha', emoji: '😂', label: '웃겨' },
];

const MY_REACTIONS_KEY = 'dori_community_my_reactions';

function getCounts(post: Post): ReactionCounts {
  if (post.reactions) return { like: 0, cheer: 0, insight: 0, haha: 0, ...post.reactions };
  // 레거시 포스트: likes/sparks 에서 추론
  return { like: post.likes || 0, cheer: 0, insight: 0, haha: post.sparks || 0 };
}

function totalReactions(post: Post): number {
  const c = getCounts(post);
  return c.like + c.cheer + c.insight + c.haha;
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ── 반응 바 (카드/모달 공용) ───────────────────────────────
function ReactionBar({
  post, mine, onReact, size = 'sm',
}: {
  post: Post;
  mine?: ReactionKey;
  onReact: (key: ReactionKey) => void;
  size?: 'sm' | 'md';
}) {
  const counts = getCounts(post);
  const pad = size === 'md' ? 'px-3 py-1.5 text-[13px]' : 'px-2.5 py-1 text-[12px]';
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REACTIONS.map((r) => {
        const active = mine === r.key;
        const count = counts[r.key];
        return (
          <button
            key={r.key}
            onClick={(e) => { e.stopPropagation(); onReact(r.key); }}
            className={`flex items-center gap-1 rounded-full font-bold transition-all ${pad} ${
              active
                ? 'bg-[#FFF5EB] dark:bg-[#F9954E]/15 text-[#F9954E] ring-1 ring-[#F9954E]/40'
                : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E]'
            }`}
            aria-pressed={active}
          >
            <span className="leading-none">{r.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── 글 상세 모달 ──────────────────────────────────────────
function PostModal({
  post, mine, onReact, onClose, onUpdatePost, myEmail,
}: {
  post: Post;
  mine?: ReactionKey;
  onReact: (key: ReactionKey) => void;
  onClose: () => void;
  onUpdatePost: (updated: Post) => void;
  myEmail?: string;
}) {
  const [comments, setComments] = useState<Comment[]>(post.commentsList || []);
  const [commentInput, setCommentInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setComments(post.commentsList || []); }, [post.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleSubmitComment = () => {
    const text = commentInput.trim();
    const name = authorInput.trim() || '익명';
    if (!text) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const gp = myEmail ? getCachedGameProfile(myEmail) : null;
      const newComment: Comment = {
        id: Date.now().toString(),
        author: name,
        avatar: ['😊', '🙂', '😄', '🤗', '😎', '🧐', '🤔', '😁'][Math.floor(Math.random() * 8)],
        content: text,
        createdAt: new Date().toISOString(),
        likes: 0,
        authorTier: gp?.tier || 1,
      };
      const updated = [...comments, newComment];
      setComments(updated);
      setCommentInput('');
      onUpdatePost({ ...post, comments: updated.length, commentsList: updated });
      // 경험치 적립 (댓글 +5)
      if (myEmail) addExp(myEmail, 5, '커뮤니티 댓글');
      setIsSubmitting(false);
      setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, 250);
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);
    onUpdatePost({ ...post, comments: updated.length, commentsList: updated });
  };

  const handleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
  };

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) { navigator.share({ title: post.title, url }).catch(() => {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(() => alert('링크가 복사되었습니다.')).catch(() => {}); }
  };

  const paragraphs = post.content.replace(/<[^>]*>?/gm, '').split('\n').filter(l => l.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 md:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-2xl h-[92vh] sm:h-[88vh] flex flex-col bg-white dark:bg-zinc-950 sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden border border-neutral-200 dark:border-zinc-800"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FFF5EB] dark:bg-zinc-800 flex items-center justify-center text-lg">{post.avatar}</div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{post.author}</p>
                <GradeBadge tier={post.authorTier} />
              </div>
              <p className="text-xs text-neutral-400">{formatRelative(post.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 스크롤 본문 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 border-b border-neutral-100 dark:border-zinc-800/60">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 font-semibold">#{tag}</span>
              ))}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white mb-4 leading-tight">{post.title}</h2>
            <div className="space-y-3">
              {paragraphs.map((para, i) => (
                <p key={i} className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">{para}</p>
              ))}
            </div>
          </div>

          {/* 반응 바 */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-zinc-800/60">
            <ReactionBar post={post} mine={mine} onReact={onReact} size="md" />
            <div className="flex items-center gap-3 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />{comments.length}</span>
              <button onClick={handleShare} className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-400 transition-colors">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 댓글 */}
          <div className="px-5 py-4">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">댓글 {comments.length}</p>
            {comments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm text-neutral-400">첫 번째 댓글을 남겨보세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="group flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-base">{comment.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-neutral-50 dark:bg-zinc-900 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900 dark:text-white">{comment.author}</span>
                            <GradeBadge tier={comment.authorTier} />
                          </span>
                          <span className="text-xs text-neutral-400">{formatRelative(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 ml-2">
                        <button onClick={() => handleCommentLike(comment.id)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-[#F9954E] transition-colors font-medium">
                          ❤️ {comment.likes > 0 && comment.likes} 좋아요
                        </button>
                        <button onClick={() => handleDeleteComment(comment.id)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-neutral-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 transition-all font-medium">
                          <Trash2 className="w-3 h-3" /> 삭제
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

        {/* 댓글 입력창 */}
        <div className="flex-shrink-0 border-t border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <input type="text" placeholder="닉네임 (선택)" value={authorInput} onChange={e => setAuthorInput(e.target.value)}
              className="w-28 text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 border border-transparent focus:border-[#F9954E]/50 outline-none text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400" />
            <span className="text-xs text-neutral-400">익명으로 남길 수 있어요</span>
          </div>
          <div className="flex items-end gap-2">
            <textarea placeholder="댓글을 입력하세요..." value={commentInput} onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
              rows={2}
              className="flex-1 text-sm px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-zinc-800 border border-transparent focus:border-[#F9954E]/50 outline-none resize-none text-neutral-900 dark:text-white placeholder:text-neutral-400 leading-relaxed" />
            <button onClick={handleSubmitComment} disabled={!commentInput.trim() || isSubmitting}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#F9954E] hover:bg-[#E8832E] disabled:opacity-40 text-white transition-all active:scale-95 shadow-md shadow-[#F9954E]/30">
              {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 피드 카드 (토스 스타일, 균일 크기) ─────────────────────
function FeedCard({
  post, mine, onReact, onOpen,
}: {
  post: Post;
  mine?: ReactionKey;
  onReact: (key: ReactionKey) => void;
  onOpen: () => void;
}) {
  const preview = post.content.replace(/<[^>]*>?/gm, '').trim();
  return (
    <article
      onClick={onOpen}
      className="rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4 sm:p-5 hover:border-[#F9954E]/30 hover:shadow-sm transition-all cursor-pointer"
    >
      {/* 작성자 */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#FFF5EB] dark:bg-zinc-800 flex items-center justify-center text-base flex-shrink-0">{post.avatar}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold text-neutral-900 dark:text-white leading-tight truncate">{post.author}</p>
            <GradeBadge tier={post.authorTier} />
          </div>
          <p className="text-[11px] text-neutral-400">{formatRelative(post.createdAt)}</p>
        </div>
        {post.tags[0] && (
          <span className="ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 flex-shrink-0">
            #{post.tags[0]}
          </span>
        )}
      </div>

      {/* 본문 */}
      <h3 className="text-[16px] font-extrabold text-neutral-900 dark:text-white mb-1.5 leading-snug break-keep line-clamp-2">{post.title}</h3>
      <p className="text-[13.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3 break-keep mb-4">{preview}</p>

      {/* 반응 + 댓글 */}
      <div className="flex items-center justify-between gap-2">
        <ReactionBar post={post} mine={mine} onReact={onReact} />
        <span className="flex items-center gap-1 text-[12px] text-neutral-400 flex-shrink-0">
          <MessageCircle className="w-3.5 h-3.5" />
          {post.commentsList?.length ?? post.comments ?? 0}
        </span>
      </div>
    </article>
  );
}

// ── 메인 ───────────────────────────────────────────────────
export default function CommunityClient({ initialPosts = [] }: CommunityClientProps) {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'trending' | 'latest'>('trending');
  const [topic, setTopic] = useState<string>('전체');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [myReactions, setMyReactions] = useState<Record<string, ReactionKey>>({});
  const [showLoginNudge, setShowLoginNudge] = useState(false);
  const { session, status } = useAuth();
  const isLoggedIn = status === 'authenticated' && !!session;

  useEffect(() => {
    setMounted(true);
    const CURRENT_SEED_VERSION = "v3-2026-04-22";
    try {
      const savedReactions = localStorage.getItem(MY_REACTIONS_KEY);
      if (savedReactions) setMyReactions(JSON.parse(savedReactions));

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
    } catch (e) { console.error(e); }
  }, []);

  const persistPosts = (next: Post[]) => {
    try { localStorage.setItem('dori_community_posts', JSON.stringify(next)); } catch {}
  };

  const handleUpdatePost = (updated: Post) => {
    setPosts(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      persistPosts(next);
      return next;
    });
    setSelectedPost(prev => (prev && prev.id === updated.id ? updated : prev));
  };

  // 감정 반응 토글 (1인 1반응, 다시 누르면 취소, 다른 반응 누르면 교체)
  const handleReact = (post: Post, key: ReactionKey) => {
    const counts = getCounts(post);
    const current = myReactions[post.id];
    const nextCounts: ReactionCounts = { ...counts };
    const nextMine = { ...myReactions };

    if (current === key) {
      nextCounts[key] = Math.max(0, nextCounts[key] - 1);
      delete nextMine[post.id];
    } else {
      if (current) nextCounts[current] = Math.max(0, nextCounts[current] - 1);
      nextCounts[key] = nextCounts[key] + 1;
      nextMine[post.id] = key;
    }

    setMyReactions(nextMine);
    try { localStorage.setItem(MY_REACTIONS_KEY, JSON.stringify(nextMine)); } catch {}

    const updated: Post = { ...post, reactions: nextCounts, likes: nextCounts.like };
    handleUpdatePost(updated);
  };

  // 토픽(태그) 목록
  const topics = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => p.tags?.forEach(t => set.add(t)));
    return ['전체', ...Array.from(set)];
  }, [posts]);

  const visiblePosts = useMemo(() => {
    let list = topic === '전체' ? posts : posts.filter(p => p.tags?.includes(topic));
    list = [...list].sort((a, b) =>
      activeTab === 'trending'
        ? (totalReactions(b) + (b.views || 0)) - (totalReactions(a) + (a.views || 0))
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }, [posts, topic, activeTab]);

  return (
    <>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          mine={myReactions[selectedPost.id]}
          onReact={(key) => handleReact(selectedPost, key)}
          onClose={() => setSelectedPost(null)}
          onUpdatePost={handleUpdatePost}
          myEmail={session?.user?.email || undefined}
        />
      )}

      <main className="flex flex-col w-full min-h-screen">

        {/* 히어로 */}
        <section className="pt-8 pb-6">
          <p className="text-[12px] font-semibold text-[#F9954E] mb-3">커뮤니티</p>
          <h1 className="text-[34px] sm:text-[46px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
            지금, AI 얘기 중
          </h1>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
            궁금한 것도, 자랑할 것도. 편하게 한마디 남겨요.
          </p>
        </section>

        {/* 정렬 탭 + 글쓰기 (sticky) */}
        <div className="sticky top-16 z-30 -mx-4 px-4 py-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-b border-neutral-100 dark:border-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-zinc-900 rounded-full">
              <button onClick={() => setActiveTab('trending')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeTab === 'trending' ? 'bg-[#F9954E] text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400'}`}>
                <TrendingUp className="w-3.5 h-3.5" />인기
              </button>
              <button onClick={() => setActiveTab('latest')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeTab === 'latest' ? 'bg-[#F9954E] text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400'}`}>
                <Clock className="w-3.5 h-3.5" />최신
              </button>
            </div>

            {isLoggedIn ? (
              <Link href="/community/write" className="flex items-center gap-1.5 px-4 py-2 bg-[#F9954E] hover:bg-[#E8832E] text-white rounded-full font-bold text-[13px] transition-all shadow-sm active:scale-95">
                <PlusCircle size={15} /><span className="hidden xs:inline sm:inline">글쓰기</span>
              </Link>
            ) : (
              <div className="relative">
                <button onClick={() => setShowLoginNudge(v => !v)} className="flex items-center gap-1.5 px-4 py-2 bg-neutral-200 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 rounded-full font-bold text-[13px] transition-all">
                  <PlusCircle size={15} /><span>글쓰기</span>
                </button>
                {showLoginNudge && (
                  <div className="absolute right-0 top-12 z-50 w-60 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-2xl shadow-xl p-4 text-center">
                    <p className="text-2xl mb-2">🔒</p>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">로그인이 필요해요</p>
                    <p className="text-xs text-neutral-500 mb-3">글을 작성하려면 먼저 로그인해 주세요.</p>
                    <div className="flex gap-2">
                      <Link href="/login" className="flex-1 py-2 bg-[#F9954E] hover:bg-[#E8832E] text-white rounded-xl text-xs font-bold text-center">로그인</Link>
                      <Link href="/signup" className="flex-1 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold text-center">회원가입</Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 토픽 칩 */}
          {topics.length > 1 && (
            <div className="-mx-4 px-4 mt-2.5 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1.5 w-max pb-0.5">
                {topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                      topic === t
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-zinc-900 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {t === '전체' ? '전체' : `#${t}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 피드 */}
        <section className="py-5 pb-20">
          {!mounted ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-2xl border border-neutral-100 dark:border-zinc-900 p-5 animate-pulse">
                  <div className="h-8 w-32 bg-neutral-100 dark:bg-zinc-900 rounded-full mb-3" />
                  <div className="h-4 w-3/4 bg-neutral-100 dark:bg-zinc-900 rounded mb-2" />
                  <div className="h-3 w-full bg-neutral-100 dark:bg-zinc-900 rounded" />
                </div>
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-[2rem]">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-neutral-500 font-medium">아직 글이 없어요.</p>
              <p className="text-neutral-400 text-sm mt-1">첫 번째 글을 남겨보세요!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visiblePosts.map(post => (
                <FeedCard
                  key={post.id}
                  post={post}
                  mine={myReactions[post.id]}
                  onReact={(key) => handleReact(post, key)}
                  onOpen={() => setSelectedPost(post)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
