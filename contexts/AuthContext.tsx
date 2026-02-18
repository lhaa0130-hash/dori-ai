"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// next-auth 호환 세션 형식
interface AuthUser {
    email: string;
    name: string;
    image?: string;
}

declare global {
    interface Window {
        google: any;
    }
}

interface AuthSession {
    user: AuthUser;
}

interface AuthContextType {
    session: AuthSession | null;
    status: "loading" | "authenticated" | "unauthenticated";
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
    signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    update: (data: Partial<AuthUser>) => void;
}

export interface SignupData {
    email: string;
    password: string;
    name: string;
    gender?: "male" | "female";
    ageGroup?: "10s" | "20s" | "30s" | "40s";
}

interface StoredUser {
    email: string;
    name: string;
    passwordHash: string;
    gender: "male" | "female";
    ageGroup: "10s" | "20s" | "30s" | "40s";
    createdAt: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 간단한 해싱 (SHA-256)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "_dori_salt_2024");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SESSION_KEY = "dori_auth_session";
const USERS_KEY = "dori_auth_users";

function getStoredUsers(): StoredUser[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveStoredUsers(users: StoredUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStoredSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

function saveSession(session: AuthSession | null) {
    if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    // 초기 세션 복원
    useEffect(() => {
        const stored = getStoredSession();
        if (stored) {
            setSession(stored);
            setStatus("authenticated");
        } else {
            setStatus("unauthenticated");
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const users = getStoredUsers();
            const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                return { success: false, error: "등록되지 않은 이메일입니다." };
            }

            const hash = await hashPassword(password);
            if (hash !== user.passwordHash) {
                return { success: false, error: "비밀번호가 일치하지 않습니다." };
            }

            const newSession: AuthSession = {
                user: {
                    email: user.email,
                    name: user.name,
                },
            };

            setSession(newSession);
            setStatus("authenticated");
            saveSession(newSession);

            return { success: true };
        } catch (err) {
            return { success: false, error: "로그인 중 오류가 발생했습니다." };
        }
    }, []);

    const loginWithGoogle = useCallback(async () => {
        try {
            // Google GIS SDK 로드 대기
            if (!window.google) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://accounts.google.com/gsi/client";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            return new Promise<{ success: boolean; error?: string }>((resolve) => {
                const client = window.google.accounts.oauth2.initCodeClient({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "521494096910-p5ft4jshv4e9amh9upm1jbs6f1a552ov.apps.googleusercontent.com",
                    scope: "openid email profile",
                    ux_mode: "popup",
                    callback: async (response: any) => {
                        if (response.code) {
                            try {
                                // 구글 유저 정보 가져오기 (원래는 서버에서 해야하지만 정적 사이트이므로 클라이언트에서 간소화)
                                // 실제로는 여기서 코드를 서버로 보내야 하지만, 여기서는 직접 유저 정보 세팅 시뮬레이션
                                // (이후에 실제 API 연동이 필요할 수 있음)

                                // 임시로 이름만 "Google User"로 설정 (실제 구현 시 토큰 디코딩 필요)
                                const decodedEmail = "google_user@gmail.com";

                                const newSession: AuthSession = {
                                    user: {
                                        email: decodedEmail,
                                        name: "Google 사용자",
                                    },
                                };

                                setSession(newSession);
                                setStatus("authenticated");
                                saveSession(newSession);
                                resolve({ success: true });
                            } catch (e) {
                                resolve({ success: false, error: "구글 프로필 정보 획득 실패" });
                            }
                        }
                    },
                    error_callback: (err: any) => {
                        resolve({ success: false, error: err.message || "Google 로그인 실패" });
                    }
                });
                client.requestCode();
            });

        } catch (err: any) {
            console.error("Google login error:", err);
            return { success: false, error: "Google 로그인 중 오류가 발생했습니다." };
        }
    }, []);

    const signup = useCallback(async (data: SignupData) => {
        try {
            const users = getStoredUsers();

            // 이메일 중복 확인
            if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
                return { success: false, error: "이미 등록된 이메일입니다." };
            }

            const passwordHash = await hashPassword(data.password);

            const newUser: StoredUser = {
                email: data.email,
                name: data.name,
                passwordHash,
                gender: data.gender || "male",
                ageGroup: data.ageGroup || "10s",
                createdAt: new Date().toISOString(),
            };

            users.push(newUser);
            saveStoredUsers(users);

            // 프로필 데이터도 생성
            const profileData = {
                id: data.email,
                email: data.email,
                nickname: data.name,
                gender: data.gender,
                ageGroup: data.ageGroup,
                tier: 1,
                level: 1,
                doriExp: 0,
                point: 0,
                createdAt: newUser.createdAt,
            };
            localStorage.setItem(`dori_profile_${data.email}`, JSON.stringify(profileData));
            localStorage.setItem(`dori_user_name_${data.email}`, data.name);

            // 자동 로그인
            const newSession: AuthSession = {
                user: {
                    email: data.email,
                    name: data.name,
                },
            };

            setSession(newSession);
            setStatus("authenticated");
            saveSession(newSession);

            return { success: true };
        } catch (err) {
            return { success: false, error: "회원가입 중 오류가 발생했습니다." };
        }
    }, []);

    const logout = useCallback(async () => {
        // Firebase 로그아웃 제거
        setSession(null);
        setStatus("unauthenticated");
        saveSession(null);
    }, []);

    const update = useCallback((data: Partial<AuthUser>) => {
        setSession((prev) => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                user: { ...prev.user, ...data },
            };
            saveSession(updated);
            return updated;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ session, status, login, loginWithGoogle, signup, logout, update }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// next-auth 호환 래퍼 (기존 코드 마이그레이션을 최소화)
export function useSession() {
    const { session, status } = useAuth();
    return {
        data: session,
        status,
        update: useAuth().update,
    };
}
