/**
 * PlayGrid API Gateway Study Sets & Review Statistics Client Module
 * Provides typed methods for Study Sets CRUD, list filtering, and spaced repetition review stats.
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import {
  StudySet,
  StudySetDetail,
  StudySetListParams,
  StudySetListResponse,
  DueReviewsSummary,
  CreateStudySetPayload,
  UpdateStudySetPayload,
  Flashcard,
  SetVisibility,
  CreatorSummary,
} from "@/types/studySet";

/**
 * Normalizes a raw StudySet response to ensure uniform fields
 */
export function normalizeStudySet(raw: any): StudySet {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid study set data received");
  }

  const cardCount =
    typeof raw.card_count === "number"
      ? raw.card_count
      : typeof raw.total_cards === "number"
      ? raw.total_cards
      : Array.isArray(raw.cards)
      ? raw.cards.length
      : 0;

  const visibility: SetVisibility =
    raw.visibility === "private" || raw.visibility === 3
      ? "private"
      : raw.visibility === "unlisted" || raw.visibility === 2
      ? "unlisted"
      : "public";

  const isPublic =
    raw.is_public !== undefined ? Boolean(raw.is_public) : visibility === "public";

  let creator: CreatorSummary | undefined = raw.creator;
  if (!creator && (raw.creator_name || raw.creator_id || raw.creator_avatar_url)) {
    creator = {
      id: raw.creator_id,
      name: raw.creator_name || "Anonymous",
      avatar_url: raw.creator_avatar_url,
    };
  } else if (!creator && raw.owner) {
    creator = {
      id: raw.owner.id,
      name: raw.owner.name || "Anonymous",
      avatar_url: raw.owner.avatar_url,
    };
  }

  const creatorName =
    creator?.name ||
    raw.creator_name ||
    raw.owner?.name ||
    (raw.creator_id ? "User" : "Anonymous");

  const creatorAvatarUrl =
    creator?.avatar_url || raw.creator_avatar_url || raw.owner?.avatar_url;

  return {
    ...raw,
    id: String(raw.id),
    title: raw.title || "",
    description: raw.description || "",
    card_count: cardCount,
    total_cards: cardCount,
    visibility,
    is_public: isPublic,
    user_id: raw.user_id || raw.creator_id || creator?.id,
    creator_id: raw.creator_id || raw.user_id || creator?.id,
    creator_name: creatorName,
    creator_avatar_url: creatorAvatarUrl,
    creator,
    is_starred: Boolean(raw.is_starred),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),
  };
}

/**
 * Normalizes a raw StudySetDetail response
 */
