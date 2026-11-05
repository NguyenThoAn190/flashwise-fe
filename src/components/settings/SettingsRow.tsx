"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SettingsRowProps {
  label: React.ReactNode;
  subLabel?: React.ReactNode;
  control?: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Một hàng label trái + control phải, viền ngăn cách giữa các hàng.
 */
export function SettingsRow({ label, subLabel, control, className, testId }: SettingsRowProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5",
        "border-b border-quizlet-border-light last:border-b-0",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-bold text-quizlet-slate truncate">{label}</p>
        {subLabel ? (
          <p className="text-xs text-quizlet-slate-secondary truncate">{subLabel}</p>
        ) : null}
      </div>
      {control ? <div className="flex items-center gap-2 shrink-0">{control}</div> : null}
    </div>
  );
}
