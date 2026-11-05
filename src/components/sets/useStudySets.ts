"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";
import { apiGetStudySets } from "@/lib/api/studySets";
import type { StudySet, StudySetPagination } from "@/types/studySet";

export const LIBRARY_PAGE_SIZE = 24;

export interface UseStudySetsResult {
  items: StudySet[];
  total: number;
  pagination: StudySetPagination | undefined;
  page: number;
  totalPages: number;
  isLoading: boolean;
  errorMessage: string | null;
  reload: () => void;
  setPage: (page: number) => void;
}

/**
 * Shared hook for "my study sets" lists.
 * Library page and Dashboard both consume this so fetch/loading/empty
 * states stay consistent. MVP only supports filter=mine + search because
 * backend has no real `starred` filter (postgres/memory repos ignore it).
 */
export function useStudySets(search: string, filter: "mine" = "mine"): UseStudySetsResult {
  const t = useTranslations("dashboard");
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<StudySet[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState<StudySetPagination | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  // Reset to first page whenever the search keyword or filter changes.
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setItems([]);
      setTotal(0);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    apiGetStudySets({
      filter,
      search: search.trim() || undefined,
      page,
      page_size: LIBRARY_PAGE_SIZE,
    })
      .then((response) => {
        if (cancelled) return;
        setItems(response.items || []);
        setTotal(response.total ?? response.items?.length ?? 0);
        setPagination(response.pagination);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : t("loadError");
        setErrorMessage(message || t("loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, search, filter, page, reloadKey, t]);

  const totalPages =
    pagination?.total_pages ??
    (total > 0 ? Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE)) : 1);

  return { items, total, pagination, page, totalPages, isLoading, errorMessage, reload, setPage };
}
