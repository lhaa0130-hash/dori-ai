import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" }, // username -> email
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // ★ 이메일과 비번이 맞는지 확인
        if (credentials?.email && credentials?.password) {
          return {
            id: "1",
            // 이메일 앞부분을 이름으로 사용 (예: test@... -> test)
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
    signIn: '/login', // 로그인 페이지 경로 명시
    error: '/login',
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.name) {
        session.user.name = token.name;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
      }
      return token;
    }
  }
});

export { handler as GET, handler as POST };