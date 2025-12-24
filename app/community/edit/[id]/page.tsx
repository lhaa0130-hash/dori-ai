"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import RichTextEditor from "@/components/community/RichTextEditor";

const CATEGORIES = [
  { value: "잡담", label: "☕ 잡담", icon: "☕" },
  { value: "질문", label: "❓ 질문", icon: "❓" },
  { value: "정보 공유", label: "💡 정보 공유", icon: "💡" },
  { value: "자랑", label: "✨ 자랑", icon: "✨" },
  { value: "후기", label: "📝 후기", icon: "📝" },
  { value: "팁", label: "💡 팁", icon: "💡" },
];

export default function CommunityEditPage() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("잡담");

  useEffect(() => {
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const found = savedPosts.find((p: any) => String(p.id) === String(postId));

    if (found) {
      // 본인 글인지 확인
      const isOwner = user && (user.name === found.author || user.name === found.nickname || user.name === "관리자");
      if (!isOwner) {
        alert("본인의 글만 수정할 수 있습니다.");
        router.back();
        return;
      }
      
      setTitle(found.title);
      setContent(found.content || "");
      setCategory(found.tag || "잡담");
    } else {
      alert("글을 찾을 수 없습니다.");
      router.back();
    }
  }, [postId, router, user]);

  function onLogout() { signOut({ callbackUrl: "/" }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // HTML 태그 제거한 순수 텍스트로 검증
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    
    if (!title || title.trim().length < 1) {
      alert("제목을 입력해주세요.");
      return;
    }

    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const updatedPosts = savedPosts.map((p: any) => {
      if (String(p.id) === String(postId)) {
        return { 
          ...p, 
          title: title.trim(), 
          content: content,
          tag: category
        };
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
          {/* 카테고리 선택 */}
          <div className="form-group">
            <label>카테고리</label>
            <div className="category-selector">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-btn ${category === cat.value ? 'active' : ''}`}
                  onClick={() => setCategory(cat.value)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.label.replace(cat.icon, '').trim()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div className="form-group">
            <label>제목</label>
            <input 
              type="text" 
              placeholder="제목을 입력하세요" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <span className="char-count">{title.length}/100</span>
          </div>
          
          {/* 리치 텍스트 에디터 */}
          <div className="form-group">
            <label>내용</label>
            <RichTextEditor 
              value={content} 
              onChange={setContent}
              placeholder="내용을 입력하세요. 텍스트 서식, 이미지, 비디오 등을 추가할 수 있습니다."
            />
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
        .form-group input, .form-group textarea, .select-input { padding: 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; transition: 0.2s; width: 100%; }
        .form-group input:focus, .form-group textarea:focus, .select-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,186,255, 0.1); }
        .char-count { font-size: 12px; color: #999; text-align: right; margin-top: 4px; }
        
        /* 카테고리 선택 */
        .category-selector { display: flex; flex-wrap: wrap; gap: 8px; }
        .category-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: 2px solid #ddd; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; font-size: 14px; }
        .category-btn:hover { border-color: var(--blue); background: #f0f7ff; }
        .category-btn.active { border-color: var(--blue); background: var(--blue); color: white; }
        .category-icon { font-size: 18px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
        .cancel-btn { padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
        .submit-btn { padding: 12px 24px; background: var(--blue); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
        .submit-btn:hover { background: #009acD; }
        @media (max-width: 640px) { .nav { overflow-x: auto; padding-bottom: 4px; } .write-form { padding: 20px; } }
      `}</style>
    </main>
  );
}