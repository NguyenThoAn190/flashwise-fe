"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface WrittenQuestionProps {
  prompt: string;
  disabled?: boolean;
  onSubmitAnswer: (writtenText: string) => void;
}

export function WrittenQuestion({
  prompt,
  disabled = false,
  onSubmitAnswer,
}: WrittenQuestionProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText("");
    inputRef.current?.focus();
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !text.trim()) return;
    onSubmitAnswer(text);
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="written-question-card"
      className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-6 sm:p-8 shadow-card space-y-6"
    >
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
          Written Recall
        </span>
        <h2
          data-testid="written-prompt"
          className="text-2xl sm:text-3xl font-bold text-quizlet-slate"
        >
          {prompt}
        </h2>
      </div>

      <div className="space-y-4">
        <Input
          ref={inputRef}
          label="Type the definition"
          data-testid="written-answer-input"
          placeholder="Type your answer here..."
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            data-testid="written-skip-btn"
            onClick={() => onSubmitAnswer("")}
          >
            Don&apos;t know?
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={disabled || !text.trim()}
            data-testid="written-submit-btn"
            leftIcon={<Send className="w-4 h-4" />}
          >
            Answer
          </Button>
        </div>
      </div>
    </form>
  );
}
