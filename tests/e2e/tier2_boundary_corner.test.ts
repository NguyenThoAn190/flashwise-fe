/**
 * Tier 2: Boundary & Corner Cases
 *
 * Verifies edge cases, malformed inputs, and recovery mechanisms:
 * 1. Expired access token rejection (401) and subsequent auto-refresh (200)
 * 2. Invalid / malformed refresh token rejection (401)
 * 3. Invalid credentials rejection (wrong password and non-existent email)
 * 4. Duplicate email signup rejection (409 Conflict)
 * 5. Short password rejection (< 6 characters)
 * 6. Empty / whitespace-only study set title rejection (400)
 * 7. Bulk import with trailing blank lines, empty lines, and excessive spacing
 * 8. Bulk import with malformed lines missing delimiter (error reporting)
 * 9. Starting a learn session on an empty study set (400)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockServer } from "./mockServer";
import { createE2EClient, parseBulkText } from "./testHelpers";

describe("Tier 2 - Boundary & Corner Cases", () => {
  let client: ReturnType<typeof createE2EClient>;

  beforeEach(() => {
    mockServer.reset();
    mockServer.installFetchMock();
    client = createE2EClient();
  });

  afterEach(() => {
    mockServer.uninstallFetchMock();
  });

  it("2.1 [Token Expiration & Auto-Refresh]: Expired token is rejected, refresh token yields new valid token", async () => {
    // 1. Initial Login
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    const refreshToken = loginRes.data.refresh_token;

    // 2. Set an expired access token
    const expiredToken = mockServer.createExpiredToken("usr_demo_101");
    client.setToken(expiredToken);

    // 3. Requesting profile with expired token must return 401
    const failedProfile = await client.auth.profile();
    expect(failedProfile.status).toBe(401);
    expect(failedProfile.ok).toBe(false);

    // 4. Client triggers auto-refresh using refresh token
    const refreshRes = await client.auth.refresh({ refresh_token: refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.data.access_token).toBeDefined();

    // 5. Subsequent request with new token succeeds
    client.setToken(refreshRes.data.access_token);
    const successProfile = await client.auth.profile();
    expect(successProfile.status).toBe(200);
    expect(successProfile.data.email).toBe("demo@quizlet.local");
  });

  it("2.2 [Malformed Refresh Token]: Rejects non-existent or corrupted refresh token", async () => {
    const res = await client.auth.refresh({
      refresh_token: "invalid_corrupted_token_xyz",
    });

    expect(res.status).toBe(401);
    expect(res.data.error).toMatch(/Invalid or expired refresh token/i);
  });

  it("2.3 [Invalid Credentials]: Rejects incorrect password and non-existent email", async () => {
    // Incorrect password
    const wrongPassRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "WrongPassword999!",
    });
    expect(wrongPassRes.status).toBe(401);
    expect(wrongPassRes.data.error).toMatch(/Invalid credentials/i);

    // Non-existent email
    const unknownEmailRes = await client.auth.login({
      email: "nobody_exists@quizlet.local",
      password: "Password123!",
    });
    expect(unknownEmailRes.status).toBe(401);
    expect(unknownEmailRes.data.error).toMatch(/Invalid credentials/i);
  });

  it("2.4 [Duplicate Email]: Rejects signup when email is already registered", async () => {
    const duplicateData = {
      email: "DEMO@QUIZLET.LOCAL", // case-insensitive duplicate check
      password: "AnotherPassword123!",
      full_name: "Imposter Demo",
    };

    const res = await client.auth.signup(duplicateData);

    expect(res.status).toBe(409);
    expect(res.ok).toBe(false);
    expect(res.data.error).toMatch(/already exists/i);
  });

  it("2.5 [Password Boundary]: Rejects signup with password shorter than 6 characters", async () => {
    const shortPassData = {
      email: "shortpass@quizlet.local",
      password: "12345", // only 5 characters
      full_name: "Short Pass User",
    };

    const res = await client.auth.signup(shortPassData);

    expect(res.status).toBe(400);
    expect(res.data.error).toMatch(/at least 6 characters/i);
  });

  it("2.6 [Empty Study Set Title]: Rejects creation with empty or whitespace-only title", async () => {
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    client.setToken(loginRes.data.access_token);

    // Empty string
    const emptyRes = await client.studySets.create({
      title: "",
      cards: [{ front_content: "A", back_content: "B" }],
    });
    expect(emptyRes.status).toBe(400);
    expect(emptyRes.data.error).toMatch(/Title is required/i);

    // Whitespace string
    const whitespaceRes = await client.studySets.create({
      title: "     ",
      cards: [{ front_content: "A", back_content: "B" }],
    });
    expect(whitespaceRes.status).toBe(400);
    expect(whitespaceRes.data.error).toMatch(/Title is required/i);
  });

  it("2.7 [Bulk Import - Trailing & Interstitial Blank Lines]: Robustly skips empty lines without creating phantom cards", () => {
    const textWithBlankLines = `
      Term 1\tDef 1

      Term 2\tDef 2


      Term 3\tDef 3
      

    `;

    const result = parseBulkText(textWithBlankLines, "\t", "\n");

    expect(result.errors.length).toBe(0);
    expect(result.cards.length).toBe(3);
    expect(result.cards[0]).toEqual({ front_content: "Term 1", back_content: "Def 1" });
    expect(result.cards[1]).toEqual({ front_content: "Term 2", back_content: "Def 2" });
    expect(result.cards[2]).toEqual({ front_content: "Term 3", back_content: "Def 3" });
  });

  it("2.8 [Bulk Import - Malformed Lines]: Reports line numbers with missing delimiters while parsing valid lines", () => {
    const mixedInput = [
      "ValidTerm1\tValidDef1",
      "MalformedLineWithoutDelimiter",
      "ValidTerm2\tValidDef2",
      "MissingDefinition\t",
    ].join("\n");

    const result = parseBulkText(mixedInput, "\t", "\n");

    expect(result.cards.length).toBe(2);
    expect(result.cards[0].front_content).toBe("ValidTerm1");
    expect(result.cards[1].front_content).toBe("ValidTerm2");

    expect(result.errors.length).toBe(2);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain("Missing delimiter");
    expect(result.errors[1].line).toBe(4);
    expect(result.errors[1].message).toContain("non-empty");
  });

  it("2.9 [Empty Study Set Session]: Starting learn session on set with 0 cards returns 400", async () => {
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    client.setToken(loginRes.data.access_token);

    // Directly create set with 0 cards in mock server database to simulate empty set
    const emptySetId = "set_empty_boundary";
    (mockServer as any).studySets.set(emptySetId, {
      id: emptySetId,
      title: "Empty Boundary Set",
      description: "",
      visibility: "public",
      creator_id: "usr_demo_101",
      creator_name: "Demo Student",
      is_starred: false,
      card_count: 0,
      cards: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await client.sessions.start(emptySetId);
    expect(res.status).toBe(400);
    expect(res.data.error).toMatch(/Cannot start a session on an empty study set/i);
  });
});
