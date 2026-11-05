"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserProfile } from "@/types/auth";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { BrandLogo } from "./BrandLogo";
import {
  X,
  Search,
  Plus,
  Home,
  BookOpen,
  Sparkles,
  Settings,
  LogOut,
  Flame,
  Layers,
  Brain,
  ClipboardCheck,
  Users,
  Radio,
  Clock,
} from "lucide-react";

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  streak: number;
  onLogout: () => Promise<void>;
  onSearch?: (query: string) => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  user,
  streak,
  onLogout,
  onSearch,
}: MobileDrawerProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // 1. Body Scroll Locking
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // Auto-focus close button on open
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 0);

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 2. Escape Key Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 3. Focus Trapping within Drawer
  const handleKeyDownTrap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !drawerRef.current) return;

    const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;

    const firstElement = focusables[0];
    const lastElement = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  if (!isOpen) return null;

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "U";

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value;
    if (input && input.trim()) {
      const q = input.trim();
      if (onSearch) {
        onSearch(q);
      } else if (user) {
        router.push(`/?search=${encodeURIComponent(q)}`);
      } else {
        router.push(`/signup?search=${encodeURIComponent(q)}`);
      }
      onClose();
    } else if (!user) {
      router.push("/signup");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex md:hidden"
      onKeyDown={handleKeyDownTrap}
      data-testid="mobile-drawer-portal"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-quizlet-slate/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
        data-testid="mobile-drawer-backdrop"
      />

      {/* Slide-out Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        id="mobile-nav-drawer"
        aria-modal="true"
        aria-label={t("navMenu")}
        className="relative z-50 w-[300px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200"
      >
        <div className="p-4 flex flex-col gap-4">
          {/* Header row: Logo & Close */}
          <div className="flex items-center justify-between pb-3 border-b border-quizlet-border-light">
            <BrandLogo height={28} />
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label={t("closeMenu")}
              className="p-1.5 text-quizlet-slate-secondary hover:text-quizlet-slate hover:bg-quizlet-canvas rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo cursor-pointer"
              data-testid="mobile-drawer-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-quizlet-slate-muted pointer-events-none" />
              <input
                name="q"
                type="search"
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAria")}
                className="w-full pl-9 pr-3 py-2 bg-quizlet-canvas text-sm text-quizlet-slate rounded-lg border border-quizlet-border-light outline-none focus:border-quizlet-indigo"
              />
            </div>
          </form>

          {/* Create Button in Drawer — chỉ hiện khi đã đăng nhập */}
          {user && (
          <Button
            size="md"
            variant="primary"
            fullWidth
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              router.push("/set/create");
              onClose();
            }}
          >
            {t("createStudySet")}
          </Button>
          )}

          {/* Navigation Items: Công cụ học nhóm Học sinh / Giáo viên */}
          <nav className="flex flex-col gap-1 py-2 text-sm font-semibold text-quizlet-slate">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
            >
              <Home className="w-4 h-4 text-quizlet-slate-secondary" />
              <span>{t("home")}</span>
            </Link>

            <p className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
              {t("forStudents")}
            </p>
            <Link
              href="/tools/flashcards"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
            >
              <Layers className="w-4 h-4 text-quizlet-indigo" />
              <span>{t("toolsFlashcards")}</span>
            </Link>
            <Link
              href="/tools/learn"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
            >
              <Brain className="w-4 h-4 text-quizlet-green" />
              <span>{t("toolsLearn")}</span>
            </Link>
            <Link
              href="/tools/srs"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
            >
              <Clock className="w-4 h-4 text-quizlet-warning" />
              <span>{t("toolsSRS")}</span>
            </Link>
            <Link
              href="/tools/progress"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
            >
              <Sparkles className="w-4 h-4 text-quizlet-indigo" />
              <span>{t("studyProgress")}</span>
            </Link>
            <Link
              href="/tools/test"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
            >
              <ClipboardCheck className="w-4 h-4 text-quizlet-slate-secondary" />
              <span>{t("toolsTest")}</span>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-quizlet-canvas text-quizlet-slate-muted">
                {t("comingSoon")}
              </span>
            </Link>
            <Link
              href="/tools/groups"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
            >
              <Users className="w-4 h-4 text-quizlet-slate-secondary" />
              <span>{t("toolsGroups")}</span>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-quizlet-canvas text-quizlet-slate-muted">
                {t("comingSoon")}
              </span>
            </Link>

            <p className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
              {t("forTeachers")}
            </p>
            <Link
              href="/tools/live"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
            >
              <Radio className="w-4 h-4 text-quizlet-slate-secondary" />
              <span>{t("toolsLive")}</span>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-quizlet-canvas text-quizlet-slate-muted">
                {t("comingSoon")}
              </span>
            </Link>

            {/* Thư viện chỉ hiện khi đã đăng nhập */}
            {user ? (
              <Link
                href="/progress"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors"
              >
                <BookOpen className="w-4 h-4 text-quizlet-slate-secondary" />
                <span>{t("library")}</span>
              </Link>
            ) : null}
          </nav>

          {/* Language Switcher — bản list cho mobile */}
          <div className="border-t border-quizlet-border-light pt-3">
            <LanguageSwitcher variant="list" onLocaleChange={onClose} />
          </div>
        </div>

        {/* Footer Area: User Profile Card & Sign Out / Auth Links */}
        <div className="p-4 border-t border-quizlet-border-light bg-quizlet-surface-hover flex flex-col gap-3">
          {user ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-quizlet-border shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-quizlet-indigo-light text-quizlet-indigo font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="overflow-hidden min-w-0">
                    <p className="font-bold text-xs text-quizlet-slate truncate">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-[11px] text-quizlet-slate-muted truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Streak Badge in Drawer */}
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shrink-0 select-none cursor-default"
                  aria-label={t("streakBadge", { count: streak })}
                >
                  <Flame className="w-3.5 h-3.5 text-quizlet-warning fill-quizlet-warning" />
                  <span>{streak}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 pt-1">
                <Link
                  href="/settings"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-quizlet-slate-secondary hover:text-quizlet-indigo rounded transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t("settings")}</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    onClose();
                    await onLogout();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-quizlet-coral hover:bg-quizlet-coral-bg rounded transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("logout")}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login" onClick={onClose}>
                <Button size="sm" variant="ghost" fullWidth>
                  {t("login")}
                </Button>
              </Link>
              <Link href="/signup" onClick={onClose}>
                <Button size="sm" variant="primary" fullWidth>
                  {t("signup")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
