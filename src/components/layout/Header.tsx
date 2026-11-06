"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";
import { useHasTokenHint } from "@/lib/auth/useHasTokenHint";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/Dropdown";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { MobileDrawer } from "./MobileDrawer";
import { BrandLogo } from "./BrandLogo";
import { StudyToolsMenu } from "./StudyToolsMenu";
import {
  Search,
  Plus,
  Flame,
  Menu,
  Layers,
  FolderPlus,
  Settings,
  Sparkles,
  LogOut,
  ChevronDown,
} from "lucide-react";

export interface HeaderProps {
  onSearch?: (query: string) => void;
  className?: string;
}

export function Header({ onSearch, className }: HeaderProps) {
  const t = useTranslations("nav");
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const hasTokenHint = useHasTokenHint();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Maybe-authed first paint (token cookie existed, profile verifying):
  // reserve the authed action width so header -> dashboard swap has no CLS.
  // Guest/SEO path (no hint) keeps the public login/signup actions.
  const showAuthedActions =
    isAuthenticated || (isLoading && hasTokenHint === true);

  const streak = user?.stats?.current_streak ?? 0;
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "U";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (onSearch) {
      onSearch(trimmed);
    } else if (isAuthenticated) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    } else if (trimmed) {
      router.push(`/signup?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/signup");
    }
  };

  return (
    <>
      <header
        role="banner"
        className={`sticky top-0 z-40 w-full bg-white border-b border-quizlet-border-light shadow-xs font-sans antialiased ${
          className || ""
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4 font-sans text-sm antialiased">
          {/* Left: Mobile Toggle & Logo & Desktop Nav Links */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label={t("openMenu")}
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-nav-drawer"
              className="md:hidden p-2 text-quizlet-slate hover:bg-quizlet-canvas rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo cursor-pointer"
              data-testid="mobile-menu-trigger"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo (full) */}
            <Link
              href="/"
              className="flex items-center shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo rounded-lg select-none"
              aria-label={t("brandHome")}
            >
              <BrandLogo variant="full" priority height={38} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 font-sans text-sm font-semibold tracking-normal text-quizlet-slate antialiased">
              <Link
                href="/"
                className="h-9 inline-flex items-center justify-center px-3 rounded-lg text-sm font-semibold leading-5 whitespace-nowrap hover:text-quizlet-indigo hover:bg-quizlet-canvas transition-colors"
              >
                {t("home")}
              </Link>
              {/* Công cụ học chỉ hiện khi chưa đăng nhập */}
              {!showAuthedActions ? <StudyToolsMenu /> : null}
              {/* Thư viện + Tiến độ chỉ hiện khi đã đăng nhập — menu công khai không có */}
              {showAuthedActions ? (
                <>
                  <Link
                    href="/library"
                    className="h-9 inline-flex items-center justify-center px-3 rounded-lg text-sm font-semibold leading-5 whitespace-nowrap hover:text-quizlet-indigo hover:bg-quizlet-canvas transition-colors"
                  >
                    {t("library")}
                  </Link>
                  <Link
                    href="/progress"
                    className="h-9 inline-flex items-center justify-center px-3 rounded-lg text-sm font-semibold leading-5 whitespace-nowrap hover:text-quizlet-indigo hover:bg-quizlet-canvas transition-colors"
                    data-testid="header-progress-link"
                  >
                    {t("progress")}
                  </Link>
                </>
              ) : null}
            </nav>
          </div>

          {/* Center: Search Bar (Desktop / Tablet) */}
          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-md lg:max-w-xl mx-2 hidden sm:block"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-quizlet-slate-muted pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAria")}
                className="w-full h-9 pl-10 pr-4 bg-quizlet-canvas hover:bg-white focus:bg-white font-sans text-sm font-normal leading-5 tracking-normal text-quizlet-slate placeholder-quizlet-slate-muted rounded-xl border border-quizlet-border-light focus:border-quizlet-indigo focus:ring-4 focus:ring-quizlet-indigo/15 outline-none transition-all duration-150"
                data-testid="header-search-input"
              />
            </div>
          </form>

          {/* Right: Actions, Streak Badge, Create Dropdown, User Menu */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language Switcher — ẩn trên mobile, mobile dùng bản list trong drawer */}
            <div className="hidden md:flex md:items-center">
              <LanguageSwitcher variant="icon" />
            </div>

            {/* Create Dropdown — chỉ hiện khi đã đăng nhập.
                Maybe-authed (đang verify): giữ placeholder cùng kích thước
                để không CLS khi nút thật mount. */}
            {showAuthedActions && !user ? (
              <div
                aria-hidden="true"
                data-testid="header-create-skeleton"
                className="h-8 w-8 sm:w-[92px] rounded-lg bg-quizlet-canvas animate-pulse shrink-0"
              />
            ) : null}
            {isAuthenticated && (
            <Dropdown
              align="right"
              trigger={
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  data-testid="header-create-button"
                  className="h-8 w-8 px-0 sm:w-auto sm:px-3 gap-0 sm:gap-1.5 shrink-0"
                >
                  <span className="hidden sm:inline">{t("create")}</span>
                </Button>
              }
              items={[
                {
                  label: t("studySet"),
                  icon: <Layers className="w-4 h-4 text-quizlet-indigo" />,
                  onClick: () => router.push("/set/create"),
                },
                {
                  label: t("folder"),
                  icon: <FolderPlus className="w-4 h-4 text-quizlet-slate-muted" />,
                  onClick: () => {},
                },
              ]}
            />
            )}

            {/* Streak Counter Badge */}
            {showAuthedActions && !user ? (
              <div
                aria-hidden="true"
                data-testid="header-streak-skeleton"
                className="h-8 w-14 rounded-full bg-quizlet-canvas animate-pulse shrink-0"
              />
            ) : null}
            {isAuthenticated && (
              <div
                className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold select-none cursor-default shrink-0"
                aria-label={t("streakBadge", { count: streak })}
                title={t("streakBadge", { count: streak })}
                data-testid="header-streak-badge"
              >
                <Flame className="w-4 h-4 text-quizlet-warning fill-quizlet-warning shrink-0" aria-hidden="true" />
                <span className="leading-none">{streak}</span>
              </div>
            )}

            {/* User Profile Dropdown or Auth Links.
                Maybe-authed chưa có user: avatar placeholder cùng kích thước,
                ẩn login/signup để không swap gây CLS. */}
            {showAuthedActions && !user ? (
              <div
                aria-hidden="true"
                data-testid="header-avatar-skeleton"
                className="h-8 w-8 rounded-full bg-quizlet-canvas animate-pulse shrink-0"
              />
            ) : null}
            {isAuthenticated ? (
              <Dropdown
                align="right"
                isOpen={isProfileOpen}
                onOpenChange={setIsProfileOpen}
                trigger={
                  <div
                    className="flex items-center justify-center gap-1 h-8 min-w-8 rounded-full hover:bg-quizlet-canvas transition-colors cursor-pointer select-none shrink-0"
                    data-testid="header-avatar-trigger"
                    aria-label={t("userMenu")}
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "User avatar"}
                        className="w-8 h-8 rounded-full object-cover border border-quizlet-border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-quizlet-indigo-light text-quizlet-indigo font-bold text-xs flex items-center justify-center border border-quizlet-indigo-border">
                        {initials}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-quizlet-slate-muted hidden sm:inline-block" />
                  </div>
                }
              >
                {/* User Info Header Card */}
                <div className="px-3.5 py-2.5 border-b border-quizlet-border-light">
                  <div className="flex items-center gap-2.5">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-quizlet-border shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-quizlet-indigo-light text-quizlet-indigo font-bold text-sm flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="overflow-hidden min-w-0">
                      <p className="font-bold text-sm text-quizlet-slate truncate">
                        {user?.full_name || user?.username || "…"}
                      </p>
                      {user?.username && (
                        <p className="text-xs text-quizlet-slate-secondary truncate">
                          @{user.username}
                        </p>
                      )}
                      <p className="text-xs text-quizlet-slate-muted truncate">
                        {user?.email || "…"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dropdown Items */}
                <DropdownItem
                  label={t("settings")}
                  icon={<Settings className="w-4 h-4" />}
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/settings");
                  }}
                />
                <DropdownItem
                  label={t("progress")}
                  icon={<Sparkles className="w-4 h-4 text-quizlet-indigo" />}
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/progress");
                  }}
                />
                <DropdownDivider />
                <DropdownItem
                  label={t("logout")}
                  icon={<LogOut className="w-4 h-4" />}
                  variant="danger"
                  className="data-logout-button"
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await logout();
                  }}
                />
              </Dropdown>
            ) : showAuthedActions ? (
              // Maybe-authed verifying: skeletons above already reserve width.
              // Render nothing else so login/signup never flash mid-verify.
              null
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="h-9 px-3 text-sm font-semibold leading-5 whitespace-nowrap inline-flex items-center justify-center select-none rounded-lg gap-1.5 bg-transparent text-quizlet-slate border border-transparent hover:bg-quizlet-canvas hover:text-quizlet-indigo active:bg-quizlet-border-light transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo focus-visible:ring-offset-2"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/signup"
                  className="h-9 px-3 text-sm font-semibold leading-5 whitespace-nowrap inline-flex items-center justify-center select-none rounded-lg gap-1.5 bg-quizlet-indigo text-white hover:bg-quizlet-indigo-hover shadow-sm border border-transparent transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  {t("signup")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Sheet */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        streak={streak}
        onLogout={logout}
        onSearch={onSearch}
      />
    </>
  );
}
