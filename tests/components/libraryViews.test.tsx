import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LibraryPage from "@/app/[locale]/(dashboard)/library/page";
import * as studySetsApi from "@/lib/api/studySets";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/library",
}));

vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", username: "tester", full_name: "Tester" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

vi.mock("@/lib/api/studySets", () => ({
  apiGetStudySets: vi.fn(),
  apiGetDueReviews: vi.fn(),
  apiUpdateStudySets: vi.fn(),
}));

const mockSets = [
  {
    id: "set_1",
    title: "Biology Basics",
    description: "Cells",
    card_count: 10,
    creator_name: "Tester",
    is_starred: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "set_2",
    title: "Chemistry 101",
    description: "Atoms",
    card_count: 5,
    creator_name: "Tester",
    is_starred: false,
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-04T00:00:00Z",
  },
];

describe("Library page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls apiGetStudySets with filter=mine + page_size 24", async () => {
    vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({ items: mockSets, total: 2 });
    render(<LibraryPage />);
    await waitFor(() => {
      expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
        expect.objectContaining({ filter: "mine", page: 1, page_size: 24 })
      );
    });
    expect(screen.getByText("Biology Basics")).toBeInTheDocument();
    expect(screen.getByText("Chemistry 101")).toBeInTheDocument();
  });

  it("searches within library and clears search", async () => {
    vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({ items: mockSets, total: 2 });
    render(<LibraryPage />);
    await waitFor(() => {
      expect(screen.getByText("Biology Basics")).toBeInTheDocument();
    });
    const input = screen.getByTestId("library-search-input");
    fireEvent.change(input, { target: { value: "Bio" } });
    await waitFor(() => {
      expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
        expect.objectContaining({ filter: "mine", search: "Bio" })
      );
    });
    fireEvent.click(screen.getByTestId("library-search-clear"));
    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("renders star buttons disabled (no star handler in MVP)", async () => {
    vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({ items: mockSets, total: 2 });
    render(<LibraryPage />);
    await waitFor(() => {
      expect(screen.getByText("Biology Basics")).toBeInTheDocument();
    });
    const stars = screen.getAllByTestId("study-set-star-button");
    expect(stars.length).toBe(2);
    stars.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("renders empty state when no sets", async () => {
    vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({ items: [], total: 0 });
    render(<LibraryPage />);
    await waitFor(() => {
      expect(screen.getByTestId("empty-study-sets")).toBeInTheDocument();
    });
  });

  it("paginates when total exceeds page size", async () => {
    vi.mocked(studySetsApi.apiGetStudySets).mockResolvedValue({
      items: mockSets,
      total: 50,
      pagination: { page: 1, page_size: 24, total: 50, total_pages: 3 },
    });
    render(<LibraryPage />);
    await waitFor(() => {
      expect(screen.getByTestId("library-pagination")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("library-next-page"));
    await waitFor(() => {
      expect(studySetsApi.apiGetStudySets).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });
});
