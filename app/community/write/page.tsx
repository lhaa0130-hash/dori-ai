"use client";

import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RichTextEditor from "@/components/community/RichTextEditor";
import { addUserScore } from "@/lib/userProfile";

const CATEGORIES = [
  { value: "잡담", label: "☕ 잡담", icon: "☕" },
  { value: "질문", label: "❓ 질문", icon: "❓" },
  { value: "정보 공유", label: "💡 정보 공유", icon: "💡" },
  { value: "자랑", label: "✨ 자랑", icon: "✨" },
  { value: "후기", label: "📝 후기", icon: "📝" },
  { value: "팁", label: "💡 팁", icon: "💡" },
];

export default function CommunityWritePage() {
  const { data: session } = useSession();
  const user = session?.user || null;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("잡담");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200; 
          const scaleSize = MAX_WIDTH / img.width;
          
          if (scaleSize >= 1) {
             resolve(e.target?.result as string);
             return;
          }

          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          resolve(canvas.toDataURL("image/jpeg", 0.8)); 
        };
        img.onerror = () => reject(new Error("Image load error"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      const fileArray = Array.from(files);
      const imagePromises = fileArray.map(file => resizeImage(file));
      const newImages = await Promise.all(imagePromises);
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      console.error(err);
      alert("이미지 처리 중 오류가 발생했습니다.");
    }
  };

  const handleVideoAdd = () => {
    const url = prompt("비디오 URL을 입력하세요 (YouTube, Vimeo 등):");
    if (url && url.trim()) {
      setVideos(prev => [...prev, url.trim()]);
    }
  };

  const handleVideoFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
      const videoPromises = videoFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error("File read error"));
            }
          };
          reader.onerror = () => reject(new Error("File read error"));
          reader.readAsDataURL(file);
        });
      });
      
      const newVideos = await Promise.all(videoPromises);
      setVideos(prev => [...prev, ...newVideos]);
    } catch (err) {
      console.error(err);
      alert("비디오 처리 중 오류가 발생했습니다.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    
    // 이미지와 비디오 파일 분리
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
    
    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      imageFiles.forEach(file => dt.items.add(file));
      handleImageChange(dt.files);
    }
    
    if (videoFiles.length > 0) {
      const dt = new DataTransfer();
      videoFiles.forEach(file => dt.items.add(file));
      handleVideoFileChange(dt.files);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // HTML 태그 제거한 순수 텍스트로 검증
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    
    if (!title || title.trim().length < 1) {
      alert("제목을 입력해주세요.");
      return;
    }

    const newPost = {
      id: Date.now(),
      title: title,
      content: content, // HTML 형식으로 저장
      author: user?.name || user?.email?.split('@')[0] || "익명", // 사용자 프로필 아이디 사용
      nickname: user?.name || user?.email?.split('@')[0] || "익명", // CommunityPost 형식과 호환
      date: new Date().toLocaleDateString(),
      tag: category,
      likes: 0,
      comments: 0,
      sparks: 0,
      views: 0,
      images: images,
      videos: videos,
      commentsList: []
    };

    try {
      const existingPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
      localStorage.setItem("dori_posts", JSON.stringify([newPost, ...existingPosts]));
      
      // 글 작성 시 점수 증가
      if (user?.email) {
        addUserScore(user.email, "post");
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

      {/* WRITE FORM */}
      <section className="container section" style={{ minHeight: "60vh", paddingTop: "40px" }}>
        <div className="write-header">
          <h1>새 글 작성하기</h1>
          <p>아이디어를 공유해보세요.</p>
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

          {/* 이미지 업로드 */}
          <div className="form-group">
            <label>이미지 첨부 (여러 개 가능)</label>
            <div 
              className={`image-upload-box ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                multiple
                onChange={(e) => handleImageChange(e.target.files)}
                id="file-input" 
                style={{display:'none'}} 
              />
              <label htmlFor="file-input" className="upload-btn">
                📷 이미지 선택하기 (드래그 앤 드롭 가능)
              </label>
              {images.length > 0 && (
                <div className="images-preview">
                  {images.map((img, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={img} alt={`Preview ${index + 1}`} className="preview-img" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(index)} 
                        className="remove-img-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="help-text">* 최대 10개까지 업로드 가능합니다. 큰 이미지는 자동으로 압축됩니다.</p>
          </div>

          {/* 비디오 추가 */}
          <div className="form-group">
            <label>비디오 추가</label>
            <div 
              className={`video-upload-box ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="video-upload-actions">
                <button 
                  type="button" 
                  onClick={handleVideoAdd}
                  className="video-add-btn"
                >
                  🎥 비디오 URL 추가하기
                </button>
                <input 
                  type="file" 
                  accept="video/*" 
                  multiple
                  onChange={(e) => handleVideoFileChange(e.target.files)}
                  id="video-file-input" 
                  style={{display:'none'}} 
                />
                <label htmlFor="video-file-input" className="video-file-btn">
                  📁 비디오 파일 선택 (드래그 앤 드롭 가능)
                </label>
              </div>
              {videos.length > 0 && (
                <div className="videos-list">
                  {videos.map((video, index) => (
                    <div key={index} className="video-item">
                      {video.startsWith('data:video/') ? (
                        <video src={video} controls className="video-preview" style={{maxWidth: '200px', maxHeight: '150px'}} />
                      ) : (
                        <span className="video-url">{video.length > 50 ? video.substring(0, 50) + '...' : video}</span>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removeVideo(index)} 
                        className="remove-video-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="help-text">* YouTube, Vimeo 등의 비디오 URL을 입력하거나, 비디오 파일을 드래그 앤 드롭하세요. 에디터 내에서도 비디오를 추가할 수 있습니다.</p>
          </div>
          
          {/* 리치 텍스트 에디터 */}
          <div className="form-group">
            <label>내용</label>
            <RichTextEditor 
              value={content} 
              onChange={setContent}
              placeholder="내용을 입력하세요. 텍스트 서식, 이미지, 비디오 등을 추가할 수 있습니다."
            />
            <div className="editor-tips">
              <p className="help-text">
                <strong>💡 폰트 설정 방법:</strong> 
                <br />1. 텍스트를 드래그하여 선택하세요
                <br />2. 에디터 상단 툴바에서 원하는 옵션을 클릭하세요
                <br />• <strong>H1~H6:</strong> 제목 크기 설정
                <br />• <strong>폰트:</strong> 폰트 종류 변경
                <br />• <strong>크기:</strong> 텍스트 크기 조절
                <br />• <strong>B/I/U:</strong> 굵게/기울임/밑줄
                <br />• <strong>색상:</strong> 텍스트 색상 및 배경색
                <br />• <strong>이미지/비디오:</strong> 미디어 추가
              </p>
            </div>
          </div>

          {/* 미리보기 */}
          {content && (
            <div className="form-group">
              <label>미리보기</label>
              <div 
                className="content-preview"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}

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
        .form-group label { font-weight: bold; font-size: 14px; color: #333; margin-bottom: 8px; }
        .form-group input, .form-group textarea, .select-input { padding: 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; transition: 0.2s; width: 100%; }
        .form-group input:focus, .form-group textarea:focus, .select-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,186,255, 0.1); }
        .char-count { font-size: 12px; color: #999; text-align: right; margin-top: 4px; }
        
        /* 카테고리 선택 */
        .category-selector { display: flex; flex-wrap: wrap; gap: 8px; }
        .category-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: 2px solid #ddd; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; font-size: 14px; }
        .category-btn:hover { border-color: var(--blue); background: #f0f7ff; }
        .category-btn.active { border-color: var(--blue); background: var(--blue); color: white; }
        .category-icon { font-size: 18px; }
        
        /* 이미지 업로드 */
        .image-upload-box { border: 2px dashed #ddd; padding: 30px; text-align: center; border-radius: 8px; transition: all 0.3s; background: #fafafa; }
        .image-upload-box.dragging { border-color: var(--blue); background: #f0f7ff; }
        .upload-btn { display: inline-block; padding: 12px 24px; background: #eee; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .upload-btn:hover { background: #ddd; }
        .images-preview { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-top: 20px; }
        .image-preview-item { position: relative; border-radius: 8px; overflow: hidden; }
        .preview-img { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; }
        .remove-img-btn { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: rgba(255, 77, 79, 0.9); color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .remove-img-btn:hover { background: #ff4d4f; }
        
        /* 비디오 업로드 */
        .video-upload-box { border: 2px dashed #ddd; padding: 20px; border-radius: 8px; background: #fafafa; transition: all 0.3s; }
        .video-upload-box.dragging { border-color: var(--blue); background: #f0f7ff; }
        .video-upload-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .video-add-btn, .video-file-btn { padding: 10px 20px; background: #eee; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .video-add-btn:hover, .video-file-btn:hover { background: #ddd; }
        .video-file-btn { display: inline-block; }
        .videos-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .video-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; background: white; border-radius: 6px; border: 1px solid #eee; gap: 12px; }
        .video-url { font-size: 13px; color: #666; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .video-preview { border-radius: 6px; }
        .remove-video-btn { width: 24px; height: 24px; background: #ff4d4f; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .remove-video-btn:hover { background: #ff3333; }
        
        /* 미리보기 */
        .content-preview { padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; min-height: 100px; max-height: 400px; overflow-y: auto; }
        .content-preview :global(img) { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
        .content-preview :global(iframe) { max-width: 100%; border-radius: 8px; margin: 10px 0; }
        
        .help-text { font-size: 12px; color: #999; margin-top: 4px; line-height: 1.6; }
        .editor-tips { margin-top: 8px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid var(--blue); }
        .editor-tips .help-text { margin: 0; }
        
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .cancel-btn { padding: 12px 24px; background: #f0f0f0; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.2s; }
        .cancel-btn:hover { background: #e0e0e0; }
        .submit-btn { padding: 12px 24px; background: var(--blue); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
        .submit-btn:hover { background: #009acD; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,186,255,0.3); }
        
        @media (max-width: 640px) { 
          .nav { overflow-x: auto; padding-bottom: 4px; } 
          .write-form { padding: 20px; } 
          .category-selector { flex-direction: column; }
          .category-btn { width: 100%; justify-content: center; }
          .images-preview { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </main>
  );
}