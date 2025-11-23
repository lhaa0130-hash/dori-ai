"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

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
  const { data: session } = useSession();
  const user = session?.user || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  
  const [tools, setTools] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<number, number>>({});
  
  // 별점 호버 상태
  const [hoverState, setHoverState] = useState<{id: number, score: number} | null>(null);

  // 상세 모달 상태
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState("INFO");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    loadTools();
  }, []);

  function loadTools() {
    const savedTools = JSON.parse(localStorage.getItem("dori_tools_v8") || "[]");
    const savedVotes = JSON.parse(localStorage.getItem("dori_my_votes_v3") || "{}");
    setMyVotes(savedVotes);

    if (savedTools.length === 0) {
        // 데이터가 없으면 초기화 (생략: 이전 코드와 동일한 데이터가 들어간다고 가정)
        const initialData = [
           { 
            id: 101, title: "ChatGPT", category: "LLM", desc: "가장 똑똑하고 범용적인 대화형 AI 표준", logo: "https://logo.clearbit.com/openai.com", price: "Freemium", rating: 0, reviews: 0, link: "https://chat.openai.com",
            history: "2022.11 GPT-3.5 출시\n2023.03 GPT-4 공개\n2024.05 GPT-4o 멀티모달 업데이트",
            news: "OpenAI, 차세대 모델 'Strawberry' 개발 중이라는 소문 확산",
            commentsList: []
          },
          { 
            id: 201, title: "Midjourney", category: "IMAGE", desc: "압도적인 예술적 퀄리티의 이미지 생성", logo: "https://logo.clearbit.com/midjourney.com", price: "Paid", rating: 0, reviews: 0, link: "https://midjourney.com",
            history: "2022.07 오픈 베타 시작\n2023.12 V6 모델 출시 (텍스트 묘사 강화)",
            news: "웹사이트에서 이미지 생성 기능 전면 개방 예정",
            commentsList: []
          },
          // ... (나머지 데이터 생략 - 빌드 시엔 로컬스토리지에서 불러오므로 문제 없음)
        ];
        setTools(initialData);
        localStorage.setItem("dori_tools_v8", JSON.stringify(initialData));
    } else {
      setTools(savedTools);
    }
  }

  function onLogout() { signOut({ callbackUrl: "/" }); }

  const handleVote = (id: number, score: number) => {
    if (!user) return alert("로그인이 필요합니다.");
    
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
        // NaN 방지
        if(isNaN(newRating)) newRating = score;

        return { ...tool, rating: parseFloat(newRating.toFixed(2)), reviews: newReviewCount };
      }
      return tool;
    });

    const sortedTools = updatedTools.sort((a, b) => {
        if (a.reviews === 0 && b.reviews === 0) return 0;
        if (a.reviews === 0) return 1;
        if (b.reviews === 0) return -1;
        return b.rating - a.rating;
    });

    setTools(sortedTools);
    const newMyVotes = { ...myVotes, [id]: score };
    setMyVotes(newMyVotes);
    localStorage.setItem("dori_tools_v8", JSON.stringify(sortedTools));
    localStorage.setItem("dori_my_votes_v3", JSON.stringify(newMyVotes));
  };

  const handleReviewSubmit = () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!reviewText.trim()) return alert("내용을 입력해주세요.");

    const colors = ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF", "#BDB2FF", "#FFC6FF"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newComment: Comment = {
      id: Date.now(),
      user: user.name || "익명",
      text: reviewText,
      date: new Date().toLocaleDateString(),
      rating: reviewRating,
      avatarColor: randomColor
    };

    const updatedTools = tools.map(tool => {
      if (tool.id === selectedTool.id) {
        const updatedTool = { ...tool, commentsList: [newComment, ...(tool.commentsList || [])] };
        handleVote(tool.id, reviewRating);
        return updatedTool;
      }
      return tool;
    });

    const sortedTools = updatedTools.sort((a, b) => {
        if (a.reviews === 0 && b.reviews === 0) return 0;
        return b.rating - a.rating;
    });
    setTools(sortedTools);
    localStorage.setItem("dori_tools_v8", JSON.stringify(sortedTools));
    
    const newSelectedTool = sortedTools.find(t => t.id === selectedTool.id);
    setSelectedTool(newSelectedTool);
    setReviewText("");
  };

  const categoryList = [
    { key: "LLM", label: "🤖 Chat & LLM", color: "#E3F2FD", text: "#1565C0" },
    { key: "IMAGE", label: "🎨 Image Gen", color: "#FCE4EC", text: "#C2185B" },
    { key: "VIDEO", label: "🎬 Video Gen", color: "#FFF3E0", text: "#E65100" },
    { key: "MUSIC", label: "🎵 Music Gen", color: "#F3E5F5", text: "#7B1FA2" },
    { key: "VOICE", label: "🗣️ Voice AI", color: "#E8F5E9", text: "#2E7D32" },
    { key: "AUDIO", label: "🎧 Audio Edit", color: "#E0F7FA", text: "#006064" },
    { key: "AUTOMATION", label: "⚡ Automation", color: "#FFF8E1", text: "#FF6F00" },
  ];

  const activeCategories = selectedCategory === "ALL" ? categoryList : categoryList.filter(c => c.key === selectedCategory);

  const getCatColor = (catKey: string) => categoryList.find(c => c.key === catKey) || { color: '#eee', text: '#666' };

  return (
    <main className="page">
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "80vh", paddingTop: "60px" }}>
        <div className="page-header">
          <h1 className="page-title">AI Tools Library</h1>
          <p className="page-desc">엄선된 AI 툴 데이터베이스와 생생한 유저 리뷰</p>
        </div>

        <div className="filter-bar">
          <div className="category-tabs">
            <button className={`tab-btn ${selectedCategory === "ALL" ? 'active' : ''}`} onClick={() => setSelectedCategory("ALL")}>전체 보기</button>
            {categoryList.map((cat) => (
              <button key={cat.key} className={`tab-btn ${selectedCategory === cat.key ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.key)}>{cat.label}</button>
            ))}
          </div>
          <div className="search-wrap">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <span className="icon">🔍</span>
          </div>
        </div>

        <div className="ranking-content">
          {activeCategories.map((cat) => {
            let categoryTools = tools.filter(t => t.category === cat.key).filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
            categoryTools.sort((a, b) => (a.reviews === 0 && b.reviews === 0) ? 0 : b.rating - a.rating);

            if (categoryTools.length === 0) return null;

            return (
              <div key={cat.key} className="category-section">
                <h2 className="section-title" style={{ borderLeftColor: cat.text }}>{cat.label}</h2>
                <div className="ranking-grid">
                  {categoryTools.map((item, index) => {
                    const hasRank = item.reviews > 0;
                    const rank = hasRank ? index + 1 : null;
                    const isTop3 = rank && rank <= 3;
                    const catStyle = getCatColor(item.category);

                    return (
                      <div key={item.id} className={`resource-card ${isTop3 ? `rank-${rank}` : ''}`} onClick={() => setSelectedTool(item)}>
                        {hasRank && <div className="rank-badge">{rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}</div>}
                        
                        <div className="card-top">
                          <div className="card-logo-wrap">
                            <img src={item.logo} alt={item.title} className="card-logo" onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60?text=AI'} />
                          </div>
                          <span className={`price-badge ${item.price === 'Free' ? 'free' : ''}`}>{item.price}</span>
                        </div>
                        
                        <div className="card-info">
                          <span className="mini-cat" style={{ backgroundColor: catStyle.color, color: catStyle.text }}>{item.category}</span>
                          <h3>{item.title}</h3>
                          <p>{item.desc}</p>
                        </div>

                        <div className="rating-preview">
                          <span className="star">⭐ {item.rating > 0 ? item.rating : "-"}</span>
                          <span className="review-cnt">({item.reviews} reviews)</span>
                        </div>
                        
                        <div className="card-hover-action">클릭하여 상세정보 보기</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selectedTool && (
        <div className="modal-overlay" onClick={() => setSelectedTool(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTool(null)}>✕</button>
            
            <div className="modal-header-area">
              <div className="modal-bg-blur"></div>
              <div className="modal-header-inner">
                <div className="modal-logo-large">
                  <img src={selectedTool.logo} alt="logo" onError={(e) => e.currentTarget.src = 'https://placehold.co/80x80?text=AI'}/>
                </div>
                <div className="modal-title-group">
                  <h2>{selectedTool.title}</h2>
                  <div className="modal-tags">
                    <span className="m-tag cat">{selectedTool.category}</span>
                    <span className="m-tag price">{selectedTool.price}</span>
                  </div>
                </div>
                <a href={selectedTool.link} target="_blank" className="modal-visit-btn">공식 홈페이지 →</a>
              </div>
            </div>

            <div className="modal-tabs">
              <button className={`m-tab ${modalTab === "INFO" ? "active" : ""}`} onClick={() => setModalTab("INFO")}>상세 정보</button>
              <button className={`m-tab ${modalTab === "REVIEW" ? "active" : ""}`} onClick={() => setModalTab("REVIEW")}>유저 리뷰 <span className="count">{selectedTool.commentsList?.length || 0}</span></button>
            </div>

            <div className="modal-body">
              {modalTab === "INFO" ? (
                <div className="info-view fade-in">
                  <div className="info-card">
                    <h4>💡 서비스 소개</h4>
                    <p>{selectedTool.desc}</p>
                  </div>

                  <div className="info-card">
                    <h4>📜 주요 연혁 (History)</h4>
                    <div className="timeline">
                      {selectedTool.history ? selectedTool.history.split('\n').map((line: string, i: number) => (
                        <div key={i} className="timeline-item">
                          <div className="dot"></div>
                          <p>{line}</p>
                        </div>
                      )) : <p className="no-data">등록된 연혁이 없습니다.</p>}
                    </div>
                  </div>

                  <div className="info-card">
                    <h4>📰 최신 뉴스</h4>
                    <div className="news-box">
                      <span className="news-icon">📢</span>
                      <p>{selectedTool.news || "관련 뉴스가 없습니다."}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="review-view fade-in">
                  <div className="rating-panel">
                    <div className="big-score">
                      <span className="score-num">{selectedTool.rating || 0}</span>
                      <span className="score-max">/ 5.0</span>
                    </div>
                    <div className="my-vote">
                      <p>나의 평가</p>
                      <div 
                        className="stars"
                        onMouseLeave={() => setHoverState(null)} // 마우스 떠나면 초기화
                      >
                        {[1,2,3,4,5].map(s => {
                          // ★ 수정된 호버 로직: null 체크 추가
                          const isHovered = hoverState !== null && s <= hoverState.score;
                          const isSelected = hoverState === null && myVotes[selectedTool.id] >= s;
                          
                          return (
                            <span 
                              key={s} 
                              className={`star-l ${isHovered || isSelected ? 'on' : ''}`} 
                              onClick={() => handleVote(selectedTool.id, s)}
                              onMouseEnter={() => setHoverState({id: selectedTool.id, score: s})}
                            >★</span>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="review-input-box">
                    <textarea placeholder="사용 후기를 남겨주세요. (최소 10자)" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    <button onClick={handleReviewSubmit}>등록</button>
                  </div>

                  <div className="review-list">
                    {selectedTool.commentsList?.length > 0 ? selectedTool.commentsList.map((c: Comment) => (
                      <div key={c.id} className="review-bubble-row">
                        <div className="review-avatar" style={{background: c.avatarColor || '#eee'}}>
                          {c.user[0]?.toUpperCase()}
                        </div>
                        <div className="review-bubble">
                          <div className="rb-header">
                            <span className="rb-user">{c.user}</span>
                            <span className="rb-rating">{"⭐".repeat(c.rating)}</span>
                            <span className="rb-date">{c.date}</span>
                          </div>
                          <p className="rb-text">{c.text}</p>
                        </div>
                      </div>
                    )) : <div className="no-review">아직 리뷰가 없습니다. 첫 번째 리뷰어가 되어주세요!</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .page-header { text-align: center; margin-bottom: 60px; }
        .page-title { font-size: 42px; font-weight: 800; margin-bottom: 12px; color: var(--text-main); }
        .page-desc { font-size: 16px; color: var(--text-sub); line-height: 1.6; }
        .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; border-bottom: 1px solid var(--line); padding-bottom: 20px; }
        .category-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .tab-btn { padding: 8px 20px; border-radius: 20px; border: 1px solid var(--line); background: white; cursor: pointer; font-weight: 600; color: var(--text-sub); transition: 0.2s; font-size: 14px; white-space: nowrap; }
        .tab-btn.active { background: var(--text-main); color: white; border-color: var(--text-main); }
        .search-wrap { position: relative; width: 260px; }
        .search-wrap input { width: 100%; padding: 10px 16px; padding-right: 40px; border: 1px solid var(--line); border-radius: 12px; font-size: 14px; outline: none; transition: 0.2s; background: #f9f9f9; }
        .search-wrap input:focus { border-color: var(--blue); background: white; box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }
        .search-wrap .icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); opacity: 0.5; font-size: 14px; }
        
        .category-section { margin-bottom: 80px; }
        .section-title { font-size: 28px; font-weight: 800; color: var(--text-main); margin-bottom: 24px; padding-left: 12px; border-left: 5px solid var(--blue); line-height: 1.2; letter-spacing: -0.5px; }
        .ranking-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        
        .resource-card { background: white; border: 1px solid var(--line); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); cursor: pointer; position: relative; overflow: hidden; }
        .resource-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-color: var(--blue); }
        
        .resource-card.rank-1 { border: 2px solid #FFD700; background: linear-gradient(to bottom right, #fff, #fffdf0); }
        .rank-badge { position: absolute; top: 0; left: 0; background: #f0f0f0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; border-bottom-right-radius: 16px; z-index: 10; }
        .rank-1 .rank-badge { background: #FFD700; font-size: 22px; } 
        
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; padding-left: 10px; }
        .card-logo-wrap { width: 52px; height: 52px; background: #fff; border: 1px solid #eee; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .card-logo { width: 100%; height: 100%; object-fit: contain; }
        .price-badge { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: #f0f0f0; color: #666; }
        
        .mini-cat { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-bottom: 6px; }
        .card-info h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; color: var(--text-main); }
        .card-info p { font-size: 14px; color: var(--text-sub); line-height: 1.5; margin: 0; height: 42px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        
        .rating-preview { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-main); }
        .review-cnt { color: #999; font-weight: 400; font-size: 12px; }

        .card-hover-action { position: absolute; bottom: 0; left: 0; width: 100%; padding: 12px; background: var(--blue); color: white; text-align: center; font-size: 13px; font-weight: 600; transform: translateY(100%); transition: 0.3s; }
        .resource-card:hover .card-hover-action { transform: translateY(0); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
        .modal-content { background: #fff; width: 700px; max-width: 95vw; height: 85vh; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 60px rgba(0,0,0,0.3); }
        .modal-close { position: absolute; top: 20px; right: 20px; z-index: 10; background: rgba(255,255,255,0.5); border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 20px; cursor: pointer; }
        
        .modal-header-area { position: relative; padding: 40px 30px 30px; border-bottom: 1px solid var(--line); background: #fff; overflow: hidden; display: flex; align-items: center; gap: 24px; }
        .modal-bg-blur { position: absolute; top: -50%; left: -20%; width: 150%; height: 200%; background: radial-gradient(circle, rgba(0,122,255,0.05) 0%, transparent 60%); z-index: 0; pointer-events: none; }
        .modal-header-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 20px; width: 100%; }
        .modal-logo-large { width: 80px; height: 80px; background: #fff; border: 1px solid #eee; border-radius: 20px; display: flex; align-items: center; justify-content: center; padding: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .modal-logo-large img { width: 100%; height: 100%; object-fit: contain; }
        
        .modal-title-group h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
        .modal-tags { display: flex; gap: 8px; }
        .m-tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
        .m-tag.cat { background: #f0f7ff; color: var(--blue); }
        .m-tag.price { background: #f5f5f5; color: #666; }
        
        .modal-visit-btn { margin-left: auto; padding: 12px 24px; background: #111; color: white; border-radius: 30px; font-size: 14px; font-weight: 700; transition: 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .modal-visit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

        .modal-tabs { display: flex; border-bottom: 1px solid var(--line); padding: 0 30px; background: #fff; }
        .m-tab { padding: 16px 0; margin-right: 32px; background: none; border: none; border-bottom: 3px solid transparent; font-size: 15px; font-weight: 600; color: #999; cursor: pointer; transition: 0.2s; }
        .m-tab:hover { color: #666; }
        .m-tab.active { color: #111; border-bottom-color: #111; }
        .m-tab .count { background: #eee; font-size: 11px; padding: 2px 6px; border-radius: 10px; margin-left: 4px; color: #666; }

        .modal-body { padding: 30px; overflow-y: auto; flex: 1; background: #fcfcfc; }
        .info-view { display: flex; flex-direction: column; gap: 24px; }
        .info-card { background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--line); }
        .info-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #111; }
        .info-card p { font-size: 15px; color: #555; line-height: 1.6; margin: 0; }

        .timeline { border-left: 2px solid #eee; padding-left: 20px; margin-left: 8px; }
        .timeline-item { position: relative; margin-bottom: 16px; }
        .timeline-item:last-child { margin-bottom: 0; }
        .timeline-item .dot { position: absolute; left: -25px; top: 6px; width: 8px; height: 8px; background: var(--blue); border-radius: 50%; box-shadow: 0 0 0 4px #fff; }
        
        .news-box { background: #f0f9ff; padding: 16px; border-radius: 12px; display: flex; gap: 12px; align-items: flex-start; }
        .news-icon { font-size: 20px; }

        .rating-panel { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 20px; border-radius: 16px; border: 1px solid var(--line); margin-bottom: 20px; }
        .big-score { display: flex; align-items: baseline; gap: 8px; }
        .score-num { font-size: 48px; font-weight: 800; color: #111; }
        .score-max { font-size: 16px; color: #999; }
        .my-vote { text-align: right; }
        .my-vote p { font-size: 12px; color: #999; margin-bottom: 4px; }
        .stars { font-size: 24px; color: #ddd; cursor: pointer; }
        .stars .on { color: #FFD700; }
        
        .review-input-box { background: #fff; padding: 20px; border-radius: 16px; border: 1px solid var(--line); margin-bottom: 30px; }
        .review-input-box textarea { width: 100%; height: 80px; border: 1px solid #eee; border-radius: 8px; padding: 12px; font-size: 14px; resize: none; outline: none; margin-bottom: 12px; }
        .review-input-box textarea:focus { border-color: var(--blue); }
        .review-input-box button { width: 100%; padding: 10px; background: var(--text-main); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; float: right; }

        .review-list { display: flex; flex-direction: column; gap: 16px; }
        .review-bubble-row { display: flex; gap: 16px; }
        .review-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; font-size: 14px; flex-shrink: 0; }
        .review-bubble { background: #fff; padding: 16px; border-radius: 0 16px 16px 16px; border: 1px solid var(--line); flex: 1; }
        .rb-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .rb-user { font-weight: 700; font-size: 14px; }
        .rb-rating { font-size: 12px; }
        .rb-date { margin-left: auto; font-size: 12px; color: #aaa; }
        .rb-text { font-size: 14px; color: #444; line-height: 1.5; margin: 0; }
        .no-review { text-align: center; color: #999; padding: 20px; }

        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .filter-bar { flex-direction: column-reverse; align-items: stretch; }
          .search-wrap { width: 100%; }
          .category-tabs { overflow-x: auto; padding-bottom: 4px; }
        }
      `}</style>
    </main>
  );
}