"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function PrivacyClient() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  const sections = [
    {
      q: "제1조 (개인정보의 처리 목적)",
      a: "회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.\n\n① 회원 가입 및 관리\n• 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증\n• 회원자격 유지·관리, 서비스 부정이용 방지\n• 각종 고지·통지, 고충처리\n\n② 서비스 제공\n• AI 도구 정보 제공, 인사이트·가이드 콘텐츠 제공\n• 커뮤니티 게시판 서비스, 건의사항 접수 처리\n• 맞춤형 서비스 제공, 본인인증\n\n③ 서비스 개선 및 통계 분석\n• 서비스 이용 현황 파악 및 통계 분석\n• 신규 서비스 개발 및 기존 서비스 개선\n• 접속 빈도 분석, 이용자의 서비스 이용에 대한 통계"
    },
    {
      q: "제2조 (수집하는 개인정보의 항목 및 수집 방법)",
      a: "① 필수 수집 항목\n\n[회원가입 시]\n• 이메일 주소, 비밀번호, 닉네임(이름)\n\n[서비스 이용 시 자동 수집]\n• 서비스 이용기록, 접속 로그, 접속 IP 주소\n• 브라우저 종류, 운영체제, 기기 정보\n• 쿠키(Cookie)\n\n② 선택 수집 항목\n• 프로필 이미지, 성별, 연령대\n• 건의사항 작성 시: 이름, 이메일\n\n③ 수집 방법\n• 웹사이트를 통한 회원가입 시 직접 입력\n• 서비스 이용 과정에서 자동으로 생성·수집\n• localStorage를 통한 클라이언트 측 데이터 저장\n\n※ 회사는 이용자의 사전 동의 없이 민감정보(사상·신념, 건강 정보 등) 및 고유식별정보(주민등록번호 등)를 수집하지 않습니다."
    },
    {
      q: "제3조 (개인정보의 처리 및 보유 기간)",
      a: "① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.\n\n② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.\n\n• 회원 정보: 회원 탈퇴 시까지\n  (단, 관계법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지)\n\n③ 관계법령에 따른 보유 기간\n\n• 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)\n• 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)\n• 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)\n• 표시·광고에 관한 기록: 6개월 (전자상거래 등에서의 소비자보호에 관한 법률)\n• 웹사이트 방문기록: 3개월 (통신비밀보호법)"
    },
    {
      q: "제4조 (개인정보의 제3자 제공)",
      a: "① 회사는 원칙적으로 이용자의 개인정보를 제1조에서 명시한 목적 범위 내에서 처리하며, 이용자의 사전 동의 없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.\n\n② 다만, 다음의 경우에는 예외로 합니다.\n\n• 이용자가 사전에 제3자 제공에 동의한 경우\n• 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우\n• 정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우\n• 통계작성 및 학술연구 등의 목적을 위하여 필요한 경우로서 특정 개인을 알아볼 수 없는 형태로 개인정보를 제공하는 경우"
    },
    {
      q: "제5조 (개인정보 처리의 위탁)",
      a: "① 회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.\n\n• 위탁받는 자 (수탁자): Cloudflare, Inc.\n• 위탁하는 업무의 내용: 웹사이트 호스팅 및 콘텐츠 전송(CDN)\n\n② 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.\n\n③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통해 공개하겠습니다."
    },
    {
      q: "제6조 (개인정보의 파기 절차 및 방법)",
      a: "① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.\n\n② 이용자로부터 동의 받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.\n\n③ 개인정보 파기의 절차 및 방법\n\n• 파기 절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 파기합니다.\n• 파기 방법\n  - 전자적 파일 형태: 기록을 재생할 수 없는 기술적 방법을 사용합니다.\n  - 종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각합니다.\n  - localStorage에 저장된 데이터: 계정 삭제 시 클라이언트 측 저장 데이터가 함께 삭제됩니다."
    },
    {
      q: "제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법)",
      a: "① 이용자(정보주체)는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.\n\n• 개인정보 열람 요구\n• 오류 등이 있을 경우 정정 요구\n• 삭제 요구\n• 처리정지 요구\n\n② 권리 행사는 서면, 전자우편 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.\n\n③ 권리 행사는 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수도 있습니다.\n\n④ 만 14세 미만 아동의 경우 법정대리인이 아동의 개인정보에 대한 열람, 정정·삭제, 처리정지를 요구할 수 있습니다."
    },
    {
      q: "제8조 (개인정보의 안전성 확보 조치)",
      a: "회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.\n\n① 관리적 조치\n• 내부 관리계획 수립·시행\n• 개인정보 취급 담당자 최소화 및 교육\n\n② 기술적 조치\n• 개인정보 암호화: 이용자의 비밀번호는 암호화되어 저장 및 관리됩니다.\n• 해킹 등에 대비한 기술적 대책: 보안 프로그램 설치 및 주기적인 갱신·점검\n• 접근 통제: 개인정보에 대한 접근 권한을 제한하고, 이를 관리하기 위한 필요한 조치\n• HTTPS(SSL/TLS) 암호화 통신을 사용하여 데이터 전송 시 보안 유지\n\n③ 물리적 조치\n• Cloudflare의 글로벌 보안 인프라를 활용한 물리적 접근 통제"
    },
    {
      q: "제9조 (쿠키 및 자동 수집 장치)",
      a: "① 회사는 이용자의 서비스 이용 편의를 위해 '쿠키(Cookie)'를 사용합니다.\n\n② 쿠키의 사용 목적\n• 이용자의 접속 빈도나 방문 시간 등을 분석하여 서비스 개선에 활용\n• 이용자의 관심 분야를 파악하여 맞춤형 서비스 제공\n• 로그인 상태 유지 (localStorage 활용)\n\n③ 쿠키의 종류\n• 필수 쿠키: 서비스 제공에 필수적인 쿠키\n• 분석 쿠키: 서비스 이용 통계 분석을 위한 쿠키\n• 광고 쿠키: 맞춤형 광고 제공을 위한 쿠키\n\n④ 광고 서비스\n회사는 Google AdSense를 포함한 제3자 광고 서비스를 사용할 수 있습니다. Google의 광고 개인정보 처리에 대한 자세한 내용은 Google 개인정보처리방침(policies.google.com/privacy)을 참고하시기 바랍니다.\n\n⑤ 쿠키 설정 거부 방법\n이용자는 웹 브라우저의 설정을 통해 쿠키 저장을 거부할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 발생할 수 있습니다."
    },
    {
      q: "제10조 (개인정보 보호책임자)",
      a: "회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.\n\n▶ 개인정보 보호책임자\n• 이메일: lhaa0130@gmail.com\n• 웹사이트: dori-ai.pages.dev"
    },
    {
      q: "제11조 (개인정보 침해 관련 구제 방법)",
      a: "이용자가 개인정보 침해에 대한 피해구제, 상담 등이 필요한 경우에는 아래의 기관에 문의하시기 바랍니다.\n\n▶ 개인정보 침해신고센터 (한국인터넷진흥원 운영)\n• 홈페이지: privacy.kisa.or.kr\n• 전화: (국번없이) 118\n\n▶ 개인정보 분쟁조정위원회\n• 홈페이지: www.kopico.go.kr\n• 전화: (국번없이) 1833-6972\n\n▶ 대검찰청 사이버수사과\n• 홈페이지: www.spo.go.kr\n• 전화: (국번없이) 1301\n\n▶ 경찰청 사이버수사국\n• 홈페이지: ecrm.cyber.go.kr\n• 전화: (국번없이) 182"
    },
    {
      q: "제12조 (개인정보 처리방침의 변경)",
      a: "① 이 개인정보 처리방침은 2026년 2월 16일부터 적용됩니다.\n\n② 회사는 개인정보 처리방침을 변경하는 경우에는 변경 및 시행의 시기, 변경된 내용을 지속적으로 공개하며, 변경 내용이 이용자에게 불리하게 변경되는 경우에는 변경사항의 시행일 최소 7일 전부터 웹사이트 공지사항을 통하여 고지합니다."
    },
  ];

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">

      {/* 배경 그라데이션 */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:from-orange-900/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      {/* 히어로 섹션 */}
      <section className="relative pt-32 pb-16 px-6 text-center z-10">
        <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
            <Shield className="w-3 h-3" />
            <span>Privacy Policy</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              개인정보처리방침
            </span>
          </h1>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
            DORI-AI는 이용자의 개인정보를 소중히 보호합니다.
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">
            최종 수정일: 2026년 2월 16일 · 시행일: 2026년 2월 16일
          </p>
        </div>
      </section>

      {/* 안내 배너 */}
      <section className="container max-w-3xl mx-auto px-6 mb-8 relative z-10">
        <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-800/30 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          DORI-AI(이하 &quot;회사&quot;)는 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <section className="container max-w-3xl mx-auto px-6 pb-20 relative z-10">
        <div className="space-y-4">
          {sections.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-[1.5rem] border border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-orange-500/5"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 p-6">
                <span className="font-bold text-[15px] text-neutral-900 dark:text-white group-hover:text-orange-500 transition-colors duration-200">
                  {item.q}
                </span>
                <span className="text-lg transition-all duration-300 group-open:rotate-45 flex-shrink-0 w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 text-sm font-light">
                  +
                </span>
              </summary>
              <div
                className="px-6 pb-6 text-sm text-neutral-600 dark:text-neutral-400 leading-[1.85]"
                style={{ whiteSpace: 'pre-line' }}
              >
                {item.a}
              </div>
            </details>
          ))}
        </div>

        {/* 하단 링크 */}
        <div className="mt-12 text-center">
          <Link
            href="/legal/terms"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
          >
            이용약관 보기 →
          </Link>
        </div>
      </section>

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        details summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </main>
  );
}
