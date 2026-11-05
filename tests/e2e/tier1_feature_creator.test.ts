/**
 * Tier 1: Feature Coverage - Study Set Creator & Bulk Import
 *
 * Verifies core creator workflows:
 * 1. Creating study set with metadata and initial cards
 * 2. Validation enforcing minimum 1 card requirement
 * 3. Adding individual cards via POST /cards
 * 4. Bulk import parsing with Tab delimiter (\t)
 * 5. Bulk import parsing with Comma delimiter (,)
 * 6. Bulk import parsing with Semicolon delimiter (;)
 * 7. Bulk import API submission via POST /import
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockServer } from "./mockServer";
import { createE2EClient, parseBulkText } from "./testHelpers";

describe("Tier 1 - Feature Coverage: Study Set Creator & Bulk Import", () => {
  let client: ReturnType<typeof createE2EClient>;
  let authToken: string;

  beforeEach(async () => {
    mockServer.reset();
    mockServer.installFetchMock();
    client = createE2EClient();

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

  it("1.1 [Create Set]: Creates a new study set with title, description, and initial card pairs", async () => {
    const payload = {
      title: "Data Structures & Algorithms",
      description: "Fundamental CS concepts and Big O complexities.",
      visibility: "public",
      cards: [
        {
          front_content: "Stack",
          back_content: "LIFO (Last In First Out) linear data structure.",
          hint: "Think of a stack of plates",
        },
        {
          front_content: "Queue",
          back_content: "FIFO (First In First Out) linear data structure.",
          hint: "Think of waiting in line",
        },
      ],
    };

    const res = await client.studySets.create(payload);

    expect(res.status).toBe(201);
    expect(res.ok).toBe(true);
    expect(res.data.id).toMatch(/^set_/);
    expect(res.data.title).toBe(payload.title);
    expect(res.data.card_count).toBe(2);
    expect(res.data.cards.length).toBe(2);
    expect(res.data.cards[0].front_content).toBe("Stack");
    expect(res.data.cards[1].front_content).toBe("Queue");
  });

  it("1.2 [Validation - Min 1 Card]: Reject study set creation when cards array is empty", async () => {
    const payload = {
      title: "Empty Study Set",
      description: "Invalid set with 0 cards",
      cards: [],
    };

    const res = await client.studySets.create(payload);

    expect(res.status).toBe(400);
    expect(res.ok).toBe(false);
    expect(res.data.error).toMatch(/At least one card is required/i);
  });

  it("1.3 [Card Addition]: Appends a new card to an existing study set and increments card count", async () => {
    const newCard = {
      front_content: "TypeScript",
      back_content: "A strongly typed superset of JavaScript that compiles to plain JavaScript.",
      hint: "Typed superset",
    };

    const addRes = await client.cards.add("set_web_dev", newCard);

    expect(addRes.status).toBe(201);
    expect(addRes.data.front_content).toBe("TypeScript");
    expect(addRes.data.position).toBe(4);

    // Verify study set detail reflects the new card count
    const detailRes = await client.studySets.get("set_web_dev");
    expect(detailRes.data.card_count).toBe(5);
    expect(detailRes.data.cards[4].front_content).toBe("TypeScript");
  });

  it("1.4 [Bulk Import - Tab Delimiter]: Parses tab-separated text into structured card pairs", () => {
    const tabInput = [
      "Bonjour\tHello",
      "Merci\tThank you",
      "Au revoir\tGoodbye",
    ].join("\n");

    const result = parseBulkText(tabInput, "\t", "\n");

    expect(result.errors.length).toBe(0);
    expect(result.cards.length).toBe(3);
    expect(result.cards[0]).toEqual({ front_content: "Bonjour", back_content: "Hello" });
    expect(result.cards[1]).toEqual({ front_content: "Merci", back_content: "Thank you" });
    expect(result.cards[2]).toEqual({ front_content: "Au revoir", back_content: "Goodbye" });
  });

  it("1.5 [Bulk Import - Comma Delimiter]: Parses comma-separated text into structured card pairs", () => {
    const commaInput = [
      "Apple, A round red or green fruit",
      "Banana, A long curved yellow fruit",
      "Cherry, A small round stone fruit",
    ].join("\n");

    const result = parseBulkText(commaInput, ",", "\n");

    expect(result.errors.length).toBe(0);
    expect(result.cards.length).toBe(3);
    expect(result.cards[0].front_content).toBe("Apple");
    expect(result.cards[0].back_content).toBe("A round red or green fruit");
    expect(result.cards[1].front_content).toBe("Banana");
    expect(result.cards[1].back_content).toBe("A long curved yellow fruit");
    expect(result.cards[2].front_content).toBe("Cherry");
    expect(result.cards[2].back_content).toBe("A small round stone fruit");
  });

  it("1.6 [Bulk Import - Semicolon Delimiter]: Parses semicolon-separated text correctly", () => {
    const semiInput = [
      "HTTP; Hypertext Transfer Protocol",
      "HTTPS; Hypertext Transfer Protocol Secure",
      "DNS; Domain Name System",
    ].join("\n");

    const result = parseBulkText(semiInput, ";", "\n");

    expect(result.errors.length).toBe(0);
    expect(result.cards.length).toBe(3);
    expect(result.cards[0].front_content).toBe("HTTP");
    expect(result.cards[0].back_content).toBe("Hypertext Transfer Protocol");
    expect(result.cards[1].front_content).toBe("HTTPS");
    expect(result.cards[1].back_content).toBe("Hypertext Transfer Protocol Secure");
    expect(result.cards[2].front_content).toBe("DNS");
    expect(result.cards[2].back_content).toBe("Domain Name System");
  });

  it("1.7 [Bulk Import API]: Submits raw text to POST /api/v1/quizlet/study-sets/:id/import and updates set", async () => {
    const rawTSV = "Photosynthesis\tProcess by which green plants make food\nMitochondria\tPowerhouse of the cell";

    const importRes = await client.cards.import("set_spanish_101", {
      raw_text: rawTSV,
      term_delimiter: "\t",
      card_delimiter: "\n",
    });

    expect(importRes.status).toBe(200);
    expect(importRes.data.success).toBe(true);
    expect(importRes.data.imported_count).toBe(2);

    // Verify study set has 3 original + 2 imported = 5 cards
    const detailRes = await client.studySets.get("set_spanish_101");
    expect(detailRes.data.card_count).toBe(5);
  });
});
