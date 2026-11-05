"use client";

import React, { useState, useEffect } from "react";
import { Eye, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface FlashcardRecallQuestionProps {
  prompt: string;
  expectedAnswer: string;
  disabled?: boolean;
  onSelfEvaluate: (remembered: boolean) => void;
}

export function FlashcardRecallQuestion({
  prompt,
  expectedAnswer,
  disabled = false,
  onSelfEvaluate,
}: FlashcardRecallQuestionProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [prompt, expectedAnswer]);

  return (
    <div
      data-testid="recall-question-card"
      className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-6 sm:p-8 shadow-card space-y-6"
    >
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
          Flashcard Recall
        </span>
        <h2
          data-testid="recall-prompt"
          className="text-2xl sm:text-3xl font-bold text-quizlet-slate"
        >
          {prompt}
        </h2>
      </div>

      {!revealed ? (
        <div className="pt-4">
          <Button
            type="button"
            variant="secondary"
            data-testid="recall-show-answer-btn"
            onClick={() => setRevealed(true)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Show Answer
          </Button>
        </div>
      ) : (
        <div className="space-y-6 pt-4 border-t border-quizlet-border-light">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-quizlet-indigo">
              Expected Definition
            </span>
            <p
              data-testid="recall-answer-text"
              className="text-lg sm:text-xl font-semibold text-quizlet-slate"
            >
              {expectedAnswer}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="danger"
              disabled={disabled}
              data-testid="recall-study-again-btn"
              onClick={() => onSelfEvaluate(false)}
              leftIcon={<X className="w-4 h-4" />}
            >
              Study again
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={disabled}
              data-testid="recall-got-it-btn"
              onClick={() => onSelfEvaluate(true)}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
