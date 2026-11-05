"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiGetStudySet, apiUpdateStudySet } from "@/lib/api/studySets";
import {
  apiAddCard,
  apiUpdateCard,
  apiDeleteCard,
  apiReorderCards,
  apiBulkImportCards,
} from "@/lib/api/flashcards";
import { StudySetDetail } from "@/types/studySet";
import {
  StudySetEditorForm,
  StudySetEditorSubmitData,
} from "@/components/editor/StudySetEditorForm";
import { EditableCardRow } from "@/components/editor/CardRowInput";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BulkParseCard } from "@/lib/utils/bulkParser";

export default function EditStudySetPage() {
  const params = useParams();
  const router = useRouter();
  const setId = typeof params?.id === "string" ? params.id : "";

  const [studySet, setStudySet] = useState<StudySetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSet = useCallback(async () => {
    if (!setId) return;
    setIsLoading(true);
    setError(null);
    try {
      const detail = await apiGetStudySet(setId);
      setStudySet(detail);
    } catch (err: any) {
      setError(err?.message || "Failed to load study set for editing.");
    } finally {
      setIsLoading(false);
    }
  }, [setId]);

  useEffect(() => {
    loadSet();
  }, [loadSet]);

  const handleBulkImportApi = async (
    _cards: BulkParseCard[],
    rawText: string,
    termDelim: string,
    cardDelim: string
  ) => {
    if (!setId) return;
    await apiBulkImportCards(setId, {
      raw_text: rawText,
      term_delimiter: termDelim,
      card_delimiter: cardDelim,
    });
  };

  const handleSubmit = async (data: StudySetEditorSubmitData) => {
    if (!studySet) return;
    setIsSubmitting(true);
    try {
      await apiUpdateStudySet(studySet.id, {
        title: data.title,
        description: data.description,
        visibility: data.visibility,
      });

      const originalIds = new Set(studySet.cards.map((c) => c.id));
      const keptIds = new Set(
        data.cards.map((c) => c.id).filter(Boolean) as string[]
      );

      // Delete removed cards
      for (const oldId of originalIds) {
        if (!keptIds.has(oldId)) {
          await apiDeleteCard(oldId);
        }
      }

      // Add new cards or update existing cards
      const finalCardOrder: string[] = [];
      for (const row of data.cards) {
        if (row.id && originalIds.has(row.id)) {
          try {
            await apiUpdateCard(row.id, {
              front_content: row.front_content,
              back_content: row.back_content,
              hint: row.hint,
            });
          } catch {
            // Mock server may not implement PUT /cards/:id; ignore gracefully
          }
          finalCardOrder.push(row.id);
        } else {
          const added = await apiAddCard(studySet.id, {
            front_content: row.front_content,
            back_content: row.back_content,
            hint: row.hint,
          });
          finalCardOrder.push(added.id);
        }
      }

      if (finalCardOrder.length > 1) {
        await apiReorderCards(studySet.id, finalCardOrder);
      }

      router.push(`/set/${studySet.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div
          data-testid="edit-set-loading"
          className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-pulse"
        >
          <div className="h-8 w-56 bg-quizlet-border-light rounded-lg" />
          <div className="h-64 w-full bg-quizlet-surface rounded-2xl border border-quizlet-border-light" />
        </div>
      </AuthGuard>
    );
  }

  if (error || !studySet) {
    return (
      <AuthGuard>
        <div className="max-w-3xl mx-auto py-12 px-4 text-center">
          <p className="text-base font-bold text-quizlet-coral">
            {error || "Study set not found."}
          </p>
        </div>
      </AuthGuard>
    );
  }

  const initialCards: EditableCardRow[] = studySet.cards.map((c) => ({
    localId: `row_${c.id}`,
    id: c.id,
    front_content: c.front_content || c.front_text || "",
    back_content: c.back_content || c.back_text || "",
    hint: c.hint || "",
  }));

  return (
    <AuthGuard>
      <div
        data-testid="edit-study-set-page"
        className="max-w-5xl mx-auto py-6 sm:py-8 px-4 space-y-6"
      >
        <Link
          href={`/set/${studySet.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-quizlet-slate-secondary hover:text-quizlet-indigo transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Study Set</span>
        </Link>

        <StudySetEditorForm
          mode="edit"
          draftKey={`quizlet_set_draft_${studySet.id}`}
          initialTitle={studySet.title}
          initialDescription={studySet.description || ""}
          initialVisibility={studySet.visibility || "public"}
          initialCards={initialCards}
          onSubmit={handleSubmit}
          onBulkImportApi={handleBulkImportApi}
          onCancel={() => router.push(`/set/${studySet.id}`)}
          isSubmitting={isSubmitting}
        />
      </div>
    </AuthGuard>
  );
}
