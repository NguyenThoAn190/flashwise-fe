import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl, hreflangAlternates, OG_IMAGE, SITE_NAME, SITE_URL } from "./site";
import { getToolCopy, type ToolSlug } from "@/components/landing/tools/toolLandingData";

function ogImageUrl(): string {
  const base = SITE_URL.replace(/\/$/, "");
  return `${base}${OG_IMAGE.url}`;
}

function baseOpenGraph(locale: string, path: string, title: string, description: string) {
  const url = absoluteUrl(path, locale);
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    locale: locale === "vi" ? "vi_VN" : locale === "zh" ? "zh_CN" : locale === "ja" ? "ja_JP" : locale === "ko" ? "ko_KR" : "en_US",
    url,
    title,
    description,
    images: [
      {
        url: ogImageUrl(),
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  };
}

export function homeMetadata(locale: string): Metadata {
  void routing;
  const isEn = locale === "en";
  const title = isEn
    ? "Flashwise: Flashcards, Learn, SRS & Progress"
    : "Flashwise: Flashcards, Learn, SRS & Tiến độ";
  const description = isEn
    ? "Flashwise is a free flashcard platform: 3D flip cards, adaptive Learn mode, 5-layer spaced repetition SRS and progress dashboard. Create a set in 1 minute."
    : "Flashwise là nền tảng flashcard miễn phí: thẻ lật 3D, học thích ứng Learn, lặp lại ngắt quãng SRS 5 tầng và dashboard tiến độ. Tạo học phần trong 1 phút.";
  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    description,
    alternates: {
      canonical: absoluteUrl("/", locale),
      languages: hreflangAlternates("/"),
    },
    openGraph: baseOpenGraph(locale, "/", title, description),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl()],
    },
  };
}

export function toolMetadata(locale: string, slug: ToolSlug): Metadata {
  const copy = getToolCopy(locale, slug);
  const title = `${copy.heroTitle} | Flashwise`;
  const description = copy.heroSubtitle;
  const path = `/tools/${slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(path, locale),
      languages: hreflangAlternates(path),
    },
    openGraph: baseOpenGraph(locale, path, title, description),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl()],
    },
  };
}
