import { createMetadata } from "@/lib/seo";
import { getAllCurations } from "@/lib/curation";
import { mapVideoCategory } from "@/constants/videoCategories";
import VideoClient, { type VideoItem } from "./VideoClient";

const SITE = "https://illo.im";

export const metadata = createMetadata({
  title: "AI 영상 모음 — 카테고리별 추천 영상",
  description:
    "트렌드·입문·활용·개발·콘텐츠 제작까지, 매일 엄선한 AI 추천 유튜브 영상을 카테고리별로 모았습니다. 보고 싶은 주제만 골라보세요.",
  path: "/video",
  keywords: ["AI 영상", "AI 유튜브 추천", "AI 강의", "AI 트렌드 영상", "AI 활용 영상", "AI 입문 영상"],
});

export default function Page() {
  const videos: VideoItem[] = getAllCurations()
    .filter((p) => p.category === "영상")
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      thumbnail: p.thumbnail,
      date: p.date,
      cat: mapVideoCategory(p.tags),
    }));

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI 영상 모음",
    url: `${SITE}/video`,
    itemListElement: videos.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.title,
      url: `${SITE}/insight/article/${v.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <VideoClient videos={videos} />
    </>
  );
}
