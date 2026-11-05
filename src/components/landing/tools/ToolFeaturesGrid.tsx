"use client";

import React from "react";
import Link from "next/link";
import { Layers, Brain, Clock, BarChart3, ClipboardCheck, Users, Radio, ArrowRight } from "lucide-react";
import type { ToolSlug } from "./toolLandingData";
import { TOOL_APP_HREF, getToolCopy } from "./toolLandingData";

const ICONS: Record<ToolSlug, React.ComponentType<{ className?: string }>> = {
  flashcards: Layers,
  learn: Brain,
  srs: Clock,
  progress: BarChart3,
  test: ClipboardCheck,
  groups: Users,
  live: Radio,
};

const ACCENT: Record<ToolSlug, string> = {
  flashcards: "bg-quizlet-indigo-light text-quizlet-indigo",
  learn: "bg-quizlet-green-bg text-quizlet-green",
  srs: "bg-quizlet-warning-bg text-quizlet-warning",
  progress: "bg-quizlet-indigo-light text-quizlet-indigo",
  test: "bg-quizlet-canvas text-quizlet-slate-muted",
  groups: "bg-quizlet-canvas text-quizlet-slate-muted",
  live: "bg-quizlet-canvas text-quizlet-slate-muted",
};

export function ToolFeaturesGrid({ locale, slug }: { locale: string; slug: ToolSlug }) {
  const copy = getToolCopy(locale, slug);
  const appHref = TOOL_APP_HREF[slug];

  return (
    <section
      data-testid={`tool-features-${slug}`}
      className="w-full bg-white border-y border-quizlet-border-light"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-quizlet-indigo">
            {copy.featuresEyebrow}
          </p>
          <h2 className="font-hurme text-[24px] sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight">
            {copy.featuresTitle}
          </h2>
          <p className="text-sm sm:text-base text-quizlet-slate-secondary">
            {copy.featuresSubtitle}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {copy.features.map((f, i) => {
            const Icon = ICONS[slug];
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-quizlet-border-light bg-quizlet-surface p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex flex-col gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ACCENT[slug]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-hurme text-base font-bold text-quizlet-slate">
                    {f.title}
                  </h3>
                  <p className="text-sm text-quizlet-slate-secondary leading-relaxed">
                    {f.desc}
                  </p>
                </div>
                {i === 0 && appHref ? (
                  <Link
                    href={appHref}
                    className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-quizlet-indigo hover:gap-2 transition-all"
                  >
                    {copy.primaryCta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
