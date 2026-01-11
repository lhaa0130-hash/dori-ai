"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CommunityWritePage() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>("");

  // localStorage에서 설정된 이름 가져오기 (일관된 이름 사용)
  useEffect(() => {
    if (user?.email) {
      // localStorage에 저장된 이름을 우선 사용
      let savedName = localStorage.getItem(`dori_user_name_${user.email}`);
      
      if (!savedName && user.name) {
        // localStorage에 없으면 세션 이름을 저장하고 사용
        savedName = user.name;
        localStorage.setItem(`dori_user_name_${user.email}`, user.name);
      } else if (!savedName) {
        // 세션 이름도 없으면 이메일 앞부분 사용
        savedName = user.email.split("@")[0];
        localStorage.setItem(`dori_user_name_${user.email}`, savedName);
      }
      
      setDisplayName(savedName || "사용자");
    } else {
      setDisplayName("");
    }
  }, [user?.email, user?.name]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("잡담");
  const [image, setImage] = useState<string | null>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 500; 
          const scaleSize = MAX_WIDTH / img.width;
          
          if (scaleSize >= 1) {
             resolve(e.target?.result as string);
             return;
          }

          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          resolve(canvas.toDataURL("image/jpeg", 0.7)); 
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await resizeImage(file);
        setImage(compressedImage);
      } catch (err) {
        console.error(err);
        alert("이미지 처리 중 오류가 발생했습니다.");
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title || !content) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    const newPost = {
      id: Date.now(),
      title: title,
      content: content,
      author: user?.name || "익명",
      date: new Date().toLocaleDateString(),
      tag: category,
      likes: 0,
      comments: 0,
      sparks: 0,
      views: 0,
      image: image,
      commentsList: []
    };

    try {
      const existingPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
      localStorage.setItem("dori_posts", JSON.stringify([newPost, ...existingPosts]));
      
      // 글 작성 미션 진행도 업데이트
      if (user?.email) {
        import('@/lib/missionProgress').then(({ handlePostMission }) => {
          handlePostMission().catch(err => console.error('미션 완료 오류:', err));
        });
      }
      
      alert("게시글이 등록되었습니다!");
      router.push("/community");
    } catch (err) {
      alert("저장 용량이 꽉 찼습니다! 기존 글을 지우거나 이미지를 빼주세요.");
    }
  }

  function onLogout() { signOut({ callbackUrl: "/" }); }

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
                  <button className="avatar">{displayName?.[0] || "사"}</button>
                  <div className="menu">
                    <div className="menu-name">{displayName || "사용자"}</div>
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

      {/* WRITE FORM */}
      <section className="container section" style={{ minHeight: "60vh", paddingTop: "40px" }}>
        <div className="write-header">
          <h1>새 글 작성하기</h1>
          <p>아이디어를 공유해보세요.</p>
        </div>

        <form className="write-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>카테고리</label>
            <select className="select-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="잡담">잡담</option>
              <option value="질문">질문</option>
              <option value="정보 공유">정보 공유</option>
            </select>
          </div>

          <div className="form-group">
            <label>제목</label>
            <input type="text" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label>이미지 첨부</label>
            <div className="image-upload-box">
              <input type="file" accept="image/*" onChange={handleImageChange} id="file-input" style={{display:'none'}} />
              <label htmlFor="file-input" className="upload-btn">
                {image ? "이미지 변경" : "📷 이미지 선택하기"}
              </label>
              {image && (
                <div className="preview-area">
                  <img src={image} alt="Preview" className="preview-img" />
                  <button type="button" onClick={() => setImage(null)} className="remove-img-btn">삭제</button>
                </div>
              )}
            </div>
            <p style={{fontSize:'12px', color:'#999', marginTop:'8px'}}>* 큰 이미지는 자동으로 압축됩니다.</p>
          </div>
          
          <div className="form-group">
            <label>내용</label>
            <textarea placeholder="내용을 입력하세요" value={content} onChange={(e) => setContent(e.target.value)} />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => router.back()}>취소</button>
            <button type="submit" className="submit-btn">등록하기</button>
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
        .image-upload-box { border: 2px dashed #ddd; padding: 20px; text-align: center; border-radius: 8px; }
        .upload-btn { display: inline-block; padding: 8px 16px; background: #eee; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .preview-area { margin-top: 20px; position: relative; display: inline-block; }
        .preview-img { max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .remove-img-btn { display: block; margin: 10px auto 0; padding: 4px 12px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
        @media (max-width: 640px) { .nav { overflow-x: auto; padding-bottom: 4px; } .write-form { padding: 20px; } }
      `}</style>
    </main>
  );
}