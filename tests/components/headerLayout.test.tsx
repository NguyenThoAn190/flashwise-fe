import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { Header } from "@/components/layout/Header";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import DashboardLayout from "@/app/[locale]/(dashboard)/layout";

// Mock Next.js navigation hooks
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
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock AuthContext
const mockLogout = vi.fn();
let mockIsAuthenticated = true;
let mockIsLoading = false;
let mockUser: any = {
  id: "usr_test_101",
  email: "student@flashwise.local",
  username: "flashwisestudent",
  full_name: "Flashwise Student",
  avatar_url: "https://example.com/avatar.png",
  stats: {
    current_streak: 7,
    total_study_sets: 3,
  },
};

vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockIsAuthenticated ? mockUser : null,
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    login: vi.fn(),
    signup: vi.fn(),
    logout: mockLogout,
    refreshProfile: vi.fn(),
  }),
}));

describe("Milestone 3 - Header & Mobile Drawer Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsLoading = false;
    mockUser = {
      id: "usr_test_101",
      email: "student@flashwise.local",
      username: "flashwisestudent",
      full_name: "Flashwise Student",
      avatar_url: "https://example.com/avatar.png",
      stats: {
        current_streak: 7,
        total_study_sets: 3,
      },
    };
  });

  /* ==========================================================================
     1. Header Navigation & Branding
     ========================================================================== */
  describe("Header Component", () => {
    it("renders Flashwise brand logo and navigation links", () => {
      render(<Header />);

      // Logo Flashwise giữ trong sr-only cho a11y
      const logoLink = screen.getByLabelText("Flashwise Home");
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute("href", "/");
      expect(logoLink.textContent).toContain("Flashwise");

      // Desktop nav links
      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
      // Đã đăng nhập: ẩn Công cụ học, Thư viện trỏ sang route /library mới
      expect(screen.queryByTestId("study-tools-trigger")).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Your library" })).toHaveAttribute("href", "/library");
    });

    it("keeps /progress reachable from profile dropdown after library split", () => {
      render(<Header />);

      // Desktop nav now also has a top-level /progress link — scope the
      // dropdown assertion to the opened menu to avoid ambiguity.
      expect(screen.getByTestId("header-progress-link")).toHaveAttribute("href", "/progress");

      fireEvent.click(screen.getByTestId("header-avatar-trigger"));
      const menu = screen.getByTestId("dropdown-menu");
      fireEvent.click(within(menu).getByText("Progress"));
      expect(mockPush).toHaveBeenCalledWith("/progress");
    });

    it("handles search input submission via callback and router fallback", () => {
      const onSearchMock = vi.fn();
      render(<Header onSearch={onSearchMock} />);

      const searchInput = screen.getByTestId("header-search-input");
      fireEvent.change(searchInput, { target: { value: "Organic Chemistry" } });
      fireEvent.submit(searchInput.closest("form")!);

      expect(onSearchMock).toHaveBeenCalledWith("Organic Chemistry");
    });

    it("navigates to search query URL when onSearch prop is omitted", () => {
      render(<Header />);

      const searchInput = screen.getByTestId("header-search-input");
      fireEvent.change(searchInput, { target: { value: "Spanish Vocab" } });
      fireEvent.submit(searchInput.closest("form")!);

      expect(mockPush).toHaveBeenCalledWith("/?search=Spanish%20Vocab");
    });

    it("opens Create dropdown and navigates to study set creator", () => {
      render(<Header />);

      const createBtn = screen.getByTestId("header-create-button");
      fireEvent.click(createBtn);

      const studySetOption = screen.getByText("Study set");
      expect(studySetOption).toBeInTheDocument();
      expect(screen.getByText("Folder")).toBeInTheDocument();

      fireEvent.click(studySetOption);
      expect(mockPush).toHaveBeenCalledWith("/set/create");
    });

    it("renders streak badge with current streak number when authenticated", () => {
      render(<Header />);

      const streakBadge = screen.getByTestId("header-streak-badge");
      expect(streakBadge).toBeInTheDocument();
      expect(streakBadge).toHaveAttribute("aria-label", "7 day study streak");
      expect(streakBadge.textContent).toContain("7");
    });

    it("renders user avatar and opens account menu on click", async () => {
      render(<Header />);

      const avatarTrigger = screen.getByTestId("header-avatar-trigger");
      expect(avatarTrigger).toBeInTheDocument();

      fireEvent.click(avatarTrigger);

      // Verify dropdown details — scope to the opened menu because the
      // top-level desktop nav now also renders a "Progress" link.
      const menu = screen.getByTestId("dropdown-menu");
      expect(within(menu).getByText("Flashwise Student")).toBeInTheDocument();
      expect(within(menu).getByText("@flashwisestudent")).toBeInTheDocument();
      expect(within(menu).getByText("student@flashwise.local")).toBeInTheDocument();

      const settingsBtn = within(menu).getByText("Settings");
      const progressBtn = within(menu).getByText("Progress");
      const logoutBtn = within(menu).getByText("Log out");

      expect(settingsBtn).toBeInTheDocument();
      expect(progressBtn).toBeInTheDocument();
      expect(logoutBtn).toBeInTheDocument();

      // Click settings
      fireEvent.click(settingsBtn);
      expect(mockPush).toHaveBeenCalledWith("/settings");

      // Reopen and click logout
      fireEvent.click(avatarTrigger);
      fireEvent.click(within(screen.getByTestId("dropdown-menu")).getByText("Log out"));
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it("renders initials fallback when avatar_url is missing", () => {
      mockUser.avatar_url = undefined;
      render(<Header />);

      // Initials for "Flashwise Student" is "FS"
      expect(screen.getByText("FS")).toBeInTheDocument();
    });

    it("renders guest login and signup buttons when unauthenticated", () => {
      mockIsAuthenticated = false;
      render(<Header />);

      expect(screen.queryByTestId("header-streak-badge")).not.toBeInTheDocument();
      expect(screen.queryByTestId("header-avatar-trigger")).not.toBeInTheDocument();

      expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
      expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
    });

    it("shows study tools but hides library for public menu when unauthenticated", () => {
      mockIsAuthenticated = false;
      render(<Header />);

      // Menu công khai: Công cụ học vẫn hiện, Thư viện ẩn
      expect(screen.getByTestId("study-tools-trigger")).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Your library" })
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("study-tools-trigger"));
      expect(screen.getByTestId("study-tool-flashcards")).toBeInTheDocument();
      expect(screen.getByTestId("study-tool-learn")).toBeInTheDocument();
      // 7 tools đều có landing riêng: 4 món đã có app + 3 món sắp có
      fireEvent.click(screen.getByTestId("study-tool-test"));
      expect(mockPush).toHaveBeenCalledWith("/tools/test");
      fireEvent.click(screen.getByTestId("study-tools-trigger"));
      fireEvent.click(screen.getByTestId("study-tool-live"));
      expect(mockPush).toHaveBeenCalledWith("/tools/live");
    });

    it("opens mobile drawer when hamburger button is clicked", () => {
      render(<Header />);

      expect(screen.queryByTestId("mobile-drawer-portal")).not.toBeInTheDocument();

      const menuTrigger = screen.getByTestId("mobile-menu-trigger");
      fireEvent.click(menuTrigger);

      expect(screen.getByTestId("mobile-drawer-portal")).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     2. MobileDrawer Component
     ========================================================================== */
  describe("MobileDrawer Component", () => {
    it("renders mobile drawer with focus trap, backdrop, navigation, and close button", () => {
      const handleClose = vi.fn();
      render(
        <MobileDrawer
          isOpen={true}
          onClose={handleClose}
          user={mockUser}
          streak={7}
          onLogout={mockLogout}
        />
      );

      expect(screen.getByTestId("mobile-drawer-portal")).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Navigation Menu" })).toBeInTheDocument();

      // Close button
      const closeBtn = screen.getByTestId("mobile-drawer-close");
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Backdrop click closes drawer
      const backdrop = screen.getByTestId("mobile-drawer-backdrop");
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });

    it("closes on Escape key press", () => {
      const handleClose = vi.fn();
      render(
        <MobileDrawer
          isOpen={true}
          onClose={handleClose}
          user={mockUser}
          streak={7}
          onLogout={mockLogout}
        />
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("locks and unlocks body scroll on open and close", () => {
      const { unmount } = render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={mockUser}
          streak={7}
          onLogout={mockLogout}
        />
      );

      expect(document.body.style.overflow).toBe("hidden");

      unmount();
      expect(document.body.style.overflow).toBe("");
    });

    it("traps keyboard focus with Tab and Shift+Tab", () => {
      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={mockUser}
          streak={7}
          onLogout={mockLogout}
        />
      );

      const portal = screen.getByTestId("mobile-drawer-portal");
      const drawer = screen.getByRole("dialog", { name: "Navigation Menu" });
      const focusables = drawer.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      expect(focusables.length).toBeGreaterThan(1);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Tab on last wraps to first
      last.focus();
      expect(document.activeElement).toBe(last);
      fireEvent.keyDown(portal, { key: "Tab" });
      expect(document.activeElement).toBe(first);

      // Shift+Tab on first wraps to last
      first.focus();
      expect(document.activeElement).toBe(first);
      fireEvent.keyDown(portal, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(last);
    });

    it("handles search and navigation actions in mobile drawer", () => {
      const handleClose = vi.fn();
      const onSearchMock = vi.fn();
      render(
        <MobileDrawer
          isOpen={true}
          onClose={handleClose}
          user={mockUser}
          streak={7}
          onLogout={mockLogout}
          onSearch={onSearchMock}
        />
      );

      // Search input
      const searchInput = screen.getByPlaceholderText("Study sets, textbooks, questions...");
      fireEvent.change(searchInput, { target: { value: "Psychology" } });
      fireEvent.submit(searchInput.closest("form")!);

      expect(onSearchMock).toHaveBeenCalledWith("Psychology");
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Create button
      const createBtn = screen.getByRole("button", { name: "Create study set" });
      fireEvent.click(createBtn);
      expect(mockPush).toHaveBeenCalledWith("/set/create");
      expect(handleClose).toHaveBeenCalledTimes(2);
    });

    it("handles logout inside mobile drawer", async () => {
      const handleClose = vi.fn();
      render(
        <MobileDrawer
          isOpen={true}
          onClose={handleClose}
          user={mockUser}
          streak={7}
          onLogout={mockLogout}
        />
      );

      const logoutBtn = screen.getByRole("button", { name: "Log out" });
      fireEvent.click(logoutBtn);

      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it("renders login and signup buttons when user is null", () => {
      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={null}
          streak={0}
          onLogout={mockLogout}
        />
      );

      expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
    });

    it("trims duplicate links when authenticated — bottom bar owns Home/Library/Progress", () => {
      const handleClose = vi.fn();
      const { unmount } = render(
        <MobileDrawer
          isOpen={true}
          onClose={handleClose}
          user={mockUser}
          streak={7}
          onLogout={mockLogout}
        />
      );

      // Drawer gọn: không còn link trùng với bottom bar
      expect(screen.queryByRole("link", { name: "Your library" })).not.toBeInTheDocument();
      expect(screen.queryByTestId("mobile-drawer-progress")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
      // Hint hướng user xuống bottom bar
      expect(
        screen.getByText("Use the bottom bar to switch between Home, Library, Progress and Me.")
      ).toBeInTheDocument();
      // Vẫn giữ Settings + Logout trong drawer
      expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
      expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();

      unmount();

      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={null}
          streak={0}
          onLogout={mockLogout}
        />
      );
      expect(screen.queryByTestId("mobile-drawer-progress")).not.toBeInTheDocument();
      // Khách vẫn thấy Home trong drawer vì chưa có bottom bar
      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    });
  });

  /* ==========================================================================
     3. DashboardLayout Component
     ========================================================================== */
  describe("DashboardLayout Component", () => {
    it("renders Header and children inside authenticated dashboard shell", () => {
      render(
        <DashboardLayout>
          <div data-testid="dashboard-child-content">Child View</div>
        </DashboardLayout>
      );

      expect(screen.getByRole("banner")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-child-content")).toBeInTheDocument();
    });
  });
});
