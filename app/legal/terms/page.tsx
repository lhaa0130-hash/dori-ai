"use client";

export default function TermsPage() {
  return (
    <main className="page container section" style={{paddingTop: '80px'}}>
      <div className="legal-content">
        <h1>이용약관 (Terms of Service)</h1>
        <p className="date">최종 수정일: 2025년 11월 23일</p>
        
        <div className="section">
          <h3>제 1조 (목적)</h3>
          <p>본 약관은 DORI-AI(이하 "회사")가 제공하는 AI 정보 공유 및 생성 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </div>
        
        <div className="section">
          <h3>제 2조 (정의)</h3>
          <p>1. "서비스"란 구현되는 단말기와 상관없이 회원이 이용할 수 있는 DORI-AI 관련 제반 서비스를 의미합니다.</p>
          <p>2. "회원"이란 회사의 서비스에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.</p>
        </div>

        <div className="section">
          <h3>제 3조 (약관의 효력 및 변경)</h3>
          <p>회사는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 내에서 본 약관을 개정할 수 있습니다. 개정된 약관은 서비스 초기 화면이나 공지사항을 통해 효력이 발생합니다.</p>
        </div>

        {/* ... 더 많은 내용 ... */}
        
        <div className="section">
          <h3>제 4조 (서비스 이용)</h3>
          <p>회원은 상업적 목적을 포함하여 본 서비스를 자유롭게 이용할 수 있으나, 불법적인 용도로의 사용은 엄격히 금지됩니다.</p>
        </div>
      </div>

      <style jsx>{`
        .legal-content { max-width: 800px; margin: 0 auto; }
        h1 { font-size: 32px; font-weight: 800; margin-bottom: 10px; }
        .date { color: #888; font-size: 14px; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .section { margin-bottom: 30px; }
        h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: #111; }
        p { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 8px; }
      `}</style>
    </main>
  );
}