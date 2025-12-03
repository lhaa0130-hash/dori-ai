"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Hero from "@/components/home/Hero";
import BentoSection from "@/components/home/BentoSection";
import ToolsPreview from "@/components/home/ToolsPreview";
import InsightPreview from "@/components/home/InsightPreview";
import AcademyPreview from "@/components/home/AcademyPreview";
import CommunityPreview from "@/components/home/CommunityPreview";

export default function HomeClient() {
  const { data: session } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ... 로그인/회원가입 로직 유지 ...
  async function handleCredentialLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return alert("아이디와 비밀번호를 입력해주세요.");
    setIsLoading(true);
    const res = await signIn("credentials", { redirect: false, username, password });
    setIsLoading(false);
    if (res?.error) alert("로그인에 실패했습니다.");
    else { setLoginOpen(false); window.location.reload(); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password || !name) return alert("모든 필드를 입력해주세요.");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, name }), });
      if (!res.ok) throw new Error("회원가입 실패");
      alert("가입 성공! 로그인해주세요.");
      setIsLoginMode(true);
    } catch (err) { alert("회원가입 중 오류가 발생했습니다."); } finally { setIsLoading(false); }
  }

  return (
    <main className="w-full overflow-x-hidden">
      <Hero />
      <BentoSection />
      <ToolsPreview />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1200px] mx-auto px-6 mb-20">
        <InsightPreview />
        <AcademyPreview />
      </div>
      <CommunityPreview />
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      {/* ... 로그인 모달 UI 유지 ... */}
    </main>
  );
}