import React, { createRef, useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input, type InputSize } from "@/components/ui/Input";

describe("Milestone 1 Iteration 2: Input Icon Padding & Precedence Stress Tests", () => {
  /* ==========================================================================
     1. Padding Precedence Across All Input Sizes (sm, md, lg)
     ========================================================================== */
  describe("Padding Precedence Across All Input Sizes", () => {
    const sizes: Array<{ size: InputSize; py: string; text: string; rounded: string }> = [
      { size: "sm", py: "py-1.5", text: "text-xs", rounded: "rounded-lg" },
      { size: "md", py: "py-2.5", text: "text-sm", rounded: "rounded-xl" },
      { size: "lg", py: "py-3.5", text: "text-base", rounded: "rounded-xl" },
    ];

    sizes.forEach(({ size, py, text, rounded }) => {
      it(`size='${size}': startIcon preserves pl-10 alongside vertical padding ${py}`, () => {
        render(
          <Input
            inputSize={size}
            placeholder={`test-${size}-start`}
            startIcon={<span data-testid="start-icon">Icon</span>}
          />
        );

        const el = screen.getByPlaceholderText(`test-${size}-start`);
        expect(el).toHaveClass("pl-10");
        expect(el).not.toHaveClass("pr-10");
        expect(el).toHaveClass(py);
        expect(el).toHaveClass(text);
        expect(el).toHaveClass(rounded);
      });

      it(`size='${size}': endIcon preserves pr-10 alongside vertical padding ${py}`, () => {
        render(
          <Input
            inputSize={size}
            placeholder={`test-${size}-end`}
            endIcon={<span data-testid="end-icon">Icon</span>}
          />
        );

        const el = screen.getByPlaceholderText(`test-${size}-end`);
        expect(el).toHaveClass("pr-10");
        expect(el).not.toHaveClass("pl-10");
        expect(el).toHaveClass(py);
        expect(el).toHaveClass(text);
        expect(el).toHaveClass(rounded);
      });

      it(`size='${size}': both startIcon and endIcon preserve both pl-10 and pr-10`, () => {
        render(
          <Input
            inputSize={size}
            placeholder={`test-${size}-both`}
            startIcon={<span data-testid="start-icon">S</span>}
            endIcon={<span data-testid="end-icon">E</span>}
          />
        );

        const el = screen.getByPlaceholderText(`test-${size}-both`);
        expect(el).toHaveClass("pl-10");
        expect(el).toHaveClass("pr-10");
        expect(el).toHaveClass(py);
        expect(el).toHaveClass(text);
        expect(el).toHaveClass(rounded);
      });
    });
  });

  /* ==========================================================================
     2. Custom ClassName Overrides & Conflict Resolution
     ========================================================================== */
  describe("Custom ClassName Overrides & Precedence", () => {
    it("allows caller className='pl-16' to override startIcon default pl-10", () => {
      render(
        <Input
          placeholder="custom-left-pad"
          startIcon={<span data-testid="wide-icon">Wide</span>}
          className="pl-16"
        />
      );

      const el = screen.getByPlaceholderText("custom-left-pad");
      expect(el).toHaveClass("pl-16");
      expect(el).not.toHaveClass("pl-10");
    });

    it("allows caller className='pr-16' to override endIcon default pr-10", () => {
      render(
        <Input
          placeholder="custom-right-pad"
          endIcon={<span data-testid="wide-end">Wide</span>}
          className="pr-16"
        />
      );

      const el = screen.getByPlaceholderText("custom-right-pad");
      expect(el).toHaveClass("pr-16");
      expect(el).not.toHaveClass("pr-10");
    });

    it("allows caller className='px-8' to override both startIcon and endIcon paddings", () => {
      render(
        <Input
          placeholder="custom-px"
          startIcon={<span>S</span>}
          endIcon={<span>E</span>}
          className="px-8"
        />
      );

      const el = screen.getByPlaceholderText("custom-px");
      expect(el).toHaveClass("px-8");
      expect(el).not.toHaveClass("pl-10");
      expect(el).not.toHaveClass("pr-10");
    });

    it("allows caller to override border color and focus rings", () => {
      render(
        <Input
          placeholder="custom-border"
          className="border-purple-500 focus:border-purple-600 focus:ring-purple-200"
        />
      );

      const el = screen.getByPlaceholderText("custom-border");
      expect(el).toHaveClass("border-purple-500");
      expect(el).not.toHaveClass("border-quizlet-border");
    });
  });

  /* ==========================================================================
     3. Combined Edge Cases: Both Icons + Disabled + Error States
     ========================================================================== */
  describe("Combined Edge Cases (Icons + Error + Disabled + Helper)", () => {
    it("handles input with startIcon, endIcon, error, AND disabled simultaneously", () => {
      render(
        <Input
          id="complex-state-input"
          label="Complex Field"
          placeholder="Complex state"
          startIcon={<span data-testid="s-icon">S</span>}
          endIcon={<span data-testid="e-icon">E</span>}
          disabled={true}
          error="This field is permanently disabled and invalid"
          helperText="Ignored because error takes precedence"
        />
      );

      const el = screen.getByPlaceholderText("Complex state");
      expect(el).toBeDisabled();
      expect(el).toHaveAttribute("aria-invalid", "true");
      expect(el).toHaveAttribute("aria-describedby", "complex-state-input-error");
      expect(el).toHaveClass("pl-10");
      expect(el).toHaveClass("pr-10");
      expect(el).toHaveClass("border-quizlet-coral");
      expect(el).toHaveClass("disabled:bg-quizlet-canvas");

      // Error message is rendered with role="alert"
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("This field is permanently disabled and invalid");
      expect(alert).toHaveAttribute("id", "complex-state-input-error");

      // HelperText should not be rendered when error is present
      expect(screen.queryByText("Ignored because error takes precedence")).not.toBeInTheDocument();

      // Both icons remain in DOM
      expect(screen.getByTestId("s-icon")).toBeInTheDocument();
      expect(screen.getByTestId("e-icon")).toBeInTheDocument();
    });

    it("handles boolean error=true with both icons without rendering empty alert p tag", () => {
      render(
        <Input
          id="boolean-error-both-icons"
          placeholder="Boolean error"
          startIcon={<span data-testid="s-icon">S</span>}
          endIcon={<span data-testid="e-icon">E</span>}
          error={true}
          helperText="Fallback helper under boolean error"
        />
      );

      const el = screen.getByPlaceholderText("Boolean error");
      expect(el).toHaveAttribute("aria-invalid", "true");
      expect(el).toHaveClass("pl-10");
      expect(el).toHaveClass("pr-10");
      expect(el).toHaveClass("border-quizlet-coral");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      // Helper text is rendered since errorMessage is undefined
      expect(screen.getByText("Fallback helper under boolean error")).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     4. Dynamic Re-rendering & Interactive State Transitions
     ========================================================================== */
  describe("Dynamic Re-rendering Transitions", () => {
    function DynamicInputContainer() {
      const [hasStart, setHasStart] = useState(false);
      const [hasEnd, setHasEnd] = useState(false);
      const [size, setSize] = useState<InputSize>("sm");

      return (
        <div>
          <button onClick={() => setHasStart((prev) => !prev)}>Toggle Start</button>
          <button onClick={() => setHasEnd((prev) => !prev)}>Toggle End</button>
          <button onClick={() => setSize("lg")}>Make Large</button>
          <Input
            placeholder="Dynamic field"
            inputSize={size}
            startIcon={hasStart ? <span data-testid="dyn-start">Start</span> : undefined}
            endIcon={hasEnd ? <span data-testid="dyn-end">End</span> : undefined}
          />
        </div>
      );
    }

    it("dynamically adds and removes pl-10 and pr-10 on state toggle", () => {
      render(<DynamicInputContainer />);
      const input = screen.getByPlaceholderText("Dynamic field");

      // Initially no icons, size sm
      expect(input).not.toHaveClass("pl-10");
      expect(input).not.toHaveClass("pr-10");
      expect(input).toHaveClass("py-1.5");

      // Toggle startIcon
      fireEvent.click(screen.getByText("Toggle Start"));
      expect(input).toHaveClass("pl-10");
      expect(input).not.toHaveClass("pr-10");

      // Toggle endIcon
      fireEvent.click(screen.getByText("Toggle End"));
      expect(input).toHaveClass("pl-10");
      expect(input).toHaveClass("pr-10");

      // Change size to lg
      fireEvent.click(screen.getByText("Make Large"));
      expect(input).toHaveClass("pl-10");
      expect(input).toHaveClass("pr-10");
      expect(input).toHaveClass("py-3.5");
      expect(input).not.toHaveClass("py-1.5");

      // Untoggle startIcon
      fireEvent.click(screen.getByText("Toggle Start"));
      expect(input).not.toHaveClass("pl-10");
      expect(input).toHaveClass("pr-10");
    });
  });

  /* ==========================================================================
     5. Ref Forwarding & User Event Integrity
     ========================================================================== */
  describe("Ref Forwarding & User Event Integrity", () => {
    it("allows programmatic focus and text selection via forwarded ref", () => {
      const ref = createRef<HTMLInputElement>();
      render(
        <Input
          ref={ref}
          placeholder="Ref target"
          startIcon={<span>Icon</span>}
          defaultValue="Initial Value"
        />
      );

      expect(ref.current).not.toBeNull();
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);

      fireEvent.change(ref.current!, { target: { value: "Updated Value" } });
      expect(ref.current?.value).toBe("Updated Value");
    });
  });
});
