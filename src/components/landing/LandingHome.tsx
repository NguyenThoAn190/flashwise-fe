"use client";

import React from "react";
import { LandingHero } from "@/components/landing/LandingHero";
import { StudyModesGrid } from "@/components/landing/StudyModesGrid";
import { HowItWorksStrip } from "@/components/landing/HowItWorksStrip";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { MarketingFooter } from "@/components/landing/MarketingFooter";

export function LandingHome() {
  return (
    <div data-testid="landing-home" className="w-full">
      <LandingHero />
      <StudyModesGrid />
      <HowItWorksStrip />
      <LandingCTA />
      <MarketingFooter />
    </div>
  );
}
