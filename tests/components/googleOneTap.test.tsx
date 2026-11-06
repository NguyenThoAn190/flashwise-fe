import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { GoogleOneTap } from "@/components/auth/GoogleOneTap";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));

// Capture options truyền vào hook One Tap để test gọi tay onSuccess/onError
let capturedOptions: any = null;
let hookCallCount = 0;
vi.mock("@react-oauth/google", () => ({
  useGoogleOneTapLogin: (options: any) => {
    hookCallCount += 1;
    capturedOptions = options;
  },
}));

// Mock GoogleAuthProvider.isGoogleConfigured qua env
vi.mock("@/components/auth/GoogleAuthProvider", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/auth/GoogleOneTap")>();
  return {
    ...actual,
    isGoogleConfigured: () => (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").length > 5,
  };
});

// Control AuthContext state
let mockIsAuthenticated = false;
let mockIsLoading = false;
const mockLoginGoogle = vi.fn();
vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockIsAuthenticated ? { id: "u1", email: "a@b.c" } : null,
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    login: vi.fn(),
    loginGoogle: mockLoginGoogle,
    loginGoogleCode: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

describe("GoogleOneTap (kiểu Canva)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookCallCount = 0;
    capturedOptions = null;
    mockIsAuthenticated = false;
    mockIsLoading = false;
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
  });

  it("không render DOM gì (popup do Google GIS tự vẽ)", () => {
    const { container } = render(<GoogleOneTap />);
    expect(container.firstChild).toBeNull();
    expect(capturedOptions).toBeDefined();
  });

  it("chưa login thì bật prompt (disabled=false), auto_select=true giống Canva", () => {
    render(<GoogleOneTap />);
    expect(capturedOptions.disabled).toBe(false);
    expect(capturedOptions.auto_select).toBe(true);
    expect(capturedOptions.cancel_on_tap_outside).toBe(true);
  });

  it("đã login thì tắt prompt để tránh bị Google rate-limit", () => {
    mockIsAuthenticated = true;
    render(<GoogleOneTap />);
    expect(capturedOptions.disabled).toBe(true);
  });

  it("đang loading session thì tắt prompt (chờ verify xong mới quyết định)", () => {
    mockIsLoading = true;
    render(<GoogleOneTap />);
    expect(capturedOptions.disabled).toBe(true);
  });

  it("chưa cấu hình Client ID thì return null, không gọi hook (an toàn khi thiếu Provider)", () => {
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "";
    const { container } = render(<GoogleOneTap />);
    expect(container.firstChild).toBeNull();
    expect(capturedOptions).toBeNull();
  });

  it("onSuccess: gọi loginGoogle(idToken) rồi router.push(redirect đã sanitize)", async () => {
    mockLoginGoogle.mockResolvedValueOnce({ id: "u1" });
    const onSuccess = vi.fn();
    render(<GoogleOneTap redirectParam="/set/create" onSuccess={onSuccess} />);

    await capturedOptions.onSuccess({ credential: "fake-id-token-123" });

    await waitFor(() => {
      expect(mockLoginGoogle).toHaveBeenCalledWith("fake-id-token-123");
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/set/create");
    });
  });

  it("onSuccess: redirect độc hại bị sanitize về / (chống open-redirect)", async () => {
    mockLoginGoogle.mockResolvedValueOnce({ id: "u1" });
    render(<GoogleOneTap redirectParam="https://evil.com/steal" />);

    await capturedOptions.onSuccess({ credential: "tok" });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("onSuccess: không có credential thì không gọi gì cả", async () => {
    render(<GoogleOneTap />);
    await capturedOptions.onSuccess({});
    expect(mockLoginGoogle).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("onSuccess: loginGoogle fail thì gọi onError, KHÔNG router.push, KHÔNG throw", async () => {
    mockLoginGoogle.mockRejectedValueOnce(new Error("backend 500"));
    const onError = vi.fn();
    render(<GoogleOneTap redirectParam="/dashboard" onError={onError} />);

    await capturedOptions.onSuccess({ credential: "bad-token" });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("onError GIS (bấm X / FedCM chặn): forward onError để form im lặng fallback nút to", () => {
    const onError = vi.fn();
    render(<GoogleOneTap onError={onError} />);
    capturedOptions.onError();
    expect(onError).toHaveBeenCalledWith("google_one_tap_dismissed");
  });

  it("mỗi mount chỉ gọi hook 1 lần (tránh double prompt)", () => {
    render(<GoogleOneTap />);
    expect(hookCallCount).toBe(1);
  });
});
