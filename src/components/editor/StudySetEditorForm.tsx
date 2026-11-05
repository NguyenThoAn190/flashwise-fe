"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SetVisibility } from "@/types/studySet";
import { CardRowInput, EditableCardRow } from "./CardRowInput";
import { BulkImportModal } from "./BulkImportModal";
import { VirtualizedCardList } from "./VirtualizedCardList";
import { BulkParseCard } from "@/lib/utils/bulkParser";

export interface StudySetEditorSubmitData {
  title: string;
  description: string;
  visibility: SetVisibility;
  cards: EditableCardRow[];
}

export interface StudySetEditorFormProps {
  mode: "create" | "edit";
  draftKey: string;
  initialTitle?: string;
  initialDescription?: string;
  initialVisibility?: SetVisibility;
  initialCards?: EditableCardRow[];
  onSubmit: (data: StudySetEditorSubmitData) => Promise<void>;
  onBulkImportApi?: (
    cards: BulkParseCard[],
    rawText: string,
    termDelim: string,
    cardDelim: string
  ) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

function makeEmptyRow(): EditableCardRow {
  return {
    localId: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    front_content: "",
    back_content: "",
    hint: "",
  };
}

export function StudySetEditorForm({
  mode,
  draftKey,
  initialTitle = "",
  initialDescription = "",
  initialVisibility = "public",
  initialCards,
  onSubmit,
  onBulkImportApi,
  onCancel,
  isSubmitting = false,
}: StudySetEditorFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] =
    useState<SetVisibility>(initialVisibility);
  const [rows, setRows] = useState<EditableCardRow[]>(() =>
    initialCards && initialCards.length > 0
      ? initialCards
      : [makeEmptyRow(), makeEmptyRow()]
  );

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [focusRowIndex, setFocusRowIndex] = useState<number | null>(null);

  const rowTermRefs = useRef<Map<number, HTMLInputElement | null>>(new Map());

