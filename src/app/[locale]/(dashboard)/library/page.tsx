"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { StudySetGrid } from "@/components/sets/StudySetGrid";
import { useStudySets } from "@/components/sets/useStudySets";
import { Button } from "@/components/ui/Button";
import { Plus, Search, X, LibraryBig } from "lucide-react";

function LibraryContent() {
  const t = useTranslations("library");
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const { items, total, page, totalPages, isLoading, errorMessage, reload, setPage } =
    useStudySets(searchQuery);

  useEffect(() => {
    setSearchQuery((prev) => (prev === urlSearch ? prev : urlSearch));
  }, [urlSearch]);

  return (
    <div
      data-testid="library-page"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8"
    >
      {/* Header: title + create */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-quizlet-slate flex items-center gap-2.5"
            data-testid="library-title"
          >
            <LibraryBig className="w-7 h-7 text-quizlet-indigo" aria-hidden="true" />
            <span>{t("title")}</span>
          </h1>
          <p className="text-sm text-quizlet-slate-secondary">
            {user?.full_name || user?.username
              ? t("subtitleWithName", { name: user.full_name || user.username || "" })
              : t("subtitle")}
          </p>
        </div>
        <Link href="/set/create">
          <Button
            size="md"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            data-testid="library-create-button"
          >
            {t("createSet")}
          </Button>
        </Link>
      </section>

      {/* Search */}
      <section className="flex items-center gap-3">
        <div className="relative flex items-center w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 text-quizlet-slate-muted pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchAria")}
            className="w-full pl-10 pr-9 py-2 bg-white text-sm text-quizlet-slate placeholder-quizlet-slate-muted rounded-xl border border-quizlet-border-light focus:border-quizlet-indigo focus:ring-4 focus:ring-quizlet-indigo/15 outline-none transition-all duration-150"
            data-testid="library-search-input"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={t("clearSearch")}
              className="absolute right-3 p-1 text-quizlet-slate-muted hover:text-quizlet-slate rounded-full cursor-pointer"
              data-testid="library-search-clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
        {total > 0 && !isLoading ? (
          <span
            className="text-sm font-semibold text-quizlet-slate-secondary whitespace-nowrap"
            data-testid="library-count"
          >
            {t("count", { count: total })}
          </span>
        ) : null}
      </section>

      {/* Grid: loading / empty / error / pagination handled inside */}
      <StudySetGrid
        items={items}
        isLoading={isLoading}
        errorMessage={errorMessage}
        total={total}
        page={page}
        totalPages={totalPages}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
        onRetry={reload}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto py-8 px-4 animate-pulse">
            <div className="h-8 w-64 bg-quizlet-border-light rounded-lg" />
          </div>
        }
      >
        <LibraryContent />
      </Suspense>
    </AuthGuard>
  );
}
