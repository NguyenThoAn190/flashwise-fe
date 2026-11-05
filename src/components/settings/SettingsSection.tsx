"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SettingsSectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Khung card trắng cho từng nhóm cài đặt, khớp ảnh mẫu Quizlet.
 */
export function SettingsSection({ label, children, className, testId }: SettingsSectionProps) {
  return (
    <section className={cn("space-y-2", className)} data-testid={testId}>
      <h2 className="text-xs font-bold text-quizlet-slate-secondary">{label}</h2>
      <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light shadow-card overflow-hidden">
        {children}
      </div>
    </section>
  );
}
