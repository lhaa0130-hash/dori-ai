import type { Metadata } from "next";
import LegalPageLayout from "../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "회사 소개 | illo",
  description: "illo는 매일 AI 트렌드를, 매주 큐레이션·분석·리포트를 제공하며, 누구나 쉽게 AI를 활용하도록 돕는 커뮤니티 플랫폼입니다. 제작·운영은 illo가 맡고 있습니다.",
  alternates: { canonical: "https://illo.im/legal/about", languages: { "ko-KR": "https://illo.im/legal/about", en: "https://illo.im/en/legal/about", "x-default": "https://illo.im/legal/about" } },
};

export default function AboutPage() {
  return (
    <LegalPageLayout
      title="illo 소개"
      badge="About"
      subtitle="AI를 누구나 쉽게 — illo를 소개합니다."
      date="최종 개정일: 2026년 7월 5일"
    >
      <p>
        illo(일로)는 빠르게 변하는 인공지능(AI) 소식과 도구를 누구나 쉽게 이해하고 활용하도록
        한곳에 모아 정리하는 AI 콘텐츠·정보 플랫폼입니다. 이름 <strong>illo</strong>는
        &lsquo;모든 일을 하나의 일처럼 쉽게&rsquo;라는 뜻으로, 흩어져 있는 AI 정보를 한자리에서
        찾고 비교하고 배울 수 있게 하자는 지향을 담고 있습니다. 전문가가 아니어도 읽고 바로
        써먹을 수 있는 콘텐츠를 목표로 합니다.
      </p>

      <h2>illo에서 할 수 있는 것</h2>
      <ul>
        <li><strong>AI 도구 디렉터리</strong> — 340개가 넘는 AI 도구를 카테고리별로 정리하고,
          쓰임새·장단점·요금을 비교할 수 있게 소개합니다.</li>
        <li><strong>AI 모델 비교</strong> — 주요 대형언어모델(LLM)의 성능·속도·가격을 실시간
          데이터로 비교하고, 비용 계산기로 예상 요금을 미리 가늠할 수 있습니다.</li>
        <li><strong>AI 인사이트</strong> — 매일의 트렌드 요약부터 큐레이션·심층 분석·시장
          리포트, 엄선한 추천 영상까지 AI 흐름을 꾸준히 정리합니다.</li>
        <li><strong>동물도감</strong> — 사람이 검수한 동물 정보를 카드로 제공하는 자체 제작
          콘텐츠입니다.</li>
        <li><strong>커뮤니티·부가 콘텐츠</strong> — 게시판, 심리 테스트, 미니게임 등 방문자가
          직접 참여하고 즐길 수 있는 공간을 함께 운영합니다.</li>
      </ul>

      <h2>콘텐츠 제작·편집 원칙</h2>
      <p>
        illo는 정확성을 가장 중요하게 생각합니다. 콘텐츠는 AI의 도움을 받아 빠르게 정리하되,
        다음 원칙을 지킵니다.
      </p>
      <ul>
        <li>출처가 분명한 정보만 다루며, 확인되지 않은 내용은 싣지 않습니다.</li>
        <li>동물도감처럼 사실 정확성이 중요한 콘텐츠는 <strong>공개 전 사람이 직접 검수</strong>하는
          절차를 두고, 승인된 항목만 게시합니다.</li>
        <li>과장·낚시성 표현을 배제하고, 어려운 전문용어는 풀어서 설명합니다.</li>
        <li>발행 이후에도 오류가 확인되면 신속히 정정합니다.</li>
      </ul>

      <h2>지향점</h2>
      <p>
        AI는 이제 특정 직군만의 도구가 아닙니다. illo는 AI를 처음 접하는 분부터 매일 활용하는
        분까지, 필요한 정보를 과장 없이 사실 위주로 전달해 <strong>신뢰할 수 있는 길잡이</strong>가
        되는 것을 목표로 합니다.
      </p>

      <h2>운영 주체</h2>
      <p>
        illo는 illo 운영팀이 직접 기획·제작·운영합니다. 사이트 주소는
        <strong> www.dori-ai.com</strong>(illo.im으로 이전 예정)이며, 모든 콘텐츠와 서비스의
        책임은 illo 운영팀에 있습니다.
      </p>

      <h2>함께하기 · 문의</h2>
      <p>
        회원으로 가입하면 출석·미션·미니게임으로 솜사탕을 모으고, 커뮤니티에서 다른 사용자와
        AI 활용 노하우를 나눌 수 있습니다. 제휴·광고·오류 제보·기타 문의는 이메일
        <strong> illo@illo.im</strong> 으로 보내 주시면 확인 후 답변드립니다.
      </p>
    </LegalPageLayout>
  );
}
