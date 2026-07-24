// 타입은 `type` 지시자로 분리해 값 import 와 섞이지 않게 한다.
// (Next 번들러 외에 Node 의 TypeScript 타입 스트리핑으로도 로드 가능해야 emulator 통합 테스트가 돌아간다)
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBKrnvupYQirvspkbIS8vPrp1UqQcn7lA4",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dori-ai-0130.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dori-ai-0130",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dori-ai-0130.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1023160315279",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1023160315279:web:d4de24d8893c7463642ffa",
};

// ── Firebase Emulator 연결(개발·테스트 전용) ────────────────────────────
// ⚠️ 두 조건을 모두 만족할 때만 켜진다. production 빌드에서는 절대 활성화되지 않는다.
//    · NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
//    · NODE_ENV !== "production"
// 플래그가 꺼져 있으면 아래 코드는 실행되지 않아 기존 동작과 완전히 동일하다.
const USE_EMULATOR =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    process.env.NODE_ENV !== "production";

const EMULATOR_HOST = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1";
const EMULATOR_AUTH_PORT = Number(process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_AUTH_PORT || 9099);
const EMULATOR_FIRESTORE_PORT = Number(process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_FIRESTORE_PORT || 8080);

// hot reload 로 모듈이 재평가돼도 connect*Emulator 가 중복 호출되지 않도록 각 인스턴스당 1회만.
let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

// 클라이언트/서버 공용 싱글톤
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

function getFirebaseApp(): FirebaseApp {
    if (!app) {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    }
    return app;
}

function getFirebaseAuth(): Auth {
    if (typeof window === "undefined" && !process.env.NEXT_RUNTIME) {
        // 엣지 런타임이나 서버 환경에서는 체크 필요하나, 기본적으로 초기화 시도
    }
    if (!auth) {
        const app = getFirebaseApp();
        auth = getAuth(app);
        if (USE_EMULATOR && !authEmulatorConnected) {
            authEmulatorConnected = true;
            connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_AUTH_PORT}`, { disableWarnings: true });
        }
    }
    return auth;
}

function getFirebaseFirestore(): Firestore {
    if (!firestore) {
        const app = getFirebaseApp();
        firestore = getFirestore(app);
        if (USE_EMULATOR && !firestoreEmulatorConnected) {
            firestoreEmulatorConnected = true;
            connectFirestoreEmulator(firestore, EMULATOR_HOST, EMULATOR_FIRESTORE_PORT);
        }
    }
    return firestore;
}

function getFirebaseStorage(): FirebaseStorage {
    if (!storage) {
        const app = getFirebaseApp();
        storage = getStorage(app);
    }
    return storage;
}

function getGoogleProvider(): GoogleAuthProvider {
    if (!googleProvider) {
        googleProvider = new GoogleAuthProvider();
    }
    return googleProvider;
}

// ── 에뮬레이터 전용 테스트 seam ─────────────────────────────────────────
// 목적: 브라우저 offline→online 통합 검증에서 에뮬레이터 계정으로 로그인하기 위함.
// USE_EMULATOR(개발 + 명시 플래그)일 때만 window 에 붙으므로 production 번들에서는 절대 존재하지 않는다.
// 05-06C 검증 외에 필요 없어지면 이 블록만 삭제하면 된다.
if (USE_EMULATOR && typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__ILLO_EMULATOR__ = {
        signInTestUser: async (email: string, password: string) => {
            const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import("firebase/auth");
            const a = getFirebaseAuth();
            try {
                const created = await createUserWithEmailAndPassword(a, email, password);
                return created.user.uid;
            } catch {
                const signed = await signInWithEmailAndPassword(a, email, password);
                return signed.user.uid;
            }
        },
        currentUid: () => getFirebaseAuth().currentUser?.uid ?? null,
    };
}

export { getFirebaseAuth, getGoogleProvider, getFirebaseFirestore, getFirebaseStorage };
