"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function TermsClient() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  const sections = [
    {
      q: "제1조 (목적)",
      a: "본 약관은 DORI-AI(이하 \"회사\")가 운영하는 웹사이트(이하 \"사이트\")에서 제공하는 인터넷 관련 서비스(이하 \"서비스\")를 이용함에 있어 사이트와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다."
    },
    {
      q: "제2조 (정의)",
      a: "본 약관에서 사용하는 용어의 정의는 다음과 같습니다.\n\n① \"사이트\"란 회사가 서비스를 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 설정한 가상의 영업장을 말하며, 현재 dori-ai.pages.dev를 통해 운영됩니다.\n\n② \"이용자\"란 사이트에 접속하여 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.\n\n③ \"회원\"이란 사이트에 개인정보를 제공하여 회원등록을 한 자로서, 사이트의 정보를 지속적으로 제공받으며 사이트가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.\n\n④ \"비회원\"이란 회원으로 가입하지 않고 사이트가 제공하는 서비스를 이용하는 자를 말합니다.\n\n⑤ \"게시물\"이란 회원이 서비스를 이용함에 있어 사이트에 게시한 글, 사진, 동영상, 각종 파일과 링크, 댓글 등을 의미합니다.\n\n⑥ \"콘텐츠\"란 회사가 사이트를 통해 제공하는 AI 도구 정보, 인사이트 기사, 가이드, 교육 자료 등 일체의 정보를 의미합니다."
    },
    {
      q: "제3조 (약관의 효력 및 변경)",
      a: "① 본 약관은 사이트 초기 화면에 게시하거나 기타의 방법으로 이용자에게 공지하고, 이에 동의한 이용자가 서비스에 가입함으로써 효력이 발생합니다.\n\n② 회사는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.\n\n③ 회사가 약관을 개정할 경우에는 적용일자 및 개정 사유를 명시하여 현행 약관과 함께 사이트의 초기 화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다. 다만, 이용자에게 불리하게 약관 내용을 변경하는 경우에는 최소한 30일 이상의 사전 유예 기간을 두고 공지합니다.\n\n④ 이용자가 개정된 약관에 동의하지 않는 경우 이용자는 이용계약을 해지(탈퇴)할 수 있으며, 개정된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 약관의 변경 사항에 동의한 것으로 간주됩니다."
    },
    {
      q: "제4조 (서비스의 제공 및 변경)",
      a: "① 회사는 다음과 같은 서비스를 제공합니다.\n\n• AI 도구(AI Tools) 정보 제공 및 검색·리뷰 서비스\n• 인사이트(Insight) 콘텐츠 제공 서비스\n• 아카데미(Academy) 교육 콘텐츠 제공 서비스\n• 커뮤니티(Community) 게시판 서비스\n• 미니게임 등 부가 서비스\n• 건의사항 접수 및 처리 서비스\n• 마켓(Market) 서비스 (준비 중)\n• 기타 회사가 추가 개발하거나 제휴계약 등을 통해 제공하는 일체의 서비스\n\n② 회사는 서비스의 내용을 기술적 사양의 변경 등의 이유로 변경할 수 있습니다. 이 경우 변경된 서비스의 내용 및 제공일자를 명시하여 사전에 공지합니다."
    },
    {
      q: "제5조 (서비스의 중단)",
      a: "① 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체, 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.\n\n② 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 증명한 경우에는 그러하지 아니합니다.\n\n③ 사업종목의 전환, 사업의 포기, 업체 간의 통합 등의 이유로 서비스를 제공할 수 없게 되는 경우에는 회사는 서비스를 이용하는 이용자에게 사전에 통지합니다."
    },
    {
      q: "제6조 (회원가입)",
      a: "① 이용자는 사이트가 정한 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.\n\n② 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.\n\n• 가입 신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우\n• 등록 내용에 허위, 기재 누락, 오기가 있는 경우\n• 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우\n\n③ 회원은 가입 시 등록한 사항에 변경이 있는 경우 상당한 기간 이내에 회원정보 수정 등의 방법으로 변경사항을 알려야 합니다."
    },
    {
      q: "제7조 (회원 탈퇴 및 자격 상실)",
      a: "① 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.\n\n② 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.\n\n• 가입 신청 시에 허위 내용을 등록한 경우\n• 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 경우\n• 서비스를 이용하여 법령 또는 본 약관이 금지하는 행위를 하는 경우\n• 서비스의 안정적 운영을 방해하는 경우\n\n③ 회사가 회원자격을 상실시키는 경우에는 회원에게 이를 통지하고, 회원등록 말소 전에 최소한 30일 이상의 기간을 정하여 소명할 기회를 부여합니다."
    },
    {
      q: "제8조 (이용자의 의무)",
      a: "이용자는 다음 행위를 하여서는 안 됩니다.\n\n① 신청 또는 변경 시 허위 내용의 등록\n② 타인의 정보 도용\n③ 사이트에 게시된 정보의 변경\n④ 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해\n⑤ 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위\n⑥ 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 사이트에 공개 또는 게시하는 행위\n⑦ 서비스를 통해 얻은 정보를 사전 승낙 없이 복제, 유통, 상업적으로 이용하는 행위\n⑧ 자동화된 수단(크롤링, 스크래핑 등)을 이용하여 서비스에 접근하거나 정보를 수집하는 행위\n⑨ 기타 불법적이거나 부당한 행위"
    },
    {
      q: "제9조 (회사의 의무)",
      a: "① 회사는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 지속적이고, 안정적으로 서비스를 제공하기 위해 최선을 다하여 노력합니다.\n\n② 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보 보호를 위한 보안 시스템을 갖추어야 합니다.\n\n③ 회사는 이용자가 원하지 않는 영리 목적의 광고성 전자우편을 발송하지 않습니다.\n\n④ 회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 인정할 경우에는 이를 처리하여야 합니다."
    },
    {
      q: "제10조 (게시물의 관리)",
      a: "① 이용자의 게시물이 관계 법령에 위반되는 내용을 포함하는 경우, 권리자는 관계 법령이 정한 절차에 따라 해당 게시물의 게시 중단 및 삭제 등을 요청할 수 있으며, 회사는 관계 법령에 따라 조치를 취합니다.\n\n② 이용자가 작성한 게시물에 대한 모든 권리와 책임은 이를 게시한 이용자에게 있습니다.\n\n③ 회사는 다음에 해당하는 게시물을 사전 통지 없이 삭제할 수 있습니다.\n\n• 다른 이용자 또는 제3자를 비방하거나 명예를 훼손하는 내용\n• 공공질서 및 미풍양속에 위반되는 내용\n• 범죄적 행위에 결부된다고 인정되는 내용\n• 저작권 등 타인의 권리를 침해하는 내용\n• 음란물 또는 청소년에게 유해한 내용\n• 상업적 광고 또는 스팸성 게시물"
    },
    {
      q: "제11조 (저작권의 귀속 및 이용 제한)",
      a: "① 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.\n\n② 이용자는 사이트를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.\n\n③ 이용자가 게시한 게시물의 저작권은 해당 이용자에게 귀속됩니다. 다만, 게시물이 타인의 저작권을 침해하는 경우 그에 대한 책임은 이용자 본인이 부담합니다.\n\n④ 회사는 서비스의 운영, 홍보 등의 목적으로 이용자의 게시물을 사이트 내에서 사용할 수 있습니다.\n\n⑤ 본 사이트의 일부 콘텐츠는 AI(인공지능)를 활용하여 제작되었습니다. 회사는 이 사실을 투명하게 공개합니다."
    },
    {
      q: "제12조 (광고 게재)",
      a: "① 회사는 서비스 운영과 관련하여 서비스 화면에 광고를 게재할 수 있습니다.\n\n② 회사는 Google AdSense를 포함한 제3자 광고 서비스를 사용할 수 있으며, 이러한 광고는 이용자의 관심사에 기반하여 표시될 수 있습니다.\n\n③ 광고에 관한 안내 사항\n• 광고 내용에 대한 책임은 해당 광고주에게 있습니다.\n• 이용자가 광고주와 교신 또는 거래를 하는 것은 전적으로 이용자와 광고주 간의 문제이며, 회사는 이에 대한 책임을 지지 않습니다."
    },
    {
      q: "제13조 (면책 조항)",
      a: "① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.\n\n② 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.\n\n③ 회사는 이용자가 게재한 정보, 자료, 사실의 신뢰도, 정확성 등에 관하여는 책임을 지지 않습니다.\n\n④ 회사는 무료로 제공되는 서비스 이용과 관련하여 관련법에 특별한 규정이 없는 한 책임을 지지 않습니다.\n\n⑤ 회사가 제공하는 AI 관련 정보 및 콘텐츠는 참고용이며, 이를 기반으로 한 의사결정에 대한 책임은 이용자에게 있습니다."
    },
    {
      q: "제14조 (손해배상)",
      a: "① 회사가 이용자에게 손해를 끼친 경우, 회사는 이용자에게 실제 발생한 손해를 배상합니다. 다만, 회사의 고의 또는 중과실이 없는 경우에는 그러하지 아니합니다.\n\n② 이용자가 본 약관의 규정을 위반하여 회사에게 손해를 끼친 경우, 이용자는 회사에 발생한 손해를 배상하여야 합니다."
    },
    {
      q: "제15조 (분쟁해결)",
      a: "① 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 노력합니다.\n\n② 회사와 이용자 간에 발생한 분쟁과 관련하여 이용자의 피해구제 신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다."
    },
    {
      q: "제16조 (재판권 및 준거법)",
      a: "① 회사와 이용자 간에 발생한 서비스 이용에 관한 분쟁에 대하여는 대한민국 법을 준거법으로 합니다.\n\n② 회사와 이용자 간에 발생한 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속 관할로 합니다."
    },
    {
      q: "제17조 (기타)",
      a: "① 본 약관에 명시되지 않은 사항은 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관계법령과 상관례에 따릅니다.\n\n② 본 약관은 2026년 2월 16일부터 적용됩니다.\n\n③ 본 약관에 대한 문의사항이 있으시면 아래로 연락해 주시기 바랍니다.\n\n▶ 이메일: lhaa0130@gmail.com\n▶ 웹사이트: dori-ai.pages.dev"
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
            <FileText className="w-3 h-3" />
            <span>Terms of Service</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              이용약관
            </span>
          </h1>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
            서비스 이용과 관련한 권리와 의무를 안내합니다.
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">
            최종 수정일: 2026년 2월 16일 · 시행일: 2026년 2월 16일
          </p>
        </div>
      </section>

      {/* 안내 배너 */}
      <section className="container max-w-3xl mx-auto px-6 mb-8 relative z-10">
        <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-800/30 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          본 약관은 DORI-AI(이하 &quot;회사&quot;)가 운영하는 웹사이트(dori-ai.pages.dev)에서 제공하는 서비스의 이용과 관련하여, 회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정합니다. 서비스를 이용하시기 전에 본 약관을 주의 깊게 읽어주시기 바랍니다.
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
            href="/legal/privacy"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
          >
            개인정보처리방침 보기 →
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
