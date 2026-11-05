"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface DropdownItemProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  className?: string;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  children?: React.ReactNode;
  items?: DropdownItemProps[];
  align?: "left" | "right";
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({
  trigger,
  children,
  items,
  align = "left",
  className,
  isOpen: controlledIsOpen,
  onOpenChange,
}: DropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(next);
    }
    onOpenChange?.(next);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!menuRef.current) return;
      const menuItems = Array.from(
        menuRef.current.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])')
      );
      if (menuItems.length === 0) return;
      const currentIndex = menuItems.findIndex((item) => item === document.activeElement);
      if (e.key === "ArrowDown") {
        const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        menuItems[nextIndex]?.focus();
      } else {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        menuItems[prevIndex]?.focus();
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex items-center justify-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo rounded-lg leading-5"
        data-testid="dropdown-trigger"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          data-testid="dropdown-menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute top-full mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-quizlet-border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {items
            ? items.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  role="menuitem"
                  tabIndex={0}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick?.();
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!item.disabled) {
                        item.onClick?.();
                        setIsOpen(false);
                        triggerRef.current?.focus();
                      }
                    }
                  }}
                  className={cn(
                    "w-full px-3.5 py-2.5 text-sm font-medium flex items-center gap-2.5 rounded-lg cursor-pointer transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo",
                    item.variant === "danger"
                      ? "text-quizlet-coral hover:bg-quizlet-coral-bg hover:text-quizlet-coral"
                      : "text-quizlet-slate hover:bg-quizlet-canvas hover:text-quizlet-indigo",
                    item.className
                  )}
                >
                  {item.icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </button>
              ))
            : children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  label,
  icon,
  onClick,
  variant = "default",
  disabled = false,
  className,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={0}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) {
            onClick?.();
          }
        }
      }}
      className={cn(
        "w-full px-3.5 py-2.5 text-sm font-medium flex items-center gap-2.5 rounded-lg cursor-pointer transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo",
        variant === "danger"
          ? "text-quizlet-coral hover:bg-quizlet-coral-bg hover:text-quizlet-coral"
          : "text-quizlet-slate hover:bg-quizlet-canvas hover:text-quizlet-indigo",
        className
      )}
    >
      {icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="flex-1">{label}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="h-px bg-quizlet-border-light my-1" role="separator" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
      {children}
    </div>
  );
}
