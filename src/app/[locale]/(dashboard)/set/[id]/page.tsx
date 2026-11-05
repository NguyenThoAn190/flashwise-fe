"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Brain,
  BarChart3,
  Edit3,
  Copy,
  Trash2,
  Share2,
  Star,
  Globe,
  Lock,
  Check,
} from "lucide-react";
import {
  apiGetStudySet,
  apiUpdateStudySet,
  apiDeleteStudySet,
  apiDuplicateStudySet,
} from "@/lib/api/studySets";
import { apiAddCard, apiDeleteCard } from "@/lib/api/flashcards";
import { StudySetDetail, CreateCardInput } from "@/types/studySet";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FlashcardViewer } from "@/components/flashcard/FlashcardViewer";
import { CardList } from "@/components/flashcard/CardList";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";

export default function StudySetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const setId = typeof params?.id === "string" ? params.id : "";

  const [studySet, setStudySet] = useState<StudySetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [starredCardIds, setStarredCardIds] = useState<Set<string>>(new Set());

  const fetchSet = useCallback(async () => {
    if (!setId) return;
    setIsLoading(true);
    setError(null);
    try {
      const detail = await apiGetStudySet(setId);
      setStudySet(detail);
    } catch (err: any) {
      setError(err?.message || "Could not load study set.");
    } finally {
      setIsLoading(false);
    }
  }, [setId]);

  useEffect(() => {
    fetchSet();
  }, [fetchSet]);

  const handleToggleSetStar = async () => {
    if (!studySet) return;
    const prevStarred = Boolean(studySet.is_starred);
    setStudySet({ ...studySet, is_starred: !prevStarred });
    try {
      await apiUpdateStudySet(studySet.id, { is_starred: !prevStarred });
    } catch {
      setStudySet({ ...studySet, is_starred: prevStarred });
    }
  };

  const handleDuplicate = async () => {
    if (!studySet || isDuplicating) return;
    setIsDuplicating(true);
    try {
      const duplicated = await apiDuplicateStudySet(studySet.id);
      router.push(`/set/${duplicated.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to duplicate study set.");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!studySet || isDeleting) return;
    setIsDeleting(true);
    try {
      await apiDeleteStudySet(studySet.id);
      setIsDeleteModalOpen(false);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Failed to delete study set.");
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAddCard = async (input: CreateCardInput) => {
    if (!studySet) return;
    setIsAddingCard(true);
    try {
      const created = await apiAddCard(studySet.id, input);
      setStudySet((prev) => {
        if (!prev) return prev;
        const nextCards = [...prev.cards, created];
        return {
          ...prev,
          cards: nextCards,
          card_count: nextCards.length,
          total_cards: nextCards.length,
        };
      });
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!studySet) return;
    const prevCards = studySet.cards;
    const nextCards = prevCards.filter((c) => c.id !== cardId);
    setStudySet({
      ...studySet,
      cards: nextCards,
      card_count: nextCards.length,
      total_cards: nextCards.length,
    });

    try {
      await apiDeleteCard(cardId);
    } catch {
      setStudySet({
        ...studySet,
        cards: prevCards,
        card_count: prevCards.length,
        total_cards: prevCards.length,
      });
    }
  };

  const handleToggleStarCard = (cardId: string) => {
    setStarredCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div
          data-testid="set-detail-loading"
          className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-pulse"
        >
          <div className="h-8 w-64 bg-quizlet-border-light rounded-lg" />
          <div className="h-96 w-full bg-quizlet-surface rounded-2xl border border-quizlet-border-light" />
        </div>
      </AuthGuard>
    );
  }

  if (error || !studySet) {
    return (
      <AuthGuard>
        <div
          data-testid="set-detail-error"
          className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4"
        >
          <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-8 shadow-card space-y-4">
            <h1 className="text-2xl font-bold text-quizlet-slate">
              Study Set Not Found
            </h1>
            <p className="text-sm text-quizlet-slate-secondary">
              {error || "The requested study set does not exist or could not be loaded."}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="secondary" onClick={() => router.push("/")}>
                Back to Home
              </Button>
              <Button variant="primary" onClick={fetchSet}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const creatorName =
    studySet.creator?.name || studySet.creator_name || "Demo Student";
  const creatorInitial = creatorName[0]?.toUpperCase() || "U";

  return (
    <AuthGuard>
      <div
        data-testid="study-set-detail-page"
        className="max-w-5xl mx-auto py-6 sm:py-8 px-4 space-y-8"
      >
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-quizlet-slate-secondary hover:text-quizlet-indigo transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            size="sm"
            status="DEFAULT"
            className="inline-flex items-center gap-1"
            data-testid="set-visibility-badge"
          >
            {studySet.visibility === "private" ? (
              <>
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </>
            ) : (
              <>
                <Globe className="w-3 h-3" />
                <span>Public</span>
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1
              data-testid="set-detail-title"
              className="font-hurme text-2xl sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight"
            >
              {studySet.title}
            </h1>
            <button
              type="button"
              data-testid="star-set-btn"
              onClick={handleToggleSetStar}
              aria-label={
                studySet.is_starred ? "Unstar study set" : "Star study set"
              }
              className="p-2 rounded-full border border-quizlet-border bg-quizlet-surface hover:bg-quizlet-surface-hover transition-colors cursor-pointer"
            >
              <Star
                className={`w-5 h-5 ${
                  studySet.is_starred
                    ? "fill-quizlet-gold text-quizlet-gold"
                    : "text-quizlet-slate-muted"
                }`}
              />
            </button>
          </div>
          {studySet.description && (
            <p
              data-testid="set-detail-description"
              className="text-sm sm:text-base text-quizlet-slate-secondary max-w-2xl"
            >
              {studySet.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            data-testid="edit-set-btn"
            onClick={() => router.push(`/set/${studySet.id}/edit`)}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            Edit
          </Button>

          <Button
            variant="secondary"
            size="sm"
            data-testid="duplicate-set-btn"
            isLoading={isDuplicating}
            onClick={handleDuplicate}
            leftIcon={<Copy className="w-4 h-4" />}
          >
            Duplicate
          </Button>

          <Button
            variant="secondary"
            size="sm"
            data-testid="share-set-btn"
            onClick={handleShare}
            leftIcon={
              copiedLink ? (
                <Check className="w-4 h-4 text-quizlet-green" />
              ) : (
                <Share2 className="w-4 h-4" />
              )
            }
          >
            {copiedLink ? "Copied!" : "Share"}
          </Button>

          <Button
            variant="danger"
            size="sm"
            data-testid="delete-set-btn"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Study Mode Launch Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-quizlet-surface border-2 border-quizlet-indigo shadow-card">
          <div className="w-9 h-9 rounded-lg bg-quizlet-indigo-light text-quizlet-indigo flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-quizlet-slate">Flashcards</p>
            <p className="text-xs text-quizlet-slate-muted">3D Flip Mode</p>
          </div>
        </div>

        <Link
          href={`/set/${studySet.id}/learn`}
          data-testid="launch-learn-mode-btn"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-quizlet-surface border border-quizlet-border-light hover:border-quizlet-indigo shadow-card hover:shadow-card-hover transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-quizlet-green-bg text-quizlet-green flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-quizlet-slate">Learn</p>
            <p className="text-xs text-quizlet-slate-muted">Adaptive Engine</p>
          </div>
        </Link>

        <Link
          href={`/set/${studySet.id}/edit`}
          className="flex items-center gap-3 p-3.5 rounded-xl bg-quizlet-surface border border-quizlet-border-light hover:border-quizlet-indigo shadow-card hover:shadow-card-hover transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-quizlet-warning-bg text-quizlet-warning flex items-center justify-center shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-quizlet-slate">Edit Cards</p>
            <p className="text-xs text-quizlet-slate-muted">
              Manage & Import
            </p>
          </div>
        </Link>

        <Link
          href={`/progress?set=${studySet.id}`}
          data-testid="launch-progress-btn"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-quizlet-surface border border-quizlet-border-light hover:border-quizlet-indigo shadow-card hover:shadow-card-hover transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-quizlet-indigo-light text-quizlet-indigo flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-quizlet-slate">Progress</p>
            <p className="text-xs text-quizlet-slate-muted">Mastery & SRS</p>
          </div>
        </Link>
      </div>

      {/* Interactive 3D Flashcard Viewer */}
      <FlashcardViewer
        cards={studySet.cards}
        starredCardIds={starredCardIds}
        onToggleStarCard={handleToggleStarCard}
      />

      {/* Creator Strip */}
      <div className="flex items-center justify-between py-4 border-y border-quizlet-border-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-quizlet-indigo-light text-quizlet-indigo font-bold flex items-center justify-center">
            {creatorInitial}
          </div>
          <div>
            <p className="text-xs text-quizlet-slate-muted font-medium">
              Created by
            </p>
            <p
              data-testid="set-creator-name"
              className="text-sm font-bold text-quizlet-slate"
            >
              {creatorName}
            </p>
          </div>
        </div>

        <Link href={`/set/${studySet.id}/learn`}>
          <Button variant="primary" size="md" leftIcon={<Brain className="w-4 h-4" />}>
            Study with Learn Mode
          </Button>
        </Link>
      </div>

      {/* Terms List & Inline Card Addition */}
      <CardList
        cards={studySet.cards}
        onAddCard={handleAddCard}
        onDeleteCard={handleDeleteCard}
        starredCardIds={starredCardIds}
        onToggleStarCard={handleToggleStarCard}
        isSubmittingCard={isAddingCard}
      />

      {/* Delete Set Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete this study set?"
        description={`Are you sure you want to permanently delete "${studySet.title}" and all ${studySet.cards.length} flashcards? This action cannot be undone.`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              data-testid="confirm-delete-set-btn"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Yes, delete set
            </Button>
          </>
        }
      >
        <p className="text-sm text-quizlet-slate-secondary">
          All study progress and spaced repetition schedules for this set will also be removed.
        </p>
      </Dialog>
      </div>
    </AuthGuard>
  );
}
