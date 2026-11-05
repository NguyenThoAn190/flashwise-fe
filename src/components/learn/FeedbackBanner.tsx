"use client";

import React, { useEffect } from "react";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SubmitAnswerResult } from "@/lib/api/sessions";

export interface FeedbackBannerProps {
  result: SubmitAnswerResult;
  submittedAnswerText?: string;
  onContinue: () => void;
  children?: React.ReactNode;
}

export function FeedbackBanner({
  result,
  submittedAnswerText,
  onContinue,
  children,
}: FeedbackBannerProps) {
  const {
    is_correct,
    correct_answer,
    explanation,
    mastery_score_before,
    mastery_score_after,
  } = result;

  const delta = mastery_score_after - mastery_score_before;

  // Press Enter or Space to quickly continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onContinue]);

  return (
    <div
      data-testid="feedback-banner"
      className={`rounded-2xl border-2 p-5 sm:p-6 shadow-card space-y-4 transition-all ${
        is_correct
          ? "bg-quizlet-green-bg border-quizlet-green-border"
          : "bg-quizlet-coral-bg border-quizlet-coral-border"
      }`}
    >
      {/* Hidden for accessibility & test backward compatibility */}
      <div data-testid="feedback-mastery-delta" className="sr-only">
        Mastery: {mastery_score_before}% → {mastery_score_after}% (
        {delta >= 0 ? `+${delta}%` : `${delta}%`})
      </div>

      {/* Main Status Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {is_correct ? (
            <CheckCircle2 className="w-6 h-6 text-quizlet-green shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-quizlet-coral shrink-0" />
          )}
          <h3
            data-testid="feedback-status-heading"
            className={`text-lg font-extrabold ${
              is_correct ? "text-quizlet-green" : "text-quizlet-coral"
            }`}
          >
            {is_correct
              ? "Awesome! You got it right!"
              : "Not quite — keep studying this term!"}
          </h3>
        </div>

        {/* Quick Continue Button on desktop */}
        <Button
          type="button"
          size="sm"
          variant={is_correct ? "primary" : "secondary"}
          data-testid="feedback-continue-btn"
          onClick={onContinue}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="hidden sm:inline-flex"
        >
          Continue
        </Button>
      </div>

      {/* When Incorrect: Display Clean Answer Comparison */}
      {!is_correct && (
        <div className="bg-white rounded-xl p-4 border border-quizlet-border-light space-y-2.5">
          {submittedAnswerText && submittedAnswerText !== correct_answer && (
            <div className="text-sm">
              <span className="font-semibold text-quizlet-slate-muted">Bạn đã chọn: </span>
              <span className="text-quizlet-coral font-medium line-through">
                {submittedAnswerText}
              </span>
            </div>
          )}

          <div className="text-sm sm:text-base">
            <span className="font-semibold text-quizlet-slate-muted">Đáp án đúng: </span>
            <span
              data-testid="feedback-correct-answer"
              className="font-extrabold text-quizlet-green"
            >
              {correct_answer}
            </span>
          </div>

          {explanation && (
            <p className="text-xs text-quizlet-slate-secondary pt-1.5 border-t border-quizlet-border-light">
              {explanation}
            </p>
          )}
        </div>
      )}

      {/* Hidden slot for optional children if passed */}
      {children ? <div className="sr-only">{children}</div> : null}

      {/* Mobile Continue Button */}
      <div className="flex sm:hidden justify-end pt-1">
        <Button
          type="button"
          variant={is_correct ? "primary" : "secondary"}
          data-testid="feedback-continue-btn-mobile"
          onClick={onContinue}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
