import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const ADMIN_EMAILS = [
  "admin@dori.ai", 
  "lhaa0130@gmail.com",
];

// 환경 변수 체크 및 로깅
if (process.env.NODE_ENV === "development") {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️ GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET이 설정되지 않았습니다.");
  } else {
    console.log("✅ 구글 로그인 환경 변수가 설정되어 있습니다.");
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (credentials?.email && credentials?.password) {
          return {
            id: "1",
            name: credentials.email.split("@")[0], 
            email: credentials.email,
          };
        }
        return null;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        if (token.name) {
          session.user.name = token.name as string;
        }
        if (token.email) {
          session.user.email = token.email as string;
        }
        // 관리자 권한 추가
        const userEmail = (token.email as string)?.toLowerCase() || "";
        (session.user as any).isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
      }
      if (account?.provider === "google" && user?.email) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // 모든 로그인 허용
      if (account?.provider === "google") {
        // 구글 로그인 에러 로깅
        if (process.env.NODE_ENV === "development") {
          console.log("Google sign in attempt:", { 
            hasUser: !!user, 
            hasAccount: !!account,
            userEmail: user?.email 
          });
        }
      }
      return true;
    }
  }
});

export { handler as GET, handler as POST };