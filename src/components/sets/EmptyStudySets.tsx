import React from "react";
import Link from "next/link";
import { SearchX, Star, BookOpen, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudySetFilter } from "@/types/studySet";

export interface EmptyStudySetsProps {
  filter?: StudySetFilter;
  searchQuery?: string;
  onClearFilters?: () => void;
  className?: string;
}

export function EmptyStudySets({
  filter = "all",
  searchQuery,
  onClearFilters,
  className,
}: EmptyStudySetsProps) {
  const isSearching = Boolean(searchQuery && searchQuery.trim());

  let icon = <BookOpen className="w-8 h-8 text-quizlet-slate-muted" />;
  let title = "No study sets found";
  let description = "Create your first study set or explore sets to begin learning.";

  if (isSearching) {
    icon = <SearchX className="w-8 h-8 text-quizlet-slate-muted" />;
    title = `No sets match "${searchQuery}"`;
    description = "Check your spelling or try searching for another term.";
  } else if (filter === "starred") {
    icon = <Star className="w-8 h-8 text-quizlet-gold" />;
    title = "No starred sets yet";
    description = "Favorite sets with the star icon to easily access them here anytime.";
  } else if (filter === "mine") {
    icon = <BookOpen className="w-8 h-8 text-quizlet-indigo" />;
    title = "You haven't created any study sets";
    description = "Create study sets to memorize flashcards, practice questions, and track mastery.";
  } else if (filter === "recent") {
    icon = <BookOpen className="w-8 h-8 text-quizlet-slate-muted" />;
    title = "No recently studied sets";
    description = "Sets you create or study will appear here in chronological order.";
  }

  return (
    <div
      className={`col-span-full py-16 px-4 text-center bg-white rounded-2xl border border-quizlet-border-light shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto ${
        className || ""
      }`}
      data-testid="empty-study-sets"
    >
      <div className="w-16 h-16 rounded-2xl bg-quizlet-canvas flex items-center justify-center mb-4 border border-quizlet-border-light">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-quizlet-slate mb-1">{title}</h3>
      <p className="text-sm text-quizlet-slate-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-3">
        {isSearching && onClearFilters ? (
          <Button
            size="md"
            variant="secondary"
            onClick={onClearFilters}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            data-testid="empty-clear-search-button"
          >
            Clear search
          </Button>
        ) : null}

        <Link href="/set/create">
          <Button
            size="md"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            data-testid="empty-create-set-button"
          >
            Create a study set
          </Button>
        </Link>
      </div>
    </div>
  );
}
