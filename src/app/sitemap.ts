import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { TOOL_SLUGS } from "@/components/landing/tools/toolLandingData";
import { absoluteUrl } from "@/lib/seo/site";

const LAST_MODIFIED = new Date("2026-11-06");

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    // Trang chủ landing (bot không cookie nhận landing SSR)
    entries.push({
      url: `${absoluteUrl("/", locale)}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [
            l,
            absoluteUrl("/", l === routing.defaultLocale ? routing.defaultLocale : l),
          ]),
        ),
      },
    });

    for (const slug of TOOL_SLUGS) {
      entries.push({
        url: absoluteUrl(`/tools/${slug}`, locale),
        lastModified: LAST_MODIFIED,
        changeFrequency: "weekly",
        // 4 tool có app thật ưu tiên cao hơn 3 tool sắp ra mắt
        priority:
          slug === "flashcards" ||
          slug === "learn" ||
          slug === "srs" ||
          slug === "progress"
            ? 0.9
            : 0.6,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, absoluteUrl(`/tools/${slug}`, l)]),
          ),
        },
      });
    }
  }

  return entries;
}
