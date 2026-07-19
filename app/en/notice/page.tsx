import NoticeClient, { type NoticeItem, type NoticeType } from "@/app/notice/page.client";
import { enMetadata } from "../enMetadata";

export const metadata = enMetadata({
  title: "Notices",
  description:
    "The latest news and version updates from illo — release notes for the social network, cozy home, shop, mini games and more.",
  koPath: "/notice",
  enPath: "/en/notice",
  keywords: ["illo notices", "release notes", "changelog", "illo updates", "announcements"],
});

const typeLabels: Record<NoticeType, string> = {
  공지: "Notice",
  업데이트: "Update",
  이벤트: "Event",
  점검: "Maintenance",
};

const notices: NoticeItem[] = [
  {
    id: 8,
    type: "업데이트",
    version: "v5.0.0",
    title: "Shift to an AI social network · Cozy Home expansion · Shop revamp",
    content:
      "Hello, this is illo, the team behind illo.im.\nillo.im has taken a step forward into an 'AI social network + community'. (v5.0)\n\n🪐 1. Social network\n• Follow — separate from friends (which is mutual), you can now follow anyone you like. Your profile shows follower, following and post counts.\n• Explore — discover new people and posts through popular, latest and following feeds plus recommended accounts. (My Page › My Space › Explore)\n• Guestbook — leave a message on someone's cozy home, and tap an author's name to jump straight to their cozy home.\n\n🏠 2. Cozy Home decoration expansion\n• On top of backgrounds, borders, name effects, banner effects, titles and stickers, we've added pets and characters (30 animals) and mini-room props.\n• Finish off your space with mood emojis, interest tags and profile sharing (🔗).\n\n🛍️ 3. Cotton candy shop revamp\n• '👁 Try it on' before you buy — preview how an item looks on your cozy home before purchasing.\n• Lots of new items (free and paid, from normal to legendary rarity), and you can move freely between the cozy home and shop tabs.\n\n🤖 4. AI tool rankings refreshed\n• LLM rankings now reflect real OpenRouter usage (June 2026).\n\n🔧 5. Speed and convenience\n• Cache, font and bundle optimizations make everything faster, and the header and footer menus have been tidied up.\n\nWe'll keep polishing illo.im to make it more enjoyable. Thank you!",
    date: "2026-06-15",
    pinned: true,
  },
  {
    id: 7,
    type: "업데이트",
    version: "v4.0.0",
    title: "Social features launch · Mini game overhaul · Brand cleanup",
    content:
      "Hello, this is illo, the team behind illo.im.\nHere's the v4.0 update, bringing social features you can enjoy with friends and a major mini game overhaul.\n\n🪐 1. Social / your own space\n• Cozy Home — decorate your profile (status, bio, signature color, background, profile picture) and keep your records, badges, visitor counts (today/total) and guestbook in one place.\n• Friends — add and accept friends, group friends into 'circles', and set feed visibility per group.\n• Messages — real-time 1:1 DMs between members.\n• Feed — post text, images and video, choose who can see it (everyone / friends / a group), and get likes and comments.\n• Notifications — friend requests, likes, comments, guestbook entries and messages, all gathered in My Page.\n\n🎮 2. Mini game overhaul\n• Every game has been refined with a unified premium design, plus new score effects and animations.\n• Hall of fame (TOP 5) rankings introduced — log in and your records are saved per game.\n• New games: Reaction Speed, Whack-a-Mole, Sequence Memory, Quick Math, Target Click and Flappy Dori.\n• Improved controls and judgement in Animal Merge, easier Flappy difficulty, and a suggestion/bug report button on every game.\n\n🏷️ 3. Brand and membership\n• We've consolidated the studio brand as 'illo'. The project formerly called 'Illo' is now 'Workillo'.\n• Member information now shows both tier and level.\n\n🔧 4. Convenience improvements\n• Longer login sessions, tidier header and footer, a fix for insight likes, and more.\n\nWe'll keep refining illo.im to make it more fun and convenient. Thank you!",
    date: "2026-06-12",
    pinned: false,
  },
  {
    id: 6,
    type: "업데이트",
    version: "v3.0.0",
    title: "Major renewal: community, projects and mini game rewards",
    content:
      "Hello, this is the illo team.\nA major renewal (v3.0) refining the site as a whole has been applied.\n\n💬 1. Community redesign\n• Fully rebuilt with a feed-style layout so posts are easier to browse.\n• You can now leave a range of reactions such as like, cheer, insight and laugh.\n• Use topic tags to see only the posts that interest you.\n\n🚀 2. New project detail pages\n• See the three programs in development (Workillo, Monglo, Family Records) at a glance.\n• Tap any program for a detailed introduction and to leave a suggestion right there.\n\n🍭 3. Mini game play rewards added\n• Play Animal Merge, 2048 or Boss Clicker for at least one minute and get 50 cotton candy. (Once a day)\n• Animal Merge controls and graphics have been made smoother.\n\n🤖 4. Premium redesign of the AI Tools page\n• Category TOP 5 cards are cleaner, and the 'API' and 'Visit site' buttons are now separate.\n\n⚡ 5. Home page and speed improvements\n• Refreshed the first-screen copy and design, and fixed intermittent slow rendering.\n\n🔎 6. Search optimization (SEO)\n• Cleaned up duplicate content and improved the structure for search engine visibility.\n\nWe'll keep repaying you with a better service. Thank you!",
    date: "2026-06-09",
    pinned: false,
  },
  {
    id: 5,
    type: "업데이트",
    version: "v2.0.0",
    title: "Major update: orange theme and automation system",
    content:
      "Hello, this is the illo team.\nA major update (v2.0) to improve the user experience has been applied.\n\n🍊 1. Design renewal (Orange Theme)\n• The site's main color has changed to a warm, lively orange (#F9954E).\n• A consistent design system has been applied across every page, including the hero section, profiles and mini games.\n• Dark mode has been optimized to be easy on the eyes.\n\n🤖 2. Automation system (n8n & AI)\n• We've built a system that collects and analyzes global IT news and posts it automatically.\n• An AI with a professional blogger persona delivers high-quality content.\n\n🃏 3. Mini game UI improvements\n• The HighLow and Blackjack interfaces are now more intuitive and refined.\n\nWe'll keep working toward a better service.\nThank you.",
    date: "2026-02-18",
    pinned: false,
  },
  {
    id: 4,
    type: "업데이트",
    version: "v1.1.0",
    title: "New features: suggestion posting and FAQ launch",
    content:
      "We've applied a stability and feature update.\n\n• Suggestions: added a posting feature (stronger user feedback collection)\n• FAQ & Notices: new pages opened\n• Terms: privacy policy and terms of service revised\n\nWe'll keep working on continuous usability improvements.",
    date: "2026-02-16",
    pinned: false,
  },
  {
    id: 1,
    type: "공지",
    version: "v1.0.0",
    title: "illo officially launches",
    content:
      "Hello! illo has officially launched. 🎉\n\nillo is a comprehensive AI platform offering the latest AI tool information, insights, a community and educational content in one place.\n\nServices available now (v1.0):\n• AI tool search and comparison\n• AI insight articles\n• Community board\n• Mini games (beta)\n\nWe'll keep adding new features and content. We'd love your interest and feedback!",
    date: "2026-02-16",
    pinned: false,
  },
];

export default function EnNoticePage() {
  return (
    <NoticeClient
      items={notices}
      label="Notices"
      title="Notices"
      subtitle="Check the latest news and version updates from illo."
      countTemplate="{n} notices in total"
      typeLabels={typeLabels}
      dateLocale="en-US"
    />
  );
}