  // Restore draft from LocalStorage on mount (for create mode)
  useEffect(() => {
    if (mode !== "create" || typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.visibility) setVisibility(parsed.visibility);
        if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
          setRows(parsed.rows);
        }
        setDraftSavedAt("Restored from draft");
      }
    } catch {
      // Ignore corrupt draft
    }
  }, [mode, draftKey]);

  // Auto-save draft: debounce dài hơn khi 1000 dòng để JSON.stringify
  // localStorage không chạy mỗi keystroke (trước đây 600ms là quá nhanh).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasContent =
      title.trim() !== "" ||
      description.trim() !== "" ||
      rows.some((r) => r.front_content.trim() || r.back_content.trim());

    if (!hasContent) return;

    const delay =
      rows.length > 200 ? 2000 : rows.length > 60 ? 1200 : 600;

    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({ title, description, visibility, rows })
        );
        const now = new Date();
        setDraftSavedAt(
          `Draft saved ${now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
      } catch {
        // Ignore quota errors
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, visibility, rows, draftKey]);

  // Focus newly added row when triggered via keyboard shortcut
  useEffect(() => {
    if (focusRowIndex !== null) {
      const el = rowTermRefs.current.get(focusRowIndex);
      if (el) {
        el.focus();
      }
      setFocusRowIndex(null);
    }
  }, [focusRowIndex, rows.length]);

  const handleRowChange = useCallback(
    (localId: string, updated: Partial<EditableCardRow>) => {
      setRows((prev) =>
        prev.map((r) => (r.localId === localId ? { ...r, ...updated } : r))
      );
    },
    []
  );

  const handleRemoveRow = useCallback((localId: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.localId !== localId);
    });
  }, []);

  const handleDuplicateRow = useCallback((localId: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.localId === localId);
      if (idx === -1) return prev;
      const source = prev[idx];
      const copy: EditableCardRow = {
        localId: `row_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,
        front_content: source.front_content,
        back_content: source.back_content,
        hint: source.hint,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setRows((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setRows((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleAddRow = (focusNew = false) => {
    setRows((prev) => {
      const next = [...prev, makeEmptyRow()];
      if (focusNew) {
        setFocusRowIndex(next.length - 1);
      }
      return next;
    });
  };

  const handleEnterAtEnd = useCallback(
    (index: number) => {
      if (index === rows.length - 1) {
        setRows((prev) => {
          const next = [...prev, makeEmptyRow()];
          setFocusRowIndex(next.length - 1);
          return next;
        });
      } else {
        setFocusRowIndex(index + 1);
      }
    },
    [rows.length]
  );

  const setTermInputRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      rowTermRefs.current.set(index, el);
    },
    []
  );

  const handleBulkImport = async (
    importedCards: BulkParseCard[],
    rawText: string,
    termDelim: string,
    cardDelim: string
  ) => {
    if (onBulkImportApi) {
      await onBulkImportApi(importedCards, rawText, termDelim, cardDelim);
    }

    const newRows: EditableCardRow[] = importedCards.map((c, idx) => ({
      // 1 lần Date.now() + index thay vì 1000 lần Date.now() + Math.random()
      localId: `row_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      front_content: c.front_content,
      back_content: c.back_content,
      hint: "",
    }));

    setRows((prev) => {
      // Remove completely empty starter rows if we're importing into a blank form
      const nonEmpty = prev.filter(
        (r) => r.front_content.trim() || r.back_content.trim()
      );
      return [...nonEmpty, ...newRows];
    });
  };

  const handleClearDraft = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(draftKey);
    }
    setTitle(initialTitle);
    setDescription(initialDescription);
    setVisibility(initialVisibility);
    setRows([makeEmptyRow(), makeEmptyRow()]);
    setDraftSavedAt(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Please enter a title for your study set.");
      return;
    }

    const validCards = rows.filter(
      (r) => r.front_content.trim() !== "" && r.back_content.trim() !== ""
    );

    if (validCards.length === 0) {
      setErrorMessage(
        "At least one card with both a term and definition is required."
      );
      return;
    }

    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        visibility,
        cards: validCards.map((c) => ({
          ...c,
          front_content: c.front_content.trim(),
          back_content: c.back_content.trim(),
          hint: c.hint?.trim() || undefined,
        })),
      });

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftKey);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save study set.");
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      data-testid="study-set-editor-form"
      className="space-y-8"
    >
      {/* Top Sticky Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-quizlet-border-light">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-hurme text-2xl sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight">
              {mode === "create"
                ? "Create a new study set"
                : "Edit study set"}
            </h1>
            {draftSavedAt && (
              <Badge
                size="sm"
                status="MASTERED"
                data-testid="draft-status-badge"
                className="inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>{draftSavedAt}</span>
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-quizlet-slate-secondary">
            Press Tab to move between fields, or Ctrl+Enter on a definition to
            add a new card row.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {draftSavedAt && mode === "create" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="clear-draft-btn"
              onClick={handleClearDraft}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset
            </Button>
          )}
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            data-testid="save-study-set-btn"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {mode === "create" ? "Create" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          data-testid="editor-error-alert"
          className="flex items-center gap-2.5 p-4 rounded-xl bg-quizlet-coral-bg border border-quizlet-coral-border text-quizlet-coral text-sm font-bold"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Set Metadata Card */}
      <div className="bg-quizlet-surface rounded-quizlet-card border border-quizlet-border-light p-5 sm:p-6 shadow-card space-y-4">
        <Input
          label="Title"
          data-testid="set-title-input"
          placeholder='Enter a title, like "Biology - Chapter 22: Evolution"'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-8">
            <Input
              label="Description"
              data-testid="set-description-input"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="set-visibility-select"
              className="block text-sm font-semibold text-quizlet-slate mb-1.5"
            >
              Visibility
            </label>
            <select
              id="set-visibility-select"
              data-testid="set-visibility-select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as SetVisibility)}
              className="w-full h-11 px-3.5 rounded-quizlet border-2 border-quizlet-border bg-quizlet-surface text-sm font-semibold text-quizlet-slate focus:border-quizlet-indigo focus:outline-none"
            >
              <option value="public">Visible to everyone (Public)</option>
              <option value="private">Only me (Private)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar: Bulk Import & Count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          data-testid="open-bulk-import-btn"
          onClick={() => setIsBulkOpen(true)}
          leftIcon={<Upload className="w-4 h-4" />}
        >
          + Import from text
        </Button>

        <span className="text-sm font-bold text-quizlet-slate-secondary">
          {rows.length} {rows.length === 1 ? "card" : "cards"} in editor
        </span>
      </div>

      {/* Reorderable Card Rows (virtualized: chỉ mount dòng trong viewport) */}
      <div className="space-y-4" data-testid="editor-cards-list">
        <VirtualizedCardList
          count={rows.length}
          estimatedHeight={248}
          overscan={8}
          threshold={60}
          activeIndex={focusRowIndex}
          getKey={(i) => rows[i]?.localId ?? `row_${i}`}
          renderItem={(idx) => {
            const row = rows[idx];
            if (!row) return null;
            return (
              <CardRowInput
                index={idx}
                totalRows={rows.length}
                row={row}
                onChange={handleRowChange}
                onRemove={handleRemoveRow}
                onDuplicate={handleDuplicateRow}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onEnterAtEnd={handleEnterAtEnd}
                termInputRef={setTermInputRef(idx)}
              />
            );
          }}
        />
      </div>

      {/* Bottom Add Card CTA & Submit */}
      <div className="space-y-6">
        <button
          type="button"
          data-testid="add-card-row-btn"
          onClick={() => handleAddRow(true)}
          className="w-full py-5 rounded-quizlet-card bg-quizlet-surface border-2 border-dashed border-quizlet-border hover:border-quizlet-indigo text-quizlet-slate hover:text-quizlet-indigo font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-card transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>+ Add a Card</span>
        </button>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-5 h-5" />}
          >
            {mode === "create" ? "Create Study Set" : "Save Study Set"}
          </Button>
        </div>
      </div>

      {/* Bulk Import Modal */}
      <BulkImportModal
        open={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onImport={handleBulkImport}
      />
    </form>
  );
}
