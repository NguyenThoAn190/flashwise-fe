"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { SignupForm } from "@/components/auth/SignupForm";

function SignupContent() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  return (
    <>
      <AuthTabs activeTab="signup" redirectParam={redirectParam} />
      <SignupForm redirectParam={redirectParam} />
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="h-72 flex items-center justify-center text-quizlet-slate-muted text-sm">
          Loading sign up form...
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
