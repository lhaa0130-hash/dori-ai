import LegalAccordion from "@/app/legal/components/LegalAccordion";
import { enMetadata } from "../../enMetadata";

export const metadata = enMetadata({
  title: "Copyright & Licenses",
  description:
    "Copyright in illo's content, our transparency notice on AI-generated content, open-source and third-party licenses, trademark use and how to report copyright infringement.",
  koPath: "/legal/copyright",
  enPath: "/en/legal/copyright",
  keywords: ["copyright", "licenses", "AI generated content disclosure", "open source licenses", "DMCA", "illo"],
});

const sections = [
  {
    q: "Copyright in illo content",
    a: "Copyright and other intellectual property rights in content that illo (illo.im, the \"Company\") has published on the Service — including writing, planning, editing, design, layout, databases and the screen elements that make them up, whether produced by the Company directly or commissioned by it — belong in principle to the Company.\n\nUsers may view and use content provided by the Company within the scope of using the Service, but must not reproduce, transmit, publish, distribute, broadcast or create derivative works from it, whether for commercial or non-commercial purposes, or allow third parties to do so, without the prior written consent of the Company or the rightful rights holder.\n\nEven when using content within the scope permitted by copyright law, such as quotation or introduction, please clearly attribute the source as 'illo (illo.im)'. If you wish to use content commercially or at scale, please contact illo@illo.im in advance.",
  },
  {
    q: "Transparency notice on AI-generated content",
    a: "illo produces some of the content published on the Service — including text and images — using generative AI technology. External AI services such as fal.ai may be used for image generation, and text content may likewise be generated or assisted by AI before being edited, reviewed and published.\n\nThe Company provides this notice to inform users of that fact transparently, and may indicate whether AI was used on an individual post-by-post basis depending on the nature of the content. Because AI-generated content can by its nature contain inaccuracies or statements that differ from fact, we recommend that users separately verify the original source before making important decisions.\n\nThe Company operates a review process so that AI-generated content does not infringe the rights of third parties. Where a potential rights infringement is nevertheless identified, we act promptly in accordance with the 'How to report copyright infringement' procedure below.",
  },
  {
    q: "Open-source and third-party licenses",
    a: "The illo service uses the following open-source software and third-party works under the terms of their respective licenses. Rights in each work belong to its original copyright holder.\n\n· Pretendard typeface — SIL Open Font License 1.1 (OFL)\n· lucide icons — ISC License\n· Next.js, React and related libraries — MIT License and other open-source licenses set by each project\n· Other open-source components — the license terms included in each distributed package\n\nThe full text of each license and its copyright notices follow the originals distributed by the respective projects, and the Company complies with its obligations to retain copyright notices and license copies as required by those licenses. If you would like to review the original license text for a particular component, please request it at illo@illo.im and we will provide it.",
  },
  {
    q: "Third-party trademarks and logos",
    a: "The AI tool and service names, company names, product names, logos and trademarks displayed on the illo service (\"third-party marks\") are trademarks or registered trademarks of their respective rights holders, and all rights in them belong exclusively to those rights holders.\n\nThe Company uses such third-party marks solely to accurately identify and describe the relevant tools and services to users and to provide information (identification and informational purposes). This does not imply any partnership, sponsorship, endorsement or special relationship with the rights holder concerned.\n\nIf a rightful rights holder wishes the manner of display to be modified or removed, please contact illo@illo.im and we will review the request and act promptly.",
  },
  {
    q: "Copyright in user postings",
    a: "Copyright in content that users create and post themselves within the Service — comments, posts, profiles and other material (\"user postings\") — belongs to the user who created it.\n\nHowever, for the operation, improvement and promotion of the Service and to ensure content is displayed properly, users agree to grant the Company a royalty-free right to store, reproduce, modify (including format changes that do not alter the substance of the posting), transmit, display and distribute user postings within the Service and the Company's associated channels. Such use is limited to the scope of providing the Service, and users' moral rights as authors are respected.\n\nUsers warrant that the postings they publish do not infringe the copyright, trademark rights, portrait rights, reputation or other rights of any third party, and bear responsibility for any breach of that warranty. The Company may restrict or delete without prior notice any posting that infringes another person's rights or violates applicable law or these terms.",
  },
  {
    q: "How to report copyright infringement",
    a: "If you believe that content published on the illo service infringes your copyright or other rights, please report it using the contact below. Upon receiving a report, the Company will review it promptly and take the necessary action in accordance with applicable law (including Article 103 of the Copyright Act and the Act on Promotion of Information and Communications Network Utilization and Information Protection).\n\n· Reporting email: illo@illo.im\n\nTo help us process your report smoothly, please include the following.\n① Your name and contact details\n② A description of the right you claim has been infringed, together with material substantiating that you are the rights holder\n③ The location (URL) of the infringing content and a specific description of the infringement\n④ A statement confirming that the information in your report is accurate\n\nWhere a legitimate rights holder's request is verified, the Company will take the necessary action, such as suspending publication (deletion or blocking) of the content, and will report the outcome back to you. In the case of suspension of reproduction or transmission under Article 103 of the Copyright Act, the Company may notify the user who posted the content, and that user may request reinstatement by substantiating that they hold legitimate rights.",
  },
];

export default function EnCopyrightPage() {
  return (
    <LegalAccordion
      locale="en"
      label="Copyright"
      title="Copyright & Licenses"
      subtitle="Copyright in illo content, AI-generated content disclosure and open-source licenses."
      date="Last updated: July 4, 2026"
      sections={sections}
    />
  );
}
