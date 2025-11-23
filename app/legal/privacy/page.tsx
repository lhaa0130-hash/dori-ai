"use client";

export default function PrivacyPage() {
  return (
    <main className="page container section" style={{paddingTop: '80px'}}>
      <div className="legal-content">
        <h1>개인정보처리방침 (Privacy Policy)</h1>
        <p className="date">최종 수정일: 2025년 11월 23일</p>
        
        <div className="section">
          <h3>1. 수집하는 개인정보 항목</h3>
          <p>회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
          <ul style={{listStyle:'disc', paddingLeft:'20px', color:'#555', marginTop:'8px'}}>
            <li>수집항목: 이름, 로그인ID, 비밀번호, 이메일, 서비스 이용기록</li>
            <li>수집방법: 홈페이지(회원가입)</li>
          </ul>
        </div>
        
        <div className="section">
          <h3>2. 개인정보의 수집 및 이용목적</h3>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
          <p>- 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산</p>
          <p>- 회원 관리 (가입 의사 확인, 연령 확인 등)</p>
        </div>

        <div className="section">
          <h3>3. 개인정보의 보유 및 이용기간</h3>
          <p>원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
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