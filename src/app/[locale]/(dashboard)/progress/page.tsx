"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { apiGetProgress, ProgressOverview } from "@/lib/api/sessions";
import { ApiError } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";

function ProgressContent() {
  const t = useTranslations("progress");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const searchParams = useSearchParams();
  const targetSetId = searchParams?.get("set") || undefined;

  const [progress, setProgress] = useState<ProgressOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toLocalizedError = useCallback(
    (err: unknown, fallbackKey: "loadError"): string => {
      if (err instanceof ApiError) {
        try {
          // Prefer a localized gateway error code (e.g. NOT_FOUND) when present.
          const localized = (tErrors as unknown as (k: string) => string)(err.code);
          if (localized && localized !== err.code) return localized;
        } catch {
          // ignore and fall through to page-level fallback
        }
        // Raw gateway messages may leak the gateway default locale
        // (e.g. "Không tìm thấy" for 404s without language headers),
        // so never render them directly — use the page fallback instead.
        if (err.status === 404) return t(fallbackKey);
      }
      const raw = (err as { message?: unknown } | null)?.message;
      if (typeof raw === "string" && raw && !/không tìm thấy/i.test(raw)) {
        return raw;
      }
      return t(fallbackKey);
    },
    [t, tErrors]
  );

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetProgress();
      setProgress(data);
    } catch (err: unknown) {
      // Failure state must not render all-zero KPIs — keep progress null
      // so the error panel (with retry) shows instead of misleading zeros.
      setProgress(null);
      setError(toLocalizedError(err, "loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [toLocalizedError]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  if (isLoading) {
    return (
      <div
        data-testid="progress-loading"
        className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-pulse"
      >
        <div className="h-8 w-64 bg-quizlet-border-light rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-quizlet-surface rounded-2xl border border-quizlet-border-light"
            />
          ))}
        </div>
      </div>
    );
  }

  // Do not display all-zero KPIs on failure: surface the localized error
  // with a retry action instead of a misleading empty dashboard.
  if (error && !progress) {
    return (
      <div
        data-testid="progress-page"
        className="max-w-5xl mx-auto py-6 sm:py-8 px-4 space-y-8"
      >
        <div
          role="alert"
          data-testid="progress-error"
          className="p-4 rounded-xl bg-quizlet-coral-bg border border-quizlet-coral-border text-quizlet-coral text-sm font-bold"
        >
          {error}
        </div>
        <Button variant="secondary" onClick={loadProgress}>
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  const total = progress?.total_cards || 0;
  const mastered = progress?.mastered || 0;
  const reviewing = progress?.reviewing || 0;
  const learning = progress?.learning || 0;
  const notStudied = progress?.not_studied || 0;
  const dueCount = progress?.due_reviews_count || 0;
  const accuracy = progress?.accuracy_rate || 0;

  const pct = (count: number) =>
    total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      data-testid="progress-page"
      className="max-w-5xl mx-auto py-6 sm:py-8 px-4 space-y-8"
    >
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={targetSetId ? `/set/${targetSetId}` : "/"}
            className="inline-flex items-center gap-2 text-xs font-bold text-quizlet-slate-secondary hover:text-quizlet-indigo transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{targetSetId ? t("backSet") : t("backHome")}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-quizlet-slate flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-quizlet-indigo" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-sm text-quizlet-slate-secondary">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-quizlet-coral-bg border border-quizlet-coral-border text-quizlet-coral text-sm font-bold"
        >
          {error}
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-quizlet-slate-muted">
              {t("totalCards")}
            </span>
            <Sparkles className="w-4 h-4 text-quizlet-indigo" />
          </div>
          <p
            data-testid="progress-total-cards"
            className="text-3xl font-extrabold text-quizlet-slate"
          >
            {total}
          </p>
          <p className="text-xs text-quizlet-slate-secondary">
            {t("acrossSets")}
          </p>
        </div>

        <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-quizlet-green">
              {t("mastered")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-quizlet-green" />
          </div>
          <p
            data-testid="progress-mastered-count"
            className="text-3xl font-extrabold text-quizlet-green"
          >
            {mastered}
          </p>
          <p className="text-xs text-quizlet-slate-secondary">
            {t("ofTotal", { pct: pct(mastered) })}
          </p>
        </div>

        <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-quizlet-warning">
              {t("dueReview")}
            </span>
            <Clock className="w-4 h-4 text-quizlet-warning" />
          </div>
          <p
            data-testid="progress-due-count"
            className="text-3xl font-extrabold text-quizlet-slate"
          >
            {dueCount}
          </p>
          <p className="text-xs text-quizlet-slate-secondary">
            {t("scheduledSRS")}
          </p>
        </div>

        <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-quizlet-indigo">
              {t("masteryRate")}
            </span>
            <Flame className="w-4 h-4 text-quizlet-gold" />
          </div>
          <p
            data-testid="progress-accuracy-rate"
            className="text-3xl font-extrabold text-quizlet-indigo"
          >
            {accuracy}%
          </p>
          <p className="text-xs text-quizlet-slate-secondary">
            {t("retention")}
          </p>
        </div>
      </div>

      {/* Knowledge State Breakdown */}
      <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-quizlet-slate">
            {t("distribution")}
          </h2>
          <Badge status="MASTERED" size="sm">
            {t("srsEngine")}
          </Badge>
        </div>

        <div className="space-y-5">
          {/* Mastered */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-quizlet-green">{t("mastered")}</span>
              <span
                data-testid="state-mastered-val"
                className="text-quizlet-slate"
              >
                {t("cardsPct", { count: mastered, pct: pct(mastered) })}
              </span>
            </div>
            <div className="w-full h-3 bg-quizlet-canvas rounded-full overflow-hidden">
              <div
                className="h-full bg-quizlet-green rounded-full transition-all duration-500"
                style={{ width: `${pct(mastered)}%` }}
              />
            </div>
          </div>

          {/* Reviewing */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-quizlet-indigo">{t("reviewing")}</span>
              <span
                data-testid="state-reviewing-val"
                className="text-quizlet-slate"
              >
                {t("cardsPct", { count: reviewing, pct: pct(reviewing) })}
              </span>
            </div>
            <div className="w-full h-3 bg-quizlet-canvas rounded-full overflow-hidden">
              <div
                className="h-full bg-quizlet-indigo rounded-full transition-all duration-500"
                style={{ width: `${pct(reviewing)}%` }}
              />
            </div>
          </div>

          {/* Learning */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-quizlet-coral">{t("stillLearning")}</span>
              <span
                data-testid="state-learning-val"
                className="text-quizlet-slate"
              >
                {t("cardsPct", { count: learning, pct: pct(learning) })}
              </span>
            </div>
            <div className="w-full h-3 bg-quizlet-canvas rounded-full overflow-hidden">
              <div
                className="h-full bg-quizlet-coral rounded-full transition-all duration-500"
                style={{ width: `${pct(learning)}%` }}
              />
            </div>
          </div>

          {/* Not Studied */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-quizlet-slate-secondary">{t("notStudied")}</span>
              <span
                data-testid="state-not-studied-val"
                className="text-quizlet-slate"
              >
                {t("cardsPct", { count: notStudied, pct: pct(notStudied) })}
              </span>
            </div>
            <div className="w-full h-3 bg-quizlet-canvas rounded-full overflow-hidden">
              <div
                className="h-full bg-quizlet-slate-muted rounded-full transition-all duration-500"
                style={{ width: `${pct(notStudied)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto py-8 px-4 animate-pulse">
            <div className="h-8 w-64 bg-quizlet-border-light rounded-lg" />
          </div>
        }
      >
        <ProgressContent />
      </Suspense>
    </AuthGuard>
  );
}
