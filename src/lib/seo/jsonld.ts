import { SITE_URL, SITE_NAME, absoluteUrl } from "./site";
import type { ToolSlug } from "@/components/landing/tools/toolLandingData";
import { getToolCopy } from "@/components/landing/tools/toolLandingData";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logos/logo-icon-512.png`,
    sameAs: [] as string[],
  };
}

export function webSiteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/", locale),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/", locale)}?search={query}`,
      "query-input": "required name=query",
    },
  };
}

export function softwareAppJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/", locale),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: ["vi", "en", "zh", "ja", "ko"],
  };
}

export function toolJsonLd(locale: string, slug: ToolSlug) {
  const copy = getToolCopy(locale, slug);
  const url = absoluteUrl(`/tools/${slug}`, locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: `Flashwise ${copy.heroTitle}`,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url,
        description: copy.heroSubtitle,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        inLanguage: locale,
      },
      {
        "@type": "HowTo",
        name: copy.howTitle,
        description: copy.howSubtitle,
        step: copy.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.desc,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Flashwise", item: absoluteUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: copy.heroTitle, item: url },
        ],
      },
    ],
  };
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
