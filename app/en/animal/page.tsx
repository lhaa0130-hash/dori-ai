import { createMetadata } from "@/lib/seo";
import fs from "fs";
import path from "path";
import AnimalPageClient, { type AnimalCard, type AnimalEn } from "../../animal/page.client";

const SITE_URL = "https://illo.im";

// createMetadata의 x-default는 ko라서, 영어판 규약(x-default=en)에 맞게 alternates만 덮어씀
const base = createMetadata({
  title: "Animal Encyclopedia — kid-friendly guide to hundreds of animals",
  description:
    "Browse hundreds of animals with photos, IUCN status, size, lifespan, diet and habitat. Filter by type, diet, lifespan, weight, length and region — written for kids.",
  path: "/en/animal",
  locale: "en",
  hreflang: { ko: "/animal", en: "/en/animal" },
  keywords: [
    "animal encyclopedia", "animals for kids", "animal facts", "animal guide",
    "endangered animals", "IUCN status", "mammals", "birds", "reptiles",
    "animal habitat", "animal lifespan", "animal diet",
  ],
});

export const metadata = {
  ...base,
  alternates: {
    canonical: `${SITE_URL}/en/animal`,
    languages: {
      "ko-KR": `${SITE_URL}/animal`,
      en: `${SITE_URL}/en/animal`,
      "x-default": `${SITE_URL}/en/animal`,
    },
  },
};

function loadJson<T>(...segments: string[]): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), ...segments), "utf8")) as T;
  } catch {
    return null;
  }
}

export default async function EnAnimalPage() {
  const cards = loadJson<AnimalCard[]>("data", "animal-cards.json");
  const enMap = loadJson<Record<string, AnimalEn>>("data", "animal-cards.en.json");
  // 공개 노출 필터(Firestore animalReview/status의 approved)는 클라이언트에서 그대로 적용된다.
  // 한글판과 동일한 컴포넌트를 쓰므로 승인 게이트가 자동으로 유지됨.
  return <AnimalPageClient cards={Array.isArray(cards) ? cards : []} locale="en" enMap={enMap || {}} />;
}
