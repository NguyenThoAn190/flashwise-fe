/**
 * Tier 3: Cross-Feature Combinations
 *
 * Verifies multi-stage user workflows across subsystem boundaries:
 * 1. Flow A: Auth Signup -> Create Study Set -> Flip Cards & Advance Deck -> Check Mastery Progress
 * 2. Flow B: Login -> Import Cards via TSV/CSV -> Start Adaptive Learn Mode -> Submit Answers -> SRS Spaced Repetition Ratings -> Verify Progress
 * 3. Flow C: Edit & Reorder Cards -> Study Session Sync -> Progress Reset
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockServer } from "./mockServer";
import { createE2EClient } from "./testHelpers";

describe("Tier 3 - Cross-Feature Combinations", () => {
  let client: ReturnType<typeof createE2EClient>;

  beforeEach(() => {
    mockServer.reset();
    mockServer.installFetchMock();
    client = createE2EClient();
  });

  afterEach(() => {
    mockServer.uninstallFetchMock();
  });

  it("3.1 [Combination Flow A]: Signup -> Create Study Set -> Flashcard Deck Navigation -> Progress Verification", async () => {
    // 1. Sign up new student
    const signupRes = await client.auth.signup({
      email: "flow_a_student@quizlet.local",
      password: "SafePassword2026!",
      full_name: "Flow A Student",
      username: "flow_a_student",
    });
    expect(signupRes.status).toBe(201);
    const token = signupRes.data.access_token;
    client.setToken(token);

    // 2. Create study set with 3 cards
    const createSetRes = await client.studySets.create({
      title: "Biology 101 - Cell Structures",
      description: "Organelles and cell membrane dynamics",
      visibility: "public",
      cards: [
        { front_content: "Ribosome", back_content: "Site of protein synthesis" },
        { front_content: "Golgi Apparatus", back_content: "Packages and modifies proteins" },
        { front_content: "Lysosome", back_content: "Digestive organelle breaking down waste" },
      ],
    });
    expect(createSetRes.status).toBe(201);
    const setId = createSetRes.data.id;
    expect(createSetRes.data.card_count).toBe(3);

    // 3. Fetch set detail to verify cards initialized
    const detailRes = await client.studySets.get(setId);
    expect(detailRes.status).toBe(200);
    expect(detailRes.data.cards.length).toBe(3);

    // 4. Start flashcard session and step through deck
    const sessionRes = await client.sessions.start(setId, { mode: "flashcards" });
    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.data.session_id;

    // Simulate stepping through cards
    for (let i = 0; i < 3; i++) {
      const q = await client.sessions.next(sessionId);
      expect(q.status).toBe(200);
      expect(q.data.card_index).toBe(i);

      let answer: any = true;
      if (q.data.question_type === "mcq") {
        answer = q.data.correct_index;
      } else if (q.data.question_type === "true_false") {
        answer = q.data.is_true;
      } else if (q.data.question_type === "written") {
        answer = q.data.expected_answer;
      }

      // Submit review answer
      const submitRes = await client.sessions.submit(sessionId, {
        question_id: q.data.question_id,
        answer,
      });
      expect(submitRes.status).toBe(200);
      expect(submitRes.data.is_correct).toBe(true);
    }

    // 5. Verify progress reflects mastered cards
    const progressRes = await client.progress.get();
    expect(progressRes.status).toBe(200);
    expect(progressRes.data.mastered).toBeGreaterThanOrEqual(3);
  });

  it("3.2 [Combination Flow B]: Login -> Bulk Import TSV Cards -> Adaptive Learn Mode -> Answers & SRS Ratings", async () => {
    // 1. Log in demo user
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    expect(loginRes.status).toBe(200);
    client.setToken(loginRes.data.access_token);

    // 2. Create an empty target study set with 1 placeholder card
    const setRes = await client.studySets.create({
      title: "Medical Terminology Basics",
      description: "Prefixes, roots, and suffixes",
      cards: [{ front_content: "Cardio-", back_content: "Relating to the heart" }],
    });
    const setId = setRes.data.id;

    // 3. Bulk import TSV data
    const rawTSV = [
      "Neuro-\tRelating to nerves or the nervous system",
      "Gastro-\tRelating to the stomach",
      "Osteo-\tRelating to bones",
    ].join("\n");

    const importRes = await client.cards.import(setId, {
      raw_text: rawTSV,
      term_delimiter: "\t",
      card_delimiter: "\n",
    });
    expect(importRes.status).toBe(200);
    expect(importRes.data.imported_count).toBe(3);

    // Verify study set has 1 original + 3 imported = 4 cards
    const updatedSet = await client.studySets.get(setId);
    expect(updatedSet.data.card_count).toBe(4);

    // 4. Start Learn Mode session
    const learnRes = await client.sessions.start(setId, { mode: "learn" });
    expect(learnRes.status).toBe(201);
    const sessionId = learnRes.data.session_id;

    // Question 1 (MCQ)
    const q1 = await client.sessions.next(sessionId);
    const ans1 = await client.sessions.submit(sessionId, {
      question_id: q1.data.question_id,
      answer: q1.data.correct_index,
    });
    expect(ans1.data.is_correct).toBe(true);

    // Submit Spaced Repetition Rating for Card 1 (Easy -> 4 days)
    const srs1 = await client.sessions.rate(sessionId, {
      card_id: q1.data.card_id,
      rating: "easy",
    });
    expect(srs1.status).toBe(200);
    expect(srs1.data.next_review_interval).toBe("4 days");

    // Question 2 (True/False)
    const q2 = await client.sessions.next(sessionId);
    const ans2 = await client.sessions.submit(sessionId, {
      question_id: q2.data.question_id,
      answer: q2.data.is_true,
    });
    expect(ans2.data.is_correct).toBe(true);

    // Submit SRS Rating for Card 2 (Hard -> 10 minutes)
    const srs2 = await client.sessions.rate(sessionId, {
      card_id: q2.data.card_id,
      rating: "hard",
    });
    expect(srs2.status).toBe(200);
    expect(srs2.data.next_review_interval).toBe("10 minutes");

    // 5. Check progress shows reviews due
    const progressRes = await client.progress.get();
    expect(progressRes.status).toBe(200);
    expect(progressRes.data.due_reviews_count).toBeGreaterThan(0);
  });

  it("3.3 [Combination Flow C]: Card Reordering -> Session Sync -> Progress Reset", async () => {
    // 1. Authenticate
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    client.setToken(loginRes.data.access_token);

    // 2. Reorder cards in Web Dev set
    const setBefore = await client.studySets.get("set_web_dev");
    const originalOrder = setBefore.data.cards.map((c: any) => c.id);
    const reversedOrder = [...originalOrder].reverse();

    const reorderRes = await client.cards.reorder("set_web_dev", reversedOrder);
    expect(reorderRes.status).toBe(200);
    expect(reorderRes.data.cards[0].id).toBe(reversedOrder[0]);

    // 3. Start session with reordered deck and verify first card matches new position 0
    const sessRes = await client.sessions.start("set_web_dev");
    const firstQ = await client.sessions.next(sessRes.data.session_id);
    expect(firstQ.data.card_id).toBe(reversedOrder[0]);

    // 4. Reset progress for the set
    const resetRes = await client.progress.reset("set_web_dev");
    expect(resetRes.status).toBe(200);
    expect(resetRes.data.success).toBe(true);

    // Verify all cards in set are reset to not_studied
    const setAfter = await client.studySets.get("set_web_dev");
    for (const card of setAfter.data.cards) {
      expect(card.state).toBe("not_studied");
    }
  });
});
