import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultipleChoiceQuestion } from "@/components/learn/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "@/components/learn/TrueFalseQuestion";
import { FeedbackBanner } from "@/components/learn/FeedbackBanner";

describe("Learn inline wrong-answer highlight (compact bottom bar)", () => {
  it("MCQ: đáp án đúng viền đứt xanh + đáp án sai viền đỏ", () => {
    render(
      <MultipleChoiceQuestion
        prompt="Bacteria"
        options={["Thông tin", "Vi khuẩn (số nhiều)"]}
        disabled
        selectedAnswer="Thông tin"
        correctAnswer="Vi khuẩn (số nhiều)"
        onSelectOption={vi.fn()}
      />
    );
    const wrong = screen.getByTestId("mcq-option-0");
    const right = screen.getByTestId("mcq-option-1");
    expect(wrong).toHaveAttribute("data-wrong");
    expect(right).toHaveAttribute("data-correct");
    expect(right.className).toMatch(/border-dashed/);
  });

  it("True/False: highlight trực tiếp trên nút True/False", () => {
    render(
      <TrueFalseQuestion
        prompt="Bacteria"
        proposedDefinition="Vi khuẩn"
        disabled
        selectedChoice={false}
        correctChoice={true}
        onAnswer={vi.fn()}
      />
    );
    expect(screen.getByTestId("tf-option-true")).toHaveAttribute("data-correct");
    expect(screen.getByTestId("tf-option-false")).toHaveAttribute("data-wrong");
  });

  it("Bar gọn MCQ sai: không còn ô đỏ, chỉ hint + nút Tiếp tục", () => {
    const onContinue = vi.fn();
    render(
      <FeedbackBanner
        result={{
          is_correct: false,
          correct_answer: "Vi khuẩn (số nhiều)",
          mastery_score_before: 70,
          mastery_score_after: 40,
          is_session_completed: false,
        }}
        submittedAnswerText="Thông tin"
        onContinue={onContinue}
        hideAnswerComparison
      />
    );
    expect(screen.getByTestId("feedback-banner")).toBeInTheDocument();
    // Không còn box "Bạn đã chọn" dài dòng
    expect(screen.queryByText(/Bạn đã chọn/)).toBeNull();
    // Hint gọn kiểu thanh bar (test dùng locale en)
    expect(screen.getByTestId("feedback-hint")).toHaveTextContent(
      /press any key/i
    );
    // Đáp án đúng vẫn giữ ẩn cho a11y/test
    expect(screen.getByTestId("feedback-correct-answer")).toHaveTextContent(
      "Vi khuẩn (số nhiều)"
    );
    fireEvent.click(screen.getByTestId("feedback-continue-btn"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("Bar đúng: hint nhấn phím bất kỳ + nút Tiếp tục", () => {
    render(
      <FeedbackBanner
        result={{
          is_correct: true,
          correct_answer: "Vi khuẩn (số nhiều)",
          mastery_score_before: 60,
          mastery_score_after: 85,
          is_session_completed: false,
        }}
        onContinue={vi.fn()}
        hideAnswerComparison
      />
    );
    expect(screen.getByTestId("feedback-hint")).toBeInTheDocument();
    expect(screen.getByTestId("feedback-continue-btn")).toBeInTheDocument();
  });

  it("Written sai: hiện đáp án đúng gọn 1 dòng trong bar, không hộp đỏ", () => {
    render(
      <FeedbackBanner
        result={{
          is_correct: false,
          correct_answer: "Vi khuẩn (số nhiều)",
          mastery_score_before: 70,
          mastery_score_after: 40,
          is_session_completed: false,
        }}
        submittedAnswerText="Thông tin"
        onContinue={vi.fn()}
      />
    );
    expect(screen.getByTestId("feedback-correct-answer")).toHaveTextContent(
      "Vi khuẩn (số nhiều)"
    );
    expect(screen.getByTestId("feedback-hint")).toHaveTextContent(
      /Type the correct answer/i
    );
  });

  it("Nhấn phím bất kỳ (ngoài input) gọi onContinue", () => {
    const onContinue = vi.fn();
    render(
      <FeedbackBanner
        result={{
          is_correct: false,
          correct_answer: "Vi khuẩn (số nhiều)",
          mastery_score_before: 70,
          mastery_score_after: 40,
          is_session_completed: false,
        }}
        onContinue={onContinue}
        hideAnswerComparison
      />
    );
    fireEvent.keyDown(window, { key: "a" });
    expect(onContinue).toHaveBeenCalled();
  });
});
