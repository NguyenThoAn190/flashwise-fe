import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { ApiClient } from "@/lib/api/client";
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
  getCachedUser,
  setCachedUser,
  onStorageAuthChange,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_CACHE_KEY,
} from "@/lib/api/storage";
import { AuthProvider, useAuth } from "@/lib/context/AuthContext";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/types/api";
import { UserProfile } from "@/types/auth";

// Mock Next.js Navigation for AuthProvider tests
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  // `next-intl/navigation` yêu cầu `redirect`/`permanentRedirect` từ module này
  // ngay lúc import, nên mock phải export đủ để không throw.
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Pure TypeScript Helper Component for AuthContext testing without JSX
function TestAuthConsumer({ onAuth }: { onAuth?: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  if (onAuth) onAuth(auth);
  return React.createElement(
    "div",
    null,
    React.createElement("span", { "data-testid": "auth-loading" }, String(auth.isLoading)),
    React.createElement("span", { "data-testid": "auth-status" }, String(auth.isAuthenticated)),
    React.createElement("span", { "data-testid": "auth-user" }, auth.user?.email || "none"),
    React.createElement(
      "button",
      {
        "data-testid": "refresh-profile-btn",
        onClick: () => auth.refreshProfile(),
      },
      "Refresh Profile"
    )
  );
}

const mockProfileAlice: UserProfile = {
  id: "usr_alice",
  email: "alice@quizlet.com",
  full_name: "Alice Stress",
  role: "USER",
};

const mockProfileBob: UserProfile = {
  id: "usr_bob",
  email: "bob@quizlet.com",
  full_name: "Bob Storm",
  role: "USER",
};

describe("Milestone 2 Challenger Concurrency & Storage Stress Suite", () => {
  beforeEach(() => {
    clearTokens();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearTokens();
    vi.restoreAllMocks();
  });

  /* ==========================================================================
     1. High-Concurrency 401 Race Condition & Coalescing
     ========================================================================== */
  describe("High-Concurrency 401 Interceptor Coalescing", () => {
    it("coalesces 20 concurrent 401 requests into exactly 1 refresh call and resolves all 20 cleanly", async () => {
      setTokens("expired_token_init", "valid_refresh_token_123");
      const client = new ApiClient("http://localhost:8080/api/v1");

      let refreshCallCount = 0;
      const initialCallIndices: number[] = [];
      const retriedIndices: number[] = [];

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
        const url = String(input);
        const headers = (init?.headers as Record<string, string>) || {};

        // 1. Refresh endpoint handler
        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          refreshCallCount++;
          // Simulate realistic gateway network latency
          await new Promise((resolve) => setTimeout(resolve, 35));
          return new Response(
            JSON.stringify({
              data: {
                access_token: "refreshed_access_token_super_safe",
                refresh_token: "rotated_refresh_token_super_safe",
                token_type: "Bearer",
                expires_in: 3600,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // 2. Data endpoints handler
        const match = url.match(/\/test\/(\d+)/);
        const index = match ? parseInt(match[1], 10) : -1;

        if (headers["Authorization"] === "Bearer refreshed_access_token_super_safe") {
          retriedIndices.push(index);
          return new Response(
            JSON.stringify({
              data: {
                id: index,
                recovered: true,
                tokenReceived: headers["Authorization"],
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // Initial attempt with expired token returns 401
        initialCallIndices.push(index);
        return new Response(
          JSON.stringify({
            error: {
              code: "UNAUTHORIZED",
              message: "Access token expired",
            },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      // Dispatch 20 concurrent requests simultaneously
      const requests = Array.from({ length: 20 }, (_, i) =>
        client.get<{ id: number; recovered: boolean; tokenReceived: string }>(`/test/${i}`)
      );

      const responses = await Promise.all(requests);

      // VERIFICATIONS:
      // A. Exactly 1 refresh call was triggered
      expect(refreshCallCount).toBe(1);

      // B. All 20 requests were attempted initially
      expect(initialCallIndices.length).toBe(20);

      // C. All 20 requests were retried with the new token
      expect(retriedIndices.length).toBe(20);
      expect(retriedIndices.sort((a, b) => a - b)).toEqual(
        Array.from({ length: 20 }, (_, i) => i)
      );

      // D. All 20 promises resolved cleanly with correct unwrapped data
      expect(responses.length).toBe(20);
      responses.forEach((res, index) => {
        expect(res.id).toBe(index);
        expect(res.recovered).toBe(true);
        expect(res.tokenReceived).toBe("Bearer refreshed_access_token_super_safe");
      });

      // E. New tokens committed to storage
      expect(getAccessToken()).toBe("refreshed_access_token_super_safe");
      expect(getRefreshToken()).toBe("rotated_refresh_token_super_safe");
    });

    it("coalesces staggered burst: 10 requests at t=0 + 10 requests at t=20ms into 1 refresh", async () => {
      setTokens("staggered_expired", "staggered_rt");
      const client = new ApiClient("http://localhost:8080/api/v1");

      let refreshCallCount = 0;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
        const url = String(input);
        const headers = (init?.headers as Record<string, string>) || {};

        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          refreshCallCount++;
          // Network latency 50ms ensures wave 2 arrives while refresh is still in-flight
          await new Promise((r) => setTimeout(r, 50));
          return new Response(
            JSON.stringify({
              data: {
                access_token: "staggered_recovered_jwt",
                refresh_token: "staggered_recovered_rt",
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (headers["Authorization"] === "Bearer staggered_recovered_jwt") {
          return new Response(
            JSON.stringify({ data: { url, success: true } }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      // Wave 1: 10 requests at t=0
      const wave1 = Array.from({ length: 10 }, (_, i) =>
        client.get<{ success: boolean }>(`/staggered/wave1/${i}`)
      );

      // Wait 20ms (while refresh is in progress) then launch Wave 2: 10 requests
      await new Promise((r) => setTimeout(r, 20));
      const wave2 = Array.from({ length: 10 }, (_, i) =>
        client.get<{ success: boolean }>(`/staggered/wave2/${i}`)
      );

      const allResults = await Promise.all([...wave1, ...wave2]);

      expect(allResults.length).toBe(20);
      expect(allResults.every((r) => r.success)).toBe(true);
      expect(refreshCallCount).toBe(1);
    });

    it("coalesces 50 concurrent 401 requests under extreme high-concurrency burst", async () => {
      setTokens("extreme_expired", "extreme_rt");
      const client = new ApiClient("http://localhost:8080/api/v1");

      let refreshCount = 0;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
        const url = String(input);
        const headers = (init?.headers as Record<string, string>) || {};

        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          refreshCount++;
          await new Promise((r) => setTimeout(r, 30));
          return new Response(
            JSON.stringify({
              data: {
                access_token: "extreme_burst_token",
                refresh_token: "extreme_burst_rt",
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (headers["Authorization"] === "Bearer extreme_burst_token") {
          return new Response(
            JSON.stringify({ data: { ack: true } }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      const promises = Array.from({ length: 50 }, (_, i) =>
        client.get<{ ack: boolean }>(`/extreme/${i}`)
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(50);
      expect(results.every((r) => r.ack)).toBe(true);
      expect(refreshCount).toBe(1);
    });

    it("preserves HTTP method, headers, params, and body across concurrent 401 retries", async () => {
      setTokens("expired_mixed", "valid_rt_mixed");
      const client = new ApiClient("http://localhost:8080/api/v1");

      const capturedRequests: Array<{ method?: string; body?: string; url: string; auth?: string }> = [];

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
        const url = String(input);
        const headers = (init?.headers as Record<string, string>) || {};
        const method = init?.method || "GET";
        const body = init?.body as string | undefined;

        capturedRequests.push({ method, body, url, auth: headers["Authorization"] });

        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          await new Promise((r) => setTimeout(r, 20));
          return new Response(
            JSON.stringify({
              data: {
                access_token: "token_method_preserved",
                refresh_token: "rt_method_preserved",
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        if (headers["Authorization"] === "Bearer token_method_preserved") {
          return new Response(
            JSON.stringify({ data: { executed: true, method, body: body ? JSON.parse(body) : null } }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      // 4 concurrent requests with different HTTP verbs and payloads
      const [rGet, rPost, rPut, rDelete] = await Promise.all([
        client.get<{ executed: boolean }>("/study-sets", { params: { filter: "recent" } }),
        client.post<{ executed: boolean; body: any }>("/study-sets", { title: "Biology 101" }),
        client.put<{ executed: boolean; body: any }>("/study-sets/101", { title: "Updated Bio" }),
        client.delete<{ executed: boolean }>("/study-sets/101"),
      ]);

      expect(rGet.executed).toBe(true);
      expect(rPost.body).toEqual({ title: "Biology 101" });
      expect(rPut.body).toEqual({ title: "Updated Bio" });
      expect(rDelete.executed).toBe(true);

      // Verify the retried requests maintained their methods and bodies
      const retriedPost = capturedRequests.find(
        (c) => c.method === "POST" && c.auth === "Bearer token_method_preserved" && !c.url.includes("/auth/")
      );
      expect(retriedPost).toBeDefined();
      expect(JSON.parse(retriedPost!.body!)).toEqual({ title: "Biology 101" });

      const retriedPut = capturedRequests.find(
        (c) => c.method === "PUT" && c.auth === "Bearer token_method_preserved"
      );
      expect(retriedPut).toBeDefined();
      expect(JSON.parse(retriedPut!.body!)).toEqual({ title: "Updated Bio" });
    });

    it("prevents infinite loop if retried request with renewed token also returns 401", async () => {
      setTokens("expired_token", "valid_rt");
      const client = new ApiClient("http://localhost:8080/api/v1");

      let refreshCount = 0;
      let totalDataCalls = 0;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);

        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          refreshCount++;
          return new Response(
            JSON.stringify({
              data: {
                access_token: "new_but_server_still_rejects_jwt",
                refresh_token: "new_rt",
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        totalDataCalls++;
        // Server rejects both old and renewed tokens with 401
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Account disabled" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      // Must reject with ApiError(401) on the retry, NOT re-enter refresh loop
      await expect(client.get("/protected/resource")).rejects.toThrow(ApiError);
      expect(refreshCount).toBe(1);
      expect(totalDataCalls).toBe(2); // Initial attempt + exactly 1 retry
    });
  });

  /* ==========================================================================
     2. Refresh Failure Cascade & State Cleanup
     ========================================================================== */
  describe("Refresh Failure Cascade Handling", () => {
    it("rejects all 20 queued requests with ApiError and wipes storage when refresh returns 401", async () => {
      setTokens("expired_acc", "revoked_refresh_token_401");
      const client = new ApiClient("http://localhost:8080/api/v1");

      let refreshAttempts = 0;

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);

        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          refreshAttempts++;
          // Simulate 20ms delay so all 20 concurrent requests enter the queue
          await new Promise((r) => setTimeout(r, 20));
          return new Response(
            JSON.stringify({
              error: {
                code: "REFRESH_TOKEN_EXPIRED",
                message: "Refresh token has been revoked",
              },
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      const promises = Array.from({ length: 20 }, (_, i) =>
        client.get(`/cascade/${i}`)
      );

      const settled = await Promise.allSettled(promises);

      // VERIFICATIONS:
      // A. All 20 requests rejected
      expect(settled.length).toBe(20);
      expect(settled.every((s) => s.status === "rejected")).toBe(true);

      // B. Every rejected error is an ApiError with status 401
      settled.forEach((s) => {
        const err = (s as PromiseRejectedResult).reason;
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(401);
        expect((err as ApiError).code).toBe("REFRESH_TOKEN_EXPIRED");
      });

      // C. Storage is completely wiped
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(hasAccessToken()).toBe(false);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
      expect(getCookie(ACCESS_TOKEN_KEY)).toBeNull();
      expect(getCookie(REFRESH_TOKEN_KEY)).toBeNull();
    });

    it("rejects all 20 queued requests cleanly when refresh returns 400 Bad Request", async () => {
      setTokens("expired_acc", "malformed_refresh_token_400");
      const client = new ApiClient("http://localhost:8080/api/v1");

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);

        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          await new Promise((r) => setTimeout(r, 15));
          return new Response(
            JSON.stringify({
              error: {
                code: "INVALID_GRANT",
                message: "Invalid refresh token grant",
              },
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      const promises = Array.from({ length: 20 }, (_, i) =>
        client.get(`/cascade-400/${i}`)
      );

      const settled = await Promise.allSettled(promises);

      expect(settled.length).toBe(20);
      expect(settled.every((s) => s.status === "rejected")).toBe(true);
      settled.forEach((s) => {
        const err = (s as PromiseRejectedResult).reason;
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(400);
      });
      expect(getAccessToken()).toBeNull();
    });

    it("resets isRefreshing flag after cascade failure allowing subsequent requests to execute", async () => {
      setTokens("expired_acc", "failing_rt");
      const client = new ApiClient("http://localhost:8080/api/v1");

      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes("/auth/refresh") || url.includes("/auth/token")) {
          return new Response(
            JSON.stringify({ error: { code: "REFRESH_TOKEN_EXPIRED" } }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: { code: "UNAUTHORIZED" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      });

      // First batch fails with cascade
      await expect(client.get("/batch1")).rejects.toThrow();

      // Now set a valid token and make a new request
      setTokens("valid_token_now", "valid_rt_now");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { recovered: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await client.get<{ recovered: boolean }>("/batch2");
      expect(res.recovered).toBe(true);
    });

    it("transitions AuthContext user to null when initial session restore encounters refresh failure", async () => {
      setTokens("expired_token", "dead_rt");
      setCachedUser(mockProfileAlice);

      vi.spyOn(authApi, "getProfile").mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Token expired"));
      vi.spyOn(authApi, "refreshToken").mockRejectedValue(new ApiError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token expired"));

      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(TestAuthConsumer, null)
        )
      );

      // Loading should complete and user should transition to null
      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("auth-status").textContent).toBe("false");
      expect(screen.getByTestId("auth-user").textContent).toBe("none");
      expect(getAccessToken()).toBeNull();
      expect(getCachedUser()).toBeNull();
    });
  });

  /* ==========================================================================
     3. Multi-Tab Storage Desynchronization & Event Storms
     ========================================================================== */
  describe("Multi-Tab Storage Desync & Event Storms", () => {
    it("survives rapid storm of 30 cross-tab storage events without memory leak or unhandled rejections", async () => {
      setTokens("alice_token", "alice_rt");
      setCachedUser(mockProfileAlice);

      let profileCallCount = 0;
      vi.spyOn(authApi, "getProfile").mockImplementation(async () => {
        profileCallCount++;
        // Small delay to simulate network latency
        await new Promise((r) => setTimeout(r, 10));
        return mockProfileBob;
      });

      // Track unhandled promise rejections
      const unhandledRejections: unknown[] = [];
      const onUnhandled = (event: PromiseRejectionEvent) => {
        unhandledRejections.push(event.reason);
      };
      window.addEventListener("unhandledrejection", onUnhandled);

      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(TestAuthConsumer, null)
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      // Rapidly fire 30 alternating storage events (login -> logout -> login -> logout ...)
      await act(async () => {
        for (let i = 0; i < 30; i++) {
          const isLogout = i % 2 === 1;
          const tokenVal = isLogout ? null : `token_iteration_${i}`;
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: ACCESS_TOKEN_KEY,
              newValue: tokenVal,
            })
          );
        }
        // Let pending profile promises settle within act boundary
        await new Promise((r) => setTimeout(r, 100));
      });

      window.removeEventListener("unhandledrejection", onUnhandled);
      expect(unhandledRejections.length).toBe(0);
    });

    it("guarantees AuthContext settles to user = null when final event in storm is logout", async () => {
      setTokens("active_token", "active_rt");
      setCachedUser(mockProfileAlice);

      vi.spyOn(authApi, "getProfile").mockResolvedValue(mockProfileAlice);

      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(TestAuthConsumer, null)
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("true");
      });

      // Fire burst ending with logout (newValue: null)
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: ACCESS_TOKEN_KEY,
            newValue: "temp_token",
          })
        );
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: ACCESS_TOKEN_KEY,
            newValue: null,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("false");
        expect(screen.getByTestId("auth-user").textContent).toBe("none");
      });
    });

    it("guarantees AuthContext updates to Bob profile when final event in storm is Bob login", async () => {
      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(TestAuthConsumer, null)
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      vi.spyOn(authApi, "getProfile").mockResolvedValue(mockProfileBob);

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: ACCESS_TOKEN_KEY,
            newValue: "bob_final_token",
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("true");
        expect(screen.getByTestId("auth-user").textContent).toBe("bob@quizlet.com");
      });
    });

    it("cleans up storage event listener on unmount and prevents state updates", async () => {
      const { unmount } = render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(TestAuthConsumer, null)
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      // Unmount AuthProvider
      unmount();

      // Dispatching storage event after unmount must not trigger errors
      expect(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: ACCESS_TOKEN_KEY,
            newValue: "orphaned_event_token",
          })
        );
      }).not.toThrow();
    });

    it("ignores storage events for unrelated keys", async () => {
      setTokens("active_token", "active_rt");
      setCachedUser(mockProfileAlice);

      const profileSpy = vi.spyOn(authApi, "getProfile").mockResolvedValue(mockProfileAlice);

      render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(TestAuthConsumer, null)
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("true");
      });

      profileSpy.mockClear();

      // Fire storage event for unrelated localStorage key
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "theme_preference",
            newValue: "dark",
          })
        );
      });

      // Must NOT have called getProfile
      expect(profileSpy).not.toHaveBeenCalled();
      expect(screen.getByTestId("auth-status").textContent).toBe("true");
    });
  });

  /* ==========================================================================
     4. Dual-Storage Desynchronization & Asymmetric Recovery
     ========================================================================== */
  describe("Dual-Storage Desynchronization & Recovery", () => {
    it("recovers access and refresh tokens from cookies when localStorage is completely wiped", async () => {
      // Set tokens in cookies directly (simulating localStorage cleared by user)
      setCookie(ACCESS_TOKEN_KEY, "surviving_cookie_access_jwt");
      setCookie(REFRESH_TOKEN_KEY, "surviving_cookie_refresh_jwt");
      localStorage.clear();

      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();

      // Accessors must recover from cookies
      expect(getAccessToken()).toBe("surviving_cookie_access_jwt");
      expect(getRefreshToken()).toBe("surviving_cookie_refresh_jwt");
      expect(hasAccessToken()).toBe(true);

      // Accessors must also re-populate localStorage for high performance
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("surviving_cookie_access_jwt");
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("surviving_cookie_refresh_jwt");
    });

    it("maintains session via localStorage when cookies are wiped", async () => {
      // Set tokens in localStorage directly (simulating cookie policy wipe)
      localStorage.setItem(ACCESS_TOKEN_KEY, "surviving_local_access_jwt");
      localStorage.setItem(REFRESH_TOKEN_KEY, "surviving_local_refresh_jwt");
      deleteCookie(ACCESS_TOKEN_KEY);
      deleteCookie(REFRESH_TOKEN_KEY);

      expect(getCookie(ACCESS_TOKEN_KEY)).toBeNull();
      expect(getCookie(REFRESH_TOKEN_KEY)).toBeNull();

      // Accessors must read from localStorage
      expect(getAccessToken()).toBe("surviving_local_access_jwt");
      expect(getRefreshToken()).toBe("surviving_local_refresh_jwt");
      expect(hasAccessToken()).toBe(true);

      // Re-saving tokens re-synchronizes cookies
      setTokens("surviving_local_access_jwt", "surviving_local_refresh_jwt");
      expect(getCookie(ACCESS_TOKEN_KEY)).toBe("surviving_local_access_jwt");
      expect(getCookie(REFRESH_TOKEN_KEY)).toBe("surviving_local_refresh_jwt");
    });

    it("falls back to cookies if localStorage throws SecurityError (Incognito Mode)", () => {
      setCookie(ACCESS_TOKEN_KEY, "incognito_cookie_token");

      // Mock localStorage.getItem to simulate incognito storage access denial
      const originalGetItem = localStorage.getItem;
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });

      expect(getAccessToken()).toBe("incognito_cookie_token");
      Storage.prototype.getItem = originalGetItem;
    });

    it("safely falls back to cookies if localStorage throws QuotaExceededError", () => {
      const originalSetItem = localStorage.setItem;
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      });

      // Must not throw when setting tokens
      expect(() => {
        setTokens("quota_acc_token", "quota_ref_token");
      }).not.toThrow();

      // Cookies must still be populated
      expect(getCookie(ACCESS_TOKEN_KEY)).toBe("quota_acc_token");
      expect(getCookie(REFRESH_TOKEN_KEY)).toBe("quota_ref_token");

      Storage.prototype.setItem = originalSetItem;
    });

    it("safely handles corrupted or malformed percent-encoded cookie strings without throwing URIError", () => {
      // Set raw malformed cookie with broken percent-encoding
      document.cookie = `${encodeURIComponent(ACCESS_TOKEN_KEY)}=%E0%A4%A; path=/;`;

      // Must not throw URIError: URI malformed
      let token: string | null = null;
      expect(() => {
        token = getCookie(ACCESS_TOKEN_KEY);
      }).not.toThrow();

      expect(token).toBe("%E0%A4%A");
    });

    it("safely recovers when cached user in localStorage is malformed non-JSON", () => {
      localStorage.setItem(USER_CACHE_KEY, "MALFORMED_NON_JSON_{{[{");

      expect(() => {
        const cached = getCachedUser();
        expect(cached).toBeNull();
      }).not.toThrow();
    });
  });
});
