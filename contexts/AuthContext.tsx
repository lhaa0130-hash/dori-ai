"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore, getGoogleProvider } from "@/lib/firebase";
import { hydrateGameData } from "@/lib/cottonCandy";

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
    ageGroup?: "10s" | "20s" | "30s" | "40s" | "50s" | "60s+";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Firebase User → 세션 형식 매핑
function mapUser(fu: FirebaseUser): AuthSession {
    return {
        user: {
            email: fu.email || "",
            name: fu.displayName || (fu.email ? fu.email.split("@")[0] : "사용자"),
            image: fu.photoURL || undefined,
        },
    };
}

// Firebase 에러코드 → 한국어 메시지
function mapError(e: any): string {
    const code = e?.code || "";
    switch (code) {
        case "auth/email-already-in-use": return "이미 등록된 이메일입니다.";
        case "auth/invalid-email": return "올바르지 않은 이메일 형식입니다.";
        case "auth/weak-password": return "비밀번호는 6자 이상이어야 합니다.";
        case "auth/user-not-found": return "등록되지 않은 이메일입니다.";
        case "auth/wrong-password":
        case "auth/invalid-credential": return "이메일 또는 비밀번호가 일치하지 않습니다.";
        case "auth/popup-closed-by-user": return "로그인 창이 닫혔습니다.";
        case "auth/too-many-requests": return "잠시 후 다시 시도해주세요.";
        case "auth/network-request-failed": return "네트워크 오류입니다.";
        default: return e?.message || "오류가 발생했습니다.";
    }
}

// Firestore에 회원 프로필 보장 (없으면 생성) — 회원수 집계의 기준
async function ensureProfile(fu: FirebaseUser, extra?: Partial<SignupData>) {
    try {
        const db = getFirebaseFirestore();
        const ref = doc(db, "users", fu.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, {
                uid: fu.uid,
                email: fu.email || "",
                name: fu.displayName || extra?.name || (fu.email ? fu.email.split("@")[0] : "사용자"),
                gender: extra?.gender || null,
                ageGroup: extra?.ageGroup || null,
                tier: 1,
                level: 1,
                doriExp: 0,
                cottonCandy: 100, // 가입 환영 솜사탕
                cottonCandyTotal: 100,
                attendance: { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 },
                provider: fu.providerData[0]?.providerId || "password",
                createdAt: serverTimestamp(),
            });
        }
        // 로컬 프로필 호환 (기존 컴포넌트들이 참조)
        if (typeof window !== "undefined" && fu.email) {
            localStorage.setItem(`dori_user_name_${fu.email}`, fu.displayName || extra?.name || fu.email.split("@")[0]);
        }
    } catch (err) {
        console.warn("ensureProfile 실패:", err);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    // Firebase 인증 상태 구독 (기기/탭 무관하게 서버 기준 세션 복원)
    useEffect(() => {
        let unsub = () => {};
        try {
            const auth = getFirebaseAuth();
            unsub = onAuthStateChanged(auth, (fu) => {
                if (fu) {
                    setSession(mapUser(fu));
                    setStatus("authenticated");
                    hydrateGameData(); // Firestore → localStorage 솜사탕/출석 동기화
                } else {
                    setSession(null);
                    setStatus("unauthenticated");
                }
            });
        } catch (err) {
            console.error("Firebase auth 초기화 실패 (환경변수 확인 필요):", err);
            setStatus("unauthenticated");
        }
        return () => unsub();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const auth = getFirebaseAuth();
            const cred = await signInWithEmailAndPassword(auth, email, password);
            await ensureProfile(cred.user);
            return { success: true };
        } catch (err) {
            return { success: false, error: mapError(err) };
        }
    }, []);

    const loginWithGoogle = useCallback(async () => {
        try {
            const auth = getFirebaseAuth();
            const result = await signInWithPopup(auth, getGoogleProvider());
            await ensureProfile(result.user);
            return { success: true };
        } catch (err) {
            return { success: false, error: mapError(err) };
        }
    }, []);

    const signup = useCallback(async (data: SignupData) => {
        try {
            const auth = getFirebaseAuth();
            const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await updateProfile(cred.user, { displayName: data.name });
            await ensureProfile(cred.user, data);
            // 즉시 세션 반영 (onAuthStateChanged보다 빠르게)
            setSession({ user: { email: data.email, name: data.name } });
            setStatus("authenticated");
            return { success: true };
        } catch (err) {
            return { success: false, error: mapError(err) };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut(getFirebaseAuth());
        } catch (err) {
            console.warn("logout 실패:", err);
        }
        setSession(null);
        setStatus("unauthenticated");
    }, []);

    const update = useCallback(async (data: Partial<AuthUser>) => {
        try {
            const auth = getFirebaseAuth();
            if (auth.currentUser && data.name) {
                await updateProfile(auth.currentUser, { displayName: data.name });
            }
        } catch (err) {
            console.warn("update 실패:", err);
        }
        setSession((prev) => (prev ? { ...prev, user: { ...prev.user, ...data } } : prev));
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

// next-auth 호환 래퍼 (기존 코드 마이그레이션 최소화)
export function useSession() {
    const { session, status } = useAuth();
    return {
        data: session,
        status,
        update: useAuth().update,
    };
}
