"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Flame, ShieldCheck, Zap } from "lucide-react";
import type { ToolSlug } from "./toolLandingData";
import { TOOL_APP_HREF, getToolCopy, isToolAvailable } from "./toolLandingData";

export function ToolLandingCTA({ locale, slug }: { locale: string; slug: ToolSlug }) {
  const copy = getToolCopy(locale, slug);
  const appHref = TOOL_APP_HREF[slug];
  const available = isToolAvailable(slug);

  return (
    <section
      data-testid={`tool-cta-${slug}`}
      className="w-full bg-white border-t border-quizlet-border-light"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <h2 className="font-hurme text-[24px] sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight">
            {available ? copy.heroTitle : copy.howTitle}
          </h2>
          <p className="text-sm sm:text-base text-quizlet-slate-secondary max-w-xl">
            {available ? copy.heroSubtitle : copy.howSubtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={appHref ?? "/signup"}
              data-testid={`tool-cta-primary-${slug}`}
              className="inline-flex items-center justify-center select-none font-semibold transition-all duration-200 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-4 py-2.5 text-sm rounded-xl gap-2 bg-quizlet-indigo text-white hover:bg-quizlet-indigo-hover active:bg-quizlet-indigo-hover shadow-sm hover:shadow border border-transparent focus-visible:ring-quizlet-indigo"
            >
              {copy.primaryCta}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/set/create"
              data-testid={`tool-cta-secondary-${slug}`}
              className="inline-flex items-center justify-center select-none font-semibold transition-all duration-200 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-4 py-2.5 text-sm rounded-xl gap-2 bg-white text-quizlet-slate border-2 border-quizlet-border hover:bg-quizlet-canvas hover:border-quizlet-border-hover active:bg-quizlet-border-light focus-visible:ring-quizlet-border-hover"
            >
              {copy.secondaryCta}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {copy.features.slice(0, 3).map((f, i) => {
            const icons = [Flame, Zap, ShieldCheck];
            const Icon = icons[i % icons.length];
            const colors = ["text-quizlet-warning", "text-quizlet-indigo", "text-quizlet-green"];
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-quizlet-border-light bg-quizlet-canvas p-5"
              >
                <Icon className={`w-5 h-5 ${colors[i % colors.length]}`} />
                <p className="mt-2 text-base font-extrabold text-quizlet-slate line-clamp-2">
                  {f.title}
                </p>
                <p className="mt-1 text-xs text-quizlet-slate-secondary line-clamp-3">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
