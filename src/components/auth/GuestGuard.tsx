"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { sanitizeRedirectUrl } from "@/lib/utils/authValidation";
import { AuthLoading } from "./AuthLoading";

export interface GuestGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function GuestGuardInternal({ children, fallback }: GuestGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const rawRedirect = searchParams.get("redirect");
      const targetUrl = sanitizeRedirectUrl(rawRedirect, "/");
      router.replace(targetUrl);
    }
  }, [isLoading, isAuthenticated, searchParams, router]);

  // While checking session or redirecting authenticated user, render loading screen
  if (isLoading || isAuthenticated) {
    return fallback ? <>{fallback}</> : <AuthLoading />;
  }

  return <>{children}</>;
}

export function GuestGuard(props: GuestGuardProps) {
  return (
    <Suspense fallback={props.fallback ?? <AuthLoading />}>
      <GuestGuardInternal {...props} />
    </Suspense>
  );
}
