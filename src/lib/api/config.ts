/**
 * PlayGrid API Gateway Configuration
 *
 * Defines the base URL, standard request headers, and client endpoints
 * for the Flashwise Next.js application.
 */

export const DEFAULT_API_URL = "http://localhost:8080/api/v1";

/**
 * Resolves the API Gateway base URL dynamically.
 * Prioritizes an explicit argument, then NEXT_PUBLIC_API_URL, then DEFAULT_API_URL.
 */
export function getApiBaseUrl(customUrl?: string): string {
  if (customUrl) return customUrl;
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return DEFAULT_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "X-PlayGrid-Client": "web-app",
} as const;

const SUPPORTED_LOCALES = ["en", "vi", "zh", "ja", "ko"] as const;

const LOCALE_TO_BCP47: Record<string, string> = {
  en: "en-US",
  vi: "vi-VN",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
};

/**
 * Resolves the outgoing locale for Gateway language negotiation.
 * Gateway `ResolveLanguage` honors `X-Lang` / `X-Language` / `Accept-Language`
 * and falls back to `vi`, so the client must always send it — otherwise
 * error messages (e.g. 404 NOT_FOUND "Không tìm thấy") leak raw Vietnamese
 * into non-Vietnamese UIs.
 */
export function getOutgoingLocaleShort(): string {
  if (typeof window === "undefined") return "vi";
  try {
    const segs = window.location.pathname.split("/").filter(Boolean);
    const first = (segs[0] || "").toLowerCase();
    if ((SUPPORTED_LOCALES as readonly string[]).includes(first)) return first;
  } catch {
    // ignore
  }
  try {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    const cookieLocale = decodeURIComponent(match?.[1] || "").toLowerCase();
    if ((SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)) {
      return cookieLocale;
    }
  } catch {
    // ignore
  }
  try {
    const nav = (navigator.language || "vi").toLowerCase();
    const short = nav.split("-")[0];
    if ((SUPPORTED_LOCALES as readonly string[]).includes(short)) return short;
  } catch {
    // ignore
  }
  return "vi";
}

export function getOutgoingBcp47(): string {
  const short = getOutgoingLocaleShort();
  return LOCALE_TO_BCP47[short] || "vi-VN";
}

export const API_ENDPOINTS = {
  auth: {
    signup: "/auth/signup",
    token: "/auth/token",
    refresh: "/auth/refresh",
    signout: "/auth/signout",
    profile: "/user/profile",
    socialGoogle: "/auth/social/google",
    social: (provider: string) => `/auth/social/${provider}`,
  },
  studySets: {
    list: "/quizlet/study-sets",
    detail: (id: string | number) => `/quizlet/study-sets/${id}`,
    create: "/quizlet/study-sets",
    update: (id: string | number) => `/quizlet/study-sets/${id}`,
    delete: (id: string | number) => `/quizlet/study-sets/${id}`,
    duplicate: (id: string | number) => `/quizlet/study-sets/${id}/duplicate`,
    cards: (id: string | number) => `/quizlet/study-sets/${id}/cards`,
    import: (id: string | number) => `/quizlet/study-sets/${id}/import`,
    progress: (id: string | number) => `/quizlet/study-sets/${id}/progress`,
    resetProgress: (id: string | number) => `/quizlet/study-sets/${id}/progress/reset`,
  },
  cards: {
    detail: (cardId: string | number) => `/quizlet/cards/${cardId}`,
    update: (cardId: string | number) => `/quizlet/cards/${cardId}`,
    delete: (cardId: string | number) => `/quizlet/cards/${cardId}`,
    reorder: "/quizlet/cards/reorder",
    reorderInSet: (setId: string | number) => `/quizlet/study-sets/${setId}/cards/reorder`,
  },
  sessions: {
    start: (id: string | number) => `/quizlet/study-sets/${id}/sessions`,
    detail: (sessionId: string | number) => `/quizlet/sessions/${sessionId}`,
    next: (sessionId: string | number) => `/quizlet/sessions/${sessionId}/next`,
    submit: (sessionId: string | number) => `/quizlet/sessions/${sessionId}/submit`,
    answers: (sessionId: string | number) => `/quizlet/sessions/${sessionId}/answers`,
    ratings: (sessionId: string | number) => `/quizlet/sessions/${sessionId}/ratings`,
    complete: (sessionId: string | number) => `/quizlet/sessions/${sessionId}/complete`,
    abandon: (sessionId: string | number) => `/quizlet/sessions/${sessionId}/abandon`,
  },
  reviews: {
    due: "/quizlet/users/me/reviews",
  },
  progress: {
    overview: "/quizlet/users/me/progress",
    reset: "/quizlet/users/me/progress/reset",
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
