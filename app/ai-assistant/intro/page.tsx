import { createMetadata } from "@/lib/seo";
import Link from "next/link";
import { SHOW_PROJECTS } from "@/lib/publicFlags";

// 공개 소개 페이지 — /ai-assistant 본체는 로그인·관리자 게이트라 noindex다.
// 크롤러가 볼 수 있는 제품 설명은 이 페이지 하나뿐이므로 전부 서버 렌더(정적 HTML)로 둔다.
// ⚠️ 클라이언트 컴포넌트로 바꾸지 말 것 — 색인 대상 본문이 사라진다.
// 레이아웃: components/LayoutClient.tsx 에서 이 경로만 앱 셸 분기에서 제외해 헤더·푸터를 붙인다.

const SITE_URL = "https://illo.im";

export const metadata = createMetadata({
  title: "AI 직원 관제탑 — 부서·팀·직원으로 굴리는 AI 비서",
  description:
    "AI를 채팅창 하나로 쓰지 않고 부서·팀·직원 조직도로 만들어 굴립니다. 직원마다 다른 AI 모델을 붙이고, 결과는 팀장·부서장·마스터가 역순으로 검토합니다. illo의 AI 비서 '대리인' 소개.",
  path: "/ai-assistant/intro",
  keywords: [
    "AI 직원",
    "AI 비서",
    "AI 조직도",
    "AI 자동화",
    "AI 에이전트",
    "멀티 에이전트",
    "업무 자동화",
    "1인 사업 AI",
    "AI 사무실",
    "대리인",
    "AI 직원 관제탑",
  ],
});

const PRESETS = [
  {
    emoji: "✍️",
    name: "블로그 글 생성",
    dept: "블로그 생성부 · 콘텐츠팀",
    count: "직원 10명",
    members: [
      ["기획자", "독자·목차·제목 후보·검색 키워드를 잡아 기획안 작성"],
      ["조사원", "글에 들어갈 사실·수치·사례를 정리(확인 필요한 건 표시)"],
      ["검색원", "확인 필요 항목을 실제 웹에서 검색해 출처와 함께 보강"],
      ["작가", "기획안 목차대로 조사 자료를 녹여 본문 작성"],
      ["팩트체커", "사실 오류·근거 없는 단정만 골라 '문장→문제→수정안'으로 지적"],
      ["SEO담당", "제목·소제목 키워드, 메타 설명문 등 검색 최적화 지적"],
      ["교정자", "지적을 반영하고 AI 티 나는 표현을 걷어내 최종 원고 완성"],
      ["편집장", "100점 만점 심사. 80점 미만이면 작가에게 되돌려 다시 쓰게 함"],
      ["발행담당", "제목·메타·본문 형식으로 발행 가능한 형태로 정리"],
      ["전송담당", "완성본을 이메일·깃허브 등 채널로 내보내기"],
    ],
  },
  {
    emoji: "📣",
    name: "SNS 게시물",
    dept: "SNS 홍보부 · SNS팀",
    count: "직원 2명",
    members: [
      ["기획자", "타깃과 후킹 포인트를 잡고 게시물 컨셉 정하기"],
      ["카피라이터", "인스타·페북용 짧고 임팩트 있는 카피 작성(해시태그 포함)"],
    ],
  },
  {
    emoji: "📦",
    name: "상품 상세페이지",
    dept: "상품 기획부 · 상품팀",
    count: "직원 3명",
    members: [
      ["분석가", "상품의 강점·경쟁 상품과의 차별점 정리"],
      ["작가", "구매 욕구를 자극하는 상세페이지 문구 작성"],
      ["검수자", "과장·허위 표현을 걸러내고 표현 다듬기"],
    ],
  },
  {
    emoji: "🤝",
    name: "고객 응대",
    dept: "고객 응대부 · CS팀",
    count: "직원 2명",
    members: [
      ["분석가", "문의·후기의 의도와 감정을 파악해 요점 정리"],
      ["상담원", "정중하고 신뢰가 가는 답변 작성"],
    ],
  },
];

