"use client";

import React from "react";
import { StudySetCardSkeleton } from "@/components/sets";

/**
 * First-paint placeholder for maybe-authed `/` visits.
 * Mirrors `DashboardHome` container dimensions (welcome banner + tabs +
 * 6-card grid) so swapping skeleton -> real dashboard has near-zero CLS.
 * Unlike the full `LandingHome`, this is cheap to render and unmount.
 */
export function DashboardSkeleton() {
  return (
    <div
      data-testid="dashboard-skeleton"
      aria-hidden="true"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8"
    >
      {/* Welcome banner placeholder */}
      <section className="bg-white rounded-2xl border border-quizlet-border-light p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 animate-pulse">
        <div className="flex flex-col gap-2.5 flex-1">
          <div className="h-8 w-64 max-w-full bg-quizlet-canvas rounded-lg" />
          <div className="h-4 w-80 max-w-full bg-quizlet-canvas rounded-md" />
        </div>
        <div className="h-10 w-36 bg-quizlet-canvas rounded-xl shrink-0" />
      </section>

      {/* Tabs + filter placeholder */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-quizlet-border-light animate-pulse">
        <div className="flex items-center gap-1 py-1">
          <div className="h-9 w-24 bg-quizlet-canvas rounded-xl" />
          <div className="h-9 w-24 bg-quizlet-canvas rounded-xl" />
          <div className="h-9 w-24 bg-quizlet-canvas rounded-xl" />
        </div>
        <div className="h-9 w-full sm:w-72 lg:w-80 bg-quizlet-canvas rounded-xl" />
      </section>

      {/* Grid placeholder: same 6-card layout as DashboardHome */}
      <section className="w-full">
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          data-testid="dashboard-skeleton-grid"
        >
          <StudySetCardSkeleton count={6} />
        </div>
      </section>
    </div>
  );
}
