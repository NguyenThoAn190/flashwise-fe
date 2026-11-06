import { routing, type AppLocale } from "@/i18n/routing";

/** Canonical site URL — override bằng env khi có domain production. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://flashwise.app";

export const SITE_NAME = "Flashwise";

export const OG_IMAGE = {
  url: "/images/logos/logo-full-256.png",
  width: 256,
  height: 94,
  alt: "Flashwise — Flashcards & Learn",
};

/** prefix locale: vi (default, as-needed) -> "", còn lại -> "/{locale}" */
export function localePrefix(locale: string): string {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}

/** Canonical path tuyệt đối cho 1 route nội bộ. */
export function absoluteUrl(path: string, locale?: string): string {
  const prefix = locale ? localePrefix(locale) : "";
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${prefix}${clean || "/"}`.replace(/([^:]\/)\/+/g, "$1");
}

/** alternates.languages cho hreflang đầy đủ + x-default về bản vi. */
export function hreflangAlternates(path: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const locale of routing.locales) {
    entries[locale] = absoluteUrl(path, locale);
  }
  entries["x-default"] = absoluteUrl(path, routing.defaultLocale);
  return entries;
}

export function isAppLocale(locale: string): locale is AppLocale {
  return (routing.locales as readonly string[]).includes(locale);
}
