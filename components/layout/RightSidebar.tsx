"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RightSidebar() {
  const pathname = usePathname();

  const menuGroups = [
    {
      label: "내 워크스페이스",
      items: [
        { name: "대시보드 홈", path: "/my" },
        { name: "알림 센터", path: "/notifications", badge: 3 },
        { name: "보관함 / 즐겨찾기", path: "/my/library" },
        { name: "프로필 및 설정", path: "/settings" },
      ]
    },
    {
      label: "빠른 실행 도구",
      items: [
        { name: "프롬프트 생성기", path: "/studio/prompt", tag: "Beta" },
        { name: "이미지 업스케일러", path: "/studio/upscale" },
        { name: "배경 제거 (Remove BG)", path: "/studio/remove-bg" },
      ]
    },
    {
      label: "고객 지원",
      items: [
        { name: "요금제 안내", path: "/pricing" },
        { name: "자주 묻는 질문", path: "/help/faq" },
        { name: "1:1 문의하기", path: "/help/contact" },
        { name: "이용약관", path: "/terms" },
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <>
      <aside className="right-sidebar">
        <div className="sidebar-scroll">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="menu-group">
              <h3 className="group-header">{group.label}</h3>
              
              <ul className="menu-list">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.name}>
                      <Link href={item.path} className={`menu-text-link ${active ? 'active' : ''}`}>
                        {/* 텍스트 */}
                        <span className="item-text">{item.name}</span>
                        
                        {/* 뱃지 & 태그 (flex로 높이 맞춤) */}
                        <div className="badge-container">
                          {item.badge && <span className="small-badge count">{item.badge}</span>}
                          {item.tag && <span className="small-badge tag">{item.tag}</span>}
                        </div>
                        
                        {/* 활성 상태바 */}
                        {active && <div className="active-bar"></div>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        
        {/* 하단 배너 */}
        <div className="sidebar-footer">
          <div className="simple-banner">
             <strong>Pro 업그레이드</strong>
             <p>무제한 기능을 사용해보세요.</p>
          </div>
        </div>
      </aside>

      <style jsx>{`
        a { text-decoration: none !important; }

        .right-sidebar {
          position: fixed;
          top: 70px;
          right: 0;
          width: 260px;
          height: calc(100vh - 70px);
          background: #ffffff;
          border-left: 1px solid var(--line);
          z-index: 40;
          display: flex;
          flex-direction: column;
          background-color: #fdfdfd;
        }

        .sidebar-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: transparent; }

        .group-header {
          font-size: 13px; 
          font-weight: 800;
          color: #111;
          margin-bottom: 12px;
          padding-left: 16px; /* 왼쪽 정렬 보정 */
          letter-spacing: -0.3px;
        }

        .menu-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }

        /* ★ 메뉴 아이템 (완벽한 수직 중앙 정렬) */
        .menu-text-link {
          display: flex;
          align-items: center; /* 수직 중앙 */
          justify-content: space-between; /* 양끝 정렬 */
          height: 48px; /* 높이 고정 */
          padding: 0 16px; /* 좌우 패딩 */
          border-radius: 10px;
          color: #444;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
          letter-spacing: -0.3px;
        }

        .menu-text-link:hover {
          background: #f3f4f6;
          color: #000;
        }

        .menu-text-link.active {
          background: #eff6ff;
          color: var(--primary);
          font-weight: 700;
        }

        /* 텍스트 */
        .item-text {
          line-height: 1; /* 줄높이 초기화 (중요) */
          padding-top: 2px; /* 폰트 특성상 시각적 중앙 보정 */
        }

        /* 뱃지 컨테이너 */
        .badge-container {
          display: flex;
          align-items: center;
          height: 100%;
        }

        /* 뱃지 & 태그 스타일 */
        .small-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 0 8px;
          height: 22px; /* 높이 고정 */
          border-radius: 12px;
          display: flex;
          align-items: center; /* 뱃지 내부 텍스트 수직 중앙 */
          justify-content: center;
          line-height: 1;
        }

        /* 숫자 (빨강) */
        .small-badge.count {
          background: #ff4d4f;
          color: white;
          min-width: 22px;
        }

        /* 태그 (파랑) */
        .small-badge.tag {
          background: #e0f2fe;
          color: var(--primary);
        }

        .active-bar {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 20px;
          background: var(--primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid var(--line);
          background: #fff;
        }

        .simple-banner {
          background: #111;
          color: white;
          padding: 20px;
          border-radius: 16px;
          text-align: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .simple-banner:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        .simple-banner strong { display: block; font-size: 14px; margin-bottom: 4px; }
        .simple-banner p { font-size: 12px; color: #aaa; margin: 0; }

        @media (max-width: 1024px) { .right-sidebar { display: none; } }
      `}</style>
    </>
  );
}