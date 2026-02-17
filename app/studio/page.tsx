"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// 댓글 타입 정의
type Comment = {
  id: number;
  user: string;
  text: string;
  date: string;
  rating: number;
  avatarColor?: string;
};

export default function StudioPage() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [tools, setTools] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  const [hoverState, setHoverState] = useState<{ id: number, score: number } | null>(null);

  // 상세 모달 상태
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState("INFO");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    loadTools();
  }, []);

  function loadTools() {
    const savedTools = JSON.parse(localStorage.getItem("dori_tools_v11") || "[]");
    const savedVotes = JSON.parse(localStorage.getItem("dori_my_votes_v4") || "{}");

    setMyVotes(savedVotes);

    if (savedTools.length === 0) {
      // 데이터가 없으면 초기 데이터 로드 (데이터 내용은 기존과 동일하므로 생략하지 않고 포함)
      const initialData = [
        // 1. [LLM & Chatbots]
        { id: 101, title: "ChatGPT", category: "TEXT", desc: "가장 똑똑하고 범용적인 대화형 AI 표준", logo: "https://logo.clearbit.com/openai.com", price: "Freemium", rating: 0, reviews: 0, link: "https://chat.openai.com", history: "2022.11 GPT-3.5 출시\n2023.03 GPT-4 공개\n2024.05 GPT-4o 멀티모달 업데이트", news: "GPT-4o 모델 업데이트로 멀티모달 기능 강화.", commentsList: [] },
        { id: 102, title: "Claude", category: "TEXT", desc: "자연스러운 한국어와 뛰어난 코딩/작문 능력", logo: "https://logo.clearbit.com/anthropic.com", price: "Free", rating: 0, reviews: 0, link: "https://claude.ai", history: "OpenAI 출신 연구원들이 설립한 Anthropic에서 개발.", news: "Claude 3.5 Sonnet 출시 이후 성능 입증.", commentsList: [] },
        { id: 103, title: "Perplexity", category: "TEXT", desc: "실시간 웹 검색 기반의 AI 검색엔진", logo: "https://logo.clearbit.com/perplexity.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.perplexity.ai", history: "전통적인 검색엔진을 대체하기 위해 등장.", news: "Pro Search 기능 고도화.", commentsList: [] },
        { id: 104, title: "Gemini", category: "TEXT", desc: "구글 생태계 연동 멀티모달 AI", logo: "https://logo.clearbit.com/deepmind.google", price: "Free", rating: 0, reviews: 0, link: "https://gemini.google.com", history: "구글의 바드(Bard) 리브랜딩.", news: "1.5 Pro 모델 업데이트.", commentsList: [] },

        // 2. [IMAGE Generation]
        { id: 201, title: "Midjourney", category: "IMAGE", desc: "예술적 퀄리티가 압도적인 생성 툴", logo: "https://logo.clearbit.com/midjourney.com", price: "Paid", rating: 0, reviews: 0, link: "https://midjourney.com", history: "디스코드 기반 독보적 화풍.", news: "웹사이트 생성 기능 오픈.", commentsList: [] },
        { id: 202, title: "Stable Diffusion", category: "IMAGE", desc: "내 PC에 설치해 제한 없이 쓰는 강력한 도구", logo: "https://logo.clearbit.com/stability.ai", price: "Free", rating: 0, reviews: 0, link: "https://stability.ai", history: "오픈소스 생성형 AI 표준.", news: "SD3 모델 발표.", commentsList: [] },

        // 3. [VIDEO Creation]
        { id: 301, title: "Runway", category: "VIDEO", desc: "텍스트로 영화 같은 영상 제작", logo: "https://logo.clearbit.com/runwayml.com", price: "Freemium", rating: 0, reviews: 0, link: "https://runwayml.com", history: "영상 생성 AI 선구자.", news: "Gen-3 Alpha 공개.", commentsList: [] },
        { id: 302, title: "Pika", category: "VIDEO", desc: "이미지 움직임 효과 최강자", logo: "https://logo.clearbit.com/pika.art", price: "Free", rating: 0, reviews: 0, link: "https://pika.art", history: "애니메이션 스타일 강점.", news: "Lip Sync 기능.", commentsList: [] },

        // 4. [SOUND]
        { id: 401, title: "Suno", category: "SOUND", desc: "가사만 입력하면 작곡/보컬까지 완성", logo: "https://logo.clearbit.com/suno.com", price: "Free", rating: 0, reviews: 0, link: "https://suno.com", history: "음악 생성의 혁명.", news: "v3.5 모델 업데이트.", commentsList: [] },
        { id: 402, title: "ElevenLabs", category: "SOUND", desc: "자연스러운 TTS 및 보이스 클로닝", logo: "https://logo.clearbit.com/elevenlabs.io", price: "Freemium", rating: 0, reviews: 0, link: "https://elevenlabs.io", history: "AI 음성 합성 1위.", news: "다국어 더빙 기능.", commentsList: [] },

        // 5. [AUTOMATION]
        { id: 501, title: "Make", category: "AUTOMATION", desc: "복잡한 워크플로우 시각적 자동화", logo: "https://logo.clearbit.com/make.com", price: "Freemium", rating: 0, reviews: 0, link: "https://www.make.com", history: "노코드 자동화 툴.", news: "AI 에이전트 통합.", commentsList: [] },
        { id: 502, title: "Zapier", category: "AUTOMATION", desc: "앱 연동 자동화의 대명사", logo: "https://logo.clearbit.com/zapier.com", price: "Freemium", rating: 0, reviews: 0, link: "https://zapier.com", history: "가장 많은 앱 통합 지원.", news: "Zapier Canvas 출시.", commentsList: [] },
      ];
      setTools(initialData);
      localStorage.setItem("dori_tools_v11", JSON.stringify(initialData));
    } else {
      setTools(savedTools);
    }
  }

  const handleVote = (id: number, score: number) => {
    if (!user) { alert("로그인이 필요합니다."); return; }
    const previousVote = myVotes[id];
    const updatedTools = tools.map(tool => {
      if (tool.id === id) {
        let newRating, newReviewCount;
        if (previousVote) {
          const currentTotal = tool.rating * tool.reviews;
          const newTotal = currentTotal - previousVote + score;
          newReviewCount = tool.reviews;
          newRating = newTotal / newReviewCount;
        } else {
          const currentTotal = tool.rating * tool.reviews;
          newReviewCount = tool.reviews + 1;
          newRating = (currentTotal + score) / newReviewCount;
        }
        if (isNaN(newRating)) newRating = score;
        return { ...tool, rating: parseFloat(newRating.toFixed(2)), reviews: newReviewCount };
      }
      return tool;
    });

    const sortedTools = updatedTools.sort((a, b) => b.rating - a.rating);
    setTools(sortedTools);
    const newMyVotes = { ...myVotes, [id]: score };
    setMyVotes(newMyVotes);
    localStorage.setItem("dori_tools_v11", JSON.stringify(sortedTools));
    localStorage.setItem("dori_my_votes_v4", JSON.stringify(newMyVotes));
  };

  const handleReviewSubmit = () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!reviewText.trim()) return alert("리뷰 내용을 입력해주세요.");

    // localStorage에서 설정된 이름 가져오기 (일관된 이름 사용)
    const savedName = user?.email
      ? localStorage.getItem(`dori_user_name_${user.email}`) || user.name || "익명"
      : "익명";

    const colors = ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF", "#BDB2FF"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newComment: Comment = {
      id: Date.now(), user: savedName, text: reviewText,
      date: new Date().toLocaleDateString(), rating: reviewRating, avatarColor: randomColor
    };

    const updatedTools = tools.map(tool => {
      if (tool.id === selectedTool.id) {
        const updatedTool = { ...tool, commentsList: [newComment, ...(tool.commentsList || [])] };
        handleVote(tool.id, reviewRating);
        return updatedTool;
      }
      return tool;
    });
    setTools(updatedTools);
    localStorage.setItem("dori_tools_v11", JSON.stringify(updatedTools));
    const newSelectedTool = updatedTools.find(t => t.id === selectedTool.id);
    setSelectedTool(newSelectedTool);
    setReviewText("");
    alert("리뷰가 등록되었습니다.");
  };

  const handleSuggest = () => {
    if (!user) return alert("로그인이 필요한 기능입니다.");
    router.push("/community/write");
  };

  const categoryList = [
    { key: "TEXT", label: "🤖 Text & LLM", color: "#E3F2FD", text: "#1565C0" },
    { key: "IMAGE", label: "🎨 Image & Art", color: "#FCE4EC", text: "#C2185B" },
    { key: "VIDEO", label: "🎬 Video & Motion", color: "#FFF3E0", text: "#E65100" },
    { key: "SOUND", label: "🎵 Sound & Voice", color: "#F3E5F5", text: "#7B1FA2" },
    { key: "AUTOMATION", label: "⚡ Automation", color: "#FFF8E1", text: "#FF6F00" },
  ];

  const activeCategories = selectedCategory === "ALL" ? categoryList : categoryList.filter(c => c.key === selectedCategory);
  const getCatColor = (catKey: string) => categoryList.find(c => c.key === catKey) || { color: '#eee', text: '#666' };

  return (
    <main className="studio-page">
      <div className="container">
        <header className="page-header">
          <h1>AI Tools Ranking</h1>
          <p>엄선된 AI 툴 데이터베이스와 생생한 유저 리뷰</p>
        </header>

        <div className="toolbar">
          <div className="tabs">
            <button className={`tab ${selectedCategory === "ALL" ? 'active' : ''}`} onClick={() => setSelectedCategory("ALL")}>All</button>
            {categoryList.map((cat) => (
              <button key={cat.key} className={`tab ${selectedCategory === cat.key ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.key)}>{cat.label}</button>
            ))}
          </div>
          <div className="search">
            <input type="text" placeholder="Search tools..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="content-area">
          {activeCategories.map((cat) => {
            let categoryTools = tools.filter(t => t.category === cat.key).filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
            categoryTools.sort((a, b) => b.rating - a.rating); // 랭킹순 정렬
            if (categoryTools.length === 0) return null;

            return (
              <section key={cat.key} className="category-section">
                <h2 style={{ color: cat.text }}>{cat.label}</h2>
                <div className="grid">
                  {categoryTools.map((item, index) => {
                    const rank = item.reviews > 0 ? index + 1 : null;
                    const catStyle = getCatColor(item.category);
                    return (
                      <div key={item.id} className="card" onClick={() => setSelectedTool(item)}>
                        {rank && rank <= 3 && <div className={`badge rank-${rank}`}>{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</div>}
                        <div className="card-header">
                          <img src={item.logo} alt={item.title} className="logo" onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60?text=AI'} />
                          <span className={`price ${item.price === 'Free' ? 'free' : ''}`}>{item.price}</span>
                        </div>
                        <div className="card-body">
                          <span className="cat-label" style={{ backgroundColor: catStyle.color, color: catStyle.text }}>{item.category}</span>
                          <h3>{item.title}</h3>
                          <p>{item.desc}</p>
                        </div>
                        <div className="card-footer">
                          <div className="rating">
                            <span>⭐ {item.reviews > 0 ? item.rating : "0.0"}</span>
                            <span className="count">({item.reviews})</span>
                          </div>
                          <button className="btn-detail">상세보기</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="suggestion-box">
          <h3>알고 있는 좋은 AI 툴이 있나요?</h3>
          <button onClick={handleSuggest}>툴 추천하기</button>
        </div>
      </div>

      {/* MODAL */}
      {selectedTool && (
        <div className="modal-overlay" onClick={() => setSelectedTool(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedTool(null)}>✕</button>
            <div className="modal-header">
              <img src={selectedTool.logo} alt="logo" className="modal-logo" />
              <div className="modal-title">
                <h2>{selectedTool.title}</h2>
                <div className="tags">
                  <span className="tag">{selectedTool.category}</span>
                  <span className="tag">{selectedTool.price}</span>
                </div>
              </div>
              <a href={selectedTool.link} target="_blank" className="visit-btn">Visit Website →</a>
            </div>

            <div className="modal-nav">
              <button className={modalTab === "INFO" ? "active" : ""} onClick={() => setModalTab("INFO")}>Information</button>
              <button className={modalTab === "REVIEW" ? "active" : ""} onClick={() => setModalTab("REVIEW")}>Reviews ({selectedTool.commentsList?.length || 0})</button>
            </div>

            <div className="modal-body">
              {modalTab === "INFO" ? (
                <div className="info-tab">
                  <div className="info-box"><h4>Description</h4><p>{selectedTool.desc}</p></div>
                  <div className="info-box">
                    <h4>History</h4>
                    <ul className="timeline">
                      {selectedTool.history?.split('\n').map((line: string, i: number) => <li key={i}>{line}</li>)}
                    </ul>
                  </div>
                  <div className="info-box"><h4>Latest News</h4><p>{selectedTool.news}</p></div>
                </div>
              ) : (
                <div className="review-tab">
                  <div className="review-input-box"> {/* 🔥 className 수정 완료 */}
                    <textarea placeholder="이 툴에 대한 솔직한 리뷰를 남겨주세요." value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    <div className="review-actions">
                      <div className="stars-input">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s}
                            className={`star ${s <= (hoverState?.score || reviewRating) ? 'on' : ''}`}
                            onClick={() => setReviewRating(s)}
                            onMouseEnter={() => setHoverState({ id: 0, score: s })}
                            onMouseLeave={() => setHoverState(null)}
                          >★</span>
                        ))}
                      </div>
                      <button onClick={handleReviewSubmit}>리뷰 등록</button>
                    </div>
                  </div>
                  <div className="review-list">
                    {selectedTool.commentsList?.map((c: Comment) => (
                      <div key={c.id} className="review-item">
                        <div className="avatar" style={{ background: c.avatarColor }}>{c.user[0]}</div>
                        <div className="content">
                          <div className="head"><span className="name">{c.user}</span><span className="date">{c.date}</span></div>
                          <div className="stars">{"⭐".repeat(c.rating)}</div>
                          <p>{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Reset & Base */
        .studio-page { background-color: #f8f9fa; min-height: 100vh; color: #333; padding-bottom: 80px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        .page-header { text-align: center; padding: 60px 0 40px; }
        .page-header h1 { font-size: 48px; font-weight: 900; margin-bottom: 10px; color: #111; letter-spacing: -1px; }
        .page-header p { font-size: 18px; color: #666; }

        /* Toolbar */
        .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
        .tabs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
        .tab { padding: 10px 24px; border-radius: 30px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: 600; color: #666; transition: 0.2s; white-space: nowrap; }
        .tab:hover { background: #f0f0f0; }
        .tab.active { background: #111; color: white; border-color: #111; }
        
        .search { position: relative; width: 300px; }
        .search input { width: 100%; padding: 12px 20px; padding-right: 40px; border-radius: 25px; border: 1px solid #ddd; outline: none; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .search input:focus { border-color: #111; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .search-icon { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); opacity: 0.5; }

        /* Grid & Cards */
        .category-section { margin-bottom: 60px; }
        .category-section h2 { font-size: 26px; font-weight: 800; margin-bottom: 20px; padding-left: 10px; border-left: 4px solid #333; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
        
        .card { background: white; border-radius: 20px; padding: 25px; position: relative; transition: all 0.3s ease; border: 1px solid #eee; cursor: pointer; display: flex; flex-direction: column; height: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); border-color: #ddd; }
        
        .badge { position: absolute; top: 15px; right: 15px; background: #fff; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .logo { width: 56px; height: 56px; border-radius: 14px; object-fit: cover; border: 1px solid #f0f0f0; }
        .price { font-size: 12px; font-weight: 700; padding: 5px 10px; background: #f5f5f5; border-radius: 8px; color: #555; }
        .price.free { background: #e3f2fd; color: #1565c0; }

        .card-body { flex: 1; }
        .cat-label { font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 6px; margin-bottom: 10px; display: inline-block; }
        .card-body h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #111; }
        .card-body p { font-size: 14px; color: #666; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        .card-footer { margin-top: 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f5f5f5; padding-top: 15px; }
        .rating { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 4px; }
        .count { color: #999; font-weight: 400; font-size: 13px; }
        .btn-detail { background: none; border: none; color: #111; font-weight: 600; font-size: 13px; cursor: pointer; text-decoration: underline; }

        .suggestion-box { text-align: center; margin-top: 80px; background: white; padding: 40px; border-radius: 20px; border: 1px solid #eee; }
        .suggestion-box button { margin-top: 15px; padding: 12px 30px; background: #111; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px); z-index: 100; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .modal-content { background: white; width: 100%; max-width: 800px; max-height: 90vh; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: floatUp 0.3s ease; }
        @keyframes floatUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .close-btn { position: absolute; top: 20px; right: 20px; font-size: 24px; background: none; border: none; cursor: pointer; color: #999; z-index: 10; }
        
        .modal-header { padding: 40px; background: #fafafa; display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #eee; }
        .modal-logo { width: 80px; height: 80px; border-radius: 20px; border: 1px solid #eee; background: white; padding: 5px; object-fit: contain; }
        .modal-title h2 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .tags { display: flex; gap: 8px; }
        .tag { font-size: 12px; font-weight: 600; background: #eee; padding: 4px 10px; border-radius: 6px; color: #555; }
        .visit-btn { margin-left: auto; background: #111; color: white; padding: 10px 20px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; }

        .modal-nav { display: flex; padding: 0 40px; border-bottom: 1px solid #eee; background: white; }
        .modal-nav button { padding: 15px 0; margin-right: 30px; background: none; border: none; border-bottom: 3px solid transparent; font-weight: 600; color: #999; cursor: pointer; }
        .modal-nav button.active { color: #111; border-color: #111; }

        .modal-body { padding: 40px; overflow-y: auto; background: white; flex: 1; }
        .info-box { margin-bottom: 30px; }
        .info-box h4 { font-size: 16px; font-weight: 700; margin-bottom: 10px; color: #111; }
        .info-box p, .info-box li { color: #555; line-height: 1.6; }
        .timeline { padding-left: 20px; }

        .review-input-box { background: #f8f9fa; padding: 20px; border-radius: 16px; margin-bottom: 30px; }
        .review-input-box textarea { width: 100%; height: 80px; border: 1px solid #ddd; border-radius: 12px; padding: 15px; margin-bottom: 15px; font-family: inherit; resize: none; }
        .review-actions { display: flex; justify-content: space-between; align-items: center; }
        .star { font-size: 24px; color: #ddd; cursor: pointer; transition: 0.2s; }
        .star.on { color: #ffd700; }
        .review-actions button { background: #111; color: white; padding: 8px 20px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; }

        .review-item { display: flex; gap: 15px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #555; font-size: 14px; flex-shrink: 0; }
        .review-item .content { flex: 1; }
        .head { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
        .head .name { font-weight: 700; } .head .date { color: #999; }
        .review-item p { color: #444; margin-top: 5px; line-height: 1.5; }
        
        @media (max-width: 768px) {
          .toolbar { flex-direction: column-reverse; align-items: stretch; }
          .search { width: 100%; }
          .modal-header { flex-direction: column; text-align: center; }
          .visit-btn { margin: 0; width: 100%; text-align: center; }
        }
      `}</style>
    </main>
  );
}