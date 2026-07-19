import LegalAccordion from "@/app/legal/components/LegalAccordion";
import { enMetadata } from "../../enMetadata";

export const metadata = enMetadata({
  title: "Youth Protection Policy",
  description:
    "illo's youth protection policy: measures to protect young people from harmful information, how to report harmful content, and the designated youth protection officer.",
  koPath: "/legal/youth",
  enPath: "/en/legal/youth",
  keywords: ["youth protection policy", "child safety", "reporting harmful content", "youth protection officer", "illo"],
});

const sections = [
  {
    q: "Article 1 (Purpose)",
    a: "In accordance with the Youth Protection Act and other applicable law, illo (the \"Company\") establishes and implements this youth protection policy so that young people are protected from a harmful information environment and can grow into sound individuals. This policy applies to all services on the website operated by the Company (illo.im), including the community, mini games and content.",
  },
  {
    q: "Article 2 (Restricting Access to Harmful Information and Management Measures)",
    a: "① The Company takes the following measures so that young people are not exposed to harmful information without any restriction mechanism.\n\n• Providing a separate verification mechanism for media material harmful to youth (where such content is operated)\n• Continuous monitoring of community boards and user postings\n• Detection and blocking of inappropriate or harmful postings through an automated review system\n\n② Under its terms of service and related policies, the Company prohibits the posting of information harmful to young people, including obscene, violent or gambling-related material, and may delete or block infringing postings without prior notice.",
  },
  {
    q: "Article 3 (Education and Inspection for Youth Protection)",
    a: "① The Company continuously maintains awareness of youth protection policies and applicable law among the staff who operate the Service.\n\n② The Company periodically inspects and improves the systems (such as automated review bots) that protect young people from information harmful to youth.\n\n③ The Company operates a review process to ensure that content generated using AI is not harmful to young people.",
  },
  {
    q: "Article 4 (Reporting and Handling of Information Harmful to Youth)",
    a: "① If a user finds information within the Service that they consider harmful to young people, they may report it using the contact below.\n\n• Reporting email: illo@illo.im\n• The 'Suggestions' feature or the post reporting function on the site\n\n② Upon receiving a report, the Company reviews the information without delay and, where harmfulness is confirmed, takes the necessary action such as deletion or blocking, then informs the reporter of the outcome.",
  },
  {
    q: "Article 5 (Designation of the Youth Protection Officer)",
    a: "The Company designates a youth protection officer as set out below, to oversee youth protection work and to protect young people from information harmful to youth.\n\n▶ Youth Protection Officer\n• Position: illo Operations Lead\n• Email: illo@illo.im\n\n※ The officer's name is not disclosed in order to protect personal data; inquiries and reports relating to youth protection are handled through the position and the representative contact (email).",
  },
  {
    q: "Article 6 (Amendment of this Policy)",
    a: "This youth protection policy may be amended in line with changes to applicable law and Company policy. Where it is amended, the changes will be announced through the site. This policy takes effect on July 4, 2026.",
  },
];

export default function EnYouthPage() {
  return (
    <LegalAccordion
      locale="en"
      label="Youth Protection"
      title="Youth Protection Policy"
      subtitle="illo works to protect young people from harmful information."
      date="Effective: July 4, 2026"
      sections={sections}
    />
  );
}
