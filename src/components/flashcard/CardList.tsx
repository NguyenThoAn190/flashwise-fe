"use client";

import React, { useState } from "react";
import { Volume2, Trash2, Plus, Star } from "lucide-react";
import { Flashcard, CreateCardInput, KnowledgeState } from "@/types/studySet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { speakText } from "./FlashcardViewer";

export interface CardListProps {
  cards: Flashcard[];
  onAddCard?: (input: CreateCardInput) => Promise<void> | void;
  onDeleteCard?: (cardId: string) => Promise<void> | void;
  starredCardIds?: Set<string>;
  onToggleStarCard?: (cardId: string) => void;
  isSubmittingCard?: boolean;
}

type StateFilter = "all" | "learning" | "mastered" | "not_studied";

function getStateBadgeConfig(state?: KnowledgeState): {
  label: string;
  status: "MASTERED" | "LEARNING" | "FAMILIAR" | "DEFAULT";
} {
  switch (state) {
    case "mastered":
      return { label: "Mastered", status: "MASTERED" };
    case "reviewing":
    case "familiar":
      return { label: "Reviewing", status: "FAMILIAR" };
    case "learning":
      return { label: "Still learning", status: "LEARNING" };
    default:
      return { label: "Not studied", status: "DEFAULT" };
  }
}

