import type { Metadata } from "next";
import LegalPageLayout from "../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "회사 소개 | illo",
  description: "illo는 매일 AI 트렌드를, 매주 큐레이션·분석·리포트를 제공하며, 누구나 쉽게 AI를 활용하도록 돕는 커뮤니티 플랫폼입니다. 제작·운영은 illo가 맡고 있습니다.",
  alternates: { canonical: "https://illo.im/legal/about" },
};

export default function AboutPage() {
  return (
    <LegalPageLayout title="illo 소개">
      <p>
        illo는 빠르게 변하는 인공지능(AI) 소식을 누구나 쉽게 이해하도록 정리해 전달하는
        AI 콘텐츠·커뮤니티 플랫폼입니다. 전문가가 아니어도 읽고 바로 활용할 수 있는 글을 목표로 합니다.
      </p>

      <h2>우리가 하는 일</h2>
      <ul>
        <li><strong>트렌드</strong> — 매일 핵심 AI 뉴스를 짧고 명확하게 요약합니다.</li>
        <li><strong>큐레이션</strong> — 실제로 쓸 만한 AI 도구를 골라 소개합니다.</li>
        <li><strong>분석</strong> — 사건 뒤의 흐름과 의미를 깊이 있게 풀어냅니다.</li>
        <li><strong>리포트</strong> — 시장과 산업 동향을 데이터 중심으로 추적합니다.</li>
      </ul>

      <h2>지향점</h2>
      <p>
        어려운 전문용어는 풀어 쓰고, 과장 없이 사실 위주로 전달합니다.
        AI를 배우고 활용하려는 모든 분께 신뢰할 수 있는 길잡이가 되는 것이 illo의 목표입니다.
      </p>

      <h2>함께하기</h2>
      <p>
        회원으로 가입하면 출석·미션·미니게임으로 솜사탕을 모으고, 커뮤니티에서 다른 사용자와
        AI 활용 노하우를 나눌 수 있습니다.
      </p>

      <h2>문의</h2>
      <p>
        제휴·광고·기타 문의는 이메일 <strong>illo@illo.im</strong> 으로 보내 주세요.
      </p>
    </LegalPageLayout>
  );
}
