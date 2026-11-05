import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { GuestGuard } from "@/components/auth/GuestGuard";
import * as authApi from "@/lib/api/auth";
import * as storage from "@/lib/api/storage";
import { UserProfile, TokenResponse } from "@/types/auth";

// Mock Next.js Navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = "/dashboard";
let mockSearchParams = new URLSearchParams();

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
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// Test consumer helper component
function TestConsumer({
  onRender,
}: {
  onRender?: (auth: ReturnType<typeof useAuth>) => void;
}) {
  const auth = useAuth();
  if (onRender) onRender(auth);

  return (
    <div>
      <span data-testid="auth-loading">{String(auth.isLoading)}</span>
      <span data-testid="auth-status">{String(auth.isAuthenticated)}</span>
      <span data-testid="auth-user-email">{auth.user?.email || "none"}</span>
      <button
        onClick={() => auth.login({ username: "test@quizlet.com", password: "password123" })}
        data-testid="login-btn"
      >
        Log in
      </button>
      <button
        onClick={() => auth.signup({ email: "new@quizlet.com", password: "password123", full_name: "Newbie" })}
        data-testid="signup-btn"
      >
        Sign up
      </button>
      <button onClick={() => auth.logout()} data-testid="logout-btn">
        Log out
      </button>
      <button onClick={() => auth.refreshProfile()} data-testid="refresh-profile-btn">
        Refresh Profile
      </button>
    </div>
  );
}

const mockUserProfile: UserProfile = {
  id: "usr_mock_1",
  public_id: "usr_pub_1",
  email: "demo@quizlet.local",
  username: "demostudent",
  full_name: "Demo Student",
  role: "USER",
  stats: {
    total_study_sets: 3,
    cards_mastered: 10,
    current_streak: 4,
  },
};

const mockTokens: TokenResponse = {
  access_token: "mock_jwt_access",
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token: "mock_rt_refresh",
};

