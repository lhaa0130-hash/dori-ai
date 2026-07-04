import type { Metadata } from "next";
import type { ReactNode } from "react";
import LegalPageLayout from "../components/LegalPageLayout";

export const metadata: Metadata = {
  title: "사업자 정보 | illo",
  description: "illo의 사업자 신원정보, 통신판매업 신고 안내, 호스팅 제공자 및 개인정보보호책임자 정보입니다.",
  alternates: { canonical: "https://illo.im/legal/business" },
};

const rows: { k: string; v: ReactNode; pending?: boolean }[] = [
  { k: "상호", v: "illo (일로)" },
  { k: "대표자", v: "공개 준비 중", pending: true },
  { k: "사업자등록번호", v: "공개 준비 중", pending: true },
  { k: "사업장 소재지", v: "공개 준비 중", pending: true },
  { k: "이메일", v: <a href="mailto:illo@illo.im">illo@illo.im</a> },
  { k: "호스팅 제공자", v: "Cloudflare, Inc." },
  { k: "개인정보보호책임자", v: <>illo 운영책임자 · <a href="mailto:illo@illo.im">illo@illo.im</a></> },
];

export default function BusinessPage() {
  return (
    <LegalPageLayout title="사업자 정보">
      <p>
        「전자상거래 등에서의 소비자보호에 관한 법률」의 취지에 따라 illo의 사업자 신원정보를 아래와 같이 안내합니다.
      </p>

      <table className="biz-table">
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <th>{r.k}</th>
              <td className={r.pending ? "pending" : ""}>{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>통신판매업 신고</h2>
      <p>
        현재 illo는 정보서비스(콘텐츠·커뮤니티)를 무료로 제공하고 있으며, 재화·용역의 유료
        통신판매를 개시할 경우 관할 구청에 통신판매업을 신고하고 신고번호를 이곳에 게시합니다.
      </p>

      <h2>안내</h2>
      <p>
        일부 항목(<strong>대표자·사업자등록번호·사업장 소재지</strong>)은 정식 서비스·유료화
        준비 단계에 맞추어 순차적으로 공개될 예정입니다. 사업자 정보에 변경이 발생하는 경우 즉시
        갱신합니다. 문의는 <a href="mailto:illo@illo.im">illo@illo.im</a> 으로 보내 주세요.
      </p>
    </LegalPageLayout>
  );
}
