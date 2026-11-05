/**
 * Milestone 5 & 6 E2E Integration and Component Tests:
 * 1. Bulk Import Parser & Delimiter Options
 * 2. Study Set Creator & Editor Forms
 * 3. Adaptive Question Formats (MCQ, True/False, Written, Recall)
 * 4. Spaced Repetition (SRS) Rating Bar
 * 5. Learn Session Progression & Celebration Summary
 * 6. Progress Mastery Breakdown & Reset
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { parseBulkText } from "@/lib/utils/bulkParser";
import { BulkImportModal } from "@/components/editor/BulkImportModal";
import { MultipleChoiceQuestion } from "@/components/learn/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "@/components/learn/TrueFalseQuestion";
import { WrittenQuestion } from "@/components/learn/WrittenQuestion";
import { FlashcardRecallQuestion } from "@/components/learn/FlashcardRecallQuestion";
import { SRSRatingBar } from "@/components/learn/SRSRatingBar";
import { FeedbackBanner } from "@/components/learn/FeedbackBanner";
import { SessionSummary } from "@/components/learn/SessionSummary";
import { AuthProvider } from "@/lib/context/AuthContext";
import LearnSessionPage from "@/app/[locale]/(dashboard)/set/[id]/learn/page";
import ProgressPage from "@/app/[locale]/(dashboard)/progress/page";
import CreateStudySetPage from "@/app/[locale]/(dashboard)/set/create/page";
import { mockServer } from "../e2e/mockServer";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  // `next-intl/navigation` yêu cầu `redirect`/`permanentRedirect` từ module này
  // ngay lúc import, nên mock phải export đủ để không throw.
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({ id: "set_web_dev" }),
  usePathname: () => "/set/set_web_dev/learn",
  useSearchParams: () => new URLSearchParams({ set: "set_web_dev" }),
}));

describe("Milestones 5 & 6: Creator, Bulk Import, Adaptive Learn & Progress", () => {
  beforeEach(async () => {
    pushMock.mockReset();
    mockServer.reset();
    mockServer.installFetchMock();

    const loginRes = await mockServer.handle("POST", "/api/v1/auth/token", {
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    window.localStorage.setItem(
      "flashwise_access_token",
      loginRes.data.access_token
    );
  });

  afterEach(() => {
    mockServer.uninstallFetchMock();
    window.localStorage.clear();
  });

  it("5.1 [Bulk Parser]: parses tab, comma, semicolon and ignores trailing/blank lines", () => {
    const rawTSV = "Hello\tXin chào\nWorld\tThế giới\n\n   \n";
    const tsvRes = parseBulkText(rawTSV, "\t", "\n");
    expect(tsvRes.errors.length).toBe(0);
    expect(tsvRes.cards).toHaveLength(2);
    expect(tsvRes.cards[0]).toEqual({
      front_content: "Hello",
      back_content: "Xin chào",
    });

    const rawCSV = "Apple, Quả táo\nBanana, Quả chuối";
    const csvRes = parseBulkText(rawCSV, ",", "\n");
    expect(csvRes.errors.length).toBe(0);
    expect(csvRes.cards[1]).toEqual({
      front_content: "Banana",
      back_content: "Quả chuối",
    });
  });

  it("5.2 [Bulk Import Modal]: updates live preview, reports line errors, and calls onImport", () => {
    const onImport = vi.fn();
    const { rerender } = render(
      <BulkImportModal open={true} onClose={vi.fn()} onImport={onImport} />
    );

    const textarea = screen.getByTestId("bulk-import-textarea");
    fireEvent.change(textarea, {
      target: { value: "Card 1\tDef 1\nInvalidLineWithoutDelim\nCard 2\tDef 2" },
    });

    expect(screen.getByTestId("bulk-import-errors")).toBeInTheDocument();
    expect(screen.getAllByTestId("bulk-preview-row")).toHaveLength(2);

    // Click submit
    fireEvent.click(screen.getByTestId("bulk-import-submit-btn"));
    expect(onImport).toHaveBeenCalledWith(
      [
        { front_content: "Card 1", back_content: "Def 1" },
        { front_content: "Card 2", back_content: "Def 2" },
      ],
      "Card 1\tDef 1\nInvalidLineWithoutDelim\nCard 2\tDef 2",
      "\t",
      "\n"
    );
  });

  it("5.3 [Set Creator]: saves set with title, description, and valid cards to API Gateway", async () => {
    render(
      <AuthProvider>
        <CreateStudySetPage />
      </AuthProvider>
    );

    // `AuthGuard` chỉ render form sau khi `AuthProvider` khôi phục session
    // (đọc token trong localStorage + gọi profile) — nên phải chờ.
    await waitFor(() => {
      expect(screen.getByTestId("set-title-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("set-title-input"), {
      target: { value: "Fullstack Architecture" },
    });
    fireEvent.change(screen.getByTestId("set-description-input"), {
      target: { value: "Frontend, Backend & Microservices" },
    });

    const termInputs = screen.getAllByTestId("card-term-input");
    const defInputs = screen.getAllByTestId("card-definition-input");

    fireEvent.change(termInputs[0], { target: { value: "Gateway" } });
    fireEvent.change(defInputs[0], {
      target: { value: "Single entry point for client requests" },
    });

    fireEvent.click(screen.getByTestId("save-study-set-btn"));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(expect.stringMatching(/^\/set\/set_/));
    });
  });

  it("6.1 [MCQ UI & 1-4 Hotkeys]: allows selecting options by clicking and keyboard numbers", () => {
    const onSelect = vi.fn();
    render(
      <MultipleChoiceQuestion
        prompt="API Gateway"
        options={["Router & Proxy", "Database Engine", "Compiler"]}
        onSelectOption={onSelect}
      />
    );

    expect(screen.getByTestId("mcq-prompt")).toHaveTextContent("API Gateway");

    // Click option 2
    fireEvent.click(screen.getByTestId("mcq-option-1"));
    expect(onSelect).toHaveBeenCalledWith(1, "Database Engine");

    // Press number 1
    fireEvent.keyDown(window, { key: "1" });
    expect(onSelect).toHaveBeenCalledWith(0, "Router & Proxy");
  });

  it("6.2 [True/False & Hotkeys]: responds to 1 (True) and 2 (False)", () => {
    const onAnswer = vi.fn();
    render(
      <TrueFalseQuestion
        prompt="CSS"
        proposedDefinition="Styling Language"
        onAnswer={onAnswer}
      />
    );

    fireEvent.keyDown(window, { key: "1" });
    expect(onAnswer).toHaveBeenCalledWith(true);

    fireEvent.keyDown(window, { key: "2" });
    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it("6.3 [Written Question]: submits typed answer and handles skip", () => {
    const onSubmit = vi.fn();
    render(
      <WrittenQuestion prompt="React" onSubmitAnswer={onSubmit} />
    );

    const input = screen.getByTestId("written-answer-input");
    fireEvent.change(input, {
      target: { value: "Component-based UI library" },
    });
    fireEvent.click(screen.getByTestId("written-submit-btn"));
    expect(onSubmit).toHaveBeenCalledWith("Component-based UI library");

    fireEvent.click(screen.getByTestId("written-skip-btn"));
    expect(onSubmit).toHaveBeenCalledWith("");
  });

  it("6.4 [Flashcard Recall]: toggles reveal definition and rates self-evaluation", () => {
    const onSelfEvaluate = vi.fn();
    render(
      <FlashcardRecallQuestion
        prompt="Golang"
        expectedAnswer="Compiled, concurrent language by Google"
        onSelfEvaluate={onSelfEvaluate}
      />
    );

    expect(screen.queryByTestId("recall-answer-text")).toBeNull();
    fireEvent.click(screen.getByTestId("recall-show-answer-btn"));
    expect(screen.getByTestId("recall-answer-text")).toHaveTextContent(
      "Compiled, concurrent language by Google"
    );

    fireEvent.click(screen.getByTestId("recall-got-it-btn"));
    expect(onSelfEvaluate).toHaveBeenCalledWith(true);
  });

  it("6.5 [Feedback Banner & SRS Ratings]: renders delta, allows rating, and triggers continue", async () => {
    const onContinue = vi.fn();
    const onRate = vi.fn().mockResolvedValue({
      card_id: "card_1",
      rating: "easy",
      next_review_interval: "4 days",
      interval_days: 4,
      ease_factor: 2.65,
    });

    render(
      <FeedbackBanner
        result={{
          is_correct: true,
          correct_answer: "Correct Definition",
          explanation: "In-depth explanation",
          mastery_score_before: 60,
          mastery_score_after: 85,
          is_session_completed: false,
        }}
        onContinue={onContinue}
      >
        <SRSRatingBar cardId="card_1" onRate={onRate} />
      </FeedbackBanner>
    );

    expect(screen.getByTestId("feedback-status-heading")).toHaveTextContent(
      /Awesome! You got it right!/i
    );
    expect(screen.getByTestId("feedback-mastery-delta")).toHaveTextContent("+25%");

    // Rate card as Easy
    fireEvent.click(screen.getByTestId("srs-rate-easy"));
    await waitFor(() => {
      expect(onRate).toHaveBeenCalledWith("easy");
      expect(screen.getByTestId("srs-rated-feedback")).toHaveTextContent("4 days");
    });

    // Continue
    fireEvent.click(screen.getByTestId("feedback-continue-btn"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("6.6 [Session Summary Screen]: celebrates completion, donut score and restart options", () => {
    const onRestart = vi.fn();
    const onBack = vi.fn();

    render(
      <SessionSummary
        summary={{
          session_id: "sess_1",
          total_reviewed: 10,
          correct_count: 9,
          incorrect_count: 1,
          accuracy_percentage: 90,
          mastered_count: 9,
        }}
        onRestart={onRestart}
        onBackToSet={onBack}
      />
    );

    expect(screen.getByTestId("summary-accuracy")).toHaveTextContent("90%");
    expect(screen.getByTestId("summary-mastered-count")).toHaveTextContent("9");
    expect(screen.getByTestId("summary-total-reviewed")).toHaveTextContent("10");

    fireEvent.click(screen.getByTestId("summary-restart-btn"));
    expect(onRestart).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("summary-back-btn"));
    expect(onBack).toHaveBeenCalled();
  });

  it("6.7 [Adaptive Learn Engine End-to-End]: completes session and displays celebration summary", async () => {
    render(
      <AuthProvider>
        <LearnSessionPage />
      </AuthProvider>
    );

    // Wait for first question (MCQ) to load
    await waitFor(() => {
      expect(screen.getByTestId("mcq-question-card")).toBeInTheDocument();
    });

    // Answer Q0
    fireEvent.click(screen.getByTestId("mcq-option-0"));

    await waitFor(() => {
      expect(screen.getByTestId("feedback-banner")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("feedback-continue-btn"));

    // Next question (True/False)
    await waitFor(() => {
      expect(screen.getByTestId("true-false-question-card")).toBeInTheDocument();
    });
  });

  it("6.8 [Progress & Spaced Repetition Mastery]: shows knowledge distributions", async () => {
    render(
      <AuthProvider>
        <ProgressPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("progress-total-cards")).toBeInTheDocument();
    });

    expect(screen.getByTestId("progress-mastered-count")).toBeInTheDocument();
    expect(screen.getByTestId("progress-due-count")).toBeInTheDocument();

    // Reset affordance was removed from the progress page on purpose.
    expect(screen.queryByTestId("reset-progress-btn")).toBeNull();
    expect(screen.queryByTestId("confirm-reset-progress-btn")).toBeNull();
  });
});

