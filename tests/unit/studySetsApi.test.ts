import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeStudySet,
  normalizeStudySetDetail,
  normalizeDueReviews,
  apiGetStudySets,
  apiGetStudySet,
  apiGetDueReviews,
  apiCreateStudySet,
  apiUpdateStudySet,
  apiDeleteStudySet,
  apiDuplicateStudySet,
} from "@/lib/api/studySets";
import { apiClient } from "@/lib/api/client";

// Mock the apiClient methods
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Study Sets API & Normalizers Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ==========================================================================
     1. Normalizers
     ========================================================================== */
  describe("normalizeStudySet", () => {
    it("normalizes a raw study set with default values and creator object", () => {
      const raw = {
        id: "set_1",
        title: "Biology 101",
        description: "Intro to Cells",
        total_cards: 15,
        visibility: "public",
        creator_name: "Jane Doe",
        creator_id: "usr_1",
        is_starred: true,
        created_at: "2026-01-01T00:00:00Z",
      };

      const set = normalizeStudySet(raw);
      expect(set.id).toBe("set_1");
      expect(set.title).toBe("Biology 101");
      expect(set.description).toBe("Intro to Cells");
      expect(set.card_count).toBe(15);
      expect(set.total_cards).toBe(15);
      expect(set.visibility).toBe("public");
      expect(set.is_public).toBe(true);
      expect(set.creator_name).toBe("Jane Doe");
      expect(set.creator?.name).toBe("Jane Doe");
      expect(set.is_starred).toBe(true);
    });

    it("falls back to cards length when card_count and total_cards are missing", () => {
      const raw = {
        id: 123,
        title: "No counts",
        cards: [{ id: "c1" }, { id: "c2" }],
        visibility: 3, // private enum
      };

      const set = normalizeStudySet(raw);
      expect(set.id).toBe("123");
      expect(set.card_count).toBe(2);
      expect(set.visibility).toBe("private");
      expect(set.is_public).toBe(false);
      expect(set.creator_name).toBe("Anonymous");
    });

    it("handles owner object from alternative backend envelopes", () => {
      const raw = {
        id: "set_owner",
        title: "Chemistry",
        owner: { id: "usr_own", name: "Doc Brown", avatar_url: "https://avatar.test" },
      };

      const set = normalizeStudySet(raw);
      expect(set.creator_name).toBe("Doc Brown");
      expect(set.creator_avatar_url).toBe("https://avatar.test");
      expect(set.creator?.id).toBe("usr_own");
    });

    it("throws an error when invalid data is provided", () => {
      expect(() => normalizeStudySet(null)).toThrow("Invalid study set data received");
      expect(() => normalizeStudySet("not an object")).toThrow("Invalid study set data received");
    });
  });

  describe("normalizeStudySetDetail", () => {
    it("normalizes detail with gRPC-style study_set envelope and cards array", () => {
      const raw = {
        study_set: {
          id: "set_proto",
          title: "Proto Set",
        },
        cards: [
          {
            id: "card_1",
            front_text: "Term 1",
            back_text: "Def 1",
            state: "learning",
          },
        ],
        is_owner: true,
      };

      const detail = normalizeStudySetDetail(raw);
      expect(detail.id).toBe("set_proto");
      expect(detail.title).toBe("Proto Set");
      expect(detail.card_count).toBe(1);
      expect(detail.cards).toHaveLength(1);
      expect(detail.cards[0].front_content).toBe("Term 1");
      expect(detail.cards[0].back_content).toBe("Def 1");
      expect(detail.cards[0].state).toBe("learning");
      expect(detail.is_owner).toBe(true);
    });

    it("handles flat detail objects with fallback card id and position", () => {
      const raw = {
        id: "flat_set",
        title: "Flat Set",
        cards: [
          {
            front_content: "Front",
            back_content: "Back",
          },
        ],
      };

      const detail = normalizeStudySetDetail(raw);
      expect(detail.cards[0].id).toBe("card_flat_set_0");
      expect(detail.cards[0].position).toBe(0);
      expect(detail.cards[0].front_content).toBe("Front");
      expect(detail.cards[0].back_content).toBe("Back");
    });
  });

  describe("normalizeDueReviews", () => {
    it("normalizes due reviews from mockServer shape", () => {
      const raw = {
        total_cards: 12,
        not_studied: 4,
        learning: 3,
        reviewing: 2,
        mastered: 3,
        due_reviews_count: 5,
        accuracy_rate: 25,
      };

      const res = normalizeDueReviews(raw);
      expect(res.due_count).toBe(5);
      expect(res.total_cards).toBe(12);
      expect(res.learning).toBe(3);
      expect(res.reviewing).toBe(2);
      expect(res.mastered).toBe(3);
      expect(res.accuracy_rate).toBe(25);
    });

    it("calculates next_due_at from the earliest date in cards array", () => {
      const raw = {
        total_due: 2,
        cards: [
          { flashcard_id: "c1", due_date: "2026-11-05T12:00:00Z" },
          { flashcard_id: "c2", due_date: "2026-11-04T08:00:00Z" },
        ],
      };

      const res = normalizeDueReviews(raw);
      expect(res.due_count).toBe(2);
      expect(res.next_due_at).toBe(new Date("2026-11-04T08:00:00Z").toISOString());
    });

    it("returns zero due count when raw data is empty or invalid", () => {
      expect(normalizeDueReviews(null)).toEqual({ due_count: 0, next_due_at: null });
      expect(normalizeDueReviews({})).toEqual({
        due_count: 0,
        next_due_at: null,
        total_cards: undefined,
        cards: [],
        not_studied: undefined,
        learning: undefined,
        reviewing: undefined,
        mastered: undefined,
        accuracy_rate: undefined,
      });
    });
  });

  /* ==========================================================================
     2. apiGetStudySets
     ========================================================================== */
  describe("apiGetStudySets", () => {
    it("queries API with filter, search, limit, and offset serialized properly", async () => {
      const mockRaw = {
        items: [
          { id: "s1", title: "Set 1", card_count: 5 },
          { id: "s2", title: "Set 2", card_count: 10 },
        ],
        total: 2,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockRaw);

      const result = await apiGetStudySets({
        filter: "starred",
        search: "Math",
        limit: 10,
        offset: 20,
      });

      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          filter: "starred",
          search: "Math",
          limit: 10,
          page_size: 10,
          per_page: 10,
          offset: 20,
          page: 3, // Math.floor(20/10) + 1
        },
      });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.items[0].id).toBe("s1");
    });

    it("handles array response without items wrapper", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([
        { id: "s3", title: "Array direct set" },
      ]);

      const result = await apiGetStudySets();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe("s3");
    });
  });

  /* ==========================================================================
     3. apiGetStudySet Detail
     ========================================================================== */
  describe("apiGetStudySet", () => {
    it("throws error if ID is empty or whitespace", async () => {
      await expect(apiGetStudySet("")).rejects.toThrow("Study set ID is required");
      await expect(apiGetStudySet("   ")).rejects.toThrow("Study set ID is required");
    });

    it("fetches study set detail by id", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        id: "target_set",
        title: "Target Title",
        cards: [{ id: "c1", front_content: "F1", back_content: "B1" }],
      });

      const res = await apiGetStudySet("target_set");
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets/target_set");
      expect(res.id).toBe("target_set");
      expect(res.cards).toHaveLength(1);
    });
  });

  /* ==========================================================================
     4. apiGetDueReviews
     ========================================================================== */
  describe("apiGetDueReviews", () => {
    it("fetches review statistics from endpoint", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        due_reviews_count: 8,
        total_cards: 20,
      });

      const res = await apiGetDueReviews();
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/users/me/reviews");
      expect(res.due_count).toBe(8);
      expect(res.total_cards).toBe(20);
    });
  });

  /* ==========================================================================
     5. Mutations: Create, Update, Delete, Duplicate
     ========================================================================== */
  describe("Study Set Mutations", () => {
    it("creates study set with cards and initial_cards mapped", async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        id: "new_set",
        title: "Created Set",
        cards: [{ id: "c1", front_content: "Q", back_content: "A" }],
      });

      const created = await apiCreateStudySet({
        title: "Created Set",
        cards: [{ front_content: "Q", back_content: "A" }],
      });

      expect(apiClient.post).toHaveBeenCalledWith("/quizlet/study-sets", {
        title: "Created Set",
        cards: [{ front_content: "Q", back_content: "A" }],
        initial_cards: [{ front_content: "Q", back_content: "A" }],
      });

      expect(created.id).toBe("new_set");
    });

    it("updates study set metadata", async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        id: "edit_set",
        title: "Updated Title",
        is_starred: true,
      });

      const updated = await apiUpdateStudySet("edit_set", {
        title: "Updated Title",
        is_starred: true,
      });

      expect(apiClient.put).toHaveBeenCalledWith("/quizlet/study-sets/edit_set", {
        title: "Updated Title",
        is_starred: true,
      });

      expect(updated.title).toBe("Updated Title");
      expect(updated.is_starred).toBe(true);
    });

    it("deletes study set by ID", async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: true });

      const del = await apiDeleteStudySet("del_123");
      expect(apiClient.delete).toHaveBeenCalledWith("/quizlet/study-sets/del_123");
      expect(del.success).toBe(true);
    });

    it("duplicates study set with optional new title", async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        id: "dup_copy",
        title: "Biology 101 (Copy)",
        card_count: 5,
      });

      const copy = await apiDuplicateStudySet("bio_101", "Biology 101 (Copy)");
      expect(apiClient.post).toHaveBeenCalledWith("/quizlet/study-sets/bio_101/duplicate", {
        new_title: "Biology 101 (Copy)",
      });
      expect(copy.id).toBe("dup_copy");
      expect(copy.title).toBe("Biology 101 (Copy)");
    });
  });
});
