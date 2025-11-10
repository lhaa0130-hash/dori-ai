"use client";

import { useState } from "react";
import Link from "next/link";

export default function AIStylePage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/change-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.message);
        // 페이지 새로고침하여 새 스타일 적용
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(data.error || "오류가 발생했습니다");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  const examples = [
    "다크모드로 바꿔줘",
    "테슬라 스타일로 바꿔줘",
    "애플 스타일처럼 깔끔하게",
    "네온 사이버펑크 스타일",
    "파스텔톤 부드러운 느낌",
  ];

  return (
    <div className="ai-style-page">
      <header className="header">
        <Link href="/" className="back-link">
          ← 홈으로
        </Link>
      </header>

      <main className="container">
        <h1>🎨 AI 스타일 변경</h1>
        <p className="subtitle">자연어로 웹사이트 디자인을 바꿔보세요</p>

        <form onSubmit={handleSubmit} className="prompt-form">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 다크모드로 바꿔줘"
            rows={4}
            required
            disabled={loading}
          />

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "🤖 AI 작업 중..." : "✨ 스타일 변경"}
          </button>
        </form>

        <div className="examples">
          <h3>예시:</h3>
          <div className="example-chips">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="example-chip"
                disabled={loading}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {result && (
          <div className="result success">
            ✅ {result}
            <br />
            <small>곧 새로운 스타일이 적용됩니다...</small>
          </div>
        )}

        {error && (
          <div className="result error">
            ❌ {error}
          </div>
        )}

        <div className="info">
          <h3>💡 작동 방식:</h3>
          <ol>
            <li>자연어로 원하는 스타일 입력</li>
            <li>Gemini AI가 CSS 코드 생성</li>
            <li>globals.css 파일 자동 수정</li>
            <li>페이지 새로고침하여 적용</li>
          </ol>
        </div>
      </main>

      <style jsx>{`
        .ai-style-page {
          min-height: 100vh;
          background: #fafafa;
        }
        .header {
          padding: 20px;
          border-bottom: 1px solid #e5e5e5;
          background: #fff;
        }
        .back-link {
          color: #00baff;
          text-decoration: none;
          font-weight: 500;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        h1 {
          font-size: 42px;
          margin: 0 0 10px;
          text-align: center;
        }
        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 40px;
        }
        .prompt-form {
          background: #fff;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e5e5e5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        textarea {
          width: 100%;
          padding: 16px;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          font-size: 16px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 16px;
        }
        textarea:focus {
          outline: none;
          border-color: #00baff;
          box-shadow: 0 0 0 3px rgba(0, 186, 255, 0.1);
        }
        .submit-btn {
          width: 100%;
          padding: 16px;
          background: #00baff;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          background: #0099cc;
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(0, 186, 255, 0.25);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .examples {
          margin-top: 32px;
        }
        .examples h3 {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }
        .example-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .example-chip {
          padding: 8px 16px;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 999px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .example-chip:hover:not(:disabled) {
          border-color: #00baff;
          color: #00baff;
        }
        .example-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .result {
          margin-top: 24px;
          padding: 16px;
          border-radius: 12px;
          text-align: center;
        }
        .result.success {
          background: #e6f7e6;
          color: #0a8a45;
          border: 1px solid #b3e6b3;
        }
        .result.error {
          background: #ffe6e6;
          color: #b00020;
          border: 1px solid #ffb3b3;
        }
        .info {
          margin-top: 40px;
          padding: 24px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
        }
        .info h3 {
          margin-top: 0;
        }
        .info ol {
          padding-left: 20px;
          line-height: 1.8;
        }
      `}</style>
    </div>
  );
}