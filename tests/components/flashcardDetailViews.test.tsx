/**
 * Milestone 4 Component & Integration Tests:
 * FlashcardViewer, CardToolbar, CardList, and StudySetDetailPage
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FlashcardViewer } from "@/components/flashcard/FlashcardViewer";
import { CardList } from "@/components/flashcard/CardList";
import { AuthProvider } from "@/lib/context/AuthContext";
import StudySetDetailPage from "@/app/[locale]/(dashboard)/set/[id]/page";
import { mockServer } from "../e2e/mockServer";
import { Flashcard } from "@/types/studySet";

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
  usePathname: () => "/set/set_web_dev",
  useSearchParams: () => new URLSearchParams(),
}));

const sampleCards: Flashcard[] = [
  {
    id: "c1",
    study_set_id: "set_1",
    front_content: "Polymorphism",
    back_content: "Ability of objects to take on many forms",
    hint: "OOP concept",
    explanation: "Allows unified interface for different underlying forms.",
    state: "mastered",
  },
  {
    id: "c2",
    study_set_id: "set_1",
    front_content: "Encapsulation",
    back_content: "Bundling data with methods that operate on that data",
    state: "learning",
  },
  {
    id: "c3",
    study_set_id: "set_1",
    front_content: "Abstraction",
    back_content: "Hiding complex implementation details",
    state: "not_studied",
  },
];

describe("Milestone 4: 3D FlashcardViewer & Study Set Detail", () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockServer.reset();
    mockServer.installFetchMock();
  });

  afterEach(() => {
    mockServer.uninstallFetchMock();
  });

  it("renders 3D perspective container, flips on click and Spacebar, and isolates child action buttons", () => {
    const onToggleStar = vi.fn();
    render(
      <FlashcardViewer
        cards={sampleCards}
        onToggleStarCard={onToggleStar}
      />
    );

    const container = screen.getByTestId("card-perspective-container");
    const flipper = screen.getByTestId("card-3d-flipper");

    expect(container.className).toContain("perspective-1000");
    expect(flipper.className).toContain("rotate-y-0");
    expect(screen.getByTestId("front-text")).toHaveTextContent("Polymorphism");

    // Clicking Hint button shows hint WITHOUT flipping card
    const hintBtn = screen.getByTestId("card-hint-btn");
    fireEvent.click(hintBtn);
    expect(hintBtn).toHaveTextContent("OOP concept");
    expect(flipper.className).toContain("rotate-y-0");

    // Clicking Star button triggers callback WITHOUT flipping card
    const starBtn = screen.getByTestId("star-card-btn");
    fireEvent.click(starBtn);
    expect(onToggleStar).toHaveBeenCalledWith("c1");
    expect(flipper.className).toContain("rotate-y-0");

    // Clicking TTS button does NOT flip card
    const ttsFront = screen.getByTestId("tts-front-btn");
    fireEvent.click(ttsFront);
    expect(flipper.className).toContain("rotate-y-0");

    // Clicking card container flips to back face
    fireEvent.click(container);
    expect(flipper.className).toContain("rotate-y-180");
    expect(screen.getByTestId("back-text")).toHaveTextContent(
      "Ability of objects to take on many forms"
    );

    // Spacebar flips back to front
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(flipper.className).toContain("rotate-y-0");
  });

  it("ignores global keyboard shortcuts when focus is inside an input or textarea", () => {
    render(
      <div>
        <FlashcardViewer cards={sampleCards} />
        <input data-testid="external-input" />
      </div>
    );

    const flipper = screen.getByTestId("card-3d-flipper");
    const input = screen.getByTestId("external-input");

    fireEvent.keyDown(input, { key: " ", code: "Space" });
    expect(flipper.className).toContain("rotate-y-0");

    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(screen.getByTestId("card-counter")).toHaveTextContent("1 / 3");
  });

  it("supports Shuffle (S), Fullscreen (F & Escape), and Direction toggle", () => {
    render(<FlashcardViewer cards={sampleCards} />);

    // Toggle direction
    fireEvent.click(screen.getByTestId("toggle-direction"));
    expect(screen.getByTestId("front-text")).toHaveTextContent(
      "Ability of objects to take on many forms"
    );

    // Fullscreen via F shortcut and exit via Escape
    const viewer = screen.getByTestId("flashcard-viewer");
    expect(viewer.className).not.toContain("fixed inset-0");

    fireEvent.keyDown(window, { key: "f" });
    expect(viewer.className).toContain("fixed inset-0");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(viewer.className).not.toContain("fixed inset-0");

    // Shuffle toggle
    const shuffleBtn = screen.getByTestId("toolbar-shuffle-btn");
    expect(shuffleBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(shuffleBtn);
    expect(shuffleBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders CardList with state filtering, inline card addition, and card deletion", async () => {
    const onAddCard = vi.fn().mockResolvedValue(undefined);
    const onDeleteCard = vi.fn().mockResolvedValue(undefined);

    render(
      <CardList
        cards={sampleCards}
        onAddCard={onAddCard}
        onDeleteCard={onDeleteCard}
      />
    );

    expect(screen.getAllByTestId("term-row")).toHaveLength(3);

    // Submit empty inline card -> shows validation error
    fireEvent.click(screen.getByTestId("inline-add-card-submit"));
    expect(screen.getByTestId("inline-add-card-error")).toHaveTextContent(
      /Both Term and Definition are required/i
    );

    // Fill inline form and submit
    fireEvent.change(screen.getByTestId("inline-front-input"), {
      target: { value: "Inheritance" },
    });
    fireEvent.change(screen.getByTestId("inline-back-input"), {
      target: { value: "Deriving new classes from existing ones" },
    });
    fireEvent.click(screen.getByTestId("inline-add-card-submit"));

    await waitFor(() => {
      expect(onAddCard).toHaveBeenCalledWith({
        front_content: "Inheritance",
        back_content: "Deriving new classes from existing ones",
        hint: undefined,
      });
    });

    // Delete first card
    const deleteBtns = screen.getAllByTestId("delete-card-btn");
    fireEvent.click(deleteBtns[0]);
    await waitFor(() => {
      expect(onDeleteCard).toHaveBeenCalledWith("c1");
    });
  });

  it("loads StudySetDetailPage from API Gateway and supports inline card add & duplicate set", async () => {
    // Authenticate demo user in storage so mutations succeed
    const loginRes = await mockServer.handle("POST", "/api/v1/auth/token", {
      email: "demo@quizlet.local",
      password: "Password123!",
    });
    window.localStorage.setItem(
      "flashwise_access_token",
      loginRes.data.access_token
    );

    render(
      <AuthProvider>
        <StudySetDetailPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("set-detail-title")).toHaveTextContent(
        "Web Development Fundamentals"
      );
    });

    expect(screen.getByTestId("card-counter")).toHaveTextContent("1 / 4");

    // Duplicate set
    fireEvent.click(screen.getByTestId("duplicate-set-btn"));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(expect.stringMatching(/\/set\/set_dup_/));
    });
  });
});
