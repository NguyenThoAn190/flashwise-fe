/**
 * Tier 1: Feature Coverage - Authentication Flow
 *
 * Verifies core user authentication capabilities:
 * 1. User Signup with email/password/name
 * 2. User Login with email and password
 * 3. User Login with username alternative
 * 4. User Profile fetch and session restore
 * 5. Signout token revocation
 * 6. Route protection on unauthenticated requests
 * 7. Session persistence restoration verification
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockServer } from "./mockServer";
import { createE2EClient } from "./testHelpers";

describe("Tier 1 - Feature Coverage: Authentication Flow", () => {
  let client: ReturnType<typeof createE2EClient>;

  beforeEach(() => {
    mockServer.reset();
    mockServer.installFetchMock();
    client = createE2EClient();
  });

  afterEach(() => {
    mockServer.uninstallFetchMock();
  });

  it("1.1 [Signup]: User can register with email, password, and full name", async () => {
    const signupData = {
      email: "newlearner@quizlet.local",
      password: "StrongPassword123!",
      full_name: "New Learner",
      username: "newlearner",
    };

    const res = await client.auth.signup(signupData);

    expect(res.status).toBe(201);
    expect(res.ok).toBe(true);
    expect(res.data.user).toBeDefined();
    expect(res.data.user.email).toBe(signupData.email);
    expect(res.data.user.full_name).toBe(signupData.full_name);
    expect(res.data.user.username).toBe(signupData.username);
    expect(res.data.access_token).toBeDefined();
    expect(typeof res.data.access_token).toBe("string");
    expect(res.data.refresh_token).toBeDefined();
    expect(res.data.token_type).toBe("Bearer");
    expect(res.data.expires_in).toBe(3600);
  });

  it("1.2 [Login]: User can authenticate using valid email and password", async () => {
    const credentials = {
      email: "demo@quizlet.local",
      password: "Password123!",
    };

    const res = await client.auth.login(credentials);

    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    expect(res.data.user).toBeDefined();
    expect(res.data.user.email).toBe("demo@quizlet.local");
    expect(res.data.user.full_name).toBe("Demo Student");
    expect(res.data.access_token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(res.data.refresh_token).toMatch(/^rt_/);
  });

  it("1.3 [Login]: User can authenticate using valid username alternative", async () => {
    const credentials = {
      username: "demostudent",
      password: "Password123!",
    };

    const res = await client.auth.login(credentials);

    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    expect(res.data.user.username).toBe("demostudent");
    expect(res.data.access_token).toBeDefined();
  });

  it("1.4 [Session Restore]: Retrieves user profile via GET /api/v1/user/profile with Bearer token", async () => {
    // 1. Log in to acquire token
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    const token = loginRes.data.access_token;
    client.setToken(token);

    // 2. Fetch profile (session restore on page load)
    const profileRes = await client.auth.profile();

    expect(profileRes.status).toBe(200);
    expect(profileRes.ok).toBe(true);
    expect(profileRes.data.email).toBe("demo@quizlet.local");
    expect(profileRes.data.full_name).toBe("Demo Student");
    expect(profileRes.data.stats).toBeDefined();
    expect(profileRes.data.stats.total_study_sets).toBeGreaterThanOrEqual(1);
    expect(profileRes.data.stats.current_streak).toBeGreaterThanOrEqual(1);
  });

  it("1.5 [Signout]: Revokes authentication token and clears session", async () => {
    // 1. Log in
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    const token = loginRes.data.access_token;
    client.setToken(token);

    // 2. Sign out
    const signoutRes = await client.auth.signout();
    expect(signoutRes.status).toBe(200);
    expect(signoutRes.data.success).toBe(true);

    // 3. Attempting profile access with revoked token must fail with 401
    const profileRes = await client.auth.profile();
    expect(profileRes.status).toBe(401);
    expect(profileRes.ok).toBe(false);
  });

  it("1.6 [Route Protection]: Protected user profile rejects unauthenticated requests", async () => {
    // Client without token
    client.clearToken();

    const res = await client.auth.profile();
    expect(res.status).toBe(401);
    expect(res.ok).toBe(false);
    expect(res.data.error).toMatch(/Unauthorized/i);
  });

  it("1.7 [Session Restore]: Restores profile after client re-instantiation from stored token", async () => {
    // Simulate browser LocalStorage persistence
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    const storedToken = loginRes.data.access_token;

    // Simulate page refresh / new window: instantiate a fresh client with the stored token
    const refreshedClient = createE2EClient(undefined, storedToken);
    const profileRes = await refreshedClient.auth.profile();

    expect(profileRes.status).toBe(200);
    expect(profileRes.data.id).toBe("usr_demo_101");
    expect(profileRes.data.username).toBe("demostudent");
  });
});
