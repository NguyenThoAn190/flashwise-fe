import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { Header } from "@/components/layout/Header";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { DueReviewsBanner } from "@/components/layout/DueReviewsBanner";
import { StudySetCard } from "@/components/sets/StudySetCard";
import { EmptyStudySets } from "@/components/sets/EmptyStudySets";
import DashboardPage from "@/app/[locale]/(dashboard)/page";
import DashboardLayout from "@/app/[locale]/(dashboard)/layout";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import * as studySetsApi from "@/lib/api/studySets";
import { StudySet } from "@/types/studySet";

// ---------------------------------------------------------------------------
// Next.js Navigation Mocks
// ---------------------------------------------------------------------------
const mockPush = vi.fn();
const mockReplace = vi.fn();
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
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/",
}));

// ---------------------------------------------------------------------------
// AuthContext Mocks
// ---------------------------------------------------------------------------
const mockLogout = vi.fn();
let mockIsAuthenticated = true;
let mockIsLoading = false;
let mockUser: any = {
  id: "usr_stress_adv",
  email: "adversary@quizlet.local",
  username: "adversary",
  full_name: "Adversarial Challenger",
  avatar_url: "https://avatar.test/adv.png",
  stats: {
    current_streak: 42,
    total_study_sets: 8,
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

// ---------------------------------------------------------------------------
// StudySets API Mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/api/studySets", () => ({
  apiGetStudySets: vi.fn(),
  apiGetDueReviews: vi.fn(),
  apiUpdateStudySet: vi.fn(),
  apiDeleteStudySet: vi.fn(),
  apiCreateStudySet: vi.fn(),
  apiDuplicateStudySet: vi.fn(),
}));

