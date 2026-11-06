"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Shuffle,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Minimize2,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";

export type FlashcardStudyDirection = "term_first" | "def_first";

export interface CardToolbarProps {
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  isShuffled: boolean;
  isAutoPlaying: boolean;
  isAutoRead: boolean;
  isFullscreen: boolean;
  direction: FlashcardStudyDirection;
  onPrev: () => void;
  onNext: () => void;
  onFlip: () => void;
  onToggleShuffle: () => void;
  onToggleAutoPlay: () => void;
  onToggleAutoRead: () => void;
  onToggleFullscreen: () => void;
  onToggleDirection: () => void;
}

export function CardToolbar({
  currentIndex,
  totalCards,
  isFlipped,
  isShuffled,
  isAutoPlaying,
  isAutoRead,
  isFullscreen,
  direction,
  onPrev,
  onNext,
  onFlip,
  onToggleShuffle,
  onToggleAutoPlay,
  onToggleAutoRead,
  onToggleFullscreen,
  onToggleDirection,
}: CardToolbarProps) {
  const t = useTranslations("flashcard");
  const safeTotal = Math.max(totalCards, 1);
  const progressPercent =
    totalCards > 0 ? Math.round(((currentIndex + 1) / safeTotal) * 100) : 0;

  return (
    <div className="w-full space-y-4" data-testid="card-toolbar">
      {/* Progress Track */}
      <div className="w-full h-1.5 bg-quizlet-border-light rounded-full overflow-hidden">
        <div
          data-testid="card-progress-bar"
          className="h-full bg-quizlet-indigo transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Autoplay & Shuffle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="toolbar-autoplay-btn"
            onClick={onToggleAutoPlay}
            aria-pressed={isAutoPlaying}
            aria-label={isAutoPlaying ? t("pauseAutoplay") : t("startAutoplay")}
            title={t("autoplay")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              isAutoPlaying
                ? "bg-quizlet-indigo-light border-quizlet-indigo text-quizlet-indigo"
                : "bg-quizlet-surface border-quizlet-border text-quizlet-slate-secondary hover:bg-quizlet-surface-hover hover:text-quizlet-slate"
            }`}
          >
            {isAutoPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isAutoPlaying ? t("playing") : t("play")}
            </span>
          </button>

          <button
            type="button"
            data-testid="toolbar-shuffle-btn"
            onClick={onToggleShuffle}
            aria-pressed={isShuffled}
            aria-label={isShuffled ? t("disableShuffle") : t("enableShuffle")}
            title={t("shuffleTitle")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              isShuffled
                ? "bg-quizlet-indigo-light border-quizlet-indigo text-quizlet-indigo"
                : "bg-quizlet-surface border-quizlet-border text-quizlet-slate-secondary hover:bg-quizlet-surface-hover hover:text-quizlet-slate"
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">{t("shuffle")}</span>
          </button>

          <button
            type="button"
            data-testid="toolbar-autoread-btn"
            onClick={onToggleAutoRead}
            aria-pressed={isAutoRead}
            aria-label={isAutoRead ? t("disableAutoRead") : t("enableAutoRead")}
            title={t("autoReadTitle")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              isAutoRead
                ? "bg-quizlet-indigo-light border-quizlet-indigo text-quizlet-indigo"
                : "bg-quizlet-surface border-quizlet-border text-quizlet-slate-secondary hover:bg-quizlet-surface-hover hover:text-quizlet-slate"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("autoRead")}</span>
          </button>
        </div>

        {/* Center: Prev / Counter / Flip / Next */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="prev-card-btn"
            onClick={onPrev}
            disabled={currentIndex <= 0 || totalCards === 0}
            aria-label={t("prevCard")}
            className="w-11 h-11 rounded-full border-2 border-quizlet-border bg-quizlet-surface flex items-center justify-center text-quizlet-slate hover:border-quizlet-indigo hover:text-quizlet-indigo disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span
            data-testid="card-counter"
            className="text-sm sm:text-base font-bold text-quizlet-slate min-w-[4.5rem] text-center tabular-nums"
          >
            {totalCards === 0 ? "0 / 0" : `${currentIndex + 1} / ${totalCards}`}
          </span>

          <button
            type="button"
            data-testid="next-card-btn"
            onClick={onNext}
            disabled={currentIndex >= totalCards - 1 || totalCards === 0}
            aria-label={t("nextCard")}
            className="w-11 h-11 rounded-full border-2 border-quizlet-border bg-quizlet-surface flex items-center justify-center text-quizlet-slate hover:border-quizlet-indigo hover:text-quizlet-indigo disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            data-testid="flip-btn"
            onClick={onFlip}
            disabled={totalCards === 0}
            aria-label={t("flipCard")}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-quizlet-indigo text-quizlet-surface hover:bg-quizlet-indigo-hover disabled:opacity-40 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? t("showTerm") : t("showDefinition")}</span>
          </button>
        </div>

        {/* Right: Direction & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="toggle-direction"
            onClick={onToggleDirection}
            aria-label={t("toggleDirection")}
            title={t("directionTitle")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border border-quizlet-border bg-quizlet-surface text-quizlet-slate-secondary hover:bg-quizlet-surface-hover hover:text-quizlet-slate transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>
              {direction === "term_first" ? t("termFirst") : t("defFirst")}
            </span>
          </button>

          <button
            type="button"
            data-testid="toolbar-fullscreen-btn"
            onClick={onToggleFullscreen}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
            title={t("fullscreenTitle")}
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              isFullscreen
                ? "bg-quizlet-indigo-light border-quizlet-indigo text-quizlet-indigo"
                : "bg-quizlet-surface border-quizlet-border text-quizlet-slate-secondary hover:bg-quizlet-surface-hover hover:text-quizlet-slate"
            }`}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
