"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, ChevronRight, Sparkles } from "lucide-react";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const { login, loginWithGoogle, signup, session } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup fields
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [ageGroup, setAgeGroup] = useState<"10s" | "20s" | "30s" | "40s" | "">("");

  useEffect(() => setMounted(true), []);

  // 이미 로그인한 경우 메인으로 리다이렉트
  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const isDark = mounted && theme === "dark";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "로그인에 실패했습니다.");
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!signupEmail || !signupPassword || !name || !gender || !ageGroup) {
      setError("모든 필드를 입력해주세요.");
      setIsLoading(false);
      return;
    }
    if (signupPassword.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    const result = await signup({
      email: signupEmail,
      password: signupPassword,
      name,
      gender: gender as "male" | "female",
      ageGroup: ageGroup as "10s" | "20s" | "30s" | "40s",
    });

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "회원가입에 실패했습니다.");
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Google 로그인에 실패했습니다.");
    }
    setIsGoogleLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
  };

  // Password strength
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: "약함", color: "#ef4444" };
    if (score <= 2) return { level: 2, label: "보통", color: "#f59e0b" };
    if (score <= 3) return { level: 3, label: "좋음", color: "#22c55e" };
    return { level: 4, label: "강력", color: "#10b981" };
  };

  const passwordStrength = getPasswordStrength(signupPassword);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.08) 0%, #000 60%)"
          : "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.06) 0%, #f8f9fa 60%)",
        padding: "20px",
        fontFamily:
          '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        transition: "background 0.3s ease",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "fixed",
          top: "-200px",
          right: "-200px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(249,115,22,0.08), transparent 70%)"
            : "radial-gradient(circle, rgba(249,115,22,0.05), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-150px",
          left: "-150px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(251,191,36,0.06), transparent 70%)"
            : "radial-gradient(circle, rgba(251,191,36,0.04), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          animation: "authFadeIn 0.6s ease-out",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Sparkles
              size={24}
              style={{
                color: "#f97316",
              }}
            />
            <span
              style={{
                fontSize: "24px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #facc15, #f97316 50%, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              DORI-AI
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: isDark
              ? "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            borderRadius: "24px",
            padding: "40px",
            boxShadow: isDark
              ? "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 20px 60px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          {/* Tab Switcher */}
          <div
            style={{
              display: "flex",
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              borderRadius: "14px",
              padding: "4px",
              marginBottom: "28px",
              position: "relative",
            }}
          >
            <button
              onClick={() => switchMode("login")}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: "11px",
                border: "none",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: mode === "login"
                  ? isDark
                    ? "rgba(249,115,22,0.2)"
                    : "#ffffff"
                  : "transparent",
                color: mode === "login"
                  ? isDark
                    ? "#fb923c"
                    : "#f97316"
                  : isDark
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.4)",
                boxShadow: mode === "login"
                  ? isDark
                    ? "0 2px 8px rgba(249,115,22,0.15)"
                    : "0 2px 8px rgba(0,0,0,0.06)"
                  : "none",
                fontFamily: "inherit",
              }}
            >
              로그인
            </button>
            <button
              onClick={() => switchMode("signup")}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: "11px",
                border: "none",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: mode === "signup"
                  ? isDark
                    ? "rgba(249,115,22,0.2)"
                    : "#ffffff"
                  : "transparent",
                color: mode === "signup"
                  ? isDark
                    ? "#fb923c"
                    : "#f97316"
                  : isDark
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.4)",
                boxShadow: mode === "signup"
                  ? isDark
                    ? "0 2px 8px rgba(249,115,22,0.15)"
                    : "0 2px 8px rgba(0,0,0,0.06)"
                  : "none",
                fontFamily: "inherit",
              }}
            >
              회원가입
            </button>
          </div>

          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: isDark ? "#ffffff" : "#111",
                marginBottom: "8px",
                letterSpacing: "-0.02em",
              }}
            >
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: isDark ? "rgba(255,255,255,0.5)" : "#888",
                lineHeight: "1.5",
              }}
            >
              {mode === "login"
                ? "DORI-AI에 오신 것을 환영합니다."
                : "이메일로 간편하게 가입하고 시작하세요."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "20px",
                borderRadius: "12px",
                background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`,
                color: isDark ? "#fca5a5" : "#dc2626",
                fontSize: "13px",
                fontWeight: 500,
                animation: "authShake 0.4s ease-out",
              }}
            >
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: "20px",
                borderRadius: "12px",
                background: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.06)",
                border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.15)"}`,
                color: isDark ? "#86efac" : "#16a34a",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {success}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Email */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  이메일
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isDark ? "rgba(255,255,255,0.3)" : "#bbb",
                    }}
                  />
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 14px 14px 42px",
                      borderRadius: "12px",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#fafafa",
                      color: isDark ? "#fff" : "#111",
                      fontSize: "15px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f97316";
                      e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  비밀번호
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isDark ? "rgba(255,255,255,0.3)" : "#bbb",
                    }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 44px 14px 42px",
                      borderRadius: "12px",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#fafafa",
                      color: isDark ? "#fff" : "#111",
                      fontSize: "15px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f97316";
                      e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: isDark ? "rgba(255,255,255,0.4)" : "#aaa",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  marginTop: "8px",
                  fontFamily: "inherit",
                  opacity: isLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 15px rgba(249,115,22,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(249,115,22,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(249,115,22,0.3)";
                }}
              >
                {isLoading ? (
                  <>
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "authSpin 0.6s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    로그인 중...
                  </>
                ) : (
                  <>
                    로그인
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OR Divider + Google Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              margin: "24px 0 20px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.4)" : "#aaa" }}>또는</span>
            <div style={{ flex: 1, height: "1px", background: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb" }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e0e0e0"}`,
              background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
              color: isDark ? "#fff" : "#333",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isGoogleLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              opacity: isGoogleLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isGoogleLoading) {
                e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#f8f8f8";
                e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.2)" : "#ccc";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#fff";
              e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "#e0e0e0";
            }}
          >
            {isGoogleLoading ? (
              <>
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    border: `2px solid ${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}`,
                    borderTopColor: isDark ? "#fff" : "#333",
                    borderRadius: "50%",
                    animation: "authSpin 0.6s linear infinite",
                    display: "inline-block",
                  }}
                />
                연결 중...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616Z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                  <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z" fill="#EA4335" />
                </svg>
                Google로 계속하기
              </>
            )}
          </button>

          {/* SIGNUP FORM */}
          {mode === "signup" && (
            <form
              onSubmit={handleSignup}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  닉네임
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isDark ? "rgba(255,255,255,0.3)" : "#bbb",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="사이트에서 사용할 이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 14px 14px 42px",
                      borderRadius: "12px",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#fafafa",
                      color: isDark ? "#fff" : "#111",
                      fontSize: "15px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f97316";
                      e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  이메일
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isDark ? "rgba(255,255,255,0.3)" : "#bbb",
                    }}
                  />
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 14px 14px 42px",
                      borderRadius: "12px",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#fafafa",
                      color: isDark ? "#fff" : "#111",
                      fontSize: "15px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f97316";
                      e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  비밀번호
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isDark ? "rgba(255,255,255,0.3)" : "#bbb",
                    }}
                  />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    placeholder="비밀번호 (6자 이상)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 44px 14px 42px",
                      borderRadius: "12px",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#fafafa",
                      color: isDark ? "#fff" : "#111",
                      fontSize: "15px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f97316";
                      e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: isDark ? "rgba(255,255,255,0.4)" : "#aaa",
                    }}
                  >
                    {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password strength */}
                {signupPassword && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        flex: 1,
                        height: "4px",
                        borderRadius: "2px",
                        background: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(passwordStrength.level / 4) * 100}%`,
                          height: "100%",
                          borderRadius: "2px",
                          background: passwordStrength.color,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  비밀번호 확인
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isDark ? "rgba(255,255,255,0.3)" : "#bbb",
                    }}
                  />
                  <input
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "14px 14px 14px 42px",
                      borderRadius: "12px",
                      border: `1px solid ${confirmPassword && confirmPassword !== signupPassword
                        ? "#ef4444"
                        : isDark
                          ? "rgba(255,255,255,0.1)"
                          : "#e5e7eb"
                        }`,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#fafafa",
                      color: isDark ? "#fff" : "#111",
                      fontSize: "15px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f97316";
                      e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor =
                        confirmPassword && confirmPassword !== signupPassword
                          ? "#ef4444"
                          : isDark
                            ? "rgba(255,255,255,0.1)"
                            : "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                {confirmPassword && confirmPassword !== signupPassword && (
                  <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", fontWeight: 500 }}>
                    비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </div>

              {/* Gender & Age Group */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    성별
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[
                      { value: "male", label: "남성" },
                      { value: "female", label: "여성" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGender(opt.value as "male" | "female")}
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "10px",
                          border: `1px solid ${gender === opt.value
                            ? "#f97316"
                            : isDark
                              ? "rgba(255,255,255,0.1)"
                              : "#e5e7eb"
                            }`,
                          background:
                            gender === opt.value
                              ? isDark
                                ? "rgba(249,115,22,0.15)"
                                : "rgba(249,115,22,0.06)"
                              : isDark
                                ? "rgba(255,255,255,0.05)"
                                : "#fafafa",
                          color:
                            gender === opt.value
                              ? "#f97316"
                              : isDark
                                ? "rgba(255,255,255,0.6)"
                                : "#666",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontFamily: "inherit",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isDark ? "rgba(255,255,255,0.6)" : "#555",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    연령대
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) =>
                      setAgeGroup(e.target.value as "10s" | "20s" | "30s" | "40s" | "")
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#fafafa",
                      color: ageGroup
                        ? isDark
                          ? "#fff"
                          : "#111"
                        : isDark
                          ? "rgba(255,255,255,0.4)"
                          : "#aaa",
                      fontSize: "13px",
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      appearance: "none",
                    }}
                  >
                    <option value="">선택</option>
                    <option value="10s">10대</option>
                    <option value="20s">20대</option>
                    <option value="30s">30대</option>
                    <option value="40s">40대 이상</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  marginTop: "8px",
                  fontFamily: "inherit",
                  opacity: isLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 15px rgba(249,115,22,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(249,115,22,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(249,115,22,0.3)";
                }}
              >
                {isLoading ? (
                  <>
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "authSpin 0.6s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    가입 중...
                  </>
                ) : (
                  <>
                    가입하기
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "12px",
            color: isDark ? "rgba(255,255,255,0.3)" : "#aaa",
          }}
        >
          가입 시{" "}
          <Link
            href="/legal/terms"
            style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#888", textDecoration: "underline" }}
          >
            이용약관
          </Link>{" "}
          및{" "}
          <Link
            href="/legal/privacy"
            style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#888", textDecoration: "underline" }}
          >
            개인정보처리방침
          </Link>
          에 동의합니다.
        </p>
      </div>

      <style jsx global>{`
        @keyframes authFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes authShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
        }
        @keyframes authSpin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}