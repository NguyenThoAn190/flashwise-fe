/**
 * PlayGrid API Gateway Study Sessions, Adaptive Learning & SRS Ratings Module
 * Provides typed methods for starting sessions, fetching adaptive questions,
 * evaluating answers, submitting Spaced Repetition ratings, and viewing/resetting progress.
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";

export type StudyMode = "learn" | "flashcards" | "review";
export type StudyDirection = "term_first" | "def_first" | "random";
export type AdaptiveQuestionType = "mcq" | "true_false" | "written" | "recall";
export type SRSRating = "repeat" | "hard" | "okay" | "easy";

export interface StartSessionOptions {
  mode?: StudyMode;
  direction?: StudyDirection;
  target_card_count?: number;
  // Học theo chặng nhỏ: 0 = tự động, 8/12/15 = ép kích thước cụm.
  chunk_size?: number;
  chunk_index?: number;
}

export interface StudySessionInfo {
  session_id: string;
  study_set_id: string;
  mode: StudyMode;
  direction?: StudyDirection;
  status: "in_progress" | "completed" | "abandoned";
  total_cards: number;
  current_index: number;
  chunk_size?: number;
  active_chunk?: number;
  total_chunks?: number;
}

export interface SessionSummaryData {
  session_id: string;
  total_reviewed: number;
  correct_count: number;
  incorrect_count: number;
  accuracy_percentage: number;
  mastered_count: number;
}

export interface AdaptiveQuestion {
  question_id: string;
  session_id: string;
  card_id: string;
  flashcard_id?: string;
  question_type: AdaptiveQuestionType;
  prompt: string;
  options?: string[];
  correct_index?: number;
  proposed_definition?: string;
  is_true?: boolean;
  expected_answer?: string;
  card_index: number;
  total_cards: number;
  is_completed?: false;
  // Học theo chặng nhỏ.
  active_chunk?: number;
  total_chunks?: number;
  chunk_size?: number;
  is_review_card?: boolean;
  chunk_gate_passed?: boolean;
}

export interface CompletedSessionNextResponse {
  is_completed: true;
  summary: SessionSummaryData;
}

export type NextQuestionResponse = AdaptiveQuestion | CompletedSessionNextResponse;

export interface SubmitAnswerPayload {
  question_id: string;
  card_id?: string;
  flashcard_id?: string;
  question_type?: AdaptiveQuestionType;
  answer: string | number | boolean;
  response_time_ms?: number;
}

export interface SubmitAnswerResult {
  is_correct: boolean;
  correct_answer: string;
  explanation?: string;
  mastery_score_before: number;
  mastery_score_after: number;
  is_session_completed: boolean;
}

export interface SRSRatingPayload {
  card_id: string;
  rating: SRSRating;
}

export interface SRSRatingResult {
  card_id: string;
  rating: SRSRating;
  next_review_interval: string;
  interval_days: number;
  ease_factor: number;
}

export interface ProgressOverview {
  total_cards: number;
  not_studied: number;
  learning: number;
  reviewing: number;
  familiar?: number;
  mastered: number;
  due_reviews_count: number;
  accuracy_rate: number;
  average_mastery?: number;
}

interface GatewayOverallProgress {
  user_id?: string;
  total_cards?: number;
  not_studied_count?: number;
  not_studied?: number;
  learning_count?: number;
  learning?: number;
  familiar_count?: number;
  familiar?: number;
  reviewing_count?: number;
  reviewing?: number;
  mastered_count?: number;
  mastered?: number;
  due_reviews_count?: number;
  due_count?: number;
  total_due?: number;
  accuracy_rate?: number;
  average_mastery?: number;
}

interface GatewayResetResult {
  reset?: boolean;
  success?: boolean;
  message?: string;
}

/**
 * Starts a new learning or flashcard session for a study set
 */
export async function apiStartSession(
  studySetId: string,
  options: StartSessionOptions = {}
): Promise<StudySessionInfo> {
  if (!studySetId || !studySetId.trim()) {
    throw new Error("Study set ID is required");
  }

  const rawRes = await apiClient.post<any>(
    API_ENDPOINTS.sessions.start(studySetId.trim()),
    {
      mode: options.mode || "learn",
      direction: options.direction || "term_first",
      target_card_count: options.target_card_count,
      chunk_size: options.chunk_size ?? 0,
      chunk_index: options.chunk_index ?? 0,
    }
  );

  const s = rawRes?.session || rawRes || {};
  return {
    session_id: String(s.session_id || s.id || ""),
    study_set_id: String(s.study_set_id || studySetId),
    mode: (s.mode as StudyMode) || options.mode || "learn",
    direction: (s.direction as StudyDirection) || options.direction || "term_first",
    status: s.status === "completed" ? "completed" : "in_progress",
    total_cards:
      typeof s.total_cards === "number"
        ? s.total_cards
        : typeof s.target_card_count === "number"
        ? s.target_card_count
        : 0,
    current_index: typeof s.current_index === "number" ? s.current_index : 0,
    chunk_size: typeof s.chunk_size === "number" ? s.chunk_size : undefined,
    active_chunk: typeof s.active_chunk === "number" ? s.active_chunk : undefined,
    total_chunks: typeof s.total_chunks === "number" ? s.total_chunks : undefined,
  };
}

