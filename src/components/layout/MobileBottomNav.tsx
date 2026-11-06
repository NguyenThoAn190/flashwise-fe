"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Home, LibraryBig, Plus, BarChart3, User } from "lucide-react";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  // Chỉ hiện sau đăng nhập, chỉ trên mobile (md:hidden).
  if (!isAuthenticated) return null;

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "U";

  const tabBase =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo rounded-lg min-w-0";
  const activeCls = "text-quizlet-indigo";
  const inactiveCls = "text-quizlet-slate-secondary hover:text-quizlet-slate";

  const homeActive = isActivePath(pathname, "/");
  const libActive = isActivePath(pathname, "/library");
  const progActive = isActivePath(pathname, "/progress");
  const meActive = isActivePath(pathname, "/settings");

  return (
    <nav
      aria-label={t("bottomBarAria")}
      data-testid="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-quizlet-border-light shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <div className="flex items-stretch px-1 pt-1">
        <Link
          href="/"
          aria-current={homeActive ? "page" : undefined}
          data-testid="bottom-nav-home"
          className={`${tabBase} ${homeActive ? activeCls : inactiveCls}`}
        >
          <Home className="w-5 h-5" aria-hidden="true" />
          <span className="truncate max-w-full">{t("bottomHome")}</span>
        </Link>

        <Link
          href="/library"
          aria-current={libActive ? "page" : undefined}
          data-testid="bottom-nav-library"
          className={`${tabBase} ${libActive ? activeCls : inactiveCls}`}
        >
          <LibraryBig className="w-5 h-5" aria-hidden="true" />
          <span className="truncate max-w-full">{t("bottomLibrary")}</span>
        </Link>

        {/* Nút Tạo nổi giữa */}
        <div className="flex flex-1 flex-col items-center justify-center min-w-0">
          <Link
            href="/set/create"
            aria-label={t("bottomCreate")}
            data-testid="bottom-nav-create"
            className="flex items-center justify-center w-12 h-12 -translate-y-4 rounded-full bg-quizlet-indigo text-white shadow-lg border-4 border-quizlet-canvas hover:bg-quizlet-indigo-hover active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo focus-visible:ring-offset-2"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
          </Link>
          <span className="-mt-3 text-[11px] font-bold text-quizlet-slate-secondary">
            {t("bottomCreate")}
          </span>
        </div>

        <Link
          href="/progress"
          aria-current={progActive ? "page" : undefined}
          data-testid="bottom-nav-progress"
          className={`${tabBase} ${progActive ? activeCls : inactiveCls}`}
        >
          <BarChart3 className="w-5 h-5" aria-hidden="true" />
          <span className="truncate max-w-full">{t("bottomProgress")}</span>
        </Link>

        <Link
          href="/settings"
          aria-current={meActive ? "page" : undefined}
          data-testid="bottom-nav-profile"
          className={`${tabBase} ${meActive ? activeCls : inactiveCls}`}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-5 h-5 rounded-full object-cover border border-quizlet-border"
            />
          ) : (
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold border ${
                meActive
                  ? "bg-quizlet-indigo text-white border-quizlet-indigo"
                  : "bg-quizlet-indigo-light text-quizlet-indigo border-quizlet-indigo-border"
              }`}
              aria-hidden="true"
            >
              {initials}
            </span>
          )}
          <span className="truncate max-w-full flex items-center gap-1">
            <User className="w-3 h-3 hidden" aria-hidden="true" />
            {t("bottomProfile")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
