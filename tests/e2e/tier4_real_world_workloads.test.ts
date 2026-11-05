/**
 * Tier 4: Real-World Application Workloads
 *
 * Verifies end-to-end simulated production user workloads:
 * 1. Complete End-to-End Student Learning Cycle:
 *    Account Registration -> Course Study Set Creation -> TSV Bulk Import ->
 *    Adaptive Learn Session with mixed correct/incorrect responses ->
 *    Instant feedback sheet evaluation -> SRS ratings ->
 *    Mastery Celebration Summary & Progress Verification.
 * 2. Multi-Set Academic Organization:
 *    Managing multiple study sets, starring favorites, searching, and filter verification.
 * 3. High-Volume Bulk Import & Pagination Stress:
 *    Bulk importing 25 vocabulary cards with position ordering and retrieval verification.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockServer } from "./mockServer";
import { createE2EClient } from "./testHelpers";

describe("Tier 4 - Real-World Application Workloads", () => {
  let client: ReturnType<typeof createE2EClient>;

  beforeEach(() => {
    mockServer.reset();
    mockServer.installFetchMock();
    client = createE2EClient();
  });

  afterEach(() => {
    mockServer.uninstallFetchMock();
  });

  it("4.1 [Full Academic Learning Workflow]: Complete lifecycle from registration to SRS mastery", async () => {
    // Stage 1: Student Registration & Authentication
    const signupRes = await client.auth.signup({
      email: "neuro_student@university.edu",
      password: "NeuroPass2026!",
      full_name: "Alex Vance",
      username: "alex_vance",
    });
    expect(signupRes.status).toBe(201);
    client.setToken(signupRes.data.access_token);

    // Verify initial profile state
    const profileRes = await client.auth.profile();
    expect(profileRes.data.full_name).toBe("Alex Vance");
    expect(profileRes.data.stats.total_study_sets).toBe(0);

    // Stage 2: Create Course Study Set
    const createRes = await client.studySets.create({
      title: "Neuroscience 201: Action Potentials",
      description: "Membrane biophysics, ion channels, and neurotransmission",
      visibility: "public",
      cards: [
        {
          front_content: "Resting Membrane Potential",
          back_content: "Typically -70 mV maintained by Na+/K+ ATPase pump.",
        },
      ],
    });
    expect(createRes.status).toBe(201);
    const setId = createRes.data.id;

    // Stage 3: Bulk Import 4 additional lecture terms via TSV
    const lectureTSV = [
      "Depolarization\tMembrane potential becomes more positive due to Na+ influx",
      "Repolarization\tMembrane potential returns to negative due to K+ efflux",
      "Hyperpolarization\tMembrane potential becomes more negative than resting potential",
      "Refractory Period\tTime during which an excitable cell cannot fire another AP",
    ].join("\n");

    const importRes = await client.cards.import(setId, {
      raw_text: lectureTSV,
      term_delimiter: "\t",
      card_delimiter: "\n",
    });
    expect(importRes.status).toBe(200);
    expect(importRes.data.imported_count).toBe(4);

    // Verify total deck count is 5
    const setDetail = await client.studySets.get(setId);
    expect(setDetail.data.card_count).toBe(5);

    // Stage 4: Start Adaptive Learn Session
    const sessionRes = await client.sessions.start(setId, { mode: "learn" });
    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.data.session_id;

    // Process all 5 questions
    // Card 1: MCQ (Correct)
    const q1 = await client.sessions.next(sessionId);
    const sub1 = await client.sessions.submit(sessionId, {
      question_id: q1.data.question_id,
      answer: q1.data.correct_index,
    });
    expect(sub1.data.is_correct).toBe(true);

    // Card 2: True/False (Intentional Incorrect response to test learning penalty)
    const q2 = await client.sessions.next(sessionId);
    const sub2 = await client.sessions.submit(sessionId, {
      question_id: q2.data.question_id,
      answer: !q2.data.is_true, // wrong answer
    });
    expect(sub2.data.is_correct).toBe(false);
    expect(sub2.data.correct_answer).toBeDefined();

    // Rate Card 2 as "repeat"
    const srs2 = await client.sessions.rate(sessionId, {
      card_id: q2.data.card_id,
      rating: "repeat",
    });
    expect(srs2.data.next_review_interval).toBe("3 minutes");

    // Card 3: Written (Correct)
    const q3 = await client.sessions.next(sessionId);
    const sub3 = await client.sessions.submit(sessionId, {
      question_id: q3.data.question_id,
      answer: q3.data.expected_answer,
    });
    expect(sub3.data.is_correct).toBe(true);

    // Rate Card 3 as "easy"
    const srs3 = await client.sessions.rate(sessionId, {
      card_id: q3.data.card_id,
      rating: "easy",
    });
    expect(srs3.data.next_review_interval).toBe("4 days");

    // Card 4: Recall (Correct)
    const q4 = await client.sessions.next(sessionId);
    const sub4 = await client.sessions.submit(sessionId, {
      question_id: q4.data.question_id,
      answer: true,
    });
    expect(sub4.data.is_correct).toBe(true);

    // Card 5: MCQ (Correct, Final card)
    const q5 = await client.sessions.next(sessionId);
    const sub5 = await client.sessions.submit(sessionId, {
      question_id: q5.data.question_id,
      answer: q5.data.correct_index,
    });
    expect(sub5.data.is_correct).toBe(true);
    expect(sub5.data.is_session_completed).toBe(true);

    // Stage 5: Celebration Summary Verification
    const summaryRes = await client.sessions.next(sessionId);
    expect(summaryRes.data.is_completed).toBe(true);
    expect(summaryRes.data.summary.total_reviewed).toBe(5);
    expect(summaryRes.data.summary.correct_count).toBe(4);
    expect(summaryRes.data.summary.incorrect_count).toBe(1);
    expect(summaryRes.data.summary.accuracy_percentage).toBe(80);

    // Stage 6: Verify User Progress & Due Reviews
    const progressRes = await client.progress.get();
    expect(progressRes.status).toBe(200);
    expect(progressRes.data.mastered).toBeGreaterThanOrEqual(1);
    expect(progressRes.data.learning).toBeGreaterThanOrEqual(1);
  });

  it("4.2 [Multi-Set Organization & Favorites Workload]: Manages multiple decks with search and filtering", async () => {
    // 1. Authenticate
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    client.setToken(loginRes.data.access_token);

    // 2. Create Deck A (Japanese N5)
    const setA = await client.studySets.create({
      title: "Japanese N5 Essential Kanji",
      description: "Basic Kanji characters and pronunciations",
      cards: [{ front_content: "日", back_content: "Sun / Day" }],
    });

    // 3. Create Deck B (Python Data Structures)
    const setB = await client.studySets.create({
      title: "Python 3 Advanced Data Structures",
      description: "Collections, deque, and heapq patterns",
      cards: [{ front_content: "deque", back_content: "Double-ended queue with O(1) pops" }],
    });

    // 4. Star Deck A
    await client.studySets.update(setA.data.id, { is_starred: true });

    // 5. Query Starred Sets
    const starredList = await client.studySets.list({ filter: "starred" });
    const starredIds = starredList.data.items.map((s: any) => s.id);
    expect(starredIds).toContain(setA.data.id);
    expect(starredIds).not.toContain(setB.data.id);

    // 6. Search for "Kanji"
    const searchRes = await client.studySets.list({ search: "kanji" });
    expect(searchRes.data.items.length).toBe(1);
    expect(searchRes.data.items[0].id).toBe(setA.data.id);
  });

  it("4.3 [High-Volume 25-Card Workload]: Bulk imports 25 cards with sequential positioning", async () => {
    const loginRes = await client.auth.login({
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    client.setToken(loginRes.data.access_token);

    // Generate 25 TSV pairs
    const pairs: string[] = [];
    for (let i = 1; i <= 25; i++) {
      pairs.push(`Element ${i}\tAtomic number ${i} in periodic table`);
    }
    const tsvContent = pairs.join("\n");

    // Create target set
    const setRes = await client.studySets.create({
      title: "Chemistry: Periodic Elements 1-25",
      cards: [{ front_content: "Placeholder", back_content: "Initial card" }],
    });
    const setId = setRes.data.id;

    // Import 25 cards
    const importRes = await client.cards.import(setId, {
      raw_text: tsvContent,
      term_delimiter: "\t",
      card_delimiter: "\n",
    });
    expect(importRes.status).toBe(200);
    expect(importRes.data.imported_count).toBe(25);

    // Verify set detail maintains all 26 cards in correct order
    const detailRes = await client.studySets.get(setId);
    expect(detailRes.data.card_count).toBe(26);

    const cards = detailRes.data.cards;
    expect(cards[1].front_content).toBe("Element 1");
    expect(cards[25].front_content).toBe("Element 25");
  });
});
