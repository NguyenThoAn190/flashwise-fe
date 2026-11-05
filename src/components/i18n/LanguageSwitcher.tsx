"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type AppLocale } from "@/i18n/routing";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LanguageSwitcherProps {
  /**
   * `icon` — nút globe compact, dùng trên navbar desktop.
   * `list`  — danh sách dọc đầy đủ, dùng trong mobile drawer.
   */
  variant?: "icon" | "list";
  className?: string;
  /** Ẩn nhãn "Ngôn ngữ" bên trong (khi cha đã render tiêu đề riêng, vd. footer). */
  showLabel?: boolean;
  onLocaleChange?: (locale: AppLocale) => void;
}

/**
 * Đổi ngôn ngữ mà vẫn giữ nguyên subpath + query string hiện tại.
 *
 * `useRouter`/`usePathname` của next-intl tự động:
 *  - thêm prefix locale vào URL (vd. `/vi/progress`)
 *  - đồng bộ cookie `NEXT_LOCALE` để request sau giữ đúng locale
 *  - không làm mất các query param (vd. `?search=biology`)
 */
export function LanguageSwitcher({
  variant = "icon",
  className,
  showLabel = true,
  onLocaleChange,
}: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentName = useMemo(
    () => localeNames[locale] ?? locale,
    [locale]
  );

  const handleSelect = (nextLocale: AppLocale) => {
    setIsOpen(false);
    onLocaleChange?.(nextLocale);

    if (nextLocale === locale) return;

    startTransition(() => {
      // `pathname` đã được next-intl bỏ prefix locale sẵn,
      // nên truyền vào cùng lúc sẽ giữ đúng subpath hiện tại.
      router.replace(pathname, { locale: nextLocale });
    });
  };

  if (variant === "list") {
    return (
      <div
        className={cn("flex flex-col gap-1", className)}
        data-testid="language-switcher-list"
      >
        {showLabel ? (
          <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-quizlet-slate-muted">
            {t("language")}
          </p>
        ) : null}
        {locales.map((code) => {
          const isActive = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleSelect(code)}
              aria-current={isActive ? "true" : undefined}
              data-testid={`language-option-${code}`}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-left w-full",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo",
                isActive
                  ? "text-quizlet-indigo bg-quizlet-indigo-light font-bold"
                  : "text-quizlet-slate hover:bg-quizlet-canvas hover:text-quizlet-indigo"
              )}
            >
              <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                {isActive ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : null}
              </span>
              <span className="flex-1">{localeNames[code]}</span>
              {isActive ? (
                <span className="sr-only">{t("currentLanguage")}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} data-testid="language-switcher">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("changeLanguage")}
        title={t("changeLanguage")}
        data-testid="language-switcher-trigger"
        className={cn(
          "h-9 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-quizlet-slate",
          "font-sans text-sm font-semibold leading-5 tracking-normal whitespace-nowrap",
          "hover:bg-quizlet-canvas hover:text-quizlet-indigo transition-colors cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo",
          isPending && "opacity-60"
        )}
      >
        <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="hidden lg:inline whitespace-nowrap leading-none">
          {currentName}
        </span>
      </button>

      {isOpen ? (
        <>
          {/* Overlay đóng menu khi click ra ngoài */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="menu"
            aria-label={t("language")}
            data-testid="language-switcher-menu"
            className="absolute right-0 top-full mt-2 z-50 w-52 bg-white rounded-xl shadow-dropdown border border-quizlet-border py-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {locales.map((code) => {
              const isActive = code === locale;
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => handleSelect(code)}
                  data-testid={`language-option-${code}`}
                  className={cn(
                    "w-full px-3.5 py-2 text-sm font-medium flex items-center gap-2.5 rounded-lg",
                    "cursor-pointer transition-colors text-left",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo",
                    isActive
                      ? "text-quizlet-indigo bg-quizlet-indigo-light font-bold"
                      : "text-quizlet-slate hover:bg-quizlet-canvas hover:text-quizlet-indigo"
                  )}
                >
                  <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                    {isActive ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className="flex-1">{localeNames[code]}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
