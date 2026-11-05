"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SubmitAnswerResult } from "@/lib/api/sessions";

export interface FeedbackBannerProps {
  result: SubmitAnswerResult;
  submittedAnswerText?: string;
  onContinue: () => void;
  /**
   * Khi true (MCQ / True-False / Recall đã highlight inline ngay trên
   * đáp án), chỉ hiện hint gọn. Written = false để hiện thêm dòng
   * đáp án đúng (vì input không tự hiện).
   */
  hideAnswerComparison?: boolean;
  children?: React.ReactNode;
}

export function FeedbackBanner({
  result,
  submittedAnswerText,
  onContinue,
  hideAnswerComparison = false,
  children,
}: FeedbackBannerProps) {
  const t = useTranslations("learn");
  const {
    is_correct,
    correct_answer,
    explanation,
    mastery_score_before,
    mastery_score_after,
  } = result;

  const delta = mastery_score_after - mastery_score_before;

  // Nhấn phím bất kỳ (ngoài input) để tiếp tục — đúng copy trên bar.
  useEffect(() => {
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
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Tab" || e.key === "Shift") return;
      e.preventDefault();
      onContinue();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onContinue]);

  const hintText = is_correct
    ? t("correctHint")
    : hideAnswerComparison
      ? t("incorrectHint")
      : t("typeCorrectHint");

  const showCorrectLine =
    !is_correct && !hideAnswerComparison && correct_answer;

  return (
    <div
      data-testid="feedback-banner"
      className="sticky bottom-0 z-20 -mx-4 border-t border-quizlet-border-light bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur sm:rounded-2xl sm:border sm:py-4 sm:shadow-card"
    >
      {/* Giữ để tương thích test + a11y */}
      <div data-testid="feedback-mastery-delta" className="sr-only">
        Mastery: {mastery_score_before}% → {mastery_score_after}% (
        {delta >= 0 ? `+${delta}%` : `${delta}%`})
      </div>
      <span data-testid="feedback-correct-answer" className="sr-only">
        {correct_answer}
      </span>
      {/* Giữ heading cho test cũ, ẩn visually */}
      <span data-testid="feedback-status-heading" className="sr-only">
        {is_correct ? t("correct") : t("incorrect")}
      </span>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
        {/* Written sai: hiện đáp án đúng gọn 1 dòng, không hộp đỏ */}
        {showCorrectLine && (
          <p className="truncate text-[13px] leading-snug sm:text-sm">
            <span className="font-semibold text-quizlet-slate-muted">
              {t("correctAnswer")}
            </span>
            <span className="font-extrabold text-quizlet-green">
              {correct_answer}
            </span>
            {submittedAnswerText &&
              submittedAnswerText !== correct_answer && (
                <span className="ml-2 hidden font-medium text-quizlet-slate-muted sm:inline">
                  ({t("youChose")}
                  <span className="line-through">{submittedAnswerText}</span>)
                </span>
              )}
          </p>
        )}
        {explanation && !hideAnswerComparison && (
          <p className="hidden truncate text-xs text-quizlet-slate-secondary sm:block">
            {explanation}
          </p>
        )}

        {children ? <div className="w-full">{children}</div> : null}

        {/* Thanh bar: hint trái + nút pill phải (kiểu ảnh mẫu) */}
        <div className="flex items-center justify-between gap-3">
          <p
            data-testid="feedback-hint"
            className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-quizlet-slate-secondary sm:text-sm"
          >
            {hintText}
          </p>

          {/* Desktop */}
          <Button
            type="button"
            variant="primary"
            data-testid="feedback-continue-btn"
            onClick={onContinue}
            className="hidden shrink-0 rounded-full px-6 py-2.5 text-sm font-bold sm:inline-flex"
          >
            {t("continue")}
          </Button>

          {/* Mobile: nút pill gọn, cao tối thiểu 44px dễ bấm */}
          <Button
            type="button"
            variant="primary"
            data-testid="feedback-continue-btn-mobile"
            onClick={onContinue}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-full px-6 py-2.5 text-sm font-bold sm:hidden"
          >
            {t("continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
