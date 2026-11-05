"use client";

import React from "react";
import Link from "next/link";
import { Play, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ToolSlug } from "./toolLandingData";
import { TOOL_APP_HREF, getToolCopy } from "./toolLandingData";

const ACCENT: Record<ToolSlug, string> = {
  flashcards: "bg-quizlet-indigo-light text-quizlet-indigo",
  learn: "bg-quizlet-green-bg text-quizlet-green",
  srs: "bg-quizlet-warning-bg text-quizlet-warning",
  progress: "bg-quizlet-indigo-light text-quizlet-indigo",
  test: "bg-quizlet-canvas text-quizlet-slate-muted",
  groups: "bg-quizlet-canvas text-quizlet-slate-muted",
  live: "bg-quizlet-canvas text-quizlet-slate-muted",
};

export function ToolLandingHero({
  locale,
  slug,
}: {
  locale: string;
  slug: ToolSlug;
}) {
  const copy = getToolCopy(locale, slug);
  const appHref = TOOL_APP_HREF[slug];

  return (
    <section
      data-testid={`tool-hero-${slug}`}
      className="relative overflow-hidden bg-quizlet-indigo text-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-quizlet-navy/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Play className="h-3.5 w-3.5" />
            {copy.badge}
          </p>
          <h1 className="font-hurme text-[32px] sm:text-[44px] font-bold tracking-normal leading-[1.27]">
            {copy.heroTitle}
          </h1>
          <p className="font-hurme text-base sm:text-lg text-white/85 max-w-xl leading-relaxed">
            {copy.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {appHref ? (
              <Link href={appHref}>
                <Button
                  size="md"
                  variant="secondary"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  data-testid={`tool-hero-primary-${slug}`}
                >
                  {copy.primaryCta}
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button
                  size="md"
                  variant="secondary"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  data-testid={`tool-hero-primary-${slug}`}
                >
                  {copy.primaryCta}
                </Button>
              </Link>
            )}
            <Link href="/set/create">
              <Button
                size="md"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white border border-white/30"
                leftIcon={<Plus className="h-4 w-4" />}
                data-testid={`tool-hero-secondary-${slug}`}
              >
                {copy.secondaryCta}
              </Button>
            </Link>
          </div>

          <p className="text-xs text-white/70">{copy.previewNote}</p>
        </div>

        <div
          className="grid gap-4 sm:grid-cols-2 items-stretch"
          aria-label="Tool preview"
        >
          <div className="rounded-2xl bg-white p-5 text-quizlet-slate shadow-card flex flex-col h-full">
            <p className="text-xs font-bold uppercase text-quizlet-slate-muted">
              {copy.features[0]?.title ?? "Flashcard"}
            </p>
            <p className="mt-2 text-lg font-extrabold">
              {slug === "flashcards" ? "Mitochondria" : copy.features[0]?.title}
            </p>
            <p className="text-sm text-quizlet-slate-secondary">
              {copy.features[0]?.desc}
            </p>
            <div className="mt-auto pt-4">
              <div className="h-2 w-full rounded-full bg-quizlet-canvas">
                <div className="h-full w-2/3 rounded-full bg-quizlet-green" />
              </div>
              <p className="mt-2 text-xs font-bold text-quizlet-green">
                {copy.features[1]?.title}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-quizlet-navy p-5 text-white shadow-card flex flex-col h-full">
            <p className="text-xs font-bold uppercase text-white/60">
              {copy.features[2]?.title ?? "Due today"}
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              {slug === "srs" ? "24" : slug === "progress" ? "68%" : "4"}
            </p>
            <p className="text-sm text-white/75">{copy.features[2]?.desc}</p>
            <div className="mt-auto pt-4">
              <div className={`rounded-xl p-3 text-xs ${ACCENT[slug]}`}>
                {copy.features[3]?.title} • {copy.features[3]?.desc.slice(0, 32)}…
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
