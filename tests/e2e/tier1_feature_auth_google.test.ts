/**
 * Tier 1: Feature Coverage - Google Login (GIS direct, no NextAuth)
 *
 * Covers acceptance criteria:
 * - New Google user -> JIT provisioned, receives PlayGrid JWT, profile works
 * - Existing Google user (same email) -> linked login, same user id
 * - Banned user -> 403 USER_BANNED
 * - Invalid/expired/unverified token -> 401/400, no session created
 * - Regression: normal Quizlet APIs work after Google login
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockServer } from "./mockServer";
import { createE2EClient } from "./testHelpers";

describe("Tier 1 - Feature Coverage: Google Login (GIS id_token)", () => {
  let client: ReturnType<typeof createE2EClient>;

  beforeEach(() => {
    mockServer.reset();
    mockServer.installFetchMock();
    client = createE2EClient();
  });

  afterEach(() => {
    mockServer.uninstallFetchMock();
  });

  it("G1 [Google]: new Google user is JIT-provisioned and receives PlayGrid JWT", async () => {
    const res = await client.auth.loginGoogle("google-valid:newstudent@gmail.com:New Student");

    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    expect(res.data.access_token).toBeDefined();
    expect(res.data.refresh_token).toBeDefined();
    expect(res.data.user.email).toBe("newstudent@gmail.com");
    expect(res.data.is_new_user).toBe(true);

    // Session works: fetch profile with the new token
    client.setToken(res.data.access_token);
    const profile = await client.auth.profile();
    expect(profile.status).toBe(200);
    expect(profile.data.email).toBe("newstudent@gmail.com");
  });

  it("G2 [Google]: existing user with same email logs in (account linking)", async () => {
    const first = await client.auth.loginGoogle("google-valid:demo@quizlet.local:Demo Student");
    expect(first.status).toBe(200);
    expect(first.data.user.id).toBe("usr_demo_101");
    expect(first.data.is_new_user).toBe(false);

    const second = await client.auth.loginGoogle("google-valid:demo@quizlet.local:Demo Student");
    expect(second.data.user.id).toBe("usr_demo_101");
  });

  it("G3 [Google]: banned user is rejected with 403", async () => {
    const res = await client.auth.loginGoogle("banned-google-token");
    expect(res.status).toBe(403);
    expect(res.ok).toBe(false);
  });

  it("G4 [Google]: invalid/expired token is rejected with 401 and creates no session", async () => {
    for (const bad of ["expired-google-token", "invalid-google-token", ""]) {
      const res = await client.auth.loginGoogle(bad);
      expect([400, 401].includes(res.status)).toBe(true);
      expect(res.ok).toBe(false);
      expect(res.data?.access_token).toBeUndefined();
    }
  });

  it("G5 [Google]: unverified email is rejected with 400", async () => {
    const res = await client.auth.loginGoogle("unverified-google-token");
    expect(res.status).toBe(400);
    expect(res.ok).toBe(false);
  });

  it("G6 [Regression]: Quizlet APIs work after Google login", async () => {
    const login = await client.auth.loginGoogle("google-valid:demo@quizlet.local:Demo Student");
    client.setToken(login.data.access_token);

    const sets = await client.studySets.list();
    expect(sets.status).toBe(200);
    expect(sets.ok).toBe(true);
    expect(Array.isArray(sets.data.items)).toBe(true);

    const progress = await client.progress.get();
    expect(progress.status).toBe(200);
    expect(progress.ok).toBe(true);
  });

  it("G7 [Google popup-code]: auth_code flow JIT-provisions and links same as id_token", async () => {
    const codeLogin = await client.auth.loginGoogleCode(
      "google-code-valid:newpopup@gmail.com:New Popup"
    );
    expect(codeLogin.status).toBe(200);
    expect(codeLogin.data.is_new_user).toBe(true);
    expect(codeLogin.data.user.email).toBe("newpopup@gmail.com");

    const linkLogin = await client.auth.loginGoogleCode(
      "google-code-valid:demo@quizlet.local:Demo Student"
    );
    expect(linkLogin.status).toBe(200);
    expect(linkLogin.data.user.id).toBe("usr_demo_101");
    expect(linkLogin.data.is_new_user).toBe(false);
  });

  it("G8 [Google popup-code]: invalid/expired codes rejected, valid token bodies kept", async () => {
    for (const bad of ["invalid-google-code", "expired-google-code", ""]) {
      const res = await client.auth.loginGoogleCode(bad);
      expect([400, 401].includes(res.status)).toBe(true);
      expect(res.ok).toBe(false);
      expect(res.data?.access_token).toBeUndefined();
    }
    const banned = await client.auth.loginGoogleCode("banned-google-code");
    expect(banned.status).toBe(403);
  });
});
