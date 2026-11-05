"use client";

import React, { useEffect } from "react";

export interface TrueFalseQuestionProps {
  prompt: string;
  proposedDefinition: string;
  disabled?: boolean;
  /** Lựa chọn user vừa bấm. Truyền khi đã có feedback để highlight inline. */
  selectedChoice?: boolean | null;
  /** Đáp án đúng. Truyền khi đã có feedback để highlight inline. */
  correctChoice?: boolean | null;
  onAnswer: (choice: boolean) => void;
}

export function TrueFalseQuestion({
  prompt,
  proposedDefinition,
  disabled = false,
  selectedChoice = null,
  correctChoice = null,
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
          {(
            [
              { value: true, testId: "tf-option-true", label: "True", num: "1" },
              { value: false, testId: "tf-option-false", label: "False", num: "2" },
            ] as const
          ).map((opt) => {
            const isRevealed = selectedChoice != null && correctChoice != null;
            const isCorrectOption = isRevealed && opt.value === correctChoice;
            const isWrongSelected =
              isRevealed && opt.value === selectedChoice && selectedChoice !== correctChoice;
            return (
              <button
                key={opt.testId}
                type="button"
                disabled={disabled}
                data-testid={opt.testId}
                data-correct={isCorrectOption || undefined}
                data-wrong={isWrongSelected || undefined}
                onClick={() => onAnswer(opt.value)}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                  isCorrectOption
                    ? "border-dashed border-quizlet-green bg-quizlet-green-bg disabled:opacity-100"
                    : isWrongSelected
                      ? "border-quizlet-coral bg-quizlet-coral-bg/60 disabled:opacity-100"
                      : "border-quizlet-border bg-quizlet-surface hover:border-quizlet-indigo hover:bg-quizlet-indigo-light/40 disabled:opacity-60"
                } disabled:pointer-events-none`}
              >
                <span
                  className={`w-6 h-6 rounded-md border text-xs font-bold flex items-center justify-center ${
                    isCorrectOption
                      ? "bg-quizlet-green text-white border-quizlet-green"
                      : isWrongSelected
                        ? "bg-quizlet-coral text-white border-quizlet-coral"
                        : "bg-quizlet-canvas border-quizlet-border text-quizlet-slate-secondary"
                  }`}
                >
                  {opt.num}
                </span>
                <span className="text-base font-bold text-quizlet-slate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
