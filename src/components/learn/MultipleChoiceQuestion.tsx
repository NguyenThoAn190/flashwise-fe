"use client";

import React, { useEffect } from "react";
import { Volume2, Check, X } from "lucide-react";
import { speakText } from "@/components/flashcard/FlashcardViewer";

export interface MultipleChoiceQuestionProps {
  prompt: string;
  options: string[];
  disabled?: boolean;
  /** Đáp án user vừa chọn (text). Truyền khi đã có feedback để highlight inline. */
  selectedAnswer?: string | null;
  /** Đáp án đúng từ server. Truyền khi đã có feedback để highlight inline. */
  correctAnswer?: string | null;
  onSelectOption: (index: number, optionText: string) => void;
}

export function MultipleChoiceQuestion({
  prompt,
  options,
  disabled = false,
  selectedAnswer = null,
  correctAnswer = null,
  onSelectOption,
}: MultipleChoiceQuestionProps) {
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
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= options.length) {
        e.preventDefault();
        onSelectOption(num - 1, options[num - 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, options, onSelectOption]);

  return (
    <div
      data-testid="mcq-question-card"
      className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-6 sm:p-8 shadow-card space-y-8"
    >
      {/* Prompt Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
            Term
          </span>
          <button
            type="button"
            onClick={() => speakText(prompt)}
            aria-label="Listen to term"
            className="p-2 rounded-full text-quizlet-slate-secondary hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <h2
          data-testid="mcq-prompt"
          className="text-2xl sm:text-3xl font-bold text-quizlet-slate leading-snug"
        >
          {prompt}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-secondary">
          Choose matching definition
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {options.map((option, idx) => {
            const isRevealed = Boolean(selectedAnswer && correctAnswer);
            const isCorrectOption = isRevealed && option === correctAnswer;
            const isWrongSelected =
              isRevealed && option === selectedAnswer && selectedAnswer !== correctAnswer;
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                data-testid={`mcq-option-${idx}`}
                data-correct={isCorrectOption || undefined}
                data-wrong={isWrongSelected || undefined}
                onClick={() => onSelectOption(idx, option)}
                className={`group text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                  isCorrectOption
                    ? "border-dashed border-quizlet-green bg-quizlet-green-bg disabled:opacity-100"
                    : isWrongSelected
                      ? "border-quizlet-coral bg-quizlet-coral-bg/60 disabled:opacity-100"
                      : "border-quizlet-border bg-quizlet-surface hover:border-quizlet-indigo hover:bg-quizlet-indigo-light/40 disabled:opacity-60"
                } disabled:pointer-events-none`}
              >
                <span
                  className={`w-6 h-6 rounded-md border text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    isCorrectOption
                      ? "bg-quizlet-green text-white border-quizlet-green"
                      : isWrongSelected
                        ? "bg-quizlet-coral text-white border-quizlet-coral"
                        : "bg-quizlet-canvas border-quizlet-border text-quizlet-slate-secondary group-hover:border-quizlet-indigo group-hover:text-quizlet-indigo"
                  }`}
                >
                  {isCorrectOption ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : isWrongSelected ? (
                    <X className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="text-sm sm:text-base font-medium text-quizlet-slate leading-relaxed break-words">
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
