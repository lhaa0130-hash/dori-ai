import LegalAccordion from "@/app/legal/components/LegalAccordion";
import { enMetadata } from "../../enMetadata";

export const metadata = enMetadata({
  title: "Terms of Service",
  description:
    "illo's terms of service. Read about the rights, obligations and responsibilities that apply to using the service, as well as our advertising policy.",
  koPath: "/legal/terms",
  enPath: "/en/legal/terms",
  keywords: ["terms of service", "illo terms", "service agreement", "user agreement", "advertising policy"],
});

const sections = [
  {
    q: "Article 1 (Purpose)",
    a: "The purpose of these Terms is to set out the rights, obligations and responsibilities of the site and its users in relation to the internet services (the \"Service\") provided on the website (the \"Site\") operated by illo (the \"Company\").",
  },
  {
    q: "Article 2 (Definitions)",
    a: "The terms used in these Terms are defined as follows.\n\n① \"Site\" means the virtual place of business that the Company has established using computers and other information and communications equipment in order to provide the Service to users, currently operated at illo.im.\n\n② \"User\" means a member or non-member who accesses the Site and uses the Service provided by the Company under these Terms.\n\n③ \"Member\" means a person who has registered as a member by providing personal data to the Site, and who may continuously receive information from the Site and use the services it provides.\n\n④ \"Non-member\" means a person who uses the services provided by the Site without registering as a member.\n\n⑤ \"Posting\" means text, photographs, videos, files, links, comments and similar material that a member posts on the Site while using the Service.\n\n⑥ \"Content\" means all information provided by the Company through the Site, including AI tool information, insight articles, guides and educational materials.",
  },
  {
    q: "Article 3 (Effect and Amendment of the Terms)",
    a: "① These Terms take effect when they are posted on the initial screen of the Site or otherwise notified to users, and a user who agrees to them registers for the Service.\n\n② The Company may amend these Terms to the extent that doing so does not violate applicable law, including the Act on the Regulation of Terms and Conditions and the Act on Promotion of Information and Communications Network Utilization and Information Protection.\n\n③ Where the Company amends the Terms, it will state the effective date and the reason for the amendment and post them, together with the current Terms, on the initial screen of the Site from 7 days before the effective date until the day before it. However, where the change is unfavorable to users, the Company will give notice with a grace period of at least 30 days in advance.\n\n④ A user who does not agree to the amended Terms may terminate the use agreement (withdraw membership). If a user continues to use the Service after the amended Terms take effect, the user is deemed to have agreed to the changes.",
  },
  {
    q: "Article 4 (Provision and Modification of the Service)",
    a: "① The Company provides the following services.\n\n• AI Tools information, search and review services\n• Insight content services\n• Academy educational content services\n• Community board services\n• Additional services such as mini games\n• Receipt and handling of suggestions\n• Market services (in preparation)\n• Any other services the Company develops or provides through partnership agreements\n\n② The Company may change the content of the Service for reasons such as changes in technical specifications. In that case, the Company will give prior notice specifying the changed content and the date on which it takes effect.",
  },
  {
    q: "Article 5 (Suspension of the Service)",
    a: "① The Company may temporarily suspend provision of the Service where circumstances arise such as maintenance, replacement or failure of computers or other information and communications equipment, or interruption of communications.\n\n② The Company will compensate users or third parties for damage suffered as a result of a temporary suspension under paragraph 1, unless the Company proves that it acted without intent or negligence.\n\n③ Where the Service can no longer be provided due to a change of business line, abandonment of the business, a merger between companies or similar reasons, the Company will notify users of the Service in advance.",
  },
  {
    q: "Article 6 (Membership Registration)",
    a: "① A user applies for membership by entering their member information in the form prescribed by the Site and indicating their agreement to these Terms.\n\n② The Company registers as a member any user who has applied under paragraph 1, unless one of the following applies.\n\n• The applicant has previously lost membership status under these Terms\n• The registration details contain falsehoods, omissions or errors\n• Registering the applicant as a member would otherwise cause significant technical difficulty for the Company\n\n③ If any of the details registered at sign-up change, the member must notify the Company of the change within a reasonable period, for example by editing their member information.",
  },
  {
    q: "Article 7 (Withdrawal of Membership and Loss of Membership Status)",
    a: "① A member may request withdrawal from the Company at any time, and the Company will process the withdrawal immediately.\n\n② The Company may restrict or suspend membership status where a member falls under any of the following.\n\n• Registering false information when applying to join\n• Interfering with another person's use of the Service, or misappropriating another person's information\n• Using the Service to engage in conduct prohibited by law or by these Terms\n• Interfering with the stable operation of the Service\n\n③ Where the Company causes a member to lose membership status, it will notify the member and, before deleting the membership registration, allow the member a period of at least 30 days to present an explanation.",
  },
  {
    q: "Article 8 (Obligations of Users)",
    a: "Users must not engage in the following conduct.\n\n① Registering false information when applying or making changes\n② Misappropriating another person's information\n③ Altering information posted on the Site\n④ Infringing the copyright or other intellectual property rights of the Company or any third party\n⑤ Damaging the reputation of, or interfering with the business of, the Company or any third party\n⑥ Publishing or posting on the Site obscene or violent messages, images, audio or other information contrary to public order and morals\n⑦ Reproducing, distributing or commercially exploiting information obtained through the Service without prior consent\n⑧ Accessing the Service or collecting information using automated means (such as crawling or scraping)\n⑨ Any other unlawful or improper conduct",
  },
  {
    q: "Article 9 (Obligations of the Company)",
    a: "① The Company will not engage in conduct prohibited by law or these Terms or contrary to public order and morals, and will use its best efforts to provide the Service continuously and stably.\n\n② The Company must maintain a security system to protect users' personal data so that users can use the internet service safely.\n\n③ The Company does not send commercial advertising email that users do not want.\n\n④ Where the Company recognizes as legitimate an opinion or complaint raised by a user in connection with use of the Service, it must address it.",
  },
  {
    q: "Article 10 (Management of Postings)",
    a: "① Where a user's posting contains content that violates applicable law, the rights holder may request suspension of publication and deletion of the posting in accordance with the procedures prescribed by law, and the Company will take action in accordance with applicable law.\n\n② All rights in, and responsibility for, a posting created by a user rest with the user who posted it.\n\n③ The Company may delete the following postings without prior notice.\n\n• Content that defames or damages the reputation of another user or a third party\n• Content contrary to public order and good morals\n• Content deemed to be connected with criminal activity\n• Content that infringes the copyright or other rights of others\n• Obscene material or content harmful to young people\n• Commercial advertising or spam postings",
  },
  {
    q: "Article 11 (Ownership of Copyright and Restrictions on Use)",
    a: "① Copyright and other intellectual property rights in works created by the Company belong to the Company.\n\n② Users must not reproduce, transmit, publish, distribute, broadcast or otherwise use for commercial purposes — or allow third parties to use — information obtained through the Site without the Company's prior consent.\n\n③ Copyright in a posting created by a user belongs to that user. However, where a posting infringes another person's copyright, the user bears responsibility for it.\n\n④ The Company may use users' postings within the Site for purposes such as operating and promoting the Service.\n\n⑤ Some content on this Site is produced using artificial intelligence (AI). The Company discloses this fact transparently.",
  },
  {
    q: "Article 12 (Display of Advertising)",
    a: "① The Company may display advertising on Service screens in connection with operating the Service.\n\n② The Company may use third-party advertising services including Google AdSense, and such advertising may be displayed based on users' interests.\n\n③ Notes regarding advertising\n• Responsibility for the content of an advertisement rests with the advertiser concerned.\n• Any correspondence or transaction between a user and an advertiser is solely a matter between that user and the advertiser, and the Company bears no responsibility for it.",
  },
  {
    q: "Article 13 (Disclaimer)",
    a: "① The Company is released from responsibility for providing the Service where it cannot do so due to a natural disaster or comparable force majeure.\n\n② The Company is not responsible for disruptions to use of the Service caused by reasons attributable to the user.\n\n③ The Company is not responsible for the reliability or accuracy of information, materials or facts posted by users.\n\n④ Unless applicable law provides otherwise, the Company bears no responsibility in connection with the use of services provided free of charge.\n\n⑤ AI-related information and content provided by the Company is for reference only, and users are responsible for decisions made on the basis of it.",
  },
  {
    q: "Article 14 (Damages)",
    a: "① Where the Company causes damage to a user, the Company will compensate the user for the damage actually incurred. This does not apply where the Company acted without intent or gross negligence.\n\n② Where a user causes damage to the Company by violating these Terms, the user must compensate the Company for the damage incurred.",
  },
  {
    q: "Article 15 (Dispute Resolution)",
    a: "① The Company will endeavor to reflect legitimate opinions or complaints raised by users and to provide compensation for damage.\n\n② Where a user applies for damage relief in connection with a dispute between the Company and the user, the matter may be subject to mediation by a dispute mediation body referred by the Fair Trade Commission or a Mayor/Provincial Governor.",
  },
  {
    q: "Article 16 (Jurisdiction and Governing Law)",
    a: "① Disputes between the Company and users concerning use of the Service are governed by the laws of the Republic of Korea.\n\n② Lawsuits concerning disputes between the Company and users are subject to the exclusive jurisdiction of the district court having jurisdiction over the user's address at the time the action is filed, or over the user's place of residence if there is no address.",
  },
  {
    q: "Article 17 (Miscellaneous)",
    a: "① Matters not specified in these Terms are governed by applicable law and commercial practice, including the Act on the Consumer Protection in Electronic Commerce, the Act on the Regulation of Terms and Conditions, and the Act on Promotion of Information and Communications Network Utilization and Information Protection.\n\n② These Terms apply from February 16, 2026.\n\n③ If you have any questions about these Terms, please contact us below.\n\n▶ Email: illo@illo.im\n▶ Website: illo.im",
  },
];

export default function EnTermsPage() {
  return (
    <LegalAccordion
      locale="en"
      label="Terms"
      title="Terms of Service"
      subtitle="The rights and obligations that apply to using the service."
      date="Last updated: February 16, 2026"
      sections={sections}
    />
  );
}
