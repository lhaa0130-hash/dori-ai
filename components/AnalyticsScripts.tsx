"use client";
import Script from "next/script";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "lhaa0130@gmail.com";
const GA_ID = "G-RKN3F8V01C";
const CLARITY_ID = "va2qmv3mwz";

// 방문 통계(GA4·Clarity) 스크립트 — 관리자 본인 로그인 시엔 아예 로드하지 않아
// DAU/WAU/MAU 등 방문 지표에서 내 방문이 집계되지 않도록 한다.
export default function AnalyticsScripts() {
  const { session, status } = useAuth();
  const isAdmin = (session?.user?.email || "").toLowerCase() === ADMIN_EMAIL;
  // 로그인 상태 확인 전엔 대기(잠깐), 관리자면 로드 안 함
  if (status === "loading" || isAdmin) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
      <Script id="google-analytics" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GA_ID}');`}
      </Script>
      <Script id="microsoft-clarity" strategy="lazyOnload">
        {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${CLARITY_ID}");`}
      </Script>
    </>
  );
}
