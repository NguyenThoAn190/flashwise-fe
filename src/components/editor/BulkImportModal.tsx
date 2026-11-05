"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  parseBulkText,
  TermDelimiterOption,
  CardDelimiterOption,
  resolveTermDelimiter,
  resolveCardDelimiter,
  BulkParseCard,
} from "@/lib/utils/bulkParser";
import { VirtualizedCardList } from "./VirtualizedCardList";

export interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (
    cards: BulkParseCard[],
    rawText: string,
    termDelimiter: string,
    cardDelimiter: string
  ) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function BulkImportModal({
  open,
  onClose,
  onImport,
  isSubmitting = false,
}: BulkImportModalProps) {
  const [rawText, setRawText] = useState("");
  const [termOption, setTermOption] = useState<TermDelimiterOption>("tab");
  const [customTermDelim, setCustomTermDelim] = useState("-");
  const [cardOption, setCardOption] = useState<CardDelimiterOption>("newline");
  const [customCardDelim, setCustomCardDelim] = useState("\\n\\n");

  const effectiveTermDelim = useMemo(
    () => resolveTermDelimiter(termOption, customTermDelim),
    [termOption, customTermDelim]
  );

  const effectiveCardDelim = useMemo(
    () => resolveCardDelimiter(cardOption, customCardDelim),
    [cardOption, customCardDelim]
  );

  const deferredText = useDeferredValue(rawText);

  const parseResult = useMemo(
    () =>
      parseBulkText(deferredText, effectiveTermDelim, effectiveCardDelim),
    [deferredText, effectiveTermDelim, effectiveCardDelim]
  );
  // Hiển thị số lượng theo text mới nhất, danh sách chi tiết theo text đã defer
  // để gõ/paste 1000 dòng không block main thread.

  const handleConfirmImport = async () => {
    // Parse lại từ rawText mới nhất lúc bấm Import để không dính
    // cards cũ của useDeferredValue khi user paste 1000 dòng rồi bấm ngay.
    const fresh = parseBulkText(rawText, effectiveTermDelim, effectiveCardDelim);
    if (fresh.cards.length === 0) return;
    await onImport(
      fresh.cards,
      rawText,
      effectiveTermDelim,
      effectiveCardDelim
    );
    setRawText("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import flashcards from text"
      description="Copy and paste your data here (from Word, Excel, Google Docs, etc.)"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            data-testid="bulk-import-submit-btn"
            disabled={parseResult.cards.length === 0}
            isLoading={isSubmitting}
            onClick={handleConfirmImport}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import {parseResult.cards.length}{" "}
            {parseResult.cards.length === 1 ? "card" : "cards"}
          </Button>
        </>
      }
    >
      <div data-testid="bulk-import-modal" className="space-y-5">
        {/* Raw Textarea */}
        <div>
          <label
            htmlFor="bulk-import-textarea"
            className="block text-xs font-bold uppercase tracking-wider text-quizlet-slate-secondary mb-2"
          >
            Paste your terms and definitions
          </label>
          <textarea
            id="bulk-import-textarea"
            data-testid="bulk-import-textarea"
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={
              termOption === "tab"
                ? "Word 1\tDefinition 1\nWord 2\tDefinition 2\nWord 3\tDefinition 3"
                : termOption === "comma"
                ? "Word 1, Definition 1\nWord 2, Definition 2"
                : "Word 1; Definition 1\nWord 2; Definition 2"
            }
            className="w-full rounded-xl border-2 border-quizlet-border bg-quizlet-canvas p-3.5 text-sm font-mono text-quizlet-slate focus:border-quizlet-indigo focus:bg-quizlet-surface focus:outline-none transition-colors"
          />
        </div>

        {/* Delimiter Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-quizlet-canvas p-4 rounded-xl border border-quizlet-border-light">
          {/* Between Term and Definition */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-secondary">
              Between term and definition
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "tab", label: "Tab" },
                  { id: "comma", label: "Comma (,)" },
                  { id: "semicolon", label: "Semicolon (;)" },
                  { id: "custom", label: "Custom" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`delim-${opt.id}`}
                  onClick={() => setTermOption(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    termOption === opt.id
                      ? "bg-quizlet-indigo text-quizlet-surface border-quizlet-indigo"
                      : "bg-quizlet-surface text-quizlet-slate border-quizlet-border hover:bg-quizlet-surface-hover"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {termOption === "custom" && (
              <input
                type="text"
                data-testid="custom-term-delim-input"
                value={customTermDelim}
                onChange={(e) => setCustomTermDelim(e.target.value)}
                placeholder="e.g. - or ::"
                className="mt-2 w-32 px-2.5 py-1 text-xs rounded border border-quizlet-border bg-quizlet-surface text-quizlet-slate"
              />
            )}
          </div>

          {/* Between Cards */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-secondary">
              Between cards
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "newline", label: "New line" },
                  { id: "semicolon", label: "Semicolon (;)" },
                  { id: "custom", label: "Custom" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`card-delim-${opt.id}`}
                  onClick={() => setCardOption(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    cardOption === opt.id
                      ? "bg-quizlet-indigo text-quizlet-surface border-quizlet-indigo"
                      : "bg-quizlet-surface text-quizlet-slate border-quizlet-border hover:bg-quizlet-surface-hover"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="space-y-2" data-testid="bulk-import-preview">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-quizlet-slate-secondary">
              Live Preview ({parseResult.cards.length} valid cards)
            </h4>
            {parseResult.errors.length > 0 && (
              <Badge status="LEARNING" size="sm">
                {parseResult.errors.length} line{" "}
                {parseResult.errors.length === 1 ? "error" : "errors"}
              </Badge>
            )}
          </div>

          {/* Errors Alert */}
          {parseResult.errors.length > 0 && (
            <div
              data-testid="bulk-import-errors"
              className="rounded-xl bg-quizlet-coral-bg border border-quizlet-coral-border p-3 space-y-1 max-h-28 overflow-y-auto"
            >
              {parseResult.errors.slice(0, 100).map((err) => (
                <div
                  key={err.line}
                  className="flex items-center gap-2 text-xs text-quizlet-coral font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Line {err.line}: {err.message}
                  </span>
                </div>
              ))}
              {parseResult.errors.length > 100 && (
                <div className="text-xs text-quizlet-coral font-bold pt-1">
                  + {parseResult.errors.length - 100} more errors (fix the
                  first 100 to continue)
                </div>
              )}
            </div>
          )}

          {/* Parsed Cards Table (virtualized: chỉ mount dòng trong viewport) */}
          {parseResult.cards.length > 0 ? (
            <VirtualizedCardList
              count={parseResult.cards.length}
              estimatedHeight={41}
              overscan={20}
              threshold={60}
              scrollable
              maxHeight={192}
              getKey={(i) => `preview_${i}`}
              renderItem={(i) => {
                const card = parseResult.cards[i];
                if (!card) return null;
                return (
                  <div
                    data-testid="bulk-preview-row"
                    className="px-3.5 py-2.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-2 font-bold text-quizlet-slate w-5/12 truncate">
                      <span className="text-quizlet-slate-muted">#{i + 1}</span>
                      <span className="truncate">{card.front_content}</span>
                    </div>
                    <div className="text-quizlet-slate-secondary w-6/12 truncate">
                      {card.back_content}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-quizlet-green shrink-0" />
                  </div>
                );
              }}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-quizlet-border p-6 text-center text-xs text-quizlet-slate-muted">
              Nothing to preview yet. Paste terms above to see live parsed rows.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
