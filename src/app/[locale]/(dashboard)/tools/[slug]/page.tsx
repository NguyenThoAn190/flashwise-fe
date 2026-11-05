import React from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ToolLandingHero } from "@/components/landing/tools/ToolLandingHero";
import { ToolFeaturesGrid } from "@/components/landing/tools/ToolFeaturesGrid";
import { ToolHowStrip } from "@/components/landing/tools/ToolHowStrip";
import { ToolLandingCTA } from "@/components/landing/tools/ToolLandingCTA";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import {
  TOOL_SLUGS,
  getToolMeta,
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
  const meta = getToolMeta(locale, slug as ToolSlug);
  return {
    title: `${meta.title} | Flashwise`,
    description: meta.description,
  };
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

  return (
    <div data-testid={`tool-landing-${tool}`} className="w-full">
      <ToolLandingHero locale={locale} slug={tool} />
      <ToolFeaturesGrid locale={locale} slug={tool} />
      <ToolHowStrip locale={locale} slug={tool} />
      <ToolLandingCTA locale={locale} slug={tool} />
      <MarketingFooter />
    </div>
  );
}
