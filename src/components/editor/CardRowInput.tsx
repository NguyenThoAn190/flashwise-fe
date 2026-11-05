"use client";

import React from "react";
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Input } from "@/components/ui/Input";

export interface EditableCardRow {
  localId: string;
  id?: string;
  front_content: string;
  back_content: string;
  hint?: string;
}

export interface CardRowInputProps {
  index: number;
  totalRows: number;
  row: EditableCardRow;
  onChange: (localId: string, updated: Partial<EditableCardRow>) => void;
  onRemove: (localId: string) => void;
  onDuplicate: (localId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEnterAtEnd?: (index: number) => void;
  termInputRef?: React.Ref<HTMLInputElement>;
}

export function CardRowInputInner({
  index,
  totalRows,
  row,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onEnterAtEnd,
  termInputRef,
}: CardRowInputProps) {
  const handleDefinitionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey || index === totalRows - 1)) {
      e.preventDefault();
      onEnterAtEnd?.(index);
    }
  };

  return (
    <div
      data-testid="editor-card-row"
      className="bg-quizlet-surface rounded-quizlet-card border border-quizlet-border-light shadow-card overflow-hidden transition-all focus-within:border-quizlet-indigo"
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-quizlet-canvas/60 border-b border-quizlet-border-light">
        <div className="flex items-center gap-2">
          <GripVertical
            className="w-4 h-4 text-quizlet-slate-muted cursor-grab"
            aria-hidden="true"
          />
          <span
            data-testid="card-row-number"
            className="text-sm font-bold text-quizlet-slate-secondary tabular-nums"
          >
            {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="move-card-up-btn"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            aria-label={`Move card ${index + 1} up`}
            title="Move up"
            className="p-1.5 rounded-lg text-quizlet-slate-secondary hover:bg-quizlet-surface hover:text-quizlet-indigo disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            data-testid="move-card-down-btn"
            disabled={index === totalRows - 1}
            onClick={() => onMoveDown(index)}
            aria-label={`Move card ${index + 1} down`}
            title="Move down"
            className="p-1.5 rounded-lg text-quizlet-slate-secondary hover:bg-quizlet-surface hover:text-quizlet-indigo disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            data-testid="duplicate-card-row-btn"
            onClick={() => onDuplicate(row.localId)}
            aria-label={`Duplicate card ${index + 1}`}
            title="Duplicate card"
            className="p-1.5 rounded-lg text-quizlet-slate-secondary hover:bg-quizlet-surface hover:text-quizlet-indigo transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            type="button"
            data-testid="delete-card-row-btn"
            disabled={totalRows <= 1}
            onClick={() => onRemove(row.localId)}
            aria-label={`Delete card ${index + 1}`}
            title="Delete card"
            className="p-1.5 rounded-lg text-quizlet-slate-secondary hover:bg-quizlet-coral-bg hover:text-quizlet-coral disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inputs Row */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-5">
          <Input
            ref={termInputRef}
            label="TERM"
            data-testid="card-term-input"
            placeholder="Enter term"
            value={row.front_content}
            onChange={(e) =>
              onChange(row.localId, { front_content: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-5">
          <Input
            label="DEFINITION"
            data-testid="card-definition-input"
            placeholder="Enter definition"
            value={row.back_content}
            onChange={(e) =>
              onChange(row.localId, { back_content: e.target.value })
            }
            onKeyDown={handleDefinitionKeyDown}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="HINT"
            data-testid="card-hint-input"
            placeholder="Optional"
            value={row.hint || ""}
            onChange={(e) => onChange(row.localId, { hint: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export const CardRowInput = React.memo(CardRowInputInner);
CardRowInput.displayName = "CardRowInput";
