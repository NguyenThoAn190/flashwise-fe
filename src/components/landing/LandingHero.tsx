"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Plus, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LandingHero() {
  const t = useTranslations("landing");
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/signup?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/signup");
    }
  };

  return (
    <section
      data-testid="landing-hero"
      className="relative overflow-hidden bg-quizlet-indigo text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-quizlet-navy/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Play className="h-3.5 w-3.5" />
            {t("badge")}
          </p>
          <h1 className="font-hurme text-[32px] sm:text-[44px] font-bold tracking-normal leading-[1.27]">
            {t("heroTitle")}
          </h1>
          <p className="font-hurme text-base sm:text-lg text-white/85 max-w-xl leading-relaxed">
            {t("heroSubtitle")}
          </p>

          <form
            role="search"
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-quizlet-slate-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAria")}
                className="w-full rounded-xl border border-white/20 bg-white py-3 pl-10 pr-4 text-sm text-quizlet-slate placeholder:text-quizlet-slate-muted focus:border-white focus:outline-none focus:ring-4 focus:ring-white/25"
                data-testid="landing-search-input"
              />
            </div>
            <Button
              type="submit"
              size="md"
              variant="secondary"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              data-testid="landing-search-submit"
            >
              {t("searchSubmit")}
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/set/create">
              <Button
                size="md"
                variant="secondary"
                leftIcon={<Plus className="h-4 w-4" />}
                data-testid="landing-create-btn"
              >
                {t("createSet")}
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="md"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white border border-white/30"
                data-testid="landing-explore-btn"
              >
                {t("exploreDashboard")}
              </Button>
            </Link>
          </div>

          <p className="text-xs text-white/70">{t("freeNote")}</p>
        </div>

        <div
          className="grid gap-4 sm:grid-cols-2 items-stretch"
          aria-label="Study preview"
        >
          <div className="rounded-2xl bg-white p-5 text-quizlet-slate shadow-card flex flex-col h-full">
            <p className="text-xs font-bold uppercase text-quizlet-slate-muted">
              Flashcard
            </p>
            <p className="mt-2 text-lg font-extrabold">Mitochondria</p>
            <p className="text-sm text-quizlet-slate-secondary">
              The powerhouse of the cell
            </p>
            <div className="mt-auto pt-4">
              <div className="h-2 w-full rounded-full bg-quizlet-canvas">
                <div className="h-full w-2/3 rounded-full bg-quizlet-green" />
              </div>
              <p className="mt-2 text-xs font-bold text-quizlet-green">
                Mastered 68%
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-quizlet-navy p-5 text-white shadow-card flex flex-col h-full">
            <p className="text-xs font-bold uppercase text-white/60">
              Due today
            </p>
            <p className="mt-2 text-3xl font-extrabold">24</p>
            <p className="text-sm text-white/75">
              cards ready for spaced repetition
            </p>
            <div className="mt-auto pt-4">
              <div className="rounded-xl bg-white/10 p-3 text-xs">
                Learn • Flashcards • Test • SRS
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
