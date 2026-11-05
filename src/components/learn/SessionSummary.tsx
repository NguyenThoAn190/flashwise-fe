"use client";

import React from "react";
import { Trophy, RotateCcw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SessionSummaryData } from "@/lib/api/sessions";

export interface SessionSummaryProps {
  summary: SessionSummaryData;
  onRestart: () => void;
  onBackToSet: () => void;
}

export function SessionSummary({
  summary,
  onRestart,
  onBackToSet,
}: SessionSummaryProps) {
  const accuracy = Math.min(
    100,
    Math.max(0, Math.round(summary.accuracy_percentage))
  );
  const strokeDashoffset = 283 - (283 * accuracy) / 100;

  return (
    <div
      data-testid="session-summary"
      className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-8 sm:p-10 shadow-card text-center space-y-8 max-w-2xl mx-auto"
    >
      {/* Trophy Badge */}
      <div className="w-16 h-16 rounded-2xl bg-quizlet-indigo-light text-quizlet-indigo flex items-center justify-center mx-auto">
        <Trophy className="w-8 h-8 text-quizlet-gold" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-quizlet-slate">
          Way to go! You completed this Learn session!
        </h2>
        <p className="text-sm text-quizlet-slate-secondary">
          Your spaced repetition intervals and mastery scores have been updated.
        </p>
      </div>

      {/* Donut Chart & Metrics */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="var(--quizlet-border-light, #edeff4)"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="var(--quizlet-green, #23b26d)"
              strokeWidth="10"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              data-testid="summary-accuracy"
              className="text-2xl font-extrabold text-quizlet-slate"
            >
              {accuracy}%
            </span>
            <span className="text-[11px] font-bold uppercase text-quizlet-slate-muted">
              Accuracy
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-xl bg-quizlet-canvas border border-quizlet-border-light">
            <span className="text-xs font-bold uppercase text-quizlet-slate-muted">
              Total Reviewed
            </span>
            <p
              data-testid="summary-total-reviewed"
              className="text-2xl font-extrabold text-quizlet-slate mt-1"
            >
              {summary.total_reviewed}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-quizlet-green-bg border border-quizlet-green-border">
            <span className="text-xs font-bold uppercase text-quizlet-green flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mastered</span>
            </span>
            <p
              data-testid="summary-mastered-count"
              className="text-2xl font-extrabold text-quizlet-green mt-1"
            >
              {summary.mastered_count}
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Button
          type="button"
          variant="secondary"
          data-testid="summary-back-btn"
          onClick={onBackToSet}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Study Set
        </Button>

        <Button
          type="button"
          variant="primary"
          data-testid="summary-restart-btn"
          onClick={onRestart}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Practice Another Round
        </Button>
      </div>
    </div>
  );
}
