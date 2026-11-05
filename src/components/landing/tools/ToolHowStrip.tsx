"use client";

import React from "react";
import { Search, PlusCircle, GraduationCap } from "lucide-react";
import type { ToolSlug } from "./toolLandingData";
import { getToolCopy } from "./toolLandingData";

const STEP_ICONS = [Search, PlusCircle, GraduationCap] as const;

export function ToolHowStrip({ locale, slug }: { locale: string; slug: ToolSlug }) {
  const copy = getToolCopy(locale, slug);

  return (
    <section
      data-testid={`tool-how-${slug}`}
      className="w-full bg-quizlet-canvas"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-quizlet-indigo">
            {copy.howEyebrow}
          </p>
          <h2 className="font-hurme text-[24px] sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight">
            {copy.howTitle}
          </h2>
          <p className="text-sm sm:text-base text-quizlet-slate-secondary">
            {copy.howSubtitle}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {copy.steps.map((s, idx) => {
            const Icon = STEP_ICONS[idx % STEP_ICONS.length];
            return (
              <div
                key={s.title}
                className="relative rounded-2xl border border-quizlet-border-light bg-quizlet-surface p-6 shadow-card overflow-hidden"
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-4 text-7xl font-extrabold text-quizlet-canvas select-none"
                >
                  {idx + 1}
                </span>
                <div className="relative space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-quizlet-indigo text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold uppercase text-quizlet-slate-muted">
                    Bước {idx + 1}
                  </p>
                  <h3 className="font-hurme text-lg font-bold text-quizlet-slate">
                    {s.title}
                  </h3>
                  <p className="text-sm text-quizlet-slate-secondary leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
