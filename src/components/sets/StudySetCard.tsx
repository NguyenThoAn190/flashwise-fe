"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StudySet } from "@/types/studySet";

export interface StudySetCardProps {
  studySet: StudySet;
  onToggleStar?: (id: string, nextStarred: boolean, e: React.MouseEvent) => void;
  className?: string;
}

export function StudySetCard({
  studySet,
  onToggleStar,
  className,
}: StudySetCardProps) {
  const cardCount = studySet.card_count ?? studySet.total_cards ?? studySet.cards?.length ?? 0;
  const termLabel = cardCount === 1 ? "1 term" : `${cardCount} terms`;

  const creatorName =
    studySet.creator?.name ||
    studySet.creator_name ||
    studySet.owner?.name ||
    "Anonymous";

  const creatorAvatar =
    studySet.creator?.avatar_url ||
    studySet.creator_avatar_url ||
    studySet.owner?.avatar_url;

  const creatorInitial = creatorName ? creatorName[0].toUpperCase() : "A";

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleStar?.(studySet.id, !studySet.is_starred, e);
  };

  return (
    <Link
      href={`/set/${studySet.id}`}
      className={`group block bg-quizlet-surface rounded-quizlet-card border border-quizlet-border-light p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo ${
        className || ""
      }`}
      data-testid="study-set-card"
    >
      <div className="flex flex-col h-full justify-between gap-4">
        {/* Top Header: Term count badge & Star toggle */}
        <div className="flex items-center justify-between">
          <Badge
            size="sm"
            status="DEFAULT"
            className="font-bold text-quizlet-slate-secondary bg-quizlet-canvas"
            data-testid="study-set-terms-badge"
          >
            {termLabel}
          </Badge>

          <button
            type="button"
            onClick={handleStarClick}
            aria-label={studySet.is_starred ? "Remove star from study set" : "Star study set"}
            className="p-1.5 -mr-1.5 -mt-1 rounded-full text-quizlet-slate-muted hover:text-quizlet-gold hover:bg-quizlet-canvas transition-colors cursor-pointer"
            data-testid="study-set-star-button"
          >
            <Star
              className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                studySet.is_starred
                  ? "fill-quizlet-gold text-quizlet-gold"
                  : "text-quizlet-slate-muted hover:text-quizlet-gold"
              }`}
            />
          </button>
        </div>

        {/* Middle: Title & Description */}
        <div className="flex-1">
          <h3
            className="text-base sm:text-lg font-bold text-quizlet-slate group-hover:text-quizlet-indigo transition-colors line-clamp-2 tracking-tight"
            data-testid="study-set-title"
          >
            {studySet.title}
          </h3>
          {studySet.description && (
            <p className="text-xs sm:text-sm text-quizlet-slate-secondary line-clamp-2 mt-1 leading-relaxed">
              {studySet.description}
            </p>
          )}
        </div>

        {/* Bottom: Creator Metadata */}
        <div className="flex items-center gap-2 pt-2 border-t border-quizlet-border-light/60">
          {creatorAvatar ? (
            <img
              src={creatorAvatar}
              alt=""
              className="w-5 h-5 rounded-full object-cover border border-quizlet-border shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-quizlet-indigo-light text-quizlet-indigo font-bold text-[10px] flex items-center justify-center shrink-0">
              {creatorInitial}
            </div>
          )}
          <span className="text-xs font-semibold text-quizlet-slate truncate">
            {creatorName}
          </span>
        </div>
      </div>
    </Link>
  );
}
