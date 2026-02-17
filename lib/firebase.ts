import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// 클라이언트에서만 초기화 (SSR/프리렌더링 시 에러 방지)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

function getFirebaseAuth(): Auth {
    if (typeof window === "undefined") {
        throw new Error("Firebase auth is only available on client side");
    }
    if (!auth) {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
    }
    return auth;
}

function getGoogleProvider(): GoogleAuthProvider {
    if (!googleProvider) {
        getFirebaseAuth(); // auth 초기화 시 provider도 같이 생성
    }
    return googleProvider!;
}

export { getFirebaseAuth, getGoogleProvider };
