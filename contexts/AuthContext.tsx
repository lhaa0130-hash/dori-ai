"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// next-auth 호환 세션 형식
interface AuthUser {
    email: string;
    name: string;
    image?: string;
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
            const { signInWithPopup } = await import("firebase/auth");
            const { getFirebaseAuth, getGoogleProvider } = await import("@/lib/firebase");
            const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
            const user = result.user;

            const newSession: AuthSession = {
                user: {
                    email: user.email || "",
                    name: user.displayName || "Google User",
                    image: user.photoURL || undefined,
                },
            };

            // 프로필 데이터 생성 (없으면)
            const profileKey = `dori_profile_${user.email}`;
            if (!localStorage.getItem(profileKey)) {
                const profileData = {
                    id: user.email,
                    email: user.email,
                    nickname: user.displayName || "Google User",
                    gender: "male",
                    ageGroup: "20s",
                    tier: 1,
                    level: 1,
                    doriExp: 0,
                    point: 0,
                    createdAt: new Date().toISOString(),
                    provider: "google",
                };
                localStorage.setItem(profileKey, JSON.stringify(profileData));
                localStorage.setItem(`dori_user_name_${user.email}`, user.displayName || "Google User");
            }

            setSession(newSession);
            setStatus("authenticated");
            saveSession(newSession);

            return { success: true };
        } catch (err: any) {
            if (err?.code === "auth/popup-closed-by-user") {
                return { success: false, error: "로그인이 취소되었습니다." };
            }
            if (err?.code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") {
                return { success: false, error: "Firebase 설정이 필요합니다. .env.local 파일을 확인하세요." };
            }
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
        try {
            const { signOut } = await import("firebase/auth");
            const { getFirebaseAuth } = await import("@/lib/firebase");
            await signOut(getFirebaseAuth());
        } catch (e) {
            // Firebase 로그아웃 실패해도 로컬 세션은 정리
        }
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
