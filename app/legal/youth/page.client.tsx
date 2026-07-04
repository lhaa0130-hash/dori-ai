"use client";

import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function YouthClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const sections = [
    {
      q: "제1조 (목적)",
      a: "illo(이하 \"회사\")는 「청소년 보호법」 등 관계법령에 따라 청소년이 유해한 정보 환경으로부터 보호받고 건전한 인격체로 성장할 수 있도록 청소년보호정책을 수립·시행합니다. 본 정책은 회사가 운영하는 웹사이트(illo.im)의 커뮤니티, 미니게임, 콘텐츠 등 모든 서비스에 적용됩니다."
    },
    {
      q: "제2조 (청소년유해정보에 대한 접근제한 및 관리조치)",
      a: "① 회사는 청소년이 아무런 제한장치 없이 유해정보에 노출되지 않도록 다음과 같은 조치를 취합니다.\n\n• 청소년유해매체물에 대한 별도의 인증 장치 마련(해당 콘텐츠 운영 시)\n• 커뮤니티 게시판 및 이용자 게시물에 대한 상시 모니터링\n• 자동 검수 시스템을 통한 부적절·유해 게시물의 탐지 및 차단\n\n② 회사는 이용약관 및 관련 정책에 따라 음란·폭력·사행성 등 청소년에게 유해한 정보를 게시하는 행위를 금지하며, 위반 게시물은 사전 통지 없이 삭제·차단할 수 있습니다."
    },
    {
      q: "제3조 (청소년보호를 위한 교육 및 점검)",
      a: "① 회사는 서비스 운영 담당자를 대상으로 청소년 보호 관련 정책 및 법령에 대한 인식을 지속적으로 유지합니다.\n\n② 회사는 청소년유해정보로부터 청소년을 보호하기 위한 시스템(자동 검수봇 등)을 주기적으로 점검하고 개선합니다.\n\n③ 회사는 AI를 활용해 생성되는 콘텐츠가 청소년에게 유해하지 않도록 검수 절차를 운영합니다."
    },
    {
      q: "제4조 (청소년유해정보의 신고 및 처리)",
      a: "① 이용자는 서비스 내에서 청소년에게 유해하다고 판단되는 정보를 발견한 경우 아래 연락처로 신고할 수 있습니다.\n\n• 신고 이메일: illo@illo.im\n• 사이트 내 '건의사항' 또는 게시물 신고 기능\n\n② 회사는 신고를 접수한 경우 지체 없이 해당 정보를 검토하고, 유해성이 확인되면 삭제·차단 등 필요한 조치를 취한 후 처리 결과를 신고자에게 안내합니다."
    },
    {
      q: "제5조 (청소년보호책임자의 지정)",
      a: "회사는 청소년 보호 업무를 총괄하고 청소년유해정보로부터 청소년을 보호하기 위하여 아래와 같이 청소년보호책임자를 지정하고 있습니다.\n\n▶ 청소년보호책임자\n• 직책: illo 운영책임자\n• 이메일: illo@illo.im\n\n※ 책임자의 성명은 개인정보 보호를 위하여 비공개하며, 직책 및 대표 연락처(이메일)를 통하여 청소년 보호 관련 문의·신고를 처리합니다."
    },
    {
      q: "제6조 (정책의 개정)",
      a: "본 청소년보호정책은 관계법령 및 회사 정책의 변경에 따라 개정될 수 있으며, 개정 시 변경 내용을 사이트를 통하여 공지합니다. 본 정책은 2026년 7월 4일부터 시행합니다."
    },
  ];

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <section className="relative pt-4 sm:pt-16 pb-8 sm:pb-16 px-4 sm:px-6 text-center z-10">
        <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
            <ShieldCheck className="w-3 h-3" />
            <span>Youth Protection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              청소년보호정책
            </span>
          </h1>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
            illo는 청소년이 유해정보로부터 보호받을 수 있도록 노력합니다.
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">시행일: 2026년 7월 4일</p>
        </div>
      </section>

      <section className="container max-w-3xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8 relative z-10">
        <div className="p-5 rounded-2xl bg-[#FFF5EB]/50 dark:bg-orange-950/10 border border-[#FDD5A5]/50 dark:border-[#B35E15]/30 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          illo는 「청소년 보호법」에 따라 청소년유해정보로부터 청소년을 보호하고 건전한 인터넷 이용 환경을 조성하기 위하여 다음과 같이 청소년보호정책을 수립·공개합니다.
        </div>
      </section>

      <section className="container max-w-3xl mx-auto px-4 sm:px-6 pb-10 sm:pb-20 relative z-10">
        <div className="space-y-4">
          {sections.map((item, idx) => (
            <details key={idx} className="group rounded-[1.5rem] border border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-[#F9954E]/5">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 p-6">
                <span className="font-bold text-[15px] text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors duration-200">{item.q}</span>
                <span className="text-lg transition-all duration-300 group-open:rotate-45 flex-shrink-0 w-6 h-6 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-[#F9954E] text-sm font-light">+</span>
              </summary>
              <div className="px-6 pb-6 text-sm text-neutral-600 dark:text-neutral-400 leading-[1.85]" style={{ whiteSpace: 'pre-line' }}>{item.a}</div>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/legal/terms" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 text-sm font-medium hover:bg-[#FFF5EB] dark:hover:bg-orange-950/20 hover:text-[#E8832E] dark:hover:text-[#FBAA60] transition-all duration-200">이용약관 보기 →</Link>
        </div>
      </section>

      <style jsx global>{`
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient { animation: gradient 3s ease infinite; }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </main>
  );
}
