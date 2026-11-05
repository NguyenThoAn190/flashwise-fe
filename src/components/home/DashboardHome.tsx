"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";
import {
  apiGetStudySets,
  apiGetDueReviews,
  apiUpdateStudySet,
} from "@/lib/api/studySets";
import { StudySet, StudySetFilter, DueReviewsSummary } from "@/types/studySet";
import { DueReviewsBanner } from "@/components/layout/DueReviewsBanner";
import { StudySetCard, StudySetCardSkeleton, EmptyStudySets } from "@/components/sets";
import { Button } from "@/components/ui/Button";
import { Plus, Flame, Search, X, AlertCircle, RefreshCw } from "lucide-react";

const TABS: Array<{ key: StudySetFilter; labelKey: string; testId: string }> = [
  { key: "mine", labelKey: "tabCreated", testId: "tab-created" },
  { key: "recent", labelKey: "tabRecent", testId: "tab-recent" },
  { key: "all", labelKey: "tabAll", testId: "tab-all" },
];

export function DashboardHome() {
  const t = useTranslations("dashboard");
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [activeTab, setActiveTab] = useState<StudySetFilter>("mine");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [dueReviews, setDueReviews] = useState<DueReviewsSummary | null>(null);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [isLoadingDue, setIsLoadingDue] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery !== null && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadStudySets = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingSets(true);
    setErrorMessage(null);
    try {
      const response = await apiGetStudySets({
        filter: activeTab,
        search: searchQuery.trim() || undefined,
      });
      setStudySets(response.items || []);
    } catch (err: any) {
      setErrorMessage(err?.message || t("loadError"));
    } finally {
      setIsLoadingSets(false);
    }
  }, [activeTab, searchQuery, isAuthenticated, t]);

  const loadDueReviews = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingDue(true);
    try {
      const data = await apiGetDueReviews();
      setDueReviews(data);
    } catch {
      setDueReviews(null);
    } finally {
      setIsLoadingDue(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingSets(false);
      setIsLoadingDue(false);
      return;
    }
    loadStudySets();
  }, [loadStudySets, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadDueReviews();
  }, [loadDueReviews, isAuthenticated]);

  const handleToggleStar = async (id: string, nextStarred: boolean) => {
    setStudySets((prev) =>
      prev.map((set) => (set.id === id ? { ...set, is_starred: nextStarred } : set))
    );

    try {
      await apiUpdateStudySet(id, { is_starred: nextStarred });
    } catch {
      setStudySets((prev) =>
        prev.map((set) => (set.id === id ? { ...set, is_starred: !nextStarred } : set))
      );
    }
  };

  const streak = user?.stats?.current_streak ?? 0;
  const firstName = user?.full_name ? user.full_name.split(" ")[0] : user?.username || "Student";

  return (
    <div
      data-testid="dashboard-home"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8"
    >
      <section
        className="bg-white rounded-2xl border border-quizlet-border-light p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
        data-testid="dashboard-welcome-banner"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="font-hurme text-2xl sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight">
              {t("welcome", { name: firstName })}
            </h1>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold select-none cursor-default"
              aria-label={t("streak", { count: streak })}
              data-testid="dashboard-streak-counter"
            >
              <Flame className="w-4 h-4 text-quizlet-warning fill-quizlet-warning" aria-hidden="true" />
              <span>{t("streak", { count: streak })}</span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-quizlet-slate-secondary">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/set/create">
            <Button
              size="md"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              data-testid="dashboard-quick-create-btn"
            >
              {t("createSet")}
            </Button>
          </Link>
        </div>
      </section>

      <DueReviewsBanner
        dueCount={dueReviews?.due_count ?? 0}
        isLoading={isLoadingDue}
      />

      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-quizlet-border-light">
        <div
          role="tablist"
          aria-label={t("filterTabs")}
          className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo ${
                  isActive
                    ? "bg-quizlet-slate text-white shadow-xs"
                    : "text-quizlet-slate-secondary hover:text-quizlet-slate hover:bg-quizlet-surface-hover"
                }`}
                data-testid={tab.testId}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="relative flex items-center w-full sm:w-72 lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 text-quizlet-slate-muted pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("filterPlaceholder")}
            aria-label={t("filterAria")}
            className="w-full pl-10 pr-9 py-2 bg-white text-sm text-quizlet-slate placeholder-quizlet-slate-muted rounded-xl border border-quizlet-border-light focus:border-quizlet-indigo focus:ring-4 focus:ring-quizlet-indigo/15 outline-none transition-all duration-150"
            data-testid="dashboard-search-input"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={t("clearFilter")}
              className="absolute right-3 p-1 text-quizlet-slate-muted hover:text-quizlet-slate rounded-full cursor-pointer"
              data-testid="dashboard-search-clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </section>

      <section className="w-full">
        {errorMessage ? (
          <div
            role="alert"
            className="w-full rounded-2xl bg-quizlet-coral-bg border border-quizlet-coral-border p-6 text-center flex flex-col items-center gap-3 my-4"
            data-testid="dashboard-error-alert"
          >
            <AlertCircle className="w-8 h-8 text-quizlet-coral" />
            <h4 className="text-base font-bold text-quizlet-slate">{t("somethingWrong")}</h4>
            <p className="text-sm text-quizlet-slate-secondary max-w-md">{errorMessage}</p>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={loadStudySets}
              data-testid="dashboard-retry-button"
            >
              {t("tryAgain")}
            </Button>
          </div>
        ) : isLoadingSets ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="study-sets-grid-loading"
          >
            <StudySetCardSkeleton count={6} />
          </div>
        ) : studySets.length === 0 ? (
          <EmptyStudySets
            filter={activeTab}
            searchQuery={searchQuery}
            onClearFilters={() => setSearchQuery("")}
          />
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="study-sets-grid"
          >
            {studySets.map((studySet) => (
              <StudySetCard
                key={studySet.id}
                studySet={studySet}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
