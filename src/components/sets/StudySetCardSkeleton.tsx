import React from "react";

export interface StudySetCardSkeletonProps {
  count?: number;
  className?: string;
}

export function StudySetCardSkeleton({
  count = 6,
  className,
}: StudySetCardSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={`bg-quizlet-surface rounded-quizlet-card border border-quizlet-border-light p-5 shadow-card animate-pulse flex flex-col justify-between h-[180px] select-none ${
            className || ""
          }`}
          data-testid="study-set-skeleton"
        >
          {/* Top Row: Badge placeholder & Star placeholder */}
          <div className="flex items-center justify-between">
            <div className="h-5 w-16 bg-quizlet-canvas rounded-full" />
            <div className="h-5 w-5 bg-quizlet-canvas rounded-full" />
          </div>

          {/* Middle: Title lines */}
          <div className="space-y-2 my-2">
            <div className="h-4 bg-quizlet-canvas rounded-md w-4/5" />
            <div className="h-3 bg-quizlet-canvas rounded-md w-3/5" />
          </div>

          {/* Bottom: Creator row */}
          <div className="flex items-center gap-2 pt-2 border-t border-quizlet-border-light/60">
            <div className="w-5 h-5 rounded-full bg-quizlet-canvas shrink-0" />
            <div className="h-3 bg-quizlet-canvas rounded w-24" />
          </div>
        </div>
      ))}
    </>
  );
}
