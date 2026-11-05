import { defineRouting } from "next-intl/routing";

export const locales = ["en", "vi", "zh", "ja", "ko"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "vi";

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
};

export const localeToBcp47: Record<AppLocale, string> = {
  en: "en-US",
  vi: "vi-VN",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
