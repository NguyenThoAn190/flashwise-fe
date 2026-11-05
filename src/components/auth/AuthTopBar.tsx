"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { BrandLogo } from "@/components/layout/BrandLogo";

/**
 * Thanh top cho trang auth (login/signup).
 * Tách thành client component riêng vì `AuthLayout` là server component —
 * không được gọi `useTranslations()` trực tiếp ở đó.
 */
export function AuthTopBar() {
  const t = useTranslations("common");

  return (
    <header className="w-full px-6 py-5 flex items-center justify-between border-b border-quizlet-border-light bg-quizlet-surface/80 backdrop-blur-sm sm:border-transparent sm:bg-transparent">
      <Link
        href="/"
        className="inline-flex items-center gap-2 group transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo rounded-lg"
        aria-label={t("brandHome")}
      >
        <BrandLogo priority height={30} />
      </Link>

      {/* Language switcher — trang đăng nhập không dùng Header chung */}
      <LanguageSwitcher variant="icon" />
    </header>
  );
}
