/**
 * PlayGrid API Gateway Flashcards & Bulk Import Client Module
 * Provides typed methods for adding, updating, deleting, reordering, and bulk-importing flashcards.
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import { CreateCardInput, Flashcard } from "@/types/studySet";

export interface BulkImportPayload {
  raw_text?: string;
  term_delimiter?: string;
  card_delimiter?: string;
  term_def_delimiter?: string;
  preview_only?: boolean;
  cards?: CreateCardInput[];
}

export interface BulkImportResponse {
  success: boolean;
  imported_count: number;
  cards: Flashcard[];
}

/**
 * Normalizes a single raw flashcard object from Gateway or Mock Server
 */
export function normalizeFlashcard(raw: any, fallbackSetId = ""): Flashcard {
  const c = raw?.card || raw || {};
  return {
    id: String(c.id || `card_${Date.now()}`),
    study_set_id: String(c.study_set_id || fallbackSetId),
    front_content: c.front_content || c.front_text || "",
    back_content: c.back_content || c.back_text || "",
    front_text: c.front_text || c.front_content || "",
    back_text: c.back_text || c.back_content || "",
    position: typeof c.position === "number" ? c.position : 0,
    hint: c.hint,
    explanation: c.explanation,
    state: c.state || c.user_state || "not_studied",
    next_review_at: c.next_review_at,
    interval_days: c.interval_days,
    ease_factor: c.ease_factor,
    created_at: c.created_at || new Date().toISOString(),
    updated_at: c.updated_at || new Date().toISOString(),
  };
}

/**
 * Adds a new flashcard to a study set
 */
export async function apiAddCard(
  studySetId: string,
  payload: CreateCardInput
): Promise<Flashcard> {
  if (!studySetId || !studySetId.trim()) {
    throw new Error("Study set ID is required");
  }
  const front = payload.front_content?.trim() || "";
  const back = payload.back_content?.trim() || "";
  if (!front || !back) {
    throw new Error("Both term and definition are required");
  }

  const rawRes = await apiClient.post<any>(
    API_ENDPOINTS.studySets.cards(studySetId.trim()),
    {
      front_content: front,
      front_text: front,
      back_content: back,
      back_text: back,
      hint: payload.hint?.trim() || undefined,
      explanation: payload.explanation?.trim() || undefined,
    }
  );

  return normalizeFlashcard(rawRes, studySetId);
}

/**
 * Updates an existing flashcard by ID
 */
export async function apiUpdateCard(
  cardId: string,
  payload: Partial<CreateCardInput>
): Promise<Flashcard> {
  if (!cardId || !cardId.trim()) {
    throw new Error("Card ID is required");
  }
  const body: Record<string, any> = { ...payload };
  if (payload.front_content !== undefined) {
    body.front_text = payload.front_content;
  }
  if (payload.back_content !== undefined) {
    body.back_text = payload.back_content;
  }

  const rawRes = await apiClient.put<any>(
    API_ENDPOINTS.cards.update(cardId.trim()),
    body
  );
  return normalizeFlashcard(rawRes);
}

/**
 * Deletes a flashcard by ID
 */
export async function apiDeleteCard(
  cardId: string
): Promise<{ success: boolean }> {
  if (!cardId || !cardId.trim()) {
    throw new Error("Card ID is required");
  }
  const res = await apiClient.delete<any>(
    API_ENDPOINTS.cards.delete(cardId.trim())
  );
  return {
    success: Boolean(res?.success ?? res?.deleted ?? true),
  };
}

/**
 * Reorders flashcards within a study set
 */
export async function apiReorderCards(
  studySetId: string,
  cardOrder: string[]
): Promise<{ success: boolean; cards?: Flashcard[] }> {
  if (!studySetId || !studySetId.trim()) {
    throw new Error("Study set ID is required");
  }
  if (!Array.isArray(cardOrder)) {
    throw new Error("cardOrder must be an array of card IDs");
  }

  const positions = cardOrder.map((id, idx) => ({
    card_id: id,
    position: idx,
  }));

  const rawRes = await apiClient.put<any>(API_ENDPOINTS.cards.reorder, {
    study_set_id: studySetId.trim(),
    card_order: cardOrder,
    positions,
    card_positions: positions,
  });

  const cards = Array.isArray(rawRes?.cards)
    ? rawRes.cards.map((c: any) => normalizeFlashcard(c, studySetId))
    : undefined;

  return {
    success: Boolean(rawRes?.success ?? true),
    cards,
  };
}

/**
 * Bulk imports multiple flashcards into a study set
 */
export async function apiBulkImportCards(
  studySetId: string,
  payload: BulkImportPayload
): Promise<BulkImportResponse> {
  if (!studySetId || !studySetId.trim()) {
    throw new Error("Study set ID is required");
  }

  const termDelim = payload.term_delimiter ?? payload.term_def_delimiter ?? "\t";
  const cardDelim = payload.card_delimiter ?? "\n";

  const rawRes = await apiClient.post<any>(
    API_ENDPOINTS.studySets.import(studySetId.trim()),
    {
      raw_text: payload.raw_text,
      term_delimiter: termDelim,
      term_def_delimiter: termDelim,
      card_delimiter: cardDelim,
      preview_only: payload.preview_only ?? false,
      cards: payload.cards,
    }
  );

  const rawCards = Array.isArray(rawRes?.cards)
    ? rawRes.cards
    : Array.isArray(rawRes?.imported_cards)
    ? rawRes.imported_cards
    : [];

  const cards = rawCards.map((c: any) => normalizeFlashcard(c, studySetId));
  const importedCount =
    typeof rawRes?.imported_count === "number"
      ? rawRes.imported_count
      : cards.length;

  return {
    success: Boolean(rawRes?.success ?? true),
    imported_count: importedCount,
    cards,
  };
}
