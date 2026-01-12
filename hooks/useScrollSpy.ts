import { useEffect, useState, RefObject } from 'react';

interface ScrollSpyOptions {
  /**
   * 섹션 ID와 메뉴 ID의 매핑
   * 예: [{ sectionId: 'home', menuId: 'home' }, ...]
   */
  items: Array<{ sectionId: string; menuId: string }>;
  /**
   * 섹션 요소들의 ref 객체
   */
  sectionRefs: RefObject<{ [key: string]: HTMLElement | null }>;
  /**
   * 활성화되기 위해 필요한 뷰포트 비율 (0.0 ~ 1.0)
   * 기본값: 0.5 (50%)
   */
  threshold?: number;
  /**
   * 뷰포트 상단/하단 마진 (px)
   * 기본값: '-20% 0px -20% 0px' (화면 중앙 60% 영역)
   */
  rootMargin?: string;
  /**
   * 컴포넌트가 마운트되었는지 여부
   */
  mounted?: boolean;
}

/**
 * Intersection Observer를 사용한 스크롤 스파이 훅
 * 
 * 현재 뷰포트에 보이는 섹션을 감지하여 활성 메뉴를 자동으로 업데이트합니다.
 * 
 * @example
 * ```tsx
 * const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
 * const navItems = [
 *   { id: 'home', label: '홈', href: '#home' },
 *   { id: 'features', label: '기능', href: '#features' },
 * ];
 * 
 * const activeSection = useScrollSpy({
 *   items: navItems.map(item => ({ 
 *     sectionId: item.href.substring(1), 
 *     menuId: item.id 
 *   })),
 *   sectionRefs,
 *   mounted,
 * });
 * ```
 */
export function useScrollSpy({
  items,
  sectionRefs,
  threshold = 0.5,
  rootMargin = '-20% 0px -20% 0px',
  mounted = true,
}: ScrollSpyOptions): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted) return;

    const observers: IntersectionObserver[] = [];
    const sectionVisibility: Map<string, number> = new Map();

    // 각 섹션에 대해 Intersection Observer 생성
    items.forEach(({ sectionId, menuId }) => {
      const element = sectionRefs.current?.[sectionId];
      
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // intersectionRatio는 0.0 ~ 1.0 사이의 값
            // threshold 이상 보이면 해당 섹션을 활성화 후보로 기록
            if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
              sectionVisibility.set(menuId, entry.intersectionRatio);
            } else {
              sectionVisibility.delete(menuId);
            }

            // 가장 많이 보이는 섹션을 활성 섹션으로 설정
            if (sectionVisibility.size > 0) {
              const mostVisible = Array.from(sectionVisibility.entries())
                .sort((a, b) => b[1] - a[1])[0];
              setActiveId(mostVisible[0]);
            } else {
              // 아무 섹션도 threshold 이상 보이지 않으면
              // 가장 가까운 섹션 찾기
              const scrollY = window.scrollY;
              const viewportHeight = window.innerHeight;
              const centerY = scrollY + viewportHeight / 2;

              let closestId: string | null = null;
              let closestDistance = Infinity;

              items.forEach(({ sectionId: sid, menuId: mid }) => {
                const el = sectionRefs.current?.[sid];
                if (!el) return;

                const rect = el.getBoundingClientRect();
                const elementTop = rect.top + scrollY;
                const elementBottom = elementTop + rect.height;
                const elementCenter = (elementTop + elementBottom) / 2;

                const distance = Math.abs(centerY - elementCenter);
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestId = mid;
                }
              });

              if (closestId) {
                setActiveId(closestId);
              }
            }
          });
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1],
          rootMargin,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    // 초기 활성 섹션 설정
    const initialScrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const centerY = initialScrollY + viewportHeight / 2;

    let initialActiveId: string | null = null;
    let closestDistance = Infinity;

    items.forEach(({ sectionId, menuId }) => {
      const element = sectionRefs.current?.[sectionId];
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + initialScrollY;
      const elementBottom = elementTop + rect.height;
      const elementCenter = (elementTop + elementBottom) / 2;

      const distance = Math.abs(centerY - elementCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        initialActiveId = menuId;
      }
    });

    if (initialActiveId) {
      setActiveId(initialActiveId);
    }

    return () => {
      observers.forEach((observer) => observer.disconnect());
      sectionVisibility.clear();
    };
  }, [mounted, items, sectionRefs, threshold, rootMargin]);

  return activeId;
}

