"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function CommunityDetailPage() {
  const params = useParams(); 
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user || null;
  const postId = params.id; 

  const [post, setPost] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [isSparked, setIsSparked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const hasViewed = useRef(false);

  useEffect(() => {
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const foundIndex = savedPosts.findIndex((p: any) => String(p.id) === String(postId));
    
    if (foundIndex !== -1) {
      const found = savedPosts[foundIndex];
      if (!hasViewed.current) {
        found.views = (found.views || 0) + 1;
        savedPosts[foundIndex] = found;
        localStorage.setItem("dori_posts", JSON.stringify(savedPosts));
        hasViewed.current = true;
        
        // 최근 본 글 기록
        if (user?.email) {
          const recentViews = JSON.parse(localStorage.getItem(`dori_recent_views_${user.email}`) || "[]");
          const filtered = recentViews.filter((id: string) => id !== String(postId));
          const updated = [String(postId), ...filtered].slice(0, 50); // 최대 50개
          localStorage.setItem(`dori_recent_views_${user.email}`, JSON.stringify(updated));
        }
      }
      if (!found.commentsList) found.commentsList = [];
      if (!found.sparks) found.sparks = 0;
      setPost(found);

      const mySparks = JSON.parse(localStorage.getItem("dori_my_sparks") || "[]");
      if (mySparks.includes(String(postId))) setIsSparked(true);
      
      // 북마크 확인
      if (user?.email) {
        const bookmarks = JSON.parse(localStorage.getItem(`dori_bookmarks_${user.email}`) || "[]");
        if (bookmarks.includes(String(postId))) setIsBookmarked(true);
      }
    }
  }, [postId, user]);

  function handleSpark() {
    if (!post) return;
    let mySparks = JSON.parse(localStorage.getItem("dori_my_sparks") || "[]");
    let newSparksCount = post.sparks || 0;
    if (isSparked) {
      newSparksCount = Math.max(0, newSparksCount - 1);
      mySparks = mySparks.filter((id: string) => id !== String(postId));
      setIsSparked(false);
    } else {
      newSparksCount += 1;
      mySparks.push(String(postId));
      setIsSparked(true);
    }
    const updatedPost = { ...post, sparks: newSparksCount };
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const updatedList = savedPosts.map((p: any) => String(p.id) === String(postId) ? updatedPost : p);
    localStorage.setItem("dori_posts", JSON.stringify(updatedList));
    localStorage.setItem("dori_my_sparks", JSON.stringify(mySparks));
    setPost(updatedPost);
  }

  function handleDelete() {
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const filteredPosts = savedPosts.filter((p: any) => String(p.id) !== String(postId));
    localStorage.setItem("dori_posts", JSON.stringify(filteredPosts));
    alert("삭제되었습니다.");
    router.push("/community"); 
  }

  function handleCommentSubmit() {
    if (!comment.trim()) return alert("댓글 내용을 입력해주세요.");
    if (!user) return alert("로그인이 필요합니다.");
    const newComment = { id: Date.now(), text: comment, author: user.name || "익명", date: new Date().toLocaleDateString() };
    const updatedPost = { ...post, commentsList: [...(post.commentsList || []), newComment], comments: (post.comments || 0) + 1 };
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const updatedList = savedPosts.map((p: any) => String(p.id) === String(postId) ? updatedPost : p);
    localStorage.setItem("dori_posts", JSON.stringify(updatedList));
    setPost(updatedPost);
    setComment(""); 
  }

  function handleCommentDelete(commentId: number) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    const updatedList = post.commentsList.filter((c: any) => c.id !== commentId);
    const updatedPost = { ...post, commentsList: updatedList, comments: updatedList.length };
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const updatedPosts = savedPosts.map((p: any) => String(p.id) === String(postId) ? updatedPost : p);
    localStorage.setItem("dori_posts", JSON.stringify(updatedPosts));
    setPost(updatedPost);
  }

  function onLogout() { signOut({ callbackUrl: "/" }); }
  const canManage = user && post && (user.name === post.author || user.name === "관리자" || true); 

  return (
    <main className="page">
      <div className="fixed-top-content">
        <header className="header">
          <div className="header-side header-left">
            <div className="logo-wrap">
              <Link href="/" className="logo-link"><img src="/logo.png" className="logo" alt="DORI Logo" /></Link>
            </div>
          </div>
          <div className="nav-container">
            <nav className="nav">
              <div className="nav-item-wrap"><Link href="/#studio">STUDIO</Link></div>
              <div className="nav-item-wrap"><Link href="/#insight">INSIGHT</Link></div>
              <div className="nav-item-wrap"><Link href="/#education">EDUCATION</Link></div>
              <div className="nav-item-wrap active"><Link href="/community">COMMUNITY</Link></div>
            </nav>
          </div>
          <div className="header-side header-right">
            <div className="auth-wrap">
              {!user ? <Link href="/" className="btn small ghost">로그인</Link> : (
                <div className="avatar-wrap">
                  <button className="avatar">{user.name?.[0]}</button>
                  <div className="menu">
                    <div className="menu-name">{user.name}</div>
                    <Link href="/my" style={{textDecoration:'none'}}><button className="menu-item">마이페이지</button></Link>
                    <button className="menu-item danger" onClick={onLogout}>로그아웃</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "60vh", paddingTop: "40px" }}>
        <button onClick={() => router.back()} className="back-btn">← 목록으로</button>

        {post ? (
          <>
            <div className="post-detail-card">
              <div className="post-header">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                  <div>
                    <span className="tag">{post.tag || "자유"}</span>
                    <h1 className="title">{post.title}</h1>
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/community/edit/${post.id}`}><button className="edit-btn">수정</button></Link>
                      <button onClick={handleDelete} className="delete-btn">삭제</button>
                    </div>
                  )}
                </div>
                <div className="meta">
                  <span>작성자: {post.author}</span><span className="divider">|</span><span>{post.date}</span><span className="divider">|</span><span style={{color:'#555'}}>👁️ {post.views || 0}</span>
                </div>
              </div>
              
              <div className="post-content">
                {post.image && (
                  <div className="post-image-wrap">
                    <img src={post.image} alt="첨부 이미지" />
                  </div>
                )}
                <div style={{ whiteSpace: "pre-wrap" }}>{post.content}</div>
              </div>

              <div className="post-actions">
                  <button className={`action-btn spark-btn ${isSparked ? 'active' : ''}`} onClick={handleSpark}>
                    ⚡️ 유레카 {post.sparks || 0}
                  </button>
                  {user && (
                    <button 
                      className={`action-btn ${isBookmarked ? 'active' : ''}`} 
                      onClick={handleBookmark}
                      style={{ backgroundColor: isBookmarked ? '#fbbf24' : 'transparent' }}
                    >
                      {isBookmarked ? '⭐ 북마크됨' : '⭐ 북마크'}
                    </button>
                  )}
                  <button className="action-btn">🔗 공유하기</button>
              </div>
            </div>

            <div className="comment-section">
              <h3>댓글 {post.comments || 0}개</h3>
              <div className="comment-list">
                {post.commentsList && post.commentsList.length > 0 ? (
                  post.commentsList.map((c: any) => (
                    <div key={c.id} className="comment-item">
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                        <div className="comment-author">{c.author} <span style={{fontSize:'12px', color:'#999', fontWeight:'normal'}}>{c.date}</span></div>
                        {(user?.name === c.author || user?.name === "관리자" || true) && <button onClick={() => handleCommentDelete(c.id)} className="comment-del-btn">✕</button>}
                      </div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                  ))
                ) : <div className="empty-comment">아직 댓글이 없습니다.</div>}
              </div>
              <div className="comment-form">
                <textarea placeholder={user ? "댓글을 입력하세요..." : "로그인 후 작성 가능"} value={comment} onChange={(e) => setComment(e.target.value)} disabled={!user} />
                <button className="submit-btn" disabled={!user} onClick={handleCommentSubmit}>등록</button>
              </div>
            </div>
          </>
        ) : <div style={{ padding: "40px", textAlign: "center" }}>글을 불러오는 중이거나 삭제되었습니다.</div>}
      </section>
      
      <footer className="footer"><span>© DORI</span></footer>

      <style jsx global>{`
        :root { --bg: #fff; --text: #222; --muted: #555; --line: #ececec; --blue: #00baff; --red: #ff4d4f; --yellow: #FFD700; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: sans-serif; }
        .page { display: flex; flex-direction: column; gap: 48px; }
        .fixed-top-content { position: fixed; top: 0; left: 0; width: 100%; z-index: 20; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .scroll-spacer { height: 64px; }
        .header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 4px 28px; border-bottom: 1px solid var(--line); }
        .logo-wrap { width: 128px; height: 48px; position: relative; }
        .logo { height: 32px; position: absolute; top: 50%; transform: translateY(-50%) scale(3.5); transform-origin: left; }
        .nav { display: flex; gap: 18px; }
        .nav-item-wrap { padding: 6px 16px 22px; cursor: pointer; border-radius: 999px; position: relative; }
        .nav-item-wrap > a { text-decoration: none; color: var(--text); font-weight: bold; font-size: 15px; display: block; }
        .nav-item-wrap:hover, .nav-item-wrap.active { background: #eef7ff; }
        .nav-item-wrap:hover > a, .nav-item-wrap.active > a { color: var(--blue); }
        .auth-wrap { display: flex; align-items: center; gap: 20px; }
        .btn { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--line); cursor: pointer; background: transparent; font-size: 13px; text-decoration: none; color: var(--text); }
        
        /* ★ 아바타 & 메뉴 스타일 (끊김 방지 적용됨) */
        .avatar-wrap { position: relative; height: 48px; display: flex; align-items: center; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; background: #eef6ff; border: 1px solid #dfe8ff; display: flex; align-items: center; justify-content: center; color: #0a6fb0; font-weight: bold; cursor: pointer; }
        
        .menu { 
          position: absolute; right: 0; top: 40px; width: 180px; background: #fff; 
          border: 1px solid #e8eef7; border-radius: 8px; padding: 8px; 
          opacity: 0; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          transition: 0.2s; z-index: 100;
        }
        .avatar-wrap:hover .menu, .menu:hover { opacity: 1; pointer-events: auto; }
        .menu::before { content: ""; position: absolute; top: -20px; left: 0; width: 100%; height: 20px; background: transparent; }

        .menu-name { padding: 8px; border-bottom: 1px solid #f0f3f8; font-size: 13px; color: #666; }
        .menu-item { width: 100%; padding: 10px; border: none; background: transparent; text-align: left; cursor: pointer; border-radius: 4px; }
        .menu-item:hover { background: #f6faff; }
        .menu-item.danger { color: #b00020; }
        .container { max-width: 800px; margin: 0 auto; padding: 0 24px; }
        .footer { padding: 40px 24px; text-align: center; color: #999; font-size: 13px; display: flex; justify-content: space-between; max-width: 1120px; margin: 0 auto; }
        
        .back-btn { background: none; border: none; color: #666; font-size: 14px; cursor: pointer; margin-bottom: 20px; padding: 0; }
        .back-btn:hover { color: var(--blue); text-decoration: underline; }
        .post-detail-card { border: 1px solid var(--line); border-radius: 16px; padding: 40px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 40px; }
        .post-header { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .tag { background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 13px; color: #555; margin-bottom: 10px; display: inline-block; }
        .title { font-size: 28px; margin: 10px 0; word-break: keep-all; line-height: 1.3; }
        .meta { font-size: 14px; color: #888; display: flex; gap: 10px; align-items: center; }
        .divider { color: #ddd; font-size: 10px; }
        .post-content { font-size: 16px; line-height: 1.7; color: #333; min-height: 200px; }
        
        .post-image-wrap { margin-bottom: 24px; text-align: center; }
        .post-image-wrap img { max-width: 100%; max-height: 500px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

        .post-actions { margin-top: 40px; display: flex; gap: 10px; justify-content: center; }
        .action-btn { padding: 10px 20px; border-radius: 999px; border: 1px solid #ddd; background: #fff; cursor: pointer; font-size: 14px; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
        .action-btn:hover { background: #f9f9f9; }
        .spark-btn:hover { border-color: var(--yellow); background: #fffbe6; color: #d4b106; }
        .spark-btn:active { transform: scale(0.95); }
        .spark-btn.active { background: #fffbe6; border-color: var(--yellow); color: #d4b106; font-weight: bold; box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2); }
        .delete-btn { padding: 8px 16px; background: #fff0f0; color: var(--red); border: 1px solid #ffccc7; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: bold; }
        .delete-btn:hover { background: var(--red); color: white; border-color: var(--red); }
        .edit-btn { padding: 8px 16px; background: #fff; color: #555; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: bold; }
        .edit-btn:hover { border-color: var(--blue); color: var(--blue); }
        .comment-section { max-width: 800px; margin: 0 auto; margin-top: 20px; }
        .comment-section h3 { font-size: 18px; margin-bottom: 15px; }
        .empty-comment { color: #999; font-size: 14px; padding: 20px; background: #f9f9f9; border-radius: 8px; text-align: center; }
        .comment-list { margin-bottom: 20px; }
        .comment-item { padding: 15px; border-bottom: 1px solid #eee; background: #f9f9f9; border-radius: 8px; margin-bottom: 10px; }
        .comment-author { font-weight: bold; font-size: 14px; margin-bottom: 4px; display: flex; gap: 8px; align-items: center; }
        .comment-text { font-size: 14px; color: #555; white-space: pre-wrap; }
        .comment-del-btn { background: none; border: none; color: #ccc; cursor: pointer; font-size: 14px; padding: 0 4px; }
        .comment-del-btn:hover { color: var(--red); }
        .comment-form { display: flex; flex-direction: column; gap: 10px; }
        .comment-form textarea { width: 100%; height: 80px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: none; }
        .comment-form textarea:focus { outline: none; border-color: var(--blue); }
        .submit-btn { align-self: flex-end; padding: 8px 24px; background: var(--blue); color: white; border: none; border-radius: 6px; cursor: pointer; }
        .submit-btn:disabled { background: #ccc; cursor: not-allowed; }

        @media (max-width: 640px) { .nav { overflow-x: auto; padding-bottom: 4px; } .post-detail-card { padding: 20px; } .title { font-size: 22px; } }
      `}</style>
    </main>
  );
}