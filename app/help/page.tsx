"use client";

export default function HelpPage() {
  return (
    <main className="page container section" style={{paddingTop: '80px'}}>
      <div className="help-container">
        <div className="help-header">
          <h1>무엇을 도와드릴까요?</h1>
          <p>DORI-AI 이용 중 궁금한 점이나 제안하고 싶은 점을 남겨주세요.</p>
        </div>

        <form className="contact-form" onSubmit={(e) => {e.preventDefault(); alert('문의가 접수되었습니다.');}}>
          <div className="form-group">
            <label>이름</label>
            <input type="text" placeholder="성함" required />
          </div>
          <div className="form-group">
            <label>이메일</label>
            <input type="email" placeholder="답변 받으실 이메일" required />
          </div>
          <div className="form-group">
            <label>문의 내용</label>
            <textarea placeholder="내용을 자세히 적어주세요." required></textarea>
          </div>
          <button type="submit" className="submit-btn">문의하기</button>
        </form>

        <div className="faq-link">
          <p>자주 묻는 질문(FAQ)을 먼저 확인해보세요.</p>
          <button>FAQ 보러가기</button>
        </div>
      </div>

      <style jsx>{`
        .help-container { max-width: 600px; margin: 0 auto; }
        .help-header { text-align: center; margin-bottom: 40px; }
        .help-header h1 { font-size: 32px; font-weight: 800; margin-bottom: 10px; }
        .help-header p { color: #666; }

        .contact-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group label { display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px; }
        .form-group input, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; outline: none; transition: 0.2s; }
        .form-group input:focus, .form-group textarea:focus { border-color: #007AFF; }
        .form-group textarea { height: 150px; resize: none; }
        
        .submit-btn { width: 100%; padding: 14px; background: #111; color: white; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px; }
        .submit-btn:hover { background: #333; }

        .faq-link { margin-top: 60px; padding: 30px; background: #f9fafb; border-radius: 12px; text-align: center; }
        .faq-link p { margin-bottom: 12px; font-size: 14px; color: #666; }
        .faq-link button { padding: 10px 20px; background: white; border: 1px solid #ddd; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 13px; }
        .faq-link button:hover { border-color: #007AFF; color: #007AFF; }
      `}</style>
    </main>
  );
}