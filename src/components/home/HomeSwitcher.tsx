"use client";

import React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { LandingHome } from "@/components/landing/LandingHome";
import { DashboardHome } from "@/components/home/DashboardHome";

export function HomeSwitcher() {
  const { isAuthenticated, isLoading } = useAuth();

  // While session is restoring, keep the SSR landing visible to avoid flicker.
  // Never call hasAccessToken() here: stale tokens still need apiGetProfile verification.
  if (isLoading) {
    return <LandingHome />;
  }

  if (isAuthenticated) {
    return <DashboardHome />;
  }

  return <LandingHome />;
}
