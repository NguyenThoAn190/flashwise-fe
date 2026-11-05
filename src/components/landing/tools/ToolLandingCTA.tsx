"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Flame, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
            {appHref ? (
              <Link href={appHref}>
                <Button
                  size="md"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  data-testid={`tool-cta-primary-${slug}`}
                >
                  {copy.primaryCta}
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button
                  size="md"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  data-testid={`tool-cta-primary-${slug}`}
                >
                  {copy.primaryCta}
                </Button>
              </Link>
            )}
            <Link href="/set/create">
              <Button size="md" variant="secondary" data-testid={`tool-cta-secondary-${slug}`}>
                {copy.secondaryCta}
              </Button>
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
