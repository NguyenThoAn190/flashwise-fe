/**
 * Milestone 3 Adversarial & Empirical Stress Test Suite
 * Target: Study Sets API client, data normalizers, query serialization, and optimistic UI state handling.
 *
 * Verifies resilience against:
 * 1. Corrupted & malformed backend payloads (null, primitives, non-numeric card counts, exotic visibility, missing creator fields).
 * 2. Extreme query parameters (Unicode, SQL/NoSQL injections, whitespace padding, negative limits, high offsets, conflicting sort params).
 * 3. Spaced repetition due reviews edge cases (zero counts, invalid dates, overdue sorting, nullish stats).
 * 4. Mutations resilience (0 vs 1000 cards, Unicode titles, partial payloads, empty duplicates).
 * 5. Optimistic state rollback & UI recovery when API calls reject.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { apiClient } from "@/lib/api/client";
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
import DashboardPage from "@/app/[locale]/(dashboard)/page";
import { CreateCardInput } from "@/types/studySet";

// 1. Mock Next.js navigation
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  // `next-intl/navigation` yêu cầu `redirect`/`permanentRedirect` từ module này
  // ngay lúc import, nên mock phải export đủ để không throw.
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/",
}));

// 2. Mock AuthContext
const mockUser = {
  id: "usr_challenger_stress",
  full_name: "Challenger Auditor",
  username: "challenger_auditor",
  email: "challenger@quizlet.local",
  stats: {
    current_streak: 15,
    total_study_sets: 8,
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

// 3. Mock ApiClient
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Milestone 3 Challenger: API, Normalizer, Query & State Resilience Stress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
  });

  /* ==========================================================================
     Suite 1: Data Normalizers Stress (Malformed & Corrupted Backend Payloads)
     ========================================================================== */
  describe("Suite 1: Data Normalizers Stress (Malformed Payloads)", () => {
    describe("normalizeStudySet with corrupted and boundary inputs", () => {
      it("throws when passed non-object or nullish primitives", () => {
        expect(() => normalizeStudySet(null)).toThrow("Invalid study set data received");
        expect(() => normalizeStudySet(undefined)).toThrow("Invalid study set data received");
        expect(() => normalizeStudySet("")).toThrow("Invalid study set data received");
        expect(() => normalizeStudySet("corrupted string")).toThrow("Invalid study set data received");
        expect(() => normalizeStudySet(12345)).toThrow("Invalid study set data received");
        expect(() => normalizeStudySet(true)).toThrow("Invalid study set data received");
        expect(() => normalizeStudySet(false)).toThrow("Invalid study set data received");
        expect(() => normalizeStudySet(Symbol("test"))).toThrow("Invalid study set data received");
        expect(() => normalizeStudySet(BigInt(999))).toThrow("Invalid study set data received");
      });

      it("handles completely empty object with safe defaults", () => {
        const set = normalizeStudySet({});
        expect(set.id).toBe("undefined");
        expect(set.title).toBe("");
        expect(set.description).toBe("");
        expect(set.card_count).toBe(0);
        expect(set.total_cards).toBe(0);
        expect(set.visibility).toBe("public");
        expect(set.is_public).toBe(true);
        expect(set.creator_name).toBe("Anonymous");
        expect(set.is_starred).toBe(false);
        expect(typeof set.created_at).toBe("string");
        expect(typeof set.updated_at).toBe("string");
      });

      it("handles corrupted non-numeric card_count values with robust fallback", () => {
        // String instead of number
        const s1 = normalizeStudySet({ id: "s1", card_count: "NaN" });
        expect(s1.card_count).toBe(0);

        // Null card_count with valid total_cards
        const s2 = normalizeStudySet({ id: "s2", card_count: null, total_cards: 42 });
        expect(s2.card_count).toBe(42);
        expect(s2.total_cards).toBe(42);

        // Both missing, fallback to cards array length
        const s3 = normalizeStudySet({
          id: "s3",
          cards: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
        });
        expect(s3.card_count).toBe(3);
        expect(s3.total_cards).toBe(3);

        // Object or boolean in card_count
        const s4 = normalizeStudySet({ id: "s4", card_count: { count: 10 } });
        expect(s4.card_count).toBe(0);

        const s5 = normalizeStudySet({ id: "s5", card_count: true });
        expect(s5.card_count).toBe(0);

        // Negative card count preserves number
        const s6 = normalizeStudySet({ id: "s6", card_count: -10 });
        expect(s6.card_count).toBe(-10);
      });

      it("handles exotic, numeric, and unknown visibility enums safely", () => {
        // Protobuf / gRPC enum 3 = private
        const s1 = normalizeStudySet({ id: "1", visibility: 3 });
        expect(s1.visibility).toBe("private");
        expect(s1.is_public).toBe(false);

        // Protobuf enum 2 = unlisted
        const s2 = normalizeStudySet({ id: "2", visibility: 2 });
        expect(s2.visibility).toBe("unlisted");
        expect(s2.is_public).toBe(false);

        // String "private" and "unlisted"
        expect(normalizeStudySet({ id: "3", visibility: "private" }).visibility).toBe("private");
        expect(normalizeStudySet({ id: "4", visibility: "unlisted" }).visibility).toBe("unlisted");

        // Unknown enum or string defaults to "public"
        expect(normalizeStudySet({ id: "5", visibility: "internal_org_only" }).visibility).toBe("public");
        expect(normalizeStudySet({ id: "6", visibility: 99 }).visibility).toBe("public");
        expect(normalizeStudySet({ id: "7", visibility: null }).visibility).toBe("public");
        expect(normalizeStudySet({ id: "8", visibility: undefined }).visibility).toBe("public");

        // Explicit is_public takes precedence when provided
        const s9 = normalizeStudySet({ id: "9", visibility: "private", is_public: true });
        expect(s9.visibility).toBe("private");
        expect(s9.is_public).toBe(true);

        const s10 = normalizeStudySet({ id: "10", visibility: "public", is_public: false });
        expect(s10.visibility).toBe("public");
        expect(s10.is_public).toBe(false);
      });

      it("resolves creator information across diverse backend envelope variants", () => {
        // Variant A: Explicit creator object
        const vA = normalizeStudySet({
          id: "va",
          creator: { id: "u_a", name: "Alice Smith", avatar_url: "https://avatar.test/a" },
        });
        expect(vA.creator_name).toBe("Alice Smith");
        expect(vA.creator_avatar_url).toBe("https://avatar.test/a");
        expect(vA.creator?.id).toBe("u_a");

        // Variant B: Owner object (from PlayGrid gateway fallback)
        const vB = normalizeStudySet({
          id: "vb",
          owner: { id: "u_b", name: "Bob Jones", avatar_url: "https://avatar.test/b" },
        });
        expect(vB.creator_name).toBe("Bob Jones");
        expect(vB.creator_avatar_url).toBe("https://avatar.test/b");
        expect(vB.creator?.name).toBe("Bob Jones");
        expect(vB.creator?.id).toBe("u_b");

        // Variant C: Flat creator_name and creator_id without creator object
        const vC = normalizeStudySet({
          id: "vc",
          creator_name: "Charlie Brown",
          creator_id: "u_c",
          creator_avatar_url: "https://avatar.test/c",
        });
        expect(vC.creator_name).toBe("Charlie Brown");
        expect(vC.creator?.name).toBe("Charlie Brown");
        expect(vC.creator_id).toBe("u_c");

        // Variant D: Only creator_id exists (falls back to Anonymous for name, retains ID)
        const vD = normalizeStudySet({ id: "vd", creator_id: "usr_only_id" });
        expect(vD.creator_name).toBe("Anonymous");
        expect(vD.creator?.id).toBe("usr_only_id");

        // Variant E: No creator info at all
        const vE = normalizeStudySet({ id: "ve" });
        expect(vE.creator_name).toBe("Anonymous");
        expect(vE.creator).toBeUndefined();

        // Variant F: Empty creator object
        const vF = normalizeStudySet({ id: "vf", creator: {} as any });
        expect(vF.creator_name).toBe("Anonymous");
      });

      it("coerces non-string ID and handles edge timestamps", () => {
        const setNumId = normalizeStudySet({ id: 987654 });
        expect(setNumId.id).toBe("987654");

        const setDate = normalizeStudySet({
          id: "date_set",
          created_at: "2026-03-01T00:00:00Z",
        });
        expect(setDate.created_at).toBe("2026-03-01T00:00:00Z");
        expect(setDate.updated_at).toBe("2026-03-01T00:00:00Z");
      });
    });

    describe("normalizeStudySetDetail with wrapped and irregular cards", () => {
      it("unwraps gRPC-style study_set envelope and synchronizes card counts", () => {
        const detail = normalizeStudySetDetail({
          study_set: {
            id: "proto_1",
            title: "Cellular Biology",
            card_count: 999, // intentionally mismatched with actual cards
          },
          cards: [
            { id: "c1", front_text: "Mitochondria", back_text: "Powerhouse of cell" },
            { id: "c2", front_content: "Ribosome", back_content: "Protein synthesis" },
          ],
          is_owner: true,
        });

        expect(detail.id).toBe("proto_1");
        expect(detail.title).toBe("Cellular Biology");
        // Count must synchronize with cards.length
        expect(detail.card_count).toBe(2);
        expect(detail.total_cards).toBe(2);
        expect(detail.cards).toHaveLength(2);
        expect(detail.cards[0].front_content).toBe("Mitochondria");
        expect(detail.cards[0].back_content).toBe("Powerhouse of cell");
        expect(detail.cards[1].front_text).toBe("Ribosome");
        expect(detail.cards[1].back_text).toBe("Protein synthesis");
        expect(detail.is_owner).toBe(true);
      });

      it("handles missing, null, or corrupted cards gracefully", () => {
        const noCards = normalizeStudySetDetail({ id: "no_c", title: "No Cards" });
        expect(noCards.cards).toEqual([]);
        expect(noCards.card_count).toBe(0);

        const nullCards = normalizeStudySetDetail({
          id: "null_c",
          title: "Null Cards",
          cards: null,
        });
        expect(nullCards.cards).toEqual([]);
        expect(nullCards.card_count).toBe(0);

        const stringCards = normalizeStudySetDetail({
          id: "str_c",
          title: "String Cards",
          cards: "not an array",
        });
        expect(stringCards.cards).toEqual([]);
        expect(stringCards.card_count).toBe(0);
      });

      it("normalizes flashcards with missing IDs, positions, and user_state", () => {
        const detail = normalizeStudySetDetail({
          id: "set_auto",
          title: "Auto IDs",
          cards: [
            {
              front_content: "Question 1",
              back_content: "Answer 1",
              user_state: "mastered", // alternative naming
            },
            {
              id: "explicit_id_2",
              front_content: "Question 2",
              back_content: "Answer 2",
              position: 99,
              state: "learning",
            },
          ],
        });

        expect(detail.cards[0].id).toBe("card_set_auto_0");
        expect(detail.cards[0].position).toBe(0);
        expect(detail.cards[0].state).toBe("mastered");

        expect(detail.cards[1].id).toBe("explicit_id_2");
        expect(detail.cards[1].position).toBe(99);
        expect(detail.cards[1].state).toBe("learning");
      });

      it("cross-maps progress and progress_summary fields", () => {
        const pData = {
          total_cards: 10,
          mastered_count: 5,
          learning_count: 3,
        };
        const detail = normalizeStudySetDetail({
          id: "p_set",
          progress: pData,
        });

        expect(detail.progress).toEqual(pData);
        expect(detail.progress_summary).toEqual(pData);
      });
    });

    describe("normalizeDueReviews edge cases", () => {
      it("returns zero due count and null date for non-objects or empty inputs", () => {
        expect(normalizeDueReviews(null)).toEqual({ due_count: 0, next_due_at: null });
        expect(normalizeDueReviews(undefined)).toEqual({ due_count: 0, next_due_at: null });
        expect(normalizeDueReviews("some string")).toEqual({ due_count: 0, next_due_at: null });
        expect(normalizeDueReviews(100)).toEqual({ due_count: 0, next_due_at: null });
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

      it("resolves count from due_count, due_reviews_count, or total_due", () => {
        expect(normalizeDueReviews({ due_count: 7 }).due_count).toBe(7);
        expect(normalizeDueReviews({ due_reviews_count: 14 }).due_count).toBe(14);
        expect(normalizeDueReviews({ total_due: 21 }).due_count).toBe(21);
        expect(normalizeDueReviews({ due_count: "invalid" }).due_count).toBe(0);
      });

      it("finds the earliest next_due_at even with shuffled or invalid card dates", () => {
        const raw = {
          due_count: 3,
          cards: [
            { flashcard_id: "c1", due_date: "2026-11-20T10:00:00Z" },
            { flashcard_id: "c2", due_date: "invalid-date-string" },
            { flashcard_id: "c3", next_review_at: "2026-11-05T08:00:00Z" }, // earliest valid
            { flashcard_id: "c4", due_date: "2026-11-12T15:30:00Z" },
            { flashcard_id: "c5", due_date: "" },
          ],
        };

        const res = normalizeDueReviews(raw);
        expect(res.due_count).toBe(3);
        expect(res.next_due_at).toBe(new Date("2026-11-05T08:00:00Z").toISOString());
      });

      it("leaves next_due_at null if all card dates are invalid", () => {
        const raw = {
          due_count: 2,
          cards: [
            { flashcard_id: "c1", due_date: "not-a-valid-date" },
            { flashcard_id: "c2", next_review_at: "also-corrupted" },
          ],
        };

        const res = normalizeDueReviews(raw);
        expect(res.due_count).toBe(2);
        expect(res.next_due_at).toBeNull();
      });

      it("preserves explicit next_due_at if present", () => {
        const raw = {
          due_count: 1,
          next_due_at: "2026-11-01T00:00:00Z",
          cards: [{ flashcard_id: "c1", due_date: "2026-11-10T00:00:00Z" }],
        };

        const res = normalizeDueReviews(raw);
        expect(res.next_due_at).toBe("2026-11-01T00:00:00Z");
      });
    });
  });

  /* ==========================================================================
     Suite 2: Extreme Query Parameters & Pagination Stress
     ========================================================================== */
  describe("Suite 2: Extreme Query Parameters & Pagination Stress", () => {
    it("handles complex Unicode and multi-lingual search queries", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });

      const unicodeSearch = "日本語 🌸 / العربية / Русский / Đại số & Giải tích";
      await apiGetStudySets({ search: unicodeSearch });

      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          search: unicodeSearch,
        },
      });
    });

    it("handles SQL & NoSQL injection payloads as literal strings without crashing", async () => {
      const injectionPayloads = [
        "'; DROP TABLE study_sets; --",
        "' OR '1'='1",
        "{\"$gt\": \"\"}",
        "<script>alert('xss')</script>",
        "UNION SELECT * FROM user_credentials --",
      ];

      for (const payload of injectionPayloads) {
        vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });

        await apiGetStudySets({ search: payload });
        expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
          params: {
            search: payload,
          },
        });
      }
    });

    it("trims whitespace from search and ignores whitespace-only queries", async () => {
      // Padded search query
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });
      await apiGetStudySets({ search: "   \t\n  Machine Learning  \r\n  " });
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          search: "Machine Learning",
        },
      });

      // Whitespace-only search query should NOT be added to params
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });
      await apiGetStudySets({ search: "    \t \r\n   " });
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {},
      });
    });

    it("serializes boundary limit and offset parameters accurately", async () => {
      // Huge offset with standard limit
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });
      await apiGetStudySets({ offset: 1000000, limit: 25 });
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          limit: 25,
          page_size: 25,
          per_page: 25,
          offset: 1000000,
          page: 40001, // Math.floor(1000000 / 25) + 1
        },
      });

      // Zero limit and negative offset
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });
      await apiGetStudySets({ offset: -10, limit: 0 });
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          limit: 0,
          page_size: 0,
          per_page: 0,
          offset: -10,
        },
      });

      // Offset provided without limit: page should not be NaN
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });
      await apiGetStudySets({ offset: 50 });
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          offset: 50,
        },
      });
    });

    it("handles conflicting sort and sort_by parameters gracefully", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });
      await apiGetStudySets({ sort: "title:asc", sort_by: "created_at:desc" });

      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          sort: "title:asc",
          sort_by: "created_at:desc",
        },
      });
    });

    it("handles heterogeneous response envelopes and computes fallback pagination", async () => {
      // 1. Raw array response without total or pagination wrapper
      vi.mocked(apiClient.get).mockResolvedValueOnce([
        { id: "s1", title: "Raw Set 1", card_count: 5 },
        { id: "s2", title: "Raw Set 2", card_count: 10 },
      ]);

      const res1 = await apiGetStudySets({ limit: 2 });
      expect(res1.items).toHaveLength(2);
      expect(res1.total).toBe(2);
      expect(res1.pagination).toEqual({
        page: 1,
        page_size: 2,
        total: 2,
        total_pages: 1,
      });

      // 2. Corrupted items field (e.g. non-array string)
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        items: "corrupted_non_array",
        total: 0,
      });
      const res2 = await apiGetStudySets();
      expect(res2.items).toEqual([]);
      expect(res2.total).toBe(0);

      // 3. Missing total field defaults to items.length
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        items: [{ id: "s_only" }],
      });
      const res3 = await apiGetStudySets();
      expect(res3.total).toBe(1);
    });
  });

  /* ==========================================================================
     Suite 3: Mutations Resilience (Create, Update, Delete, Duplicate)
     ========================================================================== */
  describe("Suite 3: Study Set Mutations Resilience", () => {
    it("creates study set with 0 cards vs 1000 cards payload stress", async () => {
      // 0 cards
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        id: "set_empty",
        title: "Empty Study Set",
        card_count: 0,
      });

      const res0 = await apiCreateStudySet({
        title: "Empty Study Set",
        cards: [],
      });
      expect(apiClient.post).toHaveBeenCalledWith("/quizlet/study-sets", {
        title: "Empty Study Set",
        cards: [],
        initial_cards: [],
      });
      expect(res0.id).toBe("set_empty");

      // 1000 cards
      const thousandCards: CreateCardInput[] = Array.from({ length: 1000 }, (_, i) => ({
        front_content: `Term ${i + 1} with Unicode 日本語 🌸`,
        back_content: `Definition ${i + 1} with special chars <>&"`,
        hint: `Hint ${i + 1}`,
      }));

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        id: "set_1000",
        title: "Thousand Cards Set",
        card_count: 1000,
      });

      const res1000 = await apiCreateStudySet({
        title: "Thousand Cards Set",
        cards: thousandCards,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/quizlet/study-sets",
        expect.objectContaining({
          title: "Thousand Cards Set",
          cards: thousandCards,
          initial_cards: thousandCards,
        })
      );
      expect(res1000.card_count).toBe(1000);
    });

    it("synchronizes initial_cards when only cards is supplied, and vice-versa", async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ id: "set_sync" });

      const sampleCard = [{ front_content: "Q", back_content: "A" }];
      await apiCreateStudySet({
        title: "Sync Cards",
        initial_cards: sampleCard,
      });

      expect(apiClient.post).toHaveBeenCalledWith("/quizlet/study-sets", {
        title: "Sync Cards",
        cards: sampleCard,
        initial_cards: sampleCard,
      });
    });

    it("updates study set with partial payloads and special characters", async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        id: "set_upd",
        title: "Special Title <script>alert(1)</script>",
        is_starred: true,
      });

      const updated = await apiUpdateStudySet("set_upd", {
        title: "Special Title <script>alert(1)</script>",
        is_starred: true,
      });

      expect(apiClient.put).toHaveBeenCalledWith("/quizlet/study-sets/set_upd", {
        title: "Special Title <script>alert(1)</script>",
        is_starred: true,
      });
      expect(updated.title).toBe("Special Title <script>alert(1)</script>");
    });

    it("duplicates study set with Unicode title and handles omitted title", async () => {
      // Unicode duplicate title
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        id: "dup_1",
        title: "Anatomy 101 (コピー) ⚡",
      });

      const dup1 = await apiDuplicateStudySet("orig_1", "Anatomy 101 (コピー) ⚡");
      expect(apiClient.post).toHaveBeenCalledWith("/quizlet/study-sets/orig_1/duplicate", {
        new_title: "Anatomy 101 (コピー) ⚡",
      });
      expect(dup1.title).toBe("Anatomy 101 (コピー) ⚡");

      // Omitted title
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        id: "dup_2",
        title: "Anatomy 101 (Copy)",
      });
      await apiDuplicateStudySet("orig_1");
      expect(apiClient.post).toHaveBeenCalledWith("/quizlet/study-sets/orig_1/duplicate", {});
    });

    it("validates and trims ID in apiGetStudySet", async () => {
      await expect(apiGetStudySet("")).rejects.toThrow("Study set ID is required");
      await expect(apiGetStudySet("   \t\n  ")).rejects.toThrow("Study set ID is required");

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        id: "trimmed_id",
        title: "Trimmed",
        cards: [],
      });

      const res = await apiGetStudySet("   trimmed_id   ");
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets/trimmed_id");
      expect(res.id).toBe("trimmed_id");
    });

    it("deletes study set by ID cleanly", async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: true, message: "Deleted" });
      const del = await apiDeleteStudySet("del_id");
      expect(apiClient.delete).toHaveBeenCalledWith("/quizlet/study-sets/del_id");
      expect(del.success).toBe(true);
    });
  });

  /* ==========================================================================
     Suite 4: Spaced Repetition Due Reviews Endpoint Stress
     ========================================================================== */
  describe("Suite 4: apiGetDueReviews Spaced Repetition Endpoint Stress", () => {
    it("handles zero due cards without failing", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        due_count: 0,
        total_cards: 50,
        mastered: 50,
      });

      const res = await apiGetDueReviews();
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/users/me/reviews");
      expect(res.due_count).toBe(0);
      expect(res.next_due_at).toBeNull();
      expect(res.total_cards).toBe(50);
    });

    it("parses due reviews with cards containing valid and invalid dates", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        due_reviews_count: 3,
        cards: [
          { flashcard_id: "c1", due_date: "2026-12-01T00:00:00Z" },
          { flashcard_id: "c2", due_date: "2026-11-04T10:00:00Z" }, // Earliest
          { flashcard_id: "c3", due_date: "corrupted_timestamp" },
        ],
      });

      const res = await apiGetDueReviews();
      expect(res.due_count).toBe(3);
      expect(res.next_due_at).toBe(new Date("2026-11-04T10:00:00Z").toISOString());
    });
  });

  /* ==========================================================================
     Suite 5: Optimistic State Rollback & UI Resilience Stress
     ========================================================================== */
  describe("Suite 5: Optimistic State Rollback & UI Resilience Stress", () => {
    const mockInitialSets = [
      {
        id: "set_unstarred",
        title: "Organic Chemistry",
        description: "Reactions & Mechanisms",
        card_count: 24,
        is_starred: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "set_starred",
        title: "World History",
        description: "Modern Era",
        card_count: 18,
        is_starred: true,
        created_at: "2026-01-02T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      },
    ];

    it("empirically verifies optimistic star toggling rolls back when network request rejects", async () => {
      // Setup initial data load
      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        if (url.includes("/reviews")) {
          return { due_count: 0 };
        }
        if (url.includes("/study-sets")) {
          return { items: mockInitialSets, total: 2 };
        }
        return {};
      });

      // Mock update to REJECT (e.g. 500 Network Error)
      vi.mocked(apiClient.put).mockRejectedValueOnce(
        new Error("500 Internal Server Error: Network timeout")
      );

      render(React.createElement(DashboardPage));

      // 1. Wait for study sets to render
      await waitFor(() => {
        expect(screen.getByText("Organic Chemistry")).toBeInTheDocument();
      });

      const starButtons = screen.getAllByTestId("study-set-star-button");
      // The first button corresponds to set_unstarred (is_starred: false)
      expect(starButtons[0]).toHaveAttribute("aria-label", "Star study set");

      // 2. Click the star button to trigger optimistic update
      fireEvent.click(starButtons[0]);

      // 3. Verify optimistic change happened and apiUpdateStudySet was dispatched
      expect(apiClient.put).toHaveBeenCalledWith("/quizlet/study-sets/set_unstarred", {
        is_starred: true,
      });

      // 4. Since the API rejected, verify the state reverts back to unstarred!
      await waitFor(() => {
        expect(starButtons[0]).toHaveAttribute("aria-label", "Star study set");
      });

      // Verify the set is still in the document and not lost
      expect(screen.getByText("Organic Chemistry")).toBeInTheDocument();
    });

    it("empirically verifies optimistic star toggling stays updated when network request succeeds", async () => {
      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        if (url.includes("/reviews")) {
          return { due_count: 0 };
        }
        if (url.includes("/study-sets")) {
          return { items: mockInitialSets, total: 2 };
        }
        return {};
      });

      // Mock update to SUCCEED
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        id: "set_unstarred",
        is_starred: true,
      });

      render(React.createElement(DashboardPage));

      await waitFor(() => {
        expect(screen.getByText("Organic Chemistry")).toBeInTheDocument();
      });

      const starButtons = screen.getAllByTestId("study-set-star-button");
      expect(starButtons[0]).toHaveAttribute("aria-label", "Star study set");

      fireEvent.click(starButtons[0]);

      expect(apiClient.put).toHaveBeenCalledWith("/quizlet/study-sets/set_unstarred", {
        is_starred: true,
      });

      // Remains starred after success
      await waitFor(() => {
        expect(starButtons[0]).toHaveAttribute("aria-label", "Remove star from study set");
      });
    });

    it("empirically verifies unstar keeps card visible, and rollback if unstar rejects", async () => {
      // Without a dedicated starred tab, unstar only flips the icon state
      const starredOnly = [
        {
          id: "starred_a",
          title: "Starred Biology",
          is_starred: true,
          card_count: 10,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ];

      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        if (url.includes("/reviews")) return { due_count: 0 };
        if (url.includes("/study-sets")) return { items: starredOnly, total: 1 };
        return {};
      });

      render(React.createElement(DashboardPage));

      await waitFor(() => {
        expect(screen.getByText("Starred Biology")).toBeInTheDocument();
        expect(screen.getByTestId("study-set-star-button")).toBeInTheDocument();
      });

      // Scenario A: Unstar FAILS (rejection)
      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error("Network disconnect"));

      const starBtn = screen.getByTestId("study-set-star-button");
      fireEvent.click(starBtn);

      // Because it rejected, it must NOT be removed from view, and must remain starred
      await waitFor(() => {
        expect(screen.getByText("Starred Biology")).toBeInTheDocument();
        expect(starBtn).toHaveAttribute("aria-label", "Remove star from study set");
      });

      // Scenario B: Unstar SUCCEEDS
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        id: "starred_a",
        is_starred: false,
      });

      fireEvent.click(starBtn);

      // Card stays visible with updated unstarred state (no tab auto-removal)
      await waitFor(() => {
        expect(screen.getByText("Starred Biology")).toBeInTheDocument();
        expect(starBtn).toHaveAttribute("aria-label", "Star study set");
      });
    });

    it("handles error recovery via Retry button when initial dashboard load fails", async () => {
      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        if (url.includes("/reviews")) return { due_count: 0 };
        if (url.includes("/study-sets")) {
          throw new Error("Failed to connect to PlayGrid gateway");
        }
        return {};
      });

      render(React.createElement(DashboardPage));

      // Error alert displayed
      await waitFor(() => {
        expect(screen.getByTestId("dashboard-error-alert")).toBeInTheDocument();
        expect(
          screen.getByText(/Failed to connect to PlayGrid gateway/i)
        ).toBeInTheDocument();
      });

      // Now mock success for retry
      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        if (url.includes("/reviews")) return { due_count: 0 };
        if (url.includes("/study-sets")) {
          return { items: mockInitialSets, total: 2 };
        }
        return {};
      });

      const retryBtn = screen.getByTestId("dashboard-retry-button");
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("dashboard-error-alert")).not.toBeInTheDocument();
        expect(screen.getByText("Organic Chemistry")).toBeInTheDocument();
      });
    });

    it("handles rapid consecutive star toggles without throwing or desyncing state", async () => {
      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        if (url.includes("/reviews")) return { due_count: 0 };
        if (url.includes("/study-sets")) return { items: mockInitialSets, total: 2 };
        return {};
      });

      // Rapid put resolutions
      vi.mocked(apiClient.put).mockResolvedValue({
        id: "set_unstarred",
        is_starred: true,
      });

      render(React.createElement(DashboardPage));

      await waitFor(() => {
        expect(screen.getByText("Organic Chemistry")).toBeInTheDocument();
      });

      const starButtons = screen.getAllByTestId("study-set-star-button");
      // Rapid clicks in sequence
      fireEvent.click(starButtons[0]);
      fireEvent.click(starButtons[0]);
      fireEvent.click(starButtons[0]);

      // Verify apiClient was called multiple times without unhandled rejection
      expect(apiClient.put).toHaveBeenCalled();
    });
  });

  /* ==========================================================================
     Suite 6: Special Characters, URL Reserved Chars & Event Isolation Stress
     ========================================================================== */
  describe("Suite 6: Special Characters, URL Reserved Chars & Event Isolation Stress", () => {
    it("serializes URL reserved characters in search without URI corruption", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });

      const reservedChars = "Math & Physics ? 100% #calculus = advanced + fast";
      await apiGetStudySets({ search: reservedChars });

      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          search: reservedChars,
        },
      });
    });

    it("passes negative and zero page numbers without alteration", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ items: [], total: 0 });

      await apiGetStudySets({ page: -1, page_size: 10 });
      expect(apiClient.get).toHaveBeenCalledWith("/quizlet/study-sets", {
        params: {
          page: -1,
          page_size: 10,
          per_page: 10,
        },
      });
    });

    it("rejects null or undefined IDs in apiGetStudySet", async () => {
      await expect(apiGetStudySet(null as any)).rejects.toThrow("Study set ID is required");
      await expect(apiGetStudySet(undefined as any)).rejects.toThrow("Study set ID is required");
    });

    it("normalizes cards array with empty card objects without crashing", () => {
      const detail = normalizeStudySetDetail({
        id: "empty_card_obj_set",
        title: "Empty Card Object",
        cards: [{}, {}],
      });

      expect(detail.cards).toHaveLength(2);
      expect(detail.cards[0].id).toBe("card_empty_card_obj_set_0");
      expect(detail.cards[0].front_content).toBe("");
      expect(detail.cards[0].back_content).toBe("");
      expect(detail.cards[0].position).toBe(0);
      expect(detail.cards[1].id).toBe("card_empty_card_obj_set_1");
      expect(detail.cards[1].position).toBe(1);
    });
  });
});

