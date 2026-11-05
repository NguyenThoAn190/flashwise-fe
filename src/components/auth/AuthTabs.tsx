"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { getLocalePrefixFromPath } from "@/lib/utils/authValidation";

export interface AuthTabsProps {
  activeTab: "login" | "signup";
  redirectParam?: string | null;
}

export function AuthTabs({ activeTab, redirectParam }: AuthTabsProps) {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const querySuffix = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const localePrefix = getLocalePrefixFromPath(pathname);
  const loginHref = `${localePrefix}/login${querySuffix}`;
  const signupHref = `${localePrefix}/signup${querySuffix}`;

  return (
    <div
      role="tablist"
      aria-label={t("authOptions")}
      className="flex border-b-2 border-quizlet-border mb-6"
    >
      <Link
        href={loginHref}
        role="tab"
        id="auth-tab-login"
        aria-selected={activeTab === "login"}
        aria-controls="auth-panel-login"
        className={cn(
          "flex-1 pb-3 text-center text-base font-bold tracking-wide transition-all relative select-none",
          activeTab === "login"
            ? "text-quizlet-indigo"
            : "text-quizlet-slate-muted hover:text-quizlet-slate"
        )}
      >
        {t("loginTab")}
        {activeTab === "login" && (
          <span
            className="absolute -bottom-[2px] left-0 right-0 h-1 bg-quizlet-indigo rounded-full"
            aria-hidden="true"
          />
        )}
      </Link>

      <Link
        href={signupHref}
        role="tab"
        id="auth-tab-signup"
        aria-selected={activeTab === "signup"}
        aria-controls="auth-panel-signup"
        className={cn(
          "flex-1 pb-3 text-center text-base font-bold tracking-wide transition-all relative select-none",
          activeTab === "signup"
            ? "text-quizlet-indigo"
            : "text-quizlet-slate-muted hover:text-quizlet-slate"
        )}
      >
        {t("signupTab")}
        {activeTab === "signup" && (
          <span
            className="absolute -bottom-[2px] left-0 right-0 h-1 bg-quizlet-indigo rounded-full"
            aria-hidden="true"
          />
        )}
      </Link>
    </div>
  );
}