/**
 * Fetches the next adaptive question or session completion summary
 */
export async function apiGetNextQuestion(
  sessionId: string
): Promise<NextQuestionResponse> {
  if (!sessionId || !sessionId.trim()) {
    throw new Error("Session ID is required");
  }

  const rawRes = await apiClient.get<any>(
    API_ENDPOINTS.sessions.next(sessionId.trim())
  );

  if (rawRes?.is_completed || rawRes?.session_completed) {
    const sum = rawRes.summary || rawRes;
    return {
      is_completed: true,
      summary: {
        session_id: String(sum.session_id || sessionId),
        total_reviewed: Number(sum.total_reviewed ?? sum.total_cards ?? 0),
        correct_count: Number(sum.correct_count ?? 0),
        incorrect_count: Number(sum.incorrect_count ?? 0),
        accuracy_percentage: Number(sum.accuracy_percentage ?? 100),
        mastered_count: Number(sum.mastered_count ?? sum.correct_count ?? 0),
      },
    };
  }

  const q = rawRes?.question || rawRes || {};
  let qType: AdaptiveQuestionType = "mcq";
  if (
    q.question_type === "true_false" ||
    q.question_type === "QUESTION_TYPE_TRUE_FALSE"
  ) {
    qType = "true_false";
  } else if (
    q.question_type === "written" ||
    q.question_type === "QUESTION_TYPE_WRITTEN"
  ) {
    qType = "written";
  } else if (
    q.question_type === "recall" ||
    q.question_type === "flashcard_recall" ||
    q.question_type === "QUESTION_TYPE_FLASHCARD_RECALL"
  ) {
    qType = "recall";
  }

  const cardId = String(q.card_id || q.flashcard_id || "");

  return {
    question_id: String(q.question_id || `q_${sessionId}_${q.card_index ?? 0}`),
    session_id: String(q.session_id || sessionId),
    card_id: cardId,
    flashcard_id: cardId,
    question_type: qType,
    prompt: String(q.prompt || ""),
    options: Array.isArray(q.options) ? q.options : undefined,
    correct_index: typeof q.correct_index === "number" ? q.correct_index : undefined,
    proposed_definition: q.proposed_definition,
    is_true: typeof q.is_true === "boolean" ? q.is_true : undefined,
    expected_answer: q.expected_answer,
    card_index: typeof q.card_index === "number" ? q.card_index : 0,
    total_cards: typeof q.total_cards === "number" ? q.total_cards : 1,
    is_completed: false,
    active_chunk: typeof q.active_chunk === "number" ? q.active_chunk : undefined,
    total_chunks: typeof q.total_chunks === "number" ? q.total_chunks : undefined,
    chunk_size: typeof q.chunk_size === "number" ? q.chunk_size : undefined,
    is_review_card: Boolean(q.is_review_card ?? q.isReviewCard ?? false),
    chunk_gate_passed: Boolean(q.chunk_gate_passed ?? q.chunkGatePassed ?? false),
  };
}

/**
 * Submits an answer for the active adaptive question
 */
export async function apiSubmitAnswer(
  sessionId: string,
  payload: SubmitAnswerPayload
): Promise<SubmitAnswerResult> {
  if (!sessionId || !sessionId.trim()) {
    throw new Error("Session ID is required");
  }

  const flashcardId = payload.card_id || payload.flashcard_id || "";
  const rawRes = await apiClient.post<any>(
    API_ENDPOINTS.sessions.submit(sessionId.trim()),
    {
      question_id: payload.question_id,
      answer: payload.answer,
      flashcard_id: flashcardId,
      card_id: flashcardId,
      question_type: payload.question_type,
      submitted_answer: String(payload.answer),
      response_time_ms: payload.response_time_ms ?? 1500,
    }
  );

  return {
    is_correct: Boolean(rawRes?.is_correct),
    correct_answer: String(rawRes?.correct_answer || ""),
    explanation: rawRes?.explanation,
    mastery_score_before: Number(rawRes?.mastery_score_before ?? 50),
    mastery_score_after: Number(rawRes?.mastery_score_after ?? 50),
    is_session_completed: Boolean(rawRes?.is_session_completed),
  };
}

