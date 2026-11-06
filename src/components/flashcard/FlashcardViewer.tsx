"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Volume2, Lightbulb, Star, Keyboard } from "lucide-react";
import { Flashcard } from "@/types/studySet";
import { CardToolbar, FlashcardStudyDirection } from "./CardToolbar";

export interface FlashcardViewerProps {
  cards: Flashcard[];
  initialDirection?: FlashcardStudyDirection;
  starredCardIds?: Set<string>;
  onToggleStarCard?: (cardId: string) => void;
  className?: string;
}

export function detectSpeakLang(text: string): string {
  // Tiếng Việt có dấu -> vi-VN, còn lại mặc định en-US
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
    return "vi-VN";
  }
  return "en-US";
}

export function speakText(text: string, lang?: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const clean = text?.trim();
  if (!clean) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang || detectSpeakLang(clean);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully ignore speech synthesis errors in headless environments
  }
}

export function stopSpeaking(): void {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable ||
    target.getAttribute("contenteditable") === "true"
  ) {
    return true;
  }
  return false;
}

export function FlashcardViewer({
  cards,
  initialDirection = "term_first",
  starredCardIds,
  onToggleStarCard,
  className = "",
}: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] =
    useState<FlashcardStudyDirection>(initialDirection);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isAutoRead, setIsAutoRead] = useState(() => {
    try {
      return localStorage.getItem("flashwise_auto_read") === "1";
    } catch {
      return false;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [localStarred, setLocalStarred] = useState<Set<string>>(new Set());

  // Reset or clamp index when cards array changes
  useEffect(() => {
    setShuffledIndices(cards.map((_, i) => i));
    setCurrentIndex((prev) =>
      cards.length === 0 ? 0 : Math.min(prev, cards.length - 1)
    );
    setIsFlipped(false);
    setShowHint(false);
  }, [cards]);

  const orderedCards = useMemo(() => {
    if (!isShuffled || shuffledIndices.length !== cards.length) {
      return cards;
    }
    return shuffledIndices.map((idx) => cards[idx]).filter(Boolean);
  }, [cards, isShuffled, shuffledIndices]);

  const currentCard = orderedCards[currentIndex];

  const handleFlip = useCallback(() => {
    if (orderedCards.length === 0) return;
    setIsFlipped((prev) => !prev);
  }, [orderedCards.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < orderedCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setIsAutoPlaying(false);
    }
  }, [currentIndex, orderedCards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const next = !prev;
      if (next) {
        const indices = cards.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setShuffledIndices(indices);
      }
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
      return next;
    });
  }, [cards]);

  const handleToggleAutoPlay = useCallback(() => {
    if (orderedCards.length === 0) return;
    setIsAutoPlaying((prev) => !prev);
  }, [orderedCards.length]);

  const handleToggleAutoRead = useCallback(() => {
    setIsAutoRead((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("flashwise_auto_read", next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      if (!next) stopSpeaking();
      return next;
    });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleToggleDirection = useCallback(() => {
    setDirection((prev) => (prev === "term_first" ? "def_first" : "term_first"));
    setIsFlipped(false);
    setShowHint(false);
  }, []);

  // Auto-read visible face when card / flip / direction changes
  useEffect(() => {
    if (!isAutoRead) return;
    const card = orderedCards[currentIndex];
    if (!card) return;
    const rawF = card.front_content || (card as { front_text?: string }).front_text || "";
    const rawB = card.back_content || (card as { back_text?: string }).back_text || "";
    const visible = isFlipped
      ? direction === "term_first"
        ? rawB
        : rawF
      : direction === "term_first"
        ? rawF
        : rawB;
    if (!visible?.trim()) return;
    const timer = setTimeout(() => speakText(visible), 180);
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [isAutoRead, currentIndex, isFlipped, direction, orderedCards]);

  // Stop speaking on unmount
  useEffect(() => () => stopSpeaking(), []);

  // Autoplay timer
  useEffect(() => {
    if (!isAutoPlaying || orderedCards.length === 0) return;

    const timer = setTimeout(() => {
      if (!isFlipped) {
        setIsFlipped(true);
      } else if (currentIndex < orderedCards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setShowHint(false);
      } else {
        setIsAutoPlaying(false);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, isFlipped, currentIndex, orderedCards.length]);

  // Keyboard navigation listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableElement(e.target)) return;

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleToggleShuffle();
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleToggleAutoRead();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handleToggleAutoPlay();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    handleFlip,
    handleNext,
    handlePrev,
    handleToggleShuffle,
    handleToggleAutoRead,
    handleToggleAutoPlay,
    handleToggleFullscreen,
    isFullscreen,
  ]);

  if (!currentCard) {
    return (
      <div
        data-testid="flashcard-viewer-empty"
        className="w-full rounded-2xl bg-quizlet-surface border border-quizlet-border-light p-12 text-center shadow-card"
      >
        <p className="text-base font-semibold text-quizlet-slate-secondary">
          No flashcards in this study set yet. Add a card below to start studying!
        </p>
      </div>
    );
  }

  const rawFront =
    currentCard.front_content || currentCard.front_text || "";
  const rawBack =
    currentCard.back_content || currentCard.back_text || "";

  const frontText = direction === "term_first" ? rawFront : rawBack;
  const backText = direction === "term_first" ? rawBack : rawFront;
  const frontLabel = direction === "term_first" ? "Term" : "Definition";
  const backLabel = direction === "term_first" ? "Definition" : "Term";

  const isCardStarred = starredCardIds
    ? starredCardIds.has(currentCard.id)
    : localStarred.has(currentCard.id);

  const handleStarCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStarCard) {
      onToggleStarCard(currentCard.id);
    } else {
      setLocalStarred((prev) => {
        const next = new Set(prev);
        if (next.has(currentCard.id)) {
          next.delete(currentCard.id);
        } else {
          next.add(currentCard.id);
        }
        return next;
      });
    }
  };

  return (
    <div
      data-testid="flashcard-viewer"
      className={`${
        isFullscreen
          ? "fixed inset-0 z-50 bg-quizlet-canvas p-4 sm:p-8 flex flex-col justify-center overflow-y-auto"
          : "w-full"
      } ${className}`}
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* 3D Perspective Container */}
        <div
          data-testid="card-perspective-container"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-label={`Flashcard ${currentIndex + 1} of ${
            orderedCards.length
          }. Currently showing ${
            isFlipped ? backLabel : frontLabel
          }. Click or press Spacebar to flip.`}
          className={`perspective-1000 w-full ${
            isFullscreen ? "h-[28rem] sm:h-[34rem]" : "h-80 sm:h-[24rem]"
          } cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo rounded-2xl`}
        >
          <div
            data-testid="card-3d-flipper"
            className={`relative w-full h-full transform-style-3d transition-flip ${
              isFlipped ? "rotate-y-180" : "rotate-y-0"
            }`}
          >
            {/* FRONT FACE */}
            <div
              data-testid="card-face-front"
              className="card-face card-face-front p-6 sm:p-10"
            >
              {/* Top Row: Label, Hint, Audio, Star */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
                    {frontLabel}
                  </span>

                  {currentCard.hint && (
                    <button
                      type="button"
                      data-testid="card-hint-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-quizlet-canvas text-quizlet-slate-secondary hover:text-quizlet-indigo transition-colors cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-quizlet-gold" />
                      <span>{showHint ? currentCard.hint : "Get a hint"}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="tts-front-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(frontText);
                    }}
                    aria-label={`Listen to ${frontLabel}`}
                    className="p-2 rounded-full text-quizlet-slate-secondary hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    data-testid="star-card-btn"
                    onClick={handleStarCard}
                    aria-label={isCardStarred ? "Unstar card" : "Star card"}
                    aria-pressed={isCardStarred}
                    className="p-2 rounded-full text-quizlet-slate-secondary hover:bg-quizlet-canvas hover:text-quizlet-gold transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        isCardStarred
                          ? "fill-quizlet-gold text-quizlet-gold"
                          : "text-quizlet-slate-muted"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Center Content */}
              <div className="flex-1 flex items-center justify-center text-center px-4 overflow-y-auto">
                <h2
                  data-testid="front-text"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-quizlet-slate leading-snug break-words"
                >
                  {frontText}
                </h2>
              </div>

              {/* Bottom Flip Prompt */}
              <div className="text-center">
                <span className="text-xs font-semibold text-quizlet-slate-muted">
                  Click card or press Spacebar to flip
                </span>
              </div>
            </div>

            {/* BACK FACE */}
            <div
              data-testid="card-face-back"
              className="card-face card-face-back p-6 sm:p-10"
            >
              {/* Top Row: Label, Audio, Star */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-quizlet-indigo">
                  {backLabel}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="tts-back-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(backText);
                    }}
                    aria-label={`Listen to ${backLabel}`}
                    className="p-2 rounded-full text-quizlet-slate-secondary hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleStarCard}
                    aria-label={isCardStarred ? "Unstar card" : "Star card"}
                    className="p-2 rounded-full text-quizlet-slate-secondary hover:bg-quizlet-canvas hover:text-quizlet-gold transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        isCardStarred
                          ? "fill-quizlet-gold text-quizlet-gold"
                          : "text-quizlet-slate-muted"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Center Content */}
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 overflow-y-auto gap-3">
                <p
                  data-testid="back-text"
                  className="text-xl sm:text-2xl md:text-3xl font-semibold text-quizlet-slate leading-relaxed break-words"
                >
                  {backText}
                </p>

                {currentCard.explanation && (
                  <p
                    data-testid="card-explanation"
                    className="text-sm text-quizlet-slate-secondary bg-quizlet-canvas px-4 py-2 rounded-xl max-w-xl"
                  >
                    {currentCard.explanation}
                  </p>
                )}
              </div>

              {/* Bottom Flip Prompt */}
              <div className="text-center">
                <span className="text-xs font-semibold text-quizlet-slate-muted">
                  Click card or press Spacebar to flip back
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar & Navigation Controls */}
        <CardToolbar
          currentIndex={currentIndex}
          totalCards={orderedCards.length}
          isFlipped={isFlipped}
          isShuffled={isShuffled}
          isAutoPlaying={isAutoPlaying}
          isAutoRead={isAutoRead}
          isFullscreen={isFullscreen}
          direction={direction}
          onPrev={handlePrev}
          onNext={handleNext}
          onFlip={handleFlip}
          onToggleShuffle={handleToggleShuffle}
          onToggleAutoPlay={handleToggleAutoPlay}
          onToggleAutoRead={handleToggleAutoRead}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleDirection={handleToggleDirection}
        />

        {/* Keyboard Shortcuts Legend */}
        <div className="hidden sm:flex items-center justify-center gap-6 text-xs font-medium text-quizlet-slate-muted pt-1">
          <span className="inline-flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts:</span>
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-quizlet-surface border border-quizlet-border text-quizlet-slate font-semibold">
              Space
            </kbd>{" "}
            Flip
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-quizlet-surface border border-quizlet-border text-quizlet-slate font-semibold">
              ← / →
            </kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-quizlet-surface border border-quizlet-border text-quizlet-slate font-semibold">
              S
            </kbd>{" "}
            Shuffle
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-quizlet-surface border border-quizlet-border text-quizlet-slate font-semibold">
              A
            </kbd>{" "}
            Tự đọc
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-quizlet-surface border border-quizlet-border text-quizlet-slate font-semibold">
              F
            </kbd>{" "}
            Fullscreen
          </span>
        </div>
      </div>
    </div>
  );
}