export function CardList({
  cards,
  onAddCard,
  onDeleteCard,
  starredCardIds,
  onToggleStarCard,
  isSubmittingCard = false,
}: CardListProps) {
  const [filter, setFilter] = useState<StateFilter>("all");
  const [frontContent, setFrontContent] = useState("");
  const [backContent, setBackContent] = useState("");
  const [hintContent, setHintContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const masteredCount = cards.filter((c) => c.state === "mastered").length;
  const learningCount = cards.filter(
    (c) =>
      c.state === "learning" ||
      c.state === "reviewing" ||
      c.state === "familiar"
  ).length;
  const notStudiedCount = cards.length - masteredCount - learningCount;

  const filteredCards = cards.filter((c) => {
    if (filter === "mastered") return c.state === "mastered";
    if (filter === "learning")
      return (
        c.state === "learning" ||
        c.state === "reviewing" ||
        c.state === "familiar"
      );
    if (filter === "not_studied")
      return !c.state || c.state === "not_studied" || c.state === "new";
    return true;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedFront = frontContent.trim();
    const trimmedBack = backContent.trim();

    if (!trimmedFront || !trimmedBack) {
      setFormError("Both Term and Definition are required.");
      return;
    }

    if (!onAddCard) return;

    try {
      await onAddCard({
        front_content: trimmedFront,
        back_content: trimmedBack,
        hint: hintContent.trim() || undefined,
      });
      setFrontContent("");
      setBackContent("");
      setHintContent("");
    } catch (err: any) {
      setFormError(err?.message || "Failed to add flashcard.");
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!onDeleteCard) return;
    setDeletingId(cardId);
    try {
      await onDeleteCard(cardId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      data-testid="terms-list-section"
      aria-label="Terms in this set"
      className="space-y-6"
    >
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-quizlet-slate">
          Terms in this set ({cards.length})
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-quizlet-indigo text-quizlet-surface"
                : "bg-quizlet-surface border border-quizlet-border text-quizlet-slate-secondary hover:bg-quizlet-surface-hover"
            }`}
          >
            All ({cards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("learning")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              filter === "learning"
                ? "bg-quizlet-coral text-quizlet-surface"
                : "bg-quizlet-surface border border-quizlet-border text-quizlet-slate-secondary hover:bg-quizlet-surface-hover"
            }`}
          >
            Still learning ({learningCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("mastered")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              filter === "mastered"
                ? "bg-quizlet-green text-quizlet-surface"
                : "bg-quizlet-surface border border-quizlet-border text-quizlet-slate-secondary hover:bg-quizlet-surface-hover"
            }`}
          >
            Mastered ({masteredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("not_studied")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              filter === "not_studied"
                ? "bg-quizlet-slate text-quizlet-surface"
                : "bg-quizlet-surface border border-quizlet-border text-quizlet-slate-secondary hover:bg-quizlet-surface-hover"
            }`}
          >
            Not studied ({notStudiedCount})
          </button>
        </div>
      </div>

      {/* Terms Rows */}
      <div className="space-y-3">
        {filteredCards.map((card, index) => {
          const front = card.front_content || card.front_text || "";
          const back = card.back_content || card.back_text || "";
          const badgeInfo = getStateBadgeConfig(card.state);
          const isStarred = starredCardIds?.has(card.id) ?? false;

          return (
            <div
              key={card.id}
              data-testid="term-row"
              className="bg-quizlet-surface rounded-quizlet-card border border-quizlet-border-light p-4 sm:p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-quizlet-border transition-colors"
            >
              {/* Term & Definition Columns */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-5 md:border-r md:border-quizlet-border-light md:pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-quizlet-slate-muted">
                      #{index + 1}
                    </span>
                    <Badge size="sm" status={badgeInfo.status}>
                      {badgeInfo.label}
                    </Badge>
                  </div>
                  <p
                    data-testid="term-row-front"
                    className="text-base font-bold text-quizlet-slate break-words"
                  >
                    {front}
                  </p>
                </div>

                <div className="md:col-span-7 md:pl-2">
                  <p
                    data-testid="term-row-back"
                    className="text-sm sm:text-base font-medium text-quizlet-slate-secondary break-words leading-relaxed"
                  >
                    {back}
                  </p>
                  {card.hint && (
                    <p className="text-xs text-quizlet-slate-muted mt-1 italic">
                      Hint: {card.hint}
                    </p>
                  )}
                </div>
              </div>

              {/* Row Actions */}
              <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-quizlet-border-light">
                {onToggleStarCard && (
                  <button
                    type="button"
                    onClick={() => onToggleStarCard(card.id)}
                    aria-label={isStarred ? "Unstar term" : "Star term"}
                    className="p-2 rounded-full text-quizlet-slate-secondary hover:bg-quizlet-canvas hover:text-quizlet-gold transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isStarred
                          ? "fill-quizlet-gold text-quizlet-gold"
                          : "text-quizlet-slate-muted"
                      }`}
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => speakText(`${front}. ${back}`)}
                  aria-label={`Pronounce ${front}`}
                  className="p-2 rounded-full text-quizlet-slate-secondary hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {onDeleteCard && (
                  <button
                    type="button"
                    data-testid="delete-card-btn"
                    disabled={deletingId === card.id}
                    onClick={() => handleDelete(card.id)}
                    aria-label={`Delete card ${front}`}
                    className="p-2 rounded-full text-quizlet-slate-secondary hover:bg-quizlet-coral-bg hover:text-quizlet-coral disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredCards.length === 0 && (
          <div className="bg-quizlet-surface rounded-quizlet-card border border-quizlet-border-light p-8 text-center">
            <p className="text-sm font-medium text-quizlet-slate-secondary">
              No flashcards match the selected filter.
            </p>
          </div>
        )}
      </div>

      {/* Inline Add Card Form */}
      {onAddCard && (
        <form
          onSubmit={handleAddSubmit}
          data-testid="inline-add-card-form"
          className="bg-quizlet-surface rounded-quizlet-card border-2 border-dashed border-quizlet-border p-5 sm:p-6 space-y-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-quizlet-slate flex items-center gap-2">
              <Plus className="w-4 h-4 text-quizlet-indigo" />
              <span>Add a new card to this set</span>
            </h3>
          </div>

          {formError && (
            <div
              role="alert"
              data-testid="inline-add-card-error"
              className="text-xs font-semibold text-quizlet-coral bg-quizlet-coral-bg border border-quizlet-coral-border px-3 py-2 rounded-lg"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Term"
              data-testid="inline-front-input"
              placeholder="Enter term (front)"
              value={frontContent}
              onChange={(e) => setFrontContent(e.target.value)}
            />
            <Input
              label="Definition"
              data-testid="inline-back-input"
              placeholder="Enter definition (back)"
              value={backContent}
              onChange={(e) => setBackContent(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex-1 max-w-md">
              <Input
                label="Hint (Optional)"
                data-testid="inline-hint-input"
                placeholder="Optional memory hint"
                value={hintContent}
                onChange={(e) => setHintContent(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              data-testid="inline-add-card-submit"
              isLoading={isSubmittingCard}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Card
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