/**
 * Submits a Spaced Repetition (SRS) rating (repeat, hard, okay, easy) for a card
 */
export async function apiRateCardSRS(
  sessionId: string,
  payload: SRSRatingPayload
): Promise<SRSRatingResult> {
  if (!sessionId || !sessionId.trim()) {
    throw new Error("Session ID is required");
  }

  const rawRes = await apiClient.post<any>(
    API_ENDPOINTS.sessions.ratings(sessionId.trim()),
    {
      card_id: payload.card_id,
      flashcard_id: payload.card_id,
      rating: payload.rating,
    }
  );

  return {
    card_id: String(rawRes?.card_id || payload.card_id),
    rating: (rawRes?.rating as SRSRating) || payload.rating,
    next_review_interval: String(rawRes?.next_review_interval || "1 day"),
    interval_days: Number(rawRes?.interval_days ?? 1),
    ease_factor: Number(rawRes?.ease_factor ?? 2.5),
  };
}

/**
 * Completes a learning session and returns final summary statistics
 */
export async function apiCompleteSession(
  sessionId: string
): Promise<SessionSummaryData> {
  if (!sessionId || !sessionId.trim()) {
    throw new Error("Session ID is required");
  }

  const rawRes = await apiClient.post<any>(
    API_ENDPOINTS.sessions.complete(sessionId.trim()),
    {}
  );

  const s = rawRes?.summary || rawRes || {};
  return {
    session_id: String(s.session_id || sessionId),
    total_reviewed: Number(s.total_reviewed ?? s.total_cards ?? 0),
    correct_count: Number(s.correct_count ?? 0),
    incorrect_count: Number(s.incorrect_count ?? 0),
    accuracy_percentage: Number(s.accuracy_percentage ?? 100),
    mastered_count: Number(s.mastered_count ?? s.correct_count ?? 0),
  };
}

/**
 * Fetches the global mastery progress overview.
 * Contract: Gateway GET /api/v1/quizlet/users/me/progress -> OverallProgressSummary
 * (total_cards, not_studied_count, learning_count, familiar_count,
 * reviewing_count, mastered_count, due_reviews_count, accuracy_rate).
 * FE "Reviewing / Familiar" displays reviewing_count + familiar_count.
 * accuracy_rate is mastered/total*100 (mastery rate), 0 when total is 0.
 */
export async function apiGetProgress(): Promise<ProgressOverview> {
  const rawRes = await apiClient.get<GatewayOverallProgress>(
    API_ENDPOINTS.progress.overview
  );
  const familiar = Number(rawRes?.familiar_count ?? rawRes?.familiar ?? 0);
  const reviewingOnly = Number(rawRes?.reviewing_count ?? rawRes?.reviewing ?? 0);
  return {
    total_cards: Number(rawRes?.total_cards ?? 0),
    not_studied: Number(
      rawRes?.not_studied_count ?? rawRes?.not_studied ?? 0
    ),
    learning: Number(rawRes?.learning_count ?? rawRes?.learning ?? 0),
    reviewing: reviewingOnly + familiar,
    familiar,
    mastered: Number(rawRes?.mastered_count ?? rawRes?.mastered ?? 0),
    due_reviews_count: Number(
      rawRes?.due_reviews_count ?? rawRes?.due_count ?? rawRes?.total_due ?? 0
    ),
    accuracy_rate: Number(rawRes?.accuracy_rate ?? 0),
    average_mastery:
      rawRes?.average_mastery !== undefined
        ? Number(rawRes.average_mastery)
        : undefined,
  };
}

/**
 * Resets card progress. Empty studySetId performs an explicit global reset
 * via POST /api/v1/quizlet/users/me/progress/reset; non-empty scopes to one
 * set via POST /api/v1/quizlet/study-sets/:id/progress/reset.
 * Missing success fields are treated as failure (no `?? true` fallback).
 */
export async function apiResetProgress(
  studySetId?: string
): Promise<{ success: boolean; message?: string }> {
  const normalizedSetId = studySetId?.trim() || undefined;
  if (normalizedSetId) {
    const rawRes = await apiClient.post<GatewayResetResult>(
      API_ENDPOINTS.studySets.resetProgress(normalizedSetId),
      {}
    );
    const success = Boolean(rawRes?.success ?? rawRes?.reset ?? false);
    if (!success) {
      throw new Error("Failed to reset progress.");
    }
    return { success, message: rawRes?.message };
  }
  const rawRes = await apiClient.post<GatewayResetResult>(
    API_ENDPOINTS.progress.reset,
    {}
  );
  const success = Boolean(rawRes?.success ?? rawRes?.reset ?? false);
  if (!success) {
    throw new Error("Failed to reset progress.");
  }
  return { success, message: rawRes?.message };
}
