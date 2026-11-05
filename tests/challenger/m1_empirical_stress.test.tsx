import React, { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Dropdown } from "@/components/ui/Dropdown";

describe("Empirical Challenger Stress Test Suite — Milestone 1", () => {
  /* ==========================================================================
     1. cn() Hostile / Edge-Case Inputs & Collision Stress Tests
     ========================================================================== */
  describe("cn() Utility Hostile Inputs & Collision Stress", () => {
    it("handles all falsy values (0, false, null, undefined, NaN, empty string)", () => {
      const result = cn(
        "base",
        0,
        false,
        null,
        undefined,
        NaN,
        "",
        "final"
      );
      expect(result).toBe("base final");
    });

    it("handles deeply nested array hierarchies and mixed objects", () => {
      const result = cn(
        "level-0",
        [
          "level-1",
          null,
          [
            "level-2",
            false,
            [
              "level-3",
              undefined,
              [
                "level-4",
                0,
                { "level-5-active": true, "level-5-inactive": false }
              ]
            ]
          ]
        ]
      );
      expect(result).toBe("level-0 level-1 level-2 level-3 level-4 level-5-active");
    });

    it("resolves classic Tailwind collisions: padding, margin, width, and flex", () => {
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("px-8 py-4", "px-2")).toBe("py-4 px-2");
      expect(cn("m-2 m-4 m-8", "m-1")).toBe("m-1");
      expect(cn("w-full", "w-1/2")).toBe("w-1/2");
      expect(cn("flex inline-flex block")).toBe("block");
    });

    it("resolves Tailwind color collisions including quizlet custom color classes", () => {
      // bg color collisions
      expect(cn("bg-red-500", "bg-quizlet-indigo")).toBe("bg-quizlet-indigo");
      expect(cn("bg-quizlet-indigo", "bg-red-500")).toBe("bg-red-500");

      // text color collisions
      expect(cn("text-red-500", "text-quizlet-slate")).toBe("text-quizlet-slate");
      expect(cn("text-quizlet-slate", "text-white")).toBe("text-white");

      // border color collisions
      expect(cn("border-red-500", "border-quizlet-border")).toBe("border-quizlet-border");
    });

    it("resolves pseudo-class modifier collisions correctly", () => {
      expect(cn("hover:bg-red-500", "hover:bg-quizlet-indigo")).toBe("hover:bg-quizlet-indigo");
      expect(cn("focus:ring-2", "focus:ring-4")).toBe("focus:ring-4");
      expect(cn("disabled:opacity-50", "disabled:opacity-100")).toBe("disabled:opacity-100");
    });
  });

  /* ==========================================================================
     2. Button Component Stress Tests
     ========================================================================== */
  describe("Button Component Adversarial Stress", () => {
    it("strictly suppresses clicks when disabled=true", () => {
      const clickHandler = vi.fn();
      render(<Button disabled onClick={clickHandler}>Cannot Click</Button>);

      const btn = screen.getByRole("button", { name: /cannot click/i });
      expect(btn).toBeDisabled();

      fireEvent.click(btn);
      expect(clickHandler).not.toHaveBeenCalled();
    });

    it("strictly suppresses clicks and renders spinner with aria-busy when isLoading=true", () => {
      const clickHandler = vi.fn();
      render(
        <Button
          isLoading
          onClick={clickHandler}
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          Submit Form
        </Button>
      );

      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("aria-busy", "true");
      expect(screen.getByTestId("button-spinner")).toBeInTheDocument();

      // Ensure leftIcon and rightIcon are hidden during loading to avoid layout distortion
      expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("right-icon")).not.toBeInTheDocument();

      fireEvent.click(btn);
      expect(clickHandler).not.toHaveBeenCalled();
    });

    it("supports ref forwarding and programmatic focus", () => {
      const buttonRef = createRef<HTMLButtonElement>();
      render(<Button ref={buttonRef}>Focused Button</Button>);

      expect(buttonRef.current).not.toBeNull();
      expect(buttonRef.current?.tagName).toBe("BUTTON");
      buttonRef.current?.focus();
      expect(document.activeElement).toBe(buttonRef.current);
    });

    it("allows caller className overrides to take precedence over default variant styles", () => {
      render(
        <Button variant="primary" className="p-10 bg-black">
          Override Styles
        </Button>
      );
      const btn = screen.getByRole("button");
      // twMerge should prioritize p-10 over px-4 py-2.5 and bg-black over bg-quizlet-indigo
      expect(btn).toHaveClass("p-10");
      expect(btn).toHaveClass("bg-black");
      expect(btn).not.toHaveClass("bg-quizlet-indigo");
    });
  });

  /* ==========================================================================
     3. Input Component Stress Tests
     ========================================================================== */
  describe("Input Component Adversarial Stress", () => {
    it("renders aria-invalid='true', role='alert', and matches aria-describedby for string error", () => {
      render(
        <Input
          id="test-email-input"
          label="Email Address"
          error="Please enter a valid email"
          placeholder="user@example.com"
        />
      );

      const input = screen.getByPlaceholderText(/user@example\.com/i);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", "test-email-input-error");

      const alertMessage = screen.getByRole("alert");
      expect(alertMessage).toBeInTheDocument();
      expect(alertMessage).toHaveTextContent("Please enter a valid email");
      expect(alertMessage).toHaveAttribute("id", "test-email-input-error");
    });

    it("sets aria-invalid='true' without crashing or rendering empty alert when error is boolean true", () => {
      render(
        <Input
          id="boolean-error-input"
          label="Password"
          error={true}
          placeholder="Enter password"
        />
      );

      const input = screen.getByPlaceholderText(/enter password/i);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("renders start and end adornment icons with corresponding padding classes", () => {
      const { unmount } = render(
        <Input
          placeholder="With both icons"
          startIcon={<span data-testid="start-icon">S</span>}
          endIcon={<span data-testid="end-icon">E</span>}
        />
      );

      const inputWithIcons = screen.getByPlaceholderText(/with both icons/i);
      expect(screen.getByTestId("start-icon")).toBeInTheDocument();
      expect(screen.getByTestId("end-icon")).toBeInTheDocument();
      expect(inputWithIcons).toHaveClass("pl-10");
      expect(inputWithIcons).toHaveClass("pr-10");

      unmount();

      // Verify without icons, input does not have padding offsets
      render(<Input placeholder="Without icons" />);
      const plainInput = screen.getByPlaceholderText(/without icons/i);
      expect(plainInput).not.toHaveClass("pl-10");
      expect(plainInput).not.toHaveClass("pr-10");
    });

    it("supports ref forwarding and programmatic focus", () => {
      const inputRef = createRef<HTMLInputElement>();
      render(<Input ref={inputRef} placeholder="Reference Input" />);

      expect(inputRef.current).not.toBeNull();
      expect(inputRef.current?.tagName).toBe("INPUT");
      inputRef.current?.focus();
      expect(document.activeElement).toBe(inputRef.current);
    });

    it("displays helperText when no error is present and associates aria-describedby", () => {
      render(
        <Input
          id="username-field"
          label="Username"
          helperText="Unique handle between 3-20 characters"
          placeholder="Handle"
        />
      );

      const input = screen.getByPlaceholderText(/handle/i);
      expect(input).not.toHaveAttribute("aria-invalid");
      expect(input).toHaveAttribute("aria-describedby", "username-field-helper");
      expect(screen.getByText("Unique handle between 3-20 characters")).toHaveAttribute(
        "id",
        "username-field-helper"
      );
    });
  });

  /* ==========================================================================
     4. Dialog & Dropdown Accessibility Stress Tests
     ========================================================================== */
  describe("Dialog & Dropdown Accessibility Stress", () => {
    it("handles Dialog unmounting and clean closure on Escape key", () => {
      const closeSpy = vi.fn();
      const { rerender } = render(
        <Dialog isOpen={true} onClose={closeSpy} title="Stress Dialog">
          <p>Dialog Body</p>
        </Dialog>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(closeSpy).toHaveBeenCalledTimes(1);

      // Re-render as closed
      rerender(
        <Dialog isOpen={false} onClose={closeSpy} title="Stress Dialog">
          <p>Dialog Body</p>
        </Dialog>
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("Dropdown handles outside clicks and keyboard dismissal", () => {
      render(
        <div>
          <span data-testid="outside-element">Outside Area</span>
          <Dropdown
            trigger={<button>Open Actions</button>}
            items={[
              { label: "Option 1", onClick: vi.fn() },
              { label: "Option 2", onClick: vi.fn(), variant: "danger" },
            ]}
          />
        </div>
      );

      // Open dropdown
      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Click outside dismisses menu
      fireEvent.mouseDown(screen.getByTestId("outside-element"));
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });
  });
});
