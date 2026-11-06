import React from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ToolLandingHero } from "@/components/landing/tools/ToolLandingHero";
import { ToolFeaturesGrid } from "@/components/landing/tools/ToolFeaturesGrid";
import { ToolHowStrip } from "@/components/landing/tools/ToolHowStrip";
import { ToolLandingCTA } from "@/components/landing/tools/ToolLandingCTA";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqSection } from "@/components/seo/FaqSection";
import { toolJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { toolFaq } from "@/lib/seo/faq";
import {
  TOOL_SLUGS,
  type ToolSlug,
} from "@/components/landing/tools/toolLandingData";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    TOOL_SLUGS.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!(TOOL_SLUGS as string[]).includes(slug)) return {};
  const { toolMetadata } = await import("@/lib/seo/metadata");
  return toolMetadata(locale, slug as ToolSlug);
}

export default async function ToolLandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!(TOOL_SLUGS as string[]).includes(slug)) {
    notFound();
  }
  setRequestLocale(locale);
  const tool = slug as ToolSlug;
  const faqs = toolFaq(locale, tool);
  const faqHeading = locale === "en" ? "Frequently asked questions" : "Câu hỏi thường gặp";

  return (
    <div data-testid={`tool-landing-${tool}`} className="w-full">
      <JsonLd data={toolJsonLd(locale, tool)} />
      <JsonLd data={faqJsonLd(faqs)} />
      <ToolLandingHero locale={locale} slug={tool} />
      <ToolFeaturesGrid locale={locale} slug={tool} />
      <ToolHowStrip locale={locale} slug={tool} />
      <FaqSection items={faqs} heading={faqHeading} testId={`tool-faq-${tool}`} />
      <ToolLandingCTA locale={locale} slug={tool} />
      <MarketingFooter />
    </div>
  );
}
