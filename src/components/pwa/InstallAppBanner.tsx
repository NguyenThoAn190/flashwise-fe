"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Download, Share, X } from "lucide-react";
import { usePWAInstall } from "./usePWAInstall";

export function InstallAppBanner() {
  const t = useTranslations("common.pwa");
  const { visible, platform, canPrompt, install, dismiss } = usePWAInstall();

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      data-testid="pwa-install-banner"
      className="md:hidden fixed bottom-3 inset-x-3 z-50 rounded-2xl border border-quizlet-border-light bg-quizlet-surface shadow-dropdown p-3.5 flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-quizlet-indigo flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-white" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-quizlet-slate">{t("title")}</p>
        <p className="text-xs text-quizlet-slate-secondary leading-relaxed">
          {platform === "ios" ? t("iosHint") : t("desc")}
        </p>

        {platform === "ios" ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-quizlet-indigo">
            <Share className="w-3.5 h-3.5" aria-hidden="true" />
            {t("iosSteps")}
          </p>
        ) : (
          <button
            type="button"
            onClick={install}
            disabled={!canPrompt}
            data-testid="pwa-install-button"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-quizlet-indigo text-white text-xs font-bold hover:bg-quizlet-indigo-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {t("install")}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        data-testid="pwa-install-dismiss"
        className="p-1.5 rounded-lg text-quizlet-slate-muted hover:bg-quizlet-canvas hover:text-quizlet-slate transition-colors cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
