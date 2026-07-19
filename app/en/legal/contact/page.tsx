import LegalPageLayout from "@/app/legal/components/LegalPageLayout";
import { enMetadata } from "../../enMetadata";

export const metadata = enMetadata({
  title: "Contact",
  description:
    "Get in touch with illo about partnerships, advertising, content tips or error reports. Email illo@illo.im and we will get back to you.",
  koPath: "/legal/contact",
  enPath: "/en/legal/contact",
  keywords: ["contact illo", "illo support", "illo email", "partnership inquiry", "advertising inquiry"],
});

export default function EnContactPage() {
  return (
    <LegalPageLayout
      locale="en"
      title="Contact"
      badge="Contact"
      subtitle="If you have a question or a suggestion, reach out any time."
      date="Last updated: July 5, 2026"
    >
      <p>If you have a question or a suggestion for illo, please get in touch any time.</p>

      <h2>Email</h2>
      <ul>
        <li><strong>General, partnership and advertising inquiries:</strong> illo@illo.im</li>
        <li><strong>Content error reports:</strong> illo@illo.im</li>
      </ul>

      <h2>Community</h2>
      <p>
        You can also post on the site&rsquo;s <strong>community</strong> board to talk directly with
        other users and the illo team.
      </p>

      <h2>Response times</h2>
      <p>
        We aim to review and reply to every inquiry within 2 to 3 business days. During busy periods
        a reply may take a little longer — thank you for your patience.
      </p>
    </LegalPageLayout>
  );
}
