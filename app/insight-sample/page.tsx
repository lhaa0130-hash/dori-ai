import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "인사이트 샘플",
  description: "인사이트 페이지 리스트형 레이아웃 샘플",
  path: "/insight-sample",
});

export default function InsightSamplePage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: "2rem", fontSize: "2rem", fontWeight: "bold" }}>
        인사이트 페이지 리스트형 레이아웃 샘플
      </h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* 샘플 아이템 1 */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* 좌측 이미지 */}
          <div
            style={{
              width: "200px",
              height: "150px",
              borderRadius: "0.75rem",
              overflow: "hidden",
              flexShrink: 0,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
            }}
          >
            🚀
          </div>
          
          {/* 우측 내용 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* 카테고리 & 날짜 */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "#3b82f6",
                }}
              >
                트렌드
              </span>
              <span style={{ fontSize: "0.875rem", color: "rgba(0, 0, 0, 0.5)" }}>
                2026.01.15
              </span>
            </div>
            
            {/* 제목 */}
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                margin: 0,
                lineHeight: "1.4",
              }}
            >
              AI 시대의 새로운 트렌드와 미래 전망
            </h3>
            
            {/* 요약 */}
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(0, 0, 0, 0.7)",
                lineHeight: "1.6",
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              생성형 AI의 급속한 발전으로 인해 업계 전반에 걸쳐 새로운 변화가 일어나고 있습니다.
              이번 글에서는 최신 AI 트렌드를 분석하고 미래 전망을 살펴봅니다.
            </p>
            
            {/* 태그 & 좋아요 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["AI", "트렌드", "미래"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.375rem",
                      background: "rgba(0, 0, 0, 0.05)",
                      color: "rgba(0, 0, 0, 0.7)",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "rgba(0, 0, 0, 0.6)" }}>
                <span>❤️</span>
                <span>42</span>
              </div>
            </div>
          </div>
        </div>

        {/* 샘플 아이템 2 */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* 좌측 이미지 */}
          <div
            style={{
              width: "200px",
              height: "150px",
              borderRadius: "0.75rem",
              overflow: "hidden",
              flexShrink: 0,
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
            }}
          >
            📚
          </div>
          
          {/* 우측 내용 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* 카테고리 & 날짜 */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  background: "rgba(139, 92, 246, 0.1)",
                  color: "#8b5cf6",
                }}
              >
                가이드
              </span>
              <span style={{ fontSize: "0.875rem", color: "rgba(0, 0, 0, 0.5)" }}>
                2026.01.14
              </span>
            </div>
            
            {/* 제목 */}
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                margin: 0,
                lineHeight: "1.4",
              }}
            >
              ChatGPT 활용 가이드: 초보자를 위한 완벽한 시작하기
            </h3>
            
            {/* 요약 */}
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(0, 0, 0, 0.7)",
                lineHeight: "1.6",
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              ChatGPT를 처음 사용하는 분들을 위한 상세한 가이드입니다. 기본 사용법부터 고급 팁까지,
              실전 예제와 함께 단계별로 설명합니다.
            </p>
            
            {/* 태그 & 좋아요 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["ChatGPT", "가이드", "초보자"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.375rem",
                      background: "rgba(0, 0, 0, 0.05)",
                      color: "rgba(0, 0, 0, 0.7)",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "rgba(0, 0, 0, 0.6)" }}>
                <span>❤️</span>
                <span>128</span>
              </div>
            </div>
          </div>
        </div>

        {/* 샘플 아이템 3 */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* 좌측 이미지 */}
          <div
            style={{
              width: "200px",
              height: "150px",
              borderRadius: "0.75rem",
              overflow: "hidden",
              flexShrink: 0,
              background: "linear-gradient(135deg, #ec4899, #f59e0b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
            }}
          >
            📝
          </div>
          
          {/* 우측 내용 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* 카테고리 & 날짜 */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  background: "rgba(236, 72, 153, 0.1)",
                  color: "#ec4899",
                }}
              >
                인사이트
              </span>
              <span style={{ fontSize: "0.875rem", color: "rgba(0, 0, 0, 0.5)" }}>
                2026.01.13
              </span>
            </div>
            
            {/* 제목 */}
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                margin: 0,
                lineHeight: "1.4",
              }}
            >
              AI 이미지 생성 도구 비교 분석: Midjourney vs DALL-E vs Stable Diffusion
            </h3>
            
            {/* 요약 */}
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(0, 0, 0, 0.7)",
                lineHeight: "1.6",
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              최근 주목받는 AI 이미지 생성 도구들을 상세히 비교 분석했습니다. 각 도구의 특징,
              장단점, 사용 사례를 실전 예제와 함께 소개합니다.
            </p>
            
            {/* 태그 & 좋아요 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["이미지생성", "비교", "AI도구"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.375rem",
                      background: "rgba(0, 0, 0, 0.05)",
                      color: "rgba(0, 0, 0, 0.7)",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "rgba(0, 0, 0, 0.6)" }}>
                <span>❤️</span>
                <span>89</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 다크모드 스타일 예시 */}
      <div style={{ marginTop: "4rem", padding: "2rem", background: "#1a1a1a", borderRadius: "1rem" }}>
        <h2 style={{ color: "#ffffff", marginBottom: "1.5rem" }}>다크모드 예시</h2>
        
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          {/* 좌측 이미지 */}
          <div
            style={{
              width: "200px",
              height: "150px",
              borderRadius: "0.75rem",
              overflow: "hidden",
              flexShrink: 0,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
            }}
          >
            🎨
          </div>
          
          {/* 우측 내용 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* 카테고리 & 날짜 */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  background: "rgba(59, 130, 246, 0.2)",
                  color: "#60a5fa",
                }}
              >
                트렌드
              </span>
              <span style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
                2026.01.12
              </span>
            </div>
            
            {/* 제목 */}
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                margin: 0,
                lineHeight: "1.4",
                color: "#ffffff",
              }}
            >
              AI 디자인 도구로 창의성 극대화하기
            </h3>
            
            {/* 요약 */}
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.8)",
                lineHeight: "1.6",
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              AI 기반 디자인 도구를 활용하여 작업 효율을 높이고 창의적인 결과물을 만드는 방법을
              실전 사례와 함께 소개합니다.
            </p>
            
            {/* 태그 & 좋아요 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["디자인", "AI", "창의성"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.375rem",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.7)" }}>
                <span>❤️</span>
                <span>156</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

