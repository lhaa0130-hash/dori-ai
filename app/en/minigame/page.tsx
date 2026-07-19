// app/en/minigame/page.tsx — English mini games hub (/en/minigame)
import { createMetadata } from "@/lib/seo";
import MinigameEnClient from "./page.client";

const SITE_URL = "https://illo.im";

const base = createMetadata({
  title: "Free Mini Games — play instantly in your browser, no sign-up",
  description:
    "18 free browser mini games you can play instantly: Galaxy Merge, Boss Clicker, Cute 2048, Snake, Gem Match, Whack-a-Mole, Reaction Time, Aim Trainer and more. Scores are saved to the Hall of Fame.",
  path: "/en/minigame",
  locale: "en",
  hreflang: { ko: "/minigame", en: "/en/minigame" },
  keywords: [
    "free mini games", "browser games", "play online games free", "no download games",
    "2048 game", "snake game", "whack a mole", "reaction time test", "aim trainer",
    "match 3 game", "memory game", "casual games",
  ],
});

export const metadata = {
  ...base,
  alternates: {
    canonical: `${SITE_URL}/en/minigame`,
    languages: {
      "ko-KR": `${SITE_URL}/minigame`,
      en: `${SITE_URL}/en/minigame`,
      "x-default": `${SITE_URL}/en/minigame`,
    },
  },
};

export default function Page() {
  return <MinigameEnClient />;
}
