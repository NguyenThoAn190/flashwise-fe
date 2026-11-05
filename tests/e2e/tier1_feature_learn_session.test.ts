/**
 * Tier 1: Feature Coverage - Learn Session, Adaptive Questions & SRS Ratings
 *
 * Verifies core adaptive learning workflows:
 * 1. Starting a learning session via POST /sessions
 * 2. Fetching & answering Multiple Choice Questions (MCQ)
 * 3. Fetching & answering True / False Questions
 * 4. Fetching & answering Written Answer Questions
 * 5. Submitting Spaced Repetition (SRS) Ratings (Repeat, Hard, Okay, Easy)
 * 6. Session completion & mastery celebration summary
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockServer } from "./mockServer";
import { createE2EClient } from "./testHelpers";

describe("Tier 1 - Feature Coverage: Learn Session & SRS Ratings", () => {
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

  it("1.1 [Start Session]: Initializes an adaptive learn session on a study set", async () => {
    const startRes = await client.sessions.start("set_web_dev", {
      mode: "learn",
      direction: "term_first",
    });

    expect(startRes.status).toBe(201);
    expect(startRes.ok).toBe(true);
    expect(startRes.data.session_id).toMatch(/^sess_/);
    expect(startRes.data.study_set_id).toBe("set_web_dev");
    expect(startRes.data.mode).toBe("learn");
    expect(startRes.data.status).toBe("in_progress");
    expect(startRes.data.total_cards).toBe(4);
    expect(startRes.data.current_index).toBe(0);
  });

  it("1.2 [MCQ Question & Submission]: Fetches Multiple Choice question and evaluates chosen option", async () => {
    const startRes = await client.sessions.start("set_web_dev");
    const sessionId = startRes.data.session_id;

    // First question is MCQ (index 0)
    const qRes = await client.sessions.next(sessionId);
    expect(qRes.status).toBe(200);
    expect(qRes.data.question_type).toBe("mcq");
    expect(qRes.data.prompt).toBe("HTML");
    expect(qRes.data.options).toBeInstanceOf(Array);
    expect(qRes.data.options.length).toBeGreaterThanOrEqual(2);
    expect(typeof qRes.data.correct_index).toBe("number");

    // Submit correct answer index
    const submitRes = await client.sessions.submit(sessionId, {
      question_id: qRes.data.question_id,
      answer: qRes.data.correct_index,
    });

    expect(submitRes.status).toBe(200);
    expect(submitRes.data.is_correct).toBe(true);
    expect(submitRes.data.correct_answer).toContain("Markup Language");
    expect(submitRes.data.mastery_score_after).toBeGreaterThan(submitRes.data.mastery_score_before);
    expect(submitRes.data.is_session_completed).toBe(false);
  });

  it("1.3 [True/False Question]: Fetches True/False question and validates boolean answer", async () => {
    const startRes = await client.sessions.start("set_web_dev");
    const sessionId = startRes.data.session_id;

    // Answer Q0 (MCQ) to advance to Q1 (True/False)
    const q0 = await client.sessions.next(sessionId);
    await client.sessions.submit(sessionId, {
      question_id: q0.data.question_id,
      answer: q0.data.correct_index,
    });

    // Q1 is True/False
    const q1 = await client.sessions.next(sessionId);
    expect(q1.status).toBe(200);
    expect(q1.data.question_type).toBe("true_false");
    expect(q1.data.prompt).toBe("CSS");
    expect(q1.data.proposed_definition).toBeDefined();
    expect(typeof q1.data.is_true).toBe("boolean");

    // Submit correct boolean answer
    const submitRes = await client.sessions.submit(sessionId, {
      question_id: q1.data.question_id,
      answer: q1.data.is_true,
    });

    expect(submitRes.status).toBe(200);
    expect(submitRes.data.is_correct).toBe(true);
  });

  it("1.4 [Written Answer Question]: Evaluates text input for written recall", async () => {
    const startRes = await client.sessions.start("set_web_dev");
    const sessionId = startRes.data.session_id;

    // Advance Q0 and Q1
    const q0 = await client.sessions.next(sessionId);
    await client.sessions.submit(sessionId, { question_id: q0.data.question_id, answer: q0.data.correct_index });
    const q1 = await client.sessions.next(sessionId);
    await client.sessions.submit(sessionId, { question_id: q1.data.question_id, answer: q1.data.is_true });

    // Q2 is Written
    const q2 = await client.sessions.next(sessionId);
    expect(q2.status).toBe(200);
    expect(q2.data.question_type).toBe("written");
    expect(q2.data.prompt).toBe("JavaScript");

    // Submit expected answer (with whitespace test)
    const expected = q2.data.expected_answer;
    const submitRes = await client.sessions.submit(sessionId, {
      question_id: q2.data.question_id,
      answer: `  ${expected}  `, // trimmed internally
    });

    expect(submitRes.status).toBe(200);
    expect(submitRes.data.is_correct).toBe(true);
  });

  it("1.5 [SRS Spaced Repetition Ratings]: Updates next review intervals and ease factors for ratings", async () => {
    const startRes = await client.sessions.start("set_web_dev");
    const sessionId = startRes.data.session_id;

    // 1. Repeat rating (3 min interval)
    const repeatRes = await client.sessions.rate(sessionId, {
      card_id: "card_wd_1",
      rating: "repeat",
    });
    expect(repeatRes.status).toBe(200);
    expect(repeatRes.data.next_review_interval).toBe("3 minutes");
    expect(repeatRes.data.interval_days).toBeLessThan(0.01);

    // 2. Hard rating (10 min interval)
    const hardRes = await client.sessions.rate(sessionId, {
      card_id: "card_wd_2",
      rating: "hard",
    });
    expect(hardRes.status).toBe(200);
    expect(hardRes.data.next_review_interval).toBe("10 minutes");

    // 3. Okay rating (1 day interval)
    const okayRes = await client.sessions.rate(sessionId, {
      card_id: "card_wd_3",
      rating: "okay",
    });
    expect(okayRes.status).toBe(200);
    expect(okayRes.data.next_review_interval).toBe("1 day");
    expect(okayRes.data.interval_days).toBe(1);

    // 4. Easy rating (4 days interval)
    const easyRes = await client.sessions.rate(sessionId, {
      card_id: "card_wd_4",
      rating: "easy",
    });
    expect(easyRes.status).toBe(200);
    expect(easyRes.data.next_review_interval).toBe("4 days");
    expect(easyRes.data.interval_days).toBe(4);
    expect(easyRes.data.ease_factor).toBeGreaterThan(2.5);
  });

  it("1.6 [Session Completion & Summary]: Progresses through all cards and receives completion summary", async () => {
    // Spanish 101 has 3 cards
    const startRes = await client.sessions.start("set_spanish_101");
    const sessionId = startRes.data.session_id;

    // Card 1
    const q0 = await client.sessions.next(sessionId);
    await client.sessions.submit(sessionId, { question_id: q0.data.question_id, answer: q0.data.correct_index });

    // Card 2
    const q1 = await client.sessions.next(sessionId);
    await client.sessions.submit(sessionId, { question_id: q1.data.question_id, answer: q1.data.is_true });

    // Card 3
    const q2 = await client.sessions.next(sessionId);
    const lastSubmit = await client.sessions.submit(sessionId, {
      question_id: q2.data.question_id,
      answer: q2.data.expected_answer,
    });
    expect(lastSubmit.data.is_session_completed).toBe(true);

    // Fetching next after all answered returns completed summary
    const summaryRes = await client.sessions.next(sessionId);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.data.is_completed).toBe(true);
    expect(summaryRes.data.summary.total_reviewed).toBe(3);
    expect(summaryRes.data.summary.accuracy_percentage).toBe(100);
    expect(summaryRes.data.summary.mastered_count).toBe(3);
  });
});
