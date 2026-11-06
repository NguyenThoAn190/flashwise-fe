import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const mockPush = vi.fn();
let mockPathname = "/";
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
  usePathname: () => mockPathname,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname ?? "/"} {...rest}>
      {children}
    </a>
  ),
  redirect: vi.fn(),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockPathname,
  getPathname: () => mockPathname,
}));

let mockIsAuthenticated = true;
let mockUser: any = {
  id: "usr_test_101",
  email: "student@flashwise.local",
  username: "flashwisestudent",
  full_name: "Flashwise Student",
  avatar_url: undefined,
  stats: { current_streak: 7, total_study_sets: 3 },
};

vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockIsAuthenticated ? mockUser : null,
    isAuthenticated: mockIsAuthenticated,
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

describe("MobileBottomNav — thanh bottom 5 tab sau đăng nhập", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockPathname = "/";
    mockUser = {
      id: "usr_test_101",
      email: "student@flashwise.local",
      username: "flashwisestudent",
      full_name: "Flashwise Student",
      avatar_url: undefined,
      stats: { current_streak: 7, total_study_sets: 3 },
    };
  });

  it("hiện đủ 5 tab và FAB tạo set khi đã đăng nhập", () => {
    render(<MobileBottomNav />);

    expect(screen.getByTestId("mobile-bottom-nav")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-home")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("bottom-nav-library")).toHaveAttribute("href", "/library");
    expect(screen.getByTestId("bottom-nav-create")).toHaveAttribute("href", "/set/create");
    expect(screen.getByTestId("bottom-nav-progress")).toHaveAttribute("href", "/progress");
    expect(screen.getByTestId("bottom-nav-profile")).toHaveAttribute("href", "/settings");
  });

  it("ẩn hoàn toàn khi chưa đăng nhập", () => {
    mockIsAuthenticated = false;
    const { container } = render(<MobileBottomNav />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("mobile-bottom-nav")).not.toBeInTheDocument();
  });

  it("highlight đúng tab Library theo route", () => {
    mockPathname = "/library";
    render(<MobileBottomNav />);

    expect(screen.getByTestId("bottom-nav-library")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("bottom-nav-home")).not.toHaveAttribute("aria-current");
  });

  it("highlight tab Tôi trên trang settings", () => {
    mockPathname = "/settings";
    render(<MobileBottomNav />);

    expect(screen.getByTestId("bottom-nav-profile")).toHaveAttribute("aria-current", "page");
  });

  it("tôn trọng safe-area iOS", () => {
    render(<MobileBottomNav />);
    const nav = screen.getByTestId("mobile-bottom-nav");
    expect(nav.className).toContain("pb-[env(safe-area-inset-bottom)]");
  });
});
