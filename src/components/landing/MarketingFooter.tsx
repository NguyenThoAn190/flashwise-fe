"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function MarketingFooter() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const year = new Date().getFullYear();
  return (
    <footer
      data-testid="landing-footer"
      className="w-full bg-quizlet-navy text-white"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <p className="font-hurme font-bold text-2xl tracking-normal text-white">
            {tCommon("brand")}
          </p>
          <p className="text-sm text-white/70 max-w-xs">
            {t("footerTagline")}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-bold text-white/90">{t("footerProduct")}</p>
          <div className="flex flex-col gap-1.5 text-white/70">
            <Link href="/signup" className="hover:text-white transition-colors">
              {t("createSet")}
            </Link>
            <Link href="/progress" className="hover:text-white transition-colors">
              {t("footerProgress")}
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              {t("login")}
            </Link>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-bold text-white/90">{t("footerCompany")}</p>
          <div className="flex flex-col gap-1.5 text-white/70">
            <span>{tCommon("termsOfService")}</span>
            <span>{tCommon("privacyPolicy")}</span>
            <span>© {year} Flashwise Inc.</span>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-bold text-white/90">{tCommon("language")}</p>
          <LanguageSwitcher
            variant="list"
            showLabel={false}
            className="[&_p]:text-white/90 [&_button]:text-white/70 hover:[&_button]:text-white hover:[&_button]:bg-white/10 [&_button.bg-quizlet-indigo-light]:bg-white/15 [&_button.bg-quizlet-indigo-light]:text-white"
          />
        </div>
      </div>
    </footer>
  );
}
