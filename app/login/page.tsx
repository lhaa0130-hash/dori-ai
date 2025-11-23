"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(""); // username -> email 변경
  const [password, setPassword] = useState("");

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 'email' 필드로 전송
    const res = await signIn("credentials", { 
      redirect: false, 
      email, 
      password 
    });

    if (res?.error) {
      alert("로그인 실패: 이메일과 비밀번호를 확인해주세요.");
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <main className="login-page">
      <div className="login-container fade-in-up">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>DORI-AI에 오신 것을 환영합니다.</p>
        </div>

        <div className="login-body">
          <button className="google-btn" onClick={handleGoogleLogin} disabled={isLoading}>
            <span className="g-icon">G</span> 
            {isLoading ? "연결 중..." : "Google 계정으로 계속하기"}
          </button>
          
          <div className="divider">
            <span>또는 이메일로 로그인</span>
          </div>

          <form onSubmit={handleCredentialLogin} className="auth-form">
            <div className="input-group">
              <label>이메일</label>
              <input 
                type="email" 
                placeholder="example@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={isLoading}
              />
            </div>
            <div className="input-group">
              <label>비밀번호</label>
              <input 
                type="password" 
                placeholder="비밀번호 입력" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="login-footer">
            계정이 없으신가요? <Link href="/signup" className="link">회원가입</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f9fa; padding: 20px; }
        .login-container { background: white; width: 100%; max-width: 420px; padding: 48px; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.08); border: 1px solid #eee; }
        .login-header { text-align: center; margin-bottom: 32px; }
        .login-header h1 { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 8px; }
        .login-header p { color: #666; font-size: 15px; }
        .google-btn { width: 100%; padding: 14px; border-radius: 12px; background: #fff; border: 1px solid #ddd; color: #333; font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .google-btn:hover { background: #f9f9f9; border-color: #ccc; }
        .g-icon { font-weight: 900; color: #4285F4; font-size: 18px; font-family: sans-serif; }
        .divider { margin: 24px 0; text-align: center; position: relative; }
        .divider::before { content: ''; position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background: #eee; }
        .divider span { position: relative; background: white; padding: 0 12px; color: #999; font-size: 12px; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 700; color: #444; }
        .input-group input { padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 15px; transition: 0.2s; outline: none; background: #fcfcfc; }
        .input-group input:focus { border-color: #007AFF; background: #fff; box-shadow: 0 0 0 4px rgba(0,122,255,0.1); }
        .submit-btn { width: 100%; padding: 16px; border-radius: 12px; background: #111; color: white; border: none; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 8px; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .login-footer { text-align: center; margin-top: 24px; font-size: 14px; color: #666; }
        .login-footer .link { color: #007AFF; font-weight: 700; margin-left: 6px; text-decoration: none !important; }
        .login-footer .link:hover { text-decoration: underline !important; }
        .fade-in-up { animation: fadeInUp 0.5s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}