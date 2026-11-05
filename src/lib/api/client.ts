/**
 * PlayGrid API Gateway Client with 401 Automatic Token Refresh & Request Concurrency Lock
 * Zero-dependency web-standard fetch implementation, fully compatible with Next.js 15 App Router & Vitest.
 */

import { getApiBaseUrl, DEFAULT_HEADERS, API_ENDPOINTS } from "./config";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./storage";
import { ApiError, StandardResponse, ErrorResponse } from "@/types/api";
import { TokenResponse } from "@/types/auth";

export interface RequestOptions extends Omit<RequestInit, "headers" | "body"> {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  skipAuth?: boolean;
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Safely redirects the browser to login upon session expiration.
 * Preserves the next-intl locale prefix (`/en`, `/zh`, ...) so users
 * are not dropped back to the default locale login page.
 */
export function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    const segs = currentPath.split("/").filter(Boolean);
    const first = segs[0] ?? "";
    const isLocale = ["en", "vi", "zh", "ja", "ko"].includes(first);
    const prefix = isLocale && first !== "vi" ? `/${first}` : "";
    const rest = isLocale ? `/${segs.slice(1).join("/")}` : currentPath;
    const normalizedRest = rest === "/" || rest === "" ? "/" : rest;
    if (
      normalizedRest.startsWith("/login") ||
      normalizedRest.startsWith("/signup")
    ) {
      return;
    }
    const search = window.location.search || "";
    const fullPath = `${currentPath}${search}`;
    window.location.href = `${prefix}/login?redirect=${encodeURIComponent(fullPath)}`;
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(customBaseUrl?: string) {
    this.baseUrl = getApiBaseUrl(customBaseUrl);
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Performs an isolated token refresh request without triggering interceptor loops.
   * Tries /auth/refresh and /auth/token for universal compatibility.
   */
  public async executeTokenRefresh(refreshToken: string): Promise<TokenResponse> {
    const payload = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    };

    // Try /auth/refresh first, fallback to /auth/token
    const refreshEndpoints = [API_ENDPOINTS.auth.refresh, API_ENDPOINTS.auth.token];
    let lastError: unknown = null;

    for (const endpoint of refreshEndpoints) {
      try {
        const refreshUrl = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
        const response = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            ...DEFAULT_HEADERS,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data) {
          const tokenData = (data as StandardResponse<TokenResponse>)?.data || (data as TokenResponse);
          if (tokenData?.access_token) {
            return tokenData;
          }
        }

        if (response.status !== 404 && !response.ok) {
          throw ApiError.fromErrorResponse(response.status, data as ErrorResponse);
        }
      } catch (err) {
        lastError = err;
        if (err instanceof ApiError && err.status === 401) {
          // Explicit invalid refresh token
          throw err;
        }
      }
    }

    if (lastError instanceof ApiError) {
      throw lastError;
    }
    throw new ApiError(401, "REFRESH_TOKEN_EXPIRED", "Failed to renew authentication session");
  }

  /**
   * Main request handler with interceptors, concurrency lock, and automatic 401 refresh.
   */
  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      params,
      body,
      headers = {},
      skipAuth = false,
      _retry = false,
      ...fetchConfig
    } = options;

    // 1. Build Target URL
    const urlStr = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const url = new URL(urlStr);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    // 2. Request Interceptor: Attach Standard & Auth Headers
    const requestHeaders: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...headers,
    };

    if (!skipAuth && !requestHeaders["Authorization"]) {
      const token = getAccessToken();
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    const init: RequestInit = {
      ...fetchConfig,
      headers: requestHeaders,
    };

    if (body !== undefined) {
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    // 3. Dispatch HTTP Request
    let response: Response;
    try {
      response = await fetch(url.toString(), init);
    } catch (networkError) {
      throw new ApiError(0, "NETWORK_ERROR", (networkError as Error).message || "Network request failed");
    }

    // 4. Response Interceptor: Handle 401 Unauthorized with Automatic Refresh
    // Social auth endpoints must never trigger refresh: a 401 here means the
    // Google ID token itself was rejected (invalid/expired/banned), not an
    // expired PlayGrid session. Refreshing would loop and mask the real error.
    const isAuthEndpoint =
      endpoint.includes(API_ENDPOINTS.auth.token) ||
      endpoint.includes(API_ENDPOINTS.auth.signup) ||
      endpoint.includes(API_ENDPOINTS.auth.refresh) ||
      endpoint.includes(API_ENDPOINTS.auth.signout) ||
      endpoint.includes("/auth/social");

    if (response.status === 401 && !_retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Enqueue request while another refresh is in flight
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken: string) => {
          return this.request<T>(endpoint, {
            ...options,
            _retry: true,
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        });
      }

      // Initiate Refresh Token flow
      isRefreshing = true;
      const currentRefreshToken = getRefreshToken();

      if (!currentRefreshToken) {
        isRefreshing = false;
        clearTokens();
        redirectToLogin();
        throw new ApiError(401, "UNAUTHORIZED", "Session expired. Please log in again.");
      }

      try {
        const tokenResponse = await this.executeTokenRefresh(currentRefreshToken);
        const newAccessToken = tokenResponse.access_token;
        const newRefreshToken = tokenResponse.refresh_token;

        setTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        // Retry original request with newly issued token
        return await this.request<T>(endpoint, {
          ...options,
          _retry: true,
          headers: {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        redirectToLogin();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    // 5. Response Interceptor: Parse Success & Error Envelopes
    const isNoContent = response.status === 204;
    let responseData: any = null;

    if (!isNoContent) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json().catch(() => null);
      } else {
        responseData = await response.text().catch(() => null);
      }
    }

    if (!response.ok) {
      throw ApiError.fromErrorResponse(response.status, responseData as ErrorResponse);
    }

    // Automatically unwrap StandardResponse { data: ... }
    if (responseData && typeof responseData === "object" && "data" in responseData) {
      return responseData.data as T;
    }

    return responseData as T;
  }

  // Convenience Verb Methods
  public get<T>(endpoint: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  public put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  public delete<T>(endpoint: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
