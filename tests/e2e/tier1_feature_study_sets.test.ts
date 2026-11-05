/**
 * Tier 1: Feature Coverage - Study Sets List & Management
 *
 * Verifies core study set capabilities:
 * 1. Fetching study sets list with card counts
 * 2. Search query filtering by title/description
 * 3. Filter by "mine" (user-created sets)
 * 4. Filter by "starred" sets
 * 5. Filter by "recent" sets (sorted by updated_at)
 * 6. Fetching single study set detail with cards array
 * 7. Duplicate study set action
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockServer } from "./mockServer";
import { createE2EClient } from "./testHelpers";

describe("Tier 1 - Feature Coverage: Study Sets List & Details", () => {
  let client: ReturnType<typeof createE2EClient>;
  let authToken: string;

  beforeEach(async () => {
    mockServer.reset();
    mockServer.installFetchMock();
    client = createE2EClient();

    // Authenticate demo user
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    authToken = loginRes.data.access_token;
    client.setToken(authToken);
  });

  afterEach(() => {
    mockServer.uninstallFetchMock();
  });

  it("1.1 [Fetch List]: Retrieves study sets with accurate card counts and creator info", async () => {
    const res = await client.studySets.list();

    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    expect(res.data.items).toBeInstanceOf(Array);
    expect(res.data.items.length).toBeGreaterThanOrEqual(2);
    expect(res.data.total).toBe(res.data.items.length);

    const webDevSet = res.data.items.find((s: any) => s.id === "set_web_dev");
    expect(webDevSet).toBeDefined();
    expect(webDevSet.title).toBe("Web Development Fundamentals");
    expect(webDevSet.card_count).toBe(4);
    expect(webDevSet.creator_name).toBe("Demo Student");
    expect(webDevSet.is_starred).toBe(true);
  });

  it("1.2 [Search Filter]: Filters study sets matching search keywords in title or description", async () => {
    // Search for "Spanish"
    const spanishRes = await client.studySets.list({ search: "spanish" });
    expect(spanishRes.status).toBe(200);
    expect(spanishRes.data.items.length).toBe(1);
    expect(spanishRes.data.items[0].id).toBe("set_spanish_101");
    expect(spanishRes.data.items[0].title).toContain("Spanish 101");

    // Search for "CSS" (present in description of Web Dev set)
    const cssRes = await client.studySets.list({ search: "css" });
    expect(cssRes.status).toBe(200);
    expect(cssRes.data.items.length).toBe(1);
    expect(cssRes.data.items[0].id).toBe("set_web_dev");

    // Search with non-existent query
    const emptyRes = await client.studySets.list({ search: "xyz_nonexistent_term" });
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.data.items.length).toBe(0);
  });

  it("1.3 [Filter 'mine']: Returns only sets created by the current user", async () => {
    const res = await client.studySets.list({ filter: "mine" });

    expect(res.status).toBe(200);
    expect(res.data.items.length).toBeGreaterThan(0);
    for (const item of res.data.items) {
      expect(item.creator_id).toBe("usr_demo_101");
    }
  });

  it("1.4 [Filter 'starred']: Returns only favorited / starred study sets", async () => {
    const res = await client.studySets.list({ filter: "starred" });

    expect(res.status).toBe(200);
    expect(res.data.items.length).toBeGreaterThan(0);
    for (const item of res.data.items) {
      expect(item.is_starred).toBe(true);
    }
  });

  it("1.5 [Filter 'recent']: Sorts study sets chronologically by updated_at descending", async () => {
    const res = await client.studySets.list({ filter: "recent" });

    expect(res.status).toBe(200);
    const items = res.data.items;
    expect(items.length).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < items.length - 1; i++) {
      const timeCurrent = new Date(items[i].updated_at).getTime();
      const timeNext = new Date(items[i + 1].updated_at).getTime();
      expect(timeCurrent).toBeGreaterThanOrEqual(timeNext);
    }
  });

  it("1.6 [Study Set Detail]: Fetches full study set with cards array and metadata", async () => {
    const res = await client.studySets.get("set_web_dev");

    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    expect(res.data.id).toBe("set_web_dev");
    expect(res.data.cards).toBeInstanceOf(Array);
    expect(res.data.cards.length).toBe(4);

    const firstCard = res.data.cards[0];
    expect(firstCard.front_content).toBe("HTML");
    expect(firstCard.back_content).toContain("Markup Language");
    expect(firstCard.state).toBe("mastered");
  });

  it("1.7 [Duplicate Set]: Copies study set with '(Copy)' title and replicates all flashcards", async () => {
    const dupRes = await client.studySets.duplicate("set_spanish_101");

    expect(dupRes.status).toBe(201);
    expect(dupRes.data.title).toBe("Spanish 101 Vocabulary (Copy)");
    expect(dupRes.data.card_count).toBe(3);
    expect(dupRes.data.cards.length).toBe(3);
    expect(dupRes.data.cards[0].front_content).toBe("Hola");

    // Verify duplicated set is now available in study sets list
    const listRes = await client.studySets.list();
    const found = listRes.data.items.find((s: any) => s.id === dupRes.data.id);
    expect(found).toBeDefined();
    expect(found.title).toBe("Spanish 101 Vocabulary (Copy)");
  });
});
