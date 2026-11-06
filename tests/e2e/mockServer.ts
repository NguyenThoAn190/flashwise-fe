/**
 * PlayGrid API Gateway Mock Server for E2E Tests
 *
 * Implements a faithful in-memory simulation of the PlayGrid API Gateway (/api/v1)
 * covering authentication, user profiles, study sets CRUD, card management,
 * bulk import parsing, adaptive learning sessions (MCQ, True/False, Written),
 * spaced repetition (SRS) ratings, and progress tracking.
 */

export interface MockUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  is_banned?: boolean;
  stats: {
    total_study_sets: number;
    cards_mastered: number;
    current_streak: number;
  };
}

export type KnowledgeState = "not_studied" | "learning" | "reviewing" | "mastered";

export interface MockFlashcard {
  id: string;
  study_set_id: string;
  front_content: string;
  back_content: string;
  position: number;
  hint?: string;
  explanation?: string;
  state: KnowledgeState;
  next_review_at?: string;
  interval_days?: number;
  ease_factor?: number;
  created_at: string;
  updated_at: string;
}

export interface MockStudySet {
  id: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  creator_id: string;
  creator_name: string;
  is_starred: boolean;
  card_count: number;
  cards: MockFlashcard[];
  created_at: string;
  updated_at: string;
}

export type QuestionType = "mcq" | "true_false" | "written" | "recall";

export interface MockStudySession {
  id: string;
  study_set_id: string;
  user_id: string;
  mode: "learn" | "flashcards";
  direction: "term_first" | "def_first";
  status: "in_progress" | "completed";
  total_cards: number;
  current_index: number;
  card_ids: string[];
  correct_count: number;
  incorrect_count: number;
  created_at: string;
  // Học theo chặng nhỏ (đồng bộ BE/FE).
  chunk_size?: number;
  active_chunk?: number;
  total_chunks?: number;
  /** Danh sách card đã trả lời đúng trong phiên (dùng dựng chunk_cards). */
  answered_card_ids?: string[];
}

export interface MockAdaptiveQuestion {
  question_id: string;
  session_id: string;
  card_id: string;
  question_type: QuestionType;
  prompt: string;
  options?: string[];
  correct_index?: number;
  proposed_definition?: string;
  is_true?: boolean;
  expected_answer?: string;
  card_index: number;
  total_cards: number;
  // Học theo chặng nhỏ.
  active_chunk?: number;
  total_chunks?: number;
  chunk_size?: number;
  is_review_card?: boolean;
  chunk_gate_passed?: boolean;
  failed_retry?: boolean;
  chunk_cards?: Array<{
    flashcard_id: string;
    mastery_score: number;
    state?: number;
    failed_in_session?: boolean;
    answered_correct?: boolean;
  }>;
  knowledge_progress?: number;
  chunk_mastered_count?: number;
}

export interface MockResponse<T = any> {
  status: number;
  headers: Record<string, string>;
  data: T;
}

// Initial Seed Data
const INITIAL_USERS: MockUser[] = [
  {
    id: "usr_demo_101",
    email: "demo@quizlet.local",
    password_hash: "Password123!",
    full_name: "Demo Student",
    username: "demostudent",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=demostudent",
    created_at: "2026-01-01T00:00:00Z",
    stats: {
      total_study_sets: 2,
      cards_mastered: 4,
      current_streak: 5,
    },
  },
];

const INITIAL_SETS: MockStudySet[] = [
  {
    id: "set_web_dev",
    title: "Web Development Fundamentals",
    description: "Core concepts of HTML, CSS, JavaScript, and React architecture.",
    visibility: "public",
    creator_id: "usr_demo_101",
    creator_name: "Demo Student",
    is_starred: true,
    card_count: 4,
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-02-01T10:00:00Z",
    cards: [
      {
        id: "card_wd_1",
        study_set_id: "set_web_dev",
        front_content: "HTML",
        back_content: "HyperText Markup Language for structuring web content.",
        position: 0,
        hint: "Markup language",
        explanation: "Standard markup language used to create web page structure.",
        state: "mastered",
        interval_days: 4,
        ease_factor: 2.5,
        created_at: "2026-02-01T10:00:00Z",
        updated_at: "2026-02-01T10:00:00Z",
      },
      {
        id: "card_wd_2",
        study_set_id: "set_web_dev",
        front_content: "CSS",
        back_content: "Cascading Style Sheets for describing document presentation.",
        position: 1,
        hint: "Styling language",
        explanation: "Style sheet language used for specifying presentation.",
        state: "reviewing",
        interval_days: 1,
        ease_factor: 2.5,
        created_at: "2026-02-01T10:00:00Z",
        updated_at: "2026-02-01T10:00:00Z",
      },
      {
        id: "card_wd_3",
        study_set_id: "set_web_dev",
        front_content: "JavaScript",
        back_content: "A dynamic multi-paradigm programming language for interactive web apps.",
        position: 2,
        hint: "Programming language of the web",
        explanation: "High-level, just-in-time compiled language.",
        state: "learning",
        interval_days: 0.007,
        ease_factor: 2.3,
        created_at: "2026-02-01T10:00:00Z",
        updated_at: "2026-02-01T10:00:00Z",
      },
      {
        id: "card_wd_4",
        study_set_id: "set_web_dev",
        front_content: "React",
        back_content: "A declarative, component-based JavaScript library for user interfaces.",
        position: 3,
        hint: "UI library by Meta",
        explanation: "Used for building modular single-page web applications.",
        state: "not_studied",
        created_at: "2026-02-01T10:00:00Z",
        updated_at: "2026-02-01T10:00:00Z",
      },
    ],
  },
  {
    id: "set_spanish_101",
    title: "Spanish 101 Vocabulary",
    description: "Common Spanish greetings and conversational expressions.",
    visibility: "public",
    creator_id: "usr_demo_101",
    creator_name: "Demo Student",
    is_starred: false,
    card_count: 3,
    created_at: "2026-02-10T12:00:00Z",
    updated_at: "2026-02-10T12:00:00Z",
    cards: [
      {
        id: "card_sp_1",
        study_set_id: "set_spanish_101",
        front_content: "Hola",
        back_content: "Hello",
        position: 0,
        state: "mastered",
        created_at: "2026-02-10T12:00:00Z",
        updated_at: "2026-02-10T12:00:00Z",
      },
      {
        id: "card_sp_2",
        study_set_id: "set_spanish_101",
        front_content: "Gracias",
        back_content: "Thank you",
        position: 1,
        state: "mastered",
        created_at: "2026-02-10T12:00:00Z",
        updated_at: "2026-02-10T12:00:00Z",
      },
      {
        id: "card_sp_3",
        study_set_id: "set_spanish_101",
        front_content: "Adiós",
        back_content: "Goodbye",
        position: 2,
        state: "mastered",
        created_at: "2026-02-10T12:00:00Z",
        updated_at: "2026-02-10T12:00:00Z",
      },
    ],
  },
];

