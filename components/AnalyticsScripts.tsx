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
  // 자동화 브라우저(Playwright·Puppeteer·Selenium 등 E2E 테스트)는 GA4·Clarity를 로드하지 않는다.
  // navigator.webdriver=true 로 감지 — 테스트 트래픽이 방문 통계에 잡히거나 애드센스 무효 트래픽으로
  // 오인되지 않게 한다. (예: /world-map E2E가 하루 350+ '방문'으로 집계된 사고 방지)
  const isBot = typeof navigator !== "undefined" && navigator.webdriver === true;
  // 로그인 상태 확인 전엔 대기(잠깐), 관리자·자동화 브라우저면 로드 안 함
  if (status === "loading" || isAdmin || isBot) return null;
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
