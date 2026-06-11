"use client";
import { useEffect } from "react";

/**
 * 스크롤 애니메이션 프로바이더
 * .scroll-reveal / .scroll-reveal-item 요소가 뷰포트에 진입하면 .in-view 를 추가.
 *
 * ⚠️ 견고성 핵심:
 * - 레이아웃에 1회 마운트되므로 SPA 페이지 이동 시 '새로 추가된' 요소도 관찰해야 함
 *   → MutationObserver로 DOM 추가를 감지해 매번 다시 observe.
 * - 어떤 이유로든 관찰이 안 돼도 콘텐츠가 영영 안 보이는 일이 없도록 다중 안전장치.
 */
export default function ScrollAnimationProvider() {
  useEffect(() => {
    const ALL = ".scroll-reveal, .scroll-reveal-item";
    const PENDING = ".scroll-reveal:not(.in-view), .scroll-reveal-item:not(.in-view)";

    const revealAll = () =>
      document.querySelectorAll<Element>(ALL).forEach((el) => el.classList.add("in-view"));

    // IntersectionObserver 미지원 → 즉시 전부 표시
    if (typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
    );

    const observePending = () => {
      document.querySelectorAll<Element>(PENDING).forEach((el) => io.observe(el));
    };

    // 화면에 이미 보이거나 지나친 요소는 즉시 표시 (블링크 최소화)
    const revealInView = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll<Element>(PENDING).forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add("in-view");
      });
    };

    observePending();
    revealInView();

    // SPA 페이지 이동 등으로 새 요소가 추가되면 다시 관찰 + 화면 내 요소 표시
    const mo = new MutationObserver(() => {
      observePending();
      revealInView();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // 안전장치: 1.2초 뒤에도 화면 내 미표시 요소가 있으면 표시
    const t = setTimeout(revealInView, 1200);

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(t);
    };
  }, []);

  return null;
}
