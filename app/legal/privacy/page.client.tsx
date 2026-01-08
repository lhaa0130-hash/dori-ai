"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PrivacyClient() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener("mousemove", handleMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [mounted]);

  const isDark = mounted && theme === 'dark';

  return (
    <div className="relative min-h-screen" style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
    }}>
      {/* 배경 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at top, rgba(30, 58, 138, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(88, 28, 135, 0.05) 0%, transparent 50%), #000000'
              : 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.03) 0%, transparent 50%), #ffffff',
          }}
        />
        
        {/* 마우스 추적 그라데이션 */}
        {mounted && (
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-all duration-1000 ease-out opacity-20"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              left: `${mousePosition.x - 250}px`,
              top: `${mousePosition.y - 250}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>

      {/* 히어로 섹션 */}
      <section 
        className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-32"
      >
        <div className="max-w-4xl mx-auto w-full">
          {/* 홈으로 돌아가기 링크 */}
          <div className="mb-16">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:opacity-70"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                textDecoration: 'none',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 400,
              }}
            >
              ← 홈으로 돌아가기
            </Link>
          </div>

          <div className="text-center mb-20">
            {/* 메인 타이틀 */}
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl mb-3 leading-[1.1] tracking-[-0.04em]"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.04em',
              }}
            >
              개인정보처리방침
            </h1>
            
            {/* 그라데이션 바 */}
            <div 
              className="w-full max-w-2xl mx-auto h-1 md:h-1.5 mb-6 rounded-full overflow-hidden"
              style={{
                boxShadow: isDark 
                  ? '0 0 30px rgba(96, 165, 250, 0.4), 0 4px 20px rgba(96, 165, 250, 0.2)'
                  : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 15px rgba(37, 99, 235, 0.2)',
              }}
            >
              <div 
                className="gradient-flow h-full rounded-full"
                style={{
                  backgroundImage: isDark
                    ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%, #60a5fa 100%)'
                    : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%, #2563eb 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'gradientFlow 4s linear infinite',
                }}
              />
            </div>
            
            {/* 서브타이틀 */}
            <p 
              className="text-sm md:text-base"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              최종 수정일: 2025년 1월 15일
            </p>
          </div>

          {/* FAQ 스타일 아코디언 */}
          <div className="space-y-0">
            {[
              {
                q: "1. 수집하는 개인정보 항목",
                a: "DORI-AI(이하 \"회사\")는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.\n\n수집항목: 이름, 로그인ID, 비밀번호, 이메일, 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보\n수집방법: 홈페이지(회원가입, 로그인), 서비스 이용 과정에서 자동 수집"
              },
              {
                q: "2. 개인정보의 수집 및 이용목적",
                a: "회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.\n\n• 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산\n• 회원 관리 (가입 의사 확인, 연령 확인, 본인확인, 불만처리 등)\n• 서비스 개선 및 신규 서비스 개발을 위한 통계 분석\n• 마케팅 및 광고에 활용 (단, 별도 동의를 받은 경우에 한함)"
              },
              {
                q: "3. 개인정보의 보유 및 이용기간",
                a: "원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.\n\n• 회원 정보: 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)\n• 서비스 이용기록: 3년 (통신비밀보호법)\n• 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)"
              },
              {
                q: "4. 개인정보의 제3자 제공",
                a: "회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.\n\n• 이용자가 사전에 동의한 경우\n• 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우"
              },
              {
                q: "5. 개인정보의 파기",
                a: "회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다."
              },
              {
                q: "6. 이용자 및 법정대리인의 권리와 그 행사방법",
                a: "이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 요청할 수도 있습니다. 개인정보 열람, 정정·삭제, 처리정지 요구는 개인정보보호법 시행령 제41조 제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다."
              },
              {
                q: "7. 개인정보 보호책임자",
                a: "회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.\n\n이메일: lhaa0130@gmail.com"
              },
              {
                q: "8. 쿠키 및 광고 관련 개인정보 처리",
                a: "회사는 서비스 제공을 위해 다음과 같은 쿠키를 사용합니다.\n\n• 필수 쿠키: 서비스 제공에 필수적인 쿠키로, 거부 시 서비스 이용이 제한될 수 있습니다.\n• 분석 쿠키: 서비스 이용 통계 분석을 위한 쿠키입니다.\n• 광고 쿠키: 맞춤형 광고 제공을 위한 쿠키입니다.\n\n회사는 Google AdSense를 포함한 제3자 광고 서비스를 사용할 수 있으며, 이러한 서비스 제공자들은 본인의 쿠키 및 기타 추적 기술을 사용하여 본인에 대한 정보를 수집할 수 있습니다. Google AdSense의 개인정보 처리에 대한 자세한 내용은 Google의 개인정보처리방침(https://policies.google.com/privacy)을 참고하시기 바랍니다.\n\n쿠키 설정은 브라우저 옵션을 통해 거부할 수 있으나, 일부 서비스 이용에 제한이 있을 수 있습니다."
              },
              {
                q: "9. 개인정보 처리방침 변경",
                a: "이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다."
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="group"
                style={{
                  backgroundColor: 'transparent',
                  borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                  padding: '20px 0',
                  marginBottom: '0',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderBottomColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderBottomColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
                }}
              >
                <summary 
                  className="cursor-pointer list-none flex items-center justify-between gap-6 py-0"
                  style={{
                    color: isDark ? '#ffffff' : '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 500,
                    fontSize: '16px',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.5',
                    transition: 'color 0.2s ease',
                  }}
                >
                  <span className="group-hover:opacity-70 transition-opacity duration-200">{item.q}</span>
                  <span 
                    className="text-lg transition-all duration-300 group-open:rotate-45 flex-shrink-0 flex items-center justify-center w-4 h-4"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                      fontSize: '16px',
                      fontWeight: 300,
                    }}
                  >
                    +
                  </span>
                </summary>
                <div 
                  className="pt-5 pb-1 leading-relaxed"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.6)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: '-0.01em',
                    lineHeight: '1.75',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        details summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </div>
  );
}