export class MockApiGatewayServer {
  private users: Map<string, MockUser> = new Map();
  private studySets: Map<string, MockStudySet> = new Map();
  private sessions: Map<string, MockStudySession> = new Map();
  private activeQuestions: Map<string, MockAdaptiveQuestion> = new Map();
  private refreshTokens: Map<string, string> = new Map();
  private revokedTokens: Set<string> = new Set();
  private originalFetch: typeof globalThis.fetch | null = null;

  constructor() {
    this.reset();
  }

  /**
   * Resets the in-memory database to original seed state.
   */
  public reset(): void {
    this.users.clear();
    for (const u of INITIAL_USERS) {
      this.users.set(u.id, JSON.parse(JSON.stringify(u)));
    }

    this.studySets.clear();
    for (const s of INITIAL_SETS) {
      this.studySets.set(s.id, JSON.parse(JSON.stringify(s)));
    }

    this.sessions.clear();
    this.activeQuestions.clear();
    this.refreshTokens.clear();
    this.revokedTokens.clear();
  }

  // ==========================================
  // Token Simulation Helpers
  // ==========================================

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return atob(base64);
  }

  public generateToken(userId: string, expiresInSec: number = 3600): string {
    const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = "mock_sig_" + Math.random().toString(36).substring(2, 10);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  public generateRefreshToken(userId: string): string {
    const token = `rt_${Math.random().toString(36).substring(2, 16)}_${Date.now()}`;
    this.refreshTokens.set(token, userId);
    return token;
  }

  public createExpiredToken(userId: string): string {
    return this.generateToken(userId, -60); // expired 60 seconds ago
  }

  public verifyToken(token: string): MockUser | null {
    if (!token || this.revokedTokens.has(token)) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payloadStr = this.base64UrlDecode(parts[1]);
      const payload = JSON.parse(payloadStr);

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }

      const user = this.users.get(payload.sub);
      return user || null;
    } catch {
      return null;
    }
  }

  private extractBearerUser(headers: Record<string, string>): MockUser | null {
    const authHeader = headers["authorization"] || headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7).trim();
    return this.verifyToken(token);
  }

  // ==========================================
  // Core Dispatcher / Request Handler
  // ==========================================

  public async handle(
    method: string,
    rawUrl: string,
    body: any = null,
    headers: Record<string, string> = {}
  ): Promise<MockResponse> {
    const normalizedMethod = method.toUpperCase();
    const urlObj = new URL(rawUrl, "http://localhost:8080");
    const path = urlObj.pathname;
    const params = urlObj.searchParams;

    // Standard headers returned by PlayGrid Gateway
    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-PlayGrid-Gateway": "v1.4.0-mock",
    };

    // Helper to format response
    const json = (status: number, data: any): MockResponse => ({
      status,
      headers: responseHeaders,
      data,
    });

    // ----------------------------------------------------
    // AUTHENTICATION ROUTES (/api/v1/auth/*)
    // ----------------------------------------------------
    if (path === "/api/v1/auth/signup" && normalizedMethod === "POST") {
      const { email, password, full_name, username } = body || {};
      if (!email || !password || !full_name) {
        return json(400, { error: "Missing required fields: email, password, full_name" });
      }

      if (password.length < 6) {
        return json(400, { error: "Password must be at least 6 characters long" });
      }

      // Check duplicate email
      for (const u of this.users.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) {
          return json(409, { error: "User with this email already exists" });
        }
      }

      const newUser: MockUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email,
        password_hash: password,
        full_name,
        username: username || email.split("@")[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || email}`,
        created_at: new Date().toISOString(),
        stats: { total_study_sets: 0, cards_mastered: 0, current_streak: 1 },
      };

      this.users.set(newUser.id, newUser);

      const accessToken = this.generateToken(newUser.id);
      const refreshToken = this.generateRefreshToken(newUser.id);

      return json(201, {
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          username: newUser.username,
          avatar_url: newUser.avatar_url,
          created_at: newUser.created_at,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: 3600,
      });
    }

    if (path === "/api/v1/auth/token" && normalizedMethod === "POST") {
      const { email, username, password } = body || {};
      const identifier = (email || username || "").toLowerCase();

      let matchedUser: MockUser | null = null;
      for (const u of this.users.values()) {
        if (
          u.email.toLowerCase() === identifier ||
          u.username.toLowerCase() === identifier
        ) {
          if (u.password_hash === password) {
            matchedUser = u;
            break;
          }
        }
      }

      if (!matchedUser) {
        return json(401, { error: "Invalid credentials" });
      }

      const accessToken = this.generateToken(matchedUser.id);
      const refreshToken = this.generateRefreshToken(matchedUser.id);

      return json(200, {
        user: {
          id: matchedUser.id,
          email: matchedUser.email,
          full_name: matchedUser.full_name,
          username: matchedUser.username,
          avatar_url: matchedUser.avatar_url,
          created_at: matchedUser.created_at,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: 3600,
      });
    }

    if (path === "/api/v1/auth/refresh" && normalizedMethod === "POST") {
      const { refresh_token } = body || {};
      if (!refresh_token || typeof refresh_token !== "string") {
        return json(401, { error: "Invalid or expired refresh token" });
      }

      const userId = this.refreshTokens.get(refresh_token);
      if (!userId) {
        return json(401, { error: "Invalid or expired refresh token" });
      }

      const user = this.users.get(userId);
      if (!user) {
        return json(401, { error: "User session not found" });
      }

      const newAccessToken = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return json(200, {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
        expires_in: 3600,
      });
    }

    // ----------------------------------------------------
    // GOOGLE SOCIAL LOGIN (/api/v1/auth/social/*) - GIS id_token exchange
    // ----------------------------------------------------
    if ((path === "/api/v1/auth/social/google" || path === "/api/v1/auth/social/login") && normalizedMethod === "POST") {
      const { provider, id_token, auth_code } = body || {};
      const prov = String(provider || (path.includes("/google") ? "google" : "") || "").toLowerCase();
      if (prov !== "google") {
        return json(400, { error: "unsupported provider" });
      }
      // FE popup-code flow sends `auth_code`; legacy GIS flow sends `id_token`.
      // Mock accepts either ("google-valid:..." or "google-code-valid:..." prefixes).
      let id_token_effective: unknown = id_token;
      const rawCode = typeof auth_code === "string" ? auth_code : "";
      if ((id_token_effective === undefined || id_token_effective === null || id_token_effective === "") && rawCode) {
        if (rawCode === "expired-google-code" || rawCode === "invalid-google-code") {
          return json(401, { error: { code: "AUTH_INVALID_TOKEN", message: "invalid google auth code" } });
        }
        if (rawCode === "unverified-google-code") {
          return json(400, { error: { code: "BAD_REQUEST", message: "google email not verified" } });
        }
        if (rawCode === "banned-google-code") {
          return json(403, { error: { code: "USER_BANNED", message: "user is banned" } });
        }
        if (rawCode.startsWith("google-code-valid:")) {
          // "google-code-valid:email[:name]" -> map to id_token form
          id_token_effective = `google-valid:${rawCode.slice("google-code-valid:".length)}`;
        } else if (rawCode) {
          return json(401, { error: { code: "AUTH_INVALID_TOKEN", message: "invalid google auth code" } });
        }
      }
      const idTokenStr = typeof id_token_effective === "string" ? id_token_effective : "";
      if (!idTokenStr) {
        return json(400, { error: "either id_token or auth_code is required" });
      }
      if (idTokenStr === "expired-google-token" || idTokenStr === "invalid-google-token") {
        return json(401, { error: { code: "AUTH_INVALID_TOKEN", message: "invalid google id token" } });
      }
      if (idTokenStr === "unverified-google-token") {
        return json(400, { error: { code: "BAD_REQUEST", message: "google email not verified" } });
      }
      if (idTokenStr === "banned-google-token") {
        return json(403, { error: { code: "USER_BANNED", message: "user is banned" } });
      }
      let email = "demo@quizlet.local";
      let fullName = "Demo Student";
      let isNew = false;
      const parts = idTokenStr.split(":");
      if (parts[0] === "google-valid" && parts.length >= 2 && parts[1]) {
        email = String(parts[1]).toLowerCase();
        if (parts.length >= 3 && parts[2]) fullName = parts[2];
      }
      let matched: MockUser | null = null;
      for (const u of this.users.values()) {
        if (u.email.toLowerCase() === email) { matched = u; break; }
      }
      if (matched && matched.is_banned) {
        return json(403, { error: { code: "USER_BANNED", message: "user is banned" } });
      }
      if (!matched) {
        isNew = true;
        const username = email.split("@")[0];
        matched = {
          id: `usr_google_${Date.now()}`,
          email,
          password_hash: `google-oauth:${email}`,
          full_name: fullName,
          username,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          created_at: new Date().toISOString(),
          stats: { total_study_sets: 0, cards_mastered: 0, current_streak: 1 },
        };
        this.users.set(matched.id, matched);
      }
      const accessToken = this.generateToken(matched.id);
      const refreshToken = this.generateRefreshToken(matched.id);
      return json(200, {
        user: {
          id: matched.id,
          email: matched.email,
          full_name: matched.full_name,
          username: matched.username,
          avatar_url: matched.avatar_url,
          created_at: matched.created_at,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: 3600,
        is_new_user: isNew,
      });
    }

    if (path === "/api/v1/auth/signout" && normalizedMethod === "POST") {
      const authHeader = headers["authorization"] || headers["Authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        this.revokedTokens.add(token);
      }
      return json(200, { success: true, message: "Successfully signed out" });
    }

    // ----------------------------------------------------
    // USER PROFILE (/api/v1/user/profile)
    // ----------------------------------------------------
    if (path === "/api/v1/user/profile" && normalizedMethod === "GET") {
      const user = this.extractBearerUser(headers);
      if (!user) {
        return json(401, { error: "Unauthorized: Invalid or missing token" });
      }

      return json(200, {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        stats: user.stats,
      });
    }

    // ----------------------------------------------------
    // STUDY SETS (/api/v1/quizlet/study-sets)
    // ----------------------------------------------------
    if (path === "/api/v1/quizlet/study-sets" && normalizedMethod === "GET") {
      const searchQuery = (params.get("search") || "").toLowerCase();
      const filter = params.get("filter") || "all";
      const user = this.extractBearerUser(headers);

      let sets = Array.from(this.studySets.values());

      if (searchQuery) {
        sets = sets.filter(
          (s) =>
            s.title.toLowerCase().includes(searchQuery) ||
            s.description.toLowerCase().includes(searchQuery)
        );
      }

      if (filter === "mine" && user) {
        sets = sets.filter((s) => s.creator_id === user.id);
      } else if (filter === "starred") {
        sets = sets.filter((s) => s.is_starred);
      } else if (filter === "recent") {
        sets.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      }

      return json(200, {
        items: sets.map((s) => ({
          ...s,
          card_count: s.cards.length,
        })),
        total: sets.length,
      });
    }

    if (path === "/api/v1/quizlet/study-sets" && normalizedMethod === "POST") {
      const user = this.extractBearerUser(headers);
      if (!user) {
        return json(401, { error: "Unauthorized: Login required to create study sets" });
      }

      const { title, description, visibility, cards } = body || {};
      if (!title || typeof title !== "string" || !title.trim()) {
        return json(400, { error: "Title is required and cannot be empty" });
      }

      const cardsArray: MockFlashcard[] = [];
      const setId = `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      if (Array.isArray(cards)) {
        if (cards.length === 0) {
          return json(400, { error: "At least one card is required to create a study set" });
        }

        cards.forEach((c: any, idx: number) => {
          cardsArray.push({
            id: `card_${setId}_${idx + 1}`,
            study_set_id: setId,
            front_content: c.front_content || "",
            back_content: c.back_content || "",
            position: idx,
            hint: c.hint,
            explanation: c.explanation,
            state: "not_studied",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }

      const newSet: MockStudySet = {
        id: setId,
        title: title.trim(),
        description: description || "",
        visibility: visibility === "private" ? "private" : "public",
        creator_id: user.id,
        creator_name: user.full_name,
        is_starred: false,
        card_count: cardsArray.length,
        cards: cardsArray,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.studySets.set(newSet.id, newSet);
      user.stats.total_study_sets++;

      return json(201, newSet);
    }

    // Detail, Duplicate, Update, Delete Study Set
    const setDetailMatch = path.match(/^\/api\/v1\/quizlet\/study-sets\/([^/]+)$/);
    if (setDetailMatch) {
      const setId = setDetailMatch[1];
      const set = this.studySets.get(setId);

      if (normalizedMethod === "GET") {
        if (!set) return json(404, { error: `Study set '${setId}' not found` });
        return json(200, {
          ...set,
          card_count: set.cards.length,
        });
      }

      if (normalizedMethod === "PUT") {
        const user = this.extractBearerUser(headers);
        if (!user) return json(401, { error: "Unauthorized" });
        if (!set) return json(404, { error: `Study set '${setId}' not found` });

        const { title, description, visibility, is_starred } = body || {};
        if (title !== undefined) {
          if (!title.trim()) return json(400, { error: "Title cannot be empty" });
          set.title = title.trim();
        }
        if (description !== undefined) set.description = description;
        if (visibility !== undefined) set.visibility = visibility;
        if (is_starred !== undefined) set.is_starred = Boolean(is_starred);
        set.updated_at = new Date().toISOString();

        return json(200, set);
      }

      if (normalizedMethod === "DELETE") {
        const user = this.extractBearerUser(headers);
        if (!user) return json(401, { error: "Unauthorized" });
        if (!set) return json(404, { error: `Study set '${setId}' not found` });

        this.studySets.delete(setId);
        if (user.stats.total_study_sets > 0) user.stats.total_study_sets--;
        return json(200, { success: true, message: `Set ${setId} deleted` });
      }
    }

    // Duplicate Set
    const duplicateMatch = path.match(/^\/api\/v1\/quizlet\/study-sets\/([^/]+)\/duplicate$/);
    if (duplicateMatch && normalizedMethod === "POST") {
      const user = this.extractBearerUser(headers);
      if (!user) return json(401, { error: "Unauthorized" });

      const sourceId = duplicateMatch[1];
      const source = this.studySets.get(sourceId);
      if (!source) return json(404, { error: `Study set '${sourceId}' not found` });

      const newId = `set_dup_${Date.now()}`;
      const duplicatedCards: MockFlashcard[] = source.cards.map((c, i) => ({
        ...c,
        id: `card_${newId}_${i + 1}`,
        study_set_id: newId,
        state: "not_studied",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const dupSet: MockStudySet = {
        id: newId,
        title: `${source.title} (Copy)`,
        description: source.description,
        visibility: source.visibility,
        creator_id: user.id,
        creator_name: user.full_name,
        is_starred: false,
        card_count: duplicatedCards.length,
        cards: duplicatedCards,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.studySets.set(newId, dupSet);
      user.stats.total_study_sets++;
      return json(201, dupSet);
    }

    // ----------------------------------------------------
    // CARDS CRUD & BULK IMPORT (/cards, /import)
    // ----------------------------------------------------
    const addCardMatch = path.match(/^\/api\/v1\/quizlet\/study-sets\/([^/]+)\/cards$/);
    if (addCardMatch && normalizedMethod === "POST") {
      const setId = addCardMatch[1];
      const set = this.studySets.get(setId);
      if (!set) return json(404, { error: `Study set '${setId}' not found` });

      const { front_content, back_content, hint, explanation } = body || {};
      if (!front_content || !back_content) {
        return json(400, { error: "Both front_content and back_content are required" });
      }

      const card: MockFlashcard = {
        id: `card_${setId}_${set.cards.length + 1}_${Date.now()}`,
        study_set_id: setId,
        front_content,
        back_content,
        position: set.cards.length,
        hint,
        explanation,
        state: "not_studied",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set.cards.push(card);
      set.card_count = set.cards.length;
      set.updated_at = new Date().toISOString();

      return json(201, card);
    }

    const deleteCardMatch = path.match(/^\/api\/v1\/quizlet\/cards\/([^/]+)$/);
    if (deleteCardMatch && normalizedMethod === "DELETE") {
      const cardId = deleteCardMatch[1];
      let deleted = false;

      for (const set of this.studySets.values()) {
        const idx = set.cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          set.cards.splice(idx, 1);
          set.card_count = set.cards.length;
          set.updated_at = new Date().toISOString();
          deleted = true;
          break;
        }
      }

      if (!deleted) return json(404, { error: `Card '${cardId}' not found` });
      return json(200, { success: true });
    }

    const reorderCardsMatch = path === "/api/v1/quizlet/cards/reorder";
    if (reorderCardsMatch && normalizedMethod === "PUT") {
      const { study_set_id, card_order } = body || {};
      const set = this.studySets.get(study_set_id);
      if (!set) return json(404, { error: `Study set '${study_set_id}' not found` });
      if (!Array.isArray(card_order)) {
        return json(400, { error: "card_order must be an array of card IDs" });
      }

      const cardMap = new Map(set.cards.map((c) => [c.id, c]));
      const newCards: MockFlashcard[] = [];

      card_order.forEach((id: string, idx: number) => {
        const c = cardMap.get(id);
        if (c) {
          c.position = idx;
          newCards.push(c);
        }
      });

      set.cards = newCards;
      set.updated_at = new Date().toISOString();
      return json(200, { success: true, cards: set.cards });
    }

    // Bulk Import endpoint
    const importMatch = path.match(/^\/api\/v1\/quizlet\/study-sets\/([^/]+)\/import$/);
    if (importMatch && normalizedMethod === "POST") {
      const setId = importMatch[1];
      const set = this.studySets.get(setId);
      if (!set) return json(404, { error: `Study set '${setId}' not found` });

      const { raw_text, term_delimiter = "\t", card_delimiter = "\n", cards } = body || {};
      const importedCards: MockFlashcard[] = [];

      if (Array.isArray(cards)) {
        for (const c of cards) {
          if (c.front_content && c.back_content) {
            importedCards.push({
              id: `card_${setId}_imp_${importedCards.length + 1}_${Date.now()}`,
              study_set_id: setId,
              front_content: c.front_content.trim(),
              back_content: c.back_content.trim(),
              position: set.cards.length + importedCards.length,
              state: "not_studied",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      } else if (typeof raw_text === "string") {
        const lines = raw_text.split(card_delimiter);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // skip trailing and blank lines

          const parts = line.split(term_delimiter);
          if (parts.length >= 2) {
            const front = parts[0].trim();
            const back = parts.slice(1).join(term_delimiter).trim();
            if (front && back) {
              importedCards.push({
                id: `card_${setId}_imp_${importedCards.length + 1}_${Date.now()}`,
                study_set_id: setId,
                front_content: front,
                back_content: back,
                position: set.cards.length + importedCards.length,
                state: "not_studied",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      }

      set.cards.push(...importedCards);
      set.card_count = set.cards.length;
      set.updated_at = new Date().toISOString();

      return json(200, {
        success: true,
        imported_count: importedCards.length,
        cards: importedCards,
      });
    }

    // ----------------------------------------------------
    // SESSIONS & ADAPTIVE LEARN MODE (/sessions)
    // ----------------------------------------------------
    const startSessionMatch = path.match(/^\/api\/v1\/quizlet\/study-sets\/([^/]+)\/sessions$/);
    if (startSessionMatch && normalizedMethod === "POST") {
      const setId = startSessionMatch[1];
      const set = this.studySets.get(setId);
      if (!set) return json(404, { error: `Study set '${setId}' not found` });
      if (set.cards.length === 0) {
        return json(400, { error: "Cannot start a session on an empty study set" });
      }

      const { mode = "learn", direction = "term_first", chunk_size = 0, chunk_index = 0 } = body || {};
      const user = this.extractBearerUser(headers);

      // Học theo chặng nhỏ: chuẩn hóa 8/12/15, 0 = tự động (kho >12 từ thì dùng 12).
      const normalizeChunk = (v: number) => {
        if (!v || v <= 0) return set.cards.length > 12 ? 12 : 0;
        if (v === 8 || v === 12 || v === 15) return v;
        if (v < 8) return 8;
        if (v <= 10) return 8;
        if (v <= 13) return 12;
        return 15;
      };
      const effChunk = normalizeChunk(Number(chunk_size) || 0);
      let totalChunks = 0;
      let activeChunk = 0;
      let cardIds = set.cards.map((c) => c.id);
      let totalCards = set.cards.length;
      if (effChunk > 0) {
        totalChunks = Math.ceil(set.cards.length / effChunk);
        activeChunk = Math.max(0, Math.min(Number(chunk_index) || 0, totalChunks - 1));
        const start = activeChunk * effChunk;
        cardIds = set.cards.slice(start, start + effChunk).map((c) => c.id);
        totalCards = totalChunks <= 1 ? cardIds.length : cardIds.length * 2 + Math.floor(cardIds.length * 0.5);
      }

      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const session: MockStudySession = {
        id: sessionId,
        study_set_id: setId,
        user_id: user ? user.id : "usr_guest",
        mode,
        direction,
        status: "in_progress",
        total_cards: totalCards,
        current_index: 0,
        card_ids: cardIds,
        correct_count: 0,
        incorrect_count: 0,
        created_at: new Date().toISOString(),
        chunk_size: effChunk,
        active_chunk: activeChunk,
        total_chunks: totalChunks,
      };

      this.sessions.set(sessionId, session);

      return json(201, {
        session_id: sessionId,
        study_set_id: setId,
        mode: session.mode,
        status: session.status,
        total_cards: session.total_cards,
        current_index: session.current_index,
        chunk_size: effChunk,
        active_chunk: activeChunk,
        total_chunks: totalChunks,
      });
    }

    const nextQuestionMatch = path.match(/^\/api\/v1\/quizlet\/sessions\/([^/]+)\/next$/);
    if (nextQuestionMatch && normalizedMethod === "GET") {
      const sessionId = nextQuestionMatch[1];
      const session = this.sessions.get(sessionId);
      if (!session) return json(404, { error: `Session '${sessionId}' not found` });

      if (session.current_index >= session.card_ids.length) {
        session.status = "completed";
        const total = session.correct_count + session.incorrect_count;
        const accuracy = total > 0 ? Math.round((session.correct_count / total) * 100) : 100;

        return json(200, {
          is_completed: true,
          summary: {
            session_id: session.id,
            total_reviewed: total,
            correct_count: session.correct_count,
            incorrect_count: session.incorrect_count,
            accuracy_percentage: accuracy,
            mastered_count: session.correct_count,
          },
        });
      }

      const cardId = session.card_ids[session.current_index];
      const set = this.studySets.get(session.study_set_id);
      const card = set?.cards.find((c) => c.id === cardId);

      if (!card) return json(404, { error: "Card not found in set" });

      const qIndex = session.current_index;
      // Cycle question types: MCQ, True/False, Written, Recall
      const types: QuestionType[] = ["mcq", "true_false", "written", "recall"];
      const qType = types[qIndex % types.length];
      const qId = `q_${sessionId}_${qIndex}`;

      let question: MockAdaptiveQuestion;

      if (qType === "mcq") {
        // Collect distractors from other cards
        const otherCards = set!.cards.filter((c) => c.id !== card.id);
        const distractors = otherCards.slice(0, 3).map((c) => c.back_content);
        const options = [card.back_content, ...distractors];
        // simple shuffle
        options.sort(() => 0.5 - Math.random());
        const correctIndex = options.indexOf(card.back_content);

        question = {
          question_id: qId,
          session_id: sessionId,
          card_id: card.id,
          question_type: "mcq",
          prompt: card.front_content,
          options,
          correct_index: correctIndex,
          expected_answer: card.back_content,
          card_index: qIndex,
          total_cards: session.total_cards,
        };
      } else if (qType === "true_false") {
        const isTrue = qIndex % 2 === 0;
        const proposed = isTrue
          ? card.back_content
          : (set!.cards.find((c) => c.id !== card.id)?.back_content || "Alternative definition");

        question = {
          question_id: qId,
          session_id: sessionId,
          card_id: card.id,
          question_type: "true_false",
          prompt: card.front_content,
          proposed_definition: proposed,
          is_true: isTrue,
          expected_answer: isTrue ? "True" : "False",
          card_index: qIndex,
          total_cards: session.total_cards,
        };
      } else if (qType === "written") {
        question = {
          question_id: qId,
          session_id: sessionId,
          card_id: card.id,
          question_type: "written",
          prompt: card.front_content,
          expected_answer: card.back_content,
          card_index: qIndex,
          total_cards: session.total_cards,
        };
      } else {
        // recall
        question = {
          question_id: qId,
          session_id: sessionId,
          card_id: card.id,
          question_type: "recall",
          prompt: card.front_content,
          expected_answer: card.back_content,
          card_index: qIndex,
          total_cards: session.total_cards,
        };
      }

      // Học theo chặng: gắn metadata cụm để FE hiển thị tiến độ + badge ôn cũ.
      const hasChunk = (session.chunk_size || 0) > 0;
      const chunkPos = hasChunk ? session.current_index % 10 : -1;
      const isReviewCard = hasChunk && (chunkPos === 2 || chunkPos === 5 || chunkPos === 8);
      const chunkGatePassed =
        hasChunk && session.current_index > 0 && session.current_index % (session.card_ids.length || 1) === 0;

      // Trạng thái từng thẻ trong cụm + tiến độ kiến thức toàn set.
      let chunkCards: MockAdaptiveQuestion["chunk_cards"];
      let knowledgeProgress = 0;
      let chunkMasteredCount = 0;
      if (hasChunk && set) {
        const chunkSize = session.chunk_size || 12;
        const chunkIdx = session.active_chunk ?? 0;
        const start = chunkIdx * chunkSize;
        const chunkCardList = set.cards.slice(start, start + chunkSize);
        const answeredIds = new Set(session.answered_card_ids ?? []);
        chunkCards = chunkCardList.map((c) => {
          const answered = answeredIds.has(c.id);
          return {
            flashcard_id: c.id,
            mastery_score: answered ? 60 : 0,
            // 1=NEW 2=LEARNING 3=FAMILIAR 4=REVIEWING 5=MASTERED
            state: answered ? 3 : 1,
            failed_in_session: false,
            answered_correct: answered,
          };
        });
        chunkMasteredCount = chunkCards.filter((c) => c.answered_correct).length;
        // Tiến độ kiến thức: số thẻ đã học trong toàn bộ set.
        const learnedAll = set.cards.filter((c) => answeredIds.has(c.id)).length;
        knowledgeProgress =
          set.cards.length > 0 ? Math.round((learnedAll / set.cards.length) * 1000) / 10 : 0;
      }

      const withChunk: MockAdaptiveQuestion = {
        ...question,
        active_chunk: session.active_chunk ?? 0,
        total_chunks: session.total_chunks ?? 0,
        chunk_size: session.chunk_size ?? 0,
        is_review_card: isReviewCard,
        chunk_gate_passed: chunkGatePassed,
        chunk_cards: chunkCards,
        knowledge_progress: knowledgeProgress,
        chunk_mastered_count: chunkMasteredCount,
      };

      this.activeQuestions.set(qId, withChunk);
      return json(200, withChunk);
    }

    const submitAnswerMatch = path.match(/^\/api\/v1\/quizlet\/sessions\/([^/]+)\/submit$/);
    if (submitAnswerMatch && normalizedMethod === "POST") {
      const sessionId = submitAnswerMatch[1];
      const session = this.sessions.get(sessionId);
      if (!session) return json(404, { error: `Session '${sessionId}' not found` });

      const { question_id, answer } = body || {};
      const question = this.activeQuestions.get(question_id);
      if (!question) {
        return json(400, { error: `Question '${question_id}' not found or already answered` });
      }

      let isCorrect = false;
      const set = this.studySets.get(session.study_set_id);
      const card = set?.cards.find((c) => c.id === question.card_id);

      if (question.question_type === "mcq") {
        if (typeof answer === "number") {
          isCorrect = answer === question.correct_index;
        } else if (typeof answer === "string") {
          isCorrect = answer.trim().toLowerCase() === (card?.back_content || "").trim().toLowerCase();
        }
      } else if (question.question_type === "true_false") {
        isCorrect = Boolean(answer) === Boolean(question.is_true);
      } else if (question.question_type === "written") {
        const normAns = String(answer || "").trim().toLowerCase();
        const normExp = String(question.expected_answer || "").trim().toLowerCase();
        isCorrect = normAns === normExp;
      } else {
        // recall self-evaluation
        isCorrect = answer === true || answer === "correct";
      }

      if (isCorrect) {
        session.correct_count++;
        if (card) card.state = "mastered";
        if (card) {
          session.answered_card_ids = session.answered_card_ids || [];
          if (!session.answered_card_ids.includes(card.id)) {
            session.answered_card_ids.push(card.id);
          }
        }
      } else {
        session.incorrect_count++;
        if (card) card.state = "learning";
      }

      session.current_index++;
      this.activeQuestions.delete(question_id);

      const isCompleted = session.current_index >= session.total_cards;
      if (isCompleted) {
        session.status = "completed";
      }

      return json(200, {
        is_correct: isCorrect,
        correct_answer: card?.back_content || "",
        explanation: card?.explanation || undefined,
        mastery_score_before: isCorrect ? 50 : 70,
        mastery_score_after: isCorrect ? 85 : 40,
        is_session_completed: isCompleted,
      });
    }

    const ratingsMatch = path.match(/^\/api\/v1\/quizlet\/sessions\/([^/]+)\/ratings$/);
    if (ratingsMatch && normalizedMethod === "POST") {
      const sessionId = ratingsMatch[1];
      const session = this.sessions.get(sessionId);
      if (!session) return json(404, { error: `Session '${sessionId}' not found` });

      const { card_id, rating } = body || {};
      const validRatings = ["repeat", "hard", "okay", "easy"];
      if (!validRatings.includes(rating)) {
        return json(400, { error: `Invalid rating. Expected one of: ${validRatings.join(", ")}` });
      }

      const set = this.studySets.get(session.study_set_id);
      const card = set?.cards.find((c) => c.id === card_id);

      let intervalStr = "1 day";
      let intervalDays = 1;
      let easeFactor = card?.ease_factor || 2.5;

      switch (rating) {
        case "repeat":
          intervalStr = "3 minutes";
          intervalDays = 3 / 1440;
          easeFactor = Math.max(1.3, easeFactor - 0.2);
          if (card) card.state = "learning";
          break;
        case "hard":
          intervalStr = "10 minutes";
          intervalDays = 10 / 1440;
          easeFactor = Math.max(1.3, easeFactor - 0.15);
          if (card) card.state = "learning";
          break;
        case "okay":
          intervalStr = "1 day";
          intervalDays = 1;
          if (card) card.state = "reviewing";
          break;
        case "easy":
          intervalStr = "4 days";
          intervalDays = 4;
          easeFactor = easeFactor + 0.15;
          if (card) card.state = "mastered";
          break;
      }

      if (card) {
        card.interval_days = intervalDays;
        card.ease_factor = easeFactor;
        const nextDate = new Date(Date.now() + intervalDays * 24 * 3600 * 1000);
        card.next_review_at = nextDate.toISOString();
      }

      return json(200, {
        card_id,
        rating,
        next_review_interval: intervalStr,
        interval_days: intervalDays,
        ease_factor: easeFactor,
      });
    }

    const completeSessionMatch = path.match(/^\/api\/v1\/quizlet\/sessions\/([^/]+)\/complete$/);
    if (completeSessionMatch && normalizedMethod === "POST") {
      const sessionId = completeSessionMatch[1];
      const session = this.sessions.get(sessionId);
      if (!session) return json(404, { error: `Session '${sessionId}' not found` });

      session.status = "completed";
      const total = session.correct_count + session.incorrect_count;
      const accuracy = total > 0 ? Math.round((session.correct_count / total) * 100) : 100;

      return json(200, {
        session_id: sessionId,
        total_cards: session.total_cards,
        correct_count: session.correct_count,
        incorrect_count: session.incorrect_count,
        accuracy_percentage: accuracy,
        mastered_count: session.correct_count,
      });
    }

    // ----------------------------------------------------
    // REVIEWS & PROGRESS TRACKING
    // Gateway contract: GET /api/v1/quizlet/users/me/progress ->
    // OverallProgressSummary (total_cards, not_studied_count,
    // learning_count, familiar_count, reviewing_count, mastered_count,
    // due_reviews_count, accuracy_rate, average_mastery).
    // Legacy aliases (/api/v1/progress, /api/v1/quizlet/users/me/reviews)
    // are kept so old clients/tests keep working.
    // ----------------------------------------------------
    if (
      (path === "/api/v1/progress" ||
        path === "/api/v1/quizlet/users/me/progress" ||
        path === "/api/v1/quizlet/users/me/reviews") &&
      normalizedMethod === "GET"
    ) {
      // Calculate global or user progress across all sets
      let totalCards = 0;
      let notStudied = 0;
      let learning = 0;
      let reviewing = 0;
      let familiar = 0;
      let mastered = 0;

      for (const set of this.studySets.values()) {
        for (const card of set.cards) {
          totalCards++;
          switch (card.state) {
            case "mastered":
              mastered++;
              break;
            case "reviewing":
              reviewing++;
              break;
            case "learning":
              learning++;
              break;
            default:
              notStudied++;
              break;
          }
        }
      }

      const dueReviewsCount = reviewing + learning;

      return json(200, {
        total_cards: totalCards,
        // New OverallProgressSummary *_count contract
        not_studied_count: notStudied,
        learning_count: learning,
        familiar_count: familiar,
        reviewing_count: reviewing,
        mastered_count: mastered,
        due_reviews_count: dueReviewsCount,
        accuracy_rate: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
        average_mastery: 0,
        // Legacy short aliases for backward compatibility
        not_studied: notStudied,
        learning: learning,
        reviewing: reviewing,
        mastered: mastered,
      });
    }

    // Per-set progress reset: POST /api/v1/quizlet/study-sets/:id/progress/reset
    const setProgressResetMatch = path.match(
      /^\/api\/v1\/quizlet\/study-sets\/([^/]+)\/progress\/reset$/
    );
    if (setProgressResetMatch && normalizedMethod === "POST") {
      const setId = setProgressResetMatch[1];
      const set = this.studySets.get(setId);
      if (!set) return json(404, { error: `Study set '${setId}' not found` });
      set.cards.forEach((c) => {
        c.state = "not_studied";
        delete c.next_review_at;
      });
      return json(200, { success: true, message: "Progress reset successfully" });
    }

    if (
      (path === "/api/v1/progress/reset" ||
        path === "/api/v1/quizlet/users/me/progress/reset") &&
      normalizedMethod === "POST"
    ) {
      const { study_set_id } = body || {};

      if (study_set_id) {
        const set = this.studySets.get(study_set_id);
        if (set) {
          set.cards.forEach((c) => {
            c.state = "not_studied";
            delete c.next_review_at;
          });
        }
      } else {
        for (const set of this.studySets.values()) {
          set.cards.forEach((c) => {
            c.state = "not_studied";
            delete c.next_review_at;
          });
        }
      }

      return json(200, { success: true, message: "Progress reset successfully" });
    }

    // Default 404 handler
    return json(404, { error: `Endpoint not found: ${normalizedMethod} ${path}` });
  }

  // ==========================================
  // Fetch Mock Interceptor
  // ==========================================

  public installFetchMock(): void {
    if (this.originalFetch) return; // already installed
    this.originalFetch = globalThis.fetch;

    globalThis.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      let urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || "GET").toUpperCase();

      // Check if URL targets our mock API Gateway (/api/v1 or http://localhost:8080/api/v1)
      if (urlStr.includes("/api/v1")) {
        let reqHeaders: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((val, key) => {
              reqHeaders[key] = val;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([k, v]) => {
              reqHeaders[k] = v;
            });
          } else {
            reqHeaders = { ...(init.headers as Record<string, string>) };
          }
        }

        let bodyData = null;
        if (init?.body) {
          try {
            bodyData = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
          } catch {
            bodyData = init.body;
          }
        }

        const res = await this.handle(method, urlStr, bodyData, reqHeaders);

        return new Response(JSON.stringify(res.data), {
          status: res.status,
          headers: res.headers,
        });
      }

      // Fallback to real fetch for non-API requests (if any)
      if (this.originalFetch) {
        return this.originalFetch(input, init);
      }
      throw new Error(`Unhandled fetch request: ${urlStr}`);
    };
  }

  public uninstallFetchMock(): void {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }
}

export const mockServer = new MockApiGatewayServer();
