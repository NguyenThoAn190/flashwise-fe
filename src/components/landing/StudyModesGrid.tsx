"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Layers,
  Brain,
  Clock,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const MODES = [
  {
    id: "flashcards",
    icon: Layers,
    accent: "bg-quizlet-indigo-light text-quizlet-indigo",
    href: "/signup",
  },
  {
    id: "learn",
    icon: Brain,
    accent: "bg-quizlet-green-bg text-quizlet-green",
    href: "/signup",
  },
  {
    id: "spacedRepetition",
    icon: Clock,
    accent: "bg-quizlet-warning-bg text-quizlet-warning",
    href: "/signup",
  },
  {
    id: "progress",
    icon: BarChart3,
    accent: "bg-quizlet-indigo-light text-quizlet-indigo",
    href: "/signup",
  },
] as const;

export function StudyModesGrid() {
  const t = useTranslations("landing");

  return (
    <section
      data-testid="landing-modes"
      className="w-full bg-white border-y border-quizlet-border-light"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-quizlet-indigo">
            {t("modesEyebrow")}
          </p>
          <h2 className="font-hurme text-[24px] sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight">
            {t("modesTitle")}
          </h2>
          <p className="text-sm sm:text-base text-quizlet-slate-secondary">
            {t("modesSubtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className="group rounded-2xl border border-quizlet-border-light bg-quizlet-surface p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex flex-col gap-4"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${mode.accent}`}
              >
                <mode.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-hurme text-base font-bold text-quizlet-slate">
                  {t(`modes.${mode.id}.title`)}
                </h3>
                <p className="text-sm text-quizlet-slate-secondary leading-relaxed">
                  {t(`modes.${mode.id}.desc`)}
                </p>
              </div>
              <Link
                href={mode.href}
                className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-quizlet-indigo hover:gap-2 transition-all"
              >
                {t(`modes.${mode.id}.cta`)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
