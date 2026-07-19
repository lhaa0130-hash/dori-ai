import LegalPageLayout from "@/app/legal/components/LegalPageLayout";
import { enMetadata } from "../../enMetadata";

export const metadata = enMetadata({
  title: "About illo",
  description:
    "illo brings AI news, tools and guides together in one place. Learn about our mission, what you can do on illo, our editorial principles and who runs the service.",
  koPath: "/legal/about",
  enPath: "/en/legal/about",
  keywords: ["about illo", "illo company", "AI platform", "AI content platform", "AI tools directory"],
});

export default function EnAboutPage() {
  return (
    <LegalPageLayout
      locale="en"
      title="About illo"
      badge="About"
      subtitle="AI made easy for everyone — this is illo."
      date="Last updated: July 5, 2026"
    >
      <p>
        illo is an AI content and information platform that gathers fast-moving artificial
        intelligence news and tools into one place, organized so anyone can understand and use
        them. The name <strong>illo</strong> means &lsquo;making every task feel like one simple
        task&rsquo; — the idea that scattered AI information should be searchable, comparable and
        learnable in a single spot. Our goal is content you can read and put to work immediately,
        even if you are not an expert.
      </p>

      <h2>What you can do on illo</h2>
      <ul>
        <li><strong>AI tools directory</strong> — over 340 AI tools organized by category, introduced
          so you can compare use cases, strengths, weaknesses and pricing.</li>
        <li><strong>AI model comparison</strong> — compare the performance, speed and price of major
          large language models (LLMs) with live data, and estimate your costs in advance with a
          cost calculator.</li>
        <li><strong>AI insights</strong> — from daily trend summaries to curation, in-depth analysis,
          market reports and hand-picked video recommendations, we track where AI is heading.</li>
        <li><strong>Animal encyclopedia</strong> — original content that presents human-reviewed
          animal information as cards.</li>
        <li><strong>Community and extras</strong> — a message board, psychology tests, mini games and
          other spaces where visitors can take part and have fun.</li>
      </ul>

      <h2>How we create and edit content</h2>
      <p>
        Accuracy matters most to us. We use AI to organize content quickly, but we hold to the
        following principles.
      </p>
      <ul>
        <li>We only cover information with a clear source, and we do not publish anything unverified.</li>
        <li>For content where factual accuracy is critical, such as the animal encyclopedia, a
          <strong> human reviews every entry before it goes live</strong>, and only approved items are published.</li>
        <li>We avoid exaggeration and clickbait, and we explain difficult jargon in plain language.</li>
        <li>When an error is found after publication, we correct it promptly.</li>
      </ul>

      <h2>What we aim for</h2>
      <p>
        AI is no longer a tool for one profession alone. From people encountering AI for the first
        time to those who use it daily, illo aims to deliver the information you need — fact-first
        and free of hype — and to be a <strong>guide you can trust</strong>.
      </p>

      <h2>Who runs illo</h2>
      <p>
        illo is planned, produced and operated directly by the illo team. The site is at
        <strong> www.dori-ai.com</strong> (moving to illo.im), and the illo team is responsible for
        all content and services.
      </p>

      <h2>Join us · Contact</h2>
      <p>
        As a member you can collect cotton candy through daily check-ins, missions and mini games,
        and share AI know-how with other users in the community. For partnerships, advertising,
        error reports or any other inquiry, email us at <strong>illo@illo.im</strong> and we will
        review and reply.
      </p>
    </LegalPageLayout>
  );
}
