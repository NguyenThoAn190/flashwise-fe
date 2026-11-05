import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  hasAccessToken,
  setCookie,
  getCookie,
  deleteCookie,
  setCachedUser,
  getCachedUser,
  onStorageAuthChange,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_CACHE_KEY,
} from "@/lib/api/storage";
import { ApiClient } from "@/lib/api/client";
import { login, signup, signout, getProfile, refreshToken } from "@/lib/api/auth";
import { ApiError } from "@/types/api";

describe("Milestone 2 API Gateway Integration - Storage & API Client", () => {
  beforeEach(() => {
    clearTokens();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearTokens();
    vi.restoreAllMocks();
  });

  /* ==========================================================================
     1. Storage & Cookie Synchronization Tests
     ========================================================================== */
  describe("Storage & Dual Cookie Synchronization", () => {
    it("stores and retrieves access_token across localStorage and cookie", () => {
      setAccessToken("access_test_token_123");
      expect(getAccessToken()).toBe("access_test_token_123");
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access_test_token_123");
      expect(getCookie(ACCESS_TOKEN_KEY)).toBe("access_test_token_123");
    });

    it("stores and retrieves refresh_token across localStorage and cookie", () => {
      setRefreshToken("refresh_test_token_456");
      expect(getRefreshToken()).toBe("refresh_test_token_456");
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh_test_token_456");
      expect(getCookie(REFRESH_TOKEN_KEY)).toBe("refresh_test_token_456");
    });

    it("concurrently sets both access and refresh tokens via setTokens", () => {
      setTokens("acc_dual", "ref_dual");
      expect(getAccessToken()).toBe("acc_dual");
      expect(getRefreshToken()).toBe("ref_dual");
      expect(hasAccessToken()).toBe(true);
    });

    it("clears all tokens and cached user via clearTokens", () => {
      setTokens("acc_to_clear", "ref_to_clear");
      setCachedUser({ id: "123", email: "clear@quizlet.com" });

      clearTokens();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(hasAccessToken()).toBe(false);
      expect(getCookie(ACCESS_TOKEN_KEY)).toBeNull();
      expect(getCookie(REFRESH_TOKEN_KEY)).toBeNull();
      expect(getCachedUser()).toBeNull();
    });

    it("recovers access token from cookie if localStorage was cleared", () => {
      setCookie(ACCESS_TOKEN_KEY, "cookie_survivor");
      localStorage.removeItem(ACCESS_TOKEN_KEY);

      expect(getAccessToken()).toBe("cookie_survivor");
      // Must have re-synced into localStorage
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("cookie_survivor");
    });

    it("safely handles URI encoding and special characters in cookies", () => {
      setCookie("test_special", "val with spaces & symbols !@#$");
      expect(getCookie("test_special")).toBe("val with spaces & symbols !@#$");
      deleteCookie("test_special");
      expect(getCookie("test_special")).toBeNull();
    });

    it("stores and parses cached user objects in localStorage", () => {
      const mockProfile = {
        id: "usr_cached_1",
        email: "student@quizlet.com",
        user_metadata: { full_name: "Jane Student" },
      };
      setCachedUser(mockProfile);
      const retrieved = getCachedUser<typeof mockProfile>();
      expect(retrieved).toEqual(mockProfile);
      expect(localStorage.getItem(USER_CACHE_KEY)).toContain("student@quizlet.com");
    });

    it("notifies subscriber on storage auth change and unsubscribes cleanly", () => {
      const callback = vi.fn();
      const unsubscribe = onStorageAuthChange(callback);

      // Fire a storage event for access token
      const event = new StorageEvent("storage", {
        key: ACCESS_TOKEN_KEY,
        newValue: "new_remote_token",
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith("new_remote_token");

      // Fire event for unrelated key -> callback must NOT be called again
      const unrelatedEvent = new StorageEvent("storage", {
        key: "unrelated_setting",
        newValue: "foo",
      });
      window.dispatchEvent(unrelatedEvent);
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe and verify no further calls
      unsubscribe();
      window.dispatchEvent(event);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  /* ==========================================================================
     2. API Client Interceptors & 401 Refresh Locking
     ========================================================================== */
  describe("API Client Interceptors & Request Handling", () => {
    let client: ApiClient;

    beforeEach(() => {
      client = new ApiClient("http://localhost:8080/api/v1");
    });

    it("attaches default X-PlayGrid-Client and Content-Type headers", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { message: "ok" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await client.get<{ message: string }>("/test");

      expect(result.message).toBe("ok");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers["X-PlayGrid-Client"]).toBe("web-app");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("automatically attaches Authorization: Bearer token when stored", async () => {
      setAccessToken("test_stored_jwt");

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { authorized: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await client.get("/user/profile");

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer test_stored_jwt");
    });

    it("omits Authorization header when skipAuth is true", async () => {
      setAccessToken("test_stored_jwt");

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { public: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await client.post("/auth/token", {}, { skipAuth: true });

      const [, init] = fetchSpy.mock.calls[0];
      const headers = init?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("appends URL query parameters correctly", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await client.get("/quizlet/study-sets", {
        params: { limit: 10, page: 2, filter: "starred" },
      });

      const [urlArg] = fetchSpy.mock.calls[0];
      const parsedUrl = new URL(String(urlArg));
      expect(parsedUrl.searchParams.get("limit")).toBe("10");
      expect(parsedUrl.searchParams.get("page")).toBe("2");
      expect(parsedUrl.searchParams.get("filter")).toBe("starred");
    });

    it("unwraps StandardResponse { data: ... } automatically", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { id: "set_101", title: "Biology Flashcards" },
            meta: { timestamp: "2026-11-03T10:00:00Z" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const res = await client.get<{ id: string; title: string }>("/quizlet/study-sets/set_101");
      expect(res.id).toBe("set_101");
      expect(res.title).toBe("Biology Flashcards");
    });

    it("throws ApiError with error status and details on HTTP error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: "NOT_FOUND",
              message: "Study set not found",
              service: "quizlet-service",
            },
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        )
      );

      try {
        await client.get("/quizlet/study-sets/999");
        expect.unreachable("Should have thrown ApiError");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(404);
        expect(apiErr.code).toBe("NOT_FOUND");
        expect(apiErr.message).toBe("Study set not found");
      }
    });

    it("wraps fetch network errors in ApiError with NETWORK_ERROR code", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Failed to connect to gateway"));

      try {
        await client.get("/quizlet/study-sets");
        expect.unreachable("Should have thrown ApiError");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(0);
        expect(apiErr.code).toBe("NETWORK_ERROR");
        expect(apiErr.message).toContain("Failed to connect to gateway");
      }
    });

    it("handles 401, refreshes token, and retries original request with new token", async () => {
      setTokens("expired_token", "valid_rt");

      let callCount = 0;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);
        callCount++;

        // Call 1: Original request returns 401
        if (callCount === 1) {
          return new Response(
            JSON.stringify({ error: { code: "UNAUTHORIZED", message: "token expired" } }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Call 2: Refresh token request
        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          return new Response(
            JSON.stringify({
              data: {
                access_token: "refreshed_access_token_777",
                refresh_token: "rotated_refresh_token_888",
                token_type: "Bearer",
                expires_in: 3600,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // Call 3: Retried original request
        return new Response(
          JSON.stringify({ data: { success: true, payload: "recovered_content" } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });

      const res = await client.get<{ success: boolean; payload: string }>("/protected/data");

      expect(res.success).toBe(true);
      expect(res.payload).toBe("recovered_content");
      expect(callCount).toBe(3);
      expect(getAccessToken()).toBe("refreshed_access_token_777");
      expect(getRefreshToken()).toBe("rotated_refresh_token_888");
    });

    it("coalesces concurrent 401 requests into a single refresh call", async () => {
      setTokens("expired_token", "valid_rt");

      let refreshCount = 0;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
        const url = String(input);

        // Refresh request
        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          refreshCount++;
          await new Promise((r) => setTimeout(r, 15));
          return new Response(
            JSON.stringify({
              data: {
                access_token: "coalesced_token_999",
                refresh_token: "coalesced_rt_999",
                token_type: "Bearer",
                expires_in: 3600,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        const headers = init?.headers as Record<string, string>;
        if (headers?.["Authorization"] === "Bearer coalesced_token_999") {
          return new Response(
            JSON.stringify({ data: { url, resolved: true } }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      // Dispatch 3 concurrent requests
      const [r1, r2, r3] = await Promise.all([
        client.get<{ resolved: boolean }>("/endpoint/1"),
        client.get<{ resolved: boolean }>("/endpoint/2"),
        client.get<{ resolved: boolean }>("/endpoint/3"),
      ]);

      expect(r1.resolved).toBe(true);
      expect(r2.resolved).toBe(true);
      expect(r3.resolved).toBe(true);
      expect(refreshCount).toBe(1); // Crucial: Only one refresh call was dispatched!
      expect(getAccessToken()).toBe("coalesced_token_999");
    });

    it("clears storage and fails queued requests when refresh token is invalid", async () => {
      setTokens("expired_token", "bad_rt");

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          return new Response(
            JSON.stringify({ error: { code: "REFRESH_TOKEN_EXPIRED", message: "invalid rt" } }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      await expect(client.get("/protected/data")).rejects.toThrow();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });

  /* ==========================================================================
     3. Auth Service Workflows
     ========================================================================== */
  describe("Auth API Services", () => {
    it("login stores tokens and returns TokenResponse", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              access_token: "login_access_token",
              refresh_token: "login_refresh_token",
              token_type: "Bearer",
              expires_in: 3600,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const tokens = await login("student@quizlet.com", "SecretPass123!");

      expect(tokens.access_token).toBe("login_access_token");
      expect(tokens.refresh_token).toBe("login_refresh_token");
      expect(getAccessToken()).toBe("login_access_token");
      expect(getRefreshToken()).toBe("login_refresh_token");
    });

    it("signup sends registration request and returns UserProfile", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              id: "usr_registered_1",
              email: "newlearner@quizlet.com",
              full_name: "New Learner",
              role: "USER",
              access_token: "signup_auto_jwt",
              refresh_token: "signup_auto_rt",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        )
      );

      const profile = await signup(
        "newlearner@quizlet.com",
        "Pass123456!",
        "New Learner",
        "newlearner"
      );

      expect(profile.id).toBe("usr_registered_1");
      expect(profile.email).toBe("newlearner@quizlet.com");
      expect(getAccessToken()).toBe("signup_auto_jwt");
    });

    it("signout sends signout request and clears local tokens", async () => {
      setTokens("active_jwt", "active_rt");

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { message: "Signed out successfully", success: true } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const result = await signout();

      expect(result.message).toBe("Signed out successfully");
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(hasAccessToken()).toBe(false);
    });

    it("getProfile fetches user profile and updates local cache", async () => {
      setAccessToken("valid_token");

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              id: "usr_bio_1",
              email: "student@quizlet.com",
              full_name: "Student Name",
              role: "USER",
              stats: { total_study_sets: 5, cards_mastered: 20, current_streak: 3 },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const profile = await getProfile();

      expect(profile.id).toBe("usr_bio_1");
      expect(profile.email).toBe("student@quizlet.com");
      expect(getCachedUser()).toEqual(profile);
    });

    it("refreshToken renews tokens using stored refresh token", async () => {
      setTokens("old_acc", "existing_rt");

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              access_token: "renewed_acc",
              refresh_token: "renewed_rt",
              token_type: "Bearer",
              expires_in: 3600,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const result = await refreshToken();

      expect(result.access_token).toBe("renewed_acc");
      expect(getAccessToken()).toBe("renewed_acc");
      expect(getRefreshToken()).toBe("renewed_rt");
    });
  });
});
