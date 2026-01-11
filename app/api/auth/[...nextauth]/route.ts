import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const ADMIN_EMAILS = [
  "admin@dori.ai", 
  "lhaa0130@gmail.com",
];

// NEXTAUTH_URL 자동 감지
const getNextAuthUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  // 개발 환경에서 자동 감지
  if (process.env.NODE_ENV === "development") {
    const host = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.PORT
      ? `http://localhost:${process.env.PORT}`
      : "http://localhost:3000";
    return host;
  }
  // 프로덕션에서는 환경 변수 필수
  return undefined;
};

const nextAuthUrl = getNextAuthUrl();

// 환경 변수 체크 및 로깅
if (process.env.NODE_ENV === "development") {
  console.log("🔍 NextAuth 설정 확인:");
  console.log(`  NEXTAUTH_URL: ${nextAuthUrl || "⚠️ 설정되지 않음"}`);
  console.log(`  GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "✅ 설정됨" : "⚠️ 설정되지 않음"}`);
  console.log(`  GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? "✅ 설정됨" : "⚠️ 설정되지 않음"}`);
  console.log(`  NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "✅ 설정됨" : "⚠️ 기본값 사용"}`);
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("\n⚠️ 구글 로그인을 사용하려면 .env.local 파일에 다음을 추가하세요:");
    console.warn("   GOOGLE_CLIENT_ID=your-client-id");
    console.warn("   GOOGLE_CLIENT_SECRET=your-client-secret");
    console.warn("   NEXTAUTH_URL=http://localhost:3000");
    console.warn("   NEXTAUTH_SECRET=your-secret-key\n");
  }
}

// 구글 프로바이더 설정
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const providers = [
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
];

// 구글 프로바이더 추가 (환경 변수가 있을 때만)
if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
} else if (process.env.NODE_ENV === "development") {
  console.warn("⚠️ 구글 프로바이더가 비활성화되었습니다. GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 확인하세요.");
}

const handler = NextAuth({
  providers,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: "jwt", maxAge: 10 * 60 }, // 10분 (600초)
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  ...(nextAuthUrl && { url: nextAuthUrl }),
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
        token.email = user.email;
        // 이름은 클라이언트에서 localStorage를 통해 관리하므로
        // 여기서는 기본값만 설정 (실제로는 클라이언트에서 덮어씀)
        token.name = user.name;
      }
      if (account?.provider === "google" && user?.email) {
        token.email = user.email;
        // Google 로그인 시에도 클라이언트에서 localStorage 확인 후 설정
        token.name = user.name;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // 모든 로그인 허용
      if (account?.provider === "google") {
        // 구글 로그인 에러 로깅
        if (process.env.NODE_ENV === "development") {
          console.log("✅ Google sign in success:", { 
            hasUser: !!user, 
            hasAccount: !!account,
            userEmail: user?.email,
            accountId: account?.providerAccountId
          });
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 상대 경로인 경우 baseUrl과 결합
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // 같은 도메인이면 허용
      if (new URL(url).origin === baseUrl) return url;
      // 기본적으로 baseUrl로 리디렉션
      return baseUrl;
    }
  }
});

export { handler as GET, handler as POST };