export function normalizeStudySetDetail(raw: any): StudySetDetail {
  const base = raw.study_set ? { ...raw.study_set, ...raw } : raw;
  const set = normalizeStudySet(base);
  const rawCards = Array.isArray(raw.cards)
    ? raw.cards
    : Array.isArray(base.cards)
    ? base.cards
    : [];

  const cards: Flashcard[] = rawCards.map((c: any, index: number) => ({
    id: String(c.id || `card_${set.id}_${index}`),
    study_set_id: set.id,
    front_content: c.front_content || c.front_text || "",
    back_content: c.back_content || c.back_text || "",
    front_text: c.front_text || c.front_content || "",
    back_text: c.back_text || c.back_content || "",
    position: typeof c.position === "number" ? c.position : index,
    hint: c.hint,
    explanation: c.explanation,
    state: c.state || c.user_state || "not_studied",
    next_review_at: c.next_review_at,
    interval_days: c.interval_days,
    ease_factor: c.ease_factor,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));

  return {
    ...set,
    cards,
    card_count: cards.length,
    total_cards: cards.length,
    progress: raw.progress || raw.progress_summary,
    progress_summary: raw.progress_summary || raw.progress,
    is_owner: raw.is_owner !== undefined ? Boolean(raw.is_owner) : undefined,
  };
}

/**
 * Normalizes review statistics from Gateway / MockServer
 */
export function normalizeDueReviews(raw: any): DueReviewsSummary {
  if (!raw || typeof raw !== "object") {
    return { due_count: 0, next_due_at: null };
  }

  const dueCount =
    typeof raw.due_count === "number"
      ? raw.due_count
      : typeof raw.due_reviews_count === "number"
      ? raw.due_reviews_count
      : typeof raw.total_due === "number"
      ? raw.total_due
      : 0;

  let nextDueAt: string | null = raw.next_due_at || null;
  const cards = Array.isArray(raw.cards) ? raw.cards : [];

  if (!nextDueAt && cards.length > 0) {
    const dates = cards
      .map((c: any) => c.due_date || c.next_review_at)
      .filter(Boolean)
      .map((d: string) => new Date(d).getTime())
      .filter((t: number) => !isNaN(t));

    if (dates.length > 0) {
      nextDueAt = new Date(Math.min(...dates)).toISOString();
    }
  }

  return {
    due_count: dueCount,
    next_due_at: nextDueAt,
    total_cards: raw.total_cards,
    cards,
    not_studied: raw.not_studied,
    learning: raw.learning,
    reviewing: raw.reviewing,
    mastered: raw.mastered,
    accuracy_rate: raw.accuracy_rate,
  };
}

/**
 * Fetches list of study sets with optional search, filter, and pagination
 */
export async function apiGetStudySets(
  params?: StudySetListParams
): Promise<StudySetListResponse> {
  const queryParams: Record<string, string | number | undefined> = {};

  if (params?.filter) {
    queryParams.filter = params.filter;
  }
  if (params?.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params?.limit !== undefined) {
    queryParams.limit = params.limit;
    queryParams.page_size = params.limit;
    queryParams.per_page = params.limit;
  }
  if (params?.offset !== undefined) {
    queryParams.offset = params.offset;
    if (params.limit) {
      queryParams.page = Math.floor(params.offset / params.limit) + 1;
    }
  }
  if (params?.page !== undefined) {
    queryParams.page = params.page;
  }
  if (params?.page_size !== undefined) {
    queryParams.page_size = params.page_size;
    queryParams.per_page = params.page_size;
  }
  if (params?.sort || params?.sort_by) {
    queryParams.sort = params.sort || params.sort_by;
    queryParams.sort_by = params.sort_by || params.sort;
  }

  const rawRes = await apiClient.get<any>(API_ENDPOINTS.studySets.list, {
    params: queryParams,
  });

  const rawItems = Array.isArray(rawRes?.items)
    ? rawRes.items
    : Array.isArray(rawRes)
    ? rawRes
    : [];

  const items = rawItems.map(normalizeStudySet);
  const total =
    typeof rawRes?.pagination?.total === "number"
      ? rawRes.pagination.total
      : typeof rawRes?.total === "number"
      ? rawRes.total
      : items.length;

  return {
    items,
    total,
    pagination: rawRes?.pagination || {
      page: Number(queryParams.page || 1),
      page_size: Number(queryParams.page_size || items.length),
      total,
      total_pages: Math.ceil(total / Number(queryParams.page_size || total || 1)) || 1,
    },
  };
}

/**
 * Fetches a single study set by ID with its flashcards array
 */
export async function apiGetStudySet(id: string): Promise<StudySetDetail> {
  if (!id || !id.trim()) {
    throw new Error("Study set ID is required");
  }

  const rawRes = await apiClient.get<any>(API_ENDPOINTS.studySets.detail(id.trim()));
  return normalizeStudySetDetail(rawRes);
}

/**
 * Fetches review statistics and count of cards due for Spaced Repetition (SRS)
 */
export async function apiGetDueReviews(): Promise<DueReviewsSummary> {
  const rawRes = await apiClient.get<any>(API_ENDPOINTS.reviews.due);
  return normalizeDueReviews(rawRes);
}

/**
 * Creates a new study set with title, description, and initial cards
 */
export async function apiCreateStudySet(
  payload: CreateStudySetPayload
): Promise<StudySet> {
  const body = {
    ...payload,
    cards: payload.cards || payload.initial_cards || [],
    initial_cards: payload.initial_cards || payload.cards || [],
  };

  const rawRes = await apiClient.post<any>(API_ENDPOINTS.studySets.create, body);
  return normalizeStudySet(rawRes);
}

/**
 * Updates metadata of an existing study set
 */
export async function apiUpdateStudySet(
  id: string,
  payload: UpdateStudySetPayload
): Promise<StudySet> {
  const rawRes = await apiClient.put<any>(API_ENDPOINTS.studySets.update(id), payload);
  return normalizeStudySet(rawRes);
}

/**
 * Deletes a study set
 */
export async function apiDeleteStudySet(
  id: string
): Promise<{ success: boolean; message?: string }> {
  return await apiClient.delete<{ success: boolean; message?: string }>(
    API_ENDPOINTS.studySets.delete(id)
  );
}

/**
 * Duplicates a study set
 */
export async function apiDuplicateStudySet(
  id: string,
  newTitle?: string
): Promise<StudySet> {
  const body = newTitle ? { new_title: newTitle } : {};
  const rawRes = await apiClient.post<any>(API_ENDPOINTS.studySets.duplicate(id), body);
  return normalizeStudySet(rawRes);
}
