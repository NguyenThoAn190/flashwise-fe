import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DueReviewsBanner } from "@/components/layout/DueReviewsBanner";
import { StudySetCard } from "@/components/sets/StudySetCard";
import { EmptyStudySets } from "@/components/sets/EmptyStudySets";
import DashboardPage from "@/app/[locale]/(dashboard)/page";
import * as studySetsApi from "@/lib/api/studySets";

// Mock Next.js navigation
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  // `next-intl/navigation` yêu cầu `redirect`/`permanentRedirect` từ module này
  // ngay lúc import, nên mock phải export đủ để không throw.
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/",
}));

// Mock AuthContext
let mockUser: any = {
  id: "usr_student_1",
  full_name: "Alex Learner",
  username: "alexlearner",
  email: "alex@quizlet.local",
  stats: {
    current_streak: 12,
    total_study_sets: 4,
  },
};

vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

// Mock studySetsApi methods
vi.mock("@/lib/api/studySets", () => ({
  apiGetStudySets: vi.fn(),
  apiGetDueReviews: vi.fn(),
  apiUpdateStudySet: vi.fn(),
}));

describe("Milestone 3 - Dashboard Views, Cards & Review Banners", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
  });

  /* ==========================================================================
     1. DueReviewsBanner Component
     ========================================================================== */
  describe("DueReviewsBanner Component", () => {
    it("renders banner with due count, badge, and study CTA", () => {
      const handleStudyNow = vi.fn();
      render(<DueReviewsBanner dueCount={5} onStudyNow={handleStudyNow} />);

      expect(screen.getByTestId("due-reviews-banner")).toBeInTheDocument();
      expect(screen.getByText("Spaced Repetition Reviews")).toBeInTheDocument();
      expect(screen.getByText(/5 cards/i)).toBeInTheDocument();

      const studyBtn = screen.getByTestId("due-banner-study-button");
      fireEvent.click(studyBtn);
      expect(handleStudyNow).toHaveBeenCalledTimes(1);
    });

    it("renders singular '1 card' when due count is 1", () => {
      render(<DueReviewsBanner dueCount={1} />);
      expect(screen.getByText(/1 card/i)).toBeInTheDocument();
    });

    it("returns null when dueCount is 0 or negative", () => {
      const { container: c0 } = render(<DueReviewsBanner dueCount={0} />);
      expect(c0.firstChild).toBeNull();

      const { container: cNeg } = render(<DueReviewsBanner dueCount={-3} />);
      expect(cNeg.firstChild).toBeNull();
    });

    it("dismisses banner on X button click and persists to sessionStorage", () => {
      const onDismiss = vi.fn();
      render(<DueReviewsBanner dueCount={4} onDismiss={onDismiss} />);

      expect(screen.getByTestId("due-reviews-banner")).toBeInTheDocument();

      const dismissBtn = screen.getByTestId("due-banner-dismiss-button");
      fireEvent.click(dismissBtn);

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("due-reviews-banner")).not.toBeInTheDocument();
      expect(sessionStorage.getItem("quizlet_due_dismissed")).toBe("true");
    });

    it("does not render if sessionStorage indicates previous dismissal", () => {
      sessionStorage.setItem("quizlet_due_dismissed", "true");
      const { container } = render(<DueReviewsBanner dueCount={10} />);
      expect(container.firstChild).toBeNull();
    });
  });

  /* ==========================================================================
     2. StudySetCard Component
     ========================================================================== */
  describe("StudySetCard Component", () => {
    const mockSet = {
      id: "set_chem_101",
      title: "General Chemistry 101",
      description: "Periodic table and atomic structure",
      card_count: 24,
      creator_name: "Dr. Marie Curie",
      creator_avatar_url: "https://avatar.test/curie.png",
      is_starred: false,
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-15T00:00:00Z",
    };

    it("renders card link with title, description, term count badge, and creator metadata", () => {
      render(<StudySetCard studySet={mockSet} />);

      const card = screen.getByTestId("study-set-card");
      expect(card).toHaveAttribute("href", "/set/set_chem_101");

      expect(screen.getByTestId("study-set-terms-badge")).toHaveTextContent("24 terms");
      expect(screen.getByTestId("study-set-title")).toHaveTextContent("General Chemistry 101");
      expect(screen.getByText("Periodic table and atomic structure")).toBeInTheDocument();
      expect(screen.getByText("Dr. Marie Curie")).toBeInTheDocument();
    });

    it("renders singular '1 term' when card_count is 1", () => {
      render(<StudySetCard studySet={{ ...mockSet, card_count: 1 }} />);
      expect(screen.getByTestId("study-set-terms-badge")).toHaveTextContent("1 term");
    });

    it("handles star button click with stopPropagation preventing card navigation", () => {
      const handleToggleStar = vi.fn();
      render(<StudySetCard studySet={mockSet} onToggleStar={handleToggleStar} />);

      const starBtn = screen.getByTestId("study-set-star-button");
      fireEvent.click(starBtn);

      expect(handleToggleStar).toHaveBeenCalledWith("set_chem_101", true, expect.any(Object));
      // Card navigation should not have been called
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("renders gold star when is_starred is true", () => {
      render(<StudySetCard studySet={{ ...mockSet, is_starred: true }} />);

      const starBtn = screen.getByTestId("study-set-star-button");
      expect(starBtn).toHaveAttribute("aria-label", "Remove star from study set");
      const starIcon = starBtn.querySelector("svg");
      expect(starIcon?.getAttribute("class")).toContain("fill-quizlet-gold");
    });

    it("renders initials fallback when creator avatar is missing", () => {
      render(
        <StudySetCard
          studySet={{
            ...mockSet,
            creator_avatar_url: undefined,
            creator_name: "Isaac Newton",
          }}
        />
      );

      expect(screen.getByText("I")).toBeInTheDocument();
      expect(screen.getByText("Isaac Newton")).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     3. EmptyStudySets Component
     ========================================================================== */
  describe("EmptyStudySets Component", () => {
    it("renders contextual copy for search query with clear button", () => {
      const handleClear = vi.fn();
      render(
        <EmptyStudySets
          searchQuery="Quantum Physics"
          onClearFilters={handleClear}
        />
      );

      expect(screen.getByText(/No sets match "Quantum Physics"/i)).toBeInTheDocument();
      const clearBtn = screen.getByTestId("empty-clear-search-button");
      fireEvent.click(clearBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it("renders contextual copy for starred filter tab", () => {
      render(<EmptyStudySets filter="starred" />);
      expect(screen.getByText("No starred sets yet")).toBeInTheDocument();
      expect(screen.getByTestId("empty-create-set-button")).toBeInTheDocument();
    });

    it("renders contextual copy for created sets tab (filter='mine')", () => {
      render(<EmptyStudySets filter="mine" />);
      expect(screen.getByText("You haven't created any study sets")).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     4. DashboardPage Full Integration View
     ========================================================================== */
  describe("DashboardPage Component", () => {
    const mockSets = [
      {
        id: "set_1",
        title: "Web Development Fundamentals",
        description: "HTML, CSS, JavaScript basics",
        card_count: 4,
        creator_name: "Alex Learner",
        is_starred: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-10T00:00:00Z",
      },
      {
        id: "set_2",
        title: "Spanish 101 Vocabulary",
        description: "Basic greeting and verbs",
        card_count: 10,
        creator_name: "Maria Santos",
        is_starred: false,
        created_at: "2026-01-05T00:00:00Z",
        updated_at: "2026-01-08T00:00:00Z",
      },
    ];

    it("renders user greeting, streak count, due reviews banner, and study set cards", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: mockSets,
        total: 2,
      });

      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({
        due_count: 5,
        total_cards: 14,
      });

      render(<DashboardPage />);

      // Greeting and streak
      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Alex!/i)).toBeInTheDocument();
        expect(screen.getByTestId("dashboard-streak-counter")).toHaveTextContent("12 day streak");
      });

      // Due reviews banner
      expect(screen.getByTestId("due-reviews-banner")).toBeInTheDocument();
      expect(screen.getByText(/5 cards/i)).toBeInTheDocument();

      // Study set cards rendered
      expect(screen.getByText("Web Development Fundamentals")).toBeInTheDocument();
      expect(screen.getByText("Spanish 101 Vocabulary")).toBeInTheDocument();
    });

    it("switches tabs and triggers filtered API request", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: mockSets,
        total: 2,
      });
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
          expect.objectContaining({ filter: "recent" })
        );
      });

      // Click "Created" tab
      const createdTab = screen.getByTestId("tab-created");
      fireEvent.click(createdTab);

      await waitFor(() => {
        expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
          expect.objectContaining({ filter: "mine" })
        );
      });

      // Click "Starred" tab
      const starredTab = screen.getByTestId("tab-starred");
      fireEvent.click(starredTab);

      await waitFor(() => {
        expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
          expect.objectContaining({ filter: "starred" })
        );
      });
    });

    it("filters study sets via search input and clears search query", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: mockSets,
        total: 2,
      });
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Web Development Fundamentals")).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("dashboard-search-input");
      fireEvent.change(searchInput, { target: { value: "Spanish" } });

      await waitFor(() => {
        expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
          expect.objectContaining({ search: "Spanish" })
        );
      });

      // Clear button appears
      const clearBtn = screen.getByTestId("dashboard-search-clear");
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(searchInput).toHaveValue("");
      });
    });

    it("toggles star on a card with optimistic state update and API call", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: mockSets,
        total: 2,
      });
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });
      vi.mocked(studySetsApi.apiUpdateStudySet).mockResolvedValue({
        ...mockSets[1],
        is_starred: true,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Spanish 101 Vocabulary")).toBeInTheDocument();
      });

      const starButtons = screen.getAllByTestId("study-set-star-button");
      // The second set is not starred initially
      fireEvent.click(starButtons[1]);

      expect(studySetsApi.apiUpdateStudySet).toHaveBeenCalledWith("set_2", {
        is_starred: true,
      });
    });

    it("renders empty state when API returns zero sets", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
        items: [],
        total: 0,
      });
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("empty-study-sets")).toBeInTheDocument();
        expect(screen.getByText("No recently studied sets")).toBeInTheDocument();
      });
    });

    it("renders error state when API fails, and recovers when Try Again is clicked", async () => {
      vi.mocked(studySetsApi.apiGetStudySets).mockRejectedValueOnce(
        new Error("Network connection lost")
      );
      vi.mocked(studySetsApi.apiGetDueReviews).mockResolvedValue({ due_count: 0 });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-error-alert")).toBeInTheDocument();
        expect(screen.getByText(/Network connection lost/i)).toBeInTheDocument();
      });

      // Now prepare success response for retry
      vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValueOnce({
        items: mockSets,
        total: 2,
      });

      const retryBtn = screen.getByTestId("dashboard-retry-button");
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("dashboard-error-alert")).not.toBeInTheDocument();
        expect(screen.getByText("Web Development Fundamentals")).toBeInTheDocument();
      });
    });
  });
});
