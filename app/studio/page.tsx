"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
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
      // 초기 데이터 (데이터가 없으면 이 부분을 실행)
      const initialData = [
        { id: 101, title: "ChatGPT", category: "TEXT", desc: "가장 똑똑하고 범용적인 대화형 AI 표준", logo: "https://logo.clearbit.com/openai.com", price: "Freemium", rating: 0, reviews: 0, link: "https://chat.openai.com", history: "2022.11 GPT-3.5 출시\n2023.03 GPT-4 공개\n2024.05 GPT-4o 멀티모달 업데이트", news: "OpenAI, 차세대 모델 'Strawberry' 개발 중이라는 소문 확산", commentsList: [] },
        { id: 102, title: "Claude", category: "LLM", desc: "자연스러운 한국어와 뛰어난 코딩/작문 능력", logo: "https://logo.clearbit.com/anthropic.com", price: "Free", rating: 0, reviews: 0, link: "https://claude.ai", history: "OpenAI 출신 연구원들이 설립한 Anthropic에서 개발. 안전하고 윤리적인 AI를 지향.", news: "Claude 3.5 Sonnet 출시 이후 성능 입증.", commentsList: [] },
        { id: 103, title: "Perplexity", category: "LLM", desc: "실시간 웹 검색 기반의 AI 검색엔진", logo: "https://logo.clearbit.com/perplexity.ai", price: "Freemium", rating: 0, reviews: 0, link: "https://www.perplexity.ai", history: "전통적인 검색엔진을 대체하기 위해 등장. 답변과 함께 정확한 출처(Citations)를 제공하는 것이 특징.", news: "최근 기업가치 급상승 및 다양한 LLM 모델(Claude, GPT-4)을 선택하여 검색할 수 있는 기능 제공.", commentsList: [] },
        { id: 104, title: "Gemini", category: "LLM", desc: "구글 생태계 연동 멀티모달 AI", logo: "https://logo.clearbit.com/deepmind.google", price: "Free", rating: 0, reviews: 0, link: "https://gemini.google.com", history: "구글의 바드(Bard)가 리브랜딩된 서비스. 구글 워크스페이스와의 강력한 연동성을 자랑함.", news: "1.5 Pro 모델 업데이트로 긴 문맥 처리 능력이 획기적으로 향상됨.", commentsList: [] },
        { id: 201, title: "Midjourney", category: "IMAGE", desc: "압도적인 예술적 퀄리티의 이미지 생성", logo: "https://logo.clearbit.com/midjourney.com", price: "Paid", rating: 0, reviews: 0, link: "https://midjourney.com", history: "데이비드 홀츠가 설립한 독립 연구소. 디스코드 기반으로 시작하여 독보적인 예술적 화풍을 구축.", news: "웹사이트에서 이미지 생성 기능 전면 개방 예정", commentsList: [] },
        { id: 202, title: "Stable Diffusion", category: "IMAGE", desc: "내 PC에 설치해 제한 없이 쓰는 강력한 도구", logo: "https://logo.clearbit.com/stability.ai", price: "Free", rating: 0, reviews: 0, link: "https://stability.ai", history: "Stability AI가 공개한 오픈소스 모델. 전 세계 개발자들이 다양한 파생 모델과 로라(LoRA)를 제작함.", news: "SD3 모델 발표로 텍스트 렌더링 능력이 크게 개선됨.", commentsList: [] },
        { id: 301, title: "Runway", category: "VIDEO", desc: "텍스트로 영화 같은 영상 제작", logo: "https://logo.clearbit.com/runwayml.com", price: "Freemium", rating: 0, reviews: 0, link: "https://runwayml.com", history: "영상 생성 AI의 선구자.", news: "Gen-3 Alpha 공개.", commentsList: [] },
        { id: 401, title: "Suno", category: "SOUND", desc: "가사만 입력하면 작곡/보컬까지 완성", logo: "https://logo.clearbit.com/suno.com", price: "Free", rating: 0, reviews: 0, link: "https://suno.com", history: "음악 생성의 혁명.", news: "v3.5 모델 업데이트.", commentsList: [] },
        { id: 501, title: "ElevenLabs", category: "VOICE", desc: "가장 자연스러운 TTS 및 보이스 클로닝", logo: "https://logo.clearbit.com/elevenlabs.io", price: "Freemium", rating: 0, reviews: 0, link: "https://elevenlabs.io", history: "AI 음성 합성 분야의 압도적 1위.", news: "다국어 더빙 기능.", commentsList: [] },
        { id: 701, title: "Make", category: "AUTOMATION", desc: "복잡한 워크플로우 시각적 자동화", logo: "https://logo.clearbit.com/make.com", price: "Freemium", rating: 0, reviews: 0, link: "https://www.make.com", history: "구 Integromat. 노코드 자동화의 강력한 툴.", news: "AI 에이전트 통합.", commentsList: [] },
      ];
      setTools(initialData);
      localStorage.setItem("dori_tools_v8", JSON.stringify(initialData));
    } else {
      setTools(savedTools);
    }
  }

  function onLogout() { signOut({ callbackUrl: "/" }); }

  const handleVote = (id: number, score: number) => {
    if (!user) { alert("로그인이 필요한 기능입니다."); return; }

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
    if (!reviewText.trim()) return alert("리뷰 내용을 입력해주세요.");

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

  const activeCategories = selectedCategory === "ALL" 
    ? categoryList 
    : categoryList.filter(c => c.key === selectedCategory);

  const getCatColor = (catKey: string) => categoryList.find(c => c.key === catKey) || { color: '#eee', text: '#666' };

  return (
    <main className="page">
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "80vh", paddingTop: "60px" }}>
        <div className="page-header">
          <h1 className="page-title">AI Tools Ranking</h1>
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
            
            categoryTools.sort((a, b) => {
                if (a.reviews === 0 && b.reviews === 0) return 0;
                if (a.reviews === 0) return 1;
                if (b.reviews === 0) return -1;
                return b.rating - a.rating;
            });

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

                        <div className="rating-area" onMouseLeave={() => setHoverState(null)}>
                          <div className="current-rating">
                            {item.reviews > 0 ? (
                                <>
                                    <span className="star-icon">⭐</span> 
                                    <span className="score">{item.rating}</span>
                                    <span className="count">({item.reviews})</span>
                                </>
                            ) : <span className="no-rating">No ratings yet</span>}
                          </div>
                          <div className="vote-actions">
                            {[1, 2, 3, 4, 5].map((score) => {
                              const isHovered = hoverState?.id === item.id && score <= hoverState.score;
                              const isSelected = !hoverState && (myVotes[item.id] || 0) >= score;
                              return (
                                <button key={score} type="button" className={`star-btn ${isHovered || isSelected ? 'active' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); handleVote(item.id, score); }}
                                  onMouseEnter={() => setHoverState({id: item.id, score: score})}
                                >★</button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="card-footer">
                          <button className="detail-btn" onClick={(e) => { e.stopPropagation(); setSelectedTool(item); }}>상세정보</button>
                          {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="visit-btn" onClick={(e) => e.stopPropagation()}>바로가기 →</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 상세 모달 */}
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
                <a href={selectedTool.link} target="_blank" className="modal-visit-btn">Visit Site →</a>
              </div>
            </div>

            <div className="modal-tabs">
              <button className={`m-tab ${modalTab === "INFO" ? "active" : ""}`} onClick={() => setModalTab("INFO")}>Info</button>
              <button className={`m-tab ${modalTab === "REVIEW" ? "active" : ""}`} onClick={() => setModalTab("REVIEW")}>Reviews <span className="count">{selectedTool.commentsList?.length || 0}</span></button>
            </div>

            <div className="modal-body">
              {modalTab === "INFO" ? (
                <div className="info-view fade-in">
                  <div className="info-card">
                    <h4>💡 Description</h4>
                    <p>{selectedTool.desc}</p>
                  </div>
                  <div className="info-card">
                    <h4>📜 History</h4>
                    <div className="timeline">
                      {selectedTool.history ? selectedTool.history.split('\n').map((line: string, i: number) => (
                        <div key={i} className="timeline-item">
                          <div className="dot"></div>
                          <p>{line}</p>
                        </div>
                      )) : <p className="no-data">Information updating...</p>}
                    </div>
                  </div>
                  <div className="info-card">
                    <h4>📰 Latest News</h4>
                    <div className="news-box">
                      <span className="news-icon">📢</span>
                      <p>{selectedTool.news || "No recent news."}</p>
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
                      <p>Your Rating</p>
                      <div 
                        className="stars"
                        onMouseLeave={() => setHoverState(null)}
                      >
                        {[1,2,3,4,5].map(s => {
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
                    <textarea placeholder="Leave your honest review here." value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    <button onClick={handleReviewSubmit}>Submit Review</button>
                  </div>

                  <div className="review-list">
                    {selectedTool.commentsList?.length > 0 ? selectedTool.commentsList.map((c: Comment) => (
                      <div key={c.id} className="review-bubble-row">
                        <div className="review-avatar" style={{background: c.avatarColor || '#eee'}}>
                          {c.user[0]?.toUpperCase()}
                        </div>
                        <div className="review-bubble">
                          <div className="rb-header"><span className="rb-user">{c.user}</span><span className="rb-rating">{"⭐".repeat(c.rating)}</span><span className="rb-date">{c.date}</span></div>
                          <p className="rb-text">{c.text}</p>
                        </div>
                      </div>
                    )) : <div className="no-review">Be the first to review!</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* (Styles omitted for brevity, assumed to be correct based on previous context) */
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
        .resource-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--blue); }
        
        .resource-card.rank-1 { border: 2px solid #FFD700; background: linear-gradient(to bottom right, #fff, #fffdf0); }
        .rank-badge { position: absolute; top: 0; left: 0; background: #f0f0f0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; border-bottom-right-radius: 16px; z-index: 10; }
        .rank-1 .rank-badge { background: #FFD700; font-size: 22px; } 
        
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; padding-left: 10px; }
        .card-logo-wrap { width: 52px; height: 52px; background: #fff; border: 1px solid #eee; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .card-logo { width: 100%; height: 100%; object-fit: contain; }
        .price-badge { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: #f0f0f0; color: #666; }
        
        .mini-cat { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-bottom: 6px; }
        .card-info h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; color: var(--text-main); }
        .card-info p { font-size: 14px; color: var(--text-sub); line-height: 1.5; margin: 0; }
        
        .rating-area { background: #f9fafb; padding: 12px; border-radius: 12px; margin-bottom: 8px; }
        .current-rating { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .star-icon { color: #FFD700; } .score { font-weight: 800; font-size: 16px; color: var(--text-main); } .count { font-size: 12px; color: #999; }
        .vote-actions { display: flex; align-items: center; gap: 6px; }
        .star-btn { background: none; border: none; cursor: pointer; font-size: 24px; color: #ddd; transition: 0.1s; padding: 4px; line-height: 1; z-index: 10; position: relative; }
        .star-btn.active { color: #FFD700; transform: scale(1.1); text-shadow: 0 0 2px rgba(255, 215, 0, 0.5); }
        .card-footer { display: flex; gap: 8px; margin-top: auto; }
        .detail-btn { flex: 1; padding: 10px; background: #f5f5f7; border: none; border-radius: 10px; font-weight: 600; color: var(--text-main); cursor: pointer; font-size: 13px; }
        .visit-btn { flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px; background: #111; border: none; border-radius: 10px; font-weight: 600; color: white; cursor: pointer; font-size: 13px; text-decoration: none; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
        .modal-content { background: #fff; width: 700px; max-width: 95vw; height: 85vh; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 60px rgba(0,0,0,0.3); }
        .modal-close { position: absolute; top: 20px; right: 20px; z-index: 10; background: rgba(255,255,255,0.5); border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 20px; cursor: pointer; }
        
        .modal-header-area { position: relative; padding: 40px 30px 30px; border-bottom: 1px solid var(--line); background: #fff; overflow: hidden; display: flex; align-items: center; gap: 24px; }
        .modal-bg-blur { position: absolute; top: -50%; left: -20%; width: 150%; height: 200%; background: radial-gradient(circle, rgba(0,122,255,0.05) 0%, transparent 60%); z-index: 0; pointer-events: none; }
        .modal-header-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 20px; width: 100%; }
        .modal-logo-large { width: 80px; height: 80px; background: #fff; border: 1px solid #eee; border-radius: 20px; display: flex; align-items: center; justify-content: center; padding: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .modal-logo-large img { width: 100%; height: 100%; object-fit: contain; }
        
        .modal-title-group h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
        .modal-tabs { display: flex; border-bottom: 1px solid var(--line); padding: 0 30px; background: #fff; }
        .m-tab { padding: 16px 0; margin-right: 32px; background: none; border: none; border-bottom: 3px solid transparent; font-size: 15px; font-weight: 600; color: #999; cursor: pointer; transition: 0.2s; }
        .m-tab.active { color: #111; border-bottom-color: #111; }
        .modal-body { padding: 30px; overflow-y: auto; flex: 1; background: #fcfcfc; }
        .info-block { margin-bottom: 30px; }
        .info-block h4 { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #111; }
        .info-block p { font-size: 15px; color: #555; line-height: 1.6; margin: 0; }

        .timeline { border-left: 2px solid #eee; padding-left: 20px; margin-left: 8px; }
        .timeline-item { position: relative; margin-bottom: 16px; }
        .timeline-item .dot { position: absolute; left: -25px; top: 6px; width: 8px; height: 8px; background: var(--blue); border-radius: 50%; box-shadow: 0 0 0 4px #fff; }
        
        .review-form textarea { width: 100%; height: 80px; border: 1px solid #eee; border-radius: 8px; padding: 12px; font-size: 14px; resize: none; outline: none; margin-bottom: 12px; }
        .review-form button { width: 100%; padding: 10px; background: var(--text-main); color: white; border-radius: 8px; font-weight: 700; cursor: pointer; float: right; }
        .review-list { display: flex; flex-direction: column; gap: 16px; }
        .review-bubble-row { display: flex; gap: 16px; }
        .review-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; font-size: 14px; flex-shrink: 0; }
        .review-bubble { background: #fff; padding: 16px; border-radius: 0 16px 16px 16px; border: 1px solid var(--line); flex: 1; }
        .rb-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .rb-user { font-weight: 700; font-size: 14px; }
        .rb-rating { font-size: 12px; }
        .rb-date { margin-left: auto; font-size: 12px; color: #aaa; }
        .rb-text { font-size: 14px; color: #444; line-height: 1.5; margin: 0; }

        @media (max-width: 768px) {
          .filter-bar { flex-direction: column-reverse; align-items: stretch; }
          .search-wrap { width: 100%; }
        }
      `}</style>
    </main>
  );
}