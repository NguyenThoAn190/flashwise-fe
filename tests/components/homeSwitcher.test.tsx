import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeSwitcher } from "@/components/home/HomeSwitcher";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

let mockAuthState = {
  user: null as unknown,
  isAuthenticated: false,
  isLoading: true,
  hasTokenHint: undefined as boolean | undefined,
};

vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    isAuthenticated: mockAuthState.isAuthenticated,
    isLoading: mockAuthState.isLoading,
    hasTokenHint: mockAuthState.hasTokenHint,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

vi.mock("@/components/landing/LandingHome", () => ({
  LandingHome: () => <div data-testid="landing-home">landing</div>,
}));
vi.mock("@/components/home/DashboardHome", () => ({
  DashboardHome: () => <div data-testid="dashboard-home">dashboard</div>,
}));
vi.mock("@/components/home/DashboardSkeleton", () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">skeleton</div>,
}));

describe("HomeSwitcher single-URL SEO-safe branching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasTokenHint: undefined,
    };
  });

  it("guest (no token hint, not loading): renders landing immediately", () => {
    mockAuthState.isLoading = false;
    mockAuthState.hasTokenHint = false;
    render(<HomeSwitcher initialHasToken={false} />);
    expect(screen.getByTestId("landing-home")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-skeleton")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-home")).not.toBeInTheDocument();
  });

  it("maybe-authed (loading + hasToken): renders skeleton, never landing", () => {
    mockAuthState.isLoading = true;
    mockAuthState.hasTokenHint = true;
    render(<HomeSwitcher initialHasToken={true} />);
    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-home")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-home")).not.toBeInTheDocument();
  });

  it("verified session: renders dashboard directly without landing intermediary", () => {
    mockAuthState.isLoading = false;
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: "u1" };
    mockAuthState.hasTokenHint = true;
    render(<HomeSwitcher initialHasToken={true} />);
    expect(screen.getByTestId("dashboard-home")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-home")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-skeleton")).not.toBeInTheDocument();
  });

  it("SEO bot path (no hint prop, loading): falls back to landing SSR", () => {
    mockAuthState.isLoading = true;
    mockAuthState.hasTokenHint = undefined;
    render(<HomeSwitcher />);
    expect(screen.getByTestId("landing-home")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-skeleton")).not.toBeInTheDocument();
  });
});
