import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// 클라이언트/서버 공용 싱글톤
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
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
    }
    return auth;
}

function getFirebaseFirestore(): Firestore {
    if (!firestore) {
        const app = getFirebaseApp();
        firestore = getFirestore(app);
    }
    return firestore;
}

function getGoogleProvider(): GoogleAuthProvider {
    if (!googleProvider) {
        googleProvider = new GoogleAuthProvider();
    }
    return googleProvider;
}

export { getFirebaseAuth, getGoogleProvider, getFirebaseFirestore };
