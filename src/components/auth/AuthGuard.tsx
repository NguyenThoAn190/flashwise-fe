"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { AuthLoading } from "./AuthLoading";
import { buildLoginUrl } from "@/lib/utils/authValidation";

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function AuthGuardInternal({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const search = searchParams?.toString();
      const currentPath = pathname ? pathname : "/";
      router.replace(buildLoginUrl(currentPath, search || undefined, pathname));
    }
  }, [isLoading, isAuthenticated, pathname, searchParams, router]);

  // While checking session or initiating redirect, render loading screen
  if (isLoading || !isAuthenticated) {
    return fallback ? <>{fallback}</> : <AuthLoading />;
  }

  return <>{children}</>;
}

export function AuthGuard(props: AuthGuardProps) {
  return (
    <Suspense fallback={props.fallback ?? <AuthLoading />}>
      <AuthGuardInternal {...props} />
    </Suspense>
  );
}
