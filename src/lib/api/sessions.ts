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
}

export interface StudySessionInfo {
  session_id: string;
  study_set_id: string;
  mode: StudyMode;
  direction?: StudyDirection;
  status: "in_progress" | "completed" | "abandoned";
  total_cards: number;
  current_index: number;
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
  mastered: number;
  due_reviews_count: number;
  accuracy_rate: number;
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
 * Fetches global or set-level mastery progress overview
 */
export async function apiGetProgress(): Promise<ProgressOverview> {
  const rawRes = await apiClient.get<any>(API_ENDPOINTS.progress.overview);
  return {
    total_cards: Number(rawRes?.total_cards ?? 0),
    not_studied: Number(rawRes?.not_studied ?? 0),
    learning: Number(rawRes?.learning ?? 0),
    reviewing: Number(rawRes?.reviewing ?? 0),
    mastered: Number(rawRes?.mastered ?? 0),
    due_reviews_count: Number(rawRes?.due_reviews_count ?? rawRes?.due_count ?? 0),
    accuracy_rate: Number(rawRes?.accuracy_rate ?? 0),
  };
}

/**
 * Resets card progress (all sets or a specific study set)
 */
export async function apiResetProgress(
  studySetId?: string
): Promise<{ success: boolean; message?: string }> {
  const rawRes = await apiClient.post<any>(API_ENDPOINTS.progress.reset, {
    study_set_id: studySetId,
  });
  return {
    success: Boolean(rawRes?.success ?? rawRes?.reset ?? true),
    message: rawRes?.message,
  };
}
