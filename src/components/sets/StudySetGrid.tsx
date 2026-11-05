"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudySetCard } from "./StudySetCard";
import { StudySetCardSkeleton } from "./StudySetCardSkeleton";
import { EmptyStudySets } from "./EmptyStudySets";
import { LIBRARY_PAGE_SIZE } from "./useStudySets";
import type { StudySet } from "@/types/studySet";

export interface StudySetGridProps {
  items: StudySet[];
  isLoading: boolean;
  errorMessage: string | null;
  total: number;
  page: number;
  totalPages: number;
  searchQuery: string;
  onClearSearch: () => void;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  /** MVP: Library không truyền star handler vì backend chưa có is_starred */
  onToggleStar?: (id: string, nextStarred: boolean, e: React.MouseEvent) => void;
  skeletonCount?: number;
}

/**
 * Shared grid for "my study sets" lists.
 * Library page and Dashboard both render through this so loading /
 * empty / error / pagination states stay consistent.
 */
export function StudySetGrid({
  items,
  isLoading,
  errorMessage,
  total,
  page,
  totalPages,
  searchQuery,
  onClearSearch,
  onRetry,
  onPageChange,
  onToggleStar,
  skeletonCount = LIBRARY_PAGE_SIZE,
}: StudySetGridProps) {
  const tDashboard = useTranslations("dashboard");
  const tLibrary = useTranslations("library");

  if (errorMessage) {
    return (
      <div
        role="alert"
        className="w-full rounded-2xl bg-quizlet-coral-bg border border-quizlet-coral-border p-6 text-center flex flex-col items-center gap-3 my-4"
        data-testid="study-sets-error-alert"
      >
        <AlertCircle className="w-8 h-8 text-quizlet-coral" />
        <h4 className="text-base font-bold text-quizlet-slate">{tDashboard("somethingWrong")}</h4>
        <p className="text-sm text-quizlet-slate-secondary max-w-md">{errorMessage}</p>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={onRetry}
          data-testid="study-sets-retry-button"
        >
          {tDashboard("tryAgain")}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="study-sets-grid-loading"
      >
        <StudySetCardSkeleton count={skeletonCount} />
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyStudySets filter="mine" searchQuery={searchQuery} onClearFilters={onClearSearch} />;
  }

  const showPagination = totalPages > 1;
  const start = total === 0 ? 0 : (page - 1) * LIBRARY_PAGE_SIZE + 1;
  const end = Math.min(total, page * LIBRARY_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="study-sets-grid"
      >
        {items.map((studySet) => (
          <StudySetCard
            key={studySet.id}
            studySet={studySet}
            onToggleStar={onToggleStar}
          />
        ))}
      </div>

      {showPagination ? (
        <nav
          aria-label={tLibrary("pagination")}
          className="flex items-center justify-center gap-2"
          data-testid="library-pagination"
        >
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            data-testid="library-prev-page"
          >
            {tLibrary("prevPage")}
          </Button>
          <span
            className="text-sm font-semibold text-quizlet-slate-secondary px-2"
            data-testid="library-page-info"
          >
            {tLibrary("pageInfo", { start, end, total, page, totalPages })}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            data-testid="library-next-page"
          >
            {tLibrary("nextPage")}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
