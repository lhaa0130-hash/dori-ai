"use client";
import { useEffect } from "react";

/**
 * 스크롤 애니메이션 프로바이더
 * .scroll-reveal 클래스를 가진 요소가 뷰포트에 진입하면 .in-view 를 추가합니다.
 * Toss cubic-bezier(0.22, 1, 0.36, 1) 이징으로 자연스럽게 등장합니다.
 */
export default function ScrollAnimationProvider() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.07,
        rootMargin: "0px 0px -32px 0px",
      }
    );

    const observe = () => {
      document
        .querySelectorAll<Element>(".scroll-reveal:not(.in-view)")
        .forEach((el) => observer.observe(el));
    };

    // 초기 관찰 + 동적 콘텐츠 로딩 후 재관찰
    observe();
    const t = setTimeout(observe, 350);

    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, []);

  return null;
}