const KINDS = [
  ["🧠", "글·판단", "기획·작성·검토처럼 언어로 하는 일"],
  ["🔍", "자료조사", "웹에서 근거와 출처를 찾아오는 일"],
  ["🎨", "이미지", "썸네일·삽화 등 그림을 만드는 일"],
  ["🎬", "영상", "영상 클립을 만드는 일"],
  ["🎧", "음성·음악", "내레이션·배경음을 만드는 일"],
  ["📤", "자료전송", "완성물을 이메일·깃허브 등으로 내보내는 일"],
  ["⏱️", "타이머", "정해진 시각에 흐름을 자동으로 시작하는 일"],
];

const FAQ = [
  {
    q: "일반 AI 채팅과 뭐가 다른가요?",
    a: "채팅은 한 명에게 전부 시키는 방식입니다. 여기서는 기획·조사·작성·검토를 각각 다른 직원이 맡고, 결과가 팀장과 부서장을 거쳐 올라옵니다. 한 사람이 한 번에 쓴 글과 열 명이 나눠 만들고 세 번 검토한 글은 결과가 다릅니다.",
  },
  {
    q: "직원마다 다른 AI를 쓸 수 있나요?",
    a: "네. 직원 노드마다 모델을 따로 지정합니다. 단순 정리는 저렴한 모델, 최종 판단은 고급 모델처럼 일의 무게에 맞춰 나눠 쓰면 비용이 크게 줄어듭니다.",
  },
  {
    q: "검토는 누가 하나요?",
    a: "일은 역순으로 올라갑니다. 직원이 각자 역할대로 일하면 팀장이 팀원 결과를 검토하고, 부서장이 팀 검토를 검토하고, 마지막에 마스터가 최종 검토합니다. 마스터 검토는 서로 다른 세 개의 AI 모델이 각자 따로 봅니다.",
  },
  {
    q: "지금 쓸 수 있나요?",
    a: "아직 비공개 베타입니다. 현재는 운영자 계정만 접근할 수 있고, 조직도 구성과 실행 흐름을 다듬는 중입니다. 공개되면 공지사항에 올립니다.",
  },
];

