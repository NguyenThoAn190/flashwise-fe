"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

/**
 * Shared Google Client ID resolution for GIS.
 * Empty/mock values mean Google Login is not configured and the UI
 * must fall back to email/password with the `googleNoClient` message.
 */
export function getGoogleClientId(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
}

export function isGoogleConfigured(clientId = getGoogleClientId()): boolean {
  if (!clientId) return false;
  if (clientId.includes("mockclientid")) return false;
  return true;
}

export interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps the app in `GoogleOAuthProvider` only when a real Client ID exists.
 * Rendering without a provider when unconfigured keeps SSR/test renders
 * working and lets `GoogleLoginButton` show the fallback message.
 */
export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const clientId = getGoogleClientId();
  if (!isGoogleConfigured(clientId)) {
    return <>{children}</>;
  }
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
