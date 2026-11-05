"use client";

import React, { useState } from "react";
import { Clock, Check } from "lucide-react";
import { SRSRating, SRSRatingResult } from "@/lib/api/sessions";

export interface SRSRatingBarProps {
  cardId: string;
  onRate: (rating: SRSRating) => Promise<SRSRatingResult | void>;
}

const RATING_OPTIONS: Array<{
  rating: SRSRating;
  label: string;
  interval: string;
  styleClass: string;
}> = [
  {
    rating: "repeat",
    label: "Repeat",
    interval: "3m",
    styleClass:
      "border-quizlet-coral-border bg-quizlet-surface hover:bg-quizlet-coral-bg text-quizlet-coral",
  },
  {
    rating: "hard",
    label: "Hard",
    interval: "10m",
    styleClass:
      "border-quizlet-warning-border bg-quizlet-surface hover:bg-quizlet-warning-bg text-quizlet-warning",
  },
  {
    rating: "okay",
    label: "Okay",
    interval: "1d",
    styleClass:
      "border-quizlet-indigo-border bg-quizlet-surface hover:bg-quizlet-indigo-light text-quizlet-indigo",
  },
  {
    rating: "easy",
    label: "Easy",
    interval: "4d",
    styleClass:
      "border-quizlet-green-border bg-quizlet-surface hover:bg-quizlet-green-bg text-quizlet-green",
  },
];

export function SRSRatingBar({ onRate }: SRSRatingBarProps) {
  const [selectedRating, setSelectedRating] = useState<SRSRating | null>(null);
  const [scheduledInterval, setScheduledInterval] = useState<string | null>(
    null
  );
  const [isRating, setIsRating] = useState(false);

  const handleSelect = async (rating: SRSRating) => {
    if (isRating) return;
    setIsRating(true);
    setSelectedRating(rating);
    try {
      const res = await onRate(rating);
      if (res && res.next_review_interval) {
        setScheduledInterval(res.next_review_interval);
      } else {
        const match = RATING_OPTIONS.find((o) => o.rating === rating);
        setScheduledInterval(match?.interval || "scheduled");
      }
    } finally {
      setIsRating(false);
    }
  };

  return (
    <div
      data-testid="srs-rating-bar"
      className="bg-quizlet-surface rounded-xl p-4 border border-quizlet-border-light space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-secondary flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-quizlet-indigo" />
          <span>Spaced Repetition: Rate your recall</span>
        </span>

        {scheduledInterval && (
          <span
            data-testid="srs-rated-feedback"
            className="inline-flex items-center gap-1 text-xs font-bold text-quizlet-green"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Next review in {scheduledInterval}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {RATING_OPTIONS.map((opt) => {
          const isSelected = selectedRating === opt.rating;
          return (
            <button
              key={opt.rating}
              type="button"
              disabled={isRating}
              data-testid={`srs-rate-${opt.rating}`}
              onClick={() => handleSelect(opt.rating)}
              className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                opt.styleClass
              } ${isSelected ? "ring-2 ring-quizlet-indigo scale-[1.02]" : ""}`}
            >
              <span className="text-sm font-extrabold">{opt.label}</span>
              <span className="text-[11px] opacity-80">{opt.interval}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
