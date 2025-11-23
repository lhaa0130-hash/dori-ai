"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function CommunityEditPage() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const found = savedPosts.find((p: any) => String(p.id) === String(postId));

    if (found) {
      setTitle(found.title);
      setContent(found.content);
    } else {
      alert("글을 찾을 수 없습니다.");
      router.back();
    }
  }, [postId, router]);

  function onLogout() { signOut({ callbackUrl: "/" }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title || !content) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const updatedPosts = savedPosts.map((p: any) => {
      if (String(p.id) === String(postId)) {
        return { ...p, title: title, content: content };
      }
      return p;
    });

    localStorage.setItem("dori_posts", JSON.stringify(updatedPosts));
    alert("글이 수정되었습니다!");
    router.push(`/community/${postId}`);
  }

  return (
    <main className="page">
      {/* HEADER (개선됨) */}
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

      {/* EDIT FORM */}
      <section className="container section" style={{ minHeight: "60vh", paddingTop: "40px" }}>
        <div className="write-header">
          <h1>게시글 수정하기</h1>
          <p>내용을 수정합니다.</p>
        </div>

        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label>내용</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => router.back()}>취소</button>
            <button type="submit" className="submit-btn">수정 완료</button>
          </div>
        </form>
      </section>

      <footer className="footer"><span>© DORI</span></footer>

      <style jsx global>{`
        :root { --bg: #fff; --text: #222; --muted: #555; --line: #ececec; --blue: #00baff; }
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
        
        /* ★ 아바타 & 메뉴 스타일 개선 */
        .avatar-wrap { position: relative; height: 48px; display: flex; align-items: center; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; background: #eef6ff; border: 1px solid #dfe8ff; display: flex; align-items: center; justify-content: center; color: #0a6fb0; font-weight: bold; cursor: pointer; }
        .menu { position: absolute; right: 0; top: 40px; width: 180px; background: #fff; border: 1px solid #e8eef7; border-radius: 8px; padding: 8px; opacity: 0; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: 0.2s; z-index: 100; }
        .avatar-wrap:hover .menu, .menu:hover { opacity: 1; pointer-events: auto; }
        .menu::before { content: ""; position: absolute; top: -20px; left: 0; width: 100%; height: 20px; background: transparent; }

        .menu-name { padding: 8px; border-bottom: 1px solid #f0f3f8; font-size: 13px; color: #666; }
        .menu-item { width: 100%; padding: 10px; border: none; background: transparent; text-align: left; cursor: pointer; border-radius: 4px; }
        .menu-item:hover { background: #f6faff; }
        .menu-item.danger { color: #b00020; }
        .container { max-width: 800px; margin: 0 auto; padding: 0 24px; }
        .footer { padding: 40px 24px; text-align: center; color: #999; font-size: 13px; display: flex; justify-content: space-between; max-width: 1120px; margin: 0 auto; }
        .write-header { margin-bottom: 30px; text-align: center; }
        .write-header h1 { font-size: 24px; margin-bottom: 8px; }
        .write-header p { color: #666; }
        .write-form { display: flex; flex-direction: column; gap: 24px; background: #fff; border: 1px solid var(--line); padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-weight: bold; font-size: 14px; color: #333; }
        .form-group input, .form-group textarea, .select-input { padding: 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; transition: 0.2s; }
        .form-group input:focus, .form-group textarea:focus, .select-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,186,255, 0.1); }
        .form-group textarea { height: 300px; resize: none; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
        .cancel-btn { padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
        .submit-btn { padding: 12px 24px; background: var(--blue); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .submit-btn:hover { background: #009acD; }
        @media (max-width: 640px) { .nav { overflow-x: auto; padding-bottom: 4px; } .write-form { padding: 20px; } }
      `}</style>
    </main>
  );
}