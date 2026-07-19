import type { ReactNode } from "react";
import LegalPageLayout from "@/app/legal/components/LegalPageLayout";
import { enMetadata } from "../../enMetadata";

export const metadata = enMetadata({
  title: "Business Information",
  description:
    "Business identity information for illo, including e-commerce registration status, hosting provider and the personal information protection officer.",
  koPath: "/legal/business",
  enPath: "/en/legal/business",
  keywords: ["illo business information", "company information", "hosting provider", "privacy officer"],
});

const rows: { k: string; v: ReactNode; pending?: boolean }[] = [
  { k: "Trade name", v: "illo" },
  { k: "Representative", v: "To be disclosed", pending: true },
  { k: "Business registration number", v: "To be disclosed", pending: true },
  { k: "Business address", v: "To be disclosed", pending: true },
  { k: "Email", v: <a href="mailto:illo@illo.im">illo@illo.im</a> },
  { k: "Hosting provider", v: "Cloudflare, Inc." },
  {
    k: "Personal information protection officer",
    v: <>illo Operations Lead · <a href="mailto:illo@illo.im">illo@illo.im</a></>,
  },
];

export default function EnBusinessPage() {
  return (
    <LegalPageLayout
      locale="en"
      title="Business Information"
      badge="Business"
      subtitle="Business identity information for illo."
      date="Last updated: July 5, 2026"
      intro="In line with the purpose of the Korean Act on the Consumer Protection in Electronic Commerce, illo's business identity information is provided below."
    >
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

      <h2>Mail-order business registration</h2>
      <p>
        illo currently provides information services (content and community) free of charge. If we
        begin paid mail-order sales of goods or services, we will register as a mail-order business
        with the competent district office and publish the registration number here.
      </p>

      <h2>Notes</h2>
      <p>
        Some items (<strong>representative, business registration number and business address</strong>)
        will be disclosed in stages as we prepare for full commercial service. If any business
        information changes, we will update it immediately. For inquiries, please email
        <a href="mailto:illo@illo.im"> illo@illo.im</a>.
      </p>
    </LegalPageLayout>
  );
}
