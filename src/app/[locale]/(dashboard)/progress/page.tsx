"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  RotateCcw,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  apiGetProgress,
  apiResetProgress,
  ProgressOverview,
} from "@/lib/api/sessions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";

function ProgressContent() {
  const searchParams = useSearchParams();
  const targetSetId = searchParams?.get("set") || undefined;

  const [progress, setProgress] = useState<ProgressOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGetProgress();
      setProgress(data);
    } catch (err: any) {
      setError(err?.message || "Could not load progress overview.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await apiResetProgress(targetSetId);
      setIsResetModalOpen(false);
      await loadProgress();
    } catch (err: any) {
      setError(err?.message || "Failed to reset progress.");
    } finally {
      setIsResetting(false);
    }
  };

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
            <span>{targetSetId ? "Back to Study Set" : "Back to Home"}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-quizlet-slate flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-quizlet-indigo" />
            <span>Mastery & Spaced Repetition Progress</span>
          </h1>
          <p className="text-sm text-quizlet-slate-secondary">
            Track your knowledge states across all flashcards and scheduled SRS reviews.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          data-testid="reset-progress-btn"
          onClick={() => setIsResetModalOpen(true)}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Reset Progress
        </Button>
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
              Total Cards
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
            Across active study sets
          </p>
        </div>

        <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-quizlet-green">
              Mastered
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
            {pct(mastered)}% of total flashcards
          </p>
        </div>

        <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-quizlet-warning">
              Due for Review
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
            Scheduled by SRS algorithm
          </p>
        </div>

        <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-quizlet-indigo">
              Mastery Rate
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
            Overall retention score
          </p>
        </div>
      </div>

      {/* Knowledge State Breakdown */}
      <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-quizlet-slate">
            Knowledge State Distribution
          </h2>
          <Badge status="MASTERED" size="sm">
            Flashwise 5-Layer SRS Engine
          </Badge>
        </div>

        <div className="space-y-5">
          {/* Mastered */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-quizlet-green">Mastered</span>
              <span
                data-testid="state-mastered-val"
                className="text-quizlet-slate"
              >
                {mastered} cards ({pct(mastered)}%)
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
              <span className="text-quizlet-indigo">Reviewing / Familiar</span>
              <span
                data-testid="state-reviewing-val"
                className="text-quizlet-slate"
              >
                {reviewing} cards ({pct(reviewing)}%)
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
              <span className="text-quizlet-coral">Still Learning</span>
              <span
                data-testid="state-learning-val"
                className="text-quizlet-slate"
              >
                {learning} cards ({pct(learning)}%)
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
              <span className="text-quizlet-slate-secondary">Not Studied</span>
              <span
                data-testid="state-not-studied-val"
                className="text-quizlet-slate"
              >
                {notStudied} cards ({pct(notStudied)}%)
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

      {/* Reset Progress Confirmation Dialog */}
      <Dialog
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset learning progress?"
        description="This will reset all flashcards back to 'Not studied' and clear scheduled Spaced Repetition intervals."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              data-testid="confirm-reset-progress-btn"
              isLoading={isResetting}
              onClick={handleConfirmReset}
            >
              Yes, Reset Progress
            </Button>
          </>
        }
      >
        <p className="text-sm text-quizlet-slate-secondary">
          Your flashcards and study sets will not be deleted — only your mastery states will be reset.
        </p>
      </Dialog>
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
