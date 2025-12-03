import { Metadata } from "next";

const SITE_NAME = "DORI-AI";
const SITE_URL = "https://dori-ai.com";
const DEFAULT_OG_IMAGE = "https://dori-ai.com/og-default.png";

interface CreateMetadataProps {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function createMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
}: CreateMetadataProps): Metadata {
  const fullUrl = `${SITE_URL}${path}`;

  return {
    title: {
      default: `${title} | ${SITE_NAME}`,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    authors: [{ name: "DORI Team", url: SITE_URL }],
    creator: "DORI Team",
    publisher: "DORI-AI",
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: fullUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}