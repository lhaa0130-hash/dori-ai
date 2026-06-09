"use client";
import { useEffect } from "react";

/**
 * 스크롤 애니메이션 프로바이더
 * .scroll-reveal / .scroll-reveal-item 요소가 뷰포트에 진입하면 .in-view 를 추가합니다.
 *
 * ⚠️ 핵심: 어떤 이유로든(관찰 실패, 하이드레이션 지연, 구형 브라우저) 요소가
 *    opacity:0 상태로 영영 안 보이는 일이 없도록 다중 안전장치를 둡니다.
 */
export default function ScrollAnimationProvider() {
  useEffect(() => {
    const ALL = ".scroll-reveal, .scroll-reveal-item";
    const PENDING = ".scroll-reveal:not(.in-view), .scroll-reveal-item:not(.in-view)";

    const revealAll = () => {
      document.querySelectorAll<Element>(ALL).forEach((el) => el.classList.add("in-view"));
    };

    // IntersectionObserver 미지원 → 즉시 전부 표시
    if (typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
    );

    const observe = () => {
      document.querySelectorAll<Element>(PENDING).forEach((el) => observer.observe(el));
    };

    // 1) 즉시 관찰  2) 동적 콘텐츠 대비 재관찰
    observe();
    const t1 = setTimeout(observe, 250);

    // 3) 안전장치: 1.2초 안에 화면에 이미 보이는(또는 지나친) 요소는 무조건 표시
    const failsafe = setTimeout(() => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll<Element>(PENDING).forEach((el) => {
        const rect = el.getBoundingClientRect();
        // 뷰포트 안 또는 위쪽(이미 지나친) 요소 → 즉시 표시
        if (rect.top < vh * 0.95) el.classList.add("in-view");
      });
    }, 1200);

    // 4) 최후 안전장치: 페이지 완전 로드 후에도 남아있으면 전부 표시
    const onLoad = () => setTimeout(revealAll, 200);
    window.addEventListener("load", onLoad);

    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(failsafe);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
