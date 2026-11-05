"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  return (
    <>
      <AuthTabs activeTab="login" redirectParam={redirectParam} />
      <LoginForm redirectParam={redirectParam} />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="h-72 flex items-center justify-center text-quizlet-slate-muted text-sm">
          Loading login form...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
