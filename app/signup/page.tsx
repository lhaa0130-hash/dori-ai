"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 입력 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [ageGroup, setAgeGroup] = useState<"10s" | "20s" | "30s" | "40s" | "">("");

  // 회원가입 처리
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name || !gender || !ageGroup) return alert("모든 필드를 입력해주세요.");
    if (password !== confirmPassword) return alert("비밀번호가 일치하지 않습니다.");
    if (password.length < 6) return alert("비밀번호는 6자 이상이어야 합니다.");

    setIsLoading(true);

    try {
      // API로 이메일, 비번, 이름, 성별, 연령층 전송
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, gender, ageGroup }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "가입 처리 중 오류가 발생했습니다.");
      }

      // localStorage에 프로필 생성
      const profileData = {
        id: email, // 이메일을 ID로 사용하여 일관성 유지
        email: email,
        nickname: name,
        gender: gender,
        ageGroup: ageGroup,
        tier: 1,
        level: 1,
        doriScore: 0,
        point: 0,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(`dori_profile_${email}`, JSON.stringify(profileData));
      localStorage.setItem(`dori_user_name_${email}`, name);

      alert("회원가입이 완료되었습니다! 로그인해주세요.");
      router.push("/login");
    } catch (err) {
      alert("가입 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="signup-page">
      <div className="signup-container fade-in-up">
        <div className="signup-header">
          <h1>Create Account</h1>
          <p>이메일로 간편하게 가입하고 시작하세요.</p>
        </div>

        <div className="signup-body">
          <form onSubmit={handleRegister} className="auth-form">
            
            <div className="input-group">
              <label>이메일</label>
              <input 
                type="email" 
                placeholder="example@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label>비밀번호</label>
              <input 
                type="password" 
                placeholder="비밀번호 (6자 이상)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label>비밀번호 확인</label>
              <input 
                type="password" 
                placeholder="비밀번호 재입력" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                style={{
                  borderColor: confirmPassword && password !== confirmPassword ? "#ff4d4f" : "" 
                }}
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="error-msg">비밀번호가 일치하지 않습니다.</span>
              )}
            </div>

            <div className="input-group">
              <label>닉네임</label>
              <input 
                type="text" 
                placeholder="사이트에서 사용할 이름" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label>성별 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
                style={{
                  padding: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: '0.2s',
                  outline: 'none',
                  background: '#fcfcfc',
                  width: '100%',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007AFF';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(0,122,255,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#fcfcfc';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">선택해주세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>

            <div className="input-group">
              <label>연령층 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <select 
                value={ageGroup} 
                onChange={(e) => setAgeGroup(e.target.value as "10s" | "20s" | "30s" | "40s" | "")}
                style={{
                  padding: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: '0.2s',
                  outline: 'none',
                  background: '#fcfcfc',
                  width: '100%',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007AFF';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(0,122,255,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.background = '#fcfcfc';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">선택해주세요</option>
                <option value="10s">10대</option>
                <option value="20s">20대</option>
                <option value="30s">30대</option>
                <option value="40s">40대</option>
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? "가입 중..." : "가입하기"}
            </button>
          </form>

          <div className="signup-footer">
            이미 계정이 있으신가요? <Link href="/login" className="link">로그인</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .signup-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #f8f9fa; padding: 20px;
        }
        .signup-container {
          background: white; width: 100%; max-width: 420px; padding: 48px;
          border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.08); border: 1px solid #eee;
        }
        .signup-header { text-align: center; margin-bottom: 32px; }
        .signup-header h1 { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 8px; }
        .signup-header p { color: #666; font-size: 15px; }

        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 700; color: #444; }
        .input-group input {
          padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 15px; transition: 0.2s; outline: none; background: #fcfcfc; width: 100%;
        }
        .input-group input:focus { border-color: #007AFF; background: #fff; box-shadow: 0 0 0 4px rgba(0,122,255,0.1); }
        
        .error-msg { font-size: 12px; color: #ff4d4f; margin-top: 4px; }

        .submit-btn {
          width: 100%; padding: 16px; border-radius: 12px;
          background: #111; color: white; border: none;
          font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 8px;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .signup-footer { text-align: center; margin-top: 24px; font-size: 14px; color: #666; }
        .signup-footer .link { color: #007AFF; font-weight: 700; margin-left: 6px; }
        .signup-footer .link:hover { text-decoration: underline !important; }

        .fade-in-up { animation: fadeInUp 0.5s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}