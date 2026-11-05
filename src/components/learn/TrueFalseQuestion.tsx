"use client";

import React, { useEffect } from "react";

export interface TrueFalseQuestionProps {
  prompt: string;
  proposedDefinition: string;
  disabled?: boolean;
  onAnswer: (choice: boolean) => void;
}

export function TrueFalseQuestion({
  prompt,
  proposedDefinition,
  disabled = false,
  onAnswer,
}: TrueFalseQuestionProps) {
  useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "1") {
        e.preventDefault();
        onAnswer(true);
      } else if (e.key === "2") {
        e.preventDefault();
        onAnswer(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, onAnswer]);

  return (
    <div
      data-testid="true-false-question-card"
      className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-6 sm:p-8 shadow-card space-y-8"
    >
      {/* Term & Proposed Definition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-quizlet-border-light">
        <div className="space-y-2 pr-4">
          <span className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
            Term
          </span>
          <h2
            data-testid="tf-prompt"
            className="text-xl sm:text-2xl font-bold text-quizlet-slate"
          >
            {prompt}
          </h2>
        </div>

        <div className="space-y-2 pt-4 md:pt-0 md:pl-6">
          <span className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
            Definition
          </span>
          <p
            data-testid="tf-proposed-definition"
            className="text-lg sm:text-xl font-medium text-quizlet-slate-secondary"
          >
            {proposedDefinition}
          </p>
        </div>
      </div>

      {/* True / False Buttons */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-secondary">
          Choose answer
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={disabled}
            data-testid="tf-option-true"
            onClick={() => onAnswer(true)}
            className="p-4 rounded-xl border-2 border-quizlet-border bg-quizlet-surface hover:border-quizlet-indigo hover:bg-quizlet-indigo-light/40 disabled:opacity-60 transition-all flex items-center gap-3 cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-quizlet-canvas border border-quizlet-border text-xs font-bold text-quizlet-slate-secondary flex items-center justify-center">
              1
            </span>
            <span className="text-base font-bold text-quizlet-slate">True</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            data-testid="tf-option-false"
            onClick={() => onAnswer(false)}
            className="p-4 rounded-xl border-2 border-quizlet-border bg-quizlet-surface hover:border-quizlet-indigo hover:bg-quizlet-indigo-light/40 disabled:opacity-60 transition-all flex items-center gap-3 cursor-pointer"
          >
            <span className="w-6 h-6 rounded-md bg-quizlet-canvas border border-quizlet-border text-xs font-bold text-quizlet-slate-secondary flex items-center justify-center">
              2
            </span>
            <span className="text-base font-bold text-quizlet-slate">
              False
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
