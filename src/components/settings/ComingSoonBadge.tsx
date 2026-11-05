"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

export interface ComingSoonBadgeProps {
  feature?: string;
  className?: string;
}

/**
 * Nhãn "Sắp ra mắt" dùng chung cho mọi tính năng chưa có backend.
 * Tái sử dụng chuỗi `settings.comingSoon` đã có trong 5 locale.
 */
export function ComingSoonBadge({ feature, className }: ComingSoonBadgeProps) {
  const t = useTranslations("settings");
  const label = t("comingSoon");
  return (
    <span
      data-testid="settings-coming-soon"
      title={feature ? t("comingSoonAria", { feature }) : label}
      aria-label={feature ? t("comingSoonAria", { feature }) : label}
      className={cn(
        "inline-flex items-center shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
        "bg-quizlet-canvas text-quizlet-slate-muted border border-quizlet-border-light",
        className
      )}
    >
      {label}
    </span>
  );
}
