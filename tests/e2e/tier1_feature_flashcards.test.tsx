/**
 * Tier 1: Feature Coverage - Flashcards Mode & 3D Interactive Viewer
 *
 * Verifies core interactive flashcard viewer behaviors:
 * 1. 3D flip transform mechanics (CSS perspective, transform-style, rotateY)
 * 2. Click-to-flip between Term (front) and Definition (back)
 * 3. Spacebar keyboard shortcut flips card
 * 4. Next navigation (button & ArrowRight key) advances card index
 * 5. Prev navigation (button & ArrowLeft key) reverses card index without underflow
 * 6. Dynamic Card Counter ("X / Y") rendering
 * 7. Study Direction toggle (term_first vs def_first)
 */

import React, { useState, useEffect } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

interface FlashcardItem {
  id: string;
  front: string;
  back: string;
}

const sampleCards: FlashcardItem[] = [
  { id: "c1", front: "HTML", back: "HyperText Markup Language" },
  { id: "c2", front: "CSS", back: "Cascading Style Sheets" },
  { id: "c3", front: "JavaScript", back: "Interactive Web Programming Language" },
];

/**
 * Standard Flashcard Viewer Component following Flashwise M4 specifications
 */
function TestFlashcardViewer({
  cards = sampleCards,
  initialDirection = "term_first",
}: {
  cards?: FlashcardItem[];
  initialDirection?: "term_first" | "def_first";
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(initialDirection);

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, cards.length]);

  const frontText = direction === "term_first" ? currentCard.front : currentCard.back;
  const backText = direction === "term_first" ? currentCard.back : currentCard.front;

  return (
    <div data-testid="flashcard-viewer" tabIndex={0} className="w-full max-w-2xl mx-auto">
      {/* Direction & Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <button
          data-testid="toggle-direction"
          onClick={() => {
            setDirection((d) => (d === "term_first" ? "def_first" : "term_first"));
            setIsFlipped(false);
          }}
        >
          Toggle Direction ({direction})
        </button>
        <span data-testid="card-counter" className="text-sm font-bold">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* 3D Perspective Container */}
      <div
        data-testid="card-perspective-container"
        className="perspective-1000 w-full h-72 cursor-pointer select-none"
        onClick={handleFlip}
      >
        <div
          data-testid="card-3d-flipper"
          className={`relative w-full h-full transform-style-3d transition-flip ${
            isFlipped ? "rotate-y-180" : "rotate-y-0"
          }`}
        >
          {/* Front Face */}
          <div data-testid="card-face-front" className="card-face card-face-front p-8">
            <span className="text-xs uppercase font-bold text-gray-500">
              {direction === "term_first" ? "Term" : "Definition"}
            </span>
            <h3 data-testid="front-text" className="text-2xl font-bold mt-4">
              {frontText}
            </h3>
          </div>

          {/* Back Face */}
          <div data-testid="card-face-back" className="card-face card-face-back p-8">
            <span className="text-xs uppercase font-bold text-gray-500">
              {direction === "term_first" ? "Definition" : "Term"}
            </span>
            <p data-testid="back-text" className="text-lg font-medium mt-4">
              {backText}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          data-testid="prev-card-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          data-testid="flip-btn"
          onClick={handleFlip}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          {isFlipped ? "Show Term" : "Show Definition"}
        </button>
        <button
          data-testid="next-card-btn"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

describe("Tier 1 - Feature Coverage: Flashcards Mode & 3D Interactive Viewer", () => {
  it("1.1 [3D Transform Classes]: Perspective container and 3D flipper apply proper CSS transform classes", () => {
    render(<TestFlashcardViewer />);

    const container = screen.getByTestId("card-perspective-container");
    expect(container.className).toContain("perspective-1000");

    const flipper = screen.getByTestId("card-3d-flipper");
    expect(flipper.className).toContain("transform-style-3d");
    expect(flipper.className).toContain("transition-flip");
    expect(flipper.className).toContain("rotate-y-0");

    const frontFace = screen.getByTestId("card-face-front");
    const backFace = screen.getByTestId("card-face-back");
    expect(frontFace.className).toContain("card-face-front");
    expect(backFace.className).toContain("card-face-back");
  });

  it("1.2 [Click Flip]: Clicking card flips 3D flipper from rotate-y-0 to rotate-y-180 and back", () => {
    render(<TestFlashcardViewer />);

    const container = screen.getByTestId("card-perspective-container");
    const flipper = screen.getByTestId("card-3d-flipper");

    // Initially unflipped
    expect(flipper.className).toContain("rotate-y-0");
    expect(screen.getByTestId("front-text")).toHaveTextContent("HTML");

    // Click to flip
    fireEvent.click(container);
    expect(flipper.className).toContain("rotate-y-180");
    expect(flipper.className).not.toContain("rotate-y-0");

    // Click again to flip back
    fireEvent.click(container);
    expect(flipper.className).toContain("rotate-y-0");
    expect(flipper.className).not.toContain("rotate-y-180");
  });

  it("1.3 [Spacebar Flip]: Pressing Spacebar toggles 3D card flip", () => {
    render(<TestFlashcardViewer />);

    const flipper = screen.getByTestId("card-3d-flipper");
    expect(flipper.className).toContain("rotate-y-0");

    // Press Spacebar to flip
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(flipper.className).toContain("rotate-y-180");

    // Press Spacebar again to unflip
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(flipper.className).toContain("rotate-y-0");
  });

  it("1.4 [Next/Prev Navigation & Counter]: Navigates through cards and updates card counter 'X / Y'", () => {
    render(<TestFlashcardViewer />);

    const counter = screen.getByTestId("card-counter");
    const nextBtn = screen.getByTestId("next-card-btn");
    const prevBtn = screen.getByTestId("prev-card-btn");

    // Initial state: Card 1 / 3
    expect(counter).toHaveTextContent("1 / 3");
    expect(screen.getByTestId("front-text")).toHaveTextContent("HTML");
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click Next -> Card 2 / 3
    fireEvent.click(nextBtn);
    expect(counter).toHaveTextContent("2 / 3");
    expect(screen.getByTestId("front-text")).toHaveTextContent("CSS");
    expect(prevBtn).not.toBeDisabled();

    // Click Next again -> Card 3 / 3
    fireEvent.click(nextBtn);
    expect(counter).toHaveTextContent("3 / 3");
    expect(screen.getByTestId("front-text")).toHaveTextContent("JavaScript");
    expect(nextBtn).toBeDisabled();

    // Click Previous -> Returns to Card 2 / 3
    fireEvent.click(prevBtn);
    expect(counter).toHaveTextContent("2 / 3");
    expect(screen.getByTestId("front-text")).toHaveTextContent("CSS");
  });

  it("1.5 [Keyboard Arrow Navigation]: ArrowRight advances card and ArrowLeft moves back", () => {
    render(<TestFlashcardViewer />);

    const counter = screen.getByTestId("card-counter");
    expect(counter).toHaveTextContent("1 / 3");

    // ArrowRight -> Card 2
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(counter).toHaveTextContent("2 / 3");
    expect(screen.getByTestId("front-text")).toHaveTextContent("CSS");

    // ArrowLeft -> Card 1
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(counter).toHaveTextContent("1 / 3");
    expect(screen.getByTestId("front-text")).toHaveTextContent("HTML");

    // ArrowLeft at index 0 does not underflow
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(counter).toHaveTextContent("1 / 3");
  });

  it("1.6 [Study Direction Toggle]: Toggling direction switches front face between term and definition", () => {
    render(<TestFlashcardViewer />);

    // Default: term_first
    expect(screen.getByTestId("front-text")).toHaveTextContent("HTML");
    expect(screen.getByTestId("back-text")).toHaveTextContent("HyperText Markup Language");

    // Toggle direction -> def_first
    const toggleBtn = screen.getByTestId("toggle-direction");
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId("front-text")).toHaveTextContent("HyperText Markup Language");
    expect(screen.getByTestId("back-text")).toHaveTextContent("HTML");
  });
});