describe("Milestone 3 Empirical Challenger: Layout, Accessibility, Event Isolation & State Stress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
    document.body.style.overflow = "";
    mockIsAuthenticated = true;
    mockIsLoading = false;
    mockUser = {
      id: "usr_stress_adv",
      email: "adversary@quizlet.local",
      username: "adversary",
      full_name: "Adversarial Challenger",
      avatar_url: "https://avatar.test/adv.png",
      stats: {
        current_streak: 42,
        total_study_sets: 8,
      },
    };
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  /* ==========================================================================
     1. MobileDrawer Focus Trapping Rigor & Keyboard A11y
     ========================================================================== */
  describe("1. MobileDrawer Focus Trap Rigor & Keyboard A11y", () => {
    it("rigorously traps Tab navigation: cycles forward from last element to first element", () => {
      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={mockUser}
          streak={42}
          onLogout={mockLogout}
        />
      );

      const portal = screen.getByTestId("mobile-drawer-portal");
      const drawer = screen.getByRole("dialog", { name: "Navigation Menu" });
      const focusables = drawer.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      expect(focusables.length).toBeGreaterThan(3);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Focus last element
      last.focus();
      expect(document.activeElement).toBe(last);

      // Press Tab on last element -> wraps to first
      fireEvent.keyDown(portal, { key: "Tab" });
      expect(document.activeElement).toBe(first);
    });

    it("rigorously traps Shift+Tab navigation: cycles backward from first element to last element", () => {
      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={mockUser}
          streak={42}
          onLogout={mockLogout}
        />
      );

      const portal = screen.getByTestId("mobile-drawer-portal");
      const drawer = screen.getByRole("dialog", { name: "Navigation Menu" });
      const focusables = drawer.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Focus first element
      first.focus();
      expect(document.activeElement).toBe(first);

      // Press Shift+Tab on first element -> wraps to last
      fireEvent.keyDown(portal, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(last);
    });

    it("does not prematurely intercept Tab when focusing intermediate elements", () => {
      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={mockUser}
          streak={42}
          onLogout={mockLogout}
        />
      );

      const portal = screen.getByTestId("mobile-drawer-portal");
      const drawer = screen.getByRole("dialog", { name: "Navigation Menu" });
      const focusables = drawer.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const middle = focusables[1];
      middle.focus();
      expect(document.activeElement).toBe(middle);

      // Standard Tab on middle element should not prevent default or force wrap
      const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      portal.dispatchEvent(tabEvent);

      // Default should NOT be prevented for intermediate elements
      expect(tabEvent.defaultPrevented).toBe(false);
    });

    it("handles minimal focusable DOM inside MobileDrawer without crashing", () => {
      // Testing with null user so fewer items exist
      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={null}
          streak={0}
          onLogout={mockLogout}
        />
      );

      const portal = screen.getByTestId("mobile-drawer-portal");
      const drawer = screen.getByRole("dialog", { name: "Navigation Menu" });
      const focusables = drawer.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      expect(focusables.length).toBeGreaterThan(0);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      last.focus();
      fireEvent.keyDown(portal, { key: "Tab" });
      expect(document.activeElement).toBe(first);
    });

    it("verifies accessibility semantics: dialog role, aria-modal, and aria-label", () => {
      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={mockUser}
          streak={42}
          onLogout={mockLogout}
        />
      );

      const dialog = screen.getByRole("dialog", { name: "Navigation Menu" });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("id", "mobile-nav-drawer");
    });
  });

  /* ==========================================================================
     2. MobileDrawer Lifecycle, Escape Handling & Body Scroll Lock
     ========================================================================== */
  describe("2. MobileDrawer Lifecycle, Escape Handling & Body Scroll Lock", () => {
    it("locks body overflow to 'hidden' when open and restores to '' on close and unmount", () => {
      expect(document.body.style.overflow).toBe("");

      function TestDrawerWrapper() {
        const [open, setOpen] = useState(true);
        return (
          <>
            <button onClick={() => setOpen(false)}>Close Drawer</button>
            <MobileDrawer
              isOpen={open}
              onClose={() => setOpen(false)}
              user={mockUser}
              streak={42}
              onLogout={mockLogout}
            />
          </>
        );
      }

      const { unmount } = render(<TestDrawerWrapper />);
      expect(document.body.style.overflow).toBe("hidden");

      // Close drawer via state update
      fireEvent.click(screen.getByText("Close Drawer"));
      expect(document.body.style.overflow).toBe("");

      // Unmounting cleans up safely
      unmount();
      expect(document.body.style.overflow).toBe("");
    });

    it("handles rapid open/close toggle cycles without corrupting document.body.style.overflow", () => {
      function RapidToggleApp() {
        const [open, setOpen] = useState(false);
        return (
          <div>
            <button data-testid="toggle-btn" onClick={() => setOpen((prev) => !prev)}>
              Toggle
            </button>
            <MobileDrawer
              isOpen={open}
              onClose={() => setOpen(false)}
              user={mockUser}
              streak={42}
              onLogout={mockLogout}
            />
          </div>
        );
      }

      render(<RapidToggleApp />);
      const toggleBtn = screen.getByTestId("toggle-btn");

      // 10 rapid toggle cycles
      for (let i = 0; i < 10; i++) {
        fireEvent.click(toggleBtn); // open
        expect(document.body.style.overflow).toBe("hidden");
        fireEvent.click(toggleBtn); // close
        expect(document.body.style.overflow).toBe("");
      }
    });

    it("dismisses drawer when backdrop is clicked", () => {
      const handleClose = vi.fn();
      render(
        <MobileDrawer
          isOpen={true}
          onClose={handleClose}
          user={mockUser}
          streak={42}
          onLogout={mockLogout}
        />
      );

      const backdrop = screen.getByTestId("mobile-drawer-backdrop");
      fireEvent.click(backdrop);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("dismisses drawer on Escape key and cleans up window listener upon unmount", () => {
      const handleClose = vi.fn();
      const { unmount } = render(
        <MobileDrawer
          isOpen={true}
          onClose={handleClose}
          user={mockUser}
          streak={42}
          onLogout={mockLogout}
        />
      );

      // Press Escape
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Unmount drawer
      unmount();

      // Press Escape again after unmount - should not trigger stale callback
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("auto-focuses close button upon opening", async () => {
      render(
        <MobileDrawer
          isOpen={true}
          onClose={vi.fn()}
          user={mockUser}
          streak={42}
          onLogout={mockLogout}
        />
      );

      const closeBtn = screen.getByTestId("mobile-drawer-close");
      await waitFor(() => {
        expect(document.activeElement).toBe(closeBtn);
      });
    });

    it("verifies Header hamburger button opens drawer and manages aria-expanded state", () => {
      render(<Header />);

      const hamburger = screen.getByTestId("mobile-menu-trigger");
      expect(hamburger).toHaveAttribute("aria-expanded", "false");
      expect(hamburger).toHaveAttribute("aria-controls", "mobile-nav-drawer");
      expect(screen.queryByTestId("mobile-drawer-portal")).not.toBeInTheDocument();

      // Click hamburger
      fireEvent.click(hamburger);
      expect(hamburger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByTestId("mobile-drawer-portal")).toBeInTheDocument();

      // Close drawer via close button
      fireEvent.click(screen.getByTestId("mobile-drawer-close"));
      expect(hamburger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByTestId("mobile-drawer-portal")).not.toBeInTheDocument();
    });
  });

  /* ==========================================================================
     3. Header Dropdown Interaction Stress & Keyboard Traversal
     ========================================================================== */
  describe("3. Header Dropdown Interaction Stress & Keyboard Traversal", () => {
    it("handles rapid toggling of Create dropdown without desynchronizing state", () => {
      render(<Header />);

      const createBtn = screen.getByTestId("header-create-button");
      const trigger = createBtn.closest('[data-testid="dropdown-trigger"]')!;

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

      // Rapid open and close
      for (let i = 0; i < 6; i++) {
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      }
    });

    it("closes open dropdown on Escape key and restores focus to trigger", () => {
      render(
        <Dropdown
          trigger={<button data-testid="custom-trigger">Trigger</button>}
          items={[
            { label: "Option 1", onClick: vi.fn() },
            { label: "Option 2", onClick: vi.fn() },
          ]}
        />
      );

      const triggerWrapper = screen.getByTestId("dropdown-trigger");
      fireEvent.click(triggerWrapper);

      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: "Escape" });

      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      expect(triggerWrapper).toHaveAttribute("aria-expanded", "false");
      expect(document.activeElement).toBe(triggerWrapper);
    });

    it("closes open dropdown when clicking outside via mousedown", () => {
      render(
        <div>
          <div data-testid="outside-element">Outside</div>
          <Dropdown
            trigger={<button>Dropdown</button>}
            items={[{ label: "Action A", onClick: vi.fn() }]}
          />
        </div>
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      fireEvent.click(trigger);
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(screen.getByTestId("outside-element"));
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("navigates through dropdown menu items using ArrowDown and ArrowUp with wrap-around", () => {
      render(
        <Dropdown
          trigger={<button>Menu</button>}
          items={[
            { label: "First Item", onClick: vi.fn() },
            { label: "Second Item", onClick: vi.fn() },
            { label: "Third Item", onClick: vi.fn() },
          ]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      fireEvent.click(trigger);

      const menu = screen.getByTestId("dropdown-menu");
      const items = within(menu).getAllByRole("menuitem");
      expect(items).toHaveLength(3);

      // Focus first item
      items[0].focus();
      expect(document.activeElement).toBe(items[0]);

      // ArrowDown -> Second Item
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(document.activeElement).toBe(items[1]);

      // ArrowDown -> Third Item
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(document.activeElement).toBe(items[2]);

      // ArrowDown on last item wraps to First Item
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(document.activeElement).toBe(items[0]);

      // ArrowUp on first item wraps to Third Item
      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(document.activeElement).toBe(items[2]);

      // ArrowUp -> Second Item
      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(document.activeElement).toBe(items[1]);
    });

    it("opens closed dropdown when ArrowDown is pressed on trigger", () => {
      render(
        <Dropdown
          trigger={<button>Options</button>}
          items={[{ label: "Item 1" }]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
    });

    it("executes menu item action on Enter key and closes dropdown", () => {
      const handleAction = vi.fn();
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={[{ label: "Perform Action", onClick: handleAction }]}
        />
      );

      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      const menuItem = screen.getByRole("menuitem", { name: "Perform Action" });

      fireEvent.keyDown(menuItem, { key: "Enter" });
      expect(handleAction).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("skips execution for disabled menu items", () => {
      const handleDisabled = vi.fn();
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={[
            { label: "Disabled Action", onClick: handleDisabled, disabled: true },
          ]}
        />
      );

      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      const menuItem = screen.getByRole("menuitem", { name: "Disabled Action" });
      expect(menuItem).toBeDisabled();

      fireEvent.click(menuItem);
      expect(handleDisabled).not.toHaveBeenCalled();

      fireEvent.keyDown(menuItem, { key: "Enter" });
      expect(handleDisabled).not.toHaveBeenCalled();
    });
  });

  /* ==========================================================================
     4. StudySetCard Event Propagation & Click Isolation Stress
     ========================================================================== */
  describe("4. StudySetCard Event Propagation & Click Isolation Stress", () => {
    const baseSet: StudySet = {
      id: "set_adv_999",
      title: "Adversarial Test Set for Event Propagation",
      description: "Testing stopPropagation & preventDefault",
      card_count: 50,
      total_cards: 50,
      creator_name: "Security Researcher",
      creator_avatar_url: "https://avatar.test/res.png",
      is_starred: false,
      created_at: "2026-03-01T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    };

    it("verifies star click invokes stopPropagation and preventDefault, isolating from card link", () => {
      const handleToggleStar = vi.fn();
      render(<StudySetCard studySet={baseSet} onToggleStar={handleToggleStar} />);

      const starBtn = screen.getByTestId("study-set-star-button");
      fireEvent.click(starBtn);

      expect(handleToggleStar).toHaveBeenCalledTimes(1);
      expect(handleToggleStar).toHaveBeenCalledWith("set_adv_999", true, expect.any(Object));

      // Router navigation should not be called
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("handles repeated rapid clicks on star button without error", () => {
      const handleToggleStar = vi.fn();
      render(<StudySetCard studySet={baseSet} onToggleStar={handleToggleStar} />);

      const starBtn = screen.getByTestId("study-set-star-button");
      for (let i = 0; i < 5; i++) {
        fireEvent.click(starBtn);
      }

      expect(handleToggleStar).toHaveBeenCalledTimes(5);
    });

    it("handles missing onToggleStar gracefully without throwing unhandled exceptions", () => {
      render(<StudySetCard studySet={baseSet} />);

      const starBtn = screen.getByTestId("study-set-star-button");
      expect(() => fireEvent.click(starBtn)).not.toThrow();
    });

    it("supports singular, plural, and zero terms badge correctly", () => {
      // 0 terms
      const { rerender } = render(<StudySetCard studySet={{ ...baseSet, card_count: 0 }} />);
      expect(screen.getByTestId("study-set-terms-badge")).toHaveTextContent("0 terms");

      // 1 term (singular)
      rerender(<StudySetCard studySet={{ ...baseSet, card_count: 1 }} />);
      expect(screen.getByTestId("study-set-terms-badge")).toHaveTextContent("1 term");

      // Plural fallback using cards array
      rerender(
        <StudySetCard
          studySet={{
            ...baseSet,
            card_count: undefined as any,
            total_cards: undefined as any,
            cards: [{ id: "c1" }, { id: "c2" }] as any,
          }}
        />
      );
      expect(screen.getByTestId("study-set-terms-badge")).toHaveTextContent("2 terms");
    });

    it("falls back to 'Anonymous' and 'A' initial when creator metadata is completely missing", () => {
      render(
        <StudySetCard
          studySet={{
            ...baseSet,
            creator_name: undefined,
            creator: undefined,
            owner: undefined,
            creator_avatar_url: undefined,
          }}
        />
      );

      expect(screen.getByText("Anonymous")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("renders extreme strings and XSS payload test cases safely without injection", () => {
      const xssTitle = '<img src=x onerror=alert("xss")> & Special Characters "quotes"';
      const xssDesc = '<script>alert("pwnd")</script> &amp; <b>bold text</b>';

      render(
        <StudySetCard
          studySet={{
            ...baseSet,
            title: xssTitle,
            description: xssDesc,
          }}
        />
      );

      const titleEl = screen.getByTestId("study-set-title");
      expect(titleEl.textContent).toContain(xssTitle);
      expect(screen.getByText(xssDesc)).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     5. DueReviewsBanner Dismissal Persistence & Session Storage Fault Tolerance
     ========================================================================== */
  describe("5. DueReviewsBanner Dismissal Persistence & Session Storage Fault Tolerance", () => {
    it("dismisses banner and persists state across re-renders in sessionStorage", () => {
      const onDismiss = vi.fn();
      const { rerender } = render(
        <DueReviewsBanner dueCount={15} onDismiss={onDismiss} />
      );

      expect(screen.getByTestId("due-reviews-banner")).toBeInTheDocument();
      expect(screen.getByText(/15 cards/i)).toBeInTheDocument();

      // Dismiss banner
      const dismissBtn = screen.getByTestId("due-banner-dismiss-button");
      fireEvent.click(dismissBtn);

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("due-reviews-banner")).not.toBeInTheDocument();
      expect(sessionStorage.getItem("quizlet_due_dismissed")).toBe("true");

      // Rerender component -> remains dismissed
      rerender(<DueReviewsBanner dueCount={15} onDismiss={onDismiss} />);
      expect(screen.queryByTestId("due-reviews-banner")).not.toBeInTheDocument();
    });

    it("does not render when sessionStorage already contains dismissed flag on mount", () => {
      sessionStorage.setItem("quizlet_due_dismissed", "true");
      const { container } = render(<DueReviewsBanner dueCount={10} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when dueCount <= 0 or when isLoading is true", () => {
      const { container: cZero } = render(<DueReviewsBanner dueCount={0} />);
      expect(cZero.firstChild).toBeNull();

      const { container: cNeg } = render(<DueReviewsBanner dueCount={-5} />);
      expect(cNeg.firstChild).toBeNull();

      const { container: cLoading } = render(
        <DueReviewsBanner dueCount={10} isLoading={true} />
      );
      expect(cLoading.firstChild).toBeNull();
    });

    it("triggers onStudyNow callback when Study Now button is clicked", () => {
      const handleStudyNow = vi.fn();
      render(<DueReviewsBanner dueCount={3} onStudyNow={handleStudyNow} />);

      const studyBtn = screen.getByTestId("due-banner-study-button");
      fireEvent.click(studyBtn);

      expect(handleStudyNow).toHaveBeenCalledTimes(1);
    });

    it("renders Link to /progress when onStudyNow callback is omitted", () => {
      render(<DueReviewsBanner dueCount={3} />);

      const studyBtn = screen.getByTestId("due-banner-study-button");
      const parentLink = studyBtn.closest("a");
      expect(parentLink).toHaveAttribute("href", "/progress");
    });

    it("survives sessionStorage exception (e.g. QuotaExceededError or SecurityError)", () => {
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      render(<DueReviewsBanner dueCount={5} />);
      const dismissBtn = screen.getByTestId("due-banner-dismiss-button");

      expect(() => fireEvent.click(dismissBtn)).not.toThrow();
      expect(screen.queryByTestId("due-reviews-banner")).not.toBeInTheDocument();

      setItemSpy.mockRestore();
    });
  });

  /* ==========================================================================
     6. Dashboard Search, Filter Tabs, Empty States & Optimistic Updates Stress
     ========================================================================== */
  describe("6. Dashboard Search, Filter Tabs, Empty States & Optimistic Updates Stress", () => {
    const mockStudySets: StudySet[] = [
      {
        id: "set_alpha",
        title: "Neuroscience 201",
        description: "Axons and synapses",
        card_count: 32,
        creator_name: "Dr. Ramon y Cajal",
        is_starred: true,
        created_at: "2026-02-01T00:00:00Z",
        updated_at: "2026-02-10T00:00:00Z",
      },
      {
        id: "set_beta",
        title: "Microbiology Basics",
        description: "Bacteria and viruses",
        card_count: 18,
        creator_name: "Louis Pasteur",
        is_starred: false,
        created_at: "2026-02-05T00:00:00Z",
        updated_at: "2026-02-12T00:00:00Z",
      },
    ];

    it("handles rapid tab switching without desync and passes correct filter params", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: mockStudySets,
        total: 2,
      });
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });

      render(<DashboardPage />);

      // Initial tab is "mine"
      await waitFor(() => {
        expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
          expect.objectContaining({ filter: "mine" })
        );
      });

      // Rapidly click recent and all tabs
      fireEvent.click(screen.getByTestId("tab-recent"));
      fireEvent.click(screen.getByTestId("tab-all"));

      await waitFor(() => {
        expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
          expect.objectContaining({ filter: "all" })
        );
      });
    });

    it("handles search queries containing Unicode and special characters", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: mockStudySets,
        total: 2,
      });
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Neuroscience 201")).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("dashboard-search-input");
      const specialQuery = "🔬 細胞生物学 & 'OR' 1=1; --";

      fireEvent.change(searchInput, { target: { value: specialQuery } });

      await waitFor(() => {
        expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
          expect.objectContaining({ search: specialQuery })
        );
      });

      // Clear button is visible and clears input
      const clearBtn = screen.getByTestId("dashboard-search-clear");
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(searchInput).toHaveValue("");
      });
    });

    it("renders contextual empty states for different filter tabs and queries", () => {
      // 1. Created (mine) empty state
      const { rerender } = render(<EmptyStudySets filter="mine" />);
      expect(screen.getByText("You haven't created any study sets")).toBeInTheDocument();
      expect(screen.getByTestId("empty-create-set-button")).toBeInTheDocument();

      // 2. Recent empty state
      rerender(<EmptyStudySets filter="recent" />);
      expect(screen.getByText("No recently studied sets")).toBeInTheDocument();

      // 3. Search query empty state with Clear search button
      const handleClear = vi.fn();
      rerender(
        <EmptyStudySets
          searchQuery="Advanced Quantum Gravitation"
          onClearFilters={handleClear}
        />
      );
      expect(
        screen.getByText(/No sets match "Advanced Quantum Gravitation"/i)
      ).toBeInTheDocument();

      const clearBtn = screen.getByTestId("empty-clear-search-button");
      fireEvent.click(clearBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it("performs optimistic star update and reverts when API call rejects", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: [
          {
            ...mockStudySets[1], // is_starred: false
          },
        ],
        total: 1,
      });
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });

      // Mock API failure for star toggle
      vi.mocked(studySetsApi.apiUpdateStudySet).mockRejectedValueOnce(
        new Error("Server error: Unable to update star status")
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Microbiology Basics")).toBeInTheDocument();
      });

      const starBtn = screen.getByTestId("study-set-star-button");
      expect(starBtn).toHaveAttribute("aria-label", "Star study set");

      // Click to star
      fireEvent.click(starBtn);

      // Verify API was called
      expect(studySetsApi.apiUpdateStudySet).toHaveBeenCalledWith("set_beta", {
        is_starred: true,
      });

      // Since API failed, state should revert back to unstarred
      await waitFor(() => {
        expect(starBtn).toHaveAttribute("aria-label", "Star study set");
      });
    });

    it("keeps unstarred set visible after toggle (no starred-tab auto-removal)", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: [
          {
            ...mockStudySets[0], // is_starred: true
          },
        ],
        total: 1,
      });
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });
      vi.mocked(studySetsApi.apiUpdateStudySet).mockResolvedValue({
        ...mockStudySets[0],
        is_starred: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Neuroscience 201")).toBeInTheDocument();
      });

      const starBtn = screen.getByTestId("study-set-star-button");
      fireEvent.click(starBtn);

      // Card should stay visible with updated star state (no starred-tab auto-removal)
      await waitFor(() => {
        expect(screen.getByText("Neuroscience 201")).toBeInTheDocument();
        expect(starBtn).toHaveAttribute("aria-label", "Star study set");
      });
    });

    it("recovers from dashboard load errors when user clicks 'Try again'", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockRejectedValueOnce(
        new Error("Connection timeout")
      );
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });

      render(<DashboardPage />);

      // Error alert appears
      await waitFor(() => {
        expect(screen.getByTestId("dashboard-error-alert")).toBeInTheDocument();
        expect(screen.getByText(/Connection timeout/i)).toBeInTheDocument();
      });

      // Prepare success for retry
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValueOnce({
        items: mockStudySets,
        total: 2,
      });

      fireEvent.click(screen.getByTestId("dashboard-retry-button"));

      await waitFor(() => {
        expect(screen.queryByTestId("dashboard-error-alert")).not.toBeInTheDocument();
        expect(screen.getByText("Neuroscience 201")).toBeInTheDocument();
      });
    });
  });

  /* ==========================================================================
     7. DashboardLayout Integration & Shell Rigor
     ========================================================================== */
  describe("7. DashboardLayout Integration & Shell Rigor", () => {
    it("renders Header and main container with responsive width classes and AuthGuard", () => {
      render(
        <DashboardLayout>
          <div data-testid="dashboard-test-content">Dashboard Content</div>
        </DashboardLayout>
      );

      expect(screen.getByRole("banner")).toBeInTheDocument();
      const main = screen.getByRole("main");
      // Layout hiện tại render full-width để landing page (single-route `/`)
      // không bị giới hạn bởi container; các trang dashboard tự chịu trách
      // nhiệm container `max-w-*` của riêng chúng.
      expect(main).toHaveClass("flex-1", "w-full");
      expect(screen.getByTestId("dashboard-test-content")).toBeInTheDocument();
    });
  });
});
