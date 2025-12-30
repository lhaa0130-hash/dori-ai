"use client";

import { useSession } from "next-auth/react";

export default function DebugAuthPage() {
  const { data: session, status } = useSession();

  return (
    <div style={{ padding: "40px", fontFamily: "monospace" }}>
      <h1>인증 디버그 정보</h1>
      <div style={{ marginTop: "20px", padding: "20px", background: "#f5f5f5", borderRadius: "8px" }}>
        <h2>세션 상태: {status}</h2>
        {session?.user && (
          <div style={{ marginTop: "20px" }}>
            <h3>사용자 정보:</h3>
            <pre style={{ background: "#fff", padding: "15px", borderRadius: "4px", overflow: "auto" }}>
              {JSON.stringify(session.user, null, 2)}
            </pre>
            <div style={{ marginTop: "20px", padding: "15px", background: "#e3f2fd", borderRadius: "4px" }}>
              <strong>관리자 권한을 받으려면:</strong>
              <br />
              <code style={{ display: "block", marginTop: "10px", padding: "10px", background: "#fff" }}>
                app/api/auth/[...nextauth]/route.ts 파일의 ADMIN_EMAILS 배열에 다음 이메일을 추가하세요:
                <br />
                "{session.user.email}"
              </code>
            </div>
          </div>
        )}
        {!session && (
          <p>로그인이 필요합니다. <a href="/login">로그인 페이지로 이동</a></p>
        )}
      </div>
    </div>
  );
}




























