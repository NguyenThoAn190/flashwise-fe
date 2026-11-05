/**
 * E2E Testing Helpers & Client Utilities
 *
 * Provides typed client abstractions, bulk import delimiter parser logic,
 * and key event simulator helpers for opaque-box E2E test runs.
 */

import { DEFAULT_API_URL } from "@/lib/api/config";

export interface BulkParseCard {
  front_content: string;
  back_content: string;
}

export interface BulkParseError {
  line: number;
  message: string;
  content?: string;
}

export interface BulkParserResult {
  cards: BulkParseCard[];
  errors: BulkParseError[];
}

/**
 * Bulk text parser supporting Tab, Comma, Semicolon, and Custom delimiters.
 * Handles trailing whitespace, empty lines, and mismatched lines gracefully.
 */
export function parseBulkText(
  rawText: string,
  termDelimiter: string = "\t",
  cardDelimiter: string = "\n"
): BulkParserResult {
  const cards: BulkParseCard[] = [];
  const errors: BulkParseError[] = [];

  if (!rawText || !rawText.trim()) {
    return { cards, errors };
  }

  // Split lines by card delimiter (default newline)
  const lines = rawText.split(cardDelimiter);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Ignore blank or whitespace-only lines (e.g. trailing empty lines)
    if (!trimmed) {
      return;
    }

    const separatorIndex = line.indexOf(termDelimiter);
    if (separatorIndex === -1) {
      errors.push({
        line: lineNumber,
        message: `Missing delimiter '${termDelimiter === "\t" ? "\\t" : termDelimiter}'`,
        content: line,
      });
      return;
    }

    const front = line.substring(0, separatorIndex).trim();
    const back = line.substring(separatorIndex + termDelimiter.length).trim();

    if (!front || !back) {
      errors.push({
        line: lineNumber,
        message: "Both term and definition must be non-empty",
        content: line,
      });
      return;
    }

    cards.push({
      front_content: front,
      back_content: back,
    });
  });

  return { cards, errors };
}

/**
 * High-level typed E2E API Client invoking fetch (intercepted by MockServer or Real Gateway)
 */
export function createE2EClient(baseUrl: string = DEFAULT_API_URL, token?: string) {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-PlayGrid-Client": "web-app",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const request = async <T = any>(
    path: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<{ status: number; data: T; ok: boolean }> => {
    const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = { ...defaultHeaders, ...(options.headers || {}) };

    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    return {
      status: res.status,
      data,
      ok: res.ok,
    };
  };

  return {
    setToken(newToken: string) {
      defaultHeaders["Authorization"] = `Bearer ${newToken}`;
    },
    clearToken() {
      delete defaultHeaders["Authorization"];
    },

    auth: {
      signup: (payload: { email: string; password: string; full_name: string; username?: string }) =>
        request("/auth/signup", { method: "POST", body: payload }),
      login: (payload: { email?: string; username?: string; password: string }) =>
        request("/auth/token", { method: "POST", body: payload }),
      loginGoogle: (idToken: string, channel = "web-app") =>
        request("/auth/social/google", {
          method: "POST",
          body: { provider: "google", id_token: idToken, channel },
        }),
      // FE popup-code flow: GIS `auth-code` -> backend exchange.
      loginGoogleCode: (authCode: string, channel = "web-app") =>
        request("/auth/social/google", {
          method: "POST",
          body: { provider: "google", auth_code: authCode, channel },
        }),
      refresh: (payload: { refresh_token: string }) =>
        request("/auth/refresh", { method: "POST", body: payload }),
      signout: () =>
        request("/auth/signout", { method: "POST" }),
      profile: () =>
        request("/user/profile", { method: "GET" }),
    },

    studySets: {
      list: (query?: { search?: string; filter?: "all" | "mine" | "starred" | "recent" }) => {
        const q = new URLSearchParams();
        if (query?.search) q.set("search", query.search);
        if (query?.filter) q.set("filter", query.filter);
        const qs = q.toString() ? `?${q.toString()}` : "";
        return request(`/quizlet/study-sets${qs}`, { method: "GET" });
      },
      get: (id: string) => request(`/quizlet/study-sets/${id}`, { method: "GET" }),
      create: (payload: { title: string; description?: string; visibility?: string; cards?: Array<{ front_content: string; back_content: string; hint?: string; explanation?: string }> }) =>
        request("/quizlet/study-sets", { method: "POST", body: payload }),
      update: (id: string, payload: { title?: string; description?: string; visibility?: string; is_starred?: boolean }) =>
        request(`/quizlet/study-sets/${id}`, { method: "PUT", body: payload }),
      delete: (id: string) => request(`/quizlet/study-sets/${id}`, { method: "DELETE" }),
      duplicate: (id: string) => request(`/quizlet/study-sets/${id}/duplicate`, { method: "POST" }),
    },

    cards: {
      add: (studySetId: string, card: { front_content: string; back_content: string; hint?: string; explanation?: string }) =>
        request(`/quizlet/study-sets/${studySetId}/cards`, { method: "POST", body: card }),
      delete: (cardId: string) =>
        request(`/quizlet/cards/${cardId}`, { method: "DELETE" }),
      reorder: (studySetId: string, cardOrder: string[]) =>
        request("/quizlet/cards/reorder", { method: "PUT", body: { study_set_id: studySetId, card_order: cardOrder } }),
      import: (studySetId: string, payload: { raw_text?: string; term_delimiter?: string; card_delimiter?: string; cards?: Array<{ front_content: string; back_content: string }> }) =>
        request(`/quizlet/study-sets/${studySetId}/import`, { method: "POST", body: payload }),
    },

    sessions: {
      start: (studySetId: string, options?: { mode?: "learn" | "flashcards"; direction?: "term_first" | "def_first" }) =>
        request(`/quizlet/study-sets/${studySetId}/sessions`, { method: "POST", body: options }),
      next: (sessionId: string) =>
        request(`/quizlet/sessions/${sessionId}/next`, { method: "GET" }),
      submit: (sessionId: string, payload: { question_id: string; answer: string | number | boolean }) =>
        request(`/quizlet/sessions/${sessionId}/submit`, { method: "POST", body: payload }),
      rate: (sessionId: string, payload: { card_id: string; rating: "repeat" | "hard" | "okay" | "easy" }) =>
        request(`/quizlet/sessions/${sessionId}/ratings`, { method: "POST", body: payload }),
      complete: (sessionId: string) =>
        request(`/quizlet/sessions/${sessionId}/complete`, { method: "POST" }),
    },

    progress: {
      get: () => request("/progress", { method: "GET" }),
      reset: (studySetId?: string) =>
        request("/progress/reset", { method: "POST", body: { study_set_id: studySetId } }),
    },
  };
}
