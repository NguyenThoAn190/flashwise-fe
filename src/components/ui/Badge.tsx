import React from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeStatus = "NEW" | "LEARNING" | "MASTERED" | "FAMILIAR" | "DEFAULT";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  size?: BadgeSize;
  showDot?: boolean;
}

const statusStyles: Record<BadgeStatus, { container: string; dot: string }> = {
  NEW: {
    container: "bg-quizlet-indigo-light text-quizlet-indigo border-quizlet-indigo-border",
    dot: "bg-quizlet-indigo",
  },
  LEARNING: {
    container: "bg-quizlet-coral-bg text-quizlet-coral border-quizlet-coral-border",
    dot: "bg-quizlet-coral",
  },
  MASTERED: {
    container: "bg-quizlet-green-bg text-quizlet-green border-quizlet-green-border",
    dot: "bg-quizlet-green",
  },
  FAMILIAR: {
    container: "bg-quizlet-warning-bg text-quizlet-warning border-quizlet-warning-border",
    dot: "bg-quizlet-warning",
  },
  DEFAULT: {
    container: "bg-quizlet-canvas text-quizlet-slate border-quizlet-border",
    dot: "bg-quizlet-slate-muted",
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
  lg: "px-3.5 py-1.5 text-sm gap-2",
};

export function Badge({
  className,
  status = "DEFAULT",
  size = "md",
  showDot = false,
  children,
  ...props
}: BadgeProps) {
  const currentStatus = statusStyles[status] || statusStyles.DEFAULT;

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border select-none transition-colors",
        currentStatus.container,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", currentStatus.dot)}
          aria-hidden="true"
          data-testid="badge-dot"
        />
      )}
      {children}
    </span>
  );
}
