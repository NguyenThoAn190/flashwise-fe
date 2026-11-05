"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

export type DialogSize = "sm" | "md" | "lg" | "xl" | "full";

export interface DialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  size?: DialogSize;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] h-[90vh]",
};

export function Dialog({
  isOpen,
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  initialFocusRef,
  children,
  className,
}: DialogProps) {
  const isDialogOpen = open !== undefined ? open : Boolean(isOpen);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial focus and previous focus restoration lifecycle
  useEffect(() => {
    if (!mounted || !isDialogOpen) return;

    if (!previousActiveElementRef.current) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (panelRef.current) {
      const contentFocusable = contentRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (contentFocusable) {
        contentFocusable.focus();
      } else {
        const anyFocusable = panelRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (anyFocusable) {
          anyFocusable.focus();
        } else {
          panelRef.current.focus();
        }
      }
    }

    return () => {
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    };
  }, [mounted, isDialogOpen, initialFocusRef]);

  // Escape key, focus trapping, and body scroll lock lifecycle
  useEffect(() => {
    if (!isDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusableElements = (): HTMLElement[] => {
      if (!panelRef.current) return [];
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(focusables).filter(
        (el) => el.tabIndex !== -1 && !el.hasAttribute("disabled")
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !panelRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !panelRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDialogOpen, closeOnEsc, onClose]);

  if (!mounted || !isDialogOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-description" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-quizlet-navy/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      data-testid="dialog-backdrop"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl border border-quizlet-border p-6 max-h-[90vh] flex flex-col overflow-hidden outline-none",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeClasses[size],
          className
        )}
        data-testid="dialog-panel"
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-2 text-quizlet-slate-muted hover:text-quizlet-slate hover:bg-quizlet-canvas rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo cursor-pointer"
            data-testid="dialog-close-btn"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {(title || description) && (
          <div className="mb-4 pr-8">
            {title && (
              <h2 id="dialog-title" className="text-xl font-bold text-quizlet-slate">
                {title}
              </h2>
            )}
            {description && (
              <p id="dialog-description" className="mt-1 text-sm text-quizlet-slate-secondary">
                {description}
              </p>
            )}
          </div>
        )}

        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-quizlet-border-light">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-3 mt-6 pt-4 border-t border-quizlet-border-light", className)}
      {...props}
    >
      {children}
    </div>
  );
}
