"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Firestore에 유저 프로필 초기 생성
async function createUserProfile(uid: string, email: string, name: string, gender?: string, ageGroup?: string) {
  const db = getFirebaseFirestore();
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      email,
      nickname: name,
      gender: gender || "",
      ageGroup: ageGroup || "",
      tier: 1,
      level: 1,
      doriExp: 0,
      cottonCandy: 0,
      isPremium: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // 솜사탕 서브컬렉션 초기화
    const statsRef = doc(db, "users", uid, "stats", "summary");
    await setDoc(statsRef, {
      totalCottonCandyEarned: 0,
      minigamePlays: 0,
      quizCorrect: 0,
      totalAttendanceDays: 0,
      streak: 0,
      updatedAt: serverTimestamp(),
    });
  }
}

// Firestore에서 세션용 유저 정보 가져오기
async function fetchUserSession(firebaseUser: FirebaseUser): Promise<AuthSession> {
  const db = getFirebaseFirestore();
  const userRef = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      user: {
        email: firebaseUser.email || "",
        name: data.nickname || firebaseUser.displayName || "",
        image: firebaseUser.photoURL || undefined,
      },
    };
  }

  // Firestore에 프로필 없으면 기본값으로 생성
  await createUserProfile(
    firebaseUser.uid,
    firebaseUser.email || "",
    firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User"
  );

  return {
    user: {
      email: firebaseUser.email || "",
      name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
      image: firebaseUser.photoURL || undefined,
    },
  };
}

// localStorage 마이그레이션: 기존 데이터를 Firestore로 이전
async function migrateLocalStorageData(uid: string, email: string) {
  if (typeof window === "undefined") return;
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    // 기존 프로필 데이터 마이그레이션
    const profileRaw = localStorage.getItem(`dori_profile_${email}`);
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      const updates: Record<string, any> = {};
      if (profile.cottonCandy > 0) updates.cottonCandy = profile.cottonCandy;
      if (profile.doriExp > 0) updates.doriExp = profile.doriExp;
      if (profile.level > 1) updates.level = profile.level;
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        await updateDoc(userRef, updates);
      }
      // 마이그레이션 완료 후 localStorage 정리
      localStorage.removeItem(`dori_profile_${email}`);
    }

    // 기존 회원 목록에서 해당 유저 제거 (민감 데이터 정리)
    const usersRaw = localStorage.getItem("dori_auth_users");
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      const filtered = users.filter((u: any) => u.email.toLowerCase() !== email.toLowerCase());
      localStorage.setItem("dori_auth_users", JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Migration error:", e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  // Firebase Auth 상태 감지 (앱 시작 시 자동 로그인 복원)
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const sess = await fetchUserSession(firebaseUser);
          // 기존 localStorage 데이터 마이그레이션 (최초 1회)
          await migrateLocalStorageData(firebaseUser.uid, firebaseUser.email || "");
          setSession(sess);
          setStatus("authenticated");
        } catch (e) {
          console.error("Session restore error:", e);
          setStatus("unauthenticated");
        }
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const sess = await fetchUserSession(credential.user);
      await migrateLocalStorageData(credential.user.uid, email);
      setSession(sess);
      setStatus("authenticated");
      return { success: true };
    } catch (err: any) {
      console.error("Login error:", err);
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        return { success: false, error: "등록되지 않은 이메일이거나 비밀번호가 틀렸습니다." };
      }
      if (code === "auth/wrong-password") {
        return { success: false, error: "비밀번호가 일치하지 않습니다." };
      }
      if (code === "auth/too-many-requests") {
        return { success: false, error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요." };
      }
      return { success: false, error: "로그인 중 오류가 발생했습니다." };
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const firebaseUser = credential.user;

      // 최초 Google 로그인 시 Firestore에 프로필 생성
      await createUserProfile(
        firebaseUser.uid,
        firebaseUser.email || "",
        firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User"
      );

      const sess = await fetchUserSession(firebaseUser);
      setSession(sess);
      setStatus("authenticated");
      return { success: true };
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        return { success: false, error: "Google 로그인 창이 닫혔습니다." };
      }
      return { success: false, error: "Google 로그인 중 오류가 발생했습니다." };
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    try {
      const auth = getFirebaseAuth();
      // Firebase Auth에 계정 생성
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = credential.user;

      // displayName 설정
      await updateProfile(firebaseUser, { displayName: data.name });

      // Firestore에 프로필 생성
      await createUserProfile(
        firebaseUser.uid,
        data.email,
        data.name,
        data.gender,
        data.ageGroup
      );

      const sess: AuthSession = {
        user: {
          email: data.email,
          name: data.name,
        },
      };
      setSession(sess);
      setStatus("authenticated");
      return { success: true };
    } catch (err: any) {
      console.error("Signup error:", err);
      const code = err.code || "";
      if (code === "auth/email-already-in-use") {
        return { success: false, error: "이미 등록된 이메일입니다." };
      }
      if (code === "auth/weak-password") {
        return { success: false, error: "비밀번호는 6자 이상이어야 합니다." };
      }
      if (code === "auth/invalid-email") {
        return { success: false, error: "올바른 이메일 형식이 아닙니다." };
      }
      return { success: false, error: "회원가입 중 오류가 발생했습니다." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const update = useCallback(async (data: Partial<AuthUser>) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        user: { ...prev.user, ...data },
      };
    });

    // Firestore도 업데이트
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (firebaseUser && data.name) {
        const db = getFirebaseFirestore();
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, {
          nickname: data.name,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error("Update error:", e);
    }
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
