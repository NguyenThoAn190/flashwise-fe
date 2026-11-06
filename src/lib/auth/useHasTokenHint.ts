"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";

/**
 * Client-side auth-cookie hint for statically-rendered locale home URLs
 * (`/en`, `/vi`, ...). Those layouts stay static for SEO caching, so they
 * cannot read cookies on the server. After hydration, check
 * `document.cookie` once and upgrade `landing -> skeleton` without waiting
 * for the full `apiGetProfile()` verify.
 *
 * - SSR / first client render: returns server hint only (matches SSR HTML,
 *   no hydration mismatch).
 * - After mount: also returns true when an auth cookie exists locally.
 * Stale/expired cookies only cost a cheap skeleton, never a trust decision.
 */
const TOKEN_COOKIE_MARKERS = ["flashwise_access_token", "quizlet_access_token"];

function readClientCookieHint(): boolean {
  try {
    if (typeof document === "undefined") return false;
    const cookie = document.cookie || "";
    if (!cookie) return false;
    return TOKEN_COOKIE_MARKERS.some((marker) => cookie.includes(marker));
  } catch {
    return false;
  }
}

export function useHasTokenHint(): boolean {
  const { hasTokenHint } = useAuth();
  const [clientHint, setClientHint] = useState(false);

  useEffect(() => {
    if (hasTokenHint === true) return;
    if (readClientCookieHint()) setClientHint(true);
  }, [hasTokenHint]);

  return hasTokenHint === true || clientHint;
}
