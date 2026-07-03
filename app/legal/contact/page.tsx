import type { Metadata } from "next";
import LegalPageLayout from "../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "문의하기 | DORI-AI",
  description: "DORI-AI에 제휴, 광고, 콘텐츠 제보, 오류 신고 등 문의를 남겨주세요.",
  alternates: { canonical: "https://illo.im/legal/contact" },
};

export default function ContactPage() {
  return (
    <LegalPageLayout title="문의하기">
      <p>DORI-AI에 궁금한 점이나 제안이 있으시면 언제든 연락 주세요.</p>

      <h2>이메일</h2>
      <ul>
        <li><strong>일반·제휴·광고 문의:</strong> lhaa0130@gmail.com</li>
        <li><strong>콘텐츠 오류 신고:</strong> lhaa0130@gmail.com</li>
      </ul>

      <h2>커뮤니티</h2>
      <p>
        사이트의 <strong>커뮤니티</strong> 게시판에 글을 남기시면 다른 사용자, 운영진과 직접
        소통할 수 있습니다.
      </p>

      <h2>답변 안내</h2>
      <p>
        보내주신 문의는 확인 후 영업일 기준 2~3일 이내에 회신드리도록 노력하고 있습니다.
        많은 문의가 몰릴 경우 답변이 다소 늦어질 수 있는 점 양해 부탁드립니다.
      </p>
    </LegalPageLayout>
  );
}
