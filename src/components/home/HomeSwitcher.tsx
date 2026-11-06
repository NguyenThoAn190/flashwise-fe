"use client";

import React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useHasTokenHint } from "@/lib/auth/useHasTokenHint";
import { LandingHome } from "@/components/landing/LandingHome";
import { DashboardHome } from "@/components/home/DashboardHome";
import { DashboardSkeleton } from "@/components/home/DashboardSkeleton";

export interface HomeSwitcherProps {
  /**
   * Server cookie hint. When provided, it takes precedence over context
   * `hasTokenHint` so SSR HTML and the first client render match exactly.
   */
  initialHasToken?: boolean;
}

export function HomeSwitcher({ initialHasToken }: HomeSwitcherProps = {}) {
  const { isAuthenticated, isLoading } = useAuth();
  const clientHint = useHasTokenHint();
  const hasToken = initialHasToken ?? clientHint;

  // Optimistic: cached user already restores `isAuthenticated=true` while
  // `isLoading` is still verifying the profile. Render the real dashboard
  // immediately so study-sets fetch runs in parallel with profile verify
  // instead of waiting for a second waterfall.
  if (isAuthenticated) {
    return <DashboardHome />;
  }

  // Maybe-authed: token cookie existed on the request but session not yet
  // verified (or no cached user). Render a cheap skeleton with the same
  // dimensions as DashboardHome — never the heavy LandingHome — so the
  // skeleton -> dashboard swap has near-zero CLS.
  if (isLoading && hasToken) {
    return <DashboardSkeleton />;
  }

  if (isLoading) {
    // Guest path: server already said no cookie. LandingHome here matches
    // SSR HTML exactly (SEO/crawler path). Keep it lightweight-painted once.
    return <LandingHome />;
  }

  return <LandingHome />;
}