export default function AiAssistantIntroPage() {
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "대리인 : AI비서 — AI 직원 관제탑",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "부서·팀·직원 조직도로 AI를 구성하고, 직원마다 다른 AI 모델을 지정해 업무를 실행·검토하는 AI 비서.",
    url: `${SITE_URL}/ai-assistant/intro`,
    author: { "@type": "Organization", name: "illo", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "illo",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "프로젝트", item: `${SITE_URL}/projects` },
      { "@type": "ListItem", position: 3, name: "AI 직원 관제탑", item: `${SITE_URL}/ai-assistant/intro` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <article className="w-full">
        <nav className="text-[12px] text-stone-400 dark:text-zinc-600 mb-5">
          <Link href="/" className="hover:text-[#F9954E] transition-colors">홈</Link>
          {" › "}
          {/* /projects 비공개 기간엔 링크 없이 텍스트로만 둔다 — 이 페이지는 사이트맵에 있어서
              여기서 '운영 중 0개' 페이지로 넘어가는 동선이 심사원에게 열린다 */}
          {SHOW_PROJECTS
            ? <Link href="/projects" className="hover:text-[#F9954E] transition-colors">프로젝트</Link>
            : <span>프로젝트</span>}
          {" › "}
          <span className="text-stone-500 dark:text-zinc-500">AI 직원 관제탑</span>
        </nav>

        {/* ── 히어로 ── */}
        <section className="pb-8 border-b border-stone-100 dark:border-zinc-900">
          <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">대리인 : AI비서</p>
          <h1 className="text-[34px] sm:text-[44px] font-extrabold text-stone-950 dark:text-white leading-[1.12] tracking-tight mb-4 break-keep">
            AI를 한 명이 아니라<br />조직으로 굴립니다
          </h1>
          <p className="text-[15px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mb-5">
            채팅창 하나에 전부 시키는 대신, 부서와 팀과 직원을 만듭니다.<br />
            직원마다 맡은 역할이 다르고, 붙어 있는 AI 모델도 다릅니다.<br />
            결과는 팀장과 부서장을 거쳐 마스터까지 올라온 다음 나옵니다.
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-zinc-800">
            비공개 베타 · 운영자 계정만 접근 가능
          </span>
        </section>

        {/* ── 문제 ── */}
        <section className="py-10 border-b border-stone-100 dark:border-zinc-900">
          <h2 className="text-[22px] font-extrabold text-stone-950 dark:text-white mb-4 break-keep">
            AI에게 한 번에 다 시키면 생기는 일
          </h2>
          <p className="text-[15px] text-stone-600 dark:text-stone-400 leading-[1.85] break-keep mb-4">
            &ldquo;블로그 글 하나 써줘&rdquo;라고 하면 AI는 기획도, 조사도, 팩트체크도, 교정도 한 번에 해치웁니다.
            빠르지만 근거가 얕고, 틀린 숫자가 섞이고, 읽으면 AI가 쓴 티가 납니다.
            사람이 하는 회사에서 한 사람에게 기획부터 최종 승인까지 다 맡기지 않는 데는 이유가 있습니다.
          </p>
          <p className="text-[15px] text-stone-600 dark:text-stone-400 leading-[1.85] break-keep">
            그래서 이 도구는 AI를 쪼갭니다. 일을 나누고, 담당을 정하고, 검토 단계를 세웁니다.
          </p>
        </section>

        {/* ── 구조 ── */}
        <section className="py-10 border-b border-stone-100 dark:border-zinc-900">
          <h2 className="text-[22px] font-extrabold text-stone-950 dark:text-white mb-2 break-keep">
            조직도가 곧 작업 화면
          </h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mb-6">
            부서를 만들고, 그 아래 팀을 만들고, 팀에 직원을 넣습니다. 노드를 클릭해 역할과 모델을 정합니다.
          </p>

          <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 sm:p-6">
            <ol className="space-y-0">
              {[
                ["1", "직원", "각자 맡은 역할대로 일한다"],
                ["2", "팀장", "팀원들이 낸 결과를 검토한다"],
                ["3", "부서장", "팀 검토 결과를 다시 검토한다"],
                ["4", "마스터", "서로 다른 AI 3개가 각자 최종 검토한다"],
              ].map(([n, who, what], i, arr) => (
                <li key={n} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#F9954E]/10 text-[#F9954E] flex items-center justify-center text-[13px] font-extrabold shrink-0">
                      {n}
                    </div>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-stone-200 dark:bg-zinc-800" />}
                  </div>
                  <div className={i < arr.length - 1 ? "pb-6" : ""}>
                    <p className="text-[15px] font-extrabold text-stone-900 dark:text-white leading-tight">{who}</p>
                    <p className="text-[13.5px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mt-1">{what}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mt-5">
            일은 위에서 아래로 지시되지만, 결과는 아래에서 위로 올라옵니다.
            마지막 관문인 마스터 검토는 한 모델의 취향에 휘둘리지 않도록 성격이 다른 세 개의 AI가 각자 따로 봅니다.
          </p>
        </section>

        {/* ── 직원 종류 ── */}
        <section className="py-10 border-b border-stone-100 dark:border-zinc-900">
          <h2 className="text-[22px] font-extrabold text-stone-950 dark:text-white mb-2 break-keep">
            직원은 7가지 종류
          </h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mb-6">
            직원을 만들 때 어떤 일을 하는 사람인지 고릅니다. 종류에 따라 붙일 수 있는 도구와 모델이 달라집니다.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {KINDS.map(([emoji, label, desc]) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3.5"
              >
                <span className="text-[18px] leading-none mt-0.5 shrink-0">{emoji}</span>
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold text-stone-900 dark:text-white leading-tight">{label}</p>
                  <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── 프리셋 ── */}
        <section className="py-10 border-b border-stone-100 dark:border-zinc-900">
          <h2 className="text-[22px] font-extrabold text-stone-950 dark:text-white mb-2 break-keep">
            바로 쓸 수 있는 팀 4개
          </h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mb-6">
            처음부터 조직을 짜지 않아도 됩니다. 자주 쓰는 구성은 인원까지 채워진 채로 준비돼 있습니다.
          </p>

          <div className="space-y-4">
            {PRESETS.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
              >
                <div className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F9954E]/8 dark:bg-[#F9954E]/10 flex items-center justify-center text-[20px] shrink-0">
                      {p.emoji}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[16px] font-extrabold text-stone-950 dark:text-white leading-tight">{p.name}</h3>
                      <span className="text-[11px] text-stone-400 dark:text-zinc-500">{p.dept}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 text-[#F9954E] bg-[#F9954E]/10">
                    {p.count}
                  </span>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {p.members.map(([name, role]) => (
                    <li key={name} className="flex items-start gap-2">
                      <span className="text-[12.5px] font-extrabold text-stone-900 dark:text-white shrink-0 min-w-[62px]">{name}</span>
                      <span className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep">{role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── 모델 배분 ── */}
        <section className="py-10 border-b border-stone-100 dark:border-zinc-900">
          <h2 className="text-[22px] font-extrabold text-stone-950 dark:text-white mb-4 break-keep">
            비싼 AI를 아무 데나 쓰지 않습니다
          </h2>
          <p className="text-[15px] text-stone-600 dark:text-stone-400 leading-[1.85] break-keep">
            직원 노드마다 모델을 따로 지정합니다. 자료를 정리하는 직원에게는 저렴하고 빠른 모델을,
            최종 판단을 내리는 편집장에게는 가장 좋은 모델을 붙이는 식입니다.
            같은 결과물을 만들어도 어디에 무엇을 붙이느냐에 따라 드는 비용이 달라집니다.
          </p>
        </section>

        {/* ── FAQ ── */}
        <section className="py-10 border-b border-stone-100 dark:border-zinc-900">
          <h2 className="text-[22px] font-extrabold text-stone-950 dark:text-white mb-6 break-keep">자주 묻는 질문</h2>
          <div className="space-y-5">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="text-[15px] font-extrabold text-stone-900 dark:text-white mb-1.5 break-keep">{f.q}</h3>
                <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-[1.8] break-keep">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 현재 상태 · 문의 ── */}
        <section className="py-10 border-b border-stone-100 dark:border-zinc-900">
          <div className="rounded-2xl bg-stone-50 dark:bg-zinc-900/60 px-5 py-6 sm:px-6">
            <h2 className="text-[18px] font-extrabold text-stone-950 dark:text-white mb-2 break-keep">
              아직 공개 전입니다
            </h2>
            <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mb-5">
              현재는 운영자 계정만 접근할 수 있습니다. 조직도 구성과 실행 흐름을 다듬고 있고,
              공개 시점은 공지사항에 올립니다. 먼저 써보고 싶거나 우리 회사 업무에 맞게 짜고 싶다면 메일로 알려주세요.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="mailto:illo@illo.im?subject=AI%20%EC%A7%81%EC%9B%90%20%EA%B4%80%EC%A0%9C%ED%83%91%20%EB%AC%B8%EC%9D%98"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[13px] font-extrabold active:opacity-85"
              >
                메일로 문의하기
              </a>
              <Link
                href="/notice"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-stone-300 text-[13px] font-extrabold active:opacity-85"
              >
                공지사항 보기
              </Link>
            </div>
          </div>
        </section>

        {/* ── 내부 링크 ── */}
        <section className="py-10">
          <h2 className="text-[16px] font-extrabold text-stone-950 dark:text-white mb-4 break-keep">함께 보면 좋은 곳</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              ["/ai-models", "AI 모델 비교", "어떤 모델을 어디에 붙일지 고를 때"],
              ["/ai-tools", "AI 도구 모음", "업무별로 쓸 만한 도구 목록"],
              ["/insight", "인사이트", "AI 활용 사례와 분석 글"],
              // /projects 는 '운영 중 0개' 기간 동안 추천하지 않는다(lib/publicFlags.ts 참고)
              ...(SHOW_PROJECTS ? [["/projects", "illo 프로젝트", "illo가 만들고 운영하는 서비스들"]] : []),
            ].map(([href, title, desc]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block rounded-xl border border-stone-200 dark:border-zinc-800 px-4 py-3.5 hover:border-[#F9954E]/50 transition-colors"
                >
                  <p className="text-[14px] font-extrabold text-stone-900 dark:text-white leading-tight">{title}</p>
                  <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mt-0.5">{desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
