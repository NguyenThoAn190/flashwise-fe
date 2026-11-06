"use client";

import React from "react";
import { useLocale } from "next-intl";
import { LandingHero } from "@/components/landing/LandingHero";
import { StudyModesGrid } from "@/components/landing/StudyModesGrid";
import { HowItWorksStrip } from "@/components/landing/HowItWorksStrip";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { FaqSection } from "@/components/seo/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { homeFaq } from "@/lib/seo/faq";
import {
  organizationJsonLd,
  webSiteJsonLd,
  softwareAppJsonLd,
  faqJsonLd,
} from "@/lib/seo/jsonld";

export function LandingHome() {
  const locale = useLocale();
  const faqs = homeFaq(locale);
  const heading = locale === "en" ? "Frequently asked questions" : "Câu hỏi thường gặp";
  return (
    <div data-testid="landing-home" className="w-full">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webSiteJsonLd(locale)} />
      <JsonLd data={softwareAppJsonLd(locale)} />
      <JsonLd data={faqJsonLd(faqs)} />
      <LandingHero />
      <StudyModesGrid />
      <HowItWorksStrip />
      <FaqSection items={faqs} heading={heading} testId="landing-faq" />
      <LandingCTA />
      <MarketingFooter />
    </div>
  );
}
