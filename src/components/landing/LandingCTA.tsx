"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Flame, ShieldCheck, Zap } from "lucide-react";

export function LandingCTA() {
  const t = useTranslations("landing");

  return (
    <section
      data-testid="landing-cta"
      className="w-full bg-white border-t border-quizlet-border-light"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <h2 className="font-hurme text-[24px] sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight">
            {t("ctaTitle")}
          </h2>
          <p className="text-sm sm:text-base text-quizlet-slate-secondary max-w-xl">
            {t("ctaSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              data-testid="landing-cta-signup"
              className="inline-flex items-center justify-center select-none font-semibold transition-all duration-200 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-4 py-2.5 text-sm rounded-xl gap-2 bg-quizlet-indigo text-white hover:bg-quizlet-indigo-hover active:bg-quizlet-indigo-hover shadow-sm hover:shadow border border-transparent focus-visible:ring-quizlet-indigo"
            >
              {t("signupFree")}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              data-testid="landing-cta-login"
              className="inline-flex items-center justify-center select-none font-semibold transition-all duration-200 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] px-4 py-2.5 text-sm rounded-xl gap-2 bg-white text-quizlet-slate border-2 border-quizlet-border hover:bg-quizlet-canvas hover:border-quizlet-border-hover active:bg-quizlet-border-light focus-visible:ring-quizlet-border-hover"
            >
              {t("login")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-quizlet-border-light bg-quizlet-canvas p-5">
            <Flame className="w-5 h-5 text-quizlet-warning" />
            <p className="mt-2 text-2xl font-extrabold text-quizlet-slate">
              {t("ctaFeatures.streaks.title")}
            </p>
            <p className="text-xs text-quizlet-slate-secondary">
              {t("ctaFeatures.streaks.desc")}
            </p>
          </div>
          <div className="rounded-2xl border border-quizlet-border-light bg-quizlet-canvas p-5">
            <Zap className="w-5 h-5 text-quizlet-indigo" />
            <p className="mt-2 text-2xl font-extrabold text-quizlet-slate">
              {t("ctaFeatures.srs.title")}
            </p>
            <p className="text-xs text-quizlet-slate-secondary">
              {t("ctaFeatures.srs.desc")}
            </p>
          </div>
          <div className="rounded-2xl border border-quizlet-border-light bg-quizlet-canvas p-5">
            <ShieldCheck className="w-5 h-5 text-quizlet-green" />
            <p className="mt-2 text-2xl font-extrabold text-quizlet-slate">
              {t("ctaFeatures.private.title")}
            </p>
            <p className="text-xs text-quizlet-slate-secondary">
              {t("ctaFeatures.private.desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
