"use client";

import Link from "next/link";

export default function ShopPage() {
  // 임시 상품 데이터
  const products = [
    { id: 1, title: "Cyberpunk Prompt Pack", price: "$12", author: "DoriMaster", image: "https://picsum.photos/seed/shop1/600/400", tag: "Prompt" },
    { id: 2, title: "3D Character Base Models", price: "$25", author: "ArtistKim", image: "https://picsum.photos/seed/shop2/600/400", tag: "Asset" },
    { id: 3, title: "Watercolor Texture Pack", price: "Free", author: "DesignPro", image: "https://picsum.photos/seed/shop3/600/400", tag: "Texture" },
    { id: 4, title: "Realistic Portrait Lora", price: "$5", author: "AiLab", image: "https://picsum.photos/seed/shop4/600/400", tag: "Model" },
    { id: 5, title: "Fantasy Backgrounds 4K", price: "$15", author: "SkyWalker", image: "https://picsum.photos/seed/shop5/600/400", tag: "Image" },
    { id: 6, title: "Logo Design Prompt", price: "$8", author: "BrandX", image: "https://picsum.photos/seed/shop6/600/400", tag: "Prompt" },
  ];

  return (
    <main className="page">
      {/* 헤더와 푸터는 layout.tsx에서 자동으로 불러옵니다 */}
      
      <div className="scroll-spacer" />

      <section className="container section" style={{ minHeight: "80vh", paddingTop: "60px" }}>
        {/* 상단 타이틀 */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Asset Shop</h1>
            <p className="page-desc">최고의 퀄리티를 위한 프리미엄 프롬프트와 에셋.</p>
          </div>
          <div className="header-action">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Prompts</button>
            <button className="filter-btn">Models</button>
          </div>
        </div>

        {/* 상품 그리드 */}
        <div className="shop-grid">
          {products.map((item) => (
            <div key={item.id} className="product-card">
              <div className="product-thumb">
                <img src={item.image} alt={item.title} />
                <span className="price-tag">{item.price}</span>
              </div>
              <div className="product-info">
                <div className="info-top">
                  <span className="product-tag">{item.tag}</span>
                  <span className="product-author">by {item.author}</span>
                </div>
                <h3 className="product-title">{item.title}</h3>
                <button className="buy-btn">구매하기</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx global>{`
        /* 공통 스타일 (globals.css와 연동) */
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .scroll-spacer { height: 70px; }
        
        /* Shop Header */
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid var(--line); }
        .page-title { font-size: 42px; font-weight: 800; margin-bottom: 8px; color: var(--text-main); }
        .page-desc { font-size: 16px; color: var(--text-sub); }
        
        .header-action { display: flex; gap: 8px; }
        .filter-btn { padding: 8px 20px; border-radius: 20px; border: 1px solid var(--line); background: white; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text-sub); transition: 0.2s; }
        .filter-btn:hover { background: #f9f9f9; color: var(--text-main); }
        .filter-btn.active { background: var(--text-main); color: white; border-color: var(--text-main); }

        /* Shop Grid */
        .shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
        
        .product-card { background: white; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; transition: 0.3s; cursor: pointer; display: flex; flex-direction: column; }
        .product-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); }
        
        .product-thumb { position: relative; height: 200px; overflow: hidden; }
        .product-thumb img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .product-card:hover .product-thumb img { transform: scale(1.05); }
        
        .price-tag { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); color: white; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 14px; }

        .product-info { padding: 20px; flex: 1; display: flex; flex-direction: column; }
        .info-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .product-tag { font-size: 11px; font-weight: 700; color: var(--blue); text-transform: uppercase; letter-spacing: 0.5px; background: #eff6ff; padding: 4px 8px; border-radius: 4px; }
        .product-author { font-size: 12px; color: var(--text-sub); }
        
        .product-title { font-size: 18px; font-weight: 700; margin: 0 0 20px 0; color: var(--text-main); line-height: 1.4; }
        
        .buy-btn { margin-top: auto; width: 100%; padding: 12px; background: var(--text-main); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .buy-btn:hover { background: #333; }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 20px; }
        }
      `}</style>
    </main>
  );
}