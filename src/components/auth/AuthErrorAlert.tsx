"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AuthErrorAlertProps {
  message?: string | null;
  className?: string;
  onDismiss?: () => void;
}

export function AuthErrorAlert({ message, className, onDismiss }: AuthErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-xl border transition-all",
        "bg-quizlet-coral-bg border-quizlet-coral-border text-quizlet-slate text-sm",
        className
      )}
    >
      <AlertCircle
        className="w-5 h-5 text-quizlet-coral shrink-0 mt-0.5"
        aria-hidden="true"
        data-testid="auth-alert-icon"
      />
      <div className="flex-1 font-medium leading-relaxed">
        {message}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-quizlet-slate-muted hover:text-quizlet-slate transition-colors p-0.5 -mr-1"
          aria-label="Dismiss alert"
        >
          <span className="text-lg leading-none" aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
}