describe("AuthContext & Guards Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/dashboard";
    mockSearchParams = new URLSearchParams();
    storage.clearTokens();
  });

  afterEach(() => {
    storage.clearTokens();
    vi.restoreAllMocks();
  });

  /* ==========================================================================
     1. Provider Mount & Initial Session Restoration
     ========================================================================== */
  describe("Provider Initialization & Session Restoration", () => {
    it("initializes as unauthenticated when no token is in storage", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("auth-status").textContent).toBe("false");
      expect(screen.getByTestId("auth-user-email").textContent).toBe("none");
    });

    it("restores user session when valid token exists in storage", async () => {
      storage.setTokens("valid_token", "valid_rt");
      vi.spyOn(authApi, "getProfile").mockResolvedValueOnce(mockUserProfile);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("auth-status").textContent).toBe("true");
      expect(screen.getByTestId("auth-user-email").textContent).toBe("demo@quizlet.local");
      expect(authApi.getProfile).toHaveBeenCalledTimes(1);
    });

    it("attempts refresh token recovery when getProfile initially fails with 401", async () => {
      storage.setTokens("expired_token", "recoverable_rt");

      vi.spyOn(authApi, "getProfile")
        .mockRejectedValueOnce(new Error("Token expired"))
        .mockResolvedValueOnce(mockUserProfile);
      vi.spyOn(authApi, "refreshToken").mockResolvedValueOnce(mockTokens);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("auth-status").textContent).toBe("true");
      expect(screen.getByTestId("auth-user-email").textContent).toBe("demo@quizlet.local");
    });

    it("clears user session when profile fails and no refresh token exists", async () => {
      storage.setAccessToken("orphaned_token");
      vi.spyOn(authApi, "getProfile").mockRejectedValueOnce(new Error("Unauthorized"));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("auth-status").textContent).toBe("false");
      expect(screen.getByTestId("auth-user-email").textContent).toBe("none");
      expect(storage.getAccessToken()).toBeNull();
    });
  });

  /* ==========================================================================
     2. Cross-Tab Session Synchronization
     ========================================================================== */
  describe("Cross-Tab Storage Event Synchronization", () => {
    it("clears user session when another tab broadcasts token removal", async () => {
      storage.setTokens("valid_token", "valid_rt");
      vi.spyOn(authApi, "getProfile").mockResolvedValue(mockUserProfile);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("true");
      });

      // Another tab logged out
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: storage.ACCESS_TOKEN_KEY,
            newValue: null,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("false");
        expect(screen.getByTestId("auth-user-email").textContent).toBe("none");
      });
    });

    it("restores user session when another tab broadcasts a new token", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });
      expect(screen.getByTestId("auth-status").textContent).toBe("false");

      // Another tab logged in
      vi.spyOn(authApi, "getProfile").mockResolvedValueOnce(mockUserProfile);

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: storage.ACCESS_TOKEN_KEY,
            newValue: "new_tab_token",
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("true");
        expect(screen.getByTestId("auth-user-email").textContent).toBe("demo@quizlet.local");
      });
    });
  });

  /* ==========================================================================
     3. Login, Signup, Logout, and Refresh Action Workflows
     ========================================================================== */
  describe("Auth Actions (Login, Signup, Logout)", () => {
    it("login authenticates user, updates state, and caches user", async () => {
      vi.spyOn(authApi, "login").mockResolvedValueOnce(mockTokens);
      vi.spyOn(authApi, "getProfile").mockResolvedValueOnce(mockUserProfile);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      act(() => {
        screen.getByTestId("login-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("true");
        expect(screen.getByTestId("auth-user-email").textContent).toBe("demo@quizlet.local");
      });

      expect(authApi.login).toHaveBeenCalledWith("test@quizlet.com", "password123");
    });

    it("signup registers user, authenticates, and sets user state", async () => {
      vi.spyOn(authApi, "signup").mockResolvedValueOnce(mockUserProfile);
      vi.spyOn(authApi, "login").mockResolvedValueOnce(mockTokens);
      vi.spyOn(authApi, "getProfile").mockResolvedValueOnce(mockUserProfile);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-loading").textContent).toBe("false");
      });

      act(() => {
        screen.getByTestId("signup-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("true");
        expect(screen.getByTestId("auth-user-email").textContent).toBe("demo@quizlet.local");
      });

      expect(authApi.signup).toHaveBeenCalledWith(
        "new@quizlet.com",
        "password123",
        "Newbie",
        undefined
      );
    });

    it("logout invalidates session, wipes tokens, and redirects to /login", async () => {
      storage.setTokens("active_token", "active_rt");
      vi.spyOn(authApi, "getProfile").mockResolvedValueOnce(mockUserProfile);
      vi.spyOn(authApi, "signout").mockResolvedValueOnce({ message: "Signed out", success: true });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("true");
      });

      act(() => {
        screen.getByTestId("logout-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status").textContent).toBe("false");
        expect(screen.getByTestId("auth-user-email").textContent).toBe("none");
      });

      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(storage.getAccessToken()).toBeNull();
    });

    it("refreshProfile re-fetches latest profile and updates state", async () => {
      storage.setTokens("valid_token", "valid_rt");
      vi.spyOn(authApi, "getProfile")
        .mockResolvedValueOnce(mockUserProfile)
        .mockResolvedValueOnce({
          ...mockUserProfile,
          email: "updated@quizlet.local",
        });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-user-email").textContent).toBe("demo@quizlet.local");
      });

      act(() => {
        screen.getByTestId("refresh-profile-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-user-email").textContent).toBe("updated@quizlet.local");
      });
    });

    it("throws error when useAuth is consumed outside AuthProvider", () => {
      // Suppress console.error in Vitest for expected component crash
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleErrorSpy.mockRestore();
    });
  });

  /* ==========================================================================
     4. AuthGuard and GuestGuard Route Protection
     ========================================================================== */
  describe("AuthGuard & GuestGuard Route Protection", () => {
    it("AuthGuard redirects unauthenticated users to /login?redirect=...", async () => {
      mockPathname = "/set/create";
      mockSearchParams = new URLSearchParams();

      render(
        <AuthProvider>
          <AuthGuard>
            <div data-testid="protected-content">Secret Set Creator</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/login?redirect=%2Fset%2Fcreate");
      });

      expect(screen.queryByTestId("protected-content")).toBeNull();
    });

    it("AuthGuard renders protected children when user is authenticated", async () => {
      storage.setTokens("valid_token", "valid_rt");
      vi.spyOn(authApi, "getProfile").mockResolvedValueOnce(mockUserProfile);

      render(
        <AuthProvider>
          <AuthGuard>
            <div data-testid="protected-content">Secret Set Creator</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("protected-content")).toBeDefined();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("GuestGuard redirects authenticated users to destination or /", async () => {
      storage.setTokens("valid_token", "valid_rt");
      vi.spyOn(authApi, "getProfile").mockResolvedValueOnce(mockUserProfile);
      mockSearchParams = new URLSearchParams("redirect=%2Fdashboard%2Frecent");

      render(
        <AuthProvider>
          <GuestGuard>
            <div data-testid="guest-content">Login Form</div>
          </GuestGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/dashboard/recent");
      });

      expect(screen.queryByTestId("guest-content")).toBeNull();
    });

    it("GuestGuard renders guest content for unauthenticated users", async () => {
      render(
        <AuthProvider>
          <GuestGuard>
            <div data-testid="guest-content">Login Form</div>
          </GuestGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("guest-content")).toBeDefined();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
