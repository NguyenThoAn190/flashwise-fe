"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Clock, ArrowRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface DueReviewsBannerProps {
  dueCount: number;
  isLoading?: boolean;
  onStudyNow?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const STORAGE_KEY = "quizlet_due_dismissed";

export function DueReviewsBanner({
  dueCount,
  isLoading = false,
  onStudyNow,
  onDismiss,
  className,
}: DueReviewsBannerProps) {
  const t = useTranslations("dueReviews");
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  if (isLoading || dueCount <= 0 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
    onDismiss?.();
  };

  return (
    <div
      role="region"
      aria-label={t("dueLabel")}
      className={`relative w-full rounded-2xl bg-quizlet-warning-bg border border-quizlet-warning-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-200 shadow-xs ${
        className || ""
      }`}
      data-testid="due-reviews-banner"
    >
      {/* Left: Icon & Description */}
      <div className="flex items-start sm:items-center gap-3.5 pr-8 sm:pr-0">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
          <Clock className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-quizlet-slate">
              {t("title")}
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold">
              <Sparkles className="w-3 h-3 text-amber-700" />
              {t("dueToday")}
            </span>
          </div>
          <p className="text-sm text-quizlet-slate-secondary mt-0.5">
            {t.rich("message", {
              count: dueCount,
              b: (chunks) => (
                <span className="font-bold text-quizlet-slate">{chunks}</span>
              ),
            })}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
        {onStudyNow ? (
          <Button
            size="sm"
            variant="primary"
            onClick={onStudyNow}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            data-testid="due-banner-study-button"
          >
            {t("studyNow")}
          </Button>
        ) : (
          <Link href="/progress">
            <Button
              size="sm"
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              data-testid="due-banner-study-button"
            >
              {t("studyNow")}
            </Button>
          </Link>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("dismiss")}
          className="p-1.5 text-quizlet-slate-muted hover:text-quizlet-slate hover:bg-amber-100/60 rounded-lg transition-colors cursor-pointer"
          data-testid="due-banner-dismiss-button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
