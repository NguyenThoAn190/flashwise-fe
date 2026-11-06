import { apiGetDueReviews, apiGetStudySets } from "@/lib/api/studySets";
import type { DueReviewsSummary, StudySetListResponse } from "@/types/studySet";

/**
 * Parallel prefetch store for `/` dashboard data.
 *
 * `AuthProvider.restoreSession()` kicks off `prefetchDashboardData()` the
 * moment it sees a local token — in parallel with `apiGetProfile()` verify —
 * so study-sets + due-reviews are already in flight while the profile is
 * still verifying. `DashboardHome` then consumes the in-flight promises
 * instead of starting a second waterfall after auth resolves.
 *
 * Prefetch uses default params (mine, no search). `DashboardHome` only
 * reuses the study-sets promise when its own params match; due-reviews has
 * no params so it is always reusable. Failures are swallowed here — the
 * dashboard's normal fetch path will retry and surface errors.
 */

let studySetsPromise: Promise<StudySetListResponse> | null = null;
let dueReviewsPromise: Promise<DueReviewsSummary> | null = null;

export function prefetchDashboardData(): void {
  if (typeof window === "undefined") return;
  try {
    if (!studySetsPromise) {
      studySetsPromise = apiGetStudySets({ filter: "mine" }).catch((err) => {
        studySetsPromise = null;
        throw err;
      });
      // Avoid unhandled rejection when dashboard never consumes (guest pivot).
      studySetsPromise.catch(() => {});
    }
    if (!dueReviewsPromise) {
      dueReviewsPromise = apiGetDueReviews().catch((err) => {
        dueReviewsPromise = null;
        throw err;
      });
      dueReviewsPromise.catch(() => {});
    }
  } catch {
    // Never break auth restore on prefetch errors.
  }
}

export function consumePrefetchedStudySets(): Promise<StudySetListResponse> | null {
  const p = studySetsPromise;
  studySetsPromise = null;
  return p;
}

export function consumePrefetchedDueReviews(): Promise<DueReviewsSummary> | null {
  const p = dueReviewsPromise;
  dueReviewsPromise = null;
  return p;
}

export function clearDashboardPrefetch(): void {
  studySetsPromise = null;
  dueReviewsPromise = null;
}